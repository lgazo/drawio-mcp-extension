# Development

## Local browser configuration

web-ext.config.ts
```
import { defineWebExtConfig } from "wxt";

export default defineWebExtConfig({
  // disabled: true,
  startUrls: ["https://app.diagrams.net"],
  openConsole: true,
  openDevtools: true,
});
```
## Popup

chrome-extension://kaojkbhgfapmlcpdfiacogniedjfbifg/popup.html

# Publishing

Chrome Web Store:
https://chrome.google.com/u/2/webstore/devconsole

Mozilla Firefox Add-ons:
https://addons.mozilla.org/en-US/developers/addons
