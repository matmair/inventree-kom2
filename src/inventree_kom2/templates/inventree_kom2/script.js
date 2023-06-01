import { h, Component, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);


async function currentSettings() {
    const response = await fetch('api/tables');
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

    async refreshTable() {
      this.setState({ data: await currentSettings() });
  }

    render({ }, { data }) {
        if (!data) return html`<p>loading...</p>`;

        return (html`
        <button onClick=${() => this.refreshTable()}>Refresh</button>

        <div class="accordion">
        ${data.libraries ? data.libraries.map(library => html`
        <div class="accordion-item">
          <h2 class="accordion-header" id="head-${library.id}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${library.id}" aria-expanded="true" aria-controls="${library.id}">${library.name}</button>
          </h2>
          <div id="${library.id}" class="accordion-collapse collapse" aria-labelledby="head-${library.id}"><div class="accordion-body">
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
            </tr>`): html`<p>No fields</p>`}
            </tbody>
            </table>
          </div></div>
        </div>
        `): html`<p>No libraries</p>`}
        </div>
        `
        );
    }
}

function App (props) {
    return html`<div><${Kom2Settings}/></div>`;
};

let root = document.getElementById('inventree-kom2/root')
render(html`<${App}/>`, root);
root.style.backgroundColor = null;
