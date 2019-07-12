var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { html, customElement, property } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';
import { SharedStyles } from '../components/shared-styles.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin';
let ModelViewer = class ModelViewer extends connect(store)(PageViewElement) {
    static get styles() {
        return [
            SharedStyles
        ];
    }
    render() {
        return html `
    <div class="card">
        <h2>${this._model ? this._model.name : ""}</h2>
        Details about the model here
    </div>
    `;
    }
    stateChanged(state) {
        if (state.models && state.models.model) {
            this._model = state.models.model;
        }
    }
};
__decorate([
    property({ type: Object })
], ModelViewer.prototype, "_model", void 0);
ModelViewer = __decorate([
    customElement('model-viewer')
], ModelViewer);
export { ModelViewer };
