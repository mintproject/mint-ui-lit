import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import ReactGA from 'react-ga';

import { DataEnsembleMap, ModelEnsembleMap, Thread, ExecutionSummary, ThreadEvent } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model, ModelParameter } from "../../models/reducers";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { TASK_DONE, getThreadParametersStatus } from "../../../util/state_functions";
import { updateThread, deleteAllThreadExecutionIds } from "../actions";
import { showNotification } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { MintThreadPage } from "./mint-thread-page";
import { IdMap } from "../../../app/reducers";
import { getPathFromModel } from "../../models/reducers";

import "weightless/progress-bar";
import { getLatestEventOfType } from "util/event_utils";
import { getUpdateEvent, getCustomEvent, getTotalConfigs } from "../../../util/graphql_adapter";

const MAX_PARAMETER_COMBINATIONS = 100000;

@customElement('mint-parameters')
export class MintParameters extends connect(store)(MintThreadPage) {

    @property({type: Object})
    private _models!: IdMap<Model>;

    @property({type: Boolean})
    private _editMode: Boolean = false;

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
                Please specify the values for the adjustable parameters.
            </p>
            Please select model(s) first
            `
        }

        let done = (getThreadParametersStatus(this.thread) == TASK_DONE);
        if(!done) {
            this._editMode = true;
        }
        let latest_update_event = getLatestEventOfType(["CREATE", "UPDATE"], this.thread.events);
        let latest_parameter_event = getLatestEventOfType(["SELECT_PARAMETERS"], this.thread.events);
        
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
            ${(Object.keys(this.thread.models) || []).map((modelid) => {
                let model = this.thread.models![modelid];
                let url = this._regionid + '/models/explore' + getPathFromModel(model) + "/";
                // Get any existing ensemble selection for the model
                let ensembles:DataEnsembleMap = this.thread.model_ensembles![modelid] || {};
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
                                @click="${() => this._setThreadParameters()}">Select &amp; Continue</wl-button>                            
                        `
                        : 
                        html`
                            <wl-button type="button" class="submit" 
                                @click="${() => store.dispatch(selectThreadSection("runs"))}">Continue</wl-button>                        
                        `
                        }
                </div>
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea id="notes">${latest_parameter_event?.notes ? latest_parameter_event.notes : ""}</textarea>
                </fieldset>
                `: 
                html`
                <div class="footer">
                    <wl-button type="button" class="submit" @click="${() => store.dispatch(selectThreadSection("runs"))}">Continue</wl-button>
                </div>
                ${latest_parameter_event?.notes ? 
                    html `
                    <div class="notepage">${renderLastUpdateText(latest_parameter_event)}</div>
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

    _setThreadParameters() {
        ReactGA.event({
          category: 'Thread',
          action: 'Parameters continue',
        });
        let model_ensembles: ModelEnsembleMap = {
            ... (this.thread.model_ensembles || {})
        };
        let execution_summary : IdMap<ExecutionSummary> = {};

        let allok = true;

        Object.keys(this.thread.models!).map((modelid) => {
            let model = this.thread.models![modelid];
            let input_parameters = model.input_parameters
                    .filter((input) => !input.value);
            input_parameters.filter((input) => !input.value).map((input) => {
                let inputid = input.id!;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_parameter_ensemble: string[] = (this.thread.model_ensembles![modelid] || {})[inputid];
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

            let totalconfigs = getTotalConfigs(model, model_ensembles[modelid], this.thread);
            if(totalconfigs > MAX_PARAMETER_COMBINATIONS) {
                alert("Too many parameter combinations (" + totalconfigs + ") for the model '" + model.name + "'");
                allok = false;
                return;
            }
            execution_summary[modelid] = {
                total_runs: totalconfigs,
                submitted_runs: 0,
                failed_runs: 0,
                successful_runs: 0
            } as ExecutionSummary;
        });

        if(!allok) {
            return;
        }

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;    
        let newthread = {
            ...this.thread
        };
        newthread.events.push(getCustomEvent("SELECT_PARAMETERS", notes) as ThreadEvent);

        this._editMode = false;

        // Update thread
        newthread = {
            ...newthread,
            model_ensembles: model_ensembles,
            execution_summary: execution_summary
        }

        // Delete existing thread ensemble ids
        deleteAllThreadExecutionIds(newthread.id, null).then(() => {
            updateThread(newthread);
        });

        showNotification("saveNotification", this.shadowRoot!);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegion(state);
        
        let thread_id = this.thread ? this.thread.id : null;
        super.setThread(state);
        if(this.thread && this.thread.models != this._models) {
            this._models = this.thread.models!;
            if(this.thread.id != thread_id)  {
                this._resetEditMode();
            }
        }
    }    
}
