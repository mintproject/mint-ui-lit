import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { IdMap } from 'app/reducers';
import { Scenario, ScenarioList, Pathway } from 'screens/modeling/reducers';

import { fromTimeStampToDateString } from "util/date-utils";
import { getVariableLongName } from "offline_data/variable_list";

import { listScenarios } from 'screens/modeling/actions';
import { RegionList } from "screens/regions/reducers";
import { queryRegions } from 'screens/regions/actions';
import { db } from '../../config/firebase';

import '../../components/nav-title'

function log (...args: any) {console.log('REPORT:', ...args)}

const PREFIX_REPORT = 'analysis/report/';

@customElement('analysis-report')
export class AnalysisReport extends connect(store)(PageViewElement) {
  @property({type: Boolean})
  private _loading = false;

  @property({type: Object})
  private _scenarios = {};

  @property({type: Object})
  private _tasks = {};

  @property({type: Object})
  private _pathways = {};

  @property({type: Object})
  private _subRegions: RegionList;

  @property({type: String})
  private _selectedScenarioId : string = '';

  @property({type: String})
  private _selectedTaskId : string = '';

  @property({type: String})
  private _selectedPathwayId : string = '';

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
    if (this._selectedPathwayId) {
      nav.push({label: 'Available Reports', url: 'analysis/report'})
    }

