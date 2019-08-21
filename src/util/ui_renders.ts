import { html } from "lit-element";
import { StepUpdateInformation } from "../screens/modeling/reducers";
import { VARIABLES } from "../offline_data/variable_list";

export const renderVariables = () => {
    return html`
        <p>
        Please select a driving and a response variable. A response variable indicates the kind of results that you're interested in. 
        An optional driving variable indicates the kind of inputs that you want to use to drive the results. 
        </p>        
        <div class="formRow">
            <div class="input_half">
                <label>Response Variable</label>
                ${renderResponseVariables("")}
            </div>  
            <div class="input_half">
                <label>Driving Variable</label>
                ${renderDrivingVariables("")}
            </div>                            
        </div>     
    `;
}

export const renderNotifications = () => {
    return html`
    <wl-snackbar id="formValuesIncompleteNotification" fixed backdrop>
        <wl-icon slot="icon">error</wl-icon>
        <span>Please fill in all the required values.</span>
    </wl-snackbar>

    <wl-snackbar id="saveNotification" hideDelay="2000" fixed backdrop>
        <wl-icon slot="icon">save</wl-icon>
        <span>Saving...</span>
    </wl-snackbar>
    <wl-snackbar id="deleteNotification" hideDelay="2000" fixed backdrop>
        <wl-icon slot="icon">delete</wl-icon>
        <span>Deleting...</span>
    </wl-snackbar>   
    <wl-snackbar id="runNotification" hideDelay="10000" fixed backdrop>
        <wl-icon slot="icon">settings</wl-icon>
        <span>Sending runs...Please wait</span>
    </wl-snackbar>       
    `;
}

export const renderResponseVariables = (variableid: string) => {
    return html`
        <select name="response_variable">
            <option value disabled selected>Select Response Variable</option>
            ${Object.keys(VARIABLES['response variable']).map((categoryname) => {
                let category = VARIABLES['response variable'][categoryname];
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

export const renderDrivingVariables = (variableid: string) => {
    return html`
        <select name="driving_variable">
            <option value disabled selected>Select Driving Variable</option>
            <option value="">None</option>
            ${Object.keys(VARIABLES['driving variable']).map((categoryname) => {
                let category = VARIABLES['driving variable'][categoryname];
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

export const renderLastUpdateText = (info: StepUpdateInformation) => {
    let date = new Date(info.time);
    return html `
        <div class="information">Last updated by ${info.user} on ${date.toString()}</div>
    `;
}