import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../../components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';

import { ExplorerStyles } from './explorer-styles'
import { SharedStyles } from '../../../styles/shared-styles';
import { store, RootState } from '../../../app/store';

import { goToPage } from '../../../app/actions';

import { fetchSearchModelByVarSN } from '../../../util/model-catalog-actions';
import { explorerSetCompareA, explorerSetCompareB } from "./ui-actions";
import explorer from '../../../util/model-catalog-reducers';
import explorerUI from "./ui-reducers";
import { UriModels } from '../../../util/model-catalog-reducers';

import './model-preview'
import './model-view'
import './model-edit'
import './model-compare'

import "weightless/textfield";
import "weightless/icon";
import "weightless/select";

store.addReducers({
    explorer,
    explorerUI
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models! : UriModels;// = {} as UriModels;

    @property({type: String})
    private _selectedUri : string = '';

    @property({type: String})
    private _mode : string = 'view';

    @property({type: String})
    private _filter : string = '';

    @property({type: String})
    private _searchType : string = 'full-text';

    private _fullText : {[s: string]: string} = {};
    private _variables : {[s: string]: string} = {};

    @property({type: Object})
    private _activeModels : {[s: string]: boolean} = {};

    @property({type: Number})
    private _activeCount : number = 0;

    @property({type: Boolean})
    private _loading : boolean = true;

    @property({type: Number})
    private _comparing : number = 0;

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
            }

            .cltrow {
                padding-bottom: 1em;
            }

            wl-button {
                padding: 6px 10px;
            }

            #model-comparison {
                margin: 0 auto;
                width: 75%;
                max-height: 100%;
                overflow: scroll;
            }

            #model-search-results {
                margin: 0 auto;
                overflow: scroll;
                height: calc(100% - 100px);
                width: 100%;
            }

            #model-search-results > model-preview {
                margin: 0 auto;
                display: block;
                width: 75%;
            }

            #model-view-cont {
                margin: 0 auto;
                overflow: scroll;
                height: 100%;
                width: 100%;
            }

            #model-view-cont > model-view, model-edit {
                margin: 0 auto;
                display: block;
                width: 75%;
            }

            #model-search-form {
                margin: 0 auto;
                overflow: scroll;
                width: 75%;
                padding-bottom: 1em;
            }

            #model-search-form > * {
                display: inline-block;
                vertical-align: middle;
            }

            #model-search-form > wl-textfield {
                width:70%;
            }

            #model-search-form > wl-select {
                width: calc(30% - 10px);
                padding-left: 10px;
            }

            #model-search-form > wl-textfield > div[slot="after"] > wl-icon {
                cursor: pointer;
            }

            .explanation {
                display: block;
                margin: 0 auto;
                width: 75%;
                color: rgb(102, 102, 102);
                font-size: 13px;
            }
            `
        ];
    }

    _goToExplorer () {
        goToPage('models/explore');
        if (this._comparing === 2) {
            store.dispatch(explorerSetCompareA({}));
            store.dispatch(explorerSetCompareB({}));
        }
    }

    protected render() {
        return html`
            ${this._selectedUri? 
                //Display only selected model or the search
                (this._mode === 'view' ?
                    html`<div id="model-view-cont"><model-view></model-view></div>`
                    : html`<div id="model-view-cont"><model-edit></model-edit></div>`
                )
                : this._renderSearch()
            }
        `;
    }

    _renderSearch () {
        return html`
            ${this._comparing>0? html`
            <div id="model-comparison" style="padding-bottom: 1em;"> <model-compare></model-compare> </div>
            ` :html``}
            ${this._comparing<2? html`
            <wl-text class="explanation">
                The model catalog browser lets you explore the characteristics of different models
                included in MINT. Models include different configurations that expose a unique way
                of running that model; and configuration setups that provide default files and
                parameters to facilitate their execution in MINT.
                <br/>
                In the search bar below you can search a model by its name, keywords or variables.
                For example try searching <i>'fertilizer'</i> or <i>'flow'</i>.
            </wl-text>
            <div id="model-search-form">
                <!-- https://github.com/andreasbm/weightless/issues/58 -->
                <wl-textfield id="search-input" label="Search models" @input=${this._onSearchInput} value="${this._filter}">
                    <div slot="after"> 
                        <wl-icon .style="${this._filter == '' ? 'display:none;' : ''}" @click="${this._clearSearchInput}">clear</wl-icon> 
                    </div>
                    <div slot="before"> <wl-icon>search</wl-icon> </div>
                </wl-textfield><!--
                --><wl-select id="search-type-selector" label="Search on" @input="${this._onSearchTypeChange}" value="${this._searchType}">
                   <option value="full-text">Full text</option>
                   <option value="variables">Variable names</option>
                </wl-select>
            </div>

            <div id="model-search-results">
                <div style="padding-bottom: 1em; text-align:center;">
                ${this._loading? html`
                    <wl-progress-spinner></wl-progress-spinner>`
                : html`
                ${this._activeCount == 0? html`<wl-text style="font-size: 1.4em;">No model fits the search parameters</wl-text>`: html``}
                `}
                </div>

                ${Object.keys(this._models).map( (key:string) => html`
                    <model-preview 
                        uri="${key}"
                        altDesc="${this._variables[key] ? this._variables[key] : ''}"
                        altTitle="${this._variables[key] ? 'With Variables ('+this._variables[key].split(';').length+'):' : ''}"
                        .style="${!this._activeModels[key]? 'display: none;' : ''}">
                    </model-preview>
                    `
                )}
            </div>
            ` : html``}
        `
    }

    updated () {
        let searchSelector = this.shadowRoot.getElementById('search-type-selector');
        let arrow = searchSelector ? searchSelector.shadowRoot.getElementById('arrow') : null;
        if (arrow) {
            arrow.style.pointerEvents = "none";
        }
    }

    _onSearchInput () {
        let inputElement : HTMLElement | null = this.shadowRoot!.getElementById('search-input');
        if (!inputElement) return;

        let input : string = inputElement['value'].toLowerCase();
        switch (this._searchType) {
            case 'full-text':
                let count = 0;
                Object.keys(this._models).forEach((key:string) => {
                    this._activeModels[key] = this._fullText[key].includes(input);
                    if (this._activeModels[key]) count += 1;
                });
                this._activeCount = count;
                break;
            case 'variables':
                this._searchByVariableName(input);
                break;
            default:
                console.log('Invalid search type')
        }

        this._filter = input;
    }

    _clearSearchInput () {
        this._filter = '';
        let count = 0;
        Object.keys(this._models).forEach((key:string) => {
            this._activeModels[key] = true;
            count += 1;
        });
        this._activeCount = count;
    }

    _onSearchTypeChange () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('search-type-selector');
        if (!selectElement) return;

        this._searchType = selectElement['value'].toLowerCase();
        this._clearSearchInput();
        this._variables = {};
    }

    _lastTimeout:any;
    _searchByVariableName (input:string) {
        this._loading=true;
        if (this._lastTimeout) {
            clearTimeout(this._lastTimeout);
        }
        if (input) {
            Object.keys(this._models).forEach((key:string) => {
                this._activeModels[key] = false;
            })
            this._activeCount = 0;
            this._lastTimeout = setTimeout(
                ()=>{ store.dispatch(fetchSearchModelByVarSN(input)); },
                750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models && this._models != state.explorer.models) {
                this._models = state.explorer.models;
                this._fullText = {};
                this._activeModels = {};
                let count = 0;
                Object.keys(this._models).forEach((key:string) => {
                    let model = this._models[key];
                    this._fullText[key] = (model.label
                                           + (model.desc? model.desc : '')
                                           + (model.keywords? model.keywords : '') 
                                           + (model.type? model.type : ''))
                                           + (model.regions ? model.regions : '');
                    this._fullText[key] = this._fullText[key].toLowerCase();
                    this._filter = '';
                    this._activeModels[key] = true;
                    count += 1;
                });
                this._activeCount = count;
                if (count > 0)
                    this._loading = false;
            }

            if (state.explorer.search && state.explorer.search[this._filter]) {
                Object.keys(this._models).forEach((key:string) => {
                    this._activeModels[key] = false;
                });
                let count = 0;
                this._variables = {};
                Object.keys(state.explorer.search[this._filter]).forEach((key:string) =>{
                    this._activeModels[key] = true;
                    this._variables[key] = state.explorer!.search[this._filter][key].join(';');
                    count += 1;
                });
                this._activeCount = count;
                this._loading = false;
            }
        }
        if (state.explorerUI && state.explorerUI.selectedModel != this._selectedUri) {
            if (state.explorer && state.explorer.models[state.explorerUI.selectedModel]) {
                this._selectedUri = state.explorerUI.selectedModel;
            } else {
                this._selectedUri = '';
            }
        }

        if (state.explorerUI) {
            this._comparing = 0;
            if ( state.explorerUI.compareA && state.explorerUI.compareA.model) this._comparing += 1;
            if ( state.explorerUI.compareB && state.explorerUI.compareB.model) this._comparing += 1;
            this._mode = state.explorerUI.mode;
        }
    }
}
