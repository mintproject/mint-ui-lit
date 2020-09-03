import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import datasets, { Dataset, ModelDatasets } from "../../datasets/reducers";
import ReactGA from 'react-ga';

import { DatasetMap, DataEnsembleMap, ModelEnsembleMap, ComparisonFeature, Task, ThreadEvent } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model, getPathFromModel } from "../../models/reducers";
import { queryDatasetsByVariables, loadResourcesForDataset } from "../../datasets/actions";
import { updateThread } from "../actions";
import { removeDatasetFromThread, matchVariables, getThreadDatasetsStatus, TASK_DONE, getUISelectedTask } from "../../../util/state_functions";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { showNotification, showDialog, hideDialog } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { MintThreadPage } from "./mint-thread-page";
import { IdMap } from "../../../app/reducers";
import { fromTimeStampToDateString, toDateString } from "util/date-utils";

import "weightless/snackbar";
import 'components/loading-dots';
import { Region } from "screens/regions/reducers";

import { ModelCatalogDatasetSpecification } from 'screens/models/configure/resources/dataset-specification';
import { getLatestEventOfType } from "util/event_utils";
import { getCustomEvent } from "../../../util/graphql_adapter";

store.addReducers({
    datasets
});

@customElement('mint-datasets')
export class MintDatasets extends connect(store)(MintThreadPage) {
    @property({type: Object})
    private _task_region: Region;

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
    task: Task;

    @property({type: Object})
    private _selectResourcesDataset: Dataset;

    @property({type: Boolean})
    private _selectionUpdate: boolean;

    @property({type: Boolean})
    private _selectResourcesImmediateUpdate: boolean;

    private _expandedInput : IdMap<boolean> = {};
  
    private _mcInputs : IdMap<ModelCatalogDatasetSpecification> = {};

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
        if(!this.thread) {
            return html ``;
        }
        
        // If no models selected
        if(!this.thread.models || !Object.keys(this.thread.models).length) {
            return html `
            <p>
                This step is for selecting datasets for each of the models that you selected earlier.
            </p>
            Please select model(s) first
            `
        }

        let done = (getThreadDatasetsStatus(this.thread) == TASK_DONE);

        let latest_update_event = getLatestEventOfType(["CREATE", "UPDATE"], this.thread.events);
        let latest_data_event = getLatestEventOfType(["SELECT_DATA"], this.thread.events);
        
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

