import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";

import "weightless/progress-bar";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { showNotification, hideDialog, showDialog, hideNotification } from "util/ui_functions";
import { renderNotifications } from "util/ui_renders";
import { Model } from "screens/models/reducers";
import { ExecutableEnsemble, ModelEnsembles, Pathway } from "../reducers";
import { IdMap } from "app/reducers";
import { fetchPathwayEnsembles, getAllPathwayEnsembleIds } from "../actions";
import { DataResource } from "screens/datasets/reducers";
import { isObject } from "util";
import { postJSONResource, getResource } from "util/mint-requests";

@customElement('mint-runs')
export class MintRuns extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _ensembles: ModelEnsembles;

    @property({type: String})
    private _subgoalid: string;

    @property({type: Object})
    private totalPages : Map<string, number> = {} as Map<string, number>;
    @property({type: Object})
    private currentPage : Map<string, number> = {} as Map<string, number>;
    @property({type: Number})
    private pageSize = 100;

    @property({type: String})
    private _log: string;

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
        if(!this.pathway.executable_ensemble_summary) {
            return html `
            <p>
                This step is for monitoring model runs.
            </p>
            Please setup and run some models first
            `
        }
        
        // Group running ensembles
        let grouped_ensembles = {};
        Object.keys(this._ensembles || {}).map((modelid) => {
            let model = this.pathway.models![modelid];
            let loading = this._ensembles[modelid].loading;
            if(!model) {
                return;
            }
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

            let ensembles: ExecutableEnsemble [] = this._ensembles[modelid].ensembles;
            if(ensembles)
                ensembles.map((ensemble) => {
                    if(ensemble)
                        grouped_ensembles[model.id].ensembles[ensemble.id] = ensemble;
                });
        });


        return html`
        <p>
            This step is for monitoring model runs.
        </p>
        <wl-title level="3">Runs</wl-title>
        <div class="clt">
            <ul>
            ${Object.keys(this.pathway.executable_ensemble_summary).map((modelid) => {
                let summary = this.pathway.executable_ensemble_summary[modelid];
                let model = this.pathway.models![modelid];
                let grouped_ensemble = grouped_ensembles[modelid];
                this.totalPages[modelid] = Math.ceil(summary.total_runs/this.pageSize);
                let submitted_runs = summary.submitted_runs ? summary.submitted_runs : 0;
                let failed_runs = summary.failed_runs ? summary.failed_runs : 0;
                let successful_runs = summary.successful_runs ? summary.successful_runs : 0;
                let finished_runs = successful_runs + failed_runs;
                
                let finished = (finished_runs == summary.total_runs);
                let running = submitted_runs - finished_runs;
                let pending = summary.total_runs - submitted_runs;
                if(!this.currentPage[modelid])
                    this.currentPage[modelid] = 1;

                if(!grouped_ensemble && model) {
                    this._fetchRuns(model.id, 1, this.pageSize)
                }
                if(!model) {
                    return "";
                }

                if(!summary.submission_time) {
                    return html`
                    <li>
                        <wl-title level="4"><a target="_blank" href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                        <p>
                            The parameter settings you selected require ${summary.total_runs} runs. 
                        </p>
                        <wl-button class="submit"
                            @click="${() => this._submitRuns(model.id)}">Send Runs</wl-button>
                    `;
                }

                return html`
                <li>
                    <wl-title level="4"><a target="_blank" href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                    <p>
                        Below is the status of all the runs for the model with the different setups that you selected earlier. 
                        A green status bar means that the run is completed. A partially green and grey/partially grey status bar indicates 
                        that the run is still ongoing. A red bar indicates that the run failed. You can view results of the 
                        completed runs by going to the Results tab even when other runs are still not completed.
                    </p>                    
                    <p>
                    The parameter settings you selected require ${summary.total_runs} runs. 
                    ${!finished ? "So far, " : ""} ${submitted_runs} model runs
                    ${!finished ? "have been" : "were"} submitted, out of which 
                    ${successful_runs} succeeded, while ${failed_runs} failed.
                    ${running > 0 ? html `${running} are currently running` : ""}
                    ${running > 0 && pending > 0 ? ', and ' : ''}
                    ${pending > 0 ? html `${pending} are waiting to be run` : ""}
                    </p>

                    <div style="width: 100%; border:1px solid #EEE;border-bottom:0px;">
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
                        <wl-button type="button" flat inverted style="float:right"
                            @click="${() => this._fetchRuns(model.id, 1, this.pageSize)}">Reload</wl-button>
                    </div>
                    <div style="height:400px;overflow:auto;width:100%;border:1px solid #EEE">
                        ${grouped_ensemble ? 
                            (grouped_ensemble.loading ? 
                                html`<wl-progress-spinner class="loading"></wl-progress-spinner>` :
                                html`
                                <table class="pure-table pure-table-bordered run_table">
                                    <!-- Heading -->
                                    <colgroup span="2"></colgroup> <!-- Run Status -->
                                    ${grouped_ensemble.inputs.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.inputs.length}"></colgroup>` : ""} <!-- Inputs -->
                                    ${grouped_ensemble.params.length > 0 ? 
                                        html `<colgroup span="${grouped_ensemble.params.length}"></colgroup>` : ""} <!-- Parameters -->
                                    <thead>
                                        <tr>
                                            <th colspan="2">Run</th> <!-- Run Status -->
                                            ${grouped_ensemble.inputs.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.inputs.length}">Inputs</th>` : ""} <!-- Inputs -->
                                            ${grouped_ensemble.params.length > 0 ? 
                                                html `<th colspan="${grouped_ensemble.params.length}">Parameters</th>` : ""} <!-- Parameters -->
                                        </tr>
                                        <tr>
                                            <th>Run Status</th>
                                            <th>Run Log</th>                                            
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
                                        let param_defaults = {};
                                        model.input_parameters.map((param) => param_defaults[param.id] = param.default);
                                        return html`
                                            <tr>
                                                <td>
                                                    <wl-progress-bar mode="determinate" class="${ensemble.status}"
                                                        value="${ensemble.status == "FAILURE" ? 100 : (ensemble.run_progress || 0)}"></wl-progress-bar>
                                                </td>
                                                <td>
                                                    <wl-button style="--button-padding: 2px; --button-border-radius: 2px" 
                                                        @click="${() => this._viewRunLog(ensemble.id)}" inverted flat>
                                                        View Log</wl-button>
                                                </td>                                                
                                                ${grouped_ensemble.inputs.length + grouped_ensemble.params.length == 0 ? 
                                                    html`<td>No inputs or parameters</td>` : ""
                                                }
                                                ${grouped_ensemble.inputs.map((input) => {
                                                    let res = ensemble.bindings[input.id] as DataResource;
                                                    if(res) {
                                                        // FIXME: This should be resolved to a collection of resources
                                                        let furl = this._getDatasetURL(res.name); 
                                                        return html`
                                                            <td><a href="${furl}">${res.name}</a></td>
                                                        `;
                                                    }
                                                })}
                                                ${grouped_ensemble.params.map((param) => html`<td>
                                                    ${ensemble.bindings[param.id] ? 
                                                        ensemble.bindings[param.id] : 
                                                        param_defaults[param.id]
                                                    }
                                                </td>` )}
                                            </tr>
                                        `;
                                    })}
                                    </tbody>
                                </table>`
                            )
                            : 
                            ""
                        }
                    </div>
                </li>`;
            })}
            </ul>
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectPathwaySection("results"))}">Continue</wl-button>
            </div>
        </div>

        ${renderNotifications()}
        ${this._renderLogDialog()}

        `;
    }

    _submitRuns(modelid: string) {
        let mint = this.prefs.mint;
        let data = {
            scenario_id: this.scenario.id,
            subgoal_id: this._subgoalid,
            thread_id: this.pathway.id,
            model_id: modelid
        };
        showNotification("runNotification", this.shadowRoot);
        postJSONResource({
            url: mint.ensemble_manager_api + "/executions" + (mint.execution_engine == "localex" ? "Local" : ""),
            onLoad: function(e: any) {
                hideNotification("runNotification", this.shadowRoot);
            },
            onError: function() {
                console.log("Could not send");
            }
        }, data, false);
    }

    _nextPage(modelid: string, offset:  number) {
        this._fetchRuns(modelid, this.currentPage[modelid] + offset, this.pageSize)
    }

    _viewRunLog(ensembleid: string) {
        this._log = null;
        let me = this;
        showDialog("logDialog", this.shadowRoot!);
        // Call out to the ensemble manager to get the log
        getResource({
            url: this.prefs.mint.ensemble_manager_api + "/logs?ensemble_id=" + ensembleid,
            onLoad: function(e: any) {
                let log = e.target.responseText;
                log = log.replace(/\\n/g, "\n");
                me._log = log;
                console.log(me._log);
            },
            onError: function() {

            }
        }, false);
    }

    _closeRunLogDialog(runid: string) {
        hideDialog("logDialog", this.shadowRoot!);
    }

    _renderLogDialog() {
        return html`

        <wl-dialog id="logDialog" fixed persistent backdrop blockscrolling style="--dialog-width:800px;">
            <h3 slot="header">Run log</h3>
            <div slot="content" style="height:500px;overflow:auto">
                ${this._log ? 
                html`
                <pre style='font-size:11px'>${this._log}</pre>
                `
                : 
                html`<wl-progress-spinner class="loading"></wl-progress-spinner>`
                }
            </div>   
            <div slot="footer">
                <wl-button @click="${this._closeRunLogDialog}" class="submit">Close</wl-button>
            </div>        
        </wl-dialog>        
        `;
    }

    async _fetchRuns (modelid: string, currentPage: number, pageSize: number) {
        this.currentPage[modelid] = currentPage;
        
        if(!this.pathwayModelEnsembleIds[modelid]) {
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);
        }
        
        let ensembleids = this.pathwayModelEnsembleIds[modelid].slice((currentPage - 1)*pageSize, currentPage*pageSize);
        store.dispatch(fetchPathwayEnsembles(this.pathway.id, modelid, ensembleids));
    }

    async _reloadAllRuns() {
        let promises: any[] = [];
        Object.keys(this.pathway.models).map((modelid) => {
            if(!this.currentPage[modelid])
                this.currentPage[modelid] = 1;
            console.log("Fetch runs for model " + modelid);
            promises.push(this._fetchRuns(modelid, this.currentPage[modelid] , this.pageSize));
        })
        await Promise.all(promises);
    }

    _isEnsembleRunFinished(ensemble: ExecutableEnsemble) {
        return (ensemble.status == "SUCCESS" || ensemble.status == "FAILURE");
    }

    _getModelURL (model:Model) {
        if(!model) {
            return "";
        }
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

    _getDatasetURL (resname: string) {
        let config = this.prefs.mint;
        let suffix = "/users/" + config.wings.username + "/" + config.wings.domain;
        var purl = config.wings.server + suffix
        var expurl = config.wings.export_url + "/export" + suffix;
        let dsid = expurl + "/data/library.owl#" + resname;
        return purl + "/data/fetch?data_id=" + escape(dsid);
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
        let runs_changed = this._pathwaySummaryChanged(this.pathway, state.modeling.pathway);
        let runs_total_changed = this._pathwayTotalRunsChanged(this.pathway, state.modeling.pathway);

        super.setPathway(state);

        if(state.ui && state.ui.selected_subgoalid) {
            this._subgoalid = state.ui.selected_subgoalid;
        }

        // If run status has changed, then reload all runs
        if(runs_changed) {
            if(runs_total_changed) {
                console.log("Total runs changed !");
                this.pathwayModelEnsembleIds = {};
            }
            state.modeling.ensembles = null;
            this._ensembles = null;            
            console.log("Reloading runs");
            this._reloadAllRuns().then(() => {
                console.log("Reload finished");
            });
        }
        
        if(state.modeling.ensembles) {
            this._ensembles = state.modeling.ensembles; 
        }
    }
}
