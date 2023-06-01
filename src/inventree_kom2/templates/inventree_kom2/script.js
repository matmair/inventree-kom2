import { h, Component, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);


async function currentSettings() {
    const response = await fetch('api/tables');
    const tables = await response.json();
    return tables;
}

export class Kom2Settings extends Component {
    async componentDidMount() {
        let data = await currentSettings();
        this.setState({ data: data });
    }
    render({ }, { data }) {
        if (!data) return html`<p>loading...</p>`;

        return (html`

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
            Fields: ${library.fields}<br/>
            Properties: ${library.properties}<br/>
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
