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

register();

const MODULE_NAME = "genry";
const TEMPLATE_TYPE = "genry";

clear();

const args = yargs
    .command("create", "create by template")
    .option("path", {
        alias: "p",
        type: "string",
        description: "Path",
    })
    .option("ipcServer", {
        type: "string",
    })
    .option("terminalId", {
        type: "string",
    }).argv;

const config$ = cosmiconfig(MODULE_NAME).search();

(async () => {
    const config = (await config$)?.config;
    const files = await promisify(glob)(`**/*.${TEMPLATE_TYPE}.*`, {
        dot: true,
    });

    if (files.length > 0) {
        const templates: Template[] = await Promise.all(
            files.map((file) =>
                import(path.join(process.cwd(), file)).then(
                    (f) => f.default as Template
                )
            )
        );

        const choices = templates.map((t, idx) => {
            return {
                title: t.name,
                description: t.description,
                value: t,
            };
        });

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
                        (a, b) => a.title.search(input) - b.title.search(input)
                    )
            );

        const response = await prompts([
            {
                type: "autocomplete",
                name: "template",
                message: "Select template",
                choices,
                suggest,
            },
        ]);

        await (response.template as Template).generate(config);
    } else {
        console.log("Template files not found");
    }

    await vscExtension();
})();

function vscExtension() {
    ipc.config.id = Math.random().toString();
    ipc.config.silent = true;

    return new Promise((res) => {
        ipc.connectTo(args.ipcServer, () => {
            const ipcServer = ipc.of[args.ipcServer];

            ipcServer.on("connect", async () => {
                ipcServer.emit("end", args.terminalId);
            });
            ipcServer.on("end", () => {
                ipc.disconnect(args.ipcServer);
                res();
            });
        });
    });
}
