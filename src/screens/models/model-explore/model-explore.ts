
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';

import { SharedStyles } from '../../../styles/shared-styles';
import { store, RootState } from '../../../app/store';

import { explorerFetch } from './actions';
import explorer, {FetchedModel} from "./reducers";

import './model-facet'
import './model-facet-big'

import "weightless/card";
//import "@cwmr/paper-search";
//import '@polymer/paper-input/paper-input.js';
//import { search } from '../actions/search';

store.addReducers({
    explorer
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models : Array<FetchedModel> = [];

    private _selected! : FetchedModel;

    static get styles() {
        return [
            css `
            .small-card {
                padding: 20px 150px 0px 150px;
            }
            .padd {
                padding: 20px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        console.log(this._selected)
        return html`
            ${this._selected ? 
                //BIG MODEL
                html`
                    <model-facet-big
                        style="width:75%;"
                        name="${this._selected.model}"
                        id="${this._selected.label}">
                    </model-facet-big>
                `
                : html `
                <div class="small-card">
                    <paper-search-panel 
                        placeholder="Search models...">
                    </paper-search-panel>
                    ${this._models.map((mod) => {
                        return html`
                        <model-facet 
                            class="padd"
                            id="${mod.model}"
                            name="${mod.label}">
                        </model-facet>
                        `
                    })}
            `
            }
        `;
    }

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        //console.log(state)
        if (state.explorer) {
            if (state.explorer.models) {
                this._models = state.explorer.models;
            }
            if (state.explorer.selected) {
                this._selected = state.explorer.selected;
            }
        }
    }
}
