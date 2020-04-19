#!/usr/bin/env node

import * as yargs from "yargs";
import * as ipc from "node-ipc";
import * as clear from "console-clear";
import * as prompts from "prompts";
import { cosmiconfig } from "cosmiconfig";
import * as glob from "glob";
import { promisify } from "util";
import * as path from "path";
import { register } from "ts-node";
import { Template } from "./template";
import { Choice } from "prompts";
import * as ora from "ora";
import * as pkgUp from "pkg-up";
import { Ora } from "ora";

const MODULE_NAME = "genry";
const TEMPLATE_TYPE = "genry";

function closeVsCodeTerminal({
    serverId,
    terminalId,
}: {
    serverId: string;
    terminalId: string;
}) {
    ipc.config.silent = true;

    return new Promise((res) => {
        ipc.connectTo(serverId, () => {
            const ipcServer = ipc.of[serverId];

            ipcServer.on("connect", async () => {
                ipcServer.emit("end", terminalId);
            });
            ipcServer.on("end", () => {
                ipc.disconnect(serverId);
                res();
            });
        });
    });
}

async function searchTemplates({
    spinner,
    cwd,
    templateType,
}: {
    spinner: Ora;
    cwd: string;
    templateType: string;
}): Promise<Template[]> {
    const files = await promisify(glob)(`**/*.${templateType}.*`, {
        dot: true,
        cwd,
    });

    if (!files.length) {
        return [];
    }

    spinner.text =
        files.length === 1
            ? "Prepare template"
            : `Prepare ${files.length} templates`;

    return await loadTemplates(cwd, files);
}

async function loadTemplates(cwd: string, files: string[]) {
    const startedCwd = process.cwd();
    process.chdir(cwd);

    const templates = (
        await Promise.all(
            files.map((file) =>
                import(path.join(cwd, file)).then(
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

async function suggest(input: string, choices: Choice[]): Promise<Choice[]> {
    return choices
        .filter(
            (choice) =>
                choice.title.search(input) !== -1 ||
                (choice.description && choice.description.search(input) !== -1)
        )
        .sort(
            (a, b) =>
                (a.title + a.description).search(input) -
                (b.title + b.description).search(input)
        );
}

async function selectTemplate(templates: Template[]) {
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

(async () => {
    const spinner = ora();
    clear();
    spinner.start("Loading templates");

    register({ compilerOptions: { allowJs: true } });

    const args = yargs
        .command("create", "create by template")
        .option("path", {
            alias: "p",
            type: "string",
            description: "Path",
            default: process.cwd(),
        })
        .option("ipcServer", {
            type: "string",
        })
        .option("terminalId", {
            type: "string",
        }).argv;

    const [packagePath, config] = await Promise.all([
        pkgUp({ cwd: args.path }).then((p) => path.dirname(p)),
        cosmiconfig(MODULE_NAME)
            .search(args.path)
            .then((c) => c?.config),
    ]);

    const templates = await searchTemplates({
        spinner,
        cwd: packagePath,
        templateType: TEMPLATE_TYPE,
    });

    if (templates.length) {
        spinner.stop();
        clear();

        const template = await selectTemplate(templates);

        if (template) {
            await template.generate(
                {
                    path: args.path,
                    packagePath,
                    ipcServer: args.ipcServer,
                    terminalId: args.terminalId,
                },
                config
            );
        }

        if (args.ipcServer) {
            await closeVsCodeTerminal({
                serverId: args.ipcServer,
                terminalId: args.terminalId,
            });
        }
    } else {
        // TODO: Change to VS Code info message
        spinner.warn("Template files not found");
    }
})();
