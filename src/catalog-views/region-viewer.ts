
import { html, customElement } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';

import { SharedStyles } from '../components/shared-styles.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('region-viewer')
export class RegionViewer extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="card">
            Select regions
        </div>
        `
    }
}
