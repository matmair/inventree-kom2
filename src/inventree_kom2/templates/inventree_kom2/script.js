import { h, Component, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);


async function currentSettings() {
  const response = await fetch('api/tables');
  const tables = await response.json();
  return tables;
}

async function createSetting(data) {
  const response = await fetch('api/table-add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ data })
  });
  const tables = await response.json();
  return tables;
}

async function deleteSetting(data) {
  const response = await fetch('api/table-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ data })
  })
  const tables = await response.json();
  return tables;
}

async function createField(data) {
  const response = await fetch('api/field-add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ data })
  });
  const tables = await response.json();
  return tables;
}

async function deleteField(data) {
  const response = await fetch('api/field-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ data })
  })
  const tables = await response.json();
  return tables;
}

function trueFalseLabel(value) {
  return value ? html`<span class="badge bg-success">True</span>` : html`<span class="badge bg-danger">False</span>`;
}

export class Kom2Settings extends Component {
  async componentDidMount() {
    let data = await currentSettings();
    this.setState({ data: data });
  }

  async addTable(data, edit) {
    class TodoForm extends Component {
      state = {
        val_name: '',
        val_table: '',
        val_key: '',
        val_symbols: '',
        val_footprints: '',
        val_description: '',
        val_keywords: '',
      };
      async componentDidMount() {
        if (this.props.edit) {
          let data = this.props.data;
          this.setState({
            val_name: data.name,
            val_table: data.table,
            val_key: data.key,
            val_symbols: data.symbols,
            val_footprints: data.footprints,
            val_description: data.properties.description,
            val_keywords: data.properties.keywords,
          });
        }
      }

      onSubmit = e => {
        e.preventDefault();

        // Define data
        let data = {
          name: this.state.val_name,
          table: this.state.val_table,
          key: this.state.val_key,
          symbols: this.state.val_symbols,
          footprints: this.state.val_footprints,
          description: this.state.val_description,
          keywords: this.state.val_keywords,
        }
        if (this.props.edit) {
          data.id = this.props.data.id;
        }

        // Process
        createSetting(data).then(resp => {
          if (resp.status == 'ok') {
            this.parent.refreshTable();
            $(modal).modal('hide');
          } else {
            alert('Error');
          }
        });
      }

      onInput = (e, name) => {
        const { value } = e.target;
        this.setState({ [name]: value })
      }

      render({ parent, data, edit }, { val_name, val_table, val_key, val_symbols, val_footprints, val_description, val_keywords }) {
        this.parent = parent;
        return (html`
            <form onSubmit=${this.onSubmit}>
              <p>Name</p>
              <input type="text" value=${val_name} onInput=${e => this.onInput(e, 'val_name')} />
              <p>Table</p>
              <input type="text" value=${val_table} onInput=${e => this.onInput(e, 'val_table')} />
              <p>Key</p>
              <input type="text" value=${val_key} onInput=${e => this.onInput(e, 'val_key')} />
              <p>Symbols</p>
              <input type="text" value=${val_symbols} onInput=${e => this.onInput(e, 'val_symbols')} />
              <p>Footprints</p>
              <input type="text" value=${val_footprints} onInput=${e => this.onInput(e, 'val_footprints')} />
              <p>Description</p>
              <input type="text" value=${val_description} onInput=${e => this.onInput(e, 'val_description')} />
              <p>Keywords</p>
              <input type="text" value=${val_keywords} onInput=${e => this.onInput(e, 'val_keywords')} />

              <button type="submit">Submit</button>
            </form>`
        );
      }
    }

    var modal = createNewModal({
      title: 'Add new table',
      closeText: 'Close',
      hideSubmitButton: true,
    });
    render(html`<${TodoForm} parent=${this} data=${data} edit=${edit}/>`, document.getElementById('form-content'));
    $(modal).modal('show');
  }

  async editTable({ data }) {
    this.addTable(data, true);
  }

  async deleteTable(id) {
    if (confirm('Are you sure?')) {
      deleteSetting({ id: id }).then(resp => {
        if (resp.status == 'ok') {
          this.refreshTable();
        } else {
          alert('Error');
        }
      });
    }
  }

