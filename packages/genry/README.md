# Genry &middot; CLI &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/KrickRay/genry/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/genry.svg)](https://www.npmjs.com/package/genry)

🏗️ **Scaffolding Tool**

Generating some code and structure:

-   [**CLI** (NPM, NPX)](https://www.npmjs.com/package/genry)
-   Called from **context menu** ([VS Code extension](https://marketplace.visualstudio.com/items?itemName=krickray.genry-vscode), [WebStrom external tool](https://www.jetbrains.com/help/webstorm/configuring-third-party-tools.html))

*   JavaScript and TypeScript **native templates** (ESNext and working with imports)
*   **Configurable** throught `.genryrc` config
*   **Shared templates** by NPM (`node_modules`)
*   **Formatted code** by [Prettier](https://prettier.io/)

## Installation & Usage

![Sample](sample.gif)

```sh
# NPX
npx genry

# NPM
npm i genry -g
genry
```

## Documentation

Documentation is in progress, but you can see [examples](https://github.com/KrickRay/genry/tree/master/packages/examples)

## [Examples](https://github.com/KrickRay/genry/tree/master/packages/examples)

---

## Contributing

### Installation

```sh
yarn install
```

### Start

```sh
yarn workspace genry watch
```
