import { Model, ModelCategory, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Region } from "@mintproject/modelcatalog_client";
import { RootState, store } from "app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { customElement, LitElement, property, html, css, CSSResult, TemplateResult } from "lit-element";
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import "weightless/button";
import "weightless/icon";
import { IdMap } from "app/reducers";
import { getId, getLabel } from "model-catalog-api/util";
import { SharedStyles } from "styles/shared-styles";


const PER_PAGE = 10;

interface ModelOption {
    value: ModelConfiguration | ModelConfigurationSetup;
    isVisible: boolean;
    isSelected: boolean;
    categoryid?: string;
}

@customElement("model-selector")
//export class ModelSelector extends connect(store)(LitElement) {
export class ModelSelector extends LitElement {
    // Data loaded from the model-catalog.
    @property({type: Object}) private models : IdMap<Model>;
    @property({type: Object}) private versions : IdMap<SoftwareVersion>;
    @property({type: Object}) private configurations : IdMap<ModelConfiguration>;
    @property({type: Object}) private setups : IdMap<ModelConfigurationSetup>;
    @property({type: Object}) private categories : IdMap<ModelCategory>;
    @property({type: Object}) private regions : IdMap<Region>;

    // Possible options:
    @property({type: Array})  private options : ModelOption[];
    @property({type: Object}) private idToOption : IdMap<ModelOption>;
    @property({type: Object}) private optionCategories : IdMap<Model>;
    @property({type: Object}) private urls : IdMap<string> = {};

    // If setted before loading:
    @property({type: Object}) private asyncSelectedModels : Set<string>;
    @property({type: Object}) private asyncVisibleModels : Set<string>;

    // State
    @property({type: Boolean}) private loadingData : boolean = false;
    //@property({type: Boolean}) private loading : boolean = false;
    @property({type: String}) private textFilter : string = "";

    // Pagination
    @property({type: Number}) private currentPage: number = 1;
    @property({type: Number}) private maxPage: number = 1;

    static get styles () : CSSResult [] {
        return [ SharedStyles, css`
            #searchBar {
                width: 100%;
                padding: 5px 5px 5px 5px;
                border: 0px solid black;
            }
        `]
    }

    constructor () {
        super();
        this.loadDataFromModelCatalog();
    }

