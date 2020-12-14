import { Ora } from "ora";
import * as ora from "ora";
import { RegisterOptions, register } from "ts-node";
import * as prompts from "prompts";
import * as glob from "glob";
import { promisify } from "util";
import * as path from "path";

import { VscodeExtension } from "./vscode-extension";
import { suggest } from "./suggest";
import { Template } from "./template";

const TEMPLATE_TYPE = "genry";

export class Genry {
    vscodeExtension: VscodeExtension;
    packagePath: string;
    config: {
        include?: string;
        exclude?: string;
        registerOptions?: RegisterOptions;
    };
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
        register({
            ...(config?.registerOptions || {}),
            compilerOptions: {
                allowJs: true,
                module: "CommonJS",
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                ...(config?.registerOptions?.compilerOptions || {}),
            },
        });
    }

    private async searchTemplates(): Promise<Template[]> {
        this.spinner.start("Loading templates");
        const files = await promisify(glob)(
            `${this.config.include || "**"}/*.${TEMPLATE_TYPE}.?(ts|js)`,
            {
                dot: true,
                nodir: true,
                cwd: this.packagePath,
                ignore: this.config.exclude,
            }
        );
        if (!files.length) {
            this.spinner.warn("Templates not found");
            this.vscodeExtension.emit("notFound");
            return [];
        }
        this.spinner.text =
            files.length === 1
                ? "Prepare template"
                : `Prepare ${files.length} templates`;
        this.vscodeExtension.emit("found");
        return await this.loadTemplates(files);
    }

    private async loadTemplates(files: string[]): Promise<Template[]> {
        const startedCwd = process.cwd();
        process.chdir(this.packagePath);
        const templates = (
            await Promise.all(
                files.map((file) => {
                    try {
                        return import(path.join(this.packagePath, file)).then(
                            (f) => f.default as Template | Template[]
                        );
                    } catch (e) {
                        console.error(e);
                        return Promise.resolve(null);
                    }
                })
            )
        )
            .filter((v) => v)
            .reduce<Template[]>(
                (acc, t) => acc.concat(Array.isArray(t) ? t : [t]),
                []
            );
        process.chdir(startedCwd);
        this.spinner.succeed("Templates loaded");
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
        const templates = await this.searchTemplates();
        if (templates.length) {
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
        }
    }
}
