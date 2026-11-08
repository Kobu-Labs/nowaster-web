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
    host_permissions: ["https://nowaster.app/*"],
    // Declares what may be requested at runtime; nothing here is granted at install. Browsers only
    // let permissions.request ask for origins covered by this list, so per-domain requests
    // (block rules, custom API origin) need it. The UI only ever requests one domain at a time.
    optional_host_permissions: ["*://*/*"],
    web_accessible_resources: [
      { resources: ["focus.html"], matches: ["<all_urls>"] },
    ],
    action: { default_title: "Nowaster" },
    browser_specific_settings: {
      gecko: {
        id: "extension@nowaster.app",
        data_collection_permissions: { required: ["authenticationInfo"] },
      },
    },
  },
});
