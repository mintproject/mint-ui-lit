import { customElement, html, css, property, TemplateResult } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import ReactGA from 'react-ga';

import { SharedStyles } from "../../../styles/shared-styles";
import { matchVariables, getThreadParametersStatus, TASK_DONE } from "../../../util/state_functions";
import { Execution, ExecutionSummary, ModelExecutions, Thread } from "../reducers";
import { sendDataForIngestion, subscribeThreadExecutionSummary, listThreadModelExecutionsAction } from "../actions";
import { hideDialog, showDialog, showNotification } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { renderLastUpdateText, renderNotifications } from "../../../util/ui_renders";
import { MintThreadPage } from "./mint-thread-page";
import { Model } from "screens/models/reducers";
import { DataResource } from "screens/datasets/reducers";
import { downloadFile } from "util/ui_functions";
import { getPathFromModel } from "../../models/reducers";
import { getLatestEventOfType } from "util/event_utils";
import { Textfield } from "weightless";
import { AirflowAdapter } from "util/airflow-adapter";
import { CustomNotification } from "components/notification";

@customElement('mint-results')
export class MintResults extends connect(store)(MintThreadPage) {

    @property({type: Object})
    private _executions: ModelExecutions;
    
    @property({type: Boolean})
    private _editMode: Boolean = false;
   
    @property({type: Boolean})
    private _showAllResults: Boolean = true;

    @property({type: Object})
    private totalPages : Map<string, number> = {} as Map<string, number>;
    @property({type: Object})
    private currentPage : Map<string, number> = {} as Map<string, number>;
    @property({type: Number})
    private pageSize = 100;
    @property({type: String})
    private orderBy = "start_time";
    @property({type: Boolean})
    private orderByDesc = false;

    @property({type: String})
    private _thread_id: string;

    protected _notification : CustomNotification;
    
    static get styles() {
        return [
          SharedStyles,
          css`
          `
        ]
    }

    constructor () {
        super();
        this._notification = new CustomNotification();
    }

    private _scrollInto (id:string) {
        let el = this.shadowRoot!.getElementById(id);
        if (el) el.scrollIntoView({block: "start", behavior: "smooth"});
    }

