
import { html, customElement, property } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';

import { SharedStyles } from '../components/shared-styles.js';
import { RootState, store } from '../store.js';
import { ModelDetail } from '../reducers/models.js';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('model-viewer')
export class ModelViewer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model!: ModelDetail;

    static get styles() {
        return [
            SharedStyles
        ];
    }

    protected render() {
        return html`
    <div class="card">
        <h2>${this._model ? this._model.name: ""}</h2>
        Details about the model here
    </div>
    `
    }

    stateChanged(state: RootState) {
        if(state.models && state.models.model) {
            this._model = state.models.model;
        }
    }
}
