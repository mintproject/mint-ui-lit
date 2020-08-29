import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import { updateThread } from "../actions";
import { BASE_HREF } from "../../../app/actions";
import { renderNotifications, renderResponseVariables, renderDrivingVariables, renderLastUpdateText } from "../../../util/ui_renders";
import { formElementsComplete, showNotification, hideNotification } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { getVariableLongName } from "../../../offline_data/variable_list";
import { MintThreadPage } from "./mint-thread-page";

@customElement('mint-variables')
export class MintVariables extends connect(store)(MintThreadPage) {
    @property({type: Boolean})
    private _editMode: Boolean = false;

    static get styles() {
        return [
          SharedStyles,
          css`
          `
        ]
    }
    
    protected render() {
        if(!this.thread) {
            return html ``;
        }
        let driverids = (this.thread ? this.thread.driving_variables : []) || [];
        let responseids = (this.thread ? this.thread.response_variables: []) || [];
        return html `
        <p>
            This step is for selecting indicators and adjustable variables for your analysis. 
            An indicator is an index or a variable of interest that results from a model.
            An adjustable variable indicates the kind of inputs that you want to use to drive the results. 
        </p>
        ${(responseids.length > 0 && !this._editMode) ? 
            // Response variable chosen already
            html`
            <p>
                Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.
            </p>

            <div class="clt">
                <wl-title level="3">
                    Variables
                    <wl-icon @click="${() => {this._editMode = true}}" id="editVariablesIcon"
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
                            Indicators
                        </wl-title>
                        <ul>
                            ${responseids.length > 0 ?
                                responseids.map((responseid) => {
                                    console.log('>', responseid);
                                    return html`
                                    <li>
                                        <a id="response_variable_href" href="${BASE_HREF}variables/${responseid}">${getVariableLongName(responseid)}</a>
                                        <wl-tooltip anchor="#response_variable_href" 
                                            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                                            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                                            Standard MINT name: ${responseid}
                                        </wl-tooltip>                                    
                                    </li>
                                    `
                                })
                                :
                                html`None Selected`
                            }
                        </ul>
                    </li>
                    <li>
                        <wl-title level="4">
                            Adjustable Variables
                        </wl-title>
                        <ul>
                            ${driverids.length > 0 ? 
                                driverids.map((driverid) => {
                                    return html`
                                    <li>
                                        <a id="driving_variable_href" href="${BASE_HREF}variables/${driverid}">${getVariableLongName(driverid)}</a>
                                        <wl-tooltip anchor="#driving_variable_href" 
                                            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                                            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                                            Standard MINT name: ${driverid}
                                        </wl-tooltip>
                                    </li>
                                    `
                                })
                                :
                                html`None Selected`
                            }
                        </ul>
                    </li>
                </ul> 
            </div> 
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectThreadSection("models"))}">Continue</wl-button>
            </div>
            `
        :
            html`
            <div class="clt">
                <wl-title level="3">
                    Variables
                </wl-title>
                <form id="variablesForm">
                <ul>
                    <li>
                        <wl-title level="4">
                            Indicators*
                            <wl-icon @click="${() => {this._editMode = true}}" id="addVariablesIcon" class="actionIcon">add</wl-icon>
                        </wl-title>
                        <ul>
                            <li>
                                <div class="input_half">
                                ${responseids.length == 0 ?
                                    renderResponseVariables("", false, ()=>{})
                                :
                                    responseids.map((responseid) => {
                                        return renderResponseVariables(responseid, false, ()=>{});
                                    })
                                }
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <wl-title level="4">
                            Adjustable Variables
                            <wl-icon @click="${() => {this._editMode = true}}" id="addVariablesIcon" class="actionIcon">add</wl-icon>
                        </wl-title>
                        <ul>
                            <li>
                                <div class="input_half">
                                ${driverids.length == 0 ?
                                    renderDrivingVariables("", false, ()=>{})
                                    :
                                    driverids.map((driverid) => {
                                        return renderDrivingVariables(driverid, false, ()=>{});
                                    })
                                }
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
                <div class="footer">
                    ${this._editMode ? html `<wl-button @click="${this._onSetVariablesCancel}" flat inverted>CANCEL</wl-button>`: html``}
                    <wl-button type="button" class="submit" @click="${this._onSetVariablesSubmit}">Select &amp; Continue</wl-button>
                </div>
                </form>
            </div> 
            `
        }

        ${renderNotifications()}
        `
    }

    _onSetVariablesSubmit() {
        let form: HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#variablesForm")!;
        if (formElementsComplete(form, ["response_variable"])) {
            let driving_variable = (form.elements["driving_variable"] as HTMLSelectElement).value;
            let response_variable = (form.elements["response_variable"] as HTMLSelectElement).value;
            let newthread = {
                ...this.thread
            }
            newthread.driving_variables = driving_variable ? [driving_variable] : [];
            newthread.response_variables = response_variable ? [response_variable] : [];

            // Update notes
            // let notes = (form.elements["notes"] as HTMLTextAreaElement).value;
            updateThread(newthread);
            
            this._editMode = false;
            //hideDialog("variablesDialog", this.shadowRoot!);
            showNotification("saveNotification", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
        return false;
    }

    _onSetVariablesCancel() {
        this._editMode = false;
        //hideDialog("variablesDialog", this.shadowRoot!);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        if(super.setThread(state)) {
            hideNotification("saveNotification", this.shadowRoot!);
        }
    }
}
