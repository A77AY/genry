# Genry &middot; VS Code Extension &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/KrickRay/genry/blob/master/LICENSE) [![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/krickray.genry-vscode?label=vs%20code%20extension)](https://marketplace.visualstudio.com/items?itemName=krickray.genry-vscode)

🏗️ **Scaffolding Tool**

Generating some code and structure:

-   [**CLI** (NPM, NPX)](https://www.npmjs.com/package/genry)
-   Called from **context menu** ([VS Code extension](https://marketplace.visualstudio.com/items?itemName=krickray.genry-vscode), [WebStrom external tool](https://www.jetbrains.com/help/webstorm/configuring-third-party-tools.html))

*   JavaScript and TypeScript **native templates** (ESNext and working with imports)
*   **Configurable** throught `.genryrc` config
*   **Shared templates** by NPM (`node_modules`)

## Installation & Usage

![Sample](sample.gif)

```sh
code --install-extension krickray.genry-vscode
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

1. Compile

    ```sh
    # Watch CLI
    yarn workspace genry watch

    # Watch extension
    yarn workspace genry-vscode watch
    ```

1. `VS Code / Debug: Start Debugging`
