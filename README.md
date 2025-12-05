# Draw.io MCP Browser Extension

Let's do some Vibe Diagramming with the most wide-spread diagramming tool called Draw.io (Diagrams.net).

This is a necessary counterpart for [Draw.io MCP Server](https://github.com/lgazo/drawio-mcp-server)

[![Discord channel](https://shields.io/static/v1?logo=discord&message=draw.io%20mcp&label=chat&color=5865F2&logoColor=white)](https://discord.gg/dM4PWdf42q) [![Build project](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/ci.yml)


## Requirements

### Optional for Development
- **pnpm** - Preferred package manager

## Installation

For detailed end-to-end Draw.io MCP installation please follow the description on [Draw.io MCP Server](https://github.com/lgazo/drawio-mcp-server).

There are the following options to install the Extension itself.

### Web Store

<p>
  <a href="https://chrome.google.com/webstore/detail/drawio-mcp-extension/okdbbjbbccdhhfaefmcmekalmmdjjide">
    <picture>
      <source srcset="https://i.imgur.com/XBIE9pk.png" media="(prefers-color-scheme: dark)" />
      <img height="58" src="https://i.imgur.com/oGxig2F.png" alt="Chrome Web Store" /></picture
  ></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/drawio-mcp-extension/">
    <picture>
      <source srcset="https://i.imgur.com/ZluoP7T.png" media="(prefers-color-scheme: dark)" />
      <img height="58" src="https://i.imgur.com/4PobQqE.png" alt="Firefox add-ons" /></picture
  ></a>
</p>

### Release package

You can download a ZIP for one of the browsers in the [Release section](https://github.com/lgazo/drawio-mcp-extension/releases).

### GitHub CI package

You can download a ZIP with both versions of the Extension for Chrome and Firefox in the [`package` workflow](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/package.yml).

Just open a job run, scroll to the **Artifact** section, download the ZIP and side load the extension for one of the supported browsers.

### Local build

You can build a version of the extension by running:

```sh
pnpm run build
```

or

```sh
pnpm run build:firefox
```

It will build expanded version in the `.output` folder.

If you need a ZIP/CRX, run one of the following:

```sh
pnpm run zip
```

or

```sh
pnpm run zip:firefox
```

## Configuration

### Extension Setup (URL Patterns)

First, configure which websites the extension should inject the MCP plugin onto:

1. Click on the extension icon to open the popup
2. Click **⚙️ Extension Settings** (or access through your browser's extension management page)
3. Add URL patterns for Draw.io instances (default: `*://app.diagrams.net/*`)
4. Click **Save All Settings**

This determines where the MCP plugin will be loaded. The extension popup shows how many URL patterns are configured.

### MCP Plugin Configuration (WebSocket Settings)

Once the extension is configured to inject on your Draw.io instance:

1. Open any Draw.io website that matches your URL patterns
2. Look for **"Draw.io MCP"** in the Draw.io **Extras** menu (top menu bar)
3. Configure the WebSocket port (default: 3333)
4. Click **Save** to apply changes

The plugin will automatically connect/reconnect with your new settings. Configuration persists per website (localStorage-based).

**Note:** Make sure your Draw.io MCP Server is running on the configured port. Settings are managed within Draw.io itself, not in the extension popup.

### Connection Status

Connection status is now displayed in the MCP Settings dialog within Draw.io:
- 🟢 Green: Connected to the server
- 🟠 Orange: Connecting/reconnecting
- 🔴 Red: Disconnected

You can test connections and manually reconnect through the settings dialog.

### Migration from v1.4.x to v1.5.0+

**WebSocket Configuration Moved to Plugin:**

After updating to v1.5.0+, WebSocket port configuration is now managed within Draw.io itself:

1. **Previous behavior**: WebSocket port configured in extension popup/settings
2. **New behavior**: WebSocket port configured in Draw.io via "MCP Settings..." menu
3. **Configuration persistence**: Moved from browser.storage to localStorage (per-website)

After the update:
- Extension popup no longer shows connection status or port configuration
- Open Draw.io and use "MCP Settings..." from the menu to reconfigure
- Default port remains 3333 if previously configured
- Extension settings now only control URL injection patterns

## Sponsoring

If you enjoy the project or find it useful, consider supporting its continued development.


lightning invoice:

![lightning invoice](./lightning_qr.png)

```
lnbc1p5f8wvnpp5kk0qt60waplesw3sjxu7tcqwmdp6ysq570dc4ln52krd3u5nzq6sdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqr8pqsp5gvr72xcs883qt4hea6v3u7803stcwfnk5c9w0ykqr9a40qqwnpys9qxpqysgqfzlhm0cz5vqy7wqt7rwpmkacukrk59k89ltd5n642wzru2jn88tyd78gr4y3j6u64k2u4sd4qgavlsnccl986velrg3x0pe95sx7p4sqtatttp
```

lightning address:
```
ladislav@blink.sv
```

<div align="center">
<a href="https://liberapay.com/ladislav/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a>
</div>

## Related Resources

[Troubleshooting](./TROUBLESHOOTING.md)

[Contributing](./CONTRIBUTING.md)

[Development](./DEVELOPMENT.md)

## Star History

<a href="https://star-history.com/#lgazo/drawio-mcp-extension&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=lgazo/drawio-mcp-extension&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=lgazo/drawio-mcp-extension&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=lgazo/drawio-mcp-extension&type=Date" />
 </picture>
</a>
