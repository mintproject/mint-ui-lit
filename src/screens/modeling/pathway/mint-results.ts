import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";
import { getPathwayRunsStatus, TASK_DONE, matchVariables } from "../../../util/state_functions";
import { ExecutableEnsemble, StepUpdateInformation } from "../reducers";
import { updatePathway } from "../actions";
import { showNotification } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { renderLastUpdateText } from "../../../util/ui_renders";
import { MintPathwayPage } from "./mint-pathway-page";
import { Model } from "screens/models/reducers";

@customElement('mint-results')
export class MintResults extends connect(store)(MintPathwayPage) {

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
        if(!this.pathway) {
            return html ``;
        }
        
        // If no models selected
        /*
        if(getPathwayRunsStatus(this.pathway) != TASK_DONE) {
            return html `
            <p>This step is for browsing the results of the models that you ran earlier.</p>
            Please run some models first
            `
        }
        */

        let running_ensembles = {};
        let not_running_ensembles = {};
        let done = false;

        for(let i=0; i<this.pathway.executable_ensembles!.length; i++) {
            let ensemble = this.pathway.executable_ensembles![i];
            if(ensemble.runid) {
                running_ensembles[""+i] = ensemble;
                if(ensemble.selected)
                    done = true;
            }
            else {
                not_running_ensembles[""+i] = ensemble;
            }
        }
        
        let readmode = (done && !this._editMode);

