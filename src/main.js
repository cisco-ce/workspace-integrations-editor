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

  config: null,
  showJson: false,
  datalists: [],
  form: [],

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
    const json = await fetchJson('./sample/manifest.json');
    this.setJson(json);
    this.incrementVersion();
  },

  async createNew() {
    const json = await fetchJson('./sample/new.json');
    this.setJson(json);
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
      this.createForm();
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


  addApiContainer(type, container, placeholder) {
    return {
      id: type,
      name: type,
      type: 'list',
      placeholder,
      add: () => {
        container.push({
          "path": "",
          "access": "required"
        });
        this.createForm();
      },
      remove: (index) => {
        container.splice(index, 1);
        this.createForm();
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
        });
        this.createForm();
      },
      remove: (index) => {
        container.splice(index, 1);
        this.createForm();
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

  validateManifest() {
    let errors = 0;
    this.form.forEach((input) => {
      if (input.type !== 'list') {
        let value = input.container[input.id];
        if (value && value.trim) {
          value = value.trim();
        }
        input.error = (input.required && !value)
          ? 'Field is required'
          : null;
        if (input.error) {
          errors += 1;
        }
      }
    });

    const msg = errors ? `Manifest contains ${errors} errors` : 'Manifest is valid!';
    alert(msg);
  },

  createForm() {
    if (!this.config) return [];

    this.form = [
      {
        id: 'id',
        name: 'ID',
        type: 'string',
        container: this.config,
        required: true,
        placeholder: 'UUID',
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
        placeholder: 'Name of integration, as it will appear on Control Hub',
      },
      {
        id: 'vendor',
        name: 'Vendor',
        type: 'string',
        container: this.config,
        required: true,
        placeholder: 'Company that created the integration'
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
        placeholder: 'A description of what the integration does and what value it will provide to the customer'
      },
      {
        id: 'availability',
        name: 'Availability',
        type: 'select',
        values: ['global', 'org_private'],
        container: this.config,
        required: true,
      },
      {
        id: 'descriptionUrl',
        name: 'Description URL',
        type: 'string',
        container: this.config,
        placeholder: 'URL to more details about the integration '
      },
      {
        id: 'tocUrl',
        name: 'Terms URL',
        type: 'string',
        container: this.config,
        placeholder: 'URL to terms and conditions',
        required: this.config.availability === 'global',
      },
      this.addScopeContainer(this.config.apiAccess),
      this.addApiContainer('Status', this.config.xapiAccess?.status || [], 'eg Standby.State, RoomAnalytics.*'),
      this.addApiContainer('Command', this.config.xapiAccess?.commands || [], 'eg Message.Send', 'UserInterface.Extensions.*'),
      this.addApiContainer('Event', this.config.xapiAccess?.events || [], 'eg BootEvent, UserInterface.*'),
    ];
  },

};
