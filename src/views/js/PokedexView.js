import { nextTick } from "vue";
import AppHeader from "../../components/AppHeader.vue";
import FilterSidebar from "../../components/FilterSidebar.vue";
import PokemonModal from "../../components/PokemonModal.vue";
import PokemonResults from "../../components/PokemonResults.vue";
import { GENERATIONS, TYPES } from "../../data/pokedex";
import { getEncounters, getEvolutionChain, getLocation, getLocationArea, getPokemon, getSpecies } from "../../services/pokeApi";
import { cleanText, evolutionNames, formatName, uniqueByName } from "../../utils/pokemon";

export default {
  name: "PokedexView",
  components: {
    AppHeader,
    FilterSidebar,
    PokemonModal,
    PokemonResults,
  },
  data() {
    return {
      generations: GENERATIONS,
      types: TYPES,
      currentGeneration: "1",
      currentFilter: "ver-todos",
      currentSearch: "",
      pokemonList: [],
      loading: false,
      error: "",
      theme: localStorage.getItem("pokedex-theme") || "dark",
      selectedPokemon: null,
      modalLoading: false,
      modalError: "",
      loadRequestId: 0,
      modalRequestId: 0,
      activeMobileFilter: "",
    };
  },
  computed: {
    selectedGeneration() {
      return this.generations.find((generation) => generation.id === this.currentGeneration) || this.generations[0];
    },
    visiblePokemon() {
      const search = this.currentSearch.toLowerCase();

      return this.pokemonList.filter((pokemon) => {
        const matchesType = this.currentFilter === "ver-todos" || pokemon.types.some((type) => type.type.name === this.currentFilter);
        const matchesSearch = !search || pokemon.name.includes(search);

        return matchesType && matchesSearch;
      });
    },
    themeLabel() {
      return `Switch to ${this.theme === "light" ? "dark" : "light"} theme`;
    },
  },
  watch: {
    theme(theme) {
      this.applyTheme(theme);
    },
  },
  mounted() {
    this.applyTheme(this.theme);
    this.loadPokemon();
  },
  methods: {
    applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("pokedex-theme", theme);
    },
    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
    },
    openMobileFilter(panel) {
      this.activeMobileFilter = this.activeMobileFilter === panel ? "" : panel;
    },
    closeMobileFilter() {
      this.activeMobileFilter = "";
    },
    resetModal() {
      this.selectedPokemon = null;
      this.modalLoading = false;
      this.modalError = "";
    },
    selectGeneration(generationId) {
      this.currentGeneration = generationId;
      this.closeMobileFilter();
      this.loadPokemon();
    },
    selectType(typeId) {
      this.currentFilter = typeId;
      this.closeMobileFilter();
    },
    async loadPokemon() {
      const requestId = ++this.loadRequestId;
      const generation = this.selectedGeneration;

      this.loading = true;
      this.error = "";
      this.pokemonList = [];

      try {
        const pokemon = await Promise.all(
          Array.from({ length: generation.end - generation.start + 1 }, (_, index) => getPokemon(generation.start + index)),
        );

        if (requestId !== this.loadRequestId) return;
        this.pokemonList = pokemon;
      } catch (error) {
        if (requestId === this.loadRequestId) {
          this.error = "Pokemon could not be loaded. Try again.";
        }

        console.error(error);
      } finally {
        if (requestId === this.loadRequestId) {
          this.loading = false;
        }
      }
    },
    async openModal(pokemonName) {
      const requestId = ++this.modalRequestId;

      this.selectedPokemon = null;
      this.modalLoading = true;
      this.modalError = "";
      this.$refs.pokemonModal.show();

      try {
        const pokemon = await getPokemon(pokemonName);
        const species = await getSpecies(pokemon.species.url);
        const evolutionData = await getEvolutionChain(species.evolution_chain.url);
        const names = evolutionNames(evolutionData.chain);
        const [evolutions, encounters] = await Promise.all([
          Promise.all(names.map((name) => getPokemon(name))),
          getEncounters(pokemon.location_area_encounters),
        ]);
        const enrichedEncounters = await this.enrichEncounters(encounters);

        if (requestId !== this.modalRequestId) return;

        const description =
          species.flavor_text_entries.find((entry) => entry.language.name === "en") ||
          species.flavor_text_entries.find((entry) => entry.language.name === "es");
        const genus = species.genera.find((item) => item.language.name === "en") || species.genera.find((item) => item.language.name === "es");
        const forms = uniqueByName(pokemon.forms.map((form) => formatName(form.name)));
        const varieties = uniqueByName(species.varieties.map((variety) => formatName(variety.pokemon.name)));

        this.selectedPokemon = {
          pokemon,
          species,
          evolutions,
          enrichedEncounters,
          description: description ? cleanText(description.flavor_text) : "No description available.",
          genus: genus ? genus.genus : "Pokemon",
          abilities: pokemon.abilities.map((ability) => `${formatName(ability.ability.name)}${ability.is_hidden ? " (hidden)" : ""}`),
          heldItems: pokemon.held_items.map((item) => formatName(item.item.name)),
          gameVersions: pokemon.game_indices.map((game) => formatName(game.version.name)),
          eggGroups: species.egg_groups.map((group) => formatName(group.name)),
          formVarieties: uniqueByName([...forms, ...varieties]),
        };

        await nextTick();
      } catch (error) {
        if (requestId === this.modalRequestId) {
          this.modalError = "Details could not be loaded.";
        }

        console.error(error);
      } finally {
        if (requestId === this.modalRequestId) {
          this.modalLoading = false;
        }
      }
    },
    async enrichEncounters(encounters) {
      return Promise.all(
        encounters.map(async (encounter) => {
          const area = await getLocationArea(encounter.location_area.url);
          const location = area.location?.url ? await getLocation(area.location.url) : null;

          return {
            areaName: formatName(area.name),
            locationName: location ? formatName(location.name) : formatName(area.location?.name || area.name),
            regionName: location?.region?.name ? formatName(location.region.name) : "Unknown Region",
          };
        }),
      );
    },
  },
};
