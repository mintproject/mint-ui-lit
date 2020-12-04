import { html } from "lit-element";
import { Variable, VariableMap } from "screens/variables/reducers";
import { MintEvent } from "../screens/modeling/reducers";

export const renderVariables = (variables: VariableMap, readonly: boolean, response_callback: Function, driving_callback: Function) => {
    return html`
        <p>
        Indicators are the variables or index that indicates the state of the system being modeled.
        Adjustable parameters are the variables and interventions you are interested in changing to explore outcomes on the indicator.
        </p>
        <div class="input_full">
            <label>Indicators/Response of interest <span style="font-family: auto;">*</span></label>
            ${renderResponseVariables("", variables, readonly, response_callback)}
        </div>  
        <br />
        <div class="input_full">
            <label>Adjustable Variables</label>
            ${renderDrivingVariables("", variables, readonly, driving_callback)}
        </div>                            
    `;
}

export const renderNotifications = () => {
    return html`
    <wl-snackbar id="formValuesIncompleteNotification" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">error</wl-icon>
        <span>Please fill in all the required values.</span>
    </wl-snackbar>
    <wl-snackbar id="saveNotification" hideDelay="1000" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">save</wl-icon>
        <span>Saving...</span>
    </wl-snackbar>
    <wl-snackbar id="deleteNotification" hideDelay="1000" fixed backdrop disableFocusTrap>
        <wl-icon slot="icon">delete</wl-icon>
        <span>Deleting...</span>
    </wl-snackbar>   
    <wl-snackbar id="runNotification" hideDelay="1000" fixed backdrop>
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

export const renderResponseVariables = (variableid: string, variables: VariableMap, readonly: boolean, callback: Function) => {
    let indicatorsByCategory = {};
    Object.values(variables).filter((varobj) => varobj.is_indicator).map((varobj) => {
        (varobj.categories || []).map((category) => {
            if(!indicatorsByCategory[category])
                indicatorsByCategory[category] = [];
            indicatorsByCategory[category].push(varobj);
        })
    });
    return html`
        <select name="response_variable" ?disabled="${readonly}" @change=${callback}>
            ${Object.keys(indicatorsByCategory).sort().map((categoryname) => {
                let indicators = indicatorsByCategory[categoryname] as Variable[];
                return html`
                <optgroup label="${categoryname}">
                ${indicators.sort((a,b) => a.name < b.name ? -1 : 1).map((varobj) => {
                    let stdname = varobj.id;
                    let name = varobj.name;
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

export const renderDrivingVariables = (variableid: string, variables: VariableMap, readonly: boolean, callback: Function) => {
    let adjustmentsByCategory = {};
    Object.values(variables).filter((varobj) => varobj.is_adjustment_variable).map((varobj) => {
        (varobj.categories || []).map((category) => {
            if(!adjustmentsByCategory[category])
                adjustmentsByCategory[category] = [];
            adjustmentsByCategory[category].push(varobj);
        })
    });    
    return html`
        <select name="driving_variable" ?disabled="${readonly}" @change=${callback}>
            <option value="">None</option>
            ${Object.keys(adjustmentsByCategory).sort().map((categoryname) => {
                let adjustments = adjustmentsByCategory[categoryname] as Variable[];
                return html`
                <optgroup label="${categoryname}">
                ${adjustments.sort((a,b) => a.name < b.name ? -1 : 1).map((varobj) => {
                    let stdname = varobj.id;
                    let name = varobj.name;
                    let intervention = varobj.intervention;
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

export const renderLastUpdateText = (info: MintEvent) => {
    let date = info.timestamp;
    return html `
        <div class="information">Last updated by ${info.userid} on ${date.toString()}</div>
    `;
}

export const renderExternalLink = (uri, label?) => {
    return html`<a target='_blank' href="${uri}">${label? label : uri}</a>`
}
