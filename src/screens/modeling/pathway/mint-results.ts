import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";
import { getPathwayRunsStatus, TASK_DONE, matchVariables } from "../../../util/state_functions";
import { ExecutableEnsemble, StepUpdateInformation, ModelEnsembles } from "../reducers";
import { updatePathway, getAllPathwayEnsembleIds, fetchPathwayEnsembles } from "../actions";
import { showNotification, hideDialog, showDialog } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { renderLastUpdateText } from "../../../util/ui_renders";
import { MintPathwayPage } from "./mint-pathway-page";
import { Model } from "screens/models/reducers";
import { IdMap } from "app/reducers";

@customElement('mint-results')
export class MintResults extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _ensembles: ModelEnsembles;
    
    @property({type: Boolean})
    private _editMode: Boolean = false;
    
    @property({type: Object})
    private _progress_item: Model;
    @property({type: Number})
    private _progress_total : number;
    @property({type: Number})
    private _progress_number : number;
    @property({type: Boolean})
    private _progress_abort: boolean;

    @property({type: Number})
    private totalPages = 0;
    @property({type: Number})
    private currentPage = 1;
    @property({type: Number})
    private pageSize = 100;

    private pathwayModelEnsembleIds: IdMap<string[]> = {};
    
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

       // Group running ensembles
       let grouped_ensembles = {};
       Object.keys(this._ensembles || {}).map((modelid) => {
            let model = this.pathway.models![modelid];
            let loading = this._ensembles[modelid].loading;
            grouped_ensembles[model.id] = {
                ensembles: {},
                params: [],
                inputs: [],
                outputs: [],
                loading: loading
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

            let ensembles: ExecutableEnsemble [] = this._ensembles[modelid].ensembles;
            if(ensembles) {
                ensembles.map((ensemble) => {
                    /* Check if outputs are bound */
                    let allbound = true;
                    model.output_files.map((outf) => {
                        let foundmatch = false;
                        Object.values(ensemble.results).map((result) => {
                            if(result.id.replace(/.+#/,'') == outf.name) {
                                foundmatch = true;
                            }
                        })
                        if(!foundmatch)
                            allbound = false;
                    })
                    if(allbound)
                        grouped_ensembles[model.id].ensembles[ensemble.id] = ensemble;
                });
            }
       });

       let readmode = !this._editMode;

       return html`
       <p>
            This step is for browsing the results of the models that you ran earlier. 
            You can select the results that you would like to keep, and they will be recorded.
       </p>
       <wl-title level="3">Results</wl-title>
       <div class="clt">
           <ul>
           ${Object.keys(this.pathway.executable_ensemble_summary).map((modelid) => {
               let summary = this.pathway.executable_ensemble_summary[modelid];
               let model = this.pathway.models![modelid];
               let grouped_ensemble = grouped_ensembles[modelid];
               this.totalPages = Math.ceil(summary.total_runs/this.pageSize);
               return html`
               <li>
                    <wl-title level="4"><a href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                    <p>
                    ${summary.submitted_runs} model runs were submitted, out of which 
                    ${summary.successful_runs} succeeded and produced results, and ${summary.failed_runs} failed.
                    </p>
                    <wl-button class="submit"
                           @click="${() => this._publishAllResults(model.id)}">Publish all results</wl-button>
                    <div>
                        ${this.currentPage > 1 ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(model.id, -1)}>Back</wl-button>` :
                            html `<wl-button flat inverted disabled>Back</wl-button>`
                        }
                        Page ${this.currentPage} of ${this.totalPages}
                        ${this.currentPage < this.totalPages ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(model.id, 1)}>Next</wl-button>` :
                            html `<wl-button flat inverted disabled>Next</wl-button>`
                        }

                        <wl-button type="button" flat inverted 
                            @click="${() => this._fetchRuns(model.id, 1, this.pageSize)}">Load</wl-button>
                    </div>
                    <div style="height:400px;overflow:auto;width:100%">                   
                    ${grouped_ensemble ? 
                       (grouped_ensemble.loading ? 
                           html`<wl-progress-spinner class="loading"></wl-progress-spinner>` :
                           html`
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
                                ${Object.keys(grouped_ensemble.ensembles).length == 0 ? 
                                    html`
                                    <tr><td colspan="${grouped_ensemble.inputs.length + 
                                            grouped_ensemble.params.length + grouped_ensemble.outputs.length + 1}">
                                        - No results available -
                                    </td></tr>` : ""
                                }
                                ${Object.keys(grouped_ensemble.ensembles).map((index) => {
                                    let ensemble: ExecutableEnsemble = grouped_ensemble.ensembles[index];
                                    let model = this.pathway.models![ensemble.modelid];
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
                                                if(Object.keys(ensemble.results).length == 0) {
                                                    return html `<td></td>`;
                                                }
                                                return Object.values(ensemble.results).map((result: any) => {
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
                            `
                        )
                        : 
                        ""
                    }
                </li>`;
            })}
            </ul>
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("results"))}">Continue</wl-button>
            </div>
        </div>

        ${this._editMode ? 
            html`
            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.results : ""}</textarea>
            </fieldset>
            `: 
            html`
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
        ${this._renderProgressDialog()}
        `;
    }

    _nextPage(modelid: string, offset:  number) {
        this._fetchRuns(modelid, this.currentPage + offset, this.pageSize)
    }

    async _fetchRuns (modelid: string, currentPage: number, pageSize: number) {
        this.currentPage = currentPage;
        
        if(!this.pathwayModelEnsembleIds[modelid])
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);
        
        let ensembleids = this.pathwayModelEnsembleIds[modelid].slice((this.currentPage - 1)*pageSize, this.currentPage*pageSize);
        store.dispatch(fetchPathwayEnsembles(this.pathway.id, modelid, ensembleids));
    }
    
    _renderProgressDialog() {
        return html`
        <wl-dialog id="progressDialog" fixed persistent backdrop blockscrolling>
            <h3 slot="header">Publish results</h3>
            <div slot="content">
                <p>
                    Publishing results for ${this._progress_item ? this._progress_item.name : ""}
                </p>
                ${this._progress_number} out of ${this._progress_total}
                <wl-progress-bar style="width:100%" mode="determinate"
                    value="${this._progress_number/this._progress_total}"></wl-progress-bar>
            </div>
            <div slot="footer">
                ${this._progress_number == this._progress_total ? 
                    html`<wl-button @click="${this._onDialogDone}" class="submit">Done</wl-button>` :
                    html`<wl-button @click="${this._onStopProgress}" inverted flat>Stop</wl-button>`
                }
            </div>            
        </wl-dialog>
        `;
    }

    _onDialogDone() {
        updatePathway(this.scenario, this.pathway);
        hideDialog("progressDialog", this.shadowRoot!);
    }

    _onStopProgress() {
        this._progress_abort = true;
        updatePathway(this.scenario, this.pathway);
        hideDialog("progressDialog", this.shadowRoot!);
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

        if(state.modeling.ensembles) {
            this._ensembles = state.modeling.ensembles;
        }
    }

    _publishAllResults(modelid) {
        let model = this.pathway.models[modelid];
        this._progress_item = model;
        this._progress_total = this.pathway.executable_ensemble_summary[modelid].total_runs;
        this._progress_number = 0;

        showDialog("progressDialog", this.shadowRoot!);

        let start = 0;
        let executionBatchSize = 4;

        /*
        For each run
        -> Publish run to provenance catalog
            - Get output public url
        -> Register output to the data catalog
        -> Create aggregated CSV for each model
        -> model-[uuid].csv
            -> [ensembleid] [runid] [input1] ... [inputn] [param1] ... [paramn] [out1] ... [outn]
        */

        /*
        // Update notes
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
        */
    }
}
