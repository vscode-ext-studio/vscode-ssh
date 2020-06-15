'use strict'

import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from "xterm-addon-web-links";
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faBars, faClipboard, faDownload, faKey, faCog } from '@fortawesome/free-solid-svg-icons'
library.add(faBars, faClipboard, faDownload, faKey, faCog)
dom.watch()

const vscode = typeof (acquireVsCodeApi) != "undefined" ? acquireVsCodeApi() : null;
const postMessage = (message) => { if (vscode) { vscode.postMessage(message) } }
let events = {}
window.addEventListener('message', ({ data }) => {
  if (events[data.type]) {
    events[data.type](data.content);
  }
})
const vscodeEvent = {
  on(event, data) {
    events[event] = data
    return vscodeEvent;
  },
  emit(event, data) {
    postMessage({ type: event, content: data })
  }
}

require('xterm/css/xterm.css')
require('../css/style.css')

var errorExists = false;
const term = new Terminal({
  theme: {
    foreground: "#D0D4e6",
    background: "#2f3032",
    brightBlack: "#303845",
    brightBlue: "#77abe7",
    brightGreen: "#23d18e",
    brightCyan: "#61D6D6",
    brightRed: "#E89292",
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
  lineHeight: 1.1,
  rightClickSelectsWord: true,
  cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound"
})
// DOM properties
var openLogBtn = document.getElementById('openLogBtn')
var status = document.getElementById('status')
var header = document.getElementById('header')
var fitAddon = new FitAddon()
var terminalContainer = document.getElementById('terminal-container')
term.loadAddon(fitAddon)
term.loadAddon(new WebLinksAddon(() => { }, {
  willLinkActivate: (e, uri) => {
    // set timeout to remove selection
    setTimeout(() => {
      vscodeEvent.emit('openLink', uri)
    }, 100);
  }
}))
term.open(terminalContainer)
fitAddon.fit()
term.focus()
term.onData((data) => {
  vscodeEvent.emit('data', data)
})

function resizeScreen() {
  fitAddon.fit()
  vscodeEvent.emit('resize', { cols: term.cols, rows: term.rows })
}

window.addEventListener('resize', resizeScreen, false)
window.addEventListener("keyup", event => {
  if (event.key == "v" && event.ctrlKey) {
    vscodeEvent.emit('paste')
  }
});
window.addEventListener("contextmenu", () => {
  document.execCommand('copy');
})

openLogBtn.addEventListener('click', openLogBtn.addEventListener('click', () => {
  vscodeEvent.emit('openLog')
  term.focus()
}))

vscodeEvent
  .on('data', (content) => {
    term.write(content)
    term.focus()
  })
  .on('path', path => {
    vscodeEvent.emit('data', `cd ${path}\n`)
  })
  .on('status', (data) => {
    status.innerHTML = data
    term.focus()
  })
  .on('ssherror', (data) => {
    status.innerHTML = data
    status.style.backgroundColor = 'red'
    errorExists = true
  })
  .on('header', (data) => {
    if (data) {
      document.getElementById('headerHost').innerHTML = data
      header.style.display = 'block'
      // header is 19px and footer is 19px, recaculate new terminal-container and resize
      terminalContainer.style.height = 'calc(100% - 38px)'
      resizeScreen()
    }
  })
  .on('error', (err) => {
    if (!errorExists) {
      status.style.backgroundColor = 'red'
      status.innerHTML = 'ERROR: ' + err
    }
  })

vscodeEvent.emit('init', { cols: term.cols, rows: term.rows })