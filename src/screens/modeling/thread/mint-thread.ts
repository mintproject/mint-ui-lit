import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import { SharedStyles } from "../../../styles/shared-styles";

import "./mint-variables";
import "./mint-models";
import "./mint-datasets";
import "./mint-parameters";
import "./mint-runs";
import "./mint-results";
import "./mint-visualize";

import "weightless/progress-spinner";

import { getThreadVariablesStatus, TASK_NOT_STARTED, getThreadModelsStatus, 
    getThreadDatasetsStatus, getThreadRunsStatus, getThreadResultsStatus, 
    TASK_DONE, TASK_PARTLY_DONE, 
    getUISelectedTask, getThreadParametersStatus } from "../../../util/state_functions";
import { Execution, ExecutionSummary, Task, Thread } from "../reducers";
import { BASE_HREF } from "../../../app/actions";
import { MintThreadPage } from "./mint-thread-page";
import { hideNotification } from "util/ui_functions";
import { subscribeThread, subscribeThreadExecutionSummary } from "../actions";
import { getLatestEvent } from "util/event_utils";
import { IdMap } from "app/reducers";

@customElement('mint-thread')
export class MintThread extends connect(store)(MintThreadPage) {
    @property({type: Object })
    private task: Task | null = null;

    @property({ type: String })
    private _currentMode: string = "";

    @property({type: Object})
    private _summaries: IdMap<ExecutionSummary>;

    @property({type: Boolean})
    private _dispatched: boolean = false;

    @property({type: Boolean})
    private _dispatched_execution_summary: boolean = false;

    static get styles() {
        return [
          SharedStyles,
          css`

          .breadcrumbs a.active, .breadcrumbs a.done.active {
            background-color: #0f7acf;
            color: white;
          }
          .breadcrumbs a.active:before, .breadcrumbs a.done.active:before {
            border-color: #0f7acf;
            border-left-color: transparent;
          }
          .breadcrumbs a.active:after, .breadcrumbs a.done.active:after {
            border-left-color: #0f7acf;
          }

          .breadcrumbs a.done {
            background-color: #06436c;
            color: white;
          }
          .breadcrumbs a.done:before {
            border-color: #06436c;
            border-left-color: transparent;
          }
          .breadcrumbs a.done:after {
            border-left-color: #06436c;
          }

          .card2 {
            margin: 0px;
            padding: 10px;
            margin-top: 5px;
            margin-bottom: 10px;
            border: 1px solid #F0F0F0;
            left: 0px;
            right: 0px;
            height: calc(100% - 100px);
            overflow: auto;
            background: #FFFFFF;
        }
        `
        ];
    }

    private _renderProgressBar() {
        return html`
            <ul class="breadcrumbs">
                <a id="models_breadcrumb" 
                    class="${this._getBreadcrumbClass('models')}" 
                    href="${this._getModeURL('models')}">Models</li>
                <a id="datasets_breadcrumb" 
                    class="${this._getBreadcrumbClass('datasets')}" 
                    href="${this._getModeURL('datasets')}">Datasets</li>
                <a id="parameters_breadcrumb" 
                    class="${this._getBreadcrumbClass('parameters')}" 
                    href="${this._getModeURL('parameters')}">Parameters</li>
                <a id="runs_breadcrumb" 
                    class="${this._getBreadcrumbClass('runs')}" 
                    href="${this._getModeURL('runs')}">Runs</li>
                <a id="results_breadcrumb" 
                    class="${this._getBreadcrumbClass('results')}" 
                    href="${this._getModeURL('results')}">Results</li>
                <a id="visualize_breadcrumb" 
                    class="${this._getBreadcrumbClass('visualize')}" 
                    href="${this._getModeURL('visualize')}">Visualize</li>
            </ul>
        `;
    }

