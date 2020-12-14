#!/usr/bin/env node

import { VscodeExtension } from "./vscode-extension";
import { Genry } from "./genry";
import { getInitConfig } from "./get-init-config";

(async () => {
    const { args, packagePath, config } = await getInitConfig();
    const vscodeExtension = new VscodeExtension({
        serverId: args.ipcServer,
        terminalId: args.terminalId,
    });
    await new Genry({
        vscodeExtension,
        packagePath,
        config,
        path: args.path,
    }).start();
})();