  async addField({data, edit, id}) {
    class TodoForm extends Component {
      state = {
        val_column: '',
        val_name: '',
        val_visible_on_add: false,
        val_visible_in_chooser: false,
        val_show_name: false,
        val_inherit_properties: false,
      };
      async componentDidMount() {
        if (this.props.edit) {
          let data = this.props.data;
          this.setState({
            val_column: data.column,
            val_name: data.name,
            val_visible_on_add: data.visible_on_add,
            val_visible_in_chooser: data.visible_in_chooser,
            val_show_name: data.show_name,
            val_inherit_properties: data.inherit_properties,
          });
        }
      }

      onSubmit = e => {
        e.preventDefault();

        // Define data
        let data = {
          id: this.props.id,
          column: this.state.val_column,
          name: this.state.val_name,
          visible_on_add: this.state.val_visible_on_add,
          visible_in_chooser: this.state.val_visible_in_chooser,
          show_name: this.state.val_show_name,
          inherit_properties: this.state.val_inherit_properties,
        }

        // Process
        createField(data).then(resp => {
          if (resp.status == 'ok') {
            this.parent.refreshTable();
            $(modal).modal('hide');
          } else {
            alert('Error');
          }
        });
      }

      onInput = (e, name) => {
        const { value } = e.target;
        this.setState({ [name]: value })
      }

      render({ parent, data, edit }, { val_column, val_name, val_visible_on_add, val_visible_in_chooser, val_show_name, val_inherit_properties }) {
        this.parent = parent;
        return (html`

            <form onSubmit=${this.onSubmit}>
              <p>DB</p>
              <input type="text" value=${val_column} onInput=${e => this.onInput(e, 'val_column')} disabled=${edit}/>
              <p>Name</p>
              <input type="text" value=${val_name} onInput=${e => this.onInput(e, 'val_name')} />
              <p>On add</p>
              <input type="checkbox" checked=${val_visible_on_add} onInput=${e => this.onInput(e, 'val_visible_on_add')} />
              <p>In chooser</p>
              <input type="checkbox" checked=${val_visible_in_chooser} onInput=${e => this.onInput(e, 'val_visible_in_chooser')} />
              <p>Show name</p>
              <input type="checkbox" checked=${val_show_name} onInput=${e => this.onInput(e, 'val_show_name')} />
              <p>Inherited</p>
              <input type="checkbox" checked=${val_inherit_properties} onInput=${e => this.onInput(e, 'val_inherit_properties')} />

              <button type="submit">Submit</button>
            </form>`
        );
      }
    }

    var modal = createNewModal({
      title: 'Add new field',
      closeText: 'Close',
      hideSubmitButton: true,
    });
    render(html`<${TodoForm} parent=${this} data=${data} edit=${edit} id=${id}/>`, document.getElementById('form-content'));
    $(modal).modal('show');
  }

  async editField({ data, id }) {
    this.addField({data: data, edit: true, id: id});
  }

  async deleteField(data) {
    if (confirm('Are you sure?')) {
      deleteField(data).then(resp => {
        if (resp.status == 'ok') {
          this.refreshTable();
        } else {
          alert('Error');
        }
      });
    }
  }

  async refreshTable() {
    this.setState({ data: await currentSettings() });
  }

  render({ }, { data }) {
    if (!data) return html`<p>loading...</p>`;

    return (html`
      <div class="d-grid gap-2 w-100 py-2 d-md-flex justify-content-md-end">
        <button type="button" class="btn btn-primary" onClick=${() => this.addTable()}>Add Table</button>
        <button type="button" class="btn btn-primary" onClick=${() => this.refreshTable()}>Refresh</button>
      </div>

        <div class="accordion">
        ${data.libraries ? data.libraries.map(library => html`
        <div class="accordion-item">
          <h2 class="accordion-header" id="head-${library.id}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${library.id}" aria-expanded="true" aria-controls="${library.id}">
              ${library.name}
              <div class="d-grid gap-2 w-100 d-md-flex justify-content-md-end">
                <button type="button" class="btn btn-outline-primary" onClick=${() => this.editTable({ data: library })}>Edit</button>
                <button type="button" class="btn btn-outline-danger me-4" onClick=${() => this.deleteTable(library.id)}>Delete</button>
              </div>
            </button>
          </h2>
          <div id="${library.id}" class="accordion-collapse collapse" aria-labelledby="head-${library.id}"><div class="accordion-body">
            Id: ${library.id}<br/>
            Name: ${library.name}<br/>
            Table: ${library.table}<br/>
            Key: ${library.key}<br/>
            Symbols: ${library.symbols}<br/>
            Footprints: ${library.footprints}<br/>
            Description: ${library.properties.description}<br/>
            Keywords: ${library.properties.keywords}<br/>
            Fields: <button type="button" class="btn btn-primary" onClick=${() => this.addField({id: library.id})}>Add Field</button><br/>
            <table class="table">
            <thead>
              <tr>
                <th scope="col">DB</th>
                <th scope="col">Name</th>
                <th scope="col">On Add</th>
                <th scope="col">In Chooser</th>
                <th scope="col">Show Name</th>
                <th scope="col">Inherit Properties</th>
                <th scope="col"><i>Actions</i></t<h>
              </tr>
            </thead>
            <tbody>
            ${library.fields ? library.fields.map(field => html`<tr>
            <td>${field.column}</td><td>${field.name}</td><td>${trueFalseLabel(field.visible_on_add)}</td><td>${trueFalseLabel(field.visible_in_chooser)}</td><td>${trueFalseLabel(field.show_name)}</td><td>${trueFalseLabel(field.inherit_properties)}</td>
            <td><button type="button" class="btn btn-outline-primary" onClick=${() => this.editField({ data: field, id: library.id })}>Edit</button><button type="button" class="btn btn-outline-danger ms-4" onClick=${() => this.deleteField({column: field.column, id: library.id })}>Delete</button></td>
            </tr>`) : html`<p>No fields</p>`}
            </tbody>
            </table>
          </div></div>
        </div>
        `) : html`<p>No libraries</p>`}
        </div>
        `
    );
  }
}

function App(props) {
  return html`<div><${Kom2Settings}/></div>`;
};

let root = document.getElementById('inventree-kom2/root')
render(html`<${App}/>`, root);
root.style.backgroundColor = null;
