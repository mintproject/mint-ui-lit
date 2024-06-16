import { customElement, html, css, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../../app/store';
import ReactGA from 'react-ga';

import { SharedStyles } from '../../../styles/shared-styles';

import 'weightless/progress-bar';
import { selectThreadSection } from '../../../app/ui-actions';
import { MintThreadPage } from './mint-thread-page';
import {
  showNotification,
  hideDialog,
  showDialog,
  hideNotification,
} from 'util/ui_functions';
import { renderNotifications } from 'util/ui_renders';
import { Model } from 'screens/models/reducers';
import { Execution, ExecutionSummary, ModelExecutions } from '../reducers';
import {
  listThreadModelExecutionsAction,
  subscribeThreadExecutionSummary,
} from '../actions';
import { DataResource } from 'screens/datasets/reducers';
import { postJSONResource, getResource } from 'util/mint-requests';
import {
  getThreadRunsStatus,
  TASK_DONE,
  getThreadParametersStatus,
} from 'util/state_functions';
import { getPathFromModel } from '../../models/reducers';
import { toDateTimeString } from 'util/date-utils';

@customElement('mint-runs')
export class MintRuns extends connect(store)(MintThreadPage) {
  @property({ type: Object })
  private _executions: ModelExecutions;

  @property({ type: String })
  private _thread_id: string;

  @property({ type: Object })
  private totalPages: Map<string, number> = {} as Map<string, number>;
  @property({ type: Object })
  private currentPage: Map<string, number> = {} as Map<string, number>;
  @property({ type: Number })
  private pageSize = 100;
  @property({ type: Array })
  private orderBy = [{ status: 'asc' }]; //, {"start_time": "asc"}];

  @property({ type: String })
  private _log: string;

  static get styles() {
    return [SharedStyles, css``];
  }

  private _scrollInto(id: string) {
    let el = this.shadowRoot!.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  protected render() {
    if (!this.thread) {
      return html``;
    }

    let cando = getThreadParametersStatus(this.thread) == TASK_DONE;
    // If no parameters selected
    if (!cando) {
      return html`
        <p>This step is for monitoring model runs.</p>
        Please setup some models first
      `;
    }

    let done = getThreadRunsStatus(this.thread) == TASK_DONE;

    // Group running executions
    let grouped_executions = {};
    Object.keys(this._executions || {}).map((modelid) => {
      let model = this.thread.models![modelid];
      let loading = this._executions[modelid].loading;
      if (!model) {
        return;
      }
      grouped_executions[model.id] = {
        executions: {},
        params: [],
        inputs: [],
        outputs: [],
        loading: loading,
      };
      let input_parameters = model.input_parameters
        .filter((input) => !input.value)
        .sort((a, b) => {
          if (a.position && b.position) return a.position - b.position;
          else return a.name.localeCompare(b.name);
        });
      input_parameters.map((ip) => {
        if (!ip.value) grouped_executions[model.id].params.push(ip);
      });
      model.input_files.map((inf) => {
        if (!inf.value) grouped_executions[model.id].inputs.push(inf);
      });

      let executions: Execution[] = this._executions[modelid].executions;
      if (executions)
        executions.map((execution) => {
          if (execution)
            grouped_executions[model.id].executions[execution.id] = execution;
        });
    });

    return html`
      <p>This step is for monitoring model runs.</p>
      <wl-title level="3">Runs</wl-title>
      <div class="clt">
        <ul>
          ${Object.keys(this.thread.execution_summary ?? {}).map((modelid) => {
            let summary = this.thread.execution_summary[modelid];
            let model = this.thread.models![modelid];
            if (!model) {
              console.warn(
                'modelid:',
                modelid,
                'is not on this thread!',
                this.thread
              );
              //TODO: For some reason the modelid is of other model...
              return `  `;
            }
            if (!summary.total_runs) {
              return html`<loading-dots
                style="--width: 20px; margin-left:10px"
              ></loading-dots>`;
            }

            let grouped_ensemble = grouped_executions[modelid];
            this.totalPages[modelid] = Math.ceil(
              summary.total_runs / this.pageSize
            );

            //Count parameters:
            let nParameters: number = model.input_parameters
              .map(
                (param) =>
                  (
                    this.thread.model_ensembles[modelid].bindings[param.id] || [
                      0,
                    ]
                  ).length
              )
              .reduce((ac, len) => ac * len, 1);

            //Count inputs:
            let nInputs: number = model.input_files
              .map((input) =>
                input.value
                  ? (input.value.resources || []).filter(
                      (r) => r.selected != false
                    ).length
                  : (
                      this.thread.model_ensembles[modelid].bindings[input.id] ||
                      []
                    )
                      .map((dsid) => this.thread.data[dsid].selected_resources)
                      .reduce((ac, len) => ac * len, 1)
              )
              .reduce((ac, len) => ac * len, 1);

            let submitted_runs = summary.submitted_runs
              ? summary.submitted_runs
              : 0;
            let failed_runs = summary.failed_runs ? summary.failed_runs : 0;
            let successful_runs = summary.successful_runs
              ? summary.successful_runs
              : 0;
            let finished_runs = successful_runs + failed_runs;

            let submitted =
              summary.submitted_for_execution || summary.submission_time;
            let finished = finished_runs == summary.total_runs;
            let running = submitted_runs - finished_runs;
            let pending = summary.total_runs - submitted_runs;
            if (!this.currentPage[modelid]) this.currentPage[modelid] = 1;

            /*
                if(!grouped_ensemble && model) {
                    this._fetchRuns(model.id)
                }
                */
            if (!model) {
              return '';
            }
            //console.log(summary, model);

            if (!submitted) {
              return html` <li>
                <wl-title level="4"
                  ><a target="_blank" href="${this._getModelURL(model)}"
                    >${model.name}</a
                  ></wl-title
                >
                <p>
                  The parameter settings you selected require
                  ${summary.total_runs} runs (${nInputs} input resources &#215;
                  ${nParameters} parameters).
                  <br />
                  ${model.output_files.length * summary.total_runs} output files
                  will be generated (${model.output_files.length} outputs x
                  ${summary.total_runs} runs).
                </p>
                ${this.permission.execute && this.permission.write
                  ? html` <wl-button
                      class="submit"
                      ?disabled="${this._waiting}"
                      @click="${() => this._submitRuns(model.id)}"
                    >
                      Send Runs
                      ${this._waiting
                        ? html`<loading-dots
                            style="--width: 20px"
                          ></loading-dots>`
                        : ''}
                    </wl-button>`
                  : html`You don't have permission to send runs on this sub-task`}
              </li>`;
            }

            return html` <li>
              <wl-title level="4"
                ><a target="_blank" href="${this._getModelURL(model)}"
                  >${model.name}</a
                ></wl-title
              >
              <p>
                Below is the status of all the runs for the model with the
                different setups that you selected earlier. A green status bar
                means that the run is completed. A partially green and
                grey/partially grey status bar indicates that the run is still
                ongoing. A red bar indicates that the run failed. You can view
                results of the completed runs by going to the Results tab even
                when other runs are still not completed.
              </p>
              <p>
                The parameter settings you selected require
                ${summary.total_runs} runs (${nInputs} input resources &#215;
                ${nParameters} parameters). ${!finished ? 'So far, ' : ''}
                ${submitted_runs} model runs ${!finished ? 'have been' : 'were'}
                submitted, out of which ${successful_runs} succeeded, while
                <span .style="color:${failed_runs ? 'red' : ''}"
                  >${failed_runs} failed</span
                >. ${running > 0 ? html`${running} are currently running` : ''}
                ${running > 0 && pending > 0 ? ', and ' : ''}
                ${pending > 0 ? html`${pending} are waiting to be run` : ''}
              </p>

              <div
                style="width: 100%; border:1px solid #EEE;border-bottom:0px; line-height: 30px;"
              >
                ${grouped_ensemble && !grouped_ensemble.loading
                  ? html`
                      ${this.currentPage[model.id] > 1
                        ? html`<wl-button
                            flat
                            inverted
                            @click=${() =>
                              this._nextPage(this.thread.id, model.id, -1)}
                            >Back</wl-button
                          >`
                        : html`<wl-button flat inverted disabled
                            >Back</wl-button
                          >`}
                      Page ${this.currentPage[model.id]} of
                      ${this.totalPages[model.id]}
                      ${this.currentPage[model.id] < this.totalPages[model.id]
                        ? html`<wl-button
                            flat
                            inverted
                            @click=${() =>
                              this._nextPage(this.thread.id, model.id, 1)}
                            >Next</wl-button
                          >`
                        : html`<wl-button flat inverted disabled
                            >Next</wl-button
                          >`}
                    `
                  : ''}
                <span style="float:right">
                  <span>Scroll to:</span>
                  <wl-button
                    type="button"
                    flat
                    inverted
                    style="padding: 6px; border-radius: 4px;"
                    @click="${() => this._scrollInto('run')}"
                  >
                    Run</wl-button
                  >
                  ${grouped_ensemble && !grouped_ensemble.loading
                    ? html`
                        ${grouped_ensemble.inputs.length > 0
                          ? html`
                              <wl-button
                                type="button"
                                flat
                                inverted
                                style="padding: 6px; border-radius: 4px;"
                                @click="${() => this._scrollInto('in')}"
                              >
                                Inputs</wl-button
                              >
                            `
                          : html``}
                        ${grouped_ensemble.params.length > 0
                          ? html`
                              <wl-button
                                type="button"
                                flat
                                inverted
                                style="padding: 6px; border-radius: 4px;"
                                @click="${() => this._scrollInto('param')}"
                              >
                                Parameters</wl-button
                              >
                            `
                          : html``}
                      `
                    : html``}
                  |
                  <wl-button
                    type="button"
                    flat
                    inverted
                    style="float:right"
                    @click="${() =>
                      (this.currentPage[model.id] = 1) &&
                      this._fetchRuns(this.thread.id, model.id)}"
                    >Reload</wl-button
                  >
                </span>
              </div>
              <div
                style="height:400px;overflow:auto;width:100%;border:1px solid #EEE"
              >
                ${grouped_ensemble
                  ? grouped_ensemble.loading
                    ? html`<wl-progress-spinner
                        class="loading"
                      ></wl-progress-spinner>`
                    : html` <table
                        class="pure-table pure-table-bordered run_table"
                      >
                        <!-- Heading -->
                        <colgroup span="2"></colgroup>
                        <!-- Run Status -->
                        ${grouped_ensemble.inputs.length > 0
                          ? html`<colgroup
                              span="${grouped_ensemble.inputs.length}"
                            ></colgroup>`
                          : ''}
                        <!-- Inputs -->
                        ${grouped_ensemble.params.length > 0
                          ? html`<colgroup
                              span="${grouped_ensemble.params.length}"
                            ></colgroup>`
                          : ''}
                        <!-- Parameters -->
                        <thead>
                          <tr>
                            <th colspan="4" id="run">Run</th>
                            <!-- Run Status -->
                            ${grouped_ensemble.inputs.length > 0
                              ? html`<th
                                  colspan="${grouped_ensemble.inputs.length}"
                                  id="in"
                                >
                                  Inputs
                                </th>`
                              : ''}
                            <!-- Inputs -->
                            ${grouped_ensemble.params.length > 0
                              ? html`<th
                                  colspan="${grouped_ensemble.params.length}"
                                  id="param"
                                >
                                  Parameters
                                </th>`
                              : ''}
                            <!-- Parameters -->
                          </tr>
                          <tr>
                            <th>Run Status</th>
                            <th>Run Start Time</th>
                            <th>Run End Time</th>
                            <th>Run Log</th>
                            ${grouped_ensemble.inputs.length +
                              grouped_ensemble.params.length ==
                            0
                              ? html`<th></th>`
                              : ''}
                            ${grouped_ensemble.inputs.map(
                              (inf) =>
                                html`<th scope="col">
                                  ${inf.name.replace(/(-|_)/g, ' ')}
                                </th>`
                            )}
                            ${grouped_ensemble.params.map(
                              (param) =>
                                html`<th scope="col">
                                  ${param.name.replace(/(-|_)/g, ' ')}
                                </th>`
                            )}
                          </tr>
                        </thead>
                        <!-- Body -->
                        <tbody>
                          ${grouped_ensemble.executions &&
                          Object.keys(grouped_ensemble.executions).length > 0
                            ? Object.keys(grouped_ensemble.executions).map(
                                (index: string) => {
                                  let ensemble: Execution =
                                    grouped_ensemble.executions[index];
                                  let model =
                                    this.thread.models![ensemble.modelid];
                                  let param_defaults = {};
                                  model.input_parameters.map(
                                    (param) =>
                                      (param_defaults[param.id] = param.default)
                                  );
                                  return html`
                                    <tr>
                                      <td>
                                        <wl-progress-bar
                                          mode="determinate"
                                          class="${ensemble.status}"
                                          value="${ensemble.status == 'FAILURE'
                                            ? 100
                                            : ensemble.run_progress || 0}"
                                        ></wl-progress-bar>
                                      </td>
                                      <td class="caption">
                                        ${toDateTimeString(ensemble.start_time)}
                                      </td>
                                      <td class="caption">
                                        ${toDateTimeString(ensemble.end_time)}
                                      </td>
                                      <td>
                                        <wl-button
                                          style="--button-padding: 2px; --button-border-radius: 2px"
                                          @click="${() =>
                                            this._viewRunLog(ensemble.id)}"
                                          inverted
                                          flat
                                        >
                                          View Log</wl-button
                                        >
                                      </td>
                                      ${grouped_ensemble.inputs.length +
                                        grouped_ensemble.params.length ==
                                      0
                                        ? html`<td>No inputs or parameters</td>`
                                        : ''}
                                      ${grouped_ensemble.inputs.map((input) => {
                                        let res = ensemble.bindings[
                                          input.id
                                        ] as DataResource;
                                        if (res) {
                                          // FIXME: This should be resolved to a collection of resources
                                          let furl = this._getDatasetURL(res);
                                          return html`
                                            <td>
                                              <a target="_blank" href="${furl}"
                                                >${res.name}</a
                                              >
                                            </td>
                                          `;
                                        }
                                      })}
                                      ${grouped_ensemble.params.map((param) => {
                                        let pvalue = ensemble.bindings[param.id]
                                          ? ensemble.bindings[param.id]
                                          : param_defaults[param.id];
                                        if (pvalue.match(/^__region_geojson/)) {
                                          pvalue = 'Region Geojson';
                                        }
                                        return html`<td>${pvalue}</td>`;
                                      })}
                                    </tr>
                                  `;
                                }
                              )
                            : html`
                                <tr>
                                  <td
                                    colspan="${grouped_ensemble.inputs.length +
                                      grouped_ensemble.params.length ==
                                    0
                                      ? 5
                                      : grouped_ensemble.inputs.length +
                                        grouped_ensemble.params.length +
                                        4}"
                                  >
                                    <wl-progress-bar
                                      style="display: inline-block; margin-right: 15px"
                                    ></wl-progress-bar>
                                    <p style="display: inline-block;">
                                      Downloading software image and data...
                                    </p>
                                  </td>
                                </tr>
                              `}
                        </tbody>
                      </table>`
                  : ''}
              </div>
            </li>`;
          })}
        </ul>
        ${done
          ? html`
              <div class="footer">
                <wl-button
                  type="button"
                  class="submit"
                  @click="${() =>
                    store.dispatch(selectThreadSection('results'))}"
                  >Continue</wl-button
                >
              </div>
            `
          : ''}
      </div>

      ${renderNotifications()} ${this._renderLogDialog()}
    `;
  }

  _submitRuns(modelid: string) {
    ReactGA.event({
      category: 'Thread',
      action: 'Send run',
    });
    let mint = this.prefs.mint;
    let data = {
      thread_id: this.thread.id,
      model_id: modelid,
    };
    showNotification('runNotification', this.shadowRoot);
    let me = this;
    this._waiting = true;
    postJSONResource(
      {
        url:
          mint.ensemble_manager_api +
          this.getEnsembleManagerExecutionPath(mint.execution_engine),
        onLoad: function (e: any) {
          me._waiting = false;
          hideNotification('runNotification', me.shadowRoot);
        },
        onError: function () {
          me._waiting = false;
          hideNotification('runNotification', me.shadowRoot);
          alert('Could not connect to the Execution Manager!');
        },
      },
      data,
      false
    );

    this.selectAndContinue('runs');
  }

  _nextPage(threadid: string, modelid: string, offset: number) {
    this.currentPage[modelid] += offset;
    this._fetchRuns(threadid, modelid);
  }

  _viewRunLog(ensembleid: string) {
    this._log = null;
    let me = this;
    showDialog('logDialog', this.shadowRoot!);
    // Call out to the ensemble manager to get the log
    getResource(
      {
        url:
          this.prefs.mint.ensemble_manager_api +
          '/logs?ensemble_id=' +
          ensembleid,
        onLoad: function (e: any) {
          let log = e.target.responseText;
          log = log.replace(/\\n/g, '\n');
          log = log.replace(/\\r/g, '');
          log = log.replace(/\\t/g, '\t');
          log = log.replace(/\\u001b.+?m/g, '');
          log = log.replace(/^"/, '');
          log = log.replace(/"$/, '');
          me._log = log;
          //console.log(me._log);
        },
        onError: function () {},
      },
      false
    );
  }

  _closeRunLogDialog(runid: string) {
    hideDialog('logDialog', this.shadowRoot!);
  }

  _renderLogDialog() {
    return html`
      <wl-dialog
        id="logDialog"
        fixed
        persistent
        backdrop
        blockscrolling
        style="--dialog-width:800px;"
      >
        <h3 slot="header">Run log</h3>
        <div slot="content" style="height:500px;overflow:auto">
          ${this._log
            ? html` <pre style="font-size:11px">${this._log}</pre> `
            : html`<wl-progress-spinner class="loading"></wl-progress-spinner>`}
        </div>
        <div slot="footer">
          <wl-button @click="${this._closeRunLogDialog}" class="submit"
            >Close</wl-button
          >
        </div>
      </wl-dialog>
    `;
  }

  async _fetchRuns(threadid: string, modelid: string) {
    if (this.thread.model_ensembles[modelid]) {
      if (!this.currentPage[modelid]) this.currentPage[modelid] = 1;
      let start = (this.currentPage[modelid] - 1) * this.pageSize;
      let limit = this.pageSize;
      store.dispatch(
        listThreadModelExecutionsAction(
          threadid,
          modelid,
          this.thread.model_ensembles[modelid].id,
          start,
          limit,
          this.orderBy
        )
      );
    }
  }

  async _reloadAllRuns() {
    let promises: any[] = [];
    Object.keys(this.thread.models).map((modelid) => {
      if (!this.currentPage[modelid]) this.currentPage[modelid] = 1;
      console.log('Fetch runs for model ' + modelid);
      promises.push(this._fetchRuns(this.thread.id, modelid));
    });
    await Promise.all(promises);
  }

  _isExecutionRunFinished(ensemble: Execution) {
    return ensemble.status == 'SUCCESS' || ensemble.status == 'FAILURE';
  }

  getEnsembleManagerExecutionPath(executionEngine: string) {
    if (executionEngine === 'localex') return '/executionsLocal';
    else if (executionEngine === 'wings') return '/executions';
    return `/executionEngines/${executionEngine}`;
  }

  _getModelURL(model: Model) {
    if (!model) {
      return '';
    }
    let url =
      this._regionid + '/models/explore' + getPathFromModel(model) + '/';
    return url;
  }

  _getDatasetURL(res: any) {
    let furl = res.url;
    let fname = res.name;
    if (!furl) {
      let location = res.location;
      let prefs = this.prefs.mint;
      furl = location.replace(prefs.localex.datadir, prefs.localex.dataurl);
    }
    return furl;
  }

  stateChanged(state: RootState) {
    super.setUser(state);
    super.setRegionId(state);
    super.setThread(state);

    let thread_id = this.thread?.id;

    for (let modelid in this.thread?.execution_summary ?? {}) {
      let summary: ExecutionSummary = this.thread.execution_summary[modelid];
      if (summary.changed) {
        // If the execution summary has changed, then fetch runs
        // TODO: Batch fetching of runs (otherwise it refreshes too much)
        summary.changed = false;
        this._fetchRuns(thread_id, modelid);
      }
    }

    if (state.modeling.executions) {
      this._executions = state.modeling.executions[thread_id];
    }
  }
}
