import { listen, Socket } from "socket.io";
import { Client } from "ssh2";
import { WebviewPanel } from "vscode";
import { ViewManager } from "../../common/viewManager";
import { SSHConfig } from "../../node/sshConfig";
import { TerminalService } from "./terminalService";


export class XtermTerminal implements TerminalService {

    public async openMethod(sshConfig: SSHConfig, sessinoName: string) {

        const port = 3000;
        const server = require('http').createServer();
        const io = listen(server);
        io.on('connection', (socket) => this.handlerSocket(socket, sshConfig, sessinoName))
        server.listen(port);
        ViewManager.createWebviewPanel({
            splitView: true, path: "xterm", title: "terminal", initListener: (viewPanel: WebviewPanel) => {
                // TODO
                viewPanel.webview.postMessage({ type: "CONNECTION", socketPath: "http://127.0.0.1:" + port })
            },
        })

    }

    private handlerSocket(socket: Socket, sshConfig: SSHConfig, sessinoName: string) {
        var termCols, termRows
        socket.on('geometry', function socketOnGeometry(cols, rows) {
            termCols = cols
            termRows = rows
        })
        var conn = new Client()
        conn.on('banner', function connOnBanner(data) {
            // need to convert to cr/lf for proper formatting
            data = data.replace(/\r?\n/g, '\r\n')
            socket.emit('data', data.toString())
        })
        conn.on('ready', function connOnReady() {
            socket.emit('menu', '<a id="logBtn"><i class="fas fa-clipboard fa-fw"></i> Start Log</a><a id="downloadLogBtn"><i class="fas fa-download fa-fw"></i> Download Log</a>')
            socket.emit('allowreauth', true)
            socket.emit('setTerminalOpts', socket.request.session.ssh.terminal)
            socket.emit('title', 'ssh://' + sshConfig.host)
            if (socket.request.session.ssh.header.background) { socket.emit('headerBackground', socket.request.session.ssh.header.background) }
            if (socket.request.session.ssh.header.name) { socket.emit('header', socket.request.session.ssh.header.name) }

            socket.emit('footer', 'ssh://' + sshConfig.username + '@' + sshConfig.host + ':' + sshConfig.port)
            socket.emit('status', 'SSH CONNECTION ESTABLISHED')
            socket.emit('statusBackground', 'green')
            socket.emit('allowreplay', true)
            conn.shell({
                term: socket.request.session.ssh.term,
                cols: termCols,
                rows: termRows
            }, function connShell(err, stream) {
                if (err) {
                    this.SSHerror('EXEC ERROR' + err)
                    conn.end()
                    return
                }
                // poc to log commands from client
                if (socket.request.session.ssh.serverlog.client) var dataBuffer
                socket.on('data', function socketOnData(data) {
                    stream.write(data)
                    // poc to log commands from client
                    if (socket.request.session.ssh.serverlog.client) {
                        if (data === '\r') {
                            console.log('serverlog.client: ' + socket.request.session.id + '/' + socket.id + ' host: ' + sshConfig.host + ' command: ' + dataBuffer)
                            dataBuffer = undefined
                        } else {
                            dataBuffer = (dataBuffer) ? dataBuffer + data : data
                        }
                    }
                })
                socket.on('control', function socketOnControl(controlData) {
                    switch (controlData) {
                        case 'replayCredentials':
                            if (socket.request.session.ssh.allowreplay) {
                                stream.write(socket.request.session.userpassword + '\n')
                            }
                        /* falls through */
                        default:
                            console.log('controlData: ' + controlData)
                    }
                })
                socket.on('resize', function socketOnResize(data) {
                    stream.setWindow(data.rows, data.cols)
                })
                socket.on('disconnect', function socketOnDisconnect(reason) {
                    err = { message: reason }
                    socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    conn.end()
                    // socket.request.session.destroy()
                })
                socket.on('error', function socketOnError(err) {
                    socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    conn.end()
                })

                stream.on('data', function streamOnData(data) { socket.emit('data', data.toString('utf-8')) })
                stream.on('close', function streamOnClose(code, signal) {
                    err = { message: ((code || signal) ? (((code) ? 'CODE: ' + code : '') + ((code && signal) ? ' ' : '') + ((signal) ? 'SIGNAL: ' + signal : '')) : undefined) }
                    socket.emit('ssherror', 'SSH ' + myFunc + theError)
                    conn.end()
                })
                stream.stderr.on('data', function streamStderrOnData(data) {
                    console.log('STDERR: ' + data)
                })
            })
        })
        conn.on('end', function connOnEnd(err) { SSHerror('CONN END BY HOST', err) })
        conn.on('close', function connOnClose(err) { SSHerror('CONN CLOSE', err) })
        conn.on('error', function connOnError(err) { SSHerror('CONN ERROR', err) })
        conn.on('keyboard-interactive', function connOnKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
            finish([socket.request.session.userpassword])
        })
        conn.connect(sshConfig)

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