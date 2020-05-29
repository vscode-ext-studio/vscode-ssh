import { listen, Socket } from "socket.io";
import { Client } from "ssh2";
import * as vscode from 'vscode';
import { WebviewPanel } from "vscode";
import { ViewManager } from "../../common/viewManager";
import { SSHConfig } from "../../node/sshConfig";
import { TerminalService } from "./terminalService";
import * as portfinder from "portfinder";
import { FileManager, FileModel } from "../../manager/fileManager";

export class XtermTerminal implements TerminalService {

    public async openMethod(sshConfig: SSHConfig) {

        const port = await portfinder.getPortPromise();
        const server = require('http').createServer();
        const io = listen(server);
        io.on('connection', (socket) => this.handlerSocket(socket, sshConfig, server))
        server.listen(port);
        ViewManager.createWebviewPanel({
            splitView: false, path: "xterm/client", title: `ssh://${sshConfig.username}@${sshConfig.host}`, initListener: (viewPanel: WebviewPanel) => {
                viewPanel.webview.postMessage({ type: "CONNECTION", socketPath: "http://127.0.0.1:" + port })
            },
        })

    }

    private handlerSocket(socket: Socket, sshConfig: SSHConfig, server: any) {
        var termCols: number, termRows: number;
        socket.on('geometry', (cols, rows) => {
            termCols = cols
            termRows = rows
        })
        let dataBuffer = "";
        const client = new Client()
        const end = () => { socket.disconnect(true); client.end(); server.close(); dataBuffer = null; }
        const SSHerror = (message: string, err: any) => { socket.emit('ssherror', (err) ? `${message}: ${err.message}` : message); end(); }
        client.on('ready', function connOnReady() {
            socket.emit('setTerminalOpts', { cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound" })
            const sshUrl = 'ssh://' + sshConfig.username + '@' + sshConfig.host + ':' + sshConfig.port;
            socket.emit('header', sshUrl)
            socket.emit('headerBackground', 'green')
            socket.emit('status', 'SSH CONNECTION ESTABLISHED')
            socket.emit('statusBackground', 'green')
            client.shell({
                term: 'xterm-color',
                cols: termCols,
                rows: termRows
            }, (err, stream) => {
                if (err) {
                    this.SSHerror('EXEC ERROR' + err)
                    end()
                    return
                }
                // TODO 美化xterm
                // TODO 连接后无法及时输入命令
                socket.on('data', (data: string) => {
                    if (data.toLowerCase() == "clear" || data.toLowerCase() == "cls") {
                        dataBuffer = ""
                    }
                    stream.write(data)
                })
                socket.on('resize', (data) => {
                    stream.setWindow(data.rows, data.cols, data.height, data.width)
                })
                socket.on('disconnect', () => {
                    socket.emit('ssherror', 'socket io connection was closed.')
                    end()
                })
                socket.on('openLog', async () => {
                    const filePath = sshConfig.username + '@' + sshConfig.host
                    await FileManager.record(filePath, dataBuffer, FileModel.WRITE)
                    FileManager.show(filePath).then((textEditor: vscode.TextEditor) => {
                        const lineCount = textEditor.document.lineCount;
                        const range = textEditor.document.lineAt(lineCount - 1).range;
                        textEditor.selection = new vscode.Selection(range.end, range.end);
                        textEditor.revealRange(range);
                    })
                })
                socket.on('error', (err) => {
                    socket.emit('ssherror', 'socket io exchange error:' + err)
                    end()
                })
                stream.on('data', (data) => {
                    socket.emit('data', data.toString('utf-8'));
                    dataBuffer += data
                })
                stream.on('close', (code, signal) => {
                    socket.emit('ssherror', 'client closed socket io.')
                    end()
                })
            })
        })
        client.on('banner', (data: string) => socket.emit('data', data.replace(/\r?\n/g, '\r\n')))
        client.on('end', (err) => { SSHerror('CONN END BY HOST', err) })
        client.on('close', (err) => { SSHerror('CONN CLOSE', err) })
        client.on('error', (err) => { SSHerror('CONN ERROR', err) })
        client.on('keyboard-interactive', function connOnKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
            finish([socket.request.session.userpassword])
        })
        client.connect(sshConfig)
    }

}