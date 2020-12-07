import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { Model } from "../models/reducers";

import { IdMap, UserPreferences } from 'app/reducers';
import { ProblemStatementInfo, ProblemStatementList, ThreadInfo, ThreadEvent, Task, Thread } from 'screens/modeling/reducers';
import { subscribeProblemStatementsList, subscribeProblemStatement, subscribeThread } from 'screens/modeling/actions';

import { fromTimeStampToDateString } from "util/date-utils";
import { getURL } from 'model-catalog/util';

import '../../components/nav-title'
import { getVisualizationURLs } from 'util/state_functions';
import { Region, RegionMap } from 'screens/regions/reducers';
import { VariableMap } from '@apollo/client/core/LocalState';

const PREFIX_REPORT = 'analysis/report/';

@customElement('analysis-report')
export class AnalysisReport extends connect(store)(PageViewElement) {
  @property({type: String})
  private _top_regionid?: string;

  @property({type: Object})
  private _top_region: Region;

  @property({type: Object})
  private _regions!: RegionMap;

  @property({type: Object})
  private _list!: ProblemStatementList;

  @property({type: Boolean})
  private _dispatched: Boolean;

  @property({type: Object})
  private _tasks : IdMap<IdMap<Task>> = {};

  @property({type: Object})
  private _thread : Thread;

  @property({type: Boolean})
  private _loading : IdMap<boolean> = {};

  @property({type: String})
  private _selectedProblemStatementId : string = '';

  @property({type: String})
  private _selectedTaskId : string = '';

  @property({type: String})
  private _selectedThreadId : string = '';

  @property({type: Object})
  private prefs: UserPreferences;

  @property({type: Object})
  private _variableMap: VariableMap = {};

  static get styles() {
    return [SharedStyles, css`
      .cltrow wl-button {
        padding: 2px;
      }

      .two-column-grid {
        display: inline-grid;
        grid-template-columns: auto auto;
        grid-gap: 0px 10px;
      }

      .two-column-grid > wl-title {
        text-align: right;
      }

      .two-column-grid > span > div {
        margin-top: 2px;
      }

      .main-content {
        width: 75%;
        margin: 0 auto;
      }

      .inner-content {
        padding: 0px 30px;
        margin-bottom: 15px;
      }

      div.notes > span {
        color: #999;
        font-style: italic;
      }

      div.notes {
        margin-top: 5px;
      }

      .monospaced {
        font: 12px Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace;
      }

      iframe {
        width: calc(100vw - 100px);
        margin-left: -17.5%;
        border: 0px solid black;
        height: 100vh;
      }
    `];
  }

  protected render() {
    let nav = [{label:'Available Reports', url:'analysis/report'}] 
    if (this._selectedThreadId) {
      nav.push({label: 'Available Reports', url: 'analysis/report'})
    }

    return html`
        <nav-title .nav="${nav}" max="2"></nav-title>
        ${(!this._list || this._dispatched) ?
          this._renderLoading()
          : (
            (this._selectedProblemStatementId && this._selectedTaskId && this._selectedThreadId) ?
              this._renderReport() : this._renderReportList()
          )}
    `;
  }

  private _renderLoading () {
    return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
  }


  private _renderReportList () {
    return html`
      <span id="start"></span>
      ${Object.values(this._list.problem_statements).map((ps:ProblemStatementInfo) => html`
        <wl-expansion name="problem_statements" @click="${() => this._getTasks(ps)}" style="overflow-y: hidden;">
          <span slot="title" style="flex-grow: unset;">
            ${ps.name}
          </span>
          <!--span slot="description" style="overflow: hidden; text-overflow: ellipsis;"-->
          ${this._tasks[ps.id] ? 
            (Object.values(this._tasks[ps.id]).map((task:Task) => this._renderTask(ps , task)))
            : this._renderLoading()
          }
        </wl-expansion>`
      )}`;
  }

  private _renderTask (ps:ProblemStatementInfo, task:Task) {
    let threads : ThreadInfo[] = Object.values(task.threads || []);
    return html`
      ${threads.map((t:ThreadInfo) => html`
        <wl-list-item class="active" @click=${() => {
            this._scrollUp();
            goToPage(PREFIX_REPORT + ps.id + '/' + task.id + '/' + t.id);
          }}>
          <wl-title level="4" style="margin: 0">
          ${task.name ? (task.name + " - ") : ""} ${t.name ? t.name : "Default thread"}
          </wl-title>
          ${this._getThreadInfoSummaryText(t)}
          <div slot="after" style="display:flex">
            ${this._renderDates(t)}
          </div>
        </wl-list-item>
      `)}
    `;
  }

