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

const apiTypes = { status: 'Status', events: 'Event', commands: 'Command' };

function fixPath(path) {
  return path
    .replaceAll(' ', '.')
    .replace(/\[[\w\.]*\]/g, '[*]');
}

const model = {

  tabs: ['General', 'Scopes', 'xAPI', 'JSON'], // also export, but dont show that
  currentTab: 'General',
  config: null,
  datalists: [],
  form: [],
  devMode: false,
  jsonValid: true,
  errors: [],
  warnings: [],
  xapiDocs: [],
  xapiTypes: ['status', 'commands', 'events'],
  xapiInfo: {
    status: 'xStatus (query and notifications)',
    commands: 'xCommands (invokation)',
    events: 'xEvents (notifications)',
  },

  async init() {
    const scopes = getScopes();
    this.datalists.push({ id: 'scopes', values: scopes.map(s => s.id )});
    this.handleFileDrag();
    const params = new URLSearchParams(location.search);
    this.devMode = params.has('dev');
    this.fetchXapis();
    window.onbeforeunload = this.onLeave.bind(this);
  },

  onLeave(event) {
    if (this.config && !this.devMode) {
      event.preventDefault();
      return 'You have a manifest open. Leave editor?';
    }
  },

  async fetchXapis() {
    // TODO roomos.cisco.com currently doesnt allow CORS
    // const url = 'https://roomos.cisco.com/api/search';
    const url = './xapi.json';
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      this.xapiDocs = (await res.json()).objects;
      const getPaths = type => {
        const nodes = this.xapiDocs.filter(n => n.type === type);
        const paths = nodes.map(n => fixPath(n.path));
        const unique = Array.from(new Set(paths));
        return unique;
      }

      this.datalists.push({ id: 'status', values: getPaths('Status') });
      // wish this came from the schema:
      this.datalists.push({ id: 'events', values: allowedEvents });
      // this.datalists.push({ id: 'events', values: getPaths('Event') });
      this.datalists.push({ id: 'commands', values: getPaths('Command') });
    }
    catch(e) {
      console.log(e);
    }
  },

  xapiHelp(type, path) {
    const t = apiTypes[type];
    if (!path) return '';

    const hit = this.xapiDocs.find(n => n.type = t && fixPath(n.path) === path);
    if (hit && t === 'Event') {
      if (!path.includes('*') && !allowedEvents.includes(path)) {
        return '⚠️ This event is not currently supported by Workspace integraitons, as far as the editor knows .';
      }
    }
    else if (hit) {
      return hit.attributes?.description;
    }
    else if (path.includes('*') && !path.includes('[*]')) {
      return '⚠️ It is recommend to specify APIs explicitly rather than to use wild cards.';
    }
    else if (!path.includes('*')) {
      return `⚠️ API is not known to the editor.`
    }
    return '';
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
    if (config.xapiAccess?.status) {
      config.xapiAccess.status = config.xapiAccess.status.filter(i => i.path?.trim());
    }
    if (config.xapiAccess?.commands) {
      config.xapiAccess.commands = config.xapiAccess.commands.filter(i => i.path?.trim());
    }
    if (config.xapiAccess?.events) {
      config.xapiAccess.events = config.xapiAccess.events.filter(i => i.path?.trim());
    }

    return JSON.stringify(config, null, 2);
  },

  exportConfig() {
    const { errors, warnings } = validateConfig(this.config);
    this.errors = errors;
    this.warnings = warnings;
    this.currentTab = 'export';
  },

  saveToFile() {
    const text = this.getCleanJSON();
    this.incrementVersion();
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
      const config = JSON.parse(json);
      const basicTest = config.manifestVersion && config.provisioning && config.availability;
      if (!basicTest) {
        alert('That did not seem to be a valid manifest file.');
        return;
      }
      this.config = config;
      this.createForm();
    }
    catch(e) {
      alert('Not able to parse JSON.');
    }
  },

  toClipboard() {
    const json = this.getCleanJSON();
    this.incrementVersion();
    navigator.clipboard.writeText(json)
    .then(() => {
      alert('JSON copied to clipboard');
    })
    .catch(() => {
      alert('Not able to copy to clipboard');
    })
  },

  apiLink(path, type) {
    const t = apiTypes[type];
    const p = path
      .replace(/\[\*\]/g, '*') // roomos doesnt like list search
      .replaceAll('.', ' ');

    return `https://roomos.cisco.com/xapi/search?search=${p}&Type=${t}`;
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
