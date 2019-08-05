import { customElement, css, html, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";
import { ExecutableEnsemble, Goal, SubGoal, DataEnsembleMap } from "../reducers";
import { getUISelectedSubgoal, getUISelectedGoal } from "../../../util/state_functions";
import { MintPathwayPage } from "./mint-pathway-page";
import { getVariableLongName } from "../../../offline_data/variable_list";

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
        <style>
        i {
            display: block;
            margin: 10px 0px;
            color: #999;
        }
        </style>

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
                                                    let blist = bindings.join(", ");
                                                    return html`
                                                        <li>${io.name} = ${blist}</li>
                                                    `;
                                                })}
                                            </ul>
                                            `;
                                        })}
                                    </ul>
                                    <i>Notes: ${this.pathway.notes!.parameters}</i>
                                </li>
                                <li>
                                    Selected Results:
                                    <ul>
                                        ${this.pathway.executable_ensembles!.map((ensemble: ExecutableEnsemble) => {
                                            if(ensemble.selected) {
                                                let model = this.pathway.models![ensemble.modelid];
                                                return html`
                                                <li>Model: ${model.name}
                                                    <ul>
                                                    ${model.input_files.filter((input) => !input.value).map((input) => {
                                                        let binding = ensemble.bindings[input.id!];
                                                        return html`
                                                        <li>${input.name} = ${binding}</li>
                                                        `;
                                                    })}
                                                    ${model.input_parameters.filter((input) => !input.value).map((input) => {
                                                        let binding = ensemble.bindings[input.id!];
                                                        return html`
                                                        <li>${input.name} = ${binding}</li>
                                                        `;
                                                    })}
                                                    </ul>
                                                    Results: ${ensemble.results}
                                                </li>
                                                `
                                            }
                                            else {
                                                return html``;
                                            }
                                        })}
                                    </ul>
                                    <i>Notes: ${this.pathway.notes!.results}</i>
                                </li>                                
                                <li>
                                    Other Results that weren't selected:
                                    <ul>
                                        ${this.pathway.executable_ensembles!.map((ensemble: ExecutableEnsemble) => {
                                            let model = this.pathway.models![ensemble.modelid];
                                            if(!ensemble.selected) {
                                                return html`
                                                <li>Model: ${model.name}
                                                    <ul>
                                                    ${model.input_files.filter((input) => !input.value).map((input) => {
                                                        let binding = ensemble.bindings[input.id!];
                                                        return html`
                                                        <li>${input.name} = ${binding}</li>
                                                        `;
                                                    })}
                                                    ${model.input_parameters.filter((input) => !input.value).map((input) => {
                                                        let binding = ensemble.bindings[input.id!];
                                                        return html`
                                                        <li>${input.name} = ${binding}</li>
                                                        `;
                                                    })}
                                                    </ul>
                                                    Results: ${ensemble.results}
                                                </li>
                                                `
                                            }
                                            else {
                                                return html``;
                                            }
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