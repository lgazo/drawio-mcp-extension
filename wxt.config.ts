import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: [
      "activeTab",
      "scripting",
      "webNavigation",
      "tabs"
    ],
    host_permissions: [
      "https://app.diagrams.net/*",
      "http://app.diagrams.net/*",
      "https://*.diagrams.net/*",
      "http://*.diagrams.net/*",
      "ws://localhost:3000/"
    ],
    web_accessible_resources: [
      {
        resources: ["main_world.js"],
        matches: [
          "https://app.diagrams.net/*",
          "http://app.diagrams.net/*",
          "https://*.diagrams.net/*",
          "http://*.diagrams.net/*"
        ],
      },
    ],
  },
});
