import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import ReactGA from 'react-ga';

import { DataEnsembleMap, ModelEnsembleMap, StepUpdateInformation, Pathway, ExecutableEnsembleSummary } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model, ModelParameter } from "../../models/reducers";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { TASK_DONE, getPathwayParametersStatus } from "../../../util/state_functions";
import { updatePathway, deleteAllPathwayEnsembleIds } from "../actions";
import { showNotification } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { IdMap } from "../../../app/reducers";
import { getPathFromModel } from "../../models/reducers";

import "weightless/progress-bar";

const MAX_PARAMETER_COMBINATIONS = 100000;

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
        if(!done) {
            this._editMode = true;
        }
        
        // If models have been selected, go over each model
        return html `
        <p>
            This step is for specifying values for the adjustable parameters of the models that you selected earlier.
        </p>
        ${done && !this._editMode ? html`<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes and run the model.</p>`: html``}
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
                let url = this._regionid + '/models/explore' + getPathFromModel(model) + "/";
                // Get any existing ensemble selection for the model
                let ensembles:DataEnsembleMap = this.pathway.model_ensembles![modelid] || {};
                let input_parameters = model.input_parameters
                    .filter((input) => !input.value)
                    .sort((a, b) => {
                        if(a.position && b.position)
                            return a.position - b.position;
                        else 
                            return a.name.localeCompare(b.name)
                    });
                let fixed_parameters = model.input_parameters
                    .filter((input) => !!input.value)
                    .sort((a, b) => {
                        if(a.position && b.position)
                            return a.position - b.position;
                        else 
                            return a.name.localeCompare(b.name)
                    });

                return html`
                <li>
                    <wl-title level="4">
                        Model:
                        <a target="_blank" href="${url}">${model.name}</a>
                    </wl-title>
                    <ul>
                    ${fixed_parameters.length > 0 ? 
                        html `
                        <li>
                            <b> Expert modeler has selected the following parameters: </b>
                            <table class="pure-table pure-table-striped">
                                <thead>
                                    <th><b>Adjustable Parameter</b></th>
                                    <th>Values</th>
                                </thead>
                                <tbody>
                                ${fixed_parameters.map((input) => {
                                    return html`
                                    <tr>
                                        <td style="width:60%">
                                            <wl-title level="5">${input.name.replace(/_/g, ' ')}</wl-title>
                                            <div class="caption">${input.description}.</div>
                                        </td>
                                        <td>
                                            ${input.value}
                                        </td>
                                    </tr>
                                    `
                                })}
                                </tbody>
                            </table>
                        </li>
                        ` : ""
                    }
                    ${input_parameters.length > 0 ? 
                        html `
                        <li>
                            <p>
                                Setup the model by specifying values below. You can enter more than one value (comma separated) if you want several runs.
                            </p>
                            <p>
                                ${model.usage_notes}
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
                                        <wl-title level="5">${input.name.replace(/_/g, ' ')}</wl-title>
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
                                                <input type="text" name="${input.id}" 
                                                    @change="${() => this._validateInput(model, input)}"
                                                    value="${(bindings||[]).join(", ")}"></input>
                                            </div>
                                            <div id="message_${this._valid(input.name)}" 
                                                style="color:red; font-size: 12px;"></div>
                                            `
                                        }
                                    </td>
                                </tr>
                                `
                            })}
                            </tbody>
                            </table>
                            </form>
                        </li>
                        `
                        : 
                        html `
                            <li>
                                <b>There are no adjustments possible for this model</b>
                            </li>
                        `
                    }
                    </ul>
                </li>
                `;
            })}
            </ul>

            ${!done || this._editMode ? 
                html`
                <div class="footer">
                    ${this._editMode ? 
                        html`
                            <wl-button flat inverted
                                @click="${() => this._setEditMode(false)}">CANCEL</wl-button>
                            <wl-button type="button" class="submit" 
                                @click="${() => this._setPathwayParameters()}">Select &amp; Continue</wl-button>                            
                        `
                        : 
                        html`
                            <wl-button type="button" class="submit" 
                                @click="${() => store.dispatch(selectPathwaySection("runs"))}">Continue</wl-button>                        
                        `
                        }
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
        `;
    }

    _validateInput(model: Model, input: ModelParameter) {
        let paramvalues = this._getParameterSelections(model, input);
        let ok = true;
        let error = "";
        paramvalues.map((value) => {
            if(input.type == "string") {
                if(input.accepted_values && input.accepted_values.indexOf(value) < 0) {
                    ok = false;
                    error = "Accepted values are " + input.accepted_values.join(", ");
                }
            }
            else if(input.type == "int") {
                let intvalue = parseInt(value);
                if((intvalue < parseInt(input.min)) || (intvalue > parseInt(input.max))) {
                    ok = false;
                    error = "Values should be between " + input.min + " and " + input.max;
                }
            }
            else if(input.type == "float") {
                let floatvalue = parseFloat(value);
                if((floatvalue < parseFloat(input.min)) || (floatvalue > parseFloat(input.max))) {
                    ok = false;
                    error = "Values should be between " + input.min + " and " + input.max;
                }
            }
        })
        let div = this.shadowRoot!.querySelector<HTMLDivElement>("#message_"+this._valid(input.name))!;
        div.innerHTML = ok ? "" : error;
        return ok;
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

    _getParameterSelections(model: Model, input: ModelParameter) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#form_"+this._valid(model.localname || model.id))!;
        let inputField = (form.elements[input.id] as HTMLInputElement);
        if(!inputField.value) 
            inputField.value = input.default;
        return inputField.value.split(/\s*,\s*/);
    }

    _getTotalConfigs(model: Model, bindings: DataEnsembleMap, pathway: Pathway) {
        let totalconfigs = 1;
        model.input_files.map((io) => {
            if(!io.value) {
                // Expand a dataset to it's constituent resources
                // FIXME: Create a collection if the model input has dimensionality of 1
                if(bindings[io.id]) {
                    let nensemble : any[] = [];
                    bindings[io.id].map((dsid) => {
                        let ds = pathway.datasets[dsid];
                        let selected_resources = ds.resources.filter((res) => res.selected);
                        // Fix for older saved resources
                        if(selected_resources.length == 0) 
                            selected_resources = ds.resources;
                        nensemble = nensemble.concat(selected_resources);
                    });
                    totalconfigs *= nensemble.length;
                }
            }
            else {
                totalconfigs *= (io.value.resources as any[]).length;
            }
        })
        
        // Add adjustable parameters to the input ids
        model.input_parameters.map((io) => {
            if(!io.value)
                totalconfigs *= bindings[io.id].length;
        });

        return totalconfigs;
    }

    _setPathwayParameters() {
        ReactGA.event({
          category: 'Pathway',
          action: 'Parameters continue',
        });
        let model_ensembles: ModelEnsembleMap = {
            ... (this.pathway.model_ensembles || {})
        };
        let executable_ensemble_summary : IdMap<ExecutableEnsembleSummary> = {};

        let allok = true;

        Object.keys(this.pathway.models!).map((modelid) => {
            let model = this.pathway.models![modelid];
            let input_parameters = model.input_parameters
                    .filter((input) => !input.value);
            input_parameters.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_parameter_ensemble: string[] = (this.pathway.model_ensembles![modelid] || {})[inputid];
                if(!this._editMode && current_parameter_ensemble && current_parameter_ensemble.length > 0) {
                    return;
                }

                let new_parameters = this._getParameterSelections(model, input);
        
                // Now add the rest of the new datasets
                if(!model_ensembles[modelid])
                    model_ensembles[modelid] = {};
                if(!model_ensembles[modelid][inputid])
                    model_ensembles[modelid][inputid] = [];
                model_ensembles[modelid][inputid] = new_parameters;
            })

            let totalconfigs = this._getTotalConfigs(model, model_ensembles[modelid], this.pathway);
            if(totalconfigs > MAX_PARAMETER_COMBINATIONS) {
                alert("Too many parameter combinations (" + totalconfigs + ") for the model '" + model.name + "'");
                allok = false;
                return;
            }
            executable_ensemble_summary[modelid] = {
                total_runs: totalconfigs,
                submitted_runs: 0,
                failed_runs: 0,
                successful_runs: 0
            } as ExecutableEnsembleSummary;
        });

        if(!allok) {
            return;
        }

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        
        let newpathway = {
            ...this.pathway
        };
        newpathway.notes = {
            ...newpathway.notes!,
            parameters: notes
        };
        newpathway.last_update = {
            ...newpathway.last_update!,
            parameters: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };

        this._editMode = false;

        // Update pathway
        newpathway = {
            ...newpathway,
            model_ensembles: model_ensembles,
            executable_ensemble_summary: executable_ensemble_summary
        }

        // Delete existing pathway ensemble ids
        deleteAllPathwayEnsembleIds(this.scenario.id, newpathway.id, null).then(() => {
            updatePathway(this.scenario, newpathway);
        });

        showNotification("saveNotification", this.shadowRoot!);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegion(state);
        
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
