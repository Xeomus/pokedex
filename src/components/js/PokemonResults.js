import PokemonCard from "../PokemonCard.vue";

export default {
  name: "PokemonResults",
  components: {
    PokemonCard,
  },
  props: {
    pokemon: {
      type: Array,
      required: true,
    },
    selectedGeneration: {
      type: Object,
      required: true,
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
  emits: ["open-pokemon"],
};
