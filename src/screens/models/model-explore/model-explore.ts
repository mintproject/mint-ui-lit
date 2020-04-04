import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { ExplorerStyles } from './explorer-styles'
import { SharedStyles } from 'styles/shared-styles';
import { store, RootState } from 'app/store';

import { goToPage } from 'app/actions';
import { IdMap } from 'app/reducers';

import { isEmpty } from 'model-catalog/util';
import { Model } from '@mintproject/modelcatalog_client';
import { modelsSearchIndex, modelsSearchIntervention, modelsSearchRegion, modelsSearchStandardVariable } from 'model-catalog/actions';

import './model-preview'
import './model-view'

import "weightless/textfield";
import "weightless/icon";
import "weightless/select";

import explorerUI from "./ui-reducers";
store.addReducers({
    explorerUI
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models! : IdMap<Model>;

    @property({type: String})
    private _selectedUri : string = '';

    @property({type: String})
    private _filter : string = '';

    @property({type: String})
    private _searchType : string = 'full-text';

    private _fullText : {[s: string]: string} = {};

    @property({type: Object})
    private _activeModels : {[s: string]: boolean} = {};

    @property({type: Boolean})
    private _loading : boolean = true;

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

            #model-search-results {
                margin: 0 auto;
                overflow: scroll;
                height: calc(100% - 115px);
                width: 100%;
            }

            #model-search-results > model-preview {
                margin: 0 auto;
                width: 75%;
            }

            model-preview {
                display:none;
            }

            model-preview[active] {
                display: block;
            }

            #model-view-cont {
                margin: 0 auto;
                overflow: scroll;
                height: 100%;
                width: 100%;
            }

            #model-view-cont > model-view {
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

            .centered-info {
                padding-bottom: 1em;
                text-align:center;
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
    }

    protected render() {
        return html`
            ${this._selectedUri? 
                //Display only selected model or the search
                html`<div id="model-view-cont"><model-view active></model-view></div>`
                : this._renderSearch()
            }
        `;
    }

    _renderSearch () {
        let hasResults = Object.values(this._activeModels).some(x=>x);
        return html`
            <wl-text class="explanation">
                The MINT model browser allows you to learn about the different models included in MINT.
                Each model can have separate configurations, each representing a unique functionality 
                of that model (particular choices of processes, regions, etc).
                Each configuration can have separate setups that provide different default values for
                files and parameters.
                <br/>
                In the search bar below you can search models in several ways, which you can choose on the right.
                You can search by model name, description, type (e.g. agriculture), keywords (fertilizer),
                areas (e.g. Pongo), variables (e.g. rainfall), index or intervention.
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
                   <option value="full-text">Name, description and keywords</option>
                   <option value="variables">Variable names</option>
                   <option value="index">Index</option>
                   <option value="intervention">Intervention</option>
                   <option value="region">Region</option>
                </wl-select>
            </div>

            <div id="model-search-results">
                ${this._loading? html`
                    <div class="centered-info"><wl-progress-spinner></wl-progress-spinner></div>`
                : (hasResults ? 
                    Object.keys(this._models).map((key:string) => html`
                    <model-preview .id="${key}" ?active="${this._activeModels[key]}">

                      <div slot="description">
                        ${this._models[key].description}
                      </div>

                    </model-preview>`)
                    :html`<div class="centered-info">
                        <wl-text style="font-size: 1.4em;">No model fits the search parameters</wl-text>
                    </div>`)
                }
            </div>
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
                this._searchByFullText(input);
                break;
            case 'variables':
                this._searchByVariableName(input);
                break;
            case 'index':
                this._searchByIndex(input);
                break;
            case 'intervention':
                this._searchByIntervention(input);
                break;
            case 'region':
                this._searchByRegion(input);
                break;
            default:
                console.log('Invalid search type')
        }

        this._filter = input;
    }

    _clearSearchInput () {
        this._filter = '';
        Object.keys(this._models).forEach((key:string) => {
            this._activeModels[key] = true;
        });
    }

    _onSearchTypeChange () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('search-type-selector');
        if (!selectElement) return;

        this._searchType = selectElement['value'].toLowerCase();
        this._clearSearchInput();
    }

    _searchByFullText (input:string) {
        Object.keys(this._models).forEach((key:string) => {
            this._activeModels[key] = this._fullText[key].includes(input);
        });
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
            this._lastTimeout = setTimeout(
                ()=>{ 
                    let req = modelsSearchStandardVariable(input);
                    req.then((result:any) => {
                        let validIds = result.map(x => x.id);

                        Object.keys(this._models).forEach((key:string) => {
                            this._activeModels[key] = (validIds.indexOf(key) >= 0);
                        });
                        this._loading=false;
                    });
                },
                750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    _searchByIndex (input:string) {
        this._loading=true;
        if (this._lastTimeout) {
            clearTimeout(this._lastTimeout);
        }
        if (input) {
            Object.keys(this._models).forEach((key:string) => {
                this._activeModels[key] = false;
            })
            this._lastTimeout = setTimeout(
                ()=>{ 
                    let req = modelsSearchIndex(input);
                    req.then((result:any) => {
                        let validIds = result.map(x => x.id);

                        Object.keys(this._models).forEach((key:string) => {
                            this._activeModels[key] = (validIds.indexOf(key) >= 0);
                        });
                        this._loading=false;
                    });
                }, 750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    _searchByIntervention (input:string) {
        this._loading=true;
        if (this._lastTimeout) {
            clearTimeout(this._lastTimeout);
        }
        if (input) {
            Object.keys(this._models).forEach((key:string) => {
                this._activeModels[key] = false;
            })
            this._lastTimeout = setTimeout(
                ()=>{ 
                    let req = modelsSearchIntervention(input);
                    req.then((result:any) => {
                        let validIds = result.map(x => x.id);

                        Object.keys(this._models).forEach((key:string) => {
                            this._activeModels[key] = (validIds.indexOf(key) >= 0);
                        });
                        this._loading=false;
                    });
                }, 750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    _searchByRegion (input:string) {
        this._loading=true;
        if (this._lastTimeout) {
            clearTimeout(this._lastTimeout);
        }
        if (input) {
            Object.keys(this._models).forEach((key:string) => {
                this._activeModels[key] = false;
            })
            this._lastTimeout = setTimeout(
                ()=>{ 
                    let req = modelsSearchRegion(input);
                    req.then((result:any) => {
                        let validIds = result.map(x => x.id);

                        Object.keys(this._models).forEach((key:string) => {
                            this._activeModels[key] = (validIds.indexOf(key) >= 0);
                        });
                        this._loading=false;
                    });
                }, 750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    stateChanged(state: RootState) {
        if (state.explorerUI && state.explorerUI.selectedModel != this._selectedUri) {
            this._selectedUri = state.explorerUI.selectedModel;
        }

        if (state.modelCatalog) {
            let db = state.modelCatalog;
            if (this._models != db.models && !isEmpty(db.models)) {
                this._models = db.models;

                /* Computing full-text search */
                this._fullText = {};
                Object.values(this._models).forEach((model:Model) => {
                    this._fullText[model.id] = (
                        (model.label ? model.label.join() : '') +
                        (model.description ? model.description.join() : '') +
                        (model.keywords ? model.keywords.join() : '')
                    ).toLowerCase();
                });
                this._activeModels = {};
                if (!this._filter) {
                    Object.keys(this._models).forEach((key:string) => {
                        this._activeModels[key] = true;
                    });
                } else {
                    this._searchByFullText(this._filter);
                }
                this._loading = false;
            }
        }
    }
}
