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

  async refreshTable() {
    this.setState({ data: await currentSettings() });
  }

  render({ }, { data }) {
    if (!data) return html`<p>loading...</p>`;

    return (html`
        <button type="button" class="btn btn-primary" onClick=${() => this.addTable()}>New table</button>
        <button type="button" class="btn btn-primary" onClick=${() => this.refreshTable()}>Refresh</button>

        <div class="accordion">
        ${data.libraries ? data.libraries.map(library => html`
        <div class="accordion-item">
          <h2 class="accordion-header" id="head-${library.id}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${library.id}" aria-expanded="true" aria-controls="${library.id}">
            ${library.name}<button type="button" class="btn btn-primary" onClick=${() => this.editTable({ data: library })}>Edit</button>
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
            Fields:<br/>
            <table class="table">
            <thead>
              <tr>
                <th scope="col">DB</th>
                <th scope="col">Name</th>
                <th scope="col">On Add</th>
                <th scope="col">In Chooser</th>
                <th scope="col">Show Name</th>
                <th scope="col">Inherit Properties</th>
              </tr>
            </thead>
            <tbody>
            ${library.fields ? library.fields.map(field => html`<tr>
            <td>${field.column}</td><td>${field.name}</td><td>${trueFalseLabel(field.visible_on_add)}</td><td>${trueFalseLabel(field.visible_in_chooser)}</td><td>${trueFalseLabel(field.show_name)}</td><td>${trueFalseLabel(field.inherit_properties)}</td>
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
