
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';

import { SharedStyles } from '../../../styles/shared-styles';
import { store, RootState } from '../../../app/store';

import { goToPage } from '../../../app/actions';

import { explorerFetch } from './actions';
import explorerReducer from "./reducers";
import explorerUIReducer from "./ui-reducers";
import { UriModels, FetchedModel } from './state';

import './model-facet'
import './model-facet-big'

import "weightless/card";
import "weightless/textfield";
import "weightless/icon";

store.addReducers({
    explorerReducer,
    explorerUIReducer
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models : UriModels = {} as UriModels;

    @property({type: Object})
    private _selected : FetchedModel | null = null;

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

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }

            .small-card {
                padding: 20px 150px 0px 150px;
            }`
        ];
    }

    protected render() {
        return html`
            <div class="cltrow scenariorow">
                ${this._selected?
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

                <!--<wl-icon 
                    class="actionIcon editIcon bigActionIcon">edit</wl-icon>
                <wl-icon 
                    class="actionIcon deleteIcon bigActionIcon">delete</wl-icon>-->
            </div>

            <!--<div class="twocolumns">
                <div class="left">
                    <div class="clt">
                        <div class="cltrow_padded scenariorow">
                            <div class="cltmain">
                                <wl-title level="4" style="margin: 0px">TITLE</wl-title>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right">
                </div>
            </div>-->
            ${this._selected? 
                //BIG MODEL
                html`
                    <model-facet-big
                        style="width:75%;"
                        uri="${this._selected.uri}">
                    </model-facet-big>
                `
                : html `
                <div class="small-card">
                    <!-- FIXME: This is not working due to https://github.com/Polymer/lit-html/issues/399
                    <wl-textfield 
                            label="Search models"
                            type="search">
                    </wl-textfield>-->

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
            if (state.explorer.selectedModel != this._selectedUri) {
                if (state.explorer.models[state.explorer.selectedModel]) {
                    this._selectedUri = state.explorer.selectedModel;
                    this._selected = state.explorer.models[this._selectedUri];
                } else {
                    this._selectedUri = '';
                    this._selected = null;
                }
            }
        }
    }
}
