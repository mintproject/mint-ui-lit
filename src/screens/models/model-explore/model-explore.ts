import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { ExplorerStyles } from './explorer-styles'
import { SharedStyles } from 'styles/shared-styles';
import { store, RootState } from 'app/store';

import { goToPage } from 'app/actions';
import { IdMap } from 'app/reducers';

import { isEmpty, uriToId, getLabel } from 'model-catalog/util';
import { Model, NumericalIndex } from '@mintproject/modelcatalog_client';
import { modelsSearchIndex, modelsSearchIntervention, numericalIndexsGet,
         modelsSearchRegion, modelsSearchStandardVariable } from 'model-catalog/actions';
import { CustomNotification } from 'components/notification';

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
    private _notifications : CustomNotification;
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

    @property({type: Boolean})
    private _loadingIndex : boolean = false;

    @property({type: Object})
    private _index: IdMap<NumericalIndex>;

    @property({type: Object}) private _comparisonList : string[] = [];

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

    public constructor () {
        super();
        this._notifications = new CustomNotification();
    }

    protected render() {
        return html`
            ${this._notifications}
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
                          ${this._searchType == 'index' && this._filter? 
                            (this._models[key].usefulForCalculatingIndex || [])
                                .map((index:NumericalIndex) => this._index[index.id])
                                .map(getLabel)
                                .map((l:string) => html`<span class="resource numerical-index">${l}</span>`)
                            : this._models[key].description
                          }
                      </div>

                      <wl-icon slot="extra-icon" @click="${()=>{this._addToComparisonList(key)}}">compare_arrows</wl-icon>

                    </model-preview>`)
                    :html`<div class="centered-info">
                        <wl-text style="font-size: 1.4em;">No model fits the search parameters</wl-text>
                    </div>`)
                }
            </div>
        `
    }

    private _addToComparisonList (uri: string) {
        let id : string = uriToId(uri)
        let msg : string = "";
        let icon : string = "";
        if (this._comparisonList.indexOf(id) >= 0) {
            msg = "Model already on comparison list";
            icon = "report_problem";
        } else {
            this._comparisonList.push(id);
            msg = "Model added to comparison list";
            icon = "done";
        }

        if (this._comparisonList.length < 2) {
            this._notifications.custom(msg, icon);
        } else {
            let buttonName : string = "Compare";
            let url : string = 'models/compare/model=' + this._comparisonList.join('&model=');
            let me = this;
            let buttonFn = function () {
                me._comparisonList = [];
                goToPage(url);
            };

            this._notifications.custom(msg, icon, buttonName, buttonFn);
        }
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
            if (!this._loadingIndex) {
                this._loading=false;
                let matches : NumericalIndex[] = Object.values(this._index).filter((i:NumericalIndex) => getLabel(i).includes(input));
                Object.values(this._models).forEach((m:Model) => {
                    if (m && m.usefulForCalculatingIndex) {
                        this._activeModels[m.id] = m.usefulForCalculatingIndex.some((il:NumericalIndex) => {
                            return matches.some((ix) => ix.id == il.id);
                        })
                    }
                })
            }
            /*this._lastTimeout = setTimeout(
                ()=>{ 
                    let req = modelsSearchIndex(input);
                    req.then((result:any) => {
                        let validIds = result.map(x => x.id);

                        Object.keys(this._models).forEach((key:string) => {
                            this._activeModels[key] = (validIds.indexOf(key) >= 0);
                        });
                        this._loading=false;
                    });
                }, 750);*/
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

    firstUpdated () {
        this._loadingIndex = true;
        store.dispatch( numericalIndexsGet () ).then((indices:IdMap<NumericalIndex>) => {
            this._loadingIndex = false;
            this._index = indices;
            console.log('indices:', indices);
        })
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
                        (model.keywords ? model.keywords.join() : '') +
                        (model.hasModelCategory && model.hasModelCategory.length > 0 ?
                                model.hasModelCategory.map(getLabel).join(', ') : '')
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
