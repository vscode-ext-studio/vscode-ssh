<template>
  <div class="container" id='app'>
    <h1>Add SSH Config</h1>
    <blockquote class="panel" id="error" v-if="error">
      <p class="panel__text">
        Connection error! <span id="errorMessage" v-text="errorMessage"></span><br />
      </p>
    </blockquote>
    <div>
      <div class="field field__input">
        <strong>name:</strong>
        <input class="field__input" placeholder="connection name, can be empty" v-model="connectionOption.name" />
      </div>
    </div>
    <div>
      <div class="field field__input">
        <b>host:</b>
        <input class="field__input" v-model="connectionOption.host" />
      </div>
    </div>
    <div>
      <div class="field field__input">
        <b>port:</b>
        <input class="field__input" v-model="connectionOption.port" />
      </div>
    </div>
    <div>
      <div class="field field__input">
        <b>username:</b>
        <input class="field__input" v-model="connectionOption.username" />
      </div>
    </div>
    <div>
      <div class="field field__input">
        <b>cipher:</b>
        <select v-model="connectionOption.algorithms.cipher[0]">
          <option value="aes128-cbc">aes128-cbc</option>
          <option value="aes192-cbc">aes192-cbc</option>
          <option value="aes256-cbc">aes256-cbc</option>
          <option value="3des-cbc">3des-cbc</option>
          <option value="aes128-ctr">aes128-ctr</option>
          <option value="aes192-ctr">aes192-ctr</option>
          <option value="aes256-ctr">aes256-ctr</option>
        </select>
      </div>
    </div>
    <div>
      <div class="field field__input">
        <b>type:</b>
        <select v-model="type">
          <option value="password">password</option>
          <option value="privateKey">privateKey</option>
        </select>
      </div>
    </div>
    <div v-if="type=='password'">
      <div class="field field__input">
        <b>password:</b>
        <input class="field__input" type="password" v-model="connectionOption.password" />
      </div>
    </div>
    <div v-if="type=='privateKey'">
      <div>
        <div class="field field__input">
          <b>privateKey:</b>
          <input class="field__input" type="privateKey" v-model="connectionOption.private" />
        </div>
      </div>
      <div>
        <div class="field field__input">
          <b>passphrase:</b>
          <input class="field__input" type="passphrase" v-model="connectionOption.passphrase" />
        </div>
      </div>
    </div>
    <div id="fields" data-type="none"></div>

    <button class="button button--primary" @click="tryConnect">Connect</button>

  </div>
</template>

<script>
const vscode =
  typeof acquireVsCodeApi != "undefined" ? acquireVsCodeApi() : null;
const postMessage = (message) => {
  if (vscode) {
    vscode.postMessage(message);
  }
};
export default {
  name: "App",
  data() {
    return {
      connectionOption: {
        host: "",
        port: "22",
        name: null,
        username: "root",
        password: "",
        private: "",
        passphrase: "",
        algorithms:{
          cipher:[]
        }
      },
      type: "password",
      error: false,
      errorMessage: "",
    };
  },
  mounted() {
    window.addEventListener("message", ({ data }) => {
      if (!data) return;
      if (data.type === "CONNECTION_ERROR") {
        this.error = true;
        this.errorMessage = data.content;
      } else if (data.type === "edit") {
        this.connectionOption = data.content;
      } else {
        document.write("Connect success!");
      }
    });
    postMessage({ type: "init" });
  },
  methods: {
    tryConnect() {
      postMessage({
        type: "CONNECT_TO_SQL_SERVER",
        content: {
          connectionOption: this.connectionOption,
        },
      });
    },
  },
};
</script>

<style>
.container {
  margin: auto;
  padding-left: 24px;
  padding-right: 24px;
  max-width: 1000px;
  box-sizing: border-box;
}

.tab {
  border-bottom: 1px solid var(--vscode-dropdown-border);
  display: flex;
  padding: 0;
}

.tab__item {
  list-style: none;
  cursor: pointer;
  font-size: 13px;
  padding: 7px 8px;
  color: var(--vscode-foreground);
  border-bottom: 1px solid transparent;
  margin: 0 0 -1px 0;
}

.tab__item:hover {
  color: var(--vscode-panelTitle-activeForeground);
}

.tab__item--active {
  color: var(--vscode-panelTitle-activeForeground);
  border-bottom-color: var(--vscode-panelTitle-activeForeground);
}

.field {
  padding: 1em 0;
}

.field--checkbox {
  display: flex;
  justify-content: flex-end;
  flex-direction: row-reverse;
  align-items: center;
}

.field__label {
  display: block;
  margin: 2px 0;
  cursor: pointer;
}

.field--checkbox .field__label {
  margin: 2px 4px;
}

.field__input {
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-dropdown-border);
  color: var(--vscode-input-foreground);
  padding: 4px;
  margin: 2px 0;
}

.field__input:focus {
  border-color: var(--vscode-focusBorder);
  outline: 0;
}

.button {
  width: auto;
  padding: 2px 14px;
  border: 0;
  display: inline-block;
  cursor: pointer;
}

.button--primary {
  color: var(--vscode-button-foreground);
  background-color: var(--vscode-button-background);
}

.button--primary:hover {
  background-color: var(--vscode-button-hoverBackground);
}

.panel {
  margin: 0 7px 0 5px;
  padding: 0 16px 0 10px;
  border-left-width: 5px;
  border-left-style: solid;
  background: var(--vscode-textBlockQuote-background);
  border-color: var(--vscode-inputValidation-errorBorder);
}

.panel__text {
  line-height: 2;
}
</style>