    private _getSectionStatus(section:string) {
        let status = TASK_NOT_STARTED;
        switch(section) {
            case "variables":
                status = getThreadVariablesStatus(this.thread);
                break;
            case "models":
                status = getThreadModelsStatus(this.thread);
                break;
            case "datasets":
                status = getThreadDatasetsStatus(this.thread);
                break;
            case "parameters":
                status = getThreadParametersStatus(this.thread);
                break;
            case "runs":
                status = getThreadRunsStatus(this._summaries);
                break;
            case "results":
                status = getThreadResultsStatus(this._summaries);
                break;
            default:
                break;
        }
        return status;
    }

    private _getNextMode() {
        let modes = [
            "variables",
            "models",
            "datasets",
            "parameters",
            "runs",
            "results",
            "visualize"
        ];
        for(let i=0; i<modes.length; i++) {
            let status = this._getSectionStatus(modes[i]);
            if(status != TASK_DONE) {
                return modes[i];
            }
        }
        return "visualize";
    }

    private _getBreadcrumbClass(section: string) {
        let status = this._getSectionStatus(section);
        let cls = "";
        if(this._currentMode == section)
            cls += " active";

        switch(status) {
            case TASK_DONE:
                cls += " done";
                break;
            case TASK_PARTLY_DONE:
                cls += " partially_done";
                break;
            case TASK_NOT_STARTED:
                break;
        }
        return cls;
    }


    private _selectMode(mode: string) {
        if(this._currentMode == mode) {
            return;
        }
        let item = this.shadowRoot!.getElementById(mode + "_breadcrumb");
        if (item && item.className == "") {
            item.className = "active";
        }
        if (this._currentMode) {
            let itemold = this.shadowRoot!.getElementById(this._currentMode + "_breadcrumb")
            if (itemold && itemold.className == "active") {
                itemold.className = "";
            }
        }
        this._currentMode = mode;

        // TODO: Change the url to reflect mode change.
        if(this.task && this.thread) {
          let page = this._regionid + "/modeling/problem_statement/" + 
                this.problem_statement.id + "/" + this.task!.id + "/" + this.thread.id + "/" + mode;
          window.history.pushState({}, mode, BASE_HREF + page);
        }
    }

    private _getModeURL(mode: string) {
        if(this.problem_statement && this._regionid && this.task && this.thread)
            return this._regionid + "/modeling/problem_statement/" + 
                    this.problem_statement.id + "/" + this.task!.id + "/" + this.thread.id + "/" + mode;
    }    

