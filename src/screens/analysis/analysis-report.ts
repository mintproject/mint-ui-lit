import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { store } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { IdMap } from 'app/reducers';
import { Scenario, ScenarioList } from 'screens/modeling/reducers';

import { listScenarios } from 'screens/modeling/actions';
import { db } from '../../config/firebase';

function log () {console.log('REPORT:', ...arguments)}

const PREFIX_REPORT = 'analysis/report/';

@customElement('analysis-report')
export class AnalysisReport extends connect(store)(PageViewElement) {
  @property({type: Boolean})
  private _loading = false;

  @property({type: Object}) // for dirty check
  private _allScenarios: ScenarioList | null = null;

  @property({type: Object})
  private _list: Scenario[] = [];

  private _validPathways = [];

  static get styles() {
    return [SharedStyles, css`
      .cltrow wl-button {
        padding: 2px;
      }
    `];
  }
  protected _region: Region;
  protected _regionid: string;
  protected _subpage: string = '';

  protected render() {
    log('RENDER <----')
    return html`
      ${this._loading ? html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
      :html`${this._validPathways.map((obj) => html`
      <div style="border: 2px solid purple; margin-bottom: 10px;" 
        @click="${() => {goToPage(PREFIX_REPORT + obj.scenarioid + '/' + obj.subgoalid + '/' + obj.pathwayid)}}">
        <b>${obj.scenario.name}</b> <br/> ${obj.subgoal.name}
      </div>
      `)}`}
      <p>
      This page is in progress, it will give you the ability to prepare reports with findings backed up with visualisations and
      analysis details
      </p>
      Region ID: ${this._regionid}, <br/>
      Region: ${this._region}, <br/>
      SubPage: ${this._subpage}, <br/>
      LIST: ${this._list}
      `
  }

  // checking executable_ensemble_summary (EXISTS:18 | TOTAL:26)
  protected async firstUpdated() {    
    this._loading = true;
    let validPathways = [];
    await db.collectionGroup("pathways").get().then((snapshot) => {
      snapshot.forEach((doc) => {
        let execSum = doc.get('executable_ensemble_summary')
        let nKeys = execSum ? Object.keys(execSum).length : 0;
        if (nKeys > 0) {
          validPathways.push(doc.get('id'));
        }
      });
    })

    await db.collection("scenarios").where('regionid', '==', this._regionid).get().then((querySnapshot) => {
      querySnapshot.forEach((sdoc) => {
        let sid = sdoc.get('id');
        sdoc.ref.collection('subgoals').get().then((qsnap) => {
          qsnap.forEach((gdoc) => {
            let gid = gdoc.ref.id
            let pathways = gdoc.get('pathways');
            let pids = Object.keys(pathways || {});
            pids.forEach(pathway => {
              if (validPathways.indexOf(pathway) > 0) {
                this._validPathways.push({
                  scenarioid: sid,
                  subgoalid: gid,
                  pathwayid: pathway,
                  subgoal: gdoc.data(),
                  scenario: sdoc.data()
                });
              }
            });
          });
        });
      })
    });

    log(this._validPathways);
    this._loading = false;
  }

  stateChanged(state: RootState) {
    /* This could stay active when moving to another page for links, so autoupdate active property */
    super.setSubPage(state);
    this.active = (this._subpage === 'report');
    super.setRegionId(state);

    /*if (state.modeling) {
      if (state.modeling.scenarios && state.modeling.scenarios.scenarios && state.modeling.scenarios.scenarios != this._allScenarios) {
        this._allScenarios = state.modeling.scenarios.scenarios;
        this._list = Object.values(this._allScenarios).filter(scenario => state.modeling.scenarios.scenarios[scenario.id].regionid === this._regionid);
        log('set LIST', this._list);
      }
    }*/

  }
}

/* vim: set ts=2 sw=2 sts=2 tw=160 cc=160 : */
