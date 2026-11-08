import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Nowaster",
    description: "Start and stop Nowaster sessions and block distracting sites while a session runs.",
    permissions: ["storage", "alarms", "declarativeNetRequest"],
    // Granted at install so blocked sites can redirect to the focus page and the API origin works
    // in every environment (production or a dev override). Trade-off: broad access, one install warning.
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      { resources: ["focus.html"], matches: ["<all_urls>"] },
    ],
    icons: { 16: "icon/16.png", 32: "icon/32.png", 48: "icon/48.png", 96: "icon/96.png", 128: "icon/128.png" },
    action: {
      default_title: "Nowaster",
      default_icon: { 16: "icon/16.png", 32: "icon/32.png", 48: "icon/48.png" },
    },
    browser_specific_settings: {
      gecko: {
        id: "extension@nowaster.app",
        data_collection_permissions: { required: ["authenticationInfo"] },
      },
    },
  },
});
