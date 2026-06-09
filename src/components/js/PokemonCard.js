import { formatName, formatPokemonId, getSprite, pokemonAccent } from "../../utils/pokemon";

export default {
  name: "PokemonCard",
  props: {
    pokemon: {
      type: Object,
      required: true,
    },
  },
  emits: ["open-pokemon"],
  methods: {
    formatName,
    formatPokemonId,
    getSprite,
    pokemonAccent,
  },
};
