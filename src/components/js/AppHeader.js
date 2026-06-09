export default {
  name: "AppHeader",
  props: {
    search: {
      type: String,
      required: true,
    },
    theme: {
      type: String,
      required: true,
    },
    themeLabel: {
      type: String,
      required: true,
    },
  },
  emits: ["toggle-theme", "update:search"],
};