  private _getTasks(ps:ProblemStatementInfo) {
    if (!this._tasks[ps.id]) {
      this._loading[ps.id] = true;
      store.dispatch(subscribeProblemStatement(ps.id));
    }
  }

  private _renderReport () {
    let ps = this._list.problem_statements[this._selectedProblemStatementId];
    if (!this._tasks[this._selectedProblemStatementId] && !this._loading[this._selectedProblemStatementId]) {
      this._getTasks(ps);
    }
    if (this._loading[this._selectedProblemStatementId]) return this._renderLoading();
    let task = this._tasks[this._selectedProblemStatementId][this._selectedTaskId];

    if (!this._thread || this._thread.id != this._selectedThreadId) {
      return this._renderLoading();
    }

    //let thread = task.threads[this._selectedThreadId];
    let thread = this._thread

    let notes : IdMap<string> = {};

    if (thread.events && thread.events.length > 0) {
      thread.events.forEach((ev: ThreadEvent) => {
        if (ev.notes) notes[ev.event] = ev.notes;
      });
    }

    let vizurls = getVisualizationURLs(thread, task, ps, this.prefs.mint)

    return html`
        <div class="main-content">
          <wl-title level="2" class="two-column-grid" style="padding: 0px;">
            <span>Thread: </span>
            <span>${task.name ? (task.name + " - ") : ""} ${thread.name ? thread.name : "Default thread"}</span>
          </wl-title>

          ${this._renderVariablesSection(task, notes)}
          ${this._renderModelsSection(thread, notes)}
          ${this._renderDataSection(thread, notes)}
          ${this._renderParametersSection(thread, notes)}
          ${this._renderExecutionsSection(thread, notes)}

          <wl-title level="3">Thread visualizations:</wl-title>
          <div class="inner-content">
          ${!vizurls?
            'No visualizations for this run' : 
            vizurls.map((vizurl) => {
                return html`<iframe src="${vizurl}"></iframe>`;
            })
          }
          </div>
    `;
  }

  private _renderVariablesSection (task:Task, notes: IdMap<string>) {
    return html`<wl-title level="3">Variables:</wl-title>
      <div class="two-column-grid inner-content">
        <wl-title level="4">Indicators:</wl-title>
        <span>
          ${!task.response_variables || task.response_variables.length == 0 ?
            'No indicators' : task.response_variables.map((rv) => html`
            <div>${this._variableMap[rv]?.name ?? ""} (<span class="monospaced">${rv}</span>)</div>`)}
        </span>
        <wl-title level="4">Adjustable variables:</wl-title>
        <span>
          ${!task.driving_variables || task.driving_variables.length == 0 ?
          'No adjustable variables' : task.driving_variables.map((dv) => html`
            <div>${this._variableMap[dv]?.name ?? ""} (<span class="monospaced">${dv}</span>)</div>`)}
        </span>
      </div>`
  }

  private _renderModelsSection (thread:Thread, notes: IdMap<string>) {
    return html`
          <wl-title level="3">Models:</wl-title>
          <div class="inner-content">
            ${!thread.models || Object.keys(thread.models).length == 0 ?
            'No models were selected in this thread' :
            Object.values(thread.models).map((model:Model) => {
              let modelurl : string = this._top_regionid;
              modelurl += '/models/explore/';
              modelurl += getURL(model.model_name, model.model_version, model.model_configuration, model.id);
              return html`<a href="${modelurl}" target="_blank">${model.name}</a>`
            })}
            ${notes['SELECT_MODELS'] ?  html`
              <div class="notes">
                Notes: <span>${ notes['SELECT_MODELS'] }</span>
              </div>` : '' }
          </div>

    `;
  }

  private _renderDataSection (thread:Thread, notes: IdMap<string>) {
    return html`
          <wl-title level="3">Datasets:</wl-title>
          <div class="inner-content">
            ${!thread.data || Object.keys(thread.data).length == 0 ?
            'No datasets were selected in this thread' :
            Object.values(thread.data).map((dataset) => dataset.name)}
            ${notes['SELECT_DATA'] ?  html`
              <div class="notes">
                Notes: <span>${ notes['SELECT_DATA'] }</span>
              </div>` : '' }
          </div>

    `;
  }

