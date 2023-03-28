async function fetchJson(url) {
  const data = await (await fetch(url)).text();
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

  tabs: ['General', 'Scopes', 'xAPI', 'JSON'],
  currentTab: 'General',
  config: null,
  datalists: [],
  form: [],
  devMode: false,
  jsonValid: true,
  showXapiHelp: false,

  init() {
    const scopes = getScopes();
    this.datalists.push({ id: 'scopes', values: scopes.map(s => s.id )});
    this.handleFileDrag();
    const params = new URLSearchParams(location.search);
    this.devMode = params.has('dev');
  },

  home() {
    // TODO: warn about unsaved config
    this.config = null;
  },

  handleFileDrag() {
    const dropArea = document.querySelector('body');
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
      this.setConfig(reader.result);
      this.incrementVersion();
    });
    reader.readAsText(file);
  },

  onJSONEdited(json) {
    try {
      this.config = JSON.parse(json);
      this.jsonValid = true;
    }
    catch(e) {
      this.jsonValid = false;
    }
  },

  incrementVersion() {
    const current = Number(this.config.manifestVersion) || 0;
    this.config.manifestVersion = current + 1;

  },

  async loadSample() {
    const json = await fetchJson('./sample/sample.json');
    this.setConfig(json);
    this.incrementVersion();
  },

  async createNew() {
    const json = await fetchJson('./sample/new.json');
    this.setConfig(json);
    this.config.id = createUUID();

  },

  getCleanJSON() {
    const config = this.config;
    if (!config) return '';
    if (config.apiAccess) {
      config.apiAccess = config.apiAccess.filter(i => i.scope?.trim());
    }
    if (config.xapiAccess) {
      config.xapiAccess.status = config.xapiAccess.status.filter(i => i.path?.trim());
      config.xapiAccess.commands = config.xapiAccess.commands.filter(i => i.path?.trim());
      this.config.xapiAccess.events = config.xapiAccess.events.filter(i => i.path?.trim());
    }
    return JSON.stringify(config, null, 2);
  },

  saveToFile() {
    const text = this.getCleanJSON();
    const data = new Blob([text], { type: 'text/plain' });
    const dataUrl = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.setAttribute('download', 'manifest.json');
    link.href = dataUrl;
    document.body.appendChild(link);
    window.requestAnimationFrame(() => link.click());
  },

  setConfig(json) {
    try {
      this.config = JSON.parse(json);
      this.createForm();
    }
    catch(e) {
      alert('Not able to parse JSON.');
    }
  },

  toClipboard() {
    const json = this.getCleanJSON();
    navigator.clipboard.writeText(json)
    .then(() => {
      alert('JSON copied to clipboard');
    })
    .catch(() => {
      alert('Not able to copy to clipboard');
    })
  },

  apiLink(path, type) {
    const p = path.replace(/\[\*\]/g, '*'); // roomos doesnt like list search
    return `https://roomos.cisco.com/xapi/search?search=${p}&Type=${type}`;
  },

  validateManifest() {
  },

  addScope() {
    if (!this.config.apiAccess) {
      this.config.apiAccess = [];
    }
    this.config.apiAccess.push({ scope: '', access: 'required' });
  },

  updateScope(index, name) {
    if (!this.config.apiAccess) {
      this.config.apiAccess = [];
    }
    this.config.apiAccess[index].scope = name;
  },

  removeScope(index) {
    this.config.apiAccess.splice(index, 1);
  },

  getScopeHelp(name) {
    return getScopes().find(s => s.id === name)?.info;
  },

  addApi(type) {
    if (!this.config.xapiAccess) {
      this.config.xapiAccess = [];
    }
    if (!this.config.xapiAccess[type]) {
      this.config.xapiAccess[type] = [];
    }
    this.config.xapiAccess[type].push({ path: '', access: 'required' });
  },

  updateApi(type, index, path) {
    if (!this.config.xapiAccess) {
      this.config.xapiAccess = [];
    }
    if (!this.config.xapiAccess[type]) {
      this.config.xapiAccess[type] = [];
    }
    this.config.xapiAccess[type][index].path = path.replaceAll(' ', '.');
  },

  removeApi(type, index) {
    this.config.xapiAccess[type].splice(index, 1);
  },

  createForm() {
    if (!this.config) return [];

    const elements = formFields;
    elements.forEach(el => el.onChange = value => this.config[el.id] = value);
    this.form = elements;
  },

  xapiExample(type) {
    const list = {
      commands: 'Audio.Volume.Set, UserInterface.Extensions.*',
      status: 'Audio.Volume, RoomAnalytics.*',
      events: 'SystemUnit.Boot, UserInterface.Extensions.*',
    };
    return list[type] || '';
  },
};
