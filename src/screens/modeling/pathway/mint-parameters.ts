import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { DataEnsembleMap, ModelEnsembleMap, StepUpdateInformation } from "../reducers";
import { SharedStyles } from "../../../styles/shared-styles";
import { Model } from "../../models/reducers";
import { renderNotifications, renderLastUpdateText } from "../../../util/ui_renders";
import { createPathwayExecutableEnsembles, runPathwayExecutableEnsembles, TASK_DONE, getPathwayParametersStatus } from "../../../util/state_functions";
import { updatePathway } from "../actions";
import { showNotification } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { IdMap } from "../../../app/reducers";

const MAX_PARAMETER_COMBINATIONS = 300;

@customElement('mint-parameters')
export class MintParameters extends connect(store)(MintPathwayPage) {

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
        if(!this.pathway) {
            return html ``;
        }
        
        // If no models selected
        if(!this.pathway.models || !Object.keys(this.pathway.models).length) {
            return html `
            <p>
                This step is for specifying input values for the models that you selected earlier.
            </p>
            Please select model(s) first
            `
        }

        let done = (getPathwayParametersStatus(this.pathway) == TASK_DONE);
        
        // If models have been selected, go over each model
        return html `
        <p>
            This step is for specifying input values for the models that you selected earlier.
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
                Change Adjustable Variable Values
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
                            <th><b>Adjustable Variable</b></th>
                            <th>Values</th>
                        </thead>
                        <tbody>
                        ${input_parameters.map((input) => {
                            let bindings:string[] = ensembles[input.id!];
                            return html`
                            <tr>
                                <td>
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
                                        bindings.join(",")
                                        :
                                        html`
                                        <div class="input_full">
                                            <input type="text" name="${input.id}" value="${(bindings||[]).join(",")}"></input>
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
        // Turn off edit mode
        this._editMode = false;

        // Update executable ensembles in the pathway
        let pathway = createPathwayExecutableEnsembles(this.pathway);
        if(pathway.executable_ensembles.length > MAX_PARAMETER_COMBINATIONS) {
            alert("Too many parameter combinations (" + pathway.executable_ensembles.length + " > " + MAX_PARAMETER_COMBINATIONS +"). \
            Please reduce the number of parameter options to continue");
            return;
        }
        this.pathway = pathway;

        // Update notes
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
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

        // Update pathway itself
        //updatePathway(this.scenario, this.pathway);
        
        let indices = []; // Run all ensembles that haven't already been run
        for(let i=0; i<this.pathway.executable_ensembles!.length; i++) {
            if(!this.pathway.executable_ensembles![i].runid)
                indices.push(i);
        }
        runPathwayExecutableEnsembles(this.scenario, this.pathway, this.prefs, indices, this.shadowRoot); 

        showNotification("runNotification", this.shadowRoot!);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        
        let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        if(this.pathway && this.pathway.models != this._models) {
            this._models = this.pathway.models!;
            if(this.pathway.id != pathwayid) 
                this._resetEditMode();
        }
    }    
}