  private _renderParametersSection (thread:Thread, notes: IdMap<string>) {
    return html`
          <wl-title level="3">Setup:</wl-title>
          <div class="inner-content">
            ${!thread.model_ensembles || Object.keys(thread.model_ensembles).length == 0 ?
            'No adjustable variables for this model' 
            : (Object.values(thread.models).map((model:Model) => html`
              Parameters for <b>${model.name}</b>:
              <table class="pure-table pure-table-striped" style="width: 100%">
                <colgroup>
                    <col span="1">
                    <col span="1">
                </colgroup>
                <thead>
                    <th><b>Variable</b></th>
                    <th><b>Value</b></th>
                </thead>
                <tbody>
                  ${Object.keys(thread.model_ensembles[model.id].bindings).map((key:string) => html`
                    <tr>
                      <td>${key.split('/').pop()}</td>
                      <td>${thread.model_ensembles[model.id].bindings[key].join(', ')}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `))
            }

            ${notes['SELECT_PARAMETERS'] ?  html`
              <div class="notes">
                Notes: <span>${ notes['SELECT_PARAMETERS'] }</span>
              </div>` : '' }
          </div>
    `;
  }

  private _renderExecutionsSection (thread:Thread, notes: IdMap<string>) {
    return html`
          <wl-title level="3">Model runs and Results:</wl-title>
          <div class="inner-content">
            ${Object.values(thread.models).map((model:Model) => html`
              Exectution details for <b>${model.name}</b>:<br/>
              ${!thread.execution_summary[model.id] ? 
                'Theres no available information for this run.'
                : html`
                  The model setup created ${thread.execution_summary[model.id].total_runs} configurations.
                  ${thread.execution_summary[model.id].submitted_runs} model runs were submitted,
                  out of which ${thread.execution_summary[model.id].successful_runs} succeeded, 
                  and ${thread.execution_summary[model.id].failed_runs} failed.
                `}
            `)} 
          </div>
    `;
  }

  private _scrollUp () {
    let el = this.shadowRoot.getElementById('start');
    if (el) {
      el.scrollIntoView({behavior: "smooth", block: "start"})
    }
  }

  private _getThreadInfoSummaryText (t: ThreadInfo) {
    let response = t.response_variables ? this._variableMap[t.response_variables[0]] : null;
    let regionname = t.regionid && this._regions && this._regions[t.regionid] ? this._regions[t.regionid].name : this._region.name;
    return (response ? response.name + ": " : "") + regionname
  }

  private _renderDates (thread: ThreadInfo) {
    let dates = thread.dates
    let startdate = (dates!.start_date);
    let enddate = (dates!.end_date);
    return startdate.toLocaleDateString("en-US") + " - " + enddate.toLocaleDateString("en-US");
  }

  // checking executable_ensemble_summary
  private _subscribeToProblemStatementList() {
    if(this._list && this._list.unsubscribe)
      this._list.unsubscribe();
    this._dispatched = true;
    console.log("Subscribing to Problem Statement List for " + this._top_regionid);
    store.dispatch(subscribeProblemStatementsList(this._top_regionid));
  }

  stateChanged(state: RootState) {
    /* This could stay active when moving to another page for links, so autoupdate active property */
    super.setSubPage(state);
    this.active = (this._subpage === 'report');
    this.prefs = state.app.prefs;

    if (state.modeling) {
      if (state.modeling.problem_statements) {
        this._list = state.modeling.problem_statements;
        this._dispatched = false;
      }
      if (state.modeling.problem_statement && (!this._tasks[state.modeling.problem_statement.id])) {
        this._tasks[state.modeling.problem_statement.id] = state.modeling.problem_statement.tasks;
        this._loading[state.modeling.problem_statement.id] = false;
        this.requestUpdate();
      }
      if (state.modeling.thread && !this._thread && (state.modeling.thread.id === state.ui.selected_thread_id)) {
        this._thread = state.modeling.thread;
        this.requestUpdate();
      }
    }

    if(state.variables && state.variables.variables) {
      this._variableMap = state.variables.variables;
    }

    if (state.ui) {
      this._selectedProblemStatementId = state.ui.selected_problem_statement_id
      this._selectedTaskId = state.ui.selected_task_id;
      if (state.ui.selected_thread_id && state.ui.selected_thread_id != this._selectedThreadId) {
        this._thread = undefined;
        this._selectedThreadId = state.ui.selected_thread_id;
        //store.dispatch( subscribeThread(this._selectedThreadId) );
      }
      this._selectedThreadId = state.ui.selected_thread_id;
      if (state.ui.selected_top_regionid && state.regions!.regions &&
          this._top_regionid != state.ui.selected_top_regionid) {
        this._top_regionid = state.ui.selected_top_regionid;
        this._regions = state.regions!.regions;
        this._top_region = this._regions[this._top_regionid];
        //this._subscribeToProblemStatementList();
      } 
    }
    super.setRegionId(state);
  }

}

/* vim: set ts=2 sw=2 sts=2 tw=160 cc=160 : */
