import { html, customElement, property, css } from 'lit-element';

import { SharedStyles } from '../../styles/shared-styles';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../app/store';

import { listScenarios, addScenario, deleteScenario, updateScenario } from './actions';
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
import { formElementsComplete, showDialog, hideDialog, showNotification, resetForm, hideNotification } from '../../util/ui_functions';
import { listTopRegions, queryRegions } from '../regions/actions';
import { RegionList, Region } from '../regions/reducers';
import { toTimeStamp, fromTimeStampToDateString } from 'util/date-utils';

@customElement('scenarios-list')
export class ScenariosList extends connect(store)(PageViewElement) {
  @property({type: Object})
  private _top_region: Region;

  @property({type: Object})
  private _regions!: RegionList;

  @property({type: Object})
  private _subRegions!: RegionList;

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
        <wl-button flat inverted disabled>
            <wl-icon>arrow_back_ios</wl-icon>
        </wl-button>
        <div class="cltmain navtop">
            <wl-title level="3">Problem statements</wl-title>
        </div>
        <wl-icon @click="${this._addScenarioDialog}" 
          class="actionIcon bigActionIcon addIcon" id="addScenarioIcon">note_add</wl-icon>
    </div>
    <!-- Show Scenario List -->
    ${this._list && this._list.scenarioids.map((scenarioid) => {
        let scenario = this._list.scenarios[scenarioid];
        let region = this._regions[scenario.regionid];
        if(scenario.regionid == this._top_regionid) {
          return html`
          <wl-list-item class="active"
              @click="${this._onSelectScenario}"
              data-scenarioid="${scenario.id}">
              <wl-title level="4" style="margin: 0">${scenario.name}</wl-title>
              <span>${fromTimeStampToDateString(scenario.dates.start_date)} to 
                ${fromTimeStampToDateString(scenario.dates.end_date)}</span>
              <div slot="after" style="display:flex">
                <wl-icon @click="${this._editScenarioDialog}" data-scenarioid="${scenario.id}"
                    id="editScenarioIcon" class="actionIcon editIcon">edit</wl-icon>
                <wl-icon @click="${this._onDeleteScenario}" data-scenarioid="${scenario.id}"
                    id="delScenarioIcon" class="actionIcon deleteIcon">delete</wl-icon>
              </div>
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
    <wl-tooltip anchor="#editScenarioIcon" 
      .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
      anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
      Edit Scenario 
    </wl-tooltip>
    <wl-tooltip anchor="#delScenarioIcon" 
      .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
      anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
      Delete Scenario
    </wl-tooltip>    
    `
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="scenarioDialog" fixed backdrop blockscrolling>
      <h3 slot="header">What is your Problem statement ?</h3>
      <div slot="content">
        <form id="scenarioForm">
          <p>
            Please enter a short text to describe the overall problem that you would like to investigate
          </p>
          <input type="hidden" name="scenarioid"></input>
          <div class="input_full">
            <input name="scenario_name"></input>
          </div>
          
          <div style="height:10px;">&nbsp;</div>
          <input type="hidden" name="scenario_region" value="${this._top_region.id}"></input>
          <input type="hidden" name="scenario_subregion" value=""></input>

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
          <wl-button @click="${this._onAddEditScenarioCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onAddEditScenarioSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
  }

  _addScenarioDialog() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#scenarioForm")!;
    (form.elements["scenarioid"] as HTMLInputElement).value = "";
    (form.elements["scenario_name"] as HTMLInputElement).value = "";
    (form.elements["scenario_from"] as HTMLInputElement).value = "";
    (form.elements["scenario_to"] as HTMLInputElement).value = "";

    showDialog("scenarioDialog", this.shadowRoot!);
  }

  _onAddEditScenarioSubmit() {
    let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#scenarioForm")!;
    if(formElementsComplete(form, ["scenario_name", "scenario_region", "scenario_from", "scenario_to"])) {
        let scenarioid = (form.elements["scenarioid"] as HTMLInputElement).value;
        let scenario_name = (form.elements["scenario_name"] as HTMLInputElement).value;
        let scenario_region = (form.elements["scenario_region"] as HTMLInputElement).value;
        let scenario_subregion = (form.elements["scenario_subregion"] as HTMLInputElement).value;
        let scenario_from = (form.elements["scenario_from"] as HTMLInputElement).value;
        let scenario_to = (form.elements["scenario_to"] as HTMLInputElement).value;

        let scenario = {
          name: scenario_name,
          regionid: scenario_region,
          subregionid: scenario_subregion,
          dates: {
            start_date: toTimeStamp(scenario_from),
            end_date: toTimeStamp(scenario_to)
          }
        } as Scenario;
        if(scenarioid) {
          scenario.id = scenarioid;
          updateScenario(scenario);
        }
        else {
          scenarioid = addScenario(scenario);
        }

        hideDialog("scenarioDialog", this.shadowRoot!);
        showNotification("saveNotification", this.shadowRoot!);
    
        goToPage("modeling/scenario/"+scenarioid);

    }
    else {
        showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }    
  }

  _onAddEditScenarioCancel() {
    hideDialog("scenarioDialog", this.shadowRoot!);
  }

  _editScenarioDialog(e: Event) {
    let scenarioid = (e.currentTarget as HTMLButtonElement).dataset['scenarioid'];
    if(scenarioid) {
        let scenario = this._list!.scenarios[scenarioid];
        if(scenario) {
            let form = this.shadowRoot!.querySelector<HTMLFormElement>("#scenarioForm")!;
            resetForm(form, null);
            let dates = scenario.dates;
            (form.elements["scenarioid"] as HTMLInputElement).value = scenario.id;
            (form.elements["scenario_name"] as HTMLInputElement).value = scenario.name;
            (form.elements["scenario_region"] as HTMLInputElement).value = scenario.regionid;
            (form.elements["scenario_subregion"] as HTMLInputElement).value = scenario.subregionid;
            (form.elements["scenario_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
            (form.elements["scenario_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
            showDialog("scenarioDialog", this.shadowRoot!);
        }
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  _onDeleteScenario(e: Event) {
    let scenarioid = (e.currentTarget as HTMLButtonElement).dataset['scenarioid'];
    e.stopPropagation();
    e.preventDefault();
    if(scenarioid) {
      let scenario = this._list!.scenarios[scenarioid];
      if(scenario) {
        if(!confirm("Do you want to delete the scenario '" + scenario.name + "' ?"))
            return false;

        showNotification("deleteNotification", this.shadowRoot!);
        // Delete scenario itself. Scenario deletion returns a "Promise"
        deleteScenario(scenario!).then(() => {
          hideNotification("deleteNotification", this.shadowRoot!);
        });
      }
    }
    return false;
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


  _onSelectScenario(e: Event) {
    let selectedScenarioId = (e.currentTarget as HTMLButtonElement).dataset['scenarioid']+"";    
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
      if(state.modeling.scenarios) {
        this._list = state.modeling.scenarios;
      }
    }
    if(state.ui && state.ui.selected_top_regionid && state.regions!.regions) {
      this._top_regionid = state.ui.selected_top_regionid;
      this._regions = state.regions!.regions;
      this._top_region = this._regions[this._top_regionid];

      if(!state.regions!.query_result || !state.regions!.query_result[this._top_regionid]) {
        store.dispatch(queryRegions(this._top_regionid));
      }
      else {
        this._subRegions = state.regions!.query_result[this._top_regionid]["*"];
      }
    }
    super.setRegionId(state);
  }
}
