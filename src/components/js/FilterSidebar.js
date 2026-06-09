export default {
  name: "FilterSidebar",
  props: {
    generations: {
      type: Array,
      required: true,
    },
    types: {
      type: Array,
      required: true,
    },
    currentGeneration: {
      type: String,
      required: true,
    },
    currentFilter: {
      type: String,
      required: true,
    },
  },
  emits: ["select-generation", "select-type"],
};
