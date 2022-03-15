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
import { Dataset } from "screens/datasets/reducers";
import { toDateString } from "util/date-utils";
import { ExplorerStyles } from "screens/models/model-explore/explorer-styles";


const PER_PAGE = 10;

interface DatasetOption {
    value: Dataset;
    isSelected: boolean;
    categoryid?: string;
}

@customElement("dataset-selector")
export class DatasetSelector extends connect(store)(LitElement) {
//export class DatasetSelector extends LitElement {
    @property({type: Array})  private options : DatasetOption[];
    @property({type: Object}) private idToOption : IdMap<DatasetOption>;
    // If setted before loading:
    @property({type: Object}) private asyncSelectedDatasets : Set<string>;

    // State
    @property({type: Boolean}) private loadingData : boolean = true;
    @property({type: String}) private textFilter : string = "";

    // Pagination
    @property({type: Number}) private currentPage: number = 1;
    @property({type: Number}) private maxPage: number = 1;

    static get styles () : CSSResult [] {
        return [SharedStyles, ExplorerStyles, css`
            #searchBar {
                width: 100%;
                padding: 5px 5px 5px 5px;
                border: 0px solid black;
                background-color: transparent;
            }
            .fixed-table {
                width: 100%;
                table-layout: fixed;
                overflow-wrap: break-word;
            }
            .pure-table-odd td, .pure-table-striped tr:nth-child(2n-1) td {
                background-color: rgb(236, 236, 236);
            }
        `]
    }

    // Use to revert to loading status 
    public unload () : void {
        this.loadingData = true;
        this.options = [];
        this.idToOption = {};
    }

    public setDatasets(datasets: Dataset[]) : void {
        this.options = [];
        this.idToOption = {};
        datasets.forEach((ds:Dataset) => {
            let newOpt : DatasetOption = {
                value: ds,
                isSelected: (this.asyncSelectedDatasets && this.asyncSelectedDatasets.has(ds.id)),
            };
            this.idToOption[ds.id] = newOpt;
            this.options.push(newOpt);
        });
        this.loadingData = false;
        this.asyncSelectedDatasets = undefined;
    }

    public getSelectedDatasets(): Dataset[] {
        if (this.loadingData) return null;
        return this.options
                .filter((opt:DatasetOption) => opt.isSelected)
                .map((opt:DatasetOption) => opt.value);
    }

    public setSelected (selectedIds:Set<string>) : void {
        if (this.loadingData) {
            this.asyncSelectedDatasets = selectedIds;
        } else {
            this.options.forEach((opt:DatasetOption) => 
                opt.isSelected = selectedIds.has(opt.value.id)
            )
            this.requestUpdate();
        }
    }

    public render () : TemplateResult {
        let visibleOptions : DatasetOption[] = [];
        if (!this.loadingData) {
            visibleOptions = this.options.filter((opt:DatasetOption) => {
                return !opt.isSelected;
            });
            visibleOptions = this.applyTextFilter(visibleOptions);
            this.maxPage = Math.ceil(visibleOptions.length / PER_PAGE);
        }

        return html`
            <div style="border: 1px solid #EEE; margin: 10px 0px;">
                <!-- Input text to search -->
                ${this.renderPaginator()}

                <!-- Table with filtered models -->
                <table class="pure-table pure-table-striped fixed-table">
                    <thead>
                        <tr>
                            <th style="width:8px"></th>
                            <th><b>Dataset</b></th>
                            <!--th>Category</th-->
                            <th style="width:132px"></th>
                            <th style="width:130px">Source</th>
                            <th style="width:60px">Resources</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${this.loadingData ?
                        html`
                            <tr>
                                <td colspan="5">
                                    <wl-progress-bar style="width: 100%;"></wl-progress-bar>
                                </td>
                            </tr>
                        `
                        : this.renderMatchingDatasets(visibleOptions)
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

    private applyTextFilter (options:DatasetOption[]) : DatasetOption[] {
        if (this.textFilter)
            return options.filter((opt:DatasetOption) => {
                return opt.value.name.toLowerCase().includes(this.textFilter) ||
                (opt.value.description && opt.value.description.toLowerCase().includes(this.textFilter));
            })
        return options;
    }

    public onPrevPage () : void {
        this.currentPage -= 1;
    }

    public onNextPage () : void {
        this.currentPage += 1;
    }

    private renderMatchingDatasets (posibleOptions: DatasetOption[]) : TemplateResult {
        let mx : number = (this.currentPage * PER_PAGE);
        let visibleOptions : DatasetOption[] = posibleOptions.slice(
            (this.currentPage - 1) * PER_PAGE,
            mx > posibleOptions.length ? posibleOptions.length : mx
        );
        
        let selectedOptions : DatasetOption[] = this.options.filter((opt:DatasetOption) => {
            return opt.isSelected;
        });

        if (visibleOptions.length === 0 && selectedOptions.length === 0)
            return html`
                <tr>
                    <td colspan="5" style="text-align:center; color: rgb(153, 153, 153);">
                        - No datasets found -
                    </td>
                </tr>
            `;
        
        // Print all selected models and PER_PAGE possible models
        let selectedDatasets : Set<String> = new Set();
        let visibleDatasets : Set<String> = new Set();

        return html`
            ${selectedOptions.map((opt:DatasetOption) => {
                if (opt.categoryid && !selectedDatasets.has(opt.categoryid)) {
                    selectedDatasets.add(opt.categoryid);
                    return html`
                        ${this.renderCategorySeparator(opt.categoryid)}
                        ${this.renderRow(opt)}`;
                }
                return this.renderRow(opt);
            })}
            ${visibleOptions.map((opt:DatasetOption) => {
                if (opt.categoryid && !visibleDatasets.has(opt.categoryid)) {
                    visibleDatasets.add(opt.categoryid);
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
            <td colspan="5" style="font-weight: bold; font-size: 1.02em; padding-left: 2em;">
                <span style="color: #aaa;">CATEGORY:</span> 
            </td>
        </tr>`
    }

    private renderRow (option:DatasetOption) : TemplateResult {
        let dataset : Dataset = option.value;
        return html`
        <tr>
            <td>
                <input class="checkbox" type="checkbox" data-modelid="${dataset.id}"
                        @change=${ this.toggleSelection }
                        .checked=${option.isSelected}></input>
            </td>
            <td>
                <a target="_blank" href="#">${dataset.name}</a>
                ${dataset.description ? html`<div>${dataset.description}</div>` : ''}
            </td> 
            <!--td>
                {dataset.variables ? dataset.variables.map((varname:string) =>
                     html<span class="resource variable-presentation">{varname}</span>) : ""}
            </td-->
            <td>
                ${dataset.datatype ? html`<div><code>${dataset.datatype}</code></div>` : ""}
                ${dataset.region ? html`<div><b>${dataset.region}</b></div>` : ""}
                ${dataset.categories ? html`<div>${dataset.categories.join(", ")}</div>` : ""}
                ${dataset.time_period ? 
                    html`<div>${dataset.time_period.start_date ? "from " + toDateString(dataset.time_period.start_date) : ""}
                    ${dataset.time_period.end_date ? " to " + toDateString(dataset.time_period.end_date) : ""}</div>`
                    : ""}
            </td>
            <td>
                ${dataset.source ? html`
                    <a href="${dataset.source.url}" target="_blank">${dataset.source.name}</a>
                    ${dataset.source.type ? html`<br/> ${dataset.source.type}` : ""}
                ` : ""}
            </td>
            <td> 
                ${dataset.resource_count}
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