    protected render() {
        if(!this.thread) {
            return html ``;
        }

        let cando = (getThreadParametersStatus(this.thread) == TASK_DONE);
        // If no parameters selected
        if(!cando) {
            return html `
            <p>
                This step is for monitoring model results.
            </p>
            Please setup and run some models first
            `
        }        

        let totalOut : number = 0, showedOut : number = 0;
       // Group running executions
       let grouped_executions = {};
       Object.keys(this._executions || {}).map((modelid) => {
            let model = this.thread.models![modelid];
            if(!model) 
                return;
            let loading = this._executions[modelid].loading;
            grouped_executions[model.id] = {
                executions: {},
                params: [],
                inputs: [],
                outputs: [],
                loading: loading
            };
            let input_parameters = model.input_parameters
                .filter((input) => !input.value)
                .sort((a, b) => {
                    if(a.position && b.position)
                        return a.position - b.position;
                    else 
                        return a.name.localeCompare(b.name)
                });
            input_parameters.map((ip) => {
                if(!ip.value)
                    grouped_executions[model.id].params.push(ip);
            })
            model.input_files.map((inf) => {
                if(!inf.value)
                    grouped_executions[model.id].inputs.push(inf);
            })
            model.output_files.map((outf) => {
                if (this._showAllResults || matchVariables(this.thread.response_variables, outf.variables, false)) {
                    grouped_executions[model.id].outputs.push(outf);
                    showedOut += 1;
                }
            })

            totalOut += model.output_files.length;

            let executions: Execution [] = this._executions[modelid].executions;
            if(executions) {
                executions.map((ensemble) => {
                    /* Check if outputs are bound */
                    let allbound = true;
                    model.output_files.map((outf) => {
                        let foundmatch = false;
                        if(ensemble.results[outf.id]) {
                            foundmatch = true;
                        }
                        if(!foundmatch)
                            allbound = false;
                    })
                    if(allbound)
                        grouped_executions[model.id].executions[ensemble.id] = ensemble;
                });
            }
       });

       let readmode = !this._editMode;
       let latest_update_event = getLatestEventOfType(["CREATE", "UPDATE"], this.thread.events);
       let latest_ingest_event = getLatestEventOfType(["INGEST"], this.thread.events);

       return html`
       ${this._notification}
       ${this.renderDownloadToEmailDialog()}
       <p>
            This step is for browsing the results of the models that you ran earlier. 
       </p>
       <wl-title level="3">Results</wl-title>
       <div class="clt">
           <ul>
           ${Object.keys(this.thread.execution_summary ?? {}).map((modelid) => {
               let summary = this.thread.execution_summary[modelid];
               let model = this.thread.models![modelid];
               if(!model) {
                   return;
               }
               let grouped_ensemble = grouped_executions[modelid];
               this.totalPages[modelid] = Math.ceil(summary.total_runs/this.pageSize);
               let finished_runs = summary.successful_runs + summary.failed_runs;
               let submitted_runs = (summary.submitted_for_execution || summary.submission_time);
               let submitted = summary.submitted_for_ingestion;
               let finished_ingestion = (summary.ingested_runs == summary.total_runs);
               let finished = (finished_runs == summary.total_runs);
               let running = summary.submitted_runs - finished_runs;
               let pending = summary.total_runs - summary.submitted_runs;
               if(!this.currentPage[modelid])
                    this.currentPage[modelid] = 1;

                /*
                if(!grouped_ensemble) {
                    this._fetchRuns(model.id, 1, this.pageSize)
                }
                */
               
                if(!submitted_runs) {
                    return "Please execute some runs first";
                }

               return html`
               <li>
                    <wl-title level="4"><a target="_blank" href="${this._getModelURL(model)}">${model.name}</a></wl-title>
                    ${submitted_runs ? html `
                        <p>
                            Below are the results of all the model executions that run successfully and were completed. 
                            The results are shown on the left. The file can be downloaded/viewed by clicking on the link. 
                            Click on the RELOAD button if you are waiting for more runs to complete
                        </p>
                        <p>
                        The parameter settings you selected required ${summary.total_runs} runs. 
                        ${!finished ? "So far, " : ""} ${summary.submitted_runs} model runs
                        ${!finished ? "have been" : "were"} submitted, out of which 
                        ${summary.successful_runs} succeeded and produced results, 
                        while <span .style="color:${summary.failed_runs?'red': ''}">${summary.failed_runs} failed</span>.
                        ${running > 0 ? html `${running} are currently running` : ""}
                        ${running > 0 && pending > 0 ? ', and ' : ''}
                        ${pending > 0 ? html `${pending} are waiting to be run` : ""}
                        </p>`
                    : html `Please execute some runs first`}

                    <!-- FIXME: Temporarily removed -->
                    ${false && finished && !submitted && this.permission.write ? 
                        html` <wl-button class="submit"
                        @click="${() => this._publishAllResults(model.id)}">Save all results</wl-button>`
                        : 
                        (submitted && !finished_ingestion ? 
                            html`
                                <p>
                                Please wait while saving and ingesting data... <br />
                                Downloaded outputs from ${summary.fetched_run_outputs || 0} out of ${summary.total_runs} model runs.
                                Ingested data from ${summary.ingested_runs || 0} out of ${summary.total_runs} model runs
                                </p>                        
                            `
                            : ""
                        )
                    }
                    <!-- FIXME: Temporarily removed -->
                    ${false && finished && finished_ingestion ? 
                        "Results have been saved" : ''
                    }
                    <br /><br />

                    <div style="width:100%; border:1px solid #EEE;border-bottom:0px;">
                        ${grouped_ensemble && !grouped_ensemble.loading ? 
                        html`
                        ${this.currentPage[model.id] > 1 ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(this.thread.id, model.id, -1)}>Back</wl-button>` :
                            html `<wl-button flat inverted disabled>Back</wl-button>`
                        }
                        Page ${this.currentPage[model.id]} of ${this.totalPages[model.id]}
                        ${this.currentPage[model.id] < this.totalPages[model.id] ? 
                            html `<wl-button flat inverted @click=${() => this._nextPage(this.thread.id, model.id, 1)}>Next</wl-button>` :
                            html `<wl-button flat inverted disabled>Next</wl-button>`
                        }
                        ` : ""
                        }
                        ${!grouped_ensemble || !grouped_ensemble.loading ?
                        html`<wl-button type="button" flat inverted  style="float:right; --button-padding:7px" 
                            ?disabled="${!grouped_ensemble || Object.keys(grouped_ensemble.executions).length == 0}"
                            @click="${this.onDownloadButtonClicked}">
                                <wl-icon>cloud_download</wl-icon>
                            </wl-button>`: ""
                        }
                        ${!grouped_ensemble.loading && (totalOut > 0 && totalOut != showedOut || this._showAllResults) ? html`
                            <a style="cursor:pointer" @click="${()=>{this._showAllResults = !this._showAllResults}}">
                                [${this._showAllResults ? "Hide extra outputs" : "Show all outputs"}]
                            </a>
                        ` : ""}

                        <span style="float:right">
                            ${!grouped_ensemble || !grouped_ensemble.loading ?
                            html`
                                <span>Scroll to:</span>
                                ${grouped_ensemble.outputs.length > 0 ? html`
                                <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;"
                                    @click="${() => this._scrollInto('out')}">Outputs</wl-button>` : html``}
                                ${grouped_ensemble.inputs.length > 0 ? html`
                                <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;"
                                    @click="${() => this._scrollInto('in')}">Inputs</wl-button>` : html``}
                                ${grouped_ensemble.params.length > 0 ? html`
                                <wl-button type="button" flat inverted  style="padding: 6px; border-radius: 4px;"
                                    @click="${() => this._scrollInto('param')}">Parameters</wl-button>` : html``}
                                |
                                <wl-button type="button" flat inverted  
                                @click="${() =>(this.currentPage[model.id] = 1) && this._fetchRuns(this.thread.id, model.id)}">Reload</wl-button>`: ""
                            }
                        </span>
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
                                            html `<th colspan="${grouped_ensemble.outputs.length}" id="out">Outputs</th>` : ""} <!-- Outputs -->
                                        ${grouped_ensemble.inputs.length > 0 ? 
                                            html `<th colspan="${grouped_ensemble.inputs.length}" id="in">Inputs</th>` : ""} <!-- Inputs -->
                                        ${grouped_ensemble.params.length > 0 ? 
                                            html `<th colspan="${grouped_ensemble.params.length}" id="param">Parameters</th>` : ""} <!-- Parameters -->
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
                                ${Object.keys(grouped_ensemble.executions).length == 0 ? 
                                    html`
                                    <tr><td colspan="${grouped_ensemble.inputs.length + 
                                            grouped_ensemble.params.length + grouped_ensemble.outputs.length + 1}">
                                        - No results available -
                                    </td></tr>` : ""
                                }
                                ${Object.keys(grouped_ensemble.executions).map((index) => {
                                    let ensemble: Execution = grouped_ensemble.executions[index];
                                    let model = this.thread.models![ensemble.modelid];
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
                                            ${grouped_ensemble.outputs.map((output:any) => {
                                                if(Object.keys(ensemble.results).length == 0) {
                                                    return html `<td></td>`;
                                                }
                                                let result = ensemble.results[output.id];
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
                                                return html`<td><a target="_blank" href="${furl}">${fname}</a></td>`;
                                            })}
                                            ${grouped_ensemble.inputs.map((input) => {
                                                let res = ensemble.bindings[input.id] as DataResource;
                                                if(res) {
                                                    // FIXME: This could be resolved to a collection of resources
                                                    return html`
                                                        <td><a target="_blank" href="${res.url}">${res.name}</a></td>
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
                    </div>
                </li>`;
            })}
            </ul>
            <div class="footer">
                <wl-button type="button" class="submit" @click="${() => store.dispatch(selectThreadSection("visualize"))}">Continue</wl-button>
            </div>
        </div>

        ${renderNotifications()}

        ${this._editMode ? 
            html`
            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${latest_ingest_event?.notes ? latest_ingest_event.notes : ""}</textarea>
            </fieldset>
            `: 
            html`
            ${latest_ingest_event?.notes ? 
                html `
                <div class="notepage">${renderLastUpdateText(latest_ingest_event)}</div>
                `: html``
            }
            ${latest_update_event?.notes ? 
                html`
                <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${latest_update_event.notes}</div>
                </fieldset>
                `: html``
            }
            `
        }
        `;
    }

    private renderDownloadToEmailDialog () : TemplateResult {
        return html`
        <wl-dialog id="downloadByEmail" fixed backdrop blockscrolling size="auto">
            <h3 slot="header">
                Send model results to email
            </h3>
            <div slot="content">
                <p>
                    Please provide your contact information and details for the requested download. <br/>
                    A download link for the requested data will be sent to the email adress entered.
                </p>
                <wl-textfield label="email" type="email" id="email_box"></wl-textfield>
                <p>
                    <b>Note:</b> This process can take several minutes.
                </p>
            </div>
            <div slot="footer" style="padding-top:0px;">
                <wl-button flat inverted style="margin-right:5px;" @click=${this.onCancelEmailDialogClicked}>Cancel</wl-button>
                <wl-button class="submit" @click=${this.onSendEmailDialogClicked}>Send</wl-button>
            </div>
        </wl-dialog>`;
    }

    private onDownloadButtonClicked () {
        showDialog("downloadByEmail", this.shadowRoot);
    }

    private onCancelEmailDialogClicked () {
        hideDialog("downloadByEmail", this.shadowRoot);
    }

    private onSendEmailDialogClicked () {
        let emailEl = this.shadowRoot.querySelector<Textfield>("#email_box");
        let email : string = emailEl ? emailEl.value : "";
        console.log("Select email:", email, " Select threadid:", this.thread.id);
        let subtask_url = window.location.href
        if (email && this.thread.id) {
            let req = AirflowAdapter.sendResultsToEmail(email,this.thread.id, subtask_url, this.problem_statement.name, this.thread.name);
            req.then(() => {
                this._notification.custom("Processing. The email will be send when the compress process is done.","send");
                this.onCancelEmailDialogClicked();
            })
            req.catch(() => {
                this._notification.error("Error sending your request. Please try again.")
                this.onCancelEmailDialogClicked();
            })
        }
    }

    _download (grouped_ensemble) {
        console.log(grouped_ensemble)
        let csv : string = (grouped_ensemble.outputs && grouped_ensemble.outputs.length > 0 ? 
                            grouped_ensemble.outputs.map((outf) => outf.name.replace(/(-|_)/g, ' ')).join(',') + ',' : '')
                         + (grouped_ensemble.inputs && grouped_ensemble.inputs.length > 0 ?
                            grouped_ensemble.inputs.map((inf) => inf.name.replace(/(-|_)/g, ' ')).join(',') + ',' : '')
                         + (grouped_ensemble.params && grouped_ensemble.params.length > 0 ? 
                            grouped_ensemble.params.map((param) => param.name.replace(/(-|_)/g, ' ')).join(',') + ',' : '')
        Object.values(grouped_ensemble.executions).forEach((ensemble:any) => {
            csv += '\n';
            let param_defaults = {};
            this.thread.models![ensemble.modelid].input_parameters.map((param) => param_defaults[param.id] = param.default);
            grouped_ensemble.outputs.forEach((output:any) => {
                if (Object.keys(ensemble.results).length == 0) {
                    csv += ','
                } else {
                    Object.values(ensemble.results).forEach((result:any) => {
                        let oname = result.id.replace(/.+#/, '');
                        if(output.name == oname) {
                            let furl = result.url;
                            let fname = result.name;
                            if (!furl) {
                                let location = result.location;
                                let prefs = this.prefs.mint;
                                furl = ensemble.execution_engine == "localex" ? 
                                    location.replace(prefs.localex.datadir, prefs.localex.dataurl) :
                                    location.replace(prefs.wings.datadir, prefs.wings.dataurl);
                            }
                            if (!fname)
                                fname = result.location.replace(/.+\//, '');
                            csv += furl + ','
                        }
                    })
                }
            });
            grouped_ensemble.inputs.forEach((input:any) => { 
                let res = ensemble.bindings[input.id] as DataResource;
                if (res) csv += res.url + ',';
                else csv += ',';
            });
            grouped_ensemble.params.forEach((param:any) => { 
                csv += (ensemble.bindings[param.id] ?  ensemble.bindings[param.id] : param_defaults[param.id]) + ',';
            });
        });

        downloadFile(csv, 'results.csv', 'text/csv;encoding:utf-8');
    }

    _orderBy(threadid: string, modelid: string, orderBy: string) {
        this.orderBy = orderBy;
        this._fetchRuns(threadid, modelid)
    }

    _nextPage(threadid: string, modelid: string, offset:  number) {
        this.currentPage[modelid] += offset;
        this._fetchRuns(threadid, modelid)
    }

    async _fetchRuns (threadid: string, modelid: string) {
        if(!this.currentPage[modelid])
            this.currentPage[modelid] = 1;
        let start = (this.currentPage[modelid] - 1)*this.pageSize;
        let limit = this.pageSize;
        let orderBy = {};
        orderBy[this.orderBy] = this.orderByDesc ? "desc" : "asc";
        store.dispatch(listThreadModelExecutionsAction(
            threadid,
            modelid, this.thread.model_ensembles[modelid].id, 
            start, limit, orderBy));
    }
    
    _getModelURL (model:Model) {
        if(!model) {
            return "";
        }
        let url = this._regionid + '/models/explore' + getPathFromModel(model) + "/";
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
        ReactGA.event({
          category: 'Thread',
          action: 'Save results',
        });
        let model = this.thread.models[modelid];
        /*
        -> Ingest thread to visualization database
        -> Register outputs to the data catalog        
        -> Publish run to provenance catalog
        */
        showNotification("saveNotification", this.shadowRoot);       
        
        sendDataForIngestion(this.thread.id, this.prefs);
        
        this.thread.execution_summary[modelid].submitted_for_ingestion = true;
    }

    async _reloadAllRuns() {
        let promises: any[] = [];
        Object.keys(this.thread.models).map((modelid) => {
            if(!this.currentPage[modelid])
                this.currentPage[modelid] = 1;
            console.log("Fetch runs for model " + modelid);
            promises.push(this._fetchRuns(this.thread.id, modelid));
        })
        await Promise.all(promises);
    }
    
    stateChanged(state: RootState) {
        super.setUser(state);
        super.setRegionId(state);
        super.setThread(state);

        let thread_id = this.thread?.id
        if(state.modeling.executions) {
            this._executions = state.modeling.executions[thread_id]; 
        }
    }
}
