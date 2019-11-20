import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";
import { getPathwayRunsStatus, TASK_DONE, matchVariables, sendDataForIngestion, getUISelectedSubgoal } from "../../../util/state_functions";
import { ExecutableEnsemble, StepUpdateInformation, ModelEnsembles, Pathway } from "../reducers";
import { updatePathway, getAllPathwayEnsembleIds, fetchPathwayEnsembles } from "../actions";
import { showNotification, hideDialog, showDialog } from "../../../util/ui_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { renderLastUpdateText } from "../../../util/ui_renders";
import { MintPathwayPage } from "./mint-pathway-page";
import { Model } from "screens/models/reducers";
import { IdMap } from "app/reducers";
import { DataResource } from "screens/datasets/reducers";
import { isObject } from "util";

@customElement('mint-results')
export class MintResults extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _ensembles: ModelEnsembles;
    
    @property({type: Boolean})
    private _editMode: Boolean = false;
   
    @property({type: Boolean})
    private _showAllResults: Boolean = false;

    @property({type: Object})
    private _progress_item: Model;
    @property({type: Number})
    private _progress_total : number;
    @property({type: Number})
    private _progress_number : number;
    @property({type: Boolean})
    private _progress_abort: boolean;

    @property({type: Object})
    private totalPages : Map<string, number> = {} as Map<string, number>;
    @property({type: Object})
    private currentPage : Map<string, number> = {} as Map<string, number>;
    @property({type: Number})
    private pageSize = 100;

    @property({type: String})
    private subgoalid: string;

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
                if(this._showAllResults || matchVariables(this.pathway.response_variables, outf.variables, false))
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
       </p>
       <wl-title level="3">Results</wl-title>
       <div class="clt">
           <ul>
           ${Object.keys(this.pathway.executable_ensemble_summary).map((modelid) => {
               let summary = this.pathway.executable_ensemble_summary[modelid];
               let model = this.pathway.models![modelid];
               if(!model) {
                   return;
               }
               let grouped_ensemble = grouped_ensembles[modelid];
               this.totalPages[modelid] = Math.ceil(summary.total_runs/this.pageSize);
               let finished_runs = summary.successful_runs + summary.failed_runs;
               let submitted = this.pathway.executable_ensemble_summary[modelid].submitted_for_ingestion;
               let finished = (finished_runs == summary.total_runs);
               let running = summary.submitted_runs - finished_runs;
               let pending = summary.total_runs - summary.submitted_runs;
               if(!this.currentPage[modelid])
                    this.currentPage[modelid] = 1;

                if(!grouped_ensemble) {
                    this._fetchRuns(model.id, 1, this.pageSize)
                }

               return html`
               <li>
                    <wl-title level="4"><a target="_blank" href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                    <p>
                        Below are the results of all the model executions that run successfully and were completed. 
                        The results are shown on the left. The file can be downloaded/viewed by clicking on the link. 
                        Click on the RELOAD button if you are waiting for more runs to complete
                    </p>
                    <p>
                    The parameter settings you selected required ${summary.total_runs} runs. 
                    ${!finished ? "So far, " : ""} ${summary.submitted_runs} model runs
                    ${!finished ? "have been" : "were"} submitted, out of which 
                    ${summary.successful_runs} succeeded and produced results, while ${summary.failed_runs} failed.
                    ${running > 0 ? html `${running} are currently running` : ""}
                    ${running > 0 && pending > 0 ? ', and ' : ''}
                    ${pending > 0 ? html `${pending} are waiting to be run` : ""}
                    </p>

                    ${finished && !submitted ? 
                        html` <wl-button class="submit"
                        @click="${() => this._publishAllResults(model.id)}">Save all results</wl-button>`
                        : ""
                    }
                    ${finished && submitted ? 
                        "Results have been saved" : ''
                    }
                    <br /><br />

                    <div style="width:100%; border:1px solid #EEE;border-bottom:0px;">
                        ${grouped_ensemble && !grouped_ensemble.loading ? 
                        html`
                        ${this.currentPage[model.id] > 1 ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(model.id, -1)}>Back</wl-button>` :
                            html `<wl-button flat inverted disabled>Back</wl-button>`
                        }
                        Page ${this.currentPage[model.id]} of ${this.totalPages[model.id]}
                        ${this.currentPage[model.id] < this.totalPages[model.id] ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(model.id, 1)}>Next</wl-button>` :
                            html `<wl-button flat inverted disabled>Next</wl-button>`
                        }
                        ` : ""
                        }
                        ${!grouped_ensemble || !grouped_ensemble.loading ?
                        html`<wl-button type="button" flat inverted  style="float:right"
                            @click="${() => this._fetchRuns(model.id, 1, this.pageSize)}">Reload</wl-button>`: ""
                        }
                    </div>
                    <div style="height:400px;overflow:auto;width:100%;border:1px solid #EEE">
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
                                            html `<th colspan="${grouped_ensemble.outputs.length}">
                                            Outputs
                                            &nbsp;
                                            <a style="cursor:pointer" @click="${()=>{this._showAllResults = !this._showAllResults}}">
                                            [${this._showAllResults ? "Hide extra outputs" : "Show all outputs"}]
                                            </a>
                                            </th>` : ""} <!-- Outputs -->
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
                                    let param_defaults = {};
                                    model.input_parameters.map((param) => param_defaults[param.id] = param.default);
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
                                                        let furl = result.url;
                                                        let fname = result.name;
                                                        if(!furl) {
                                                            let location = result.location;
                                                            let prefs = this.prefs.mint;
                                                            furl = ensemble.execution_engine == "localex" ? 
                                                                location.replace(prefs.localex.datadir, prefs.localex.dataurl) :
                                                                location.replace(prefs.wings.datadir, prefs.wings.dataurl);
                                                        }
                                                        if(!fname)
                                                            fname = result.location.replace(/.+\//, '');
                                                        return html`
                                                            <td><a href="${furl}">${fname}</a></td>
                                                        `
                                                    }
                                                });
                                            })}
                                            ${grouped_ensemble.inputs.map((input) => {
                                                let res = ensemble.bindings[input.id] as DataResource;
                                                if(res) {
                                                    // FIXME: This could be resolved to a collection of resources
                                                    return html`
                                                        <td><a href="${res.url}">${res.name}</a></td>
                                                    `;
                                                }
                                            })}
                                            ${grouped_ensemble.params.map((param) => html`<td>
                                                    ${ensemble.bindings[param.id] ? 
                                                        ensemble.bindings[param.id] : 
                                                        param_defaults[param.id]
                                                    }
                                                </td>` 
                                            )}
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
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("visualize"))}">Continue</wl-button>
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
        this._fetchRuns(modelid, this.currentPage[modelid] + offset, this.pageSize)
    }

    async _fetchRuns (modelid: string, currentPage: number, pageSize: number) {
        this.currentPage[modelid] = currentPage;
        
        if(!this.pathwayModelEnsembleIds[modelid])
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);
        
        let ensembleids = this.pathwayModelEnsembleIds[modelid].slice((currentPage - 1)*pageSize, currentPage*pageSize);
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
                <wl-progress-bar style="width:100%" mode="indeterminate"></wl-progress-bar>
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
        let url = this._regionid + '/models/explore/' + model.original_model;
        if (model.model_version) {
            url += '/' + model.model_version;
            if (model.model_configuration) {
                url += '/' + model.model_configuration;
                if (model.localname) {
                    url += '/' + model.localname;
                }
            }
        }
        return url;
    }

    _getResultDatasetURL(result: any) {
        return this._getDatasetURL(result.location.replace(/.+\//, ''));
    }

    _getDatasetURL (resname: string) {
        let config = this.prefs.mint;
        let suffix = "/users/" + config.wings.username + "/" + config.wings.domain;
        var purl = config.wings.server + suffix
        var expurl = config.wings.export_url + "/export" + suffix;
        let dsid = expurl + "/data/library.owl#" + resname;
        return purl + "/data/fetch?data_id=" + escape(dsid);
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
        -> Ingest thread to visualization database
        -> Register outputs to the data catalog        
        -> Publish run to provenance catalog
        */
        sendDataForIngestion(this.scenario.id, this.subgoalid, this.pathway.id, this.prefs).then(() => {
            this.pathway.executable_ensemble_summary[modelid].submitted_for_ingestion = true;
            this._progress_number = this._progress_total;
            /*
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
            */      
           this._onDialogDone();    
        })
    }

    _reloadAllRuns() {
        Object.keys(this.pathway.model_ensembles).map((modelid) => {
            this._fetchRuns(modelid, this.currentPage[modelid], this.pageSize);
        })
    }

    _stringify (obj: Object) {
        if(!obj) {
            return "";
        }
        let keys = Object.keys(obj);
        let str = "";
        keys.map((key) => {
            let binding = isObject(obj[key]) ? this._stringify(obj[key]) : obj[key];
            str += key + "=" + binding + "&";
        })
        return str;
    }

    _pathwayTotalRunsChanged (oldpathway: Pathway, newpathway: Pathway) {
        if((oldpathway == null || newpathway == null) && oldpathway != newpathway)
            return true;
            
        let oldtotal = 0;
        Object.keys(oldpathway.executable_ensemble_summary).map((modelid) => {
            oldtotal += oldpathway.executable_ensemble_summary[modelid].total_runs;
        })
        let newtotal = 0;
        Object.keys(newpathway.executable_ensemble_summary).map((modelid) => {
            newtotal += newpathway.executable_ensemble_summary[modelid].total_runs;
        })        
        return oldtotal != newtotal;
    }

    _pathwaySummaryChanged (oldpathway: Pathway, newpathway: Pathway) {
        if((oldpathway == null || newpathway == null) && oldpathway != newpathway)
            return true;
        let oldsummary = this._stringify(oldpathway.executable_ensemble_summary);
        let newsummary = this._stringify(newpathway.executable_ensemble_summary);
        return oldsummary != newsummary;
    }
    
    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);

        // Before resetting pathway, check if the pathway run status has changed
        let runs_status_changed = this._pathwaySummaryChanged(this.pathway, state.modeling.pathway);
        let runs_total_changed = this._pathwayTotalRunsChanged(this.pathway, state.modeling.pathway);

        super.setPathway(state);

        if(state.ui) {
            this.subgoalid = state.ui.selected_subgoalid
        }
        if(state.modeling.ensembles) {
            this._ensembles = state.modeling.ensembles;
        }

        if(runs_status_changed) {
            if(runs_total_changed) {
                this.pathwayModelEnsembleIds = {};
            }
            this._reloadAllRuns();
        }
    }
}
