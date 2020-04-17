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

clear();
const spinner = ora().start("Loading templates");
register();

const MODULE_NAME = "genry";
const TEMPLATE_TYPE = "genry";
const ARGS = yargs
    .command("create", "create by template")
    .option("path", {
        alias: "p",
        type: "string",
        description: "Path",
        default: "./",
    })
    .option("ipcServer", {
        type: "string",
    })
    .option("terminalId", {
        type: "string",
    }).argv;

function closeVsCodeTerminal(ipcServer: string) {
    ipc.config.silent = true;

    return new Promise((res) => {
        ipc.connectTo(ipcServer, () => {
            const ipcServer = ipc.of[ARGS.ipcServer];

            ipcServer.on("connect", async () => {
                ipcServer.emit("end", ARGS.terminalId);
            });
            ipcServer.on("end", () => {
                ipc.disconnect(ARGS.ipcServer);
                res();
            });
        });
    });
}

(async () => {
    const config = (await cosmiconfig(MODULE_NAME).search())?.config;
    const files = await promisify(glob)(`**/*.${TEMPLATE_TYPE}.*`, {
        dot: true,
    });

    if (!files.length) {
        spinner.warn("Template files not found");
        return;
    }

    const templates: Template[] = await Promise.all(
        files.map((file) =>
            import(path.join(process.cwd(), file)).then(
                (f) => f.default as Template
            )
        )
    );

    const choices = templates.map((template) => {
        return {
            title: template.name,
            description: template.description,
            value: template,
        };
    });

    spinner.succeed("Templates loaded!");
    clear();

    const suggest = (input: string, choices: Choice[]) =>
        Promise.resolve(
            choices
                .filter(
                    (choice) =>
                        choice.title.search(input) !== -1 ||
                        (choice.description &&
                            choice.description.search(input) !== -1)
                )
                .sort(
                    (a, b) =>
                        (a.title + a.description).search(input) -
                        (b.title + b.description).search(input)
                )
        );

    let cancelled = false;
    const { template }: { template: Template } = await prompts(
        [
            {
                type: "autocomplete",
                name: "template",
                message: "Select template",
                choices,
                suggest,
            },
        ],
        {
            onCancel: () => {
                cancelled = true;
            },
        }
    );

    if (!cancelled) {
        await template.generate(config, ARGS);
    }

    if (ARGS.ipcServer) {
        await closeVsCodeTerminal(ARGS.ipcServer);
    }
})();
