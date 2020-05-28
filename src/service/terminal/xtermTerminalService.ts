import { listen, Socket } from "socket.io";
import { Client } from "ssh2";
import { WebviewPanel } from "vscode";
import { ViewManager } from "../../common/viewManager";
import { SSHConfig } from "../../node/sshConfig";
import { TerminalService } from "./terminalService";
import * as portfinder from "portfinder";



export class XtermTerminal implements TerminalService {

    public async openMethod(sshConfig: SSHConfig, sessinoName: string) {

        const port = await portfinder.getPortPromise();
        const server = require('http').createServer();
        const io = listen(server);
        io.on('connection', (socket) => this.handlerSocket(socket, sshConfig, sessinoName))
        server.listen(port);
        ViewManager.createWebviewPanel({
            splitView: true, path: "xterm/client", title: "terminal", initListener: (viewPanel: WebviewPanel) => {
                // TODO
                viewPanel.webview.postMessage({ type: "CONNECTION", socketPath: "http://127.0.0.1:" + port })
            },
        })

    }

    private handlerSocket(socket: Socket, sshConfig: SSHConfig, sessinoName: string) {
        var termCols: number, termRows: number;
        socket.on('geometry', (cols, rows) => {
            termCols = cols
            termRows = rows
        })
        var client = new Client()
        client.on('ready', function connOnReady() {
            socket.emit('menu', '<a id="logBtn"><i class="fas fa-clipboard fa-fw"></i> Start Log</a><a id="downloadLogBtn"><i class="fas fa-download fa-fw"></i> Download Log</a>')
            socket.emit('allowreauth', true)
            socket.emit('setTerminalOpts', { cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound" })
            socket.emit('title', 'ssh://' + sshConfig.host)
            // 以下两下还需确认
            // socket.emit('headerBackground', 'green')
            // socket.emit('header', socket.request.session.ssh.header.name)
            socket.emit('footer', 'ssh://' + sshConfig.username + '@' + sshConfig.host + ':' + sshConfig.port)
            socket.emit('status', 'SSH CONNECTION ESTABLISHED')
            socket.emit('statusBackground', 'green')
            // term: socket.request.session.ssh.term
            client.shell({
                term: 'vt100',
                cols: termCols,
                rows: termRows
            }, (err, stream) => {
                if (err) {
                    this.SSHerror('EXEC ERROR' + err)
                    client.end()
                    return
                }
                // poc to log commands from client
                // if (socket.request.session.ssh.serverlog.client) var dataBuffer
                socket.on('data', function socketOnData(data) {
                    stream.write(data)
                    // poc to log commands from client
                    // if (socket.request.session.ssh.serverlog.client) {
                    //     if (data === '\r') {
                    //         console.log('serverlog.client: ' + socket.request.session.id + '/' + socket.id + ' host: ' + sshConfig.host + ' command: ' + dataBuffer)
                    //         dataBuffer = undefined
                    //     } else {
                    //         dataBuffer = (dataBuffer) ? dataBuffer + data : data
                    //     }
                    // }
                })
                // socket.on('control', function socketOnControl(controlData) {
                //     switch (controlData) {
                //         case 'replayCredentials':
                //             if (socket.request.session.ssh.allowreplay) {
                //                 stream.write(socket.request.session.userpassword + '\n')
                //             }
                //         /* falls through */
                //         default:
                //             console.log('controlData: ' + controlData)
                //     }
                // })
                socket.on('resize', (data) => {
                    stream.setWindow(data.rows, data.cols, data.height, data.width)
                })
                socket.on('disconnect', function socketOnDisconnect(reason) {
                    // err = { message: reason }
                    // socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    client.end()
                    // socket.request.session.destroy()
                })
                socket.on('error', function socketOnError(err) {
                    // socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    client.end()
                })

                stream.on('data', function streamOnData(data) { socket.emit('data', data.toString('utf-8')) })
                stream.on('close', function streamOnClose(code, signal) {
                    // err = { message: ((code || signal) ? (((code) ? 'CODE: ' + code : '') + ((code && signal) ? ' ' : '') + ((signal) ? 'SIGNAL: ' + signal : '')) : undefined) }
                    // socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    client.end()
                })
                stream.stderr.on('data', function streamStderrOnData(data) {
                    console.log('STDERR: ' + data)
                })
            })
        })
        // TODO: need to convert to cr/lf for proper formatting
        client.on('banner', (data: string) => socket.emit('data', data.replace(/\r?\n/g, '\r\n')))
        client.on('end', (err) => { SSHerror('CONN END BY HOST', err) })
        client.on('close', (err) => { SSHerror('CONN CLOSE', err) })
        client.on('error', (err) => { SSHerror('CONN ERROR', err) })
        client.on('keyboard-interactive', function connOnKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
            finish([socket.request.session.userpassword])
        })
        client.connect(sshConfig)

        /**
        * Error handling for various events. Outputs error to client, logs to
        * server, destroys session and disconnects socket.
        * @param {string} myFunc Function calling this function
        * @param {object} err    error object or error message
        */
        // eslint-disable-next-line complexity
        function SSHerror(myFunc, err) {
            var theError = (err) ? ': ' + err.message : ''
            socket.disconnect(true)
            // debugWebSSH2('SSHerror ' + myFunc + theError)
        }
    }



}