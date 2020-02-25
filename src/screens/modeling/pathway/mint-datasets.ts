import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import datasets, { Dataset, ModelDatasets } from "../../datasets/reducers";

import { DatasetMap, DataEnsembleMap, ModelEnsembleMap, ComparisonFeature, StepUpdateInformation, SubGoal } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model } from "../../models/reducers";
import { queryDatasetsByVariables, loadResourcesForDataset } from "../../datasets/actions";
import { updatePathway } from "../actions";
import { removeDatasetFromPathway, matchVariables, getPathwayDatasetsStatus, TASK_DONE, getUISelectedSubgoal } from "../../../util/state_functions";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { showNotification, showDialog, hideDialog } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { IdMap } from "../../../app/reducers";
import { fromTimeStampToDateString } from "util/date-utils";

import "weightless/snackbar";
import 'components/loading-dots';
import { Region } from "screens/regions/reducers";

store.addReducers({
    datasets
});

@customElement('mint-datasets')
export class MintDatasets extends connect(store)(MintPathwayPage) {
    @property({type: Object})
    private _subgoal_region: Region;

    @property({type: Object})
    private _queriedDatasets!: ModelDatasets;

    @property({type: Object})
    private _models!: IdMap<Model>;

    @property({type: Boolean})
    private _editMode: Boolean = false;

    @property({type: Boolean})
    private _waiting: Boolean = false;

    @property({type: Array})
    private _datasetsToCompare: Dataset[] = [];

    @property({type:Boolean})
    private _showAllDatasets: boolean = false;

    @property({type: Object})
    subgoal: SubGoal;

    @property({type: Object})
    private _selectResourcesDataset: Dataset;

    @property({type: Boolean})
    private _selectionUpdate: boolean;

    @property({type: Boolean})
    private _selectResourcesImmediateUpdate: boolean;

    private _comparisonFeatures: Array<ComparisonFeature> = [
        {
            name: "More information",
            fn: (ds: Dataset) => html `
                <a target="_blank" href="${this._regionid}/datasets/browse/${ds.id}">Dataset Profile</a>
                `
        },
        {
            name: "Description",
            fn: (ds:Dataset) => ds.description
        },
        {
            name: "Source",
            fn: (ds:Dataset) => html`<a href="${ds.source.url}">${ds.source.name}</a>`
        },
        {
            name: "Source Type",
            fn: (ds:Dataset) => ds.source.type
        },
        {
            name: "Limitations",
            fn: (ds:Dataset) => ds.limitations
        },
        {
            name: "Version",
            fn: (ds:Dataset) => ds.version
        }
    ]


    static get styles() {
        return [
          SharedStyles,
          css`
          .pure-table td.matched a {
              font-weight: bold;
          }
          `
        ]
    }

