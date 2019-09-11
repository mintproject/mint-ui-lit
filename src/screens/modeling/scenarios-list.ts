import { html, customElement, property, css } from 'lit-element';

import { SharedStyles } from '../../styles/shared-styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../app/store';

import { listScenarios, addScenario } from './actions';
import { ScenarioList, Scenario } from './reducers';

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

import "./mint-scenario";

import { navigate, BASE_HREF, goToPage } from '../../app/actions';
import { PageViewElement } from '../../components/page-view-element';
import { renderNotifications } from '../../util/ui_renders';
import { formElementsComplete, showDialog, hideDialog, showNotification, resetForm } from '../../util/ui_functions';
import { listTopRegions } from '../regions/actions';
import { RegionList } from '../regions/reducers';
import { toTimeStamp } from 'util/date-utils';

@customElement('scenarios-list')
export class ScenariosList extends connect(store)(PageViewElement) {
  @property({type: Object})
  private _regions!: RegionList;

  @property({type: Object})
  private _list!: ScenarioList;

  @property({type: String})
  private _top_regionid?: string;

  static get styles() {
    return [
      SharedStyles,
      css`
      `
    ];
  }

  protected render() {
    //console.log("rendering");
    return html`

    <div class="cltrow scenariorow">
        <div class="cltmain">
            <wl-title level="3" style="margin: 0px">Use Models</wl-title>
        </div>
        <wl-icon @click="${this._addScenarioDialog}" 
        class="actionIcon bigActionIcon" id="addScenarioIcon">note_add</wl-icon>
    </div>
    <!-- Show Scenario List -->
    ${this._list && this._list.scenarioids.map((scenarioid) => {
        let scenario = this._list.scenarios[scenarioid];
        let region = this._regions[scenario.regionid];
        if(region.id == this._top_regionid) {
          return html`
          <wl-list-item class="active"
              @click="${this._onSelectScenario}"
              data-index="${scenario.id}">
              <wl-title level="4" style="margin: 0">${scenario.name}</wl-title>
              <wl-title level="5">${region.name}</wl-title>
              <span>Dates: ${scenario.dates.start_date} to ${scenario.dates.end_date}</span>
          </wl-list-item>
          `
        }
        return html``;
    })}
    
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
            start_date: toTimeStamp(scenario_from),
            end_date: toTimeStamp(scenario_to)
          }
        } as Scenario;        

        let scenarioid = addScenario(scenario);

        hideDialog("scenarioDialog", this.shadowRoot!);
        showNotification("saveNotification", this.shadowRoot!);
    
        goToPage("modeling/scenario/"+scenarioid);

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

  _onSelectScenario(e: Event) {
    let selectedScenarioId = (e.currentTarget as HTMLButtonElement).dataset['index']+"";    
    this._selectScenario(selectedScenarioId);
  }

  _selectScenario(scenarioid: string) {
    goToPage("modeling/scenario/" + scenarioid);
  }

  protected firstUpdated() {    
    //store.dispatch(listTopRegions()); done by mint-app
    store.dispatch(listScenarios());
    // list summaries of datasets, models, etc
  }

  // This is called every time something is updated in the store.
  stateChanged(state: RootState) {
    //console.log(state);
    if(state.modeling) {
      if(state.modeling.scenarios && state.regions!.regions) {
        this._list = state.modeling.scenarios;
        this._regions = state.regions!.regions;
      }
    }
    if(state.ui && state.ui.selected_top_regionid) {
      this._top_regionid = state.ui.selected_top_regionid;
    }
    super.setRegionId(state);
  }
}
