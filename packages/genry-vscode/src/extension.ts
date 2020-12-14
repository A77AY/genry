import * as vscode from "vscode";
import * as ipc from "node-ipc";
import { v4 as uuid } from "uuid";
import { Terminal, Progress, ProgressLocation } from "vscode";

const TERMINAL_NAME = "Genry";

function getTerminalByName(name: string) {
    return vscode.window.terminals.find((t) => t.name === name);
}

const terminalsProgress = new Map<
    Terminal,
    { progress: Progress<any>; progressResolve: () => any }
>();

export function activate(context: vscode.ExtensionContext) {
    ipc.config.id = uuid();
    ipc.serve(() => {
        ipc.server.on("notFound", ({ terminalId }) => {
            vscode.window.showWarningMessage("Templates not found");
            const terminal = getTerminalByName(terminalId);
            terminalsProgress.get(terminal).progressResolve();
            terminalsProgress.delete(terminal);
        });
        ipc.server.on("found", ({ terminalId }) => {
            const terminal = getTerminalByName(terminalId);
            terminalsProgress.get(terminal).progressResolve();
            terminalsProgress.delete(terminal);
            terminal.show();
        });
        ipc.server.on("end", ({ terminalId }, socket) => {
            ipc.server.emit(socket, "end");
            getTerminalByName(terminalId).dispose();
        });
    });
    ipc.server.start();

    context.subscriptions.push(
        vscode.commands.registerCommand("genry.create", () => {
            const terminal = vscode.window.createTerminal(TERMINAL_NAME);
            terminal.sendText("npx genry");
            terminal.show();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "genry.createByMenu",
            async ({ fsPath }: { fsPath: string }) => {
                const terminal = vscode.window.createTerminal({
                    name: `${TERMINAL_NAME}_${uuid()}`,
                    hideFromUser: true,
                });
                terminal.sendText(
                    `npx genry --path "${fsPath}" --ipcServer "${ipc.config.id}" --terminalId "${terminal.name}"`
                );
                vscode.window.withProgress(
                    {
                        location: ProgressLocation.Window,
                        title: "Genry",
                        cancellable: true,
                    },
                    (progress, token) => {
                        const result$ = new Promise<void>((res) => {
                            terminalsProgress.set(terminal, {
                                progress,
                                progressResolve: () => res(),
                            });
                        });

                        token.onCancellationRequested(() => {
                            terminal.dispose();
                            terminalsProgress.delete(terminal);
                        });

                        progress.report({
                            message: "Search templates",
                        });

                        return result$;
                    }
                );
            }
        )
    );
}