    return html`
        <nav-title .nav="${nav}" max="2"></nav-title>
        ${this._loadReportsPage()}
    `;
  }

  private _loadReportsPage() {
    //log('RENDER')
    //log(this._selectedScenarioId, this._selectedTaskId, this._selectedPathwayId)
    if (this._selectedScenarioId && this._selectedTaskId && this._selectedPathwayId) {
      let scenario = this._scenarios[this._selectedScenarioId];
      let task = this._tasks[this._selectedTaskId];
      let pathway = this._pathways[this._selectedPathwayId] as Pathway;
      if (!pathway) {
        return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;
      }

      let responseV = pathway.response_variables && pathway.response_variables.length > 0 ?
          getVariableLongName(pathway.response_variables[0]) : '';
      let drivingV = pathway.driving_variables && pathway.driving_variables.length > 0?
          getVariableLongName(pathway.driving_variables[0]) : '';

      let vizurl = '';
      if(responseV == "Crop Production") {
        vizurl = 'https://dev.viz.mint.isi.edu/economic?thread_id=' + pathway.id
      }
      else if(responseV == "Potential Crop Production") {
        vizurl = 'https://dev.viz.mint.isi.edu/cycles?thread_id=' + pathway.id
      }

      return html`
        ${task ? html `
        <div class="main-content">
          <wl-title level="2" class="two-column-grid" style="padding: 0px;">
            <span>Task:</span>
            <span>${task.name}</span>
          </wl-title>

          <wl-title level="3">Variables:</wl-title>
          <div class="two-column-grid inner-content">
            <wl-title level="4">Indicators:</wl-title>
            <span>
              ${!task.response_variables || task.response_variables.length == 0 ?
                'No indicators' : task.response_variables.map((rv) => html`
                <div>${getVariableLongName(rv)} (<span class="monospaced">${rv}</span>)</div>`)}
            </span>
            <wl-title level="4">Adjustable variables:</wl-title>
            <span>
              ${!task.driving_variables || task.driving_variables.length == 0 ?
              'No adjustable variables' : task.driving_variables.map((dv) => html`
                <div>${getVariableLongName(dv)} (<span class="monospaced">${dv}</span>)</div>`)}
            </span>
            <wl-title level="4">Notes:</wl-title>
            <span class="notes" style="margin-top: 2px;">
              ${pathway && pathway.notes && pathway.notes.variables ? pathway && pathway.notes && pathway.notes.variables : 'No notes'}
            </span>
          </div>

          ${pathway ? html`
          <wl-title level="3">Models:</wl-title>
          <div class="inner-content">
            ${!pathway.models || Object.keys(pathway.models).length == 0 ?
            'No models' :
            Object.values(pathway.models).map((model) => model.name)}
            <div class="notes">
              Notes:
              <span>${pathway.notes && pathway.notes.models ? pathway.notes.models : 'No notes'}</span>
            </div>
          </div>

          <wl-title level="3">Datasets:</wl-title>
          <div class="inner-content">
            ${!pathway.datasets || Object.keys(pathway.datasets).length == 0 ?
            'No datasets' :
            Object.values(pathway.datasets).map((dataset) => dataset.name)}
            <div class="notes">
              Notes:
              <span>${pathway.notes && pathway.notes.models ? pathway.notes.models : 'No notes'}</span>
            </div>
          </div>

          <wl-title level="3">Setup:</wl-title>
          <div class="inner-content">
            ${!pathway.model_ensembles || Object.keys(pathway.model_ensembles).length == 0 ?
            'No adjustable variables for this model' : html`
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
                ${Object.values(pathway.model_ensembles).map((ens) => Object.keys(ens).map((key) => html`
                <tr>
                  <td>${key.split('/').pop()}</td>
                  <td>${ens[key].join(', ')}</td>
                </tr>
                `))}
              </tbody>
            </table>
            `}
            <div class="notes">
              Notes:
              <span>${pathway.notes && pathway.notes.parameters ? pathway.notes.parameters : 'No notes'}</span>
            </div>
          </div>

          <wl-title level="3">Model runs and Results:</wl-title>
          <div class="inner-content">
            ${!pathway.executable_ensemble_summary || Object.keys(pathway.executable_ensemble_summary).length == 0 ? 
            'No information about this run' : Object.values(pathway.executable_ensemble_summary).map(execSum => html`
            The model setup created ${execSum.total_runs} configurations.
            ${execSum.submitted_runs} model runs were submitted,
            out of which ${execSum.successful_runs} succeeded, 
            and ${execSum.failed_runs} failed.
            `)}
          </div>

          <wl-title level="3">Thread visualizations:</wl-title>
          <div class="inner-content">
            <div class="notes">
              Notes:
              <span>${pathway.notes && pathway.notes.visualization ? pathway.notes.visualization : 'No notes'}</span>
            </div>

          ${!vizurl || !pathway.executable_ensemble_summary || Object.keys(pathway.executable_ensemble_summary).length == 0 ? 
            'No visualizations for this run' : 
            html `<iframe src="${vizurl}"></iframe>`
          }
          </div>
          
          `
          :''}
          <div style="height: 200px;"/>`
          :''}
          ${this._loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : '' }
        </div>`

    } else if (!this._selectedScenarioId && !this._selectedTaskId && !this._selectedPathwayId)  {
      return html`
        <span id="start"></span>
        ${Object.values(this._scenarios).map((scenario:any) => html`
        <wl-title level="3" style="margin: 12px 0px 0px 12px">${scenario.name}</wl-title>
          ${scenario.tasks.map((taskid) => this._tasks[taskid]).map((task) => html`
            <wl-list-item class="active" @click="${() => {
              this._scrollUp();
              goToPage(PREFIX_REPORT + scenario.id + '/' + task.id + '/' + Object.keys(task.pathways)[0]);
            }}">
                <wl-title level="4" style="margin: 0">
                  ${task.name}
                </wl-title>
                ${this._getSubgoalSummaryText(task)}
                <div slot="after" style="display:flex">
                  ${this._renderDates(task, scenario)}
                </div>
            </wl-list-item>

          `)}
        `)}
        ${this._loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : '' }`
    } else {
      return html`
        <p>
        This page is in progress, it will give you the ability to prepare reports with findings backed up with visualisations and
        analysis details
        </p>
      `
    }
  }

  _scrollUp () {
    let el = this.shadowRoot.getElementById('start');
    if (el) {
      el.scrollIntoView({behavior: "smooth", block: "start"})
    }
  }

  _getSubgoalSummaryText(subgoal) {
    let response = subgoal.response_variables ? getVariableLongName(subgoal.response_variables[0]) : "";
    let subregionid = (subgoal.subregionid && subgoal.subregionid != "Select") ? subgoal.subregionid : null;
    let regionname = subregionid && this._subRegions && this._subRegions[subregionid] ? this._subRegions[subregionid].name : this._region.name;
    return (response ? response + ": " : "") + regionname
  }

  _renderDates (subgoal, scenario) {
    let dates = subgoal.dates ? subgoal.dates : scenario.dates;
    let startdate = fromTimeStampToDateString(dates!.start_date);
    let enddate = fromTimeStampToDateString(dates!.end_date);
    return startdate + " - " + enddate;
  }

  // checking executable_ensemble_summary
  protected async firstUpdated() {    
    this._loading = true;
    await db.collectionGroup("pathways").get().then((snapshot) => {
      snapshot.forEach((pathway) => {
        let execSumRaw = pathway.get('executable_ensemble_summary')
        let execSum = execSumRaw ? Object.values(execSumRaw) : [];
        if (execSum.length > 0 && execSum[0]['total_runs'] > 0 && execSum[0]['successful_runs'] + execSum[0]['failed_runs'] == execSum[0]['total_runs']) {
          this._pathways[pathway.get('id')] = pathway.data();
        }
      });
    })

    await db.collection("scenarios").where('regionid', '==', this._regionid).get().then((querySnapshot) => {
      querySnapshot.forEach((scenario) => {
        let sid = scenario.get('id');
        scenario.ref.collection('subgoals').get().then((qsnap) => {
          qsnap.forEach((task) => {
            let pathways = Object.keys(task.get('pathways') || {});
            pathways.forEach(pathway => {
              if (this._pathways[pathway]) {
                if (!this._scenarios[sid]) {
                  this._scenarios[sid] = scenario.data();
                  this._scenarios[sid].tasks = [];
                }
                this._scenarios[sid].tasks.push(task.ref.id);
                this._tasks[task.ref.id] = task.data();
                this._tasks[task.ref.id].id = task.ref.id;
              }
            });
          });
        }).then(() => {
          //FIXME 
          this._loading = true;
          this._loading = false;
        })

      })
    });

    log(this._scenarios, this._tasks, this._pathways);
    //this._loading = false;
  }

  stateChanged(state: RootState) {
    /* This could stay active when moving to another page for links, so autoupdate active property */
    super.setSubPage(state);
    this.active = (this._subpage === 'report');
    super.setRegionId(state);

    if (state.ui) {
      this._selectedScenarioId = state.ui.selected_scenarioid;
      this._selectedTaskId = state.ui.selected_subgoalid;
      this._selectedPathwayId = state.ui.selected_pathwayid;

      if (state.ui.selected_top_regionid && state.regions!.regions) {
        if (!state.regions!.query_result || !state.regions!.query_result[state.ui.selected_top_regionid]) {
          store.dispatch(queryRegions(state.ui.selected_top_regionid));
        } else {
          this._subRegions = state.regions!.query_result[state.ui.selected_top_regionid]["*"];
        }
      }
    }
  }

}

/* vim: set ts=2 sw=2 sts=2 tw=160 cc=160 : */
