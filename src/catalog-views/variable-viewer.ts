
import { html, customElement } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';

import { SharedStyles } from '../components/shared-styles.js';

@customElement('variable-viewer')
export class VariableViewer extends PageViewElement {
    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
    <div class="card">
        Details about the variable here
    </div>
    `
    }
}
