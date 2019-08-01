
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';

import { SharedStyles } from '../../../styles/shared-styles';
import { store, RootState } from '../../../app/store';

import { goToPage } from '../../../app/actions';

import { explorerFetch } from './actions';
import explorer from "./reducers";
import explorerUI from "./ui-reducers";
import { UriModels } from './reducers';

import './model-facet'
import './model-facet-big'

import "weightless/card";
import "weightless/textfield";
import "weightless/icon";

store.addReducers({
    explorer,
    explorerUI
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models : UriModels = {} as UriModels;

    @property({type: String})
    private _selectedUri : string = '';

    @property({type: String})
    private filter : string = '';

    private _lastInput : string = '';

    static get styles() {
        return [SharedStyles,
            css `
            .noselect {
                  -webkit-touch-callout: none; /* iOS Safari */
                    -webkit-user-select: none; /* Safari */
                     -khtml-user-select: none; /* Konqueror HTML */
                       -moz-user-select: none; /* Firefox */
                        -ms-user-select: none; /* Internet Explorer/Edge */
                            user-select: none; /* Non-prefixed version, currently
                                                  supported by Chrome and Opera */
            }

            wl-button {
                padding: 6px 10px;
            }

            .input_filter {
                padding: 1em 0;
                width: 75%;
                margin: 0 auto;
            }

            .input_filter label {
                margin-right: 6px;
                padding: 0px;
                font-size: 1.2em;
                line-height: 1.2em;
                display: inline-block;
                vertical-align:middle;
                width: 30px;
            }

            .input_filter input {
                display: inline-block;
                line-height: 1.3em;
                width: calc(100% - 40px);
            }

            .search-results {
                margin: 0 auto;
                overflow: scroll;
                height: 100%;
                width: 75%;
            }`
        ];
    }

    protected render() {
        return html`
            <div class="cltrow scenariorow">
                ${this._selectedUri?
                html`
                <wl-button flat inverted @click="${()=> goToPage('models/explore')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                    <wl-title level="3" style="margin: 0px; cursor: pointer;" 
                            @click="${()=> goToPage('models/explore')}">Model Catalog</wl-title>
                </div>
                `
                : html`
                <wl-button flat inverted @click="${()=> goToPage('models')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                    <wl-title level="3" style="margin: 0px;">Model Catalog</wl-title>
                </div>
                `}
            </div>

            ${this._selectedUri? 
                //Display only selected model
                html`
                    <model-facet-big
                        style="width:75%;"
                        uri="${this._selectedUri}">
                    </model-facet-big>
                ` // Display search results
                : html `
                <div class="search_input input_full input_filter">
                    <label for="filter" class='noselect'>
                        <wl-icon>search</wl-icon>
                    </label>
                    <input value="${this.filter}"
                        placeholder="Search models here..."
                        type="search"
                        @keyup="${this.filterUpdate}"
                        id="filter"
                        name="filter"></input>
                </div>

                <div class="search-results">
                    ${Object.keys(this._models).map( (key:string) => {
                        let text : string = this._models[key].label
                        if (this._models[key].desc) text +=     this._models[key].desc;
                        if (this._models[key].keywords) text += this._models[key].keywords;
                        if (this._models[key].categories) text +=    this._models[key].categories.join();
                        let st = ''
                        if (!text.toLowerCase().includes(this.filter)) {
                            st = 'display: none;'
                        }
                        return html`
                        <model-facet 
                            uri="${key}"
                            style="${st}">
                        </model-facet>
                        `
                    })}
                </div>
            `
            }
        `;
    }

    filterUpdate (ev:any) {
        let input : string = ev.path[0].value;
        if (this._lastInput != input) {
            //TODO: some time between event and filter?
            //Filter is case insensitive
            this._lastInput = input.toLowerCase();
            this.filter = this._lastInput;
        }
    }

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models) {
                this._models = state.explorer.models;
            }
        }
        if (state.explorerUI && state.explorerUI.selectedModel != this._selectedUri) {
            if (state.explorer && state.explorer.models[state.explorerUI.selectedModel]) {
                this._selectedUri = state.explorerUI.selectedModel;
            } else {
                this._selectedUri = '';
            }
        }
    }
}
