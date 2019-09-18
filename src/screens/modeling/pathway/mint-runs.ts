import { customElement, html, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";

import "weightless/progress-bar";
import { runPathwayExecutableEnsembles, checkPathwayEnsembleStatus } from "../../../util/state_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { showNotification } from "util/ui_functions";
import { renderNotifications } from "util/ui_renders";
import { Model } from "screens/models/reducers";
import { ExecutableEnsemble } from "../reducers";

@customElement('mint-runs')
export class MintRuns extends connect(store)(MintPathwayPage) {

    static get styles() {
        return [
          SharedStyles,
          css`
          `
        ]
    }
    
    protected render() {
        if(!this.pathway) {
            return html ``;
        }
        
        // If no models selected
        if(!this.pathway.executable_ensembles || !this.pathway.executable_ensembles.length) {
            return html `
            <p>
                This step is for monitoring model runs. You can view results of these runs in the next step.  You can
                also see if runs failed, and look into the reasons so the model can be used properly.
            </p>
            Please setup and run some models first
            `
        }

        let running_ensembles = {};
        let not_running_ensembles = {};

        for(let i=0; i<this.pathway.executable_ensembles.length; i++) {
            let ensemble = this.pathway.executable_ensembles[i];
            if(ensemble.runid) {
                running_ensembles[""+i] = ensemble;
            }
            else {
                not_running_ensembles[""+i] = ensemble;
            }
        }
        
        // Group running ensembles
        let running_grouped_ensembles = {};
        Object.keys(running_ensembles).map((index) => {
            let ensemble: ExecutableEnsemble = running_ensembles[index];
            let model = this.pathway.models![ensemble.modelid];
            if(!running_grouped_ensembles[model.id]) {
                running_grouped_ensembles[model.id] = {
                    ensembles: {},
                    params: [],
                    inputs: [],
                    outputs: []
                };
                let input_parameters = model.input_parameters
                    .filter((input) => !input.value)
                    .sort((a, b) => a.name.localeCompare(b.name));
                input_parameters.map((ip) => {
                    if(!ip.value)
                        running_grouped_ensembles[model.id].params.push(ip);
                })
                model.input_files.map((inf) => {
                    if(!inf.value)
                        running_grouped_ensembles[model.id].inputs.push(inf);
                })
            }
            running_grouped_ensembles[model.id].ensembles[index] = ensemble;
        });

        // Group ensembles that aren't running
        let not_running_grouped_ensembles = {};
        Object.keys(not_running_ensembles).map((index) => {
            let ensemble: ExecutableEnsemble = not_running_ensembles[index];
            let model = this.pathway.models![ensemble.modelid];
            if(!not_running_grouped_ensembles[model.id]) {
                not_running_grouped_ensembles[model.id] = {
                    ensembles: {},
                    params: [],
                    inputs: [],
                    outputs: []
                };
                let input_parameters = model.input_parameters
                    .filter((input) => !input.value)
                    .sort((a, b) => a.name.localeCompare(b.name));
                input_parameters.map((ip) => {
                    if(!ip.value)
                        not_running_grouped_ensembles[model.id].params.push(ip);
                })
                model.input_files.map((inf) => {
                    if(!inf.value)
                        not_running_grouped_ensembles[model.id].inputs.push(inf);
                })
            }
            /* Check if all inputs are bound */
            let allbound = true;
            model.input_parameters.map((ip) => {
                if(!ip.value && !ensemble.bindings[ip.id])
                    allbound = false;
            })
            model.input_files.map((inf) => {
                if(!inf.value && !ensemble.bindings[inf.id])
                    allbound = false;
            })

            if(allbound)
                not_running_grouped_ensembles[model.id].ensembles[index] = ensemble;
        });        


        return html`
        <p>
            This step is for monitoring model runs. You can view results of these runs in the next step
        </p>
        <wl-title level="3">Runs</wl-title>
        <div class="clt">
            <ul>
                <li>
                    <wl-title level="4">Model Runs executed</wl-title>
                    <ul>
                    ${Object.keys(running_grouped_ensembles).map((modelid) => {
                        let grouped_ensemble = running_grouped_ensembles[modelid];
                        let model = this.pathway.models![modelid];
                        return html`
                        <li>
                            <wl-title level="4">Runs for <a href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                            <table class="pure-table pure-table-bordered run_table">
                                <!-- Heading -->
                                <colgroup span="1"></colgroup> <!-- Run Status -->
                                ${grouped_ensemble.inputs.length > 0 ? 
                                    html `<colgroup span="${grouped_ensemble.inputs.length}"></colgroup>` : ""} <!-- Inputs -->
                                ${grouped_ensemble.params.length > 0 ? 
                                    html `<colgroup span="${grouped_ensemble.params.length}"></colgroup>` : ""} <!-- Parameters -->
                                <thead>
                                    <tr>
                                        <th></th> <!-- Run Status -->
                                        ${grouped_ensemble.inputs.length > 0 ? 
                                            html `<th colspan="${grouped_ensemble.inputs.length}">Inputs</th>` : ""} <!-- Inputs -->
                                        ${grouped_ensemble.params.length > 0 ? 
                                            html `<th colspan="${grouped_ensemble.params.length}">Parameters</th>` : ""} <!-- Parameters -->
                                    </tr>
                                    <tr>
                                        <th>Run Status</th>
                                        ${grouped_ensemble.inputs.length + grouped_ensemble.params.length == 0 ?     
                                            html`<th></th>` : ""
                                        }
                                        ${grouped_ensemble.inputs.map((inf) => html`<th scope="col">${inf.name.replace(/(-|_)/g, ' ')}</th>` )}
                                        ${grouped_ensemble.params.map((param) => html`<th scope="col">${param.name.replace(/(-|_)/g, ' ')}</th>` )}
                                    </tr>
                                </thead>
                                <!-- Body -->
                                <tbody>
                                ${Object.keys(grouped_ensemble.ensembles).map((index) => {
                                    let ensemble: ExecutableEnsemble = grouped_ensemble.ensembles[index];
                                    let model = this.pathway.models![ensemble.modelid];
                                    return html`
                                        <tr>
                                            <td>
                                                <wl-progress-bar mode="determinate" class="${ensemble.status}"
                                                    value="${ensemble.status == "FAILURE" ? 100 : (ensemble.run_progress || 0)}"></wl-progress-bar>
                                            </td>
                                            ${grouped_ensemble.inputs.length + grouped_ensemble.params.length == 0 ? 
                                                html`<td>No inputs or parameters</td>` : ""
                                            }
                                            ${grouped_ensemble.inputs.map((input) => {
                                                let dsid = ensemble.bindings[input.id];
                                                let dataset = this.pathway.datasets![dsid];
                                                if(dataset) {
                                                    // FIXME: This should be resolved to a collection of resources
                                                    let furl = this._getDatasetURL(dataset.name); 
                                                    return html`
                                                        <td><a href="${furl}">${dataset.name}</a></td>
                                                    `;
                                                }
                                            })}
                                            ${grouped_ensemble.params.map((param) => html`<td>${ensemble.bindings[param.id]}</td>` )}
                                        </tr>
                                    `;
                                })}
                                </tbody>
                            </table>
                        </li>`;
                    })}
                    </ul>
                    <div class="footer">
                        <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("results"))}">Continue</wl-button>
                    </div>
                </li>
                ${(Object.keys(not_running_ensembles).length > 0) ?
                    html `
                    <li>
                        <wl-title level="4">Model Runs not executed</wl-title>
                        <p>
                            These model runs have not yet been executed. To run, please select the configurations and click the RUN button.
                        </p>   
                        <ul>
                        ${Object.keys(not_running_grouped_ensembles).map((modelid) => {
                            let grouped_ensemble = not_running_grouped_ensembles[modelid];
                            let model = this.pathway.models![modelid];
                            return html`
                            <li>
                                <wl-title level="4">Run configurations for <a href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                                <table class="pure-table pure-table-striped notrun_table">
                                    <!-- Heading -->
                                    <colgroup span="1"></colgroup> <!-- Run Status -->
                                    ${grouped_ensemble.inputs.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.inputs.length}"></colgroup>` : ""} <!-- Inputs -->
                                    ${grouped_ensemble.params.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.params.length}"></colgroup>` : ""} <!-- Parameters -->
                                    <thead>
                                        <tr>
                                            <th></th> <!-- Checkbox -->
                                            ${grouped_ensemble.inputs.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.inputs.length}">Inputs</th>` : ""} <!-- Inputs -->
                                            ${grouped_ensemble.params.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.params.length}">Parameters</th>` : ""} <!-- Parameters -->
                                        </tr>
                                        <tr>
                                            <th></th>
                                            ${grouped_ensemble.inputs.map((inf) => html`<th scope="col">${inf.name.replace(/(-|_)/g, ' ')}</th>` )}
                                            ${grouped_ensemble.params.map((param) => html`<th scope="col">${param.name.replace(/(-|_)/g, ' ')}</th>` )}
                                        </tr>
                                    </thead>
                                    <!-- Body -->
                                    <tbody>
                                    ${Object.keys(grouped_ensemble.ensembles).length == 0 ? 
                                        html`
                                        <tr><td colspan="${grouped_ensemble.inputs.length + grouped_ensemble.params.length + 1}">
                                            - No completed configuration -
                                        </td></tr>` : ""
                                    }
                                    ${Object.keys(grouped_ensemble.ensembles).map((index) => {
                                        let ensemble: ExecutableEnsemble = grouped_ensemble.ensembles[index];
                                        let model = this.pathway.models![ensemble.modelid];
                                        return html`
                                            <tr>
                                                <td><input class="checkbox" type="checkbox" data-index="${index}"></input></td>
                                                ${grouped_ensemble.inputs.map((input) => {
                                                    let dsid = ensemble.bindings[input.id];
                                                    let dataset = this.pathway.datasets![dsid];
                                                    if(dataset) {
                                                        // FIXME: This should be resolved to a collection of resources
                                                        let furl = this._getDatasetURL(dataset.name); 
                                                        return html`
                                                            <td><a href="${furl}">${dataset.name}</a></td>
                                                        `;
                                                    }
                                                    else {
                                                        return html`<td> - </td>`;
                                                    }
                                                })}
                                                ${grouped_ensemble.params.map((param) => {
                                                    let val = ensemble.bindings[param.id];
                                                    if(val)
                                                        return html `<td>${ensemble.bindings[param.id]}</td>`;
                                                    else
                                                        return html `<td> - </td>`;
                                                })}
                                            </tr>
                                        `;
                                    })}
                                    </tbody>
                                </table>
                            </li>`;
                        })}
                        </ul>
                        <div class="footer">
                            <wl-button type="button" class="submit" @click="${this._runSelectedEnsembles}">Run Selected</wl-button>
                        </div>
                    </li>
                    `
                    : ""
                }
            </ul>
        </div>

        ${renderNotifications()}
        
        `;
    }

    _getModelURL (model:Model) {
        return this._regionid + '/models/explore/' + model.original_model + '/'
               + model.model_version + '/' + model.model_configuration + '/'
               + model.localname;
    }

    _getDatasetURL (dsname: string) {
        let config = this.prefs;
        let suffix = "/users/" + config.wings.username + "/" + config.wings.domain;
        var purl = config.wings.server + suffix
        var expurl = config.wings.export_url + "/export" + suffix;
        let dsid = expurl + "/data/library.owl#" + dsname;
        return purl + "/data/fetch?data_id=" + escape(dsid);
    }

    _runSelectedEnsembles() {
        let selected_indices: number[] = [];
        
        this.shadowRoot!.querySelectorAll(".notrun_table input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            if(cboxinput.checked) {
                let index = parseInt(cboxinput.dataset["index"]!);
                selected_indices.push(index);
            }
        });

        runPathwayExecutableEnsembles(this.scenario, this.pathway, this.prefs, selected_indices, this.shadowRoot); 
        
        showNotification("runNotification", this.shadowRoot!);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);
        super.setPathway(state);
        //checkPathwayEnsembleStatus(this.scenario, this.pathway, this.prefs);
    }
}
