import * as ipc from "node-ipc";

export class VscodeExtension {
    ipcServer$?: Promise<any>;
    terminalId?: string;
    serverId?: string;

    constructor({
        serverId,
        terminalId,
    }: {
        serverId?: string;
        terminalId?: string;
    }) {
        if (serverId && terminalId) {
            this.terminalId = terminalId;
            this.serverId = serverId;
            ipc.config.silent = true;

            this.ipcServer$ = new Promise((res) => {
                ipc.connectTo(serverId, () => {
                    const ipcServer = ipc.of[serverId];
                    res(ipcServer);

                    ipcServer.on("end", () => {
                        ipc.disconnect(serverId);
                    });
                });
            });
        }
    }

    async emit(command: string, data?: any) {
        if (this.ipcServer$) {
            (await this.ipcServer$).emit(command, {
                terminalId: this.terminalId,
                data,
            });
        }
    }
}
