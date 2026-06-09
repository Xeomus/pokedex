import { DETAIL_TABS } from "../../data/pokedex";
import { formatName, formatPokemonId, getLocalizedName, getSprite, pokemonAccent, slugify } from "../../utils/pokemon";

export default {
  name: "PokemonModal",
  props: {
    selectedPokemon: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    error: {
      type: String,
      required: true,
    },
  },
  emits: ["hidden", "open-pokemon"],
  data() {
    return {
      detailTabs: DETAIL_TABS,
      activeDetailTab: "about",
      activeMoveTab: "",
      activeLocationTab: "",
      modalInstance: null,
    };
  },
  computed: {
    modalTitle() {
      if (this.loading) return "Loading...";
      if (this.error) return "Error";
      return this.selectedPokemon ? this.formatName(this.selectedPokemon.pokemon.name) : "Pokemon details";
    },
    aboutFields() {
      if (!this.selectedPokemon) return [];
      const { pokemon, species } = this.selectedPokemon;

      return [
        { label: "Species", value: this.getLocalizedName(species.names, species.name), icon: "bi-pin-map" },
        { label: "Height", value: `${pokemon.height / 10} m`, icon: "bi-arrows-vertical" },
        { label: "Weight", value: `${pokemon.weight / 10} kg`, icon: "bi-box-seam" },
        { label: "Experience", value: pokemon.base_experience, icon: "bi-star" },
        { label: "Order", value: pokemon.order, icon: "bi-list-ol" },
      ];
    },
    biologyFields() {
      if (!this.selectedPokemon) return [];
      const { species, eggGroups } = this.selectedPokemon;

      return [
        { label: "Generation", value: this.formatName(species.generation.name), icon: "bi-calendar3" },
        { label: "Color", value: this.formatName(species.color.name), icon: "bi-palette" },
        { label: "Shape", value: this.formatName(species.shape?.name || "n/a"), icon: "bi-gem" },
        { label: "Habitat", value: species.habitat ? this.formatName(species.habitat.name) : "n/a", icon: "bi-tree" },
        { label: "Growth", value: this.formatName(species.growth_rate.name), icon: "bi-graph-up-arrow" },
        { label: "Capture", value: species.capture_rate, icon: "bi-record-circle" },
        { label: "Happiness", value: species.base_happiness, icon: "bi-heart" },
        { label: "Eggs", value: eggGroups.join(", ") || "n/a", icon: "bi-egg" },
        { label: "Hatch", value: `${species.hatch_counter} cycles`, icon: "bi-hourglass-split" },
        { label: "Gender", value: species.gender_rate === -1 ? "Genderless" : `${(species.gender_rate / 8) * 100}% female`, icon: "bi-gender-ambiguous" },
        { label: "Baby", value: species.is_baby ? "Yes" : "No", icon: "bi-person" },
        {
          label: "Evolves from",
          value: species.evolves_from_species ? this.formatName(species.evolves_from_species.name) : "n/a",
          icon: "bi-arrow-up-right-circle",
        },
      ];
    },
    gameFields() {
      if (!this.selectedPokemon) return [];
      const { species } = this.selectedPokemon;

      return [
        { label: "Legendary", value: species.is_legendary ? "Yes" : "No", icon: "bi-stars" },
        { label: "Mythical", value: species.is_mythical ? "Yes" : "No", icon: "bi-shield-check" },
      ];
    },
    moveGroups() {
      if (!this.selectedPokemon) return [];

      const groups = [
        { id: "level", label: "Level", moves: [] },
        { id: "machine", label: "Machines", moves: [] },
        { id: "tutor", label: "Tutor", moves: [] },
        { id: "egg", label: "Egg", moves: [] },
        { id: "other", label: "Other", moves: [] },
      ];

      this.selectedPokemon.pokemon.moves.forEach((move) => {
        groups.find((group) => group.id === this.moveMethod(move)).moves.push(move);
      });

      groups.forEach((group) => {
        group.moves.sort((a, b) => {
          if (group.id === "level") {
            return (this.moveDetails(a)?.level_learned_at || 0) - (this.moveDetails(b)?.level_learned_at || 0);
          }

          return a.move.name.localeCompare(b.move.name);
        });
      });

      return groups.filter((group) => group.moves.length).flatMap((group) => {
        if (group.moves.length <= 24) return [group];
        const chunks = [];

        for (let index = 0; index < group.moves.length; index += 24) {
          chunks.push({
            id: `${group.id}-${chunks.length + 1}`,
            label: `${group.label} ${chunks.length + 1}`,
            moves: group.moves.slice(index, index + 24),
          });
        }

        return chunks;
      });
    },
    locationGroups() {
      if (!this.selectedPokemon) return [];

      const grouped = this.selectedPokemon.enrichedEncounters.reduce((map, encounter) => {
        if (!map.has(encounter.regionName)) {
          map.set(encounter.regionName, []);
        }

        map.get(encounter.regionName).push(encounter);
        return map;
      }, new Map());

      return Array.from(grouped, ([region, items]) => ({
        id: this.slugify(region),
        region,
        items,
      }));
    },
    spriteGallery() {
      if (!this.selectedPokemon) return [];
      const { sprites } = this.selectedPokemon.pokemon;

      return [
        { label: "Front", src: sprites.front_default },
        { label: "Back", src: sprites.back_default },
        { label: "Shiny", src: sprites.front_shiny },
        { label: "Shiny back", src: sprites.back_shiny },
        { label: "Artwork", src: sprites.other["official-artwork"].front_default },
        { label: "Home", src: sprites.other.home.front_default },
      ].filter((sprite) => sprite.src);
    },
  },
  watch: {
    moveGroups(groups) {
      this.activeMoveTab = groups[0]?.id || "";
    },
    locationGroups(groups) {
      this.activeLocationTab = groups[0]?.id || "";
    },
  },
  mounted() {
    this.modalInstance = window.bootstrap.Modal.getOrCreateInstance(this.$refs.pokemonModal);
    this.$refs.pokemonModal.addEventListener("show.bs.modal", this.lockScroll);
    this.$refs.pokemonModal.addEventListener("hidden.bs.modal", this.handleHidden);
  },
  beforeUnmount() {
    this.$refs.pokemonModal.removeEventListener("show.bs.modal", this.lockScroll);
    this.$refs.pokemonModal.removeEventListener("hidden.bs.modal", this.handleHidden);
  },
  methods: {
    show() {
      this.modalInstance.show();
    },
    lockScroll() {
      document.documentElement.classList.add("modal-scroll-lock");
      document.body.classList.add("modal-scroll-lock");
    },
    handleHidden() {
      document.documentElement.classList.remove("modal-scroll-lock");
      document.body.classList.remove("modal-scroll-lock");
      this.activeDetailTab = "about";
      this.$emit("hidden");
    },
    statWidth(value) {
      if (!this.selectedPokemon) return "0%";
      const maxStat = Math.max(...this.selectedPokemon.pokemon.stats.map((stat) => stat.base_stat), 160);
      return `${Math.min(100, Math.round((value / maxStat) * 100))}%`;
    },
    moveDetails(move) {
      return move.version_group_details[0];
    },
    moveMethod(move) {
      const method = this.moveDetails(move)?.move_learn_method.name || "other";
      if (method === "level-up") return "level";
      if (method === "machine") return "machine";
      if (method === "egg") return "egg";
      if (method === "tutor") return "tutor";
      return "other";
    },
    moveLabel(move) {
      const details = this.moveDetails(move);
      const method = details ? this.formatName(details.move_learn_method.name) : "n/a";
      return details?.level_learned_at ? `Lv. ${details.level_learned_at}` : method;
    },
    formatName,
    formatPokemonId,
    getLocalizedName,
    getSprite,
    pokemonAccent,
    slugify,
  },
};
