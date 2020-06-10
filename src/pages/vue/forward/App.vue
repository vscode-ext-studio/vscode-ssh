<template>
  <div id='app'>
    <h1>{{title}}</h1>
    <blockquote class="panel" id="error" v-if="error">
      <p class="panel__text">
        Connection error! <span id="errorMessage" v-text="errorMessage"></span><br />
      </p>
    </blockquote>
    <el-table :data="forwardList" style="width: 100%">
      <el-table-column prop="name" label="name">
      </el-table-column>
      <el-table-column prop="localHost" label="Local Host">
      </el-table-column>
      <el-table-column prop="localPort" label="Local Port">
      </el-table-column>
      <el-table-column prop="remoteHost" label="Remote Host">
      </el-table-column>
      <el-table-column prop="remotePort" label="Remote Port">
      </el-table-column>
      <el-table-column prop="state" label="State">
      </el-table-column>
      <el-table-column fixed="right" width="100">
        <template slot="header" slot-scope="scope">
          <el-button type="info" icon="el-icon-circle-plus-outline" size="small" circle @click="createRequest">
          </el-button>
        </template>
        <template slot-scope="scope">
          <el-button @click="openEdit(scope.row);" type="primary" size="small" title="Edit" icon="el-icon-edit" circle>
          </el-button>
          <el-button @click="deleteConfirm(scope.row[result.id])" title="delete" type="danger" size="small" icon="el-icon-delete" circle>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    </el-table>
  </div>
</template>

<script>
const vscode =
  typeof acquireVsCodeApi != "undefined" ? acquireVsCodeApi() : null;
const postMessage = message => {
  if (vscode) {
    vscode.postMessage(message);
  }
};
export default {
  name: "App",
  data() {
    return {
      title: "",
      forwardList: [],
      error: false,
      errorMessage: "",
      panel: {
        eidt: {}
      }
    };
  },
  mounted() {
    window.addEventListener("message", ({ data }) => {
      if (!data) return;
      switch (data.type) {
        case "forwardList":
          this.forwardList = data.content;
          break;
        case "title":
          this.title = data.content;
          break;
        case "success":
          this.error = false;
          break;
        case "error":
          this.error = true;
          this.errorMessage = data.content;
          break;
      }
    });
    postMessage({ type: "init" });
  },
  methods: {
    createRequest() {
      postMessage({ type: "create", content: this.eidt });
    },
    openEdit(row) {},
    deleteConfirm(id) {},
    tryConnect() {
      postMessage({
        type: "CONNECT_TO_SQL_SERVER",
        databaseType: this.databaseType,
        connectionOption: this.connectionOption
      });
    }
  }
};
</script>

<style>
</style>