var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { SharedStyles } from "./shared-styles";
import { MintPathwayPage } from "./mint-pathway-page";
import { renderNotifications, renderLastUpdateText } from "../util/ui_renders";
import { createPathwayExecutableEnsembles, runPathwayExecutableEnsembles, TASK_DONE, getPathwayParametersStatus } from "../util/state_functions";
import { updatePathway } from "../actions/mint";
import { showNotification } from "../util/ui_functions";
import { selectPathwaySection } from "../actions/ui";
let MintParameters = class MintParameters extends connect(store)(MintPathwayPage) {
    constructor() {
        super(...arguments);
        this._editMode = false;
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
        let done = (getPathwayParametersStatus(this.pathway) == TASK_DONE);
        // If models have been selected, go over each model
        return html `
        <p>
            This step is for setting up and running the models that you selected earlier.
        </p>
        ${done && !this._editMode ? html `<p>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.</p>` : html ``}
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
            ${(Object.keys(this.pathway.models) || {}).map((modelid) => {
            let model = this.pathway.models[modelid];
            // Get any existing ensemble selection for the model
            let ensembles = this.pathway.model_ensembles[modelid] || {};
            return html `
                <li>
                    <wl-title level="4">Model: ${model.name}</wl-title>
                    ${model.input_parameters.length > 0 ?
                html `
                        <p>
                            Setup the model by specifying values below.
                            You can enter more than one value (comma separated) if you want several runs.
                        </p>
                        <form id="form_${model.id}">
                        <table class="pure-table pure-table-striped">
                        <thead>
                            <th><b>Adjustable Variable</b></th>
                            <th>Values</th>
                        </thead>
                        <tbody>
                        ${model.input_parameters.map((input) => {
                    let bindings = ensembles[input.id];
                    if (bindings && bindings.length > 0 && !this._editMode) {
                        // Already present: Show selections
                        return html `
                                <tr>
                                    <td>${input.name}</td>
                                    <td>${bindings.join(",")}</td>
                                </tr>
                                `;
                    }
                    else {
                        return html `
                                <tr>
                                    <td>
                                        <wl-title level="5">${input.name}</wl-title>
                                        <div class="caption">This is a ${input.type}. The range is from ${input.min} to ${input.max}</div>
                                    </td>
                                    <td>
                                        <div class="input_full">
                                            <input type="text" name="${input.id}" value="${(bindings || []).join(",")}"></input>
                                        </div>
                                    </td>
                                </tr>
                                `;
                    }
                })}
                        </tbody>
                        </table>
                        </form>
                        `
                :
                    html `
                            <p>
                                No setup required
                            </p>
                        `}
                </li>
                `;
        })}
            </ul>
            ${!done || this._editMode ?
            html `
                <div class="footer">
                    ${this._editMode ?
                html `<wl-button flat inverted
                            @click="${() => this._setEditMode(false)}">CANCEL</wl-button>`
                : html ``}
                    <wl-button type="button" class="submit" 
                        @click="${() => this._setPathwayParametersAndRun()}">Select &amp; continue</wl-button>
                </div>  
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea id="notes">${this.pathway.notes ? this.pathway.notes.parameters : ""}</textarea>
                </fieldset>
                ` :
            html `
                <div class="footer">
                    <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("runs"))}">Continue</wl-button>
                </div>
                                
                ${this.pathway.last_update && this.pathway.last_update.parameters ?
                html `
                    <div class="notepage">${renderLastUpdateText(this.pathway.last_update.parameters)}</div>
                    ` : html ``}                
                ${this.pathway.notes && this.pathway.notes.datasets ?
                html `
                    <fieldset class="notes">
                        <legend>Notes</legend>
                        <div class="notepage">${this.pathway.notes.parameters}</div>
                    </fieldset>
                    ` : html ``}
                `}        
        </div>

        ${renderNotifications()}
        `;
    }
    _resetEditMode() {
        this._editMode = false;
    }
    _setEditMode(mode) {
        this._editMode = mode;
    }
    _getParameterSelections(modelid, inputid) {
        let form = this.shadowRoot.querySelector("#form_" + modelid);
        let inputstr = form.elements[inputid].value;
        return inputstr.split(",");
    }
    _setPathwayParametersAndRun() {
        Object.keys(this.pathway.models).map((modelid) => {
            let model = this.pathway.models[modelid];
            model.input_parameters.map((input) => {
                let inputid = input.id;
                // If not in edit mode, then check if we already have bindings for this
                // -If so, return
                let current_parameter_ensemble = (this.pathway.model_ensembles[modelid] || {})[inputid];
                if (!this._editMode && current_parameter_ensemble && current_parameter_ensemble.length > 0) {
                    return;
                }
                let new_parameters = this._getParameterSelections(modelid, inputid);
                // Now add the rest of the new datasets
                let model_ensembles = this.pathway.model_ensembles || {};
                if (!model_ensembles[modelid])
                    model_ensembles[modelid] = {};
                if (!model_ensembles[modelid][inputid])
                    model_ensembles[modelid][inputid] = [];
                model_ensembles[modelid][inputid] = new_parameters;
                // Create new pathway
                this.pathway = Object.assign({}, this.pathway, { model_ensembles: model_ensembles });
            });
        });
        // Turn off edit mode
        this._editMode = false;
        // Update executable ensembles in the pathway
        this.pathway = createPathwayExecutableEnsembles(this.pathway);
        // Update notes
        let notes = this.shadowRoot.getElementById("notes").value;
        this.pathway.notes = Object.assign({}, this.pathway.notes, { parameters: notes });
        this.pathway.last_update = Object.assign({}, this.pathway.last_update, { parameters: {
                time: Date.now(),
                user: this.user.email
            } });
        // Update pathway itself
        updatePathway(this.scenario, this.pathway);
        let indices = []; // Run all ensembles that haven't already been run
        for (let i = 0; i < this.pathway.executable_ensembles.length; i++) {
            if (!this.pathway.executable_ensembles[i].runid)
                indices.push(i);
        }
        runPathwayExecutableEnsembles(this.scenario, this.pathway, indices);
        showNotification("runNotification", this.shadowRoot);
    }
    stateChanged(state) {
        super.setUser(state);
        let pathwayid = this.pathway ? this.pathway.id : null;
        super.setPathway(state);
        if (this.pathway && this.pathway.models != this._models) {
            this._models = this.pathway.models;
            if (this.pathway.id != pathwayid)
                this._resetEditMode();
        }
    }
};
__decorate([
    property({ type: Object })
], MintParameters.prototype, "_models", void 0);
__decorate([
    property({ type: Boolean })
], MintParameters.prototype, "_editMode", void 0);
MintParameters = __decorate([
    customElement('mint-parameters')
], MintParameters);
export { MintParameters };
