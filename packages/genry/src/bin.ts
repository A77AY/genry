#!/usr/bin/env node

import * as yargs from "yargs";
import * as prompts from "prompts";
import { cosmiconfig } from "cosmiconfig";
import * as glob from "glob";
import { promisify } from "util";
import * as path from "path";
import { register } from "ts-node";
import { Template } from "./template";
import * as ora from "ora";
import * as pkgUp from "pkg-up";
import { Ora } from "ora";
import { suggest } from "./suggest";
import { VscodeExtension } from "./vscode-extension";

const MODULE_NAME = "genry";
const TEMPLATE_TYPE = "genry";

async function getInitConfig() {
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
    return { args, packagePath, config };
}

class Genry {
    vscodeExtension: VscodeExtension;
    packagePath: string;
    config: any;
    path: string;
    spinner: Ora = ora();

    constructor({
        vscodeExtension,
        packagePath,
        config,
        path,
    }: {
        vscodeExtension: Genry["vscodeExtension"];
        packagePath: Genry["packagePath"];
        config: Genry["config"];
        path: Genry["path"];
    }) {
        this.vscodeExtension = vscodeExtension;
        this.packagePath = packagePath;
        this.config = config;
        this.path = path;
    }

    private async searchTemplates(): Promise<Template[]> {
        const files = await promisify(glob)(`**/*.${TEMPLATE_TYPE}.*`, {
            dot: true,
            cwd: this.packagePath,
        });
        if (!files.length) {
            return [];
        }
        this.spinner.text =
            files.length === 1
                ? "Prepare template"
                : `Prepare ${files.length} templates`;
        return await this.loadTemplates(files);
    }

    private async loadTemplates(files: string[]): Promise<Template[]> {
        const startedCwd = process.cwd();
        process.chdir(this.packagePath);
        const templates = (
            await Promise.all(
                files.map((file) =>
                    import(path.join(this.packagePath, file)).then(
                        (f) => f.default as Template | Template[]
                    )
                )
            )
        ).reduce<Template[]>(
            (acc, t) => acc.concat(Array.isArray(t) ? t : [t]),
            []
        );
        process.chdir(startedCwd);
        return templates;
    }

    private async selectTemplate(templates: Template[]): Promise<Template> {
        const { template }: { template: Template } = await prompts([
            {
                type: "autocomplete",
                name: "template",
                message: "Select template",
                choices: templates.map((template) => ({
                    title: template.name,
                    description: template.description,
                    value: template,
                })),
                suggest,
            },
        ]);

        return template;
    }

    async start() {
        this.spinner.start("Loading templates");
        const templates = await this.searchTemplates();
        if (templates.length) {
            this.vscodeExtension.emit("found");
            this.spinner.succeed("Templates loaded");
            const template = await this.selectTemplate(templates);
            if (template) {
                await template.generate(
                    {
                        path: this.path,
                        packagePath: this.packagePath,
                        ipcServer: this.vscodeExtension.serverId,
                        terminalId: this.vscodeExtension.terminalId,
                    },
                    this.config
                );
            }
            this.vscodeExtension.emit("end");
        } else {
            this.vscodeExtension.emit("notFound");
        }
    }
}

register({ compilerOptions: { allowJs: true } });

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
