var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { SharedStyles } from "./shared-styles";
import "weightless/title";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";
import { updatePathway } from "../actions/mint";
import { BASE_HREF } from "../actions/app";
import { MintPathwayPage } from "./mint-pathway-page";
import { renderNotifications, renderResponseVariables, renderDrivingVariables, renderLastUpdateText } from "../util/ui_renders";
import { formElementsComplete, showNotification, hideNotification } from "../util/ui_functions";
import { selectPathwaySection } from "../actions/ui";
import { getVariableLongName } from "../util/variable_list";
let MintVariables = class MintVariables extends connect(store)(MintPathwayPage) {
    constructor() {
        super(...arguments);
        this._editMode = false;
    }
    static get styles() {
        return [
            SharedStyles,
            css `
          `
        ];
    }
    render() {
        let driverids = (this.pathway ? this.pathway.driving_variables : []) || [];
        let responseids = (this.pathway ? this.pathway.response_variables : []) || [];
        return html `
        <p>
            This step is for selecting driving and response variables for your analysis. The response variable indicates the kind of results that you're interested in. 
            An optional driving variable indicates the kind of inputs that you want to use to drive the results. 
        </p>
        ${(responseids.length > 0 && !this._editMode) ?
            // Response variable chosen already
            html `
            <p>
                Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.
            </p>

            <div class="clt">
                <wl-title level="3">
                    Variables
                    <wl-icon @click="${() => { this._editMode = true; }}" id="editVariablesIcon"
                        class="actionIcon">edit</wl-icon>
                </wl-title>
                <wl-tooltip anchor="#editVariablesIcon" 
                        .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                        anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                    Change Variable Selection
                </wl-tooltip>                
                <ul>
                    <li>
                        <wl-title level="4">
                            Response Variables
                        </wl-title>
                        <ul>
                            ${responseids.map((responseid) => {
                return html `
                                <li>
                                    <a id="response_variable_href" href="${BASE_HREF}variables/${responseid}">${getVariableLongName(responseid)}</a>
                                    <wl-tooltip anchor="#response_variable_href" 
                                        .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                                        anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                                        Standard MINT name: ${responseid}
                                    </wl-tooltip>                                    
                                </li>
                                `;
            })}
                        </ul>
                    </li>
                    <li>
                        <wl-title level="4">
                            Driving Variables
                        </wl-title>
                        <ul>
                            ${driverids.length > 0 ?
                driverids.map((driverid) => {
                    return html `
                                    <li>
                                        <a id="driving_variable_href" href="${BASE_HREF}variables/${driverid}">${getVariableLongName(driverid)}</a>
                                        <wl-tooltip anchor="#driving_variable_href" 
                                            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                                            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                                            Standard MINT name: ${driverid}
                                        </wl-tooltip>
                                    </li>
                                    `;
                })
                :
                    html `None Selected`}
                        </ul>
                    </li>
                </ul> 
            </div> 
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("models"))}">Continue</wl-button>
            </div>
            
            ${this.pathway.last_update && this.pathway.last_update.variables ?
                html `
                <div class="notepage">${renderLastUpdateText(this.pathway.last_update.variables)}</div>
                ` : html ``}
            ${this.pathway.notes && this.pathway.notes.variables ?
                html `
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${this.pathway.notes.variables}</div>
                </fieldset>
                ` : html ``}
            `
            :
                html `
            <div class="clt">
                <wl-title level="3">
                    Variables
                </wl-title>
                <form id="variablesForm">
                <ul>
                    <li>
                        <wl-title level="4">
                            Response Variables*
                            <wl-icon @click="${() => { this._editMode = true; }}" id="addVariablesIcon" class="actionIcon">add</wl-icon>
                        </wl-title>
                        <ul>
                            <li>
                                <div class="input_half">
                                ${responseids.length == 0 ?
                    renderResponseVariables("")
                    :
                        responseids.map((responseid) => {
                            return renderResponseVariables(responseid);
                        })}
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <wl-title level="4">
                            Driving Variables
                            <wl-icon @click="${() => { this._editMode = true; }}" id="addVariablesIcon" class="actionIcon">add</wl-icon>
                        </wl-title>
                        <ul>
                            <li>
                                <div class="input_half">
                                ${driverids.length == 0 ?
                    renderDrivingVariables("")
                    :
                        driverids.map((driverid) => {
                            return renderDrivingVariables(driverid);
                        })}
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
                <div class="footer">
                    ${this._editMode ? html `<wl-button @click="${this._onSetVariablesCancel}" flat inverted>CANCEL</wl-button>` : html ``}
                    <wl-button type="button" class="submit" @click="${this._onSetVariablesSubmit}">Select &amp; Continue</wl-button>
                </div>
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <textarea name="notes">${this.pathway.notes ? this.pathway.notes.variables : ""}</textarea>
                </fieldset>
                </form>
            </div> 
            `}

        ${renderNotifications()}
        `;
    }
    _onSetVariablesSubmit() {
        let form = this.shadowRoot.querySelector("#variablesForm");
        if (formElementsComplete(form, ["response_variable"])) {
            let driving_variable = form.elements["driving_variable"].value;
            let response_variable = form.elements["response_variable"].value;
            this.pathway = Object.assign({}, this.pathway);
            this.pathway.driving_variables = driving_variable ? [driving_variable] : [];
            this.pathway.response_variables = response_variable ? [response_variable] : [];
            // Update notes
            let notes = form.elements["notes"].value;
            this.pathway.notes = Object.assign({}, this.pathway.notes, { variables: notes });
            this.pathway.last_update = Object.assign({}, this.pathway.last_update, { variables: {
                    time: Date.now(),
                    user: this.user.email
                } });
            updatePathway(this.scenario, this.pathway);
            this._editMode = false;
            //hideDialog("variablesDialog", this.shadowRoot!);
            showNotification("saveNotification", this.shadowRoot);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot);
        }
        return false;
    }
    _onSetVariablesCancel() {
        this._editMode = false;
        //hideDialog("variablesDialog", this.shadowRoot!);
    }
    stateChanged(state) {
        super.setUser(state);
        if (super.setPathway(state)) {
            hideNotification("saveNotification", this.shadowRoot);
        }
    }
};
__decorate([
    property({ type: Boolean })
], MintVariables.prototype, "_editMode", void 0);
MintVariables = __decorate([
    customElement('mint-variables')
], MintVariables);
export { MintVariables };
