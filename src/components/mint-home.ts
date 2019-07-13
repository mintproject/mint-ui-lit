/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html, customElement, property, css } from 'lit-element';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../store';

// Actions needed by this element
import { listScenarios, addScenario, listRegions } from '../actions/mint';

import mint, { ScenarioList, Scenario, RegionList } from '../reducers/mint';
import ui from '../reducers/ui';

store.addReducers({
  mint,
  ui
});

import "weightless/list-item";
import "weightless/button";
import "weightless/icon";
import "weightless/nav";
import "weightless/title";
//import "weightless/progress-bar";
import "weightless/dialog";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import "./stats-blurb";
import "../thirdparty/google-map/src/google-map";
import "./google-map-json-layer";
import { navigate, BASE_HREF } from '../actions/app.js';
import { PageViewElement } from './page-view-element.js';
import { renderNotifications } from '../util/ui_renders';
import { formElementsComplete, showDialog, hideDialog, showNotification, resetForm } from '../util/ui_functions';
import { GOOGLE_API_KEY } from '../config/google-api-key';

@customElement('mint-home')
export class MintHome extends connect(store)(PageViewElement) {
  @property({type: Object})
  private _regions!: RegionList;

  @property({type: Object})
  private _list!: ScenarioList;

  @property({type:Array})
  private _mapStyles = '[{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"gamma":2.15},{"lightness":12}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"visibility":"on"},{"lightness":24}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]}]';

