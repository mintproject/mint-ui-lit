import { customElement, css, html, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { updatePathway } from "../actions";
import { renderNotifications } from "../../../util/ui_renders";
import { showNotification } from "../../../util/ui_functions";
import { ExecutableEnsemble, Goal, SubGoal, DataEnsembleMap, Visualization } from "../reducers";
import { getUISelectedSubgoal, getUISelectedGoal, getVisualizationURLs } from "../../../util/state_functions";
import { MintPathwayPage } from "./mint-pathway-page";
import { getVariableLongName } from "../../../offline_data/variable_list";

import "weightless/button";

@customElement('mint-visualize')
export class MintVisualize extends connect(store)(MintPathwayPage) {
    @property({type: Object})
    private _goal!: Goal;

    @property({type: Object})
    private _subgoal!: SubGoal;

    @property({type: String})
    private _bigViz : boolean = false;

    @property({type: Object})
    private _lastLinks : string[] = [];

    static get styles() {
        return [
          SharedStyles,
          css`
          h1, h2, h3 {
              margin: 4px;
          }

          iframe {
              width:100%;
              border: 0px solid black;
              height: 70vh;
          }

          #notes {
              border: 0px;
              resize: none;
          }
          `
        ]
    }
    
    protected render() {
        if(!this.pathway) {
            return html ``;
        }
        let vizurls = getVisualizationURLs(this.pathway, this._subgoal, this.scenario, this.prefs.mint)
        let responseV = this.pathway.response_variables.length > 0?
            getVariableLongName(this.pathway.response_variables[0]) : '';

        if (this._lastLinks.length != vizurls.length ||
            this._lastLinks.some((vizurl:string, i:number) => vizurl != vizurls[i])) {
            this._lastLinks = vizurls;
            this._bigViz = (responseV == "Flooding Contour");
        }
        
        return html`
        <style>
        i {
            display: block;
            margin: 10px 0px;
            color: #999;
        }
        </style>
        ${(vizurls)? html`
            <h2>Visualization
                ${responseV? 'of indicator ' + responseV : ''}
            </h2>
            ${this._bigViz ? html`
            <div style="display: table; height: 30px;">
                <wl-icon style="line-height: 30px">report</wl-icon>
                <span style="display: table-cell; vertical-align: middle;">This visualization can take a while to load.</span>
            </div>
            <wl-button @click="${() => {this._bigViz = !this._bigViz}}">Load Visualization</wl-button>` 
            : vizurls.map((vizurl) => html`<iframe src="${vizurl}"></iframe>`)
            }

            <fieldset class="notes">
                <legend>Notes</legend>
                <textarea id="notes">${this.pathway.notes ? this.pathway.notes.visualization : ""}</textarea>
            </fieldset>
            <div class="footer">
                <wl-button type="button" class="submit" @click="${this._saveNotes}">Save</wl-button>
            </div>
            ${renderNotifications()}
            <br/>
            <details>
                <summary>Summary of models explored to generate visualizations</summary>
                ${this._renderSummary()}
            </details>
        ` : html`
            ${this._renderSummary()}
        `}
        `;
    }

    _saveNotes () {
        let newpathway = { ...this.pathway };
        let notes = (this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement).value;
        newpathway.notes = {
            ...newpathway.notes!,
            visualization: notes
        };
        updatePathway(this.scenario, newpathway); 
        showNotification("saveNotification", this.shadowRoot!);
    }

    _renderSummary () {
        if(!this._subgoal) {
            return "";
        }
        
        return html`
        <h2>${this.scenario.name}</h2>
        <div class="clt">
            <ul>
                <li>
                    <h2>Task: ${this._subgoal.name}</h3>
                    <ul>
                        <li>
                            Variables:
                            <ul>
                                <li>Response: 
                                    ${this.pathway.response_variables.map((v)=>
                                        getVariableLongName(v) + " (" + v + ")").join(", ")}
                                </li>
                                <li>Driving: 
                                    ${this.pathway.driving_variables.map((v)=>
                                        getVariableLongName(v) + " (" + v + ")").join(", ")}
                                </li>
                            </ul>
                            <i>Notes: ${this.pathway.notes!.variables}</i>
                        </li>
                        <li>
                            Models:
                            <ul>
                                ${Object.keys(this.pathway.models!).map((modelid: string) => {
                                    let model = this.pathway.models![modelid];
                                    return html`
                                    <li>${model.name}</li>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${this.pathway.notes!.models}</i>
                        </li>
                        <li>
                            Datasets:
                            <ul>
                                ${Object.keys(this.pathway.model_ensembles!).map((modelid) => {
                                    let model_ensemble = this.pathway.model_ensembles![modelid] as DataEnsembleMap;
                                    let model = this.pathway.models![modelid];
                                    return html`
                                    Datasets for model : ${model.name}
                                    <ul>
                                        ${model.input_files.filter((input) => !input.value).map((io) => {
                                            let bindings = model_ensemble[io.id!];
                                            let blist = bindings.map((binding) => {
                                                let ds = this.pathway.datasets![binding];
                                                return ds.name;
                                            }).join(", ");

                                            return html`
                                                <li>${io.name} = ${blist}</li>
                                            `;
                                        })}
                                    </ul>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${this.pathway.notes!.datasets}</i>
                        </li>
                        <li>
                            Setup:
                            <ul>
                                ${Object.keys(this.pathway.model_ensembles!).map((modelid) => {
                                    let model_ensemble = this.pathway.model_ensembles![modelid] as DataEnsembleMap;
                                    let model = this.pathway.models![modelid];
                                    return html`
                                    Adjustment Variables for model : ${model.name}
                                    <ul>
                                        ${model.input_parameters.filter((input) => !input.value).map((io) => {
                                            let bindings = model_ensemble[io.id!];
                                            if(bindings) {
                                                let blist = bindings.join(", ");
                                                return html`
                                                    <li>${io.name} = ${blist}</li>
                                                `;
                                            }
                                        })}
                                    </ul>
                                    `;
                                })}
                            </ul>
                            <i>Notes: ${this.pathway.notes!.parameters}</i>
                        </li>
                        <li>
                            Model Runs and Results:
                            <ul>
                                ${Object.keys(this.pathway.executable_ensemble_summary).map((modelid: string) => {
                                    let model = this.pathway.models[modelid];
                                    let summary = this.pathway.executable_ensemble_summary[modelid];
                                    return html`
                                    <li>
                                        The model setup created ${summary.total_runs} configurations. 
                                        ${summary.submitted_runs} model runs were submitted, out of which 
                                        ${summary.successful_runs} succeeded, and ${summary.failed_runs} failed.
                                    </li>
                                    `
                                })}
                            </ul>
                            <i>Notes: ${this.pathway.notes!.results}</i>
                        </li> 
                    </ul>
                </li>
            </ul>
        </div>
        `
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setPathway(state);
        this._subgoal = getUISelectedSubgoal(state)!;
        if(this._subgoal)
            this._goal = getUISelectedGoal(state, this._subgoal)!;
    }
}
