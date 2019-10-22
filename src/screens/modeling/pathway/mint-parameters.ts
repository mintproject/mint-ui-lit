import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { DataEnsembleMap, ModelEnsembleMap, StepUpdateInformation, ExecutableEnsemble, ExecutableEnsembleSummary } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model } from "../../models/reducers";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { TASK_DONE, getPathwayParametersStatus, getModelInputConfigurations, getEnsembleHash, setupModelWorkflow, listEnsembles, runModelEnsembles, listAlreadyRunEnsembleIds } from "../../../util/state_functions";
import { updatePathway, addPathwayEnsembles, setPathwayEnsembleIds, deleteAllPathwayEnsembleIds } from "../actions";
import { showNotification, showDialog, hideDialog } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { IdMap } from "../../../app/reducers";

import "weightless/progress-bar";
import { loginToWings, fetchWingsTemplate } from "util/wings_functions";

const MAX_PARAMETER_COMBINATIONS = 3000;

@customElement('mint-parameters')
export class MintParameters extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _models!: IdMap<Model>;

    @property({type: Array})
    private _current_ensemble_ids: string[];

    @property({type: Boolean})
    private _editMode: Boolean = false;

    @property({type: String})
    private _progress_item: string;
    @property({type: Number})
    private _progress_total : number;
    @property({type: Number})
    private _progress_number : number;
    @property({type: Boolean})
    private _progress_abort: boolean;

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
                Please specify the values for the adjustable parameters.
            </p>
            Please select model(s) first
            `
        }

        let done = (getPathwayParametersStatus(this.pathway) == TASK_DONE);
        
        // If models have been selected, go over each model
        return html `
        <p>
            This step is for specifying values for the adjustable parameters of the models that you selected earlier.
        </p>
        ${done && !this._editMode ? html`<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.</p>`: html``}
        <div class="clt">
            <wl-title level="3">
                Setup Models
                <wl-icon @click="${() => this._setEditMode(true)}" 
                    class="actionIcon editIcon"
                    id="editParametersIcon">edit</wl-icon>
            </wl-title>
            <wl-tooltip anchor="#editParametersIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Change Adjustable Parameter Values
            </wl-tooltip>
            <ul>
            ${(Object.keys(this.pathway.models) || []).map((modelid) => {
                let model = this.pathway.models![modelid];
                // Get any existing ensemble selection for the model
                let ensembles:DataEnsembleMap = this.pathway.model_ensembles![modelid] || {};
                let input_parameters = model.input_parameters
                    .filter((input) => !input.value)
                    .sort((a, b) => a.name.localeCompare(b.name));

                return html`
                <li>
                    <wl-title level="4">Model: ${model.name}</wl-title>
                    ${input_parameters.length > 0 ? 
                        html `
                        <p>
                            Setup the model by specifying values below. You can enter more than one value (comma separated) if you want several runs
                        </p>
                        <form id="form_${this._valid(model.localname || model.id)}">
                        <table class="pure-table pure-table-striped">
                        <thead>
                            <th><b>Adjustable Parameter</b></th>
                            <th>Values</th>
                        </thead>
                        <tbody>
                        ${input_parameters.map((input) => {
                            let bindings:string[] = ensembles[input.id!];
                            return html`
                            <tr>
                                <td style="width:60%">
                                    <wl-title level="5">${input.name}</wl-title>
                                    <div class="caption">${input.description}.</div>
                                    <div class="caption">
                                    ${input.min && input.max ? 
                                        html `The range is from ${input.min} to ${input.max}.` : html``
                                    }
                                    ${input.default ? html` Default is ${input.default}` : html``}
                                    </div>
                                </td>
                                <td>
                                    ${(bindings && bindings.length > 0 && !this._editMode) ? 
                                        bindings.join(", ")
                                        :
                                        html`
                                        <div class="input_full">
                                            <input type="text" name="${input.id}" value="${(bindings||[]).join(", ")}"></input>
                                        </div>
                                        `
                                    }
                                </td>
                            </tr>
                            `
                        })}
                        </tbody>
                        </table>
                        </form>
                        `
                        : 
                        html `
                            <p>
                                There are no adjustments possible for this model
                            </p>
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
                    <wl-button type="button" class="submit" 
                        @click="${() => this._setPathwayParametersAndRun()}">Select &amp; continue</wl-button>
                </div>  
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea id="notes">${this.pathway.notes ? this.pathway.notes.parameters : ""}</textarea>
                </fieldset>
                `: 
                html`
                <div class="footer">
                    <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("runs"))}">Continue</wl-button>
                </div>
                                
                ${this.pathway.last_update && this.pathway.last_update.parameters ? 
                    html `
                    <div class="notepage">${renderLastUpdateText(this.pathway.last_update.parameters)}</div>
                    `: html ``
                }                
                ${this.pathway.notes && this.pathway.notes.parameters ? 
                    html`
                    <fieldset class="notes">
                        <legend>Notes</legend>
                        <div class="notepage">${this.pathway.notes.parameters}</div>
                    </fieldset>
                    `: html``
                }
                `
            }        
        </div>

        ${renderNotifications()}
        ${this._renderProgressDialog()}
        `;
    }

    _renderProgressDialog() {
        return html`
        <wl-dialog id="progressDialog" fixed persistent backdrop blockscrolling>
            <h3 slot="header">Saving and running model configurations</h3>
            <div slot="content">
                <p>
                    Submitting runs for model "${this._progress_item}"
                </p>
                ${this._progress_number} out of ${this._progress_total}
                <wl-progress-bar style="width:100%" mode="determinate"
                    value="${this._progress_number/this._progress_total}"></wl-progress-bar>
            </div>
            <div slot="footer">
                ${this._progress_number == this._progress_total ? 
                    html`<wl-button @click="${this._onDialogDone}" class="submit">Done</wl-button>` :
                    html`<wl-button @click="${this._onStopProgress}" inverted flat>Stop</wl-button>`
                }
            </div>            
        </wl-dialog>
        `;
    }

    _valid(id: string) {
        return id.replace(/(\/|\.|\:)/g, '_');
    }

    _resetEditMode() {
        this._editMode = false
    }
    
    _setEditMode(mode: Boolean) {
        this._editMode = mode;
    }

    _getParameterSelections(model: Model, inputid: string) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#form_"+this._valid(model.localname || model.id))!;
        let inputstr = (form.elements[inputid] as HTMLInputElement).value;
        return inputstr.split(/\s*,\s*/);
    }

    _onDialogDone() {
        hideDialog("progressDialog", this.shadowRoot!);
        this._savePathwayDetails();
    }

    _onStopProgress() {
        this._progress_abort = true;
        hideDialog("progressDialog", this.shadowRoot!);
    }

    async _saveAndRunExecutableEnsembles() {
        if(!this.pathway.executable_ensemble_summary)
            this.pathway.executable_ensemble_summary = {};

        await loginToWings(this.prefs);
        
        Object.keys(this.pathway.model_ensembles).map( async(modelid) => {
            let dataEnsemble = Object.assign({}, this.pathway.model_ensembles[modelid]);

            let model = this.pathway.models[modelid];
            // Get input ids
            let inputIds = [];
            model.input_files.map((io) => {
                if(!io.value) {
                    inputIds.push(io.id);

                    // Expand a dataset to it's constituent resources
                    // FIXME: Create a collection if the model input has dimensionality of 1
                    if(dataEnsemble[io.id]) {
                        let nensemble = [];
                        dataEnsemble[io.id].map((dsid) => {
                            let ds = this.pathway.datasets[dsid];
                            nensemble = nensemble.concat(nensemble, ds.resources);
                        });
                        dataEnsemble[io.id] = nensemble;
                    }
                }
            })
            model.input_parameters.map((io) => {
                if(!io.value) inputIds.push(io.id);
            })
            // Get cartesian product of inputs to get all model configurations
            this._progress_abort = false;
    
            let configs = getModelInputConfigurations(dataEnsemble, inputIds);
            if(configs != null) {
                // Update executable ensembles in the pathway
                this._progress_item = model.name;
                this._progress_total = configs.length;
                this._progress_number = 0;
                showDialog("progressDialog", this.shadowRoot!);

                // Delete existing pathway ensemble ids (*NOT DELETING GLOBAL ENSEMBLE DOCUMENTS .. Only clearing list of the pathway's ensemble ids)
                deleteAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);

                // Setup Model for execution on Wings
                let workflowid = await setupModelWorkflow(model, this.pathway, this.prefs);
                let tpl_package = await fetchWingsTemplate(workflowid, this.prefs);

                let datasets = {}; // Map of datasets to be registered (passed to Wings to keep track)
            
                // Setup some book-keeping to help in searching for results
                this.pathway.executable_ensemble_summary[modelid] = {
                    total_runs: configs.length,
                    workflow_name: workflowid.replace(/.+#/, ''),
                    submission_time: Date.now() - 20000 // Less 20 seconds to counter for clock skews
                } as ExecutableEnsembleSummary

                // Work in batches
                let batchSize = 100; // Deal with ensembles from firebase in this batch size
                let batchid = 0; // Use to create batchids in firebase for storing ensemble ids

                let executionBatchSize = 10; // Run workflows in Wings in batches
                
                // Create ensembles in batches
                for(let i=0; i<configs.length; i+= batchSize) {
                    let bindings = configs.slice(i, i+batchSize);

                    let ensembles = [];
                    let ensembleids = [];

                    if(this._progress_abort) {
                        break;
                    }

                    // Create ensembles for this batch
                    bindings.map((binding) => {
                        let inputBindings = {};
                        for(let j=0; j<inputIds.length; j++) {
                            inputBindings[inputIds[j]] = binding[j];
                        }
                        let ensemble = {
                            modelid: modelid,
                            bindings: inputBindings,
                            runid: null,
                            status: null,
                            results: [],
                            submission_time: Date.now(),
                            selected: false
                        } as ExecutableEnsemble;
                        ensemble.id = getEnsembleHash(ensemble);

                        ensembleids.push(ensemble.id);
                        ensembles.push(ensemble);
                    })

                    // Check if any current ensembles already exist 
                    // - Note: ensemble ids are uniquely defined by the model id and inputs
                    let current_ensemble_ids = await listAlreadyRunEnsembleIds(ensembleids);

                    // Run ensembles in smaller batches
                    for(let i=0; i<ensembles.length; i+= executionBatchSize) {
                        let eslice = ensembles.slice(i, i+executionBatchSize);
                        // Get ensembles that arent already run
                        let eslice_nr = eslice.filter((ensemble) => current_ensemble_ids.indexOf(ensemble.id) < 0);
                        if(eslice_nr.length > 0) {
                            let runids = await runModelEnsembles(this.pathway, eslice_nr, datasets, tpl_package, this.prefs);
                            for(let j=0; j<eslice_nr.length; j++) {
                                eslice_nr[j].runid = runids[j];
                                eslice_nr[j].status = "WAITING";
                                eslice_nr[j].run_progress = 0;
                            }
                            addPathwayEnsembles(eslice_nr);
                        }
                        this._progress_number += eslice.length;
                    }

                    // Save pathway ensemble ids (to be used for later retrieval of ensembles)
                    setPathwayEnsembleIds(this.scenario.id, this.pathway.id,
                        model.id, batchid, ensembleids);

                    batchid++;
                }
            }
       })
    }

    _savePathwayDetails() {
        // Update notes
        let notes = "";
        if(this.shadowRoot!.getElementById("notes"))
            notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;

        this.pathway.notes = {
            ...this.pathway.notes!,
            parameters: notes
        };
        this.pathway.last_update = {
            ...this.pathway.last_update!,
            parameters: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };

        // Turn off edit mode
        this._editMode = false;

        // Update pathway
        // - Just create the whole simulation matrix here
        // - Show a message (creating workflow configuration i out of N)
        // - Store the ensembles as separate documents under <pathway>/ensembles/<id>
        // - Store workflow status
        //   - pathway -> {total: number, successful: number, failed: number, running: number}
        // Ability to search through the ensembles by certain values ?

        // - Show paged table (i.e. fetch only details of the execution_ensemble_ids in page)
        updatePathway(this.scenario, this.pathway);

        // TODO: 
        // Run pathway ensembles in the next step
        // - Show ensemble (simulation matrix) as a paged table
        // - Read current ensemble ids from ensembles collection
        // - Run particular workflows
        // - Run all workflows in page ?
        // - Run all workflows in pathway
        // - While running - Show a modal window
        //      - DO NOT CLOSE while submitting workflows
        //      - Submit 1 by 1 ? (or 4 by 4)
        //      - Show progress bar (submitted i out of N workflows)
        //      - After submission, update the ensemble with the run id returned
        
        // Monitoring pathway ensembles
        // - 
        
        /*
        let indices = []; // Run all ensembles that haven't already been run
        for(let i=0; i<this.pathway.executable_ensembles!.length; i++) {
            if(!this.pathway.executable_ensembles![i].runid)
                indices.push(i);
        }
        runPathwayExecutableEnsembles(this.scenario, this.pathway, this.prefs, indices, this.shadowRoot); 

        showNotification("runNotification", this.shadowRoot!);
        */
    }

    _setPathwayParametersAndRun() {
        Object.keys(this.pathway.models!).map((modelid) => {
            let model = this.pathway.models![modelid];
            let input_parameters = model.input_parameters
                    .filter((input) => !input.value)
                    .sort((a, b) => a.name.localeCompare(b.name));
            input_parameters.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_parameter_ensemble: string[] = (this.pathway.model_ensembles![modelid] || {})[inputid];
                if(!this._editMode && current_parameter_ensemble && current_parameter_ensemble.length > 0) {
                    return;
                }

                let new_parameters = this._getParameterSelections(model, inputid);
        
                // Now add the rest of the new datasets
                let model_ensembles: ModelEnsembleMap = this.pathway.model_ensembles || {};
                if(!model_ensembles[modelid])
                    model_ensembles[modelid] = {};
                if(!model_ensembles[modelid][inputid])
                    model_ensembles[modelid][inputid] = [];
                model_ensembles[modelid][inputid] = new_parameters;

                // Create new pathway
                this.pathway = {
                    ...this.pathway,
                    model_ensembles: model_ensembles
                }                        
            })
        });
 
        this._saveAndRunExecutableEnsembles();
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        
        let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        if(this.pathway && this.pathway.models != this._models) {
            this._models = this.pathway.models!;
            if(this.pathway.id != pathwayid)  {
                this._resetEditMode();
                this._current_ensemble_ids = [];
            }
        }
    }    
}
