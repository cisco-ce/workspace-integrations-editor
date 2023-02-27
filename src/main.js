const model = {

  config: null,

  init() {
    console.log('init');
  },

  async loadFromFile() {
    const data = await (await fetch('./sample/manifest.json')).json();
    console.log('got', data);
    this.config = data;

    // we assume you want to edit the manifest, so we auto update the version number:
    const current = Number(this.config.manifestVersion) || 0;
    this.config.manifestVersion += 1;
  },

  saveToFile() {
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

  apiLink(path) {
    return `https://roomos.cisco.com/xapi/search?search=${path}`;
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
        };
      }),
    };
  },

  addScopeContainer(container) {
    return {
      id: 'apiAccess',
      name: 'API scopes',
      type: 'list',
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
      },
      {
        id: 'manifestVersion',
        name: 'Manifest version',
        type: 'string',
        valuespace: 'number',
        container: this.config,
      },
      {
        id: 'displayName',
        name: 'Display Name',
        type: 'string',
        container: this.config,
      },
      {
        id: 'vendor',
        name: 'Vendor',
        type: 'string',
        container: this.config,
      },
      {
        id: 'email',
        name: 'E-mail',
        type: 'string',
        valuespace: 'email',
        container: this.config,
      },
      {
        id: 'description',
        name: 'Description',
        type: 'text',
        container: this.config,
      },
      this.addScopeContainer(this.config.apiAccess),
      this.addApiContainer('Status', this.config.xapiAccess?.status || []),
      this.addApiContainer('Commands', this.config.xapiAccess?.commands || []),
      this.addApiContainer('Events', this.config.xapiAccess?.events || []),
    ];
  },

};
