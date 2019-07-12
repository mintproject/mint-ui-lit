
import { html, customElement, property } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';

import { SharedStyles } from '../components/shared-styles.js';
import { RootState, store } from '../store.js';
import { DatasetDetail } from '../reducers/datasets.js';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('dataset-viewer')
export class DatasetViewer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _dataset!: DatasetDetail;
        
    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
    <div class="card">
        <h2>${this._dataset.name}</h2>
        Details about the dataset here
    </div>
    `
    }

    stateChanged(state: RootState) {
        if(state.datasets && state.datasets.dataset) {
            this._dataset = state.datasets.dataset;
        }
    }
}
