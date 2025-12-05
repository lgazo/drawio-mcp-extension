import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Draw.io MCP Extension",
    permissions: ["storage", "scripting", "declarativeNetRequest"],
    host_permissions: ["<all_urls>"],
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
    web_accessible_resources: [
      {
        resources: ["main_world.js"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
