var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import datasets from "../reducers/datasets";
import { SharedStyles } from "./shared-styles";
import { queryDatasets } from "../actions/datasets";
import { updatePathway } from "../actions/mint";
import { BASE_HREF } from "../actions/app";
import { createPathwayExecutableEnsembles, removeDatasetFromPathway } from "../util/state_functions";
import { MintPathwayPage } from "./mint-pathway-page";
import { renderNotifications } from "../util/ui_renders";
import { showNotification } from "../util/ui_functions";
store.addReducers({
    datasets
});
let MintDatasets = class MintDatasets extends connect(store)(MintPathwayPage) {
    constructor() {
        super(...arguments);
        this._editMode = {};
    }
    static get styles() {
        return [
            SharedStyles,
            css `
          .pure-table td.matched a {
              font-weight: bold;
          }
          `
        ];
    }
    render() {
        // If no models selected
        if (!this.pathway.models || !Object.keys(this.pathway.models).length) {
            return html `
                Please select model(s) first
            `;
        }
        // If models have been selected, go over each model
        return html `
        <p>
            Datasets are chosen in this section for each of the models selected earlier.
        </p>        
        <div class="clt">
            <wl-title level="3">Datasets</wl-title>
            <ul>
            ${(Object.keys(this.pathway.models) || {}).map((modelid) => {
            let model = this.pathway.models[modelid];
            // Get any existing ensemble selection for the model
            let ensembles = this.pathway.model_ensembles[modelid] || {};
            return html `
                <li>
                    <wl-title level="4">Model: ${model.name}</wl-title>
                    <ul>
                    ${model.input_files.map((input) => {
                let editmode = (this._editMode[model.id] || {})[input.id];
                let bindings = ensembles[input.id];
                if (bindings && bindings.length > 0 && !editmode) {
                    // Already present: Show selections
                    return html `
                            <li>
                                <wl-title level="5">Input: ${input.name}
                                    <wl-icon @click="${() => this._setEditMode(model.id, input.id, true)}" 
                                        class="actionIcon editIcon"
                                        id="editDatasetsIcon_${model.id}_${input.id}">edit</wl-icon>
                                </wl-title>
                                <wl-tooltip anchor="#editDatasetsIcon_${model.id}_${input.id}" 
                                    .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                                    anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                                    Change Datasets Selection
                                </wl-tooltip>
                                <ul>
                                    ${bindings.map((binding) => {
                        let dataset = this.pathway.datasets[binding];
                        return html `
                                        <li>
                                        <a href="${BASE_HREF}datasets/${dataset.id}">${dataset.name}</a>
                                        </li>
                                        `;
                    })}
                                </ul>
                            </li>
                            `;
                }
                else {
                    let queriedInputDatasets = (this._queriedDatasets[modelid] || {})[input.id];
                    return html `
                            <li>
                                Select an input dataset for <b>${input.name}</b>. (You can select more than one dataset if you want several runs). 
                                Datasets matching the driving variable specied (if any) are in <b>bold</b>.
                                <p />
                                <table class="pure-table pure-table-striped">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th><b>Dataset</b></th>
                                            <th>Categories</th>
                                            <th>Region</th>
                                            <th>Time Period</th>
                                            <th>Source</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(queriedInputDatasets || []).map((dataset) => {
                        let matched = (dataset.variables.indexOf(this.pathway.driving_variable) >= 0);
                        return html `
                                            <tr>
                                                <td><input class="${modelid}_${input.id}_checkbox" 
                                                    type="checkbox" data-datasetid="${dataset.id}"
                                                    ?checked="${(bindings || []).indexOf(dataset.id) >= 0}"></input></td>
                                                <td class="${matched ? 'matched' : ''}">
                                                    <a href="${BASE_HREF}datasets/${dataset.id}">${dataset.name}</a>
                                                </td>
                                                <td>${dataset.categories.join(", ")}</td>
                                                <td>${dataset.region}</td>
                                                <td>${dataset.time_period}</td>
                                                <td><a href="'${dataset.source.id}'">${dataset.source.name}</a></td>
                                            </tr>
                                            `;
                    })}
                                    </tbody>
                                </table>
                                <div class="footer">
                                    ${editmode ?
                        html `<wl-button flat inverted
                                            @click="${() => this._setEditMode(model.id, input.id, false)}">CANCEL</wl-button>`
                        : html ``}
                                    <wl-button type="button" class="submit" 
                                        @click="${() => this._selectPathwayDatasets(modelid, input.id)}">Select &amp; Continue</wl-button>
                                </div>                                
                            </li>
                            `;
                }
            })}
                    </ul>
                </li>
                `;
        })}
            </ul>
        </div>

        ${renderNotifications()}
        `;
    }
    _resetEditMode() {
        this._editMode = {};
    }
    _setEditMode(modelid, inputid, mode) {
        let editmode = Object.assign({}, this._editMode);
        if (!editmode[modelid]) {
            editmode[modelid] = {};
        }
        editmode[modelid][inputid] = mode;
        this._editMode = editmode;
        if (mode) {
            this._models[modelid].input_files.map((input) => {
                if (input.id == inputid) {
                    store.dispatch(queryDatasets(modelid, inputid, input.variables));
                }
            });
        }
    }
    _selectPathwayDatasets(modelid, inputid) {
        let new_datasets = {};
        this.shadowRoot.querySelectorAll("input." + modelid + "_" + inputid + "_checkbox").forEach((cbox) => {
            let cboxinput = cbox;
            let datasetid = cboxinput.dataset["datasetid"];
            if (cboxinput.checked) {
                this._queriedDatasets[modelid][inputid].map((dataset) => {
                    if (dataset.id == datasetid) {
                        new_datasets[dataset.id] = dataset;
                        return;
                    }
                });
            }
        });
        // Check if any datasets need to be removed
        let datasets_to_be_removed = [];
        if (this.pathway.model_ensembles[modelid]) {
            let current_data_ensemble = this.pathway.model_ensembles[modelid][inputid];
            //console.log(current_data_ensemble);
            (current_data_ensemble || []).map((dsid) => {
                if (!new_datasets[dsid]) {
                    datasets_to_be_removed.push(dsid);
                }
                else {
                    // Existing dataset is already present in the new list. So we don't need to add it again
                    delete new_datasets[dsid];
                }
            });
        }
        datasets_to_be_removed.map((dsid) => {
            //console.log("Removing dataset " + dsid);
            // If the existing dataset was removed, remove it from the pathway
            this.pathway = removeDatasetFromPathway(this.pathway, dsid, modelid, inputid);
        });
        // Now add the rest of the new datasets
        let datasets = this.pathway.datasets || {};
        let model_ensembles = this.pathway.model_ensembles || {};
        Object.keys(new_datasets).map((dsid) => {
            if (!model_ensembles[modelid])
                model_ensembles[modelid] = {};
            if (!model_ensembles[modelid][inputid])
                model_ensembles[modelid][inputid] = [];
            model_ensembles[modelid][inputid].push(dsid);
            datasets[dsid] = new_datasets[dsid];
        });
        // Create new pathway
        this.pathway = Object.assign({}, this.pathway, { datasets: datasets, model_ensembles: model_ensembles });
        // Update executable ensembles in the pathway
        this.pathway = createPathwayExecutableEnsembles(this.pathway);
        // Update pathway itself
        updatePathway(this.scenario, this.pathway);
        // Turn off edit mode again
        if (this._editMode[modelid] && this._editMode[modelid][inputid]) {
            this._editMode[modelid][inputid] = false;
        }
        showNotification("saveNotification", this.shadowRoot);
    }
    _removePathwayDataset(modelid, inputid, datasetid) {
        if (confirm("Are you sure you want to remove this dataset ?")) {
            this.pathway = removeDatasetFromPathway(this.pathway, datasetid, modelid, inputid);
            this.pathway = createPathwayExecutableEnsembles(this.pathway);
            updatePathway(this.scenario, this.pathway);
        }
    }
    firstUpdated() {
        //this.queryDataCatalog();
    }
    queryDataCatalog() {
        if (this._models) {
            if (!this._queriedDatasets) {
                this._queriedDatasets = {};
            }
            Object.keys(this._models || {}).map((modelid) => {
                let model = this._models[modelid];
                model.input_files.map((input) => {
                    // Only query for model inputs that we haven't already made a selection for
                    if (!this.pathway.model_ensembles[modelid] ||
                        !this.pathway.model_ensembles[modelid][input.id]) {
                        console.log("Querying datasets for model: " + modelid + ", input: " + input.id);
                        store.dispatch(queryDatasets(modelid, input.id, input.variables));
                    }
                });
            });
        }
    }
    stateChanged(state) {
        let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        if (this.pathway && this.pathway.models != this._models) {
            this._models = this.pathway.models;
            this.queryDataCatalog();
            if (this.pathway.id != pathwayid)
                this._resetEditMode();
        }
        if (state.datasets) {
            console.log(state.datasets.datasets);
            this._queriedDatasets = state.datasets.datasets;
        }
    }
};
__decorate([
    property({ type: Object })
], MintDatasets.prototype, "_queriedDatasets", void 0);
__decorate([
    property({ type: Object })
], MintDatasets.prototype, "_models", void 0);
__decorate([
    property({ type: Object })
], MintDatasets.prototype, "_editMode", void 0);
MintDatasets = __decorate([
    customElement('mint-datasets')
], MintDatasets);
export { MintDatasets };