            ${(Object.keys(this.thread.models) || []).map((modelid) => {
                let model = this.thread.models![modelid];
                let url = this._regionid + '/models/explore' + getPathFromModel(model) + "/";
                let input_files = model.input_files.filter((input) => !input.value);
                let fixed_inputs = model.input_files.filter((input) => !!input.value);
                
                // Get any existing ensemble selection for the model
                let ensembles:DataEnsembleMap = this.thread.model_ensembles![modelid] || {};

                return html`
                    <wl-title level="4">
                        <span style="color:#888">MODEL:</span>
                        <a target="_blank" href="${url}">${model.name}</a>
                    </wl-title>
                    <ul>

                    <li>
                        <wl-title level="4"> Pre-selected Datasets: </wl-title>
                        <ul>
                            <li>
                            ${fixed_inputs.length == 0 ?
                                html`No pre-selected datasets were needed for this model.`
                                : html`
                                    Expert modeler has selected the following files:
                                    <table class="pure-table pure-table-striped">
                                        <thead>
                                            <tr>
                                                <th>Input</th>
                                                <th>Selected File</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                        ${fixed_inputs.map((input) => html`
                                            <tr>
                                                <td>${input.name}</td>
                                                <td>
                                                ${input.value && input.value.resources ? 
                                                    input.value.resources.map((r) => 
                                                        html`<a target="_blank" href="${r.url}">${r.name}</a>`)
                                                    : ""}
                                                </td>
                                            </tr>
                                        `)}
                                        </tbody>
                                    </table>
                                    <!-- TODO: This is a better way to do it, but theres no way to know if the resources
                                        are in the model catalog:
                                    {this._mcInputs[model.id] ? this._mcInputs[model.id] : ''}
                                    -->
                                `}
                            </li>
                        </ul>
                    </li>
                <li>
                    <wl-title level="4">User selected Datasets:</wl-title>
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
                                        let dataset = this.thread.datasets![binding];
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
                                                let matched = matchVariables(this.thread.driving_variables, dataset.variables, false); // Partial match
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
                                                            ${toDateString(dataset.time_period.start_date)} to 
                                                            ${toDateString(dataset.time_period.end_date)}
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
                </ul>
                `;
            })}
            ${!done || this._editMode ? 
                html`
                <div class="footer">
                    ${this._editMode ? 
                        html `<wl-button flat inverted
                            @click="${() => this._setEditMode(false)}">CANCEL</wl-button>`
                        : html``}
                    <wl-button type="button" class="submit" ?disabled="${this._waiting}"
                            @click="${() => this._loadAndSelectThreadDatasets()}">
                        Select &amp; Continue
                        ${this._waiting? html`<loading-dots style="--width: 20px"></loading-dots>` : ''}
                    </wl-button>
                </div>  
                
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea id="notes">${latest_data_event?.notes ? latest_data_event.notes : ""}</textarea>
                </fieldset>
                `: 
                html`

                <div class="footer">
                    <wl-button type="button" class="submit" @click="${() => store.dispatch(selectThreadSection("parameters"))}">Continue</wl-button>
                </div>

                ${latest_data_event?.notes ? 
                    html `
                    <div class="notepage">${renderLastUpdateText(latest_data_event)}</div>
                    `: html ``
                }
                ${latest_update_event?.notes ? 
                    html`
                    <fieldset class="notes">
                        <legend>Notes</legend>
                        <div class="notepage">${latest_update_event.notes}</div>
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
                                        ${toDateString(resource.time_period.start_date)} to 
                                        ${toDateString(resource.time_period.end_date)}
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
        let dates = this.thread.dates || this.task.dates || this.problem_statement.dates;
        let req = loadResourcesForDataset(dataset.id, dates, this._task_region, this.prefs.mint)
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
            let newthread = {...this.thread};  
            updateThread(newthread);
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

    _loadAndSelectThreadDatasets() {
        ReactGA.event({
          category: 'Thread',
          action: 'Dataset continue',
        });
        let new_datasets = []
        this._waiting = true;
        Object.keys(this.thread.models!).map((modelid) => {
            let model = this.thread.models![modelid];
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
            this._selectThreadDatasets();
        });

    }

    _selectThreadDatasets() {
        Object.keys(this.thread.models!).map((modelid) => {
            let model = this.thread.models![modelid];
            model.input_files.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_data_ensemble: string[] = (this.thread.model_ensembles![modelid] || {})[inputid];
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
                    // If the existing dataset was removed, remove it from the thread
                    this.thread = removeDatasetFromThread(this.thread, dsid, modelid, inputid);            
                })
        
                // Now add the rest of the new datasets
                let datasets: DatasetMap = this.thread.datasets || {};
                let model_ensembles: ModelEnsembleMap = this.thread.model_ensembles || {};
                Object.keys(new_datasets).map((dsid) => {
                    if(!model_ensembles[modelid])
                        model_ensembles[modelid] = {};
                    if(!model_ensembles[modelid][inputid])
                        model_ensembles[modelid][inputid] = [];
                    model_ensembles[modelid][inputid].push(dsid!);
                    datasets[dsid] = new_datasets[dsid];
                });
                // Create new thread
                this.thread = {
                    ...this.thread,
                    datasets: datasets,
                    model_ensembles: model_ensembles
                }                        
            })
        });
        // Turn off edit mode
        this._editMode = false;

        let newthread = {
            ...this.thread
        };

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        newthread.events.push(getCustomEvent("SELECT_DATA", notes) as ThreadEvent);

        // Update thread itself
        //console.log(this.thread);
        updateThread(newthread);
        showNotification("saveNotification", this.shadowRoot!);
    }

    _removeThreadDataset(modelid: string, inputid: string, datasetid:string) {
        if(confirm("Are you sure you want to remove this dataset ?")) {
            let newthread = {...this.thread};
            newthread = removeDatasetFromThread(newthread, datasetid, modelid, inputid);
            updateThread(newthread);
        }
    }

    firstUpdated() {
        //this.queryDataCatalog();
    }

    queryDataCatalog() {
        //console.log("Querying data catalog again");
        let dates = this.thread.dates || this.task.dates || this.problem_statement.dates;

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
                    if(!this.thread.model_ensembles![modelid] || 
                            !this.thread.model_ensembles![modelid][input.id!] ||
                            this._editMode) {
                        //console.log("Querying datasets for model: " + modelid+", input: " + input.id);
                        store.dispatch(queryDatasetsByVariables(
                            modelid, input.id, input.variables, dates, this._task_region, this.prefs.mint));
                    } else {
                        this._queriedDatasets[modelid][input.id!] = {
                            loading: false,
                            datasets: []
                        };
                        this.thread.model_ensembles![modelid][input.id!].map((datasetid) => {
                            let dataset = this.thread.datasets![datasetid];
                            this._queriedDatasets[modelid][input.id!].datasets.push(dataset);
                        });
                    }
                });
            });
            
        }
    }

    getSubregionId() {
        return this.task?.regionid || this.problem_statement?.regionid;
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegion(state);
        
        if(state.regions && state.regions.regions && state.regions.sub_region_ids) {
            let subregionid = this.getSubregionId();
            this._task_region = state.regions.regions[subregionid];
        }

        let thread_id = this.thread ? this.thread.id : null;
        super.setThread(state);
        if(this.thread && this.thread.models != this._models) {
            this._models = this.thread.models!;
            if (Object.keys(this._models).length > 0) {
                Object.values(this._models).forEach((m:Model) => {
                    let fixed = m.input_files.filter((i) => !!i.value);
                    if (false && fixed.length > 0) { //FIXME: not all inputs are in the catalog!
                        if (!this._mcInputs[m.id]) {
                            this._mcInputs[m.id] = new ModelCatalogDatasetSpecification();
                            this._mcInputs[m.id].inline = false;
                            this._mcInputs[m.id].isSetup = true;
                            this._mcInputs[m.id].colspan = 4;
                            //this._mcInputs.setAsSetup();
                        }
                        let fakeInputs = fixed.map((i) => {
                            return {
                                id: i.id,
                                label: [i.name]
                            };
                        });
                        this._mcInputs[m.id].setResources(fakeInputs);
                    }
                });
            }


            this.queryDataCatalog();
            if(this.thread.id != thread_id) 
                this._resetEditMode();
        }

        if(state.datasets && state.datasets.model_datasets) {
            //console.log(state.datasets.datasets);
            this._queriedDatasets = state.datasets.model_datasets;
        }
    }    
}
