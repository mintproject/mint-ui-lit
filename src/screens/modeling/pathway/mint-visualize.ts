import { customElement, css, html, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { ExecutableEnsemble, Goal, SubGoal } from "../reducers";
import { getUISelectedSubgoal, getUISelectedGoal } from "../../../util/state_functions";
import { MintPathwayPage } from "./mint-pathway-page";

@customElement('mint-visualize')
export class MintVisualize extends connect(store)(MintPathwayPage) {

    @property({type: Object})
    private _goal!: Goal;

    @property({type: Object})
    private _subgoal!: SubGoal;

    static get styles() {
        return [
          SharedStyles,
          css`
          h1, h2, h3 {
              margin: 4px;
          }
          `
        ]
    }
    
    protected render() {
        if(!this.pathway) {
            return html ``;
        }
        
        return html`

        Visualization is still under development. For now, here is a report of the current analysis.
        <h1>${this.scenario.name}</h1>
        <div class="clt">
            <ul>
                <li><h2>${this._goal.name}</h2>
                    <ul>
                        <li>
                            <h3>${this._subgoal.name}</h3>
                            <ul>
                                <li>
                                    Variables:
                                    <ul>
                                        <li>Response: ${this.pathway.response_variables}</li>
                                        <li>Driving: ${this.pathway.driving_variables}</li>
                                        <li>Notes: ${this.pathway.notes!.variables}</li>
                                    </ul>
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
                                </li>
                                <li>
                                    Datasets:
                                    <ul>
                                        ${Object.keys(this.pathway.datasets!).map((dsid: string) => {
                                            let ds = this.pathway.datasets![dsid];
                                            return html`
                                            <li>${ds.name}</li>
                                            `;
                                        })}
                                    </ul>
                                </li>
                                <li>
                                    Runs:
                                    <ul>
                                        ${this.pathway.executable_ensembles!.map((ensemble: ExecutableEnsemble) => {
                                            let model = this.pathway.models![ensemble.modelid];
                                            return html`
                                            <li>Model: ${model.name}
                                                <ul>
                                                ${Object.keys(ensemble.bindings).map((inputid) => {
                                                    let binding = ensemble.bindings[inputid];
                                                    return html`
                                                    <li>${inputid} = ${binding}</li>
                                                    `;
                                                })}
                                                </ul>
                                                Results: ${ensemble.results}
                                            </li>
                                            `
                                        })}
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
        `;
    }

    stateChanged(state: RootState) {
        super.setUser(state);
        super.setPathway(state);
        this._subgoal = getUISelectedSubgoal(state)!;
        if(this._subgoal)
            this._goal = getUISelectedGoal(state, this._subgoal)!;
    }
}