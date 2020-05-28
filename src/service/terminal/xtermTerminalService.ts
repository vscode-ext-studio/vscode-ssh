import { listen, Socket } from "socket.io";
import { Client } from "ssh2";
import { WebviewPanel } from "vscode";
import { ViewManager } from "../../common/viewManager";
import { SSHConfig } from "../../node/sshConfig";
import { TerminalService } from "./terminalService";
import * as portfinder from "portfinder";

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
        var client = new Client()
        const end = () => { socket.disconnect(true); client.end(); server.close(); }
        const SSHerror = (message: string, err: any) => { socket.emit('ssherror', (err) ? `${message}: ${err.message}` : message); end(); }
        client.on('ready', function connOnReady() {
            socket.emit('menu', '<a id="logBtn"><i class="fas fa-clipboard fa-fw"></i> Start Log</a><a id="downloadLogBtn"><i class="fas fa-download fa-fw"></i> Download Log</a>')
            socket.emit('setTerminalOpts', { cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound" })
            socket.emit('header', 'ssh://' + sshConfig.username + '@' + sshConfig.host + ':' + sshConfig.port)
            socket.emit('headerBackground', 'green')
            socket.emit('footer', 'ssh://' + sshConfig.username + '@' + sshConfig.host + ':' + sshConfig.port)
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
                // TODO 实现日志功能
                // TODO 美化xterm
                // TODO 连接后无法及时输入命令
                // var dataBuffer: string = enableLog ? "" : null;
                socket.on('data', (data) => {
                    stream.write(data)
                    // if(dataBuffer){
                    //     dataBuffer = (dataBuffer) ? dataBuffer + data : data
                    // }
                })
                socket.on('resize', (data) => {
                    stream.setWindow(data.rows, data.cols, data.height, data.width)
                })
                socket.on('disconnect', () => {
                    socket.emit('ssherror', 'socket io connection was closed.')
                    end()
                })
                socket.on('error', (err) => {
                    socket.emit('ssherror', 'socket io exchange error:' + err)
                    end()
                })
                stream.on('data', (data) => { socket.emit('data', data.toString('utf-8')) })
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