  @property({type: Object})
  private _data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [{
        label: 'Datasets',
        backgroundColor: 'rgba(25, 144, 213, 0.4)',
        borderColor: 'rgba(25, 144, 213, 0.5)',
        data: [0, 10, 5, 2, 20, 30, 45]
    }]
  };

  static get styles() {
    return [
      SharedStyles,
      css`
        .topstats {
          display: none;
          justify-content: space-between;
          background: #FFFFFF;
          width: calc(100% - 30px);
          margin: 15px;
        }

        .topstats stats-blurb {
          padding-right: 50px;
          padding-left: 20px;
          margin-top: 20px;
          margin-bottom: 20px;
          border-left: 1px solid #DDDDDD;
        }

        .topstats stats-blurb:first-child {
          border-left: 0px;
        }

        .caption {
          font-size: 12px;
        }

        .middle {
          background: #FFFFFF;
          width: 100%;
          /*
          width: calc(100% - 50px);
          padding: 10px;
          margin: 15px; 
          */
        }

        .middle2 {
          display: none;
          border: 1px solid #F0F0F0;
        }

        .middle2.active {
          display: flex;
          top: 75px;
          bottom: 25px;
          right: 25px;
          left: 25px;
          position: absolute;
        }

        .middle2 .middle2main {
          height: 100%;
          width: 70%;
        }

        .middle2 .middle2list {
          width: 30%;
          height: 100%;
          border-right: 1px solid #F0F0F0;
          overflow: auto;
        }

        .actionIcon {
          color: #304a91;
          margin-right: 10px;
        }

        wl-tab {
          --tab-padding: 10px 30px 10px 5px;
          --tab-bg-active: transparent;
        }
        
      `
    ];
  }

  protected render() {
    //console.log("rendering");
    return html`

    <div class="card">
      <div class="topstats">
        <stats-blurb icon="terrain" text="Scenarios" value="8" change=3 color="#629b30"></stats-blurb>
        <stats-blurb icon="description" text="Datasets" value="2,554" change=20 color="#f1951b"></stats-blurb>
        <stats-blurb icon="extension" text="Models" value="123" change=-2 color="#42b7ff"></stats-blurb>
        <stats-blurb icon="settings" text="Runs" value="45" change=21 color="#06436c"></stats-blurb>
      </div>

      <div class="middle">
        <div class="middle2 active" id="scenariosTab">

          <div class="middle2list">
            <div class="cltrow_padded scenariorow">
              <div class="cltmain">
                  <wl-title level="3" style="margin: 0px">SCENARIOS</wl-title>
              </div>
              <wl-icon @click="${this._addScenarioDialog}" 
                class="actionIcon" id="addScenarioIcon" 
                style="font-size:20px;width:20px">note_add</wl-icon>
            </div>          
            <!-- Show Scenario List -->
            ${this._list && this._list.scenarioids.map((scenarioid) => {
              let scenario = this._list.scenarios[scenarioid];
              let region = this._regions[scenario.regionid];
              return html`
              <wl-list-item class="active"
                  @click="${this._selectScenario}"
                  data-index="${scenario.id}">
                  <wl-title level="4" style="margin: 0">${scenario.name}</wl-title>
                  <wl-title level="5">${region.name}</wl-title>
                  <span>Dates: ${scenario.dates.start_date} to ${scenario.dates.end_date}</span>
                  <!--wl-progress-bar mode="determinate" value="${Math.random()}"></wl-progress-bar-->
              </wl-list-item>
              `
            })}
          </div>

          <google-map class="middle2main" api-key="${GOOGLE_API_KEY}" 
            latitude="5" longitude="40" zoom="4" disable-default-ui
            styles="${this._mapStyles}">
            ${this._list && Object.keys(this._regions || {}).map((regionid) => {
              let region = this._regions![regionid];
              return html`
              <google-map-json-layer url="${region.geojson}"></google-map-json-layer>
              `;
            })}
          </google-map>        
        </div>

        <div class="middle2" id="datasetsTab">
          <base-chart class="middle2main" type="line" .data="${this._data}" .options="{}"></base-chart>
          <div class="middle2list">
            <wl-list-item>
              <wl-title level="4" style="margin: 0">FLDAS-Dataset-1</wl-title>
            </wl-list-item>
            <wl-list-item>
              <wl-title level="4" style="margin: 0">FLDAS-Dataset-2</wl-title>
            </wl-list-item>
            <wl-list-item>
              <wl-title level="4" style="margin: 0">FLDAS-Dataset-3</wl-title>
            </wl-list-item>
            <wl-list-item>
              <wl-title level="4" style="margin: 0">FLDAS-Dataset-4</wl-title>
            </wl-list-item>
          </div>
        </div>
        
      </div>
    </div>
    
    ${this._renderTooltips()}

    ${renderNotifications()}
    
    ${this._renderDialogs()}
    `
  }

  _renderTooltips() {
    return html`
    <wl-tooltip anchor="#addScenarioIcon" 
      .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
      anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
      Add a Scenario
    </wl-tooltip>
    `
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="scenarioDialog" fixed backdrop blockscrolling>
      <h3 slot="header">What is your scenario ?</h3>
      <div slot="content">
        <form id="scenarioForm">
          <p>
            Please enter a short text to describe the scenario that you would like to investigate
          </p>
          <div class="input_full">
            <input name="scenario_name"></input>
          </div>
          
          <div style="height:10px;">&nbsp;</div>

          <div class="formRow">
            <div class="input_half">
              <label>Region</label>
              <select name="scenario_region">
                <option value disabled selected>Select</option>
                ${this._list && Object.keys(this._regions || {}).map((regionid) => {
                  let region = this._regions![regionid];
                  return html`
                    <option value="${region.id}">${region.name}</option>
                  `;
                })}
              </select>
            </div>
            <div class="input_half">
              <label>Sub-Region</label>
              <select name="scenario_subregion">
                <option value disabled selected>Select</option>
                <option value="pongo_basin">Pongo Basin</option>
                <option value="gel_aliab">Gel-Aliab</option>
              </select>
            </div>            
          </div>

          <div style="height:20px;">&nbsp;</div>

          <div class="input_full">
            <label>Time Period</label>
          </div>
          <div class="formRow">
            <div class="input_half">
              <input name="scenario_from" type="date"></input>
            </div>
            to
            <div class="input_half">
              <input name="scenario_to" type="date"></input>
            </div>
          </div>
        </form>
      </div>
      <div slot="footer">
          <wl-button @click="${this._onAddScenarioCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onAddScenarioSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
  }

  _addScenarioDialog() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#scenarioForm")!;
    resetForm(form);

    showDialog("scenarioDialog", this.shadowRoot!);
  }

  _onAddScenarioSubmit() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#scenarioForm")!;
    if(formElementsComplete(form, ["scenario_name", "scenario_region", "scenario_from", "scenario_to"])) {
        let scenario_name = (form.elements["scenario_name"] as HTMLInputElement).value;
        let scenario_region = (form.elements["scenario_region"] as HTMLSelectElement).value;
        let scenario_from = (form.elements["scenario_from"] as HTMLInputElement).value;
        let scenario_to = (form.elements["scenario_to"] as HTMLInputElement).value;

        let scenario = {
          name: scenario_name,
          regionid: scenario_region,
          dates: {
            start_date: scenario_from,
            end_date: scenario_to
          }
        } as Scenario;        

        let scenarioid = addScenario(scenario);

        hideDialog("scenarioDialog", this.shadowRoot!);
        showNotification("saveNotification", this.shadowRoot!);
    
        let path = BASE_HREF+"scenario/"+scenarioid;
        window.history.pushState({}, "MINT", path);
        store.dispatch(navigate(decodeURIComponent(path)));

    }
    else {
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }    
  }

  _onAddScenarioCancel() {
    hideDialog("scenarioDialog", this.shadowRoot!);
  }

  _showScenarios() {
    console.log('here');
    var item = this.shadowRoot!.getElementById("scenariosTab");
    var item2 = this.shadowRoot!.getElementById("datasetsTab");
    item!.className = "middle2 active";
    item2!.className = "middle2";
  }

  _showDatasets() {
    var item = this.shadowRoot!.getElementById("scenariosTab");
    var item2 = this.shadowRoot!.getElementById("datasetsTab");
    item!.className = "middle2";
    item2!.className = "middle2 active";
  }

  _removeScenario(e: Event) {
    console.log(e);
    /*
    let scenarioId = (e.currentTarget as HTMLButtonElement).dataset['index']+"";
    store.dispatch(removeScenario(scenarioId));
    if(this._selectedId == scenarioId) {
      store.dispatch(selectScenario(null));
    }
    */
  }

  _selectScenario(e: Event) {
    let selectedScenarioId = (e.currentTarget as HTMLButtonElement).dataset['index']+"";    
    window.history.pushState({}, "Scenario", BASE_HREF + "scenario/" + selectedScenarioId);
    store.dispatch(navigate(decodeURIComponent(location.pathname)));
  }

  protected firstUpdated() {    
    store.dispatch(listRegions());
    store.dispatch(listScenarios());
    // list summaries of datasets, models, etc
  }

  // This is called every time something is updated in the store.
  stateChanged(state: RootState) {
    //console.log(state);
    if(state.mint) {
      if(state.mint.scenarios && state.mint.regions) {
        this._list = state.mint.scenarios;
        this._regions = state.mint.regions;
      }
    }
  }
}
