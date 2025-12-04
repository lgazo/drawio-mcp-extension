import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Draw.io MCP Extension",
    permissions: ["storage"],
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
    web_accessible_resources: [
      {
        resources: ["main_world.js"],
        // matches: ["*://*/*"],
        matches: ["*://app.diagrams.net/*"],
      },
    ],
  },
});
