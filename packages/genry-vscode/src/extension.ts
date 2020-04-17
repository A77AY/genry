import * as vscode from "vscode";
import * as ipc from "node-ipc";
import { v4 as uuid } from "uuid";

const TERMINAL_NAME = "Genry Scaffolder";

async function getTerminalByProccessId(processId: number) {
    const processes = await Promise.all(
        vscode.window.terminals.map(async (terminal) => ({
            processId: await terminal.processId,
            terminal,
        }))
    );
    return processes.find(async (t) => t.processId === processId).terminal;
}

export function activate(context: vscode.ExtensionContext) {
    ipc.config.id = uuid();
    ipc.serve(() => {
        ipc.server.on("end", async (data, socket) => {
            ipc.server.emit(socket, "end");
            vscode.window.showInformationMessage("Success scuffolding!");
            const terminal = await getTerminalByProccessId(data);
            terminal.dispose();
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
                const terminal = vscode.window.createTerminal(TERMINAL_NAME);
                terminal.sendText(
                    `npx genry --path "${fsPath}" --ipcServer ${
                        ipc.config.id
                    } --terminalId ${await terminal.processId}`
                );
                terminal.show();
            }
        )
    );
}
