import { html } from "lit-element";
import { StepUpdateInformation } from "../screens/modeling/reducers";
import { VARIABLES } from "../offline_data/variable_list";

export const renderVariables = (readonly: boolean, response_callback: Function, driving_callback: Function) => {
    return html`
        <p>
        Indicators are the variables or index that indicates the state of the system being modeled.
        Adjustable parameters are the variables and interventions you are interested in changing to explore outcomes on the indicator.
        </p>
        <div class="formRow">
            <div class="input_half">
                <label>Indicators/Response of interest</label>
                ${renderResponseVariables("", readonly, response_callback)}
            </div>  
            <div class="input_half">
                <label>Adjustable Variables</label>
                ${renderDrivingVariables("", readonly, driving_callback)}
            </div>                            
        </div>     
    `;
}

export const renderNotifications = () => {
    return html`
    <wl-snackbar id="formValuesIncompleteNotification" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">error</wl-icon>
        <span>Please fill in all the required values.</span>
    </wl-snackbar>
    <wl-snackbar id="saveNotification" hideDelay="2000" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">save</wl-icon>
        <span>Saving...</span>
    </wl-snackbar>
    <wl-snackbar id="deleteNotification" hideDelay="2000" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">delete</wl-icon>
        <span>Deleting...</span>
    </wl-snackbar>   
    <wl-snackbar id="runNotification" hideDelay="2000" fixed backdrop>
        <wl-icon slot="icon">settings</wl-icon>
        <span>Sending runs...Please wait</span>
    </wl-snackbar>       
    <wl-snackbar id="selectOneModelNotification" fixed backdrop>
        <wl-icon slot="icon">error</wl-icon>
        <span>Please select at least one model.</span>
    </wl-snackbar>
    <wl-snackbar id="selectTwoModelsNotification" fixed backdrop>
        <wl-icon slot="icon">error</wl-icon>
        <span>Please select at least two models.</span>
    </wl-snackbar>
    `;
}

export const renderResponseVariables = (variableid: string, readonly: boolean, callback: Function) => {
    return html`
        <select name="response_variable" ?disabled="${readonly}" @change=${callback}>
            ${Object.keys(VARIABLES['indicators']).map((categoryname) => {
                let category = VARIABLES['indicators'][categoryname];
                return html`
                <optgroup label="${categoryname}">
                ${Object.keys(category).map((varid) => {
                    let stdname = category[varid]["SVO_name"];
                    let name = category[varid]["long_name"];
                    return html`
                        <option value="${stdname}" ?selected="${stdname==variableid}">
                            ${name}
                        </option>
                    `;
                })}
                </optgroup>
                `
            })}
        </select>       
    `;
}

export const renderDrivingVariables = (variableid: string, readonly: boolean, callback: Function) => {
    return html`
        <select name="driving_variable" ?disabled="${readonly}" @change=${callback}>
            <option value="">None</option>
            ${Object.keys(VARIABLES['adjustment_variables']).map((categoryname) => {
                let category = VARIABLES['adjustment_variables'][categoryname];
                return html`
                <optgroup label="${categoryname}">
                ${Object.keys(category).map((varid) => {
                    let stdname = category[varid]["SVO_name"];
                    let name = category[varid]["long_name"];
                    let intervention = category[varid]["intervention"];
                    if(intervention) {
                        name += " (Intervention: " + intervention.name + ")";
                    }
                    return html`
                        <option value="${stdname}" ?selected="${stdname==variableid}">
                            ${name}
                        </option>
                    `;
                })}
                </optgroup>
                `
            })}
        </select>        
    `;
} 

export const renderLastUpdateText = (info: StepUpdateInformation) => {
    let date = new Date(info.time);
    return html `
        <div class="information">Last updated by ${info.user} on ${date.toString()}</div>
    `;
}
