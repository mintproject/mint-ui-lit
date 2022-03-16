import { customElement, html, css, TemplateResult, property } from "lit-element";
import { RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/expansion";
import "weightless/icon";
import "weightless/button";

import "components/data-catalog-id-checker";

import { ThreadExpansion } from "./thread-expansion";
import { ModelIOBindings, Thread } from "../reducers";
import { Model as LocalModel, ModelIO } from "screens/models/reducers";
import { DatasetSelector } from "components/dataset-selector";
import { hideDialog, showDialog } from "util/ui_functions";
import { Dataset, Dataslice } from "screens/datasets/reducers";
import { DataCatalogAdapter, DatasetQuery } from "util/data-catalog-adapter";
import { RegionMap } from "screens/regions/reducers";
import { queryDatasetsByVariables } from "screens/datasets/actions";
import { uuidv4 } from "util/helpers";
import { IdMap } from "app/reducers";

type StatusType = "warning" | "done" | "error";

@customElement('thread-expansion-datasets')
export class ThreadExpansionDatasets extends ThreadExpansion {
    protected _name: string = "Select datasets";
    protected _description : string = "Search datasets to use on your executions.";
    @property({type:Object}) datasetSelector : DatasetSelector;
    @property({type:Object}) selectedInput : ModelIO;
    @property({type:Object}) localRegions : RegionMap;
    private threadDatasets : Dataset[];

    static get styles() {
        return [SharedStyles, this.generalStyles, css`
            .tooltip {
                cursor: help;
                display: inline-block;
                position: relative;
            }

            .tooltip:hover:after {
                background: #333;
                background: rgba(0, 0, 0, .8);
                border-radius: 5px;
                bottom: 26px;
                color: #fff;
                content: attr(tip);
                right: 20%;
                padding: 5px 15px;
                position: absolute;
                z-index: 98;
                width: fit-content;
                white-space: nowrap;
            }

            .tooltip:hover:before {
                border: solid;
                border-color: #333 transparent;
                border-width: 6px 6px 0 6px;
                bottom: 20px;
                content: "";
                right: 42%;
                position: absolute;
                z-index: 99;
            }
            .datasetlist { 
                margin: 0;
                padding-left: 20px;
            }
            .clickable {
                cursor: pointer;
            }
        `];
    }

    constructor () {
        super()
        this.datasetSelector = new DatasetSelector();
    }

    protected getStatusInfo () : string {
        return "Select datasets for your model runs";
    }

    protected getStatus () : StatusType {
        if (!this.thread || !this.thread.models || Object.keys(this.thread.models).length === 0) return "error";
        let done : boolean = true;
        Object.values(this.thread.models).forEach((m:LocalModel) => {
            (m.input_files||[]).forEach((input:ModelIO) => {
                if (!input.value) {
                    let allBindings : ModelIOBindings = this.thread.model_ensembles![m.id].bindings || {};
                    let datasetIds : string[] = allBindings[input.id] ? allBindings[input.id] : [];
                    let values = datasetIds.map((bid:string) => this.thread.data[bid]?.dataset?.id);
                    if (values.length == 0)
                        done = false;
                }
            })
        });
        if (done) return "done";
        return "warning";
    }

    protected renderView (): TemplateResult {
        let thread: Thread = this.thread;
        if (!thread.models || Object.keys(thread.models).length === 0) {
            return html`You must select at least a model first.`
        }
        return html`
            <div style="border: 1px solid #EEE; margin: 10px 0px;">
                <!-- Table with models and inputs -->
                <table class="pure-table pure-table-striped">
                    <thead>
                        <tr>
                            <th><b>Input name</b></th>
                            <th><b>Selected dataset</b></th>
                        </tr>
                    </thead>

                    ${Object.values(thread.models).map((m:LocalModel) => html`
                        <tr><td colspan=2 style="font-size: 1.02em; font-weight: bold;">
                            <span style="color: #aaa;">MODEL:</span>
                            <a href="#">${m.name}</a>
                        </td></tr>
                        ${m.input_files && m.input_files.length > 0 ? m.input_files.map((io:ModelIO) => this.renderDatasetRow(m, io)) : html`
                        <tr><td colspan=2 style="text-align:center;">
                            This model does not require any input
                        </td></tr>`}
                    `)}
                    <tbody>
                    </tbody>
                </table>
            </div>
        `;
    }

    private renderDatasetRow (model:LocalModel, input:ModelIO) : TemplateResult {
        let modelBindings : ModelIOBindings = this.thread.model_ensembles![model.id].bindings || {};
        let dataBindingIds : string[] = modelBindings[input.id] ? modelBindings[input.id] : [];
        let datasetIds = dataBindingIds.map((bid:string) => this.thread.data[bid]?.dataset?.id);
        let dataslices : Dataslice[] = this.modifiedInputs[input.id] ?
                this.modifiedInputs[input.id]
                : dataBindingIds.map((bid:string) => this.thread.data![bid]);

        return html`
            <tr>
                <td> 
                    <div style="display:flex; align-items:center;">
                        ${input.value || datasetIds.length > 0 ? html`
                            <wl-icon style="color: 'green'; margin-right: 5px;">done</wl-icon>
                        ` : html`
                            <wl-icon style="color: 'orange'; margin-right: 5px;">warning</wl-icon>
                        `}
                        ${input.name} 
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; justify-content: space-between;">
                    ${input.value && input.value.resources ? html`
                        <div> 
                            <b>Pre-selected input:</b> <br/>
                            <ul class="datasetlist">${input.value.resources.map((r) => html`<li><a target="_blank" href="${r.url}">${r.name}</a></li>`)}</ul>
                        </div>
                        <span tip="This input was pre-selected. Cannot be changed" class="tooltip"><wl-icon>lock</wl-icon></span>
                    ` : html`
                        <ul class="datasetlist">
                            ${dataslices.length == 0 ? "None selected" : dataslices.map((dataslice:Dataslice) => {
                                if (!dataslice) return;
                                let num_selected_resources = dataslice.selected_resources ?? 0;
                                let num_total_resources = dataslice.total_resources ?? 0;
                                return html`<li>
                                <a target="_blank" href="${this._regionid}/datasets/browse/${dataslice.dataset.id}/${this.thread.regionid}">${dataslice.dataset.name}</a>
                                ${num_total_resources > 1 ?
                                    html`
                                        <br />
                                        ( ${num_selected_resources} / ${num_total_resources} files 
                                        ${this.editMode && this.permission.write ? html `
                                        - 
                                        <a style="cursor:pointer">Change</a>` : ""} )
                                    `
                                    : ""}
                                </li>`;
                            })}
                        </ul>

                        ${this.editMode ? html`
                            <wl-icon class="clickable" @click=${() => this.editInput(model, input)}>edit</wl-icon>`
                        : html`<wl-icon>person</wl-icon>`}
                    `}
                    </div>
                </td>
            </tr>
        `;
    }

    private renderDataslice (datasliceid:string) : TemplateResult {
        return html``
    }

    private renderDatasetSelectionDialog () : TemplateResult {
        return html`
         <wl-dialog id="datasetSelectionDialog" fixed backdrop blockscrolling size="large" persistent>
            <h3 slot="header">Selecting dataset for ${this.selectedInput ? this.selectedInput.name : "?"}</h3>
            <div slot="content" style="overflow-y:scroll;padding-right:8px;">
                ${this.datasetSelector}
            </div>
            <div slot="footer" style="padding-top:0px;">
                <wl-button flat inverted style="margin-right:5px;" @click=${this.onDatasetDialogCancel}>Cancel</wl-button>
                <wl-button class="submit" @click=${this.onDatasetDialogSave}>Save</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    private modifiedInputs : IdMap<Dataslice[]> = {};
    private onDatasetDialogSave () : void {
        let datasets : Dataset[] = this.datasetSelector.getSelectedDatasets();
        this.modifiedInputs[this.selectedInput.id] = datasets.map(this.newDatasliceFromDataset.bind(this));
        this.onDatasetDialogCancel();
    }

    private newDatasliceFromDataset (dataset:Dataset) : Dataslice {
        return {
            id: uuidv4(),
            total_resources: dataset.resources.length,
            selected_resources: dataset.resources.filter((res) => res.selected).length, //FIXME
            resources: dataset.resources,
            time_period: this.thread.dates,
            name: dataset.name,
            dataset: dataset,
            resources_loaded: dataset.resources_loaded
        } as Dataslice
    }

    private onDatasetDialogCancel () : void {
        hideDialog("datasetSelectionDialog", this.shadowRoot!);
        this.selectedInput = null;
    }

    private editInput (model:LocalModel, input:ModelIO) {
        this.selectedInput = input;
        let allBindings : ModelIOBindings = this.thread.model_ensembles![model.id].bindings || {};
        let bindings : string[] = allBindings[input.id] ? allBindings[input.id] : [];

        let datasetIds = (bindings || []).map((bid) => this.thread.data[bid]?.dataset?.id);
        this.getInputDatasets(input);

        if (this.modifiedInputs[input.id]) {
            let mDatasets : string[] = this.modifiedInputs[input.id].map((sl:Dataslice) => sl.dataset.id);
            this.datasetSelector.setSelected(new Set<string>(mDatasets));
        } else if (datasetIds.length > 0) {
            this.datasetSelector.setSelected(new Set<string>(datasetIds));
        }
        showDialog("datasetSelectionDialog", this.shadowRoot!);
    }

    protected renderEditForm (): TemplateResult {
        return html`
            ${ this.renderView() }
            ${ this.renderDatasetSelectionDialog() }
        `
    }

    protected onEditEnable(): void {
        super.onEditEnable();
    }

    protected onCancelClicked(): void {
        this.selectedInput = null;
        this.modifiedInputs = {};
        super.onCancelClicked();
    }

    protected onSaveClicked(): void {
        super.onSaveClicked();
    }

    private save () : void {
        
    }

    protected onThreadChange(thread: Thread): void {
        if (this.localRegions) this.getThreadDatasets();
    }

    stateChanged(state: RootState) {
        super.stateChanged(state);
        super.setRegionId(state);
        if (state.regions.regions && this.localRegions != state.regions.regions) {
            this.localRegions = state.regions.regions;
            if (this.thread) this.getThreadDatasets();
        }
    }

    public getThreadDatasets () : void {
        if (!this.thread || !this.localRegions) return;
        let datasetQuery : DatasetQuery = {};

        let localRegion = this.localRegions[this.thread.regionid];
        if (localRegion)
            datasetQuery.spatial_coverage__intersects = localRegion.geometries[0];

        if (this.thread.dates) {
            if (this.thread.dates.start_date) datasetQuery.start_time = this.thread.dates.start_date;
            if (this.thread.dates.end_date) datasetQuery.end_time = this.thread.dates.end_date;
        }
        
        if (this.thread.response_variables && this.thread.response_variables.length > 0)
            datasetQuery.standard_variable_names__in = this.thread.response_variables;

        this.loading = true;
        let req : Promise<Dataset[]> = DataCatalogAdapter.findDataset(datasetQuery);
        req.then((datasets:Dataset[]) => {
            this.threadDatasets = datasets;
            this.loading = false;
        })
        req.catch((e) => {
            console.warn(e);
            this.loading = false;
        })
    }

    private getInputDatasets (input:ModelIO) {
        let dates = this.thread.dates;
        let region = this.localRegions[this.thread.regionid];

        this.datasetSelector.unload();
        this.loading = true;
        let req : Promise<Dataset[]> = DataCatalogAdapter.findDatasetByVariableName(input.variables, region, dates)
        req.then((datasets:Dataset[]) => {
            this.datasetSelector.setDatasets(datasets, region, dates);
            this.loading = false;
        })
        req.catch((e) => {
            console.warn(e);
            this.loading = false;
        })
    }
}