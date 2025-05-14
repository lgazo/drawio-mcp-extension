# Troubleshooting

## Supported Draw.io instances

You need to navigate to [Draw.io app](https://app.diagrams.net/).

That is the one page used for testing.

## Check working connection to MCP server

Click on the Extension icon.

Popup should open and report connection status.

## Log files for the Extension

Navigate to [chrome://extensions/](chrome://extensions/).

Make sure the **Developer mode** is active - upper right checkbox.

Click on the **Service worker** link in the drawio-mcp-extension card.

That should open DevTools of the Service Worker.

Click on the **Console** tab. You should see default log entries.

In order to see **Debug** logs, change the dropdown from **Default levels** and include also **Verbose**. The dropdown is located in the second row, more to the right, usually.

Standard initial log looks like the following:
```
[wxt] Connecting to dev server @ http://localhost:3000
Hello background! Object
[wxt] Connected to dev server
[wxt] Reloading content script: Object
[background] WebSocket connection established Event
[wxt] Existing scripts: Array(0)
[wxt] Registering new content script...
[background] broadcast to tabs Array(2)
[background] Connection state requested by popup
```

## Log files for the content script

You can get additional log files from the tab, where you navigated to Draw.io.

Open DevTools and open **Console** tab to see logs.

You should see following message:

```
Hello content 1747237705715 {window: Window, browser: {…}}
Hello from the main world
plugin loaded App {eventSource: undefined, destroyFunctions: Array(1), editor: Editor, container: body.geEditor.geSimple, selectionStateListener: ƒ, …}
[bus] registered get-selected-cell
[bus] registered add-rectangle
[bus] registered delete-cell-by-id
[bus] registered add-edge
[bus] registered get-shape-categories
[bus] registered get-shapes-in-category
[bus] registered get-shape-by-name
[bus] registered add-cell-of-shape
```
