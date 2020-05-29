'use strict'

import * as io from 'socket.io-client'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faBars, faClipboard, faDownload, faKey, faCog } from '@fortawesome/free-solid-svg-icons'
library.add(faBars, faClipboard, faDownload, faKey, faCog)
dom.watch()

require('xterm/css/xterm.css')
require('../css/style.css')

var errorExists = false;
var socket;
const term = new Terminal({
  theme: {
    foreground: "#D0D4e6",
    background: "#2f3032",
    brightBlack: "#303845",
    brightBlue: "#667fb1",
    brightGreen: "#16C60C",
    brightCyan: "#61D6D6",
    brightRed: "#bf616e",
    brightPurple: "#caa6ec",
    brightYellow: "#efaa8e",
    brightWhite: "#d0d4e6",
    black: "#8897b0",
    blue: "#77abe7",
    green: "#8fcac0",
    cyan: "#7bc6c0",
    red: "#E39194",
    purple: "#DB797c",
    yellow: "#DDD7A3",
    white: "#D0D4e6"
  },
  cursorStyle: "bar",
  fontSize: 18,
  fontFamily: "'Consolas ligaturized',Consolas, 'Microsoft YaHei','Courier New', monospace",
  disableStdin: false,
  lineHeight:1.1,
  rightClickSelectsWord:true
})
// DOM properties
var openLogBtn = document.getElementById('openLogBtn')
var status = document.getElementById('status')
var header = document.getElementById('header')
var countdown = document.getElementById('countdown')
var fitAddon = new FitAddon()
var terminalContainer = document.getElementById('terminal-container')
term.loadAddon(fitAddon)
term.open(terminalContainer)
fitAddon.fit()
term.focus()

function resizeScreen() {
  fitAddon.fit()
  socket.emit('resize', { cols: term.cols, rows: term.rows })
}

window.addEventListener('resize', resizeScreen, false)

openLogBtn.addEventListener('click', openLogBtn.addEventListener('click', () => {
  socket.emit('openLog')
  term.focus()
}))

// TODO 连接后无法及时输入命令

const vscode = typeof (acquireVsCodeApi) != "undefined" ? acquireVsCodeApi() : null;
const postMessage = (message) => { if (vscode) { vscode.postMessage(message) } }
window.addEventListener('message', ({ data }) => {
  if (data.type === 'CONNECTION') {
    socket = io.connect(data.socketPath)

    term.onData(function (data) {
      socket.emit('data', data)
    })

    socket.on('data', function (data) {
      term.write(data)
      term.focus()
    })

    socket.on('connect', function () {
      socket.emit('geometry', term.cols, term.rows)
      term.focus()
    })

    socket.on('setTerminalOpts', function (data) {
      term.setOption('cursorBlink', data.cursorBlink)
      term.setOption('scrollback', data.scrollback)
      term.setOption('tabStopWidth', data.tabStopWidth)
      term.setOption('bellStyle', data.bellStyle)
      term.focus()
    })

    socket.on('status', function (data) {
      status.innerHTML = data
      term.focus()
    })

    socket.on('ssherror', function (data) {
      status.innerHTML = data
      status.style.backgroundColor = 'red'
      errorExists = true
    })

    socket.on('headerBackground', function (data) {
      header.style.backgroundColor = data
    })

    socket.on('header', function (data) {
      if (data) {
        document.getElementById('headerHost').innerHTML = data
        header.style.display = 'block'
        // header is 19px and footer is 19px, recaculate new terminal-container and resize
        terminalContainer.style.height = 'calc(100% - 38px)'
        resizeScreen()
      }
    })

    socket.on('statusBackground', function (data) {
      status.style.backgroundColor = data
    })

    socket.on('disconnect', function (err) {
      if (!errorExists) {
        status.style.backgroundColor = 'red'
        status.innerHTML =
          'WEBSOCKET SERVER DISCONNECTED: ' + err
      }
      socket.io.reconnection(false)
      countdown.classList.remove('active')
    })

    socket.on('error', function (err) {
      if (!errorExists) {
        status.style.backgroundColor = 'red'
        status.innerHTML = 'ERROR: ' + err
      }
    })

    // safe shutdown
    var hasCountdownStarted = false

    socket.on('shutdownCountdownUpdate', function (remainingSeconds) {
      if (!hasCountdownStarted) {
        countdown.classList.add('active')
        hasCountdownStarted = true
      }

      countdown.innerText = 'Shutting down in ' + remainingSeconds + 's'
    })
  }
})
postMessage({ type: 'init' })