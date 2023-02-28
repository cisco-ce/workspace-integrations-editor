async function fetchJson(url) {
  const data = await (await fetch(url)).json();
  return data;
}

// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function createUUID(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

const model = {

  config: null,
  showJson: false,
  datalists: [],

  init() {
    const scopes = getScopes();
    this.datalists.push({ id: 'scopes', values: scopes.map(s => s.id )});
    this.handleFileDrag();
  },

  home() {
    // TODO: warn about unsaved config
    this.config = null;
    this.showJson = false;
  },

  handleFileDrag() {
    const dropArea = document.querySelector('.start-page');
    dropArea.addEventListener('dragover', (event) => {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    dropArea.addEventListener('drop', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const fileList = event.dataTransfer.files;
      this.loadFromFile(fileList);
    });
  },

  loadFromFile(files) {
    const file = files[0];
    if (!file) return;
    if (file.type !== 'application/json') {
      alert('Not a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.setJson(reader.result);
      this.incrementVersion();
    });
    reader.readAsText(file);
  },

  incrementVersion() {
    const current = Number(this.config.manifestVersion) || 0;
    this.config.manifestVersion = current + 1;

  },

  async loadSample() {
    this.config = await fetchJson('./sample/manifest.json');
    this.incrementVersion();
  },

  async createNew() {
    this.config = await fetchJson('./sample/new.json');
    this.config.id = createUUID();
  },

  saveToFile() {
    const text = JSON.stringify(this.config, null, 2);
    const data = new Blob([text], { type: 'text/plain' });
    const dataUrl = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.setAttribute('download', 'manifest.json');
    link.href = dataUrl;
    document.body.appendChild(link);
    window.requestAnimationFrame(() => link.click());
  },

  setJson(json) {
    try {
      this.config = JSON.parse(json);
      this.showJson = false;
    }
    catch(e) {
      alert('Not able to parse JSON.');
    }
  },

  toClipboard() {
    const json = JSON.stringify(this.config, null, 2);
    navigator.clipboard.writeText(json)
    .then(() => {
      alert('JSON copied to clipboard');
    })
    .catch(() => {
      alert('Not able to copy to clipboard');
    })
  },

  apiLink(path, type) {
    return `https://roomos.cisco.com/xapi/search?search=${path}&Type=${type}`;
  },


  addApiContainer(type, container) {
    return {
      id: type,
      name: type,
      type: 'list',
      add: () => {
        container.push({
          "path": "",
          "access": "required"
        })
      },
      remove: (index) => {
        container.splice(index, 1);
      },
      values: container.map(item => {
        return {
          container: item,
          id: 'path',
          type: 'string',
          url: item.path && this.apiLink(item.path, type),
        };
      }),
    };
  },

  addScopeContainer(container) {
    return {
      id: 'apiAccess',
      name: 'API scopes',
      type: 'list',
      datalist: 'scopes',
      add: () => {
        container.push({
          "scope": "",
          "access": "required"
        })
      },
      remove: (index) => {
        container.splice(index, 1);
      },
      values: container.map(item => {
        return {
          container: item,
          id: 'scope',
          type: 'string',
        };
      }),
    };
  },

  get inputs() {
    if (!this.config) return [];

    return [
      {
        id: 'id',
        name: 'ID',
        type: 'string',
        container: this.config,
        required: true,
      },
      {
        id: 'manifestVersion',
        name: 'Manifest version',
        type: 'string',
        valuespace: 'number',
        container: this.config,
        required: true,
      },
      {
        id: 'displayName',
        name: 'Display Name',
        type: 'string',
        container: this.config,
        required: true,
      },
      {
        id: 'vendor',
        name: 'Vendor',
        type: 'string',
        container: this.config,
        required: true,
      },
      {
        id: 'email',
        name: 'E-mail',
        type: 'string',
        valuespace: 'email',
        container: this.config,
        required: true,
      },
      {
        id: 'description',
        name: 'Description',
        type: 'text',
        container: this.config,
        required: true,
      },
      {
        id: 'descriptionUrl',
        name: 'Description URL',
        type: 'string',
        container: this.config,
      },
      {
        id: 'tocUrl',
        name: 'Terms URL',
        type: 'string',
        container: this.config,
      },
      {
        id: 'availability',
        name: 'Availability',
        type: 'select',
        values: ['public', 'org_private'],
        container: this.config,
        required: true,
      },
      this.addScopeContainer(this.config.apiAccess),
      this.addApiContainer('Status', this.config.xapiAccess?.status || []),
      this.addApiContainer('Command', this.config.xapiAccess?.commands || []),
      this.addApiContainer('Event', this.config.xapiAccess?.events || []),
    ];
  },

};
