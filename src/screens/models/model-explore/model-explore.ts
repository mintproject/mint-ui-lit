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

import "weightless/textfield";
import "weightless/icon";
import "weightless/select";
//import 'multiselect-combo-box/multiselect-combo-box'

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
    private _filter : string = '';

    @property({type: String})
    private _searchType : string = 'full-text';

    private _fullText : {[s: string]: string} = {};

    @property({type: Object})
    private _activeModels : {[s: string]: boolean} = {};

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
            `
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
                //Display only selected model or the search
                html`<model-facet-big style="width:75%;" uri="${this._selectedUri}"></model-facet-big>`
                : this._renderSearch()
            }
        `;
    }

    _renderSearch () {
        return html`
            <div id="model-search-form">
                <!-- https://github.com/andreasbm/weightless/issues/58 -->
                <wl-textfield id="wl-input" label="Search models" @input=${this._onSearchInput} value="${this._filter}">
                    <div slot="after"> 
                        <wl-icon style="${this._filter == '' ? 'display:none;' : ''}" @click="${this._clearSearchInput}">clear</wl-icon> 
                    </div>
                    <div slot="before"> <wl-icon>search</wl-icon> </div>
                </wl-textfield><!--
                --><wl-select label="Search on" @input="${this._onSearchTypeChange}" value="${this._searchType}">
                   <option value="full-text"}">Full text</option>
                   <option value="categories">Categories and keywords</option>
                   <option value="variables">Variable names</option>
                </wl-select>
            </div>

            <!--div class="input_filter">
                <multiselect-combo-box id="search" label="Search" item-value-path="id"
                item-label-path="id"></multiselect-combo-box>
            </div-->

            <div class="search-results">
                ${Object.keys(this._models).map( (key:string) => html`
                    <model-facet 
                        uri="${key}"
                        style="${!this._activeModels[key]? 'display: none;' : ''}">
                    </model-facet>
                    `
                )}
            </div>
        `
    }

    _onSearchInput (ev: any) { //InputEvent) { FIXME
        let input : string = ev.path[0].value.toLowerCase();
        switch (this._searchType) {
            case 'full-text':
                Object.keys(this._models).forEach((key:string) => {
                    this._activeModels[key] = this._fullText[key].includes(input);
                });
                break;
            case 'categories':
            case 'variables':
            default:
                console.log('Nothing to search')
        }

        this._filter = input;
    }

    _clearSearchInput () {
        this._filter = '';
        Object.keys(this._models).forEach((key:string) => {
            this._activeModels[key] = true;
        });
    }

    _onSearchTypeChange (ev:any) {
        this._searchType = ev.path[0].value;
        this._clearSearchInput();

        /*let wlIn = this.shadowRoot!.getElementById("wl-input");
        let input = wlIn!.getElementsByTagName('input')[0];
        input.setAttribute('list', 'datalist')*/
    }

    /*_updateSelector() {
        let qs = this.shadowRoot!.getElementById('search');
        if (qs) {
            let items = new Set();
            if (this._models) {
                Object.values(this._models).forEach((model) => {
                    if (model.categories) {
                        model.categories.forEach((cat:string) => items.add(cat));
                    }
                    if (model.keywords) {
                        model.keywords.forEach((keyword:string) => items.add(keyword));
                    }
                });
            }
            if (items.size > 0) {
                qs!['items'] = Array.from(items).map((x)=>{return {id:x}});
            }
        }
    }*/

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models && this._models != state.explorer.models) {
                this._models = state.explorer.models;
                this._fullText = {};
                this._activeModels = {};
                Object.keys(this._models).forEach( (key:string) => {
                    let model = this._models[key];
                    this._fullText[key] = (model.label
                                           + (model.desc? model.desc : '')
                                           + (model.keywords? model.keywords : '') 
                                           + (model.type? model.type : '')).toLowerCase();
                    this._filter = '';
                    this._activeModels[key] = true;
                });
                //this._updateSelector();
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
