import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { IdMap } from 'app/reducers';
import { Scenario, ScenarioList } from 'screens/modeling/reducers';

import { fromTimeStampToDateString } from "util/date-utils";
import { getVariableLongName } from "offline_data/variable_list";

import { listScenarios } from 'screens/modeling/actions';
import { RegionList } from "screens/regions/reducers";
import { queryRegions } from 'screens/regions/actions';
import { db } from '../../config/firebase';

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

  static get styles() {
    return [SharedStyles, css`
      .cltrow wl-button {
        padding: 2px;
      }
    `];
  }

  protected render() {
    log('RENDER <----')
    return html`
      ${Object.values(this._scenarios).map((scenario:any) => html`
      <wl-title level="3">${scenario.name}</wl-title>
        ${scenario.tasks.map((taskid) => this._tasks[taskid]).map((task) => html`
          <wl-list-item class="active" @click="${() => {goToPage(PREFIX_REPORT + scenario.id + '/' + task.id + '/' + Object.keys(task.pathways)[0] ) }}">
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

      ${this._loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : '' }

      <!--p>
      This page is in progress, it will give you the ability to prepare reports with findings backed up with visualisations and
      analysis details
      </p-->
      `
  }

  _getSubgoalSummaryText(subgoal) {
    let response = subgoal.response_variables ? getVariableLongName(subgoal.response_variables[0]) : "";
    let subregionid = (subgoal.subregionid && subgoal.subregionid != "Select") ? subgoal.subregionid : null;
    let regionname = subregionid ? this._subRegions[subregionid].name : this._region.name;
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

    if(state.ui && state.ui.selected_top_regionid && state.regions!.regions) {
      if(!state.regions!.query_result || !state.regions!.query_result[state.ui.selected_top_regionid]) {
        store.dispatch(queryRegions(state.ui.selected_top_regionid));
      }
      else {
        this._subRegions = state.regions!.query_result[state.ui.selected_top_regionid]["*"];
      }
    }
  }
}

/* vim: set ts=2 sw=2 sts=2 tw=160 cc=160 : */
