# Draw.io MCP Browser Extension

Let's do some Vibe Diagramming with the most wide-spread diagramming tool called Draw.io (Diagrams.net).

This is a necessary counterpart for [Draw.io MCP Server](https://github.com/lgazo/drawio-mcp-server)

[![Build project](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/ci.yml)


## Requirements

### Optional for Development
- **pnpm** - Preferred package manager

## Installation

For detailed end-to-end Draw.io MCP installation please follow the description on [Draw.io MCP Server](https://github.com/lgazo/drawio-mcp-server).

There are the following options to install the Extension itself.

### Web Store

**(pending review)**

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

### GitHub package

You can download a ZIP with both versions of the Extension for Chrome and Firefox in the [`package` workflow](https://github.com/lgazo/drawio-mcp-extension/actions/workflows/package.yml).

Just expand the `Upload` step and follow-up the `Artifact download URL`.

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

## Related Resources

[Development](./DEVELOPMENT.md)
