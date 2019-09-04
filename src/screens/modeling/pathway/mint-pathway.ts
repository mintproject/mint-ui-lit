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

import { getPathwayVariablesStatus, TASK_NOT_STARTED, getPathwayModelsStatus, 
    getPathwayDatasetsStatus, getPathwayRunsStatus, getPathwayResultsStatus, 
    TASK_DONE, TASK_PARTLY_DONE, 
    getUISelectedSubgoal, getPathwayParametersStatus } from "../../../util/state_functions";
import { SubGoal } from "../reducers";
import { BASE_HREF } from "../../../app/actions";
import { MintPathwayPage } from "./mint-pathway-page";

@customElement('mint-pathway')
export class MintPathway extends connect(store)(MintPathwayPage) {
    @property({type: Object })
    private subgoal: SubGoal | null = null;

    @property({ type: String })
    private _currentMode: string = "";

    static get styles() {
        return [
          SharedStyles,
          css`

          .breadcrumbs li.active, .breadcrumbs li.done.active {
            background-color: #0f7acf;
            color: white;
          }
          .breadcrumbs li.active:before, .breadcrumbs li.done.active:before {
            border-color: #0f7acf;
            border-left-color: transparent;
          }
          .breadcrumbs li.active:after, .breadcrumbs li.done.active:after {
            border-left-color: #0f7acf;
          }

          .breadcrumbs li.done {
            background-color: #06436c;
            color: white;
          }
          .breadcrumbs li.done:before {
            border-color: #06436c;
            border-left-color: transparent;
          }
          .breadcrumbs li.done:after {
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
            height: calc(100% - 62px);
            overflow: auto;
            background: #FFFFFF;
        }
        `
        ];
    }

    private _renderProgressBar() {
        return html`
            <ul class="breadcrumbs">
                <li id="variables_breadcrumb" 
                    class="${this._getBreadcrumbClass('variables')}" 
                    @click="${() => { this._selectMode('variables') }}">Variables</li>
                <li id="models_breadcrumb" 
                    class="${this._getBreadcrumbClass('models')}" 
                    @click="${() => { this._selectMode('models') }}">Models</li>
                <li id="datasets_breadcrumb" 
                    class="${this._getBreadcrumbClass('datasets')}" 
                    @click="${() => { this._selectMode('datasets') }}">Datasets</li>
                <li id="parameters_breadcrumb" 
                    class="${this._getBreadcrumbClass('parameters')}" 
                    @click="${() => { this._selectMode('parameters') }}">Setup</li>
                <li id="runs_breadcrumb" 
                    class="${this._getBreadcrumbClass('runs')}" 
                    @click="${() => { this._selectMode('runs') }}">Runs</li>
                <li id="results_breadcrumb" 
                    class="${this._getBreadcrumbClass('results')}" 
                    @click="${() => { this._selectMode('results') }}">Results</li>
                <li id="visualize_breadcrumb" 
                    class="${this._getBreadcrumbClass('visualize')}" 
                    @click="${() => { this._selectMode('visualize') }}">Visualize</li>
            </ul>
        `;
    }

    private _getSectionStatus(section:string) {
        let status = TASK_NOT_STARTED;
        switch(section) {
            case "variables":
                status = getPathwayVariablesStatus(this.pathway);
                break;
            case "models":
                status = getPathwayModelsStatus(this.pathway);
                break;
            case "datasets":
                status = getPathwayDatasetsStatus(this.pathway);
                break;
            case "parameters":
                status = getPathwayParametersStatus(this.pathway);
                break;
            case "runs":
                status = getPathwayRunsStatus(this.pathway);
                break;
            case "results":
                status = getPathwayResultsStatus(this.pathway);
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
        if(this.subgoal) {
          let page = this._regionid + "/modeling/scenario/" + 
                this.scenario.id + "/" + this.subgoal!.id + "/" + this.pathway.id + "/" + mode;
          window.history.pushState({}, mode, BASE_HREF + page);
        }
    }

    protected render() {
        if (!this.pathway) {
            return html``;
        }

        return html`
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <wl-title level="4">${this.subgoal ? this.subgoal.name : ""}</wl-title>
            </div>
            ${this._renderProgressBar()}

            <div class="card2">
                <mint-variables class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'variables'}">
                </mint-variables>
                <mint-models class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'models'}">
                </mint-models>
                <mint-datasets class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'datasets'}">
                </mint-datasets>
                <mint-parameters class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'parameters'}">
                </mint-parameters>
                <mint-runs class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'runs'}">
                </mint-runs>
                <mint-results class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'results'}">
                </mint-results>
                <mint-visualize class="page" 
                    .scenario="${this.scenario}"
                    ?active="${this._currentMode == 'visualize'}">
                </mint-visualize>
            </div>
        `;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if(super.setPathway(state)) {
            // If pathway changed
            console.log("mint-pathway: Pathway changed !");
            this._selectMode(this._getNextMode());
            
            //FIXME: Add this back later
            //checkPathwayEnsembleStatus(this.scenario, this.pathway, this.prefs);
        }

        this.subgoal = getUISelectedSubgoal(state);
          
        if(state.ui.selected_pathway_section) {
          //console.log(state.ui.selected_pathway_section);
          this._selectMode(state.ui.selected_pathway_section);
          state.ui.selected_pathway_section = "";
        }
    }
}