        let grouped_ensembles = {};
        Object.keys(running_ensembles).map((index) => {
            let ensemble: ExecutableEnsemble = running_ensembles[index];
            let model = this.pathway.models![ensemble.modelid];
            if(!grouped_ensembles[model.id]) {
                grouped_ensembles[model.id] = {
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
                        grouped_ensembles[model.id].params.push(ip);
                })
                model.input_files.map((inf) => {
                    if(!inf.value)
                        grouped_ensembles[model.id].inputs.push(inf);
                })
                model.output_files.map((outf) => {
                    if(matchVariables(this.pathway.response_variables, outf.variables, false))
                        grouped_ensembles[model.id].outputs.push(outf);
                })
            }
            grouped_ensembles[model.id].ensembles[index] = ensemble;
        });

        // Show executable ensembles
        return html`

        <p>This step is for browsing the results of the models that you ran earlier. 
        You can select the results that you would like to keep, and they will be recorded</p>
        ${readmode ? 
            html`
            <p>
            Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to to see all the runs and 
            select those that you want to save, only saved runs are shown here
            </p>`
            : 
            html``
        }
        
        <wl-title level="3">
            Results
            <wl-icon @click="${() => { this._editMode = true } }" 
                id="editResultsIcon" class="actionIcon editIcon">edit</wl-icon>
        </wl-title>
        <wl-tooltip anchor="#editResultsIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
                anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Change Result Selections
        </wl-tooltip>
        <div class="clt">
            ${!readmode ? 
                html `
                <p>
                    These results have been produced by running these models with the input combinations indicated.
                </p>
                ` : 
                html``
            }
            <ul>
                    ${Object.keys(grouped_ensembles).map((modelid) => {
                        let grouped_ensemble = grouped_ensembles[modelid];
                        let model = this.pathway.models![modelid];
                        return html`
                            <li>
                                <wl-title level="4">Results for <a href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                                <table class="pure-table pure-table-striped results_table">
                                    <!-- Heading -->
                                    ${!readmode ? 
                                        html `<colgroup span="1"></colgroup>`: ""} <!-- Checkbox -->
                                    ${grouped_ensemble.outputs.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.outputs.length}"></colgroup>` : ""} <!-- Outputs -->
                                    ${grouped_ensemble.inputs.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.inputs.length}"></colgroup>` : ""} <!-- Inputs -->
                                    ${grouped_ensemble.params.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.params.length}"></colgroup>` : ""} <!-- Parameters -->
                                    <thead>
                                        <tr>
                                            ${!readmode ? 
                                                html `<th></th>`: ""} <!-- Checkbox -->
                                            ${grouped_ensemble.outputs.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.outputs.length}">Outputs</th>` : ""} <!-- Outputs -->
                                            ${grouped_ensemble.inputs.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.inputs.length}">Inputs</th>` : ""} <!-- Inputs -->
                                            ${grouped_ensemble.params.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.params.length}">Parameters</th>` : ""} <!-- Parameters -->
                                        </tr>
                                        <tr>
                                            ${!readmode ? 
                                                html `<th></th>`: ""} <!-- Checkbox -->
                                            ${grouped_ensemble.outputs.map((outf) => html`<th scope="col">${outf.name.replace(/(-|_)/g, ' ')}</th>` )}
                                            ${grouped_ensemble.inputs.map((inf) => html`<th scope="col">${inf.name.replace(/(-|_)/g, ' ')}</th>` )}
                                            ${grouped_ensemble.params.map((param) => html`<th scope="col">${param.name.replace(/(-|_)/g, ' ')}</th>` )}
                                        </tr>
                                    </thead>
                                    <!-- Body -->
                                    <tbody>
                                    ${Object.keys(grouped_ensemble.ensembles).map((index) => {
                                        let ensemble: ExecutableEnsemble = grouped_ensemble.ensembles[index];
                                        let model = this.pathway.models![ensemble.modelid];
                                        if(readmode && !ensemble.selected) {
                                            return html `<tr><td>None Selected</td></tr>`;
                                        }
                                        return html`
                                            <tr>
                                                ${!readmode ? 
                                                    html`
                                                    <td><input class="checkbox" type="checkbox" 
                                                        ?checked="${ensemble.selected}"
                                                        data-index="${index}"></input></td>   
                                                    `: 
                                                    html ``
                                                }
                                                ${grouped_ensemble.outputs.map((output) => {
                                                    if(ensemble.results.length == 0) {
                                                        return html `<td></td>`;
                                                    }
                                                    return ensemble.results.map((result: any) => {
                                                        let oname = result.id.replace(/.+#/, '');
                                                        if(output.name == oname) {
                                                            let furl = this._getResultDatasetURL(result);
                                                            let filename = result.location.replace(/.+\//, '');
                                                            return html`
                                                                <td><a href="${furl}">${filename}</a></td>
                                                            `
                                                        }
                                                    });
                                                })}
                                                ${grouped_ensemble.inputs.map((input) => {
                                                    let dsid = ensemble.bindings[input.id];
                                                    let dataset = this.pathway.datasets![dsid];
                                                    // FIXME: This should be resolved to a collection of resources
                                                    let furl = this._getDatasetURL(dataset.name); 
                                                    return html`
                                                        <td><a href="${furl}">${dataset.name}</a></td>
                                                    `;
                                                })}
                                                ${grouped_ensemble.params.map((param) => html`<td>${ensemble.bindings[param.id]}</td>` )}
                                            </tr>
                                        `;
                                    })}
                                    </tbody>
                                </table>
                            </li>
                        `;
                    })}
            </ul>
        </div>
        ${!done || this._editMode ? 
            html`
            <div class="footer">
                ${this._editMode ? 
                    html `<wl-button flat inverted
                        @click="${() => {this._editMode = false;}}">CANCEL</wl-button>`
                    : html``}
                <wl-button type="button" class="submit" 
                    @click="${this._publishResults}">Select &amp; Continue</wl-button>
            </div>  
            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.results : ""}</textarea>
            </fieldset>
            `: 
            html`
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("visualize"))}">Continue</wl-button>
            </div>   
            
            ${this.pathway.last_update && this.pathway.last_update.results ? 
                html `
                <div class="notepage">${renderLastUpdateText(this.pathway.last_update.results)}</div>
                `: html ``
            }
            ${this.pathway.notes && this.pathway.notes.results ? 
                html`
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${this.pathway.notes.results}</div>
                </fieldset>
                `: html``
            }             
            `
        }   
        `;
    }

    _getModelURL (model:Model) {
        return this._regionid + '/models/explore/' + model.original_model + '/'
               + model.model_version + '/' + model.model_configuration + '/'
               + model.localname;
    }

    _getResultDatasetURL(result: any) {
        return this._getDatasetURL(result.location.replace(/.+\//, ''));
    }

    _getDatasetURL (dsname: string) {
        let config = this.prefs;
        let suffix = "/users/" + config.wings.username + "/" + config.wings.domain;
        var purl = config.wings.server + suffix
        var expurl = config.wings.export_url + "/export" + suffix;
        let dsid = expurl + "/data/library.owl#" + dsname;
        return purl + "/data/fetch?data_id=" + escape(dsid);
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);
        super.setPathway(state);
    }

    _publishResults() {

        let executable_ensembles = this.pathway.executable_ensembles || [];
        this.shadowRoot!.querySelectorAll(".results_table input.checkbox").forEach((cbox) => {
            let cboxinput = (cbox as HTMLInputElement);
            let index = parseInt(cboxinput.dataset["index"]!);
            executable_ensembles![index].selected = cboxinput.checked;
        });

        // Update notes
        this.pathway = {
            ...this.pathway,
            executable_ensembles: executable_ensembles
        }

        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        this.pathway.notes = {
            ...this.pathway.notes!,
            results: notes
        };
        this.pathway.last_update = {
            ...this.pathway.last_update!,
            results: {
                time: Date.now(),
                user: this.user!.email
            } as StepUpdateInformation
        };

        // Update pathway itself
        updatePathway(this.scenario, this.pathway);
        
        this._editMode = false;
        showNotification("saveNotification", this.shadowRoot!);

    }
}
