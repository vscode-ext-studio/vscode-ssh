import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { vscodeEvent } from "./vscode";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
require('xterm/css/xterm.css')
require('../css/style.css')

const vscodeStyle = document.documentElement.style;
function get(name) {
  return vscodeStyle.getPropertyValue(name)
}

var errorExists = false;
const terminal = new Terminal({
  theme: {
    foreground: get('--vscode-terminal-foreground'),
    background: get('--vscode-editor-background'),

    brightBlack: get('--vscode-terminal-ansiBrightBlack'),
    black: get('--vscode-terminal-ansiBlack'),

    brightBlue: get('--vscode-terminal-ansBrightiBlue'),
    blue: get('--vscode-terminal-ansiBlue'),

    brightGreen: get('--vscode-terminal-ansiBrightGreen'),
    green: get('--vscode-terminal-ansiGreen'),

    brightRed:  get('--vscode-terminal-ansiBrightRed'),
    red:  get('--vscode-terminal-ansiRed'),
    
    brightCyan:  get('--vscode-terminal-ansiBrightCyan'),
    cyan:  get('--vscode-terminal-ansiCyan'),

    brightPurple:  get('--vscode-terminal-ansiBrightMagenta'),
    purple:  get('--vscode-terminal-ansiMagenta'),

    brightYellow: get('--vscode-terminal-ansiBrightYellow'),
    yellow: get('--vscode-terminal-ansiYellow'),

    brightWhite: get('--vscode-terminal-ansiBrightwhite'),
    white: get('--vscode-terminal-ansiwhite'),
  },
  cursorStyle: "bar",
  fontSize: 18,
  fontFamily: "'Consolas ligaturized',Consolas, 'Microsoft YaHei','Courier New', monospace",
  disableStdin: false,
  lineHeight: 1.1,
  rightClickSelectsWord: true,
  cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound"
})

const fitAddon = new FitAddon()
const searchAddon = new SearchAddon();
const searchAddonBar = new SearchBarAddon({ searchAddon });

terminal.loadAddon(fitAddon)
terminal.loadAddon(searchAddonBar);
terminal.loadAddon(new WebLinksAddon(() => { }, {
  willLinkActivate: (e, uri) => {
    // set timeout to remove selection
    setTimeout(() => {
      vscodeEvent.emit('openLink', uri)
    }, 100);
  }
}))

terminal.open(document.getElementById('terminal-container'))
fitAddon.fit()
terminal.focus()
terminal.onData((data) => {
  vscodeEvent.emit('data', data)
})

function resizeScreen() {
  fitAddon.fit()
  vscodeEvent.emit('resize', { cols: terminal.cols, rows: terminal.rows })
}

window.addEventListener('resize', resizeScreen, false)
window.addEventListener("keyup", event => {
  if (event.code == "KeyV" && event.ctrlKey) {
    document.execCommand('paste')
  }
  if (event.code == "KeyF" && event.ctrlKey) {
    searchAddonBar.show();
  }
});

window.addEventListener("contextmenu", () => {
  document.execCommand('copy');
  terminal.clearSelection()
})

const status = document.getElementById('status')
vscodeEvent
  .on('connecting', content => {
    terminal.write(content)
    terminal.focus()
  })
  .on('data', (content) => {
    terminal.write(content)
    terminal.focus()
  })
  .on('path', path => {
    vscodeEvent.emit('data', `cd ${path}\n`)
  })
  .on('status', (data) => {
    resizeScreen()
    status.innerHTML = data
    status.style.backgroundColor = '#338c33'
    terminal.focus()
  })
  .on('ssherror', (data) => {
    status.innerHTML = data
    status.style.backgroundColor = 'red'
    errorExists = true
  })
  .on('error', (err) => {
    if (!errorExists) {
      status.style.backgroundColor = 'red'
      status.innerHTML = 'ERROR: ' + err
    }
  });

vscodeEvent.emit('init', { cols: terminal.cols, rows: terminal.rows })