    protected render() {
        if(!this.pathway) {
            return html ``;
        }
        
        // If no models selected
        if(!this.pathway.models || !Object.keys(this.pathway.models).length) {
            return html `
            <p>
                This step is for selecting datasets for each of the models that you selected earlier.
            </p>
            Please select model(s) first
            `
        }

        let done = (getPathwayDatasetsStatus(this.pathway) == TASK_DONE);

        // If models have been selected, go over each model
        return html `
        <p>
            This step is for selecting datasets for each of the models that you selected earlier.
        </p>
        ${done && !this._editMode ? html`<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.</p>`: html``}
        <div class="clt">
            <wl-title level="3">Datasets
                <wl-icon @click="${() => this._setEditMode(true)}" 
                    class="actionIcon editIcon"
                    id="editDatasetsIcon">edit</wl-icon>
            </wl-title>
            <wl-tooltip anchor="#editDatasetsIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Change Datasets Selection
            </wl-tooltip>

            <ul>
            ${(Object.keys(this.pathway.models) || []).map((modelid) => {
                let model = this.pathway.models![modelid];
                let input_files = model.input_files.filter((input) => !input.value);
                
                // Get any existing ensemble selection for the model
                let ensembles:DataEnsembleMap = this.pathway.model_ensembles![modelid] || {};

                return html`
                <li>
                    <wl-title level="4">Datasets for ${model.name}</wl-title>
                    ${input_files.length == 0 ? 
                    html `<ul><li>No additional datasets were needed for this model.</li></ul>`
                    :
                    html`
                    <ul>
                    ${input_files.map((input) => {
                        let bindings:string[] = ensembles[input.id!];

                        if((bindings && bindings.length > 0) && !this._editMode) {
                            // Already present: Show selections
                            return html`
                            <li>
                                <wl-title level="5">Input: ${input.name}</wl-title>
                                <ul>
                                    ${bindings.map((binding) => {
                                        let dataset = this.pathway.datasets![binding];
                                        let resources = dataset.resources || [];
                                        let selected_resources = dataset.resources.filter((res) => res.selected);
                                        // Fix for older saved resources
                                        if(selected_resources.length == 0) {
                                            resources.map((res) => { res.selected = true;});
                                            selected_resources = dataset.resources.filter((res) => res.selected);
                                        }
                                        return html`
                                        <li>
                                        <a target="_blank" href="${this._regionid}/datasets/browse/${dataset.id}/${this.getSubregionId()}">${dataset.name}</a>
                                        ${resources.length > 1 ?
                                            html`
                                                <br />
                                                ( ${selected_resources.length} / ${resources.length} files - 
                                                <a style="cursor:pointer"
                                                    @click="${() => this._selectDatasetResources(dataset, true)}">Change</a> )
                                            `
                                            : ""}
                                        </li>
                                        `;
                                    })}
                                </ul>
                            </li>
                            `;
                        }
                        else {
                            let queriedInputDatasetStatuses = (this._queriedDatasets[modelid] || {})[input.id!];
                            if(queriedInputDatasetStatuses) {
                                let loading = queriedInputDatasetStatuses.loading;
                                let queriedInputDatasets = queriedInputDatasetStatuses.datasets;
                                let inputtype = input.type.replace(/.*#/, '');
                                let dtypeMatchingInputDatasets = (queriedInputDatasets || []).filter((dataset: Dataset) => {
                                    return (dataset.datatype == inputtype);
                                })
                                return html `
                                <li>
                                    Select an input dataset for <b>${input.name}</b>. (You can select more than one dataset if you want several runs). 
                                    Datasets matching the driving variable specied (if any) are in <b>bold</b>.
                                    <p />
                                    ${loading ? 
                                    html`<wl-progress-bar></wl-progress-bar>`
                                    :
                                    html`
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
                                            ${(queriedInputDatasets || []).map((dataset:Dataset) => {
                                                let matched = matchVariables(this.pathway.driving_variables, dataset.variables, false); // Partial match
                                                let resources = dataset.resources;
                                                let selected_resources = dataset.resources.filter((res) => res.selected);
                                                if(this._showAllDatasets || this._selectionUpdate || dtypeMatchingInputDatasets.indexOf(dataset) >=0) {
                                                    return html`
                                                    <tr>
                                                        <td><input class="${this._valid(modelid)}_${this._valid(input.id!)}_checkbox" 
                                                            type="checkbox" data-datasetid="${dataset.id}"
                                                            ?checked="${(bindings || []).indexOf(dataset.id!) >= 0}"></input></td>
                                                        <td class="${matched ? 'matched': ''}">
                                                            <a target="_blank" href="${this._regionid}/datasets/browse/${dataset.id}/${this.getSubregionId()}">${dataset.name}</a>
                                                            <br/>
                                                            (${dataset.resources_loaded ? 
                                                                (resources.length === 0 ?
                                                                    'This dataset has no resources'
                                                                    : html`
                                                                    ${selected_resources.length} / ${resources.length} resources -  
                                                                    <a style="cursor:pointer"
                                                                        @click="${() => this._selectDatasetResources(dataset, false)}">Change</a>
                                                                `)
                                                            : html`
                                                                ${dataset.resource_count} total resources - 
                                                                <a style="cursor:pointer" @click="${() => {
                                                                    this._loadDatasetResources(dataset);
                                                                    this._selectDatasetResources(dataset, false);
                                                                }}">Filter and select</a>
                                                            `})

                                                        </td>
                                                        <td>${(dataset.categories || []).join(", ")}</td>
                                                        <td>${dataset.region}</td>
                                                        <td>
                                                            ${fromTimeStampToDateString(dataset.time_period.start_date)} to 
                                                            ${fromTimeStampToDateString(dataset.time_period.end_date)}
                                                        </td>
                                                        <td><a href="${dataset.source.url}">${dataset.source.name}</a></td>
                                                    </tr>
                                                    `
                                                }
                                            })}
                                            ${(queriedInputDatasets.length - dtypeMatchingInputDatasets.length) > 0 ? 
                                                html`
                                                <tr>
                                                    <td colspan="6" style="text-align:left; color: rgb(153, 153, 153);">
                                                        <a style="cursor:pointer" @click="${() => {this._showAllDatasets = !this._showAllDatasets}}">
                                                            ${!this._showAllDatasets ? "Show" : "Hide"} 
                                                            ${queriedInputDatasets.length - dtypeMatchingInputDatasets.length} datasets
                                                            that matched the input variables, but not input datatype (${inputtype}). 
                                                            They might need some data transformation.
                                                        </a>
                                                    </td>
                                                </tr>
                                                `
                                                : ""
                                            }
                                        </tbody>
                                    </table>
                                    <div class="footer">
                                        <wl-button type="button" flat inverted outlined 
                                            @click="${() => this._compareDatasets(modelid, input.id!)}">Compare Selected Data</wl-button>
                                        <div style="flex-grow: 1">&nbsp;</div>
                                    </div>
                                    `}
                                </li>
                                `;
                            }
                        }
                    })}
                    </ul>
                    `
                    }
                </li>
                `;
            })}
            </ul>
            ${!done || this._editMode ? 
                html`
                <div class="footer">
                    ${this._editMode ? 
                        html `<wl-button flat inverted
                            @click="${() => this._setEditMode(false)}">CANCEL</wl-button>`
                        : html``}
                    <wl-button type="button" class="submit" ?disabled="${this._waiting}"
                            @click="${() => this._loadAndSelectPathwayDatasets()}">
                        Select &amp; Continue
                        ${this._waiting? html`<loading-dots style="--width: 20px"></loading-dots>` : ''}
                    </wl-button>
                </div>  
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea id="notes">${this.pathway.notes ? this.pathway.notes.datasets : ""}</textarea>
                </fieldset>
                `: 
                html`
                
                <div class="footer">
                    <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("parameters"))}">Continue</wl-button>
                </div>

                ${this.pathway.last_update && this.pathway.last_update.datasets ? 
                    html `
                    <div class="notepage">${renderLastUpdateText(this.pathway.last_update.datasets)}</div>
                    `: html ``
                }                
                ${this.pathway.notes && this.pathway.notes.datasets ? 
                    html`
                    <fieldset class="notes">
                        <legend>Notes</legend>
                        <div class="notepage">${this.pathway.notes.datasets}</div>
                    </fieldset>
                    `: html``
                }
                `
            }           
        </div>

        ${renderNotifications()}
        ${this._renderDialogs()}
        `;
    }

    _renderDialogs() {
        return html`
        <wl-dialog class="comparison" fixed backdrop blockscrolling id="comparisonDialog">
            <table class="pure-table pure-table-striped">
                <thead>
                    <tr>
                        <th style="border-right:1px solid #EEE"></th>
                        ${this._datasetsToCompare.map((model) => {
                            return html`
                            <th .style="width:${100/(this._datasetsToCompare.length)}%"><b>${model.name}</b></th>
                            `
                        })}
                    </tr>
                </thead>
                <tbody>
                    ${this._comparisonFeatures.map((feature) => {
                        return html`
                        <tr>
                            <td style="border-right:1px solid #EEE"><b>${feature.name}</b></td>
                            ${this._datasetsToCompare.map((ds) => {
                                return html`
                                    <td>${feature.fn(ds)}</td>
                                `
                            })}
                        </tr>
                        `;
                    })}
                </tbody>
            </table>
        </wl-dialog>

        <wl-dialog class="comparison" fixed backdrop blockscrolling id="resourceSelectionDialog">
            <h3 slot="header">Select resources</h3>
            <div slot="content" style="height:500px;overflow:auto">
                <table class="pure-table pure-table-striped">
                    <thead>
                        <tr>
                            <th style="border-right:1px solid #EEE">
                                <input class="checkbox" type="checkbox" id="all" checked
                                    @click="${this._selectAllResources}"></input>
                            </th>
                            <th>Resource</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${((this._selectResourcesDataset || {} as Dataset).resources || []).map((resource) => {
                            return html`
                                <tr>
                                    <td>
                                        <input class="checkbox" type="checkbox" data-resourceid="${resource.id}"
                                            ?checked="${resource.selected}"></input>
                                    </td>
                                    <td><a target="_blank" href="${resource.url}">${resource.name}</a></td> 
                                    <td>
                                        ${fromTimeStampToDateString(resource.time_period.start_date)} to 
                                        ${fromTimeStampToDateString(resource.time_period.end_date)}
                                    </td>
                                </tr>
                            `;
                        })}
                    </tbody>
                </table>            
                ${!(this._selectResourcesDataset||{})['resources_loaded'] ? html`
                    <div style="margin-top: 10px; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>
                `:'' }
            </div>   
            <div slot="footer">
                <wl-button @click="${this._closeResourceSelectionDialog}" inverted flat>Close</wl-button>
                <wl-button @click="${this._submitDatasetResources}" class="submit">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _resetEditMode() {
        this._editMode = false;
    }
    
    _setEditMode(mode: Boolean) {
        this._editMode = mode;
        if(mode) {
            this.queryDataCatalog();
        }
    }

    _valid(id: string) {
        return id.replace(/(\/|\.|\:)/g, '_');
    }

    _getDatasetSelections(modelid: string, inputid: string) {
        let selected_datasets: DatasetMap = {};
        this.shadowRoot!.querySelectorAll("input."+
                this._valid(modelid) + "_" + this._valid(inputid) +"_checkbox" )
                .forEach((cbox) => {
                    let cboxinput = (cbox as HTMLInputElement);
                    let datasetid = cboxinput.dataset["datasetid"];
                    if(cboxinput.checked) {
                        this._queriedDatasets[modelid!][inputid].datasets.map((dataset:Dataset) => {
                            if(dataset.id == datasetid) {
                                selected_datasets[dataset.id!] = dataset;
                                return;
                            }
                        });
                    }
        });
        return selected_datasets;     
    }

    _loadDatasetResources(dataset: Dataset) {
        let dates = this.pathway.dates || this.subgoal.dates || this.scenario.dates;
        let req = loadResourcesForDataset(dataset.id, dates, this._subgoal_region, this.prefs.mint)
        req.then((resources) => {
            dataset.resources = resources;
            dataset.resources_loaded = true;
            dataset.resources.forEach(r => {r.selected = true})
            this.requestUpdate();
        });
        return req;
    }

    _selectDatasetResources(dataset: Dataset, immediate_update: boolean) {
        this._selectResourcesDataset = dataset;
        this._selectionUpdate = false;
        this._selectResourcesImmediateUpdate = immediate_update;
        showDialog("resourceSelectionDialog", this.shadowRoot!);
    }

    _submitDatasetResources() {
        let dialog = this.shadowRoot.getElementById("resourceSelectionDialog");
        let resource_selected = {};
        dialog.querySelectorAll("input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            let resid = cboxinput.dataset["resourceid"];
            if(resid)
                resource_selected[resid] = cboxinput.checked;
        });
        this._selectResourcesDataset.resources.map((res) => {
            res.selected = resource_selected[res.id];
        })
        this._selectionUpdate = true;
        if(this._selectResourcesImmediateUpdate) {
            let newpathway = {...this.pathway};
            newpathway.last_update = {
                ...newpathway.last_update!,
                parameters: null,
                datasets: {
                    time: Date.now(),
                    user: this.user!.email
                } as StepUpdateInformation
            };    
            updatePathway(this.scenario, newpathway);
            showNotification("saveNotification", this.shadowRoot!);
        }
        hideDialog("resourceSelectionDialog", this.shadowRoot);
    }

    _selectAllResources() {
        let dialog = this.shadowRoot.getElementById("resourceSelectionDialog");
        let allcbox = (dialog.querySelector("#all") as HTMLInputElement);
        dialog.querySelectorAll("input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            cboxinput.checked = allcbox.checked;
        });
    }

    _closeResourceSelectionDialog() {
        hideDialog("resourceSelectionDialog", this.shadowRoot);
    }

    _compareDatasets(modelid: string, inputid: string) {
        let datasets = this._getDatasetSelections(modelid, inputid);
        this._datasetsToCompare = Object.values(datasets);
        showDialog("comparisonDialog", this.shadowRoot!);
    }

    _loadAndSelectPathwayDatasets() {
        let new_datasets = []
        this._waiting = true;
        Object.keys(this.pathway.models!).map((modelid) => {
            let model = this.pathway.models![modelid];
            model.input_files.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                Object.values(this._getDatasetSelections(modelid, inputid)).forEach((ds) => {
                    new_datasets.push(ds);
                });
            })
        });

        Promise.all(Object.values(new_datasets)
                .filter(ds => !ds.resources_loaded)
                .map(ds => this._loadDatasetResources(ds))
        ).then((values) => {
            this._waiting = false;
            this._selectPathwayDatasets();
        });

    }

    _selectPathwayDatasets() {
        Object.keys(this.pathway.models!).map((modelid) => {
            let model = this.pathway.models![modelid];
            model.input_files.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_data_ensemble: string[] = (this.pathway.model_ensembles![modelid] || {})[inputid];
                if(!this._editMode && current_data_ensemble && current_data_ensemble.length > 0) {
                    return;
                }

                let new_datasets = this._getDatasetSelections(modelid, inputid);
        
                // Check if any datasets need to be removed
                let datasets_to_be_removed: string[] = [];
                (current_data_ensemble || []).map((dsid) => {
                    if(!new_datasets[dsid]) {
                        datasets_to_be_removed.push(dsid);
                    }
                    else {
                        // Existing dataset is already present in the new list. So we don't need to add it again
                        delete new_datasets[dsid];
                    }
                });
                datasets_to_be_removed.map((dsid) => {
                    //console.log("Removing dataset " + dsid);
                    // If the existing dataset was removed, remove it from the pathway
                    this.pathway = removeDatasetFromPathway(this.pathway, dsid, modelid, inputid);            
                })
        
                // Now add the rest of the new datasets
                let datasets: DatasetMap = this.pathway.datasets || {};
                let model_ensembles: ModelEnsembleMap = this.pathway.model_ensembles || {};
                Object.keys(new_datasets).map((dsid) => {
                    if(!model_ensembles[modelid])
                        model_ensembles[modelid] = {};
                    if(!model_ensembles[modelid][inputid])
                        model_ensembles[modelid][inputid] = [];
                    model_ensembles[modelid][inputid].push(dsid!);
                    datasets[dsid] = new_datasets[dsid];
                });
                // Create new pathway
                this.pathway = {
                    ...this.pathway,
                    datasets: datasets,
                    model_ensembles: model_ensembles
                }                        
            })
        });
        // Turn off edit mode
        this._editMode = false;

        let newpathway = {
            ...this.pathway
        };

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        newpathway.notes = {
            ...newpathway.notes!,
            datasets: notes
        };
        newpathway.last_update = {
            ...newpathway.last_update!,
            parameters: null,
            results: null,
            datasets: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };    

        // Update pathway itself
        //console.log(this.pathway);
        updatePathway(this.scenario, newpathway);
        showNotification("saveNotification", this.shadowRoot!);
    }

    _removePathwayDataset(modelid: string, inputid: string, datasetid:string) {
        if(confirm("Are you sure you want to remove this dataset ?")) {
            let newpathway = {...this.pathway};
            newpathway = removeDatasetFromPathway(newpathway, datasetid, modelid, inputid);
            updatePathway(this.scenario, newpathway);
        }
    }

    firstUpdated() {
        //this.queryDataCatalog();
    }

    queryDataCatalog() {
        //console.log("Querying data catalog again");
        let dates = this.pathway.dates || this.subgoal.dates || this.scenario.dates;

        if(this._models) {
            if(!this._queriedDatasets) {
                this._queriedDatasets = {} as ModelDatasets;
            }
            Object.keys(this._models || {}).map((modelid) => {
                let model = this._models[modelid];
                this._queriedDatasets[modelid] = {};
                model.input_files.filter((input) => !input.value).map((input) => {
                    // Only query for model inputs that we haven't already made a selection for
                    // Unless we're in edit more, then get all datasets
                    if(!this.pathway.model_ensembles![modelid] || 
                            !this.pathway.model_ensembles![modelid][input.id!] ||
                            this._editMode) {
                        //console.log("Querying datasets for model: " + modelid+", input: " + input.id);
                        store.dispatch(queryDatasetsByVariables(
                            modelid, input.id, input.variables, dates, this._subgoal_region, this.prefs.mint));
                    } else {
                        this._queriedDatasets[modelid][input.id!] = {
                            loading: false,
                            datasets: []
                        };
                        this.pathway.model_ensembles![modelid][input.id!].map((datasetid) => {
                            let dataset = this.pathway.datasets![datasetid];
                            this._queriedDatasets[modelid][input.id!].datasets.push(dataset);
                        });
                    }
                });
            });
            
        }
    }

    getSubregionId() {
        return this.subgoal.subregionid || this.scenario.subregionid || this.scenario.regionid;
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegion(state);
        
        if(state.regions && state.regions.regions && state.regions.sub_region_ids) {
            let subregionid = this.getSubregionId();
            this._subgoal_region = state.regions.regions[subregionid];
        }

        let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        if(this.pathway && this.pathway.models != this._models) {
            this._models = this.pathway.models!;
            this.queryDataCatalog();
            if(this.pathway.id != pathwayid) 
                this._resetEditMode();
        }

        if(state.datasets && state.datasets.model_datasets) {
            //console.log(state.datasets.datasets);
            this._queriedDatasets = state.datasets.model_datasets;
        }
    }    
}
