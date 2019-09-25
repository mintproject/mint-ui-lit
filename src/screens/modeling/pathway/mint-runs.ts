import { customElement, html, css, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { BASE_HREF } from "../../../app/actions";

import "weightless/progress-bar";
import { listEnsembles, setupModelWorkflow, runModelEnsembles } from "../../../util/state_functions";
import { selectPathwaySection } from "../../../app/ui-actions";
import { MintPathwayPage } from "./mint-pathway-page";
import { showNotification, hideDialog, showDialog } from "util/ui_functions";
import { renderNotifications } from "util/ui_renders";
import { Model } from "screens/models/reducers";
import { ExecutableEnsemble, ModelEnsembles } from "../reducers";
import { IdMap } from "app/reducers";
import { fetchPathwayEnsembles, updatePathwayEnsembles, updatePathway, getAllPathwayEnsembleIds } from "../actions";
import { fetchWingsTemplate, loginToWings, fetchWingsRunResults, fetchWingsRunsStatuses} from "util/wings_functions";

@customElement('mint-runs')
export class MintRuns extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _ensembles: ModelEnsembles;

    @property({type: Object})
    private _progress_item: Model;
    @property({type: Number})
    private _progress_total : number;
    @property({type: Number})
    private _progress_number : number;
    @property({type: Boolean})
    private _progress_abort: boolean;
    @property({type:String})
    private _progress_description: string;

    @property({type: Number})
    private totalPages = 0;
    @property({type: Number})
    private currentPage = 1;
    @property({type: Number})
    private pageSize = 100;

    @property({type: Number})
    private executionBatchSize = 4;

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
                This step is for monitoring model runs. You can view results of these runs in the next step.  You can
                also see if runs failed, and look into the reasons so the model can be used properly.
            </p>
            Please setup and run some models first
            `
        }
        
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

            let ensembles: ExecutableEnsemble [] = this._ensembles[modelid].ensembles;
            if(ensembles)
                ensembles.map((ensemble) => {
                    grouped_ensembles[model.id].ensembles[ensemble.id] = ensemble;
                });
        });


        return html`
        <p>
            This step is for monitoring model runs. You can view results of these runs in the next step
        </p>
        <wl-title level="3">Runs</wl-title>
        <div class="clt">
            <ul>
            ${Object.keys(this.pathway.executable_ensemble_summary).map((modelid) => {
                let summary = this.pathway.executable_ensemble_summary[modelid];
                let model = this.pathway.models![modelid];
                let grouped_ensemble = grouped_ensembles[modelid];
                this.totalPages = Math.ceil(summary.total_runs/this.pageSize);
                let finished_runs = summary.successful_runs + summary.failed_runs;
                let finished = (finished_runs == summary.total_runs);
                let running = summary.submitted_runs - finished_runs;

                return html`
                <li>
                    <wl-title level="4"><a href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                    <p>
                    The model setup created ${summary.total_runs} configurations. 
                    ${!finished ? "So far, " : ""} ${summary.submitted_runs} model runs
                    ${!finished ? "have been" : "were"} submitted, out of which 
                    ${summary.successful_runs} succeeded, and ${summary.failed_runs} failed.
                    ${running > 0 ? html `${running} model configurations are still running.` : ""}

                    ${!finished ? 
                        html`<br /><wl-button class="submit"
                            @click="${() => this._checkStatusAllEnsembles(model.id)}">Reload status</wl-button>`
                        : ""
                    }
                    </p>

                    <div style="height:400px;overflow:auto;width:100%;border:1px solid #EEE">
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
                        ${grouped_ensemble ? 
                            (grouped_ensemble.loading ? 
                                html`<wl-progress-spinner class="loading"></wl-progress-spinner>` :
                                html`
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
        ${this._renderProgressDialog()}

        `;
    }

    _nextPage(modelid: string, offset:  number) {
        this._fetchRuns(modelid, this.currentPage + offset, this.pageSize)
    }

    _renderProgressDialog() {
        return html`
        <wl-dialog id="progressDialog" fixed persistent backdrop blockscrolling>
            <h3 slot="header">Checking status of model runs</h3>
            <div slot="content">
                <p>
                    ${this._progress_description} for ${this._progress_item ? this._progress_item.name : ""}
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

    async _fetchRuns (modelid: string, currentPage: number, pageSize: number) {
        this.currentPage = currentPage;
        
        if(!this.pathwayModelEnsembleIds[modelid])
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);
        
        let ensembleids = this.pathwayModelEnsembleIds[modelid].slice((this.currentPage - 1)*pageSize, this.currentPage*pageSize);
        store.dispatch(fetchPathwayEnsembles(this.pathway.id, modelid, ensembleids));
    }

    async _runAllEnsembles(modelid: string) {
        let model = this.pathway.models[modelid];
        this._progress_item = model;
        this._progress_description = "Running model configurations";
        this._progress_total = this.pathway.executable_ensemble_summary[modelid].total_runs;
        this._progress_number = 0;

        showDialog("progressDialog", this.shadowRoot!);

        let start = 0;        
        await loginToWings(this.prefs);
        
        let workflowid = await setupModelWorkflow(model, this.pathway, this.prefs);
        let tpl_package = await fetchWingsTemplate(workflowid, this.prefs);

        // Setup some book-keeping to help in searching for results
        this.pathway.executable_ensemble_summary[model.id].workflow_name = workflowid.replace(/.+#/, '');
        this.pathway.executable_ensemble_summary[model.id].submission_time = Date.now();

        if(!this.pathwayModelEnsembleIds[modelid])
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);

        let datasets = {};
        while(true) {
            let ensembleids = this.pathwayModelEnsembleIds[modelid].slice(start, start+this.pageSize);
            let ensembles = await listEnsembles(ensembleids);
            start += this.pageSize;

            if(!ensembles || ensembles.length == 0)
                break;
            
            if(this._progress_abort) 
                break;

            for(let i=0; i<ensembles.length; i+= this.executionBatchSize) {
                let eslice = ensembles.slice(i, i+this.executionBatchSize);
                // Get ensembles that arent already run
                let eslice_nr = eslice.filter((ensemble) => !ensemble.runid);
                if(eslice_nr.length > 0) {
                    let runids = await runModelEnsembles(this.pathway, eslice_nr, datasets, tpl_package, this.prefs);
                    for(let j=0; j<eslice_nr.length; j++) {
                        eslice_nr[j].runid = runids[j];
                        eslice_nr[j].status = "WAITING";
                        eslice_nr[j].run_progress = 0;
                    }
                    updatePathwayEnsembles(eslice_nr);
                }
                this._progress_number += eslice.length;
            }
        }
    }

    _isEnsembleRunFinished(ensemble: ExecutableEnsemble) {
        return (ensemble.status == "SUCCESS" || ensemble.status == "FAILURE");
    }

    async _checkStatusAllEnsembles(modelid: string) {
        let model = this.pathway.models[modelid];
        let summary = this.pathway.executable_ensemble_summary[modelid];

        this._progress_item = model;
        this._progress_total = summary.total_runs;
        this._progress_description = "Checking model runs status";
        this._progress_number = 0;

        showDialog("progressDialog", this.shadowRoot!);
        
        await loginToWings(this.prefs);
        
        // FIXME: Some problem with the submission times
        let runtimeInfos = await fetchWingsRunsStatuses(summary.workflow_name, 
            Math.floor(summary.submission_time/1000), summary.total_runs, this.prefs);

        let start = 0;
        let pageSize = 100;
        let numSuccessful = 0;
        let numFailed = 0;
        let numRunning = 0;

        if(!this.pathwayModelEnsembleIds[modelid])
            this.pathwayModelEnsembleIds[modelid] =  await getAllPathwayEnsembleIds(this.scenario.id, this.pathway.id, modelid);

        while(true) {
            let ensembleids = this.pathwayModelEnsembleIds[modelid].slice(start, start+pageSize);
            let ensembles = await listEnsembles(ensembleids);
            start += pageSize;

            if(!ensembles || ensembles.length == 0)
                break;
            
            if(this._progress_abort) 
                break;

            let changed_ensembles : ExecutableEnsemble[] = [];

            ensembles.map((ensemble) => {
                // Check if the ensemble is not already finished (probably from another run)
                if(ensemble.status == "WAITING" || ensemble.status == "RUNNING") {
                    let runtimeInfo = runtimeInfos[ensemble.runid];
                    if(runtimeInfo) {
                        if(runtimeInfo.status != ensemble.status) {
                            if(runtimeInfo.status == "SUCCESS" || runtimeInfo.status == "FAILURE") {
                                ensemble.run_progress = 1;
                            }
                            ensemble.status = runtimeInfo.status;
                            changed_ensembles.push(ensemble);
                        }
                    }
                    else {
                        // Ensemble not yet submitted
                        //console.log(ensemble);
                    }
                }
                switch(ensemble.status) {
                    case "RUNNING":
                        numRunning++;
                        break;
                    case "SUCCESS":
                        numSuccessful++;
                        break;
                    case "FAILURE":
                        numFailed++;
                        break;
                }
                this._progress_number ++;  
            });

            let finished_ensembles = changed_ensembles.filter((ensemble) => ensemble.status == "SUCCESS");

            // Fetch Results of ensembles that have finished
            let results = await Promise.all(finished_ensembles.map((ensemble) => {
                return fetchWingsRunResults(ensemble, this.prefs);
            }));
            for(let i=0; i<finished_ensembles.length; i++) {
                if(results[i])
                    finished_ensembles[i].results = results[i];
            }

            // Update all ensembles
            updatePathwayEnsembles(changed_ensembles);
        }
        summary.successful_runs = numSuccessful;
        summary.failed_runs = numFailed;
        summary.submitted_runs = numRunning + numSuccessful + numFailed;
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

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);
        if(super.setPathway(state)) {
            state.modeling.ensembles = null;
        }
        if(state.modeling.ensembles) {
            this._ensembles = state.modeling.ensembles;
        }
    }
}
