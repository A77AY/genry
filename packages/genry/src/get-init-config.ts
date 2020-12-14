import * as yargs from "yargs";
import { cosmiconfig } from "cosmiconfig";
import * as path from "path";
import * as pkgUp from "pkg-up";

const MODULE_NAME = "genry";

export async function getInitConfig() {
    const args = yargs
        .scriptName("genry")
        .command("$0", "Scaffolding tool")
        .option("path", {
            alias: "p",
            type: "string",
            description: "The path by which the template will be generated",
            default: process.cwd(),
        })
        .option("ipcServer", {
            type: "string",
            description: "IPC server for VS Code",
            hidden: true,
        })
        .option("terminalId", {
            type: "string",
            description: "Terminal id for VS Code",
            hidden: true,
        })
        .help()
        .alias("help", "h")
        .alias("version", "v").argv;
    const [packagePath, config] = await Promise.all([
        pkgUp({ cwd: args.path }).then((p) => path.dirname(p)),
        cosmiconfig(MODULE_NAME)
            .search(args.path)
            .then((c) => c?.config),
    ]);
    return {
        args: {
            ...args,
            path: path.isAbsolute(args.path)
                ? args.path
                : path.join(process.cwd(), args.path),
        },
        packagePath,
        config: config || {},
    };
}