    private loadDataFromModelCatalog () : void {
        // Load data from the model-catalog
        this.loadingData = true;
        let modelReq    = store.dispatch(ModelCatalogApi.myCatalog.model.getAll());
        let versionReq  = store.dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll());
        let configReq   = store.dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll());
        let setupReq    = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll());
        let categoryReq = store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll());
        let regionReq   = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());

        modelReq.then((models:IdMap<Model>) => { this.models = models });
        versionReq.then((versions:IdMap<SoftwareVersion>) => { this.versions = versions });
        configReq.then((configs:IdMap<ModelConfiguration>) => { this.configurations = configs });
        setupReq.then((setups:IdMap<ModelConfigurationSetup>) => { this.setups = setups });
        categoryReq.then((categories:IdMap<ModelCategory>) => { this.categories = categories });
        regionReq.then((regions:IdMap<Region>) => { this.regions = regions });

        Promise.all([modelReq, configReq, versionReq, setupReq, categoryReq, regionReq]).then(() => {
            this.createOptionList();
            this.loadingData = false;
            this.dispatchEvent(
                new CustomEvent("model-selector-loaded", {
                    bubbles: true,
                    composed: true,
                })
            );
        });
    }

    private createOptionList () : void {
        //This creates an ordered list and the URLs for models
        // Sort the models.
        let models = Object.values(this.models).sort((a:Model, b:Model) => (getLabel(a) < getLabel(b)) ? 1 : -1)

        this.clearPossibleOptions();

        models.forEach((model:Model) => 
            (model.hasVersion||[])
                .filter((v:SoftwareVersion) => !!this.versions[v.id])
                .map((v:SoftwareVersion) => this.versions[v.id])
                .forEach((v:SoftwareVersion) => 
                    (v.hasConfiguration||[])
                        .filter((c:ModelConfiguration) => !!this.configurations[c.id])
                        .map((c:ModelConfiguration) => this.configurations[c.id])
                        .forEach((c:ModelConfiguration) => {
                            // Add the model as category
                            this.addOptionCategory(model);

                            // Add this configuration
                            this.addOption(c,
                                this.asyncSelectedModels ? this.asyncSelectedModels.has(c.id) : false,
                                this.asyncVisibleModels ? this.asyncVisibleModels.has(c.id) : true,
                                model
                            );

                            // Adds link to this configuration
                            this.urls[c.id] = getId(model) + "/" + getId(v) + "/" + getId(c);

                            // Add this config setups
                           (c.hasSetup||[])
                                .filter((s:ModelConfigurationSetup) => !!this.setups[s.id])
                                .map((s:ModelConfigurationSetup) => this.setups[s.id])
                                .forEach((s:ModelConfigurationSetup) => {
                                    // Adds this setup 
                                    this.urls[s.id] = this.urls[c.id] + "/" + getId(s);
                                    this.addOption(s,
                                        this.asyncSelectedModels ? this.asyncSelectedModels.has(s.id) : false,
                                        this.asyncVisibleModels ? this.asyncVisibleModels.has(s.id) : true,
                                        model
                                    );
                                });
                        })
                )
        )

        //We have added all correctly linked to the tree, add the rest of configurations and setups:
        let withErrors : (ModelConfiguration|ModelConfigurationSetup)[] = [];
        Object.keys(this.configurations).forEach((id:string) => {
            if (!this.idToOption[id]) withErrors.push(this.configurations[id]);
        });
        Object.keys(this.setups).forEach((id:string) => {
            if (!this.idToOption[id]) withErrors.push(this.setups[id]);
        });
        if (withErrors.length > 0) {
            let notFoundModel = {id:"not_found", label:["Model not found"]};
            this.addOptionCategory(notFoundModel);
            withErrors.forEach((model) => this.addOption(model,
                this.asyncSelectedModels ? this.asyncSelectedModels.has(model.id) : false,
                this.asyncVisibleModels ? this.asyncVisibleModels.has(model.id) : true,
                notFoundModel
            ));
        }

        /*withErrors.forEach((err) => {
            console.log(err.id + " - " + err.label + " - " + err.type);
        })*/

        this.asyncSelectedModels = undefined;
        this.asyncVisibleModels = undefined;
    }

    private getModelUrl (modelid:string) : string {
        return this.urls[modelid];
    }

    private clearPossibleOptions () : void {
        this.options = [];
        this.optionCategories = {};
        this.idToOption = {};
    }

    private addOptionCategory (model:Model) : void {
        this.optionCategories[model.id] = model;
    }

    private addOption (value:ModelConfiguration|ModelConfigurationSetup, isSelected: boolean, isVisible: boolean, model?:Model) : void {
        // Adds a new option, if the ID is already on use does nothing.
        if (!this.idToOption[value.id]) {
            let newOption : ModelOption = {
                value: value,
                isSelected: isSelected,
                isVisible: isVisible,
            }
            if (model) newOption.categoryid = model.id;
            this.options.push(newOption);
            this.idToOption[value.id] = newOption;
        }
    }

    public getAll () : (ModelConfigurationSetup | ModelConfiguration)[] {
        if (this.loadingData) return null;
        return Object.values(this.configurations).concat(Object.values(this.setups));
    }

    public getSelectedModels(): ModelConfigurationSetup[] {
        if (this.loadingData) return null;
        return this.options
                .filter((opt:ModelOption) => opt.isSelected)
                .map((opt:ModelOption) => opt.value);
    }

    public setSelected (selectedIds:Set<string>) : void {
        if (this.loadingData) {
            this.asyncSelectedModels = selectedIds;
        } else {
            this.options.forEach((opt:ModelOption) => 
                opt.isSelected = selectedIds.has(opt.value.id)
            )
            this.requestUpdate();
        }
    }

    public setVisible (visibleIds:Set<string>) : void {
        if (this.loadingData) {
            this.asyncVisibleModels = visibleIds;
        } else {
            this.options.forEach((opt:ModelOption) => 
                opt.isVisible = visibleIds.has(opt.value.id)
            )
            this.requestUpdate();
        }
    }

    public render () : TemplateResult {
        let visibleOptions : ModelOption[] = [];
        if (!this.loadingData) {
            visibleOptions = this.options.filter((opt:ModelOption) => {
                return opt.isVisible && !opt.isSelected;
            });
            visibleOptions = this.applyTextFilter(visibleOptions);
            this.maxPage = Math.ceil(visibleOptions.length / PER_PAGE);
        }

        return html`
            <div style="border: 1px solid #EEE; margin: 10px 0px;">
                <!-- Input text to search -->
                ${this.renderPaginator()}

                <!-- Table with filtered models -->
                <table class="pure-table pure-table-striped">
                    <thead>
                        <tr>
                            <th></th>
                            <th><b>Model</b></th>
                            <th>Category</th>
                            <th>Region</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${this.loadingData ?
                        html`
                            <tr>
                                <td colspan="4">
                                    <wl-progress-bar style="width: 100%;"></wl-progress-bar>
                                </td>
                            </tr>
                        `
                        : this.renderMatchingModels(visibleOptions)
                    }
                    </tbody>
                </table>
            </div>
        `;
    }

    private renderPaginator () : TemplateResult {
        return html`<div style="display: flex; align-items: center; padding: 0px 8px;">
            <wl-icon>search</wl-icon>
            <input id="searchBar" placeholder="Search..." type="text" @input=${this.onSearchInputChange} ?disabled=${this.loadingData} />
            <wl-icon @click="${this.clearSearchInput}" id="clearIcon" class="actionIcon">close</wl-icon>
            <span style="font-size: 20px; font-weight: 200; color: #EEE;">|</span>
            <wl-button flat inverted ?disabled=${this.loadingData || this.currentPage === 1} @click=${this.onPrevPage}>Back</wl-button>
            <span style="display: block; white-space: nowrap;">
                ${this.loadingData ? 
                    html`Page 1 of <loading-dots style="--width: 25px; margin: 5px;"></loading-dots>` :
                    html`Page ${this.currentPage} of ${this.maxPage}`
                }
            </span>
            <wl-button flat inverted ?disabled=${this.loadingData || this.currentPage >= this.maxPage } @click=${this.onNextPage}>Next</wl-button>
        </div>`;
    }

    private onSearchInputChange () : void {
        let inputEl : HTMLInputElement = this.shadowRoot!.getElementById("searchBar") as HTMLInputElement;
        if (inputEl)
            this.textFilter = inputEl.value.toLowerCase();
            this.currentPage = 1;
    }

    private clearSearchInput () : void {
        let inputEl : HTMLInputElement = this.shadowRoot!.getElementById("searchBar") as HTMLInputElement;
        if (inputEl) {
            inputEl.value = "";
            if (!this.textFilter) this.currentPage = 1;
            this.textFilter = "";
        }
    }

    private applyTextFilter (options:ModelOption[]) : ModelOption[] {
        if (this.textFilter)
            return options.filter((opt:ModelOption) => {
                return getLabel(opt.value).toLowerCase().includes(this.textFilter) ||
                (opt.value.description && opt.value.description[0].includes(this.textFilter));
            })
        return options;
    }

    public onPrevPage () : void {
        this.currentPage -= 1;
    }

    public onNextPage () : void {
        this.currentPage += 1;
    }

    private renderMatchingModels (posibleOptions: ModelOption[]) : TemplateResult {
        let mx : number = (this.currentPage * PER_PAGE);
        let visibleOptions : ModelOption[] = posibleOptions.slice(
            (this.currentPage - 1) * PER_PAGE,
            mx > posibleOptions.length ? posibleOptions.length : mx
        );
        
        let selectedOptions : ModelOption[] = this.options.filter((opt:ModelOption) => {
            return opt.isSelected;
        });

        if (visibleOptions.length === 0 && selectedOptions.length === 0)
            return html`
                <tr>
                    <td colspan="4" style="text-align:center; color: rgb(153, 153, 153);">
                        - No models found -
                    </td>
                </tr>
            `;
        
        // Print all selected models and PER_PAGE possible models
        let selectedModels : Set<String> = new Set();
        let visibleModels : Set<String> = new Set();

        return html`
            ${selectedOptions.map((opt:ModelOption) => {
                if (opt.categoryid && !selectedModels.has(opt.categoryid)) {
                    selectedModels.add(opt.categoryid);
                    return html`
                        ${this.renderCategorySeparator(opt.categoryid)}
                        ${this.renderRow(opt)}`;
                }
                return this.renderRow(opt);
            })}
            ${visibleOptions.map((opt:ModelOption) => {
                if (opt.categoryid && !visibleModels.has(opt.categoryid)) {
                    visibleModels.add(opt.categoryid);
                    return html`
                        ${this.renderCategorySeparator(opt.categoryid)}
                        ${this.renderRow(opt)}`;
                }
                return this.renderRow(opt);
            })}
        `;
    }

    private renderCategorySeparator (catId: string) : TemplateResult {
        return html`
        <tr>
            <td colspan="4" style="font-weight: bold; font-size: 1.02em; padding-left: 2em;">
                <span style="color: #aaa;">MODEL:</span> ${getLabel(this.optionCategories[catId])}
            </td>
        </tr>`
    }

    private renderRow (option:ModelOption) : TemplateResult {
        let model : ModelConfiguration | ModelConfigurationSetup= option.value;
        return html`
        <tr>
            <td>
                <input class="checkbox" type="checkbox" data-modelid="${model.id}"
                        @change=${ this.toggleSelection }
                        .checked=${option.isSelected}></input>
            </td>
            <td>
                <a target="_blank" href="${this.getModelUrl(model.id)}">${getLabel(model)}</a>
                ${model.description ? html`<div>${model.description[0]}</div>` : ''}
            </td> 
            <td> 
                ${model.hasModelCategory && model.hasModelCategory.length > 0 ? 
                    model.hasModelCategory.map((c:ModelCategory) => this.categories[c.id]).map(getLabel).join(", ")
                    : ""}
            </td>
            <td>
                ${model.hasRegion && model.hasRegion.length > 0 ? 
                    model.hasRegion.map((r:Region) => this.regions[r.id]).map(getLabel).join(", ")
                    : ""}
            </td>
        </tr>`;
    }

    private toggleSelection (ev:Event) {
        ev.stopPropagation();
        ev.preventDefault();

        let path : EventTarget[] = ev.composedPath();
        let chbox : HTMLInputElement = path[0] as HTMLInputElement;
        let modelid : string = chbox.getAttribute("data-modelid");
        if (modelid) {
            let option = this.idToOption[modelid];
            chbox.checked = option.isSelected;
            option.isSelected = !option.isSelected;
            this.requestUpdate();
        }
    }
}