    protected render() {
        if(this._dispatched)
            return html`<wl-progress-spinner class="loading"></wl-progress-spinner>`;

        if (!this.thread) {
            return html`No thread selected`;
        }

        return html`
            ${this._renderProgressBar()}

            <div class="card2">
                <mint-variables class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'variables'}">
                </mint-variables>
                <mint-models class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'models'}">
                </mint-models>
                <mint-datasets class="page" 
                    .problem_statement="${this.problem_statement}"
                    .task="${this.task}"
                    ?active="${this._currentMode == 'datasets'}">
                </mint-datasets>
                <mint-parameters class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'parameters'}">
                </mint-parameters>
                <mint-runs class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'runs'}">
                </mint-runs>
                <mint-results class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'results'}">
                </mint-results>
                <mint-visualize class="page" 
                    .problem_statement="${this.problem_statement}"
                    ?active="${this._currentMode == 'visualize'}">
                </mint-visualize>
            </div>
        `;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        super.setUser(state);
          
        this.task = getUISelectedTask(state);

        let thread_id = state.ui!.selected_thread_id;
        // If a thread has been selected, fetch thread details
        if(thread_id && this.user) {
            if(!this._dispatched && (!state.modeling.thread || (state.modeling.thread.id != thread_id))) {
                // Unsubscribe to any existing thread details listener
                if(state.modeling.thread && state.modeling.thread.unsubscribe) {
                    console.log("Unsubscribing to thread " + state.modeling.thread.id);
                    state.modeling.thread.unsubscribe();
                }
                if(state.modeling.thread?.id && state.modeling.execution_summaries) {
                    console.log("Unsubscribing to model execution summary for thread " + state.modeling.thread.id);
                    for(let modelid in ((state.modeling.execution_summaries ?? {})[state.modeling.thread.id] ?? {})) {
                        let summary : ExecutionSummary = state.modeling.execution_summaries[state.modeling.thread.id][modelid];
                        summary.unsubscribe();
                    }
                }

                console.log("Subscribing to thread " + thread_id);
                // Reset the problem_statement details
                this.thread = null;
                this._summaries = null;
                this._dispatched = true;
                this._dispatched_execution_summary = false;
                
                // Make a subscription call for the new thread id
                store.dispatch(subscribeThread(thread_id));              
                return;
            }

            // If we've already got the details in the state
            // - extract details from the state
            if(state.modeling.thread && 
                state.modeling.thread.id == thread_id && 
                state.modeling.thread.changed) {

                this._dispatched = false;
                state.modeling.thread.changed = false;
                this.thread = state.modeling.thread;
                if(!state.ui.selected_thread_section)
                    this._selectMode(this._getNextMode());

                if(!this._dispatched_execution_summary) {
                    // Make a subscription call for execution summaries for the new thread id
                    console.log("Subscribing to model execution summaries for "+thread_id);
                    if(state.modeling.thread.model_ensembles) {
                        for(let modelid in state.modeling.thread.model_ensembles) {
                            if(state.modeling.execution_summaries) {
                                delete state.modeling.execution_summaries[modelid];
                                if(state.modeling && state.modeling.executions)
                                    delete state.modeling.executions[modelid];
                            }
                            store.dispatch(subscribeThreadExecutionSummary(thread_id, modelid, 
                                state.modeling.thread.model_ensembles[modelid].id));
                            this._dispatched_execution_summary = true;
                        }
                    }
                }
            }
            else if(!state.modeling.thread) {
                this._dispatched = false;
            }
        }

        if(this.thread && state.ui.selected_thread_section) {
          //console.log(state.ui.selected_thread_section);
          this._selectMode(state.ui.selected_thread_section);
          state.ui.selected_thread_section = "";
        }

        if(state.modeling && state.ui && state.ui.selected_thread_id == null) {
            if(state.modeling.thread?.unsubscribe) {
                console.log("Unsubscribing to thread " + state.modeling.thread.id);
                state.modeling.thread.unsubscribe();
            }
            if(state.modeling.thread?.id && state.modeling.execution_summaries) {
                console.log("Unsubscribing to model execution summary for " + state.modeling.thread.id);
                for(let modelid in (state.modeling.execution_summaries[state.modeling.thread.id] ?? {})) {
                    let summary : ExecutionSummary = state.modeling.execution_summaries[state.modeling.thread.id][modelid];
                    summary.unsubscribe();
                }
            }
            state.modeling.thread = null;
            state.modeling.execution_summaries = null;
            state.modeling.executions = null;
            this.thread = null;
            this._summaries = null;
        }

        if(this.thread && state.modeling.execution_summaries && state.modeling.execution_summaries[thread_id]) {
            this.thread.execution_summary = state.modeling.execution_summaries[thread_id];
            this._summaries = this.thread.execution_summary;
        }

        if(!this.user && state.modeling.thread) {
            // Logged out, Unsubscribe
            if(state.modeling.thread.unsubscribe) {
                console.log("Unsubscribing to thread " + state.modeling.thread.id);
                state.modeling.thread.unsubscribe();
            }
            state.modeling.thread = undefined;
            this.thread = null;
            this._summaries = null;
        }
    }

    threadChanged(oldp: Thread, newp: Thread) {
        if(!oldp && newp)
            return true;
        if(oldp && newp) {
            let oldup = getLatestEvent(oldp.events)?.timestamp;
            let newup = getLatestEvent(newp.events)?.timestamp;
            if(oldup != newup) {
                console.log("Thread changed !");
                return true;
            }
        }
        return false;
    }

    timeChanged(oldsection:any, newsection: any) {
        if(!oldsection && !newsection)
            return false;
        if(!oldsection && newsection)
            return true;
        if(oldsection && !newsection)
            return true;
        if(oldsection.time != newsection.time)
            return true;
        return false;
    }
}
