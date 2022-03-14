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
import { showDialog } from "util/ui_functions";
import { Dataset } from "screens/datasets/reducers";

type StatusType = "warning" | "done" | "error";

@customElement('thread-expansion-datasets')
export class ThreadExpansionDatasets extends ThreadExpansion {
    protected _name: string = "Select datasets";
    protected _description : string = "Search datasets to use on your executions.";
    @property({type:Object}) datasetSelector : DatasetSelector;
    @property({type:Object}) selectedInput : ModelIO;

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
        let allBindings : ModelIOBindings = this.thread.model_ensembles![model.id].bindings || {};
        let datasetIds : string[] = allBindings[input.id] ? allBindings[input.id] : [];
        let values = datasetIds.map((bid:string) => this.thread.data[bid]?.dataset?.id);
        return html`
            <tr>
                <td> 
                    <div style="display:flex; align-items:center;">
                        ${input.value || values.length > 0 ? html`
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
                            <span style="margin-left: 1em;">${input.value.resources.map((r) => html`<a target="_blank" href="${r.url}">${r.name}</a>`)}</span>
                        </div>
                        <span tip="This input was pre-selected. Cannot be changed" class="tooltip"><wl-icon>lock</wl-icon></span>
                    ` : html`
                        <span>
                            ${datasetIds.length == 0 ? "None selected" : datasetIds.map((binding:string) => {
                                let dataslice = this.thread.data![binding];
                                if (!dataslice) return;
                                let num_selected_resources = dataslice.selected_resources ?? 0;
                                let num_total_resources = dataslice.total_resources ?? 0;
                                return html`
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
                                `;
                            })}
                        </span>

                        ${this.editMode ? html`
                            <wl-icon class="clickable" @click=${() => this.editInput(model, input)}>edit</wl-icon>`
                        : html`<wl-icon>person</wl-icon>`}
                    `}
                    </div>
                </td>
            </tr>
        `;
    }

    private renderDatasetSelectionDialog () : TemplateResult {
        return html`
         <wl-dialog id="datasetSelectionDialog" fixed backdrop blockscrolling size="medium">
            <h3 slot="header">Selecting dataset for ${this.selectedInput ? this.selectedInput.name : "?"}</h3>
            <div slot="content" style="">
                ${this.datasetSelector}
            </div>
        </wl-dialog>
        `;
    }

    private editInput (model:LocalModel, input:ModelIO) {
        this.selectedInput = input;
        let allBindings : ModelIOBindings = this.thread.model_ensembles![model.id].bindings || {};
        let datasetIds : string[] = allBindings[input.id] ? allBindings[input.id] : [];

        if (datasetIds.length > 0) {
            this.datasetSelector.setDatasets(datasetIds.map((id:string) => {
                let dataslice = this.thread.data![id];
                let newDataset : Dataset = {
                    region: null,
                    datatype: null,
                    variables: null,
                    time_period: dataslice.time_period,
                    description: null,
                    version: null,
                    limitations: null,
                    source: null,
                    resources: dataslice.resources,
                    name: dataslice.name,
                    id: dataslice.id
                }
                return newDataset;
            }))
        } else {
            this.datasetSelector.setDatasets([])
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
        super.onCancelClicked();
    }

    protected onSaveClicked(): void {
        super.onSaveClicked();
    }

    protected onThreadChange(thread: Thread): void {
    }

    stateChanged(state: RootState) {
        super.stateChanged(state);
    }
}