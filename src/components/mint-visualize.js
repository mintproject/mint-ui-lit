var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, css, html, property } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { SharedStyles } from "./shared-styles";
import { MintPathwayPage } from "./mint-pathway-page";
import { getUISelectedSubgoal, getUISelectedGoal } from "../util/state_functions";
let MintVisualize = class MintVisualize extends connect(store)(MintPathwayPage) {
    static get styles() {
        return [
            SharedStyles,
            css `
          h1, h2, h3 {
              margin: 4px;
          }
          `
        ];
    }
    render() {
        return html `

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
                                        <li>Notes: ${this.pathway.notes.variables}</li>
                                    </ul>
                                </li>
                                <li>
                                    Models:
                                    <ul>
                                        ${Object.keys(this.pathway.models).map((modelid) => {
            let model = this.pathway.models[modelid];
            return html `
                                            <li>${model.name}</li>
                                            `;
        })}
                                    </ul>
                                </li>
                                <li>
                                    Datasets:
                                    <ul>
                                        ${Object.keys(this.pathway.datasets).map((dsid) => {
            let ds = this.pathway.datasets[dsid];
            return html `
                                            <li>${ds.name}</li>
                                            `;
        })}
                                    </ul>
                                </li>
                                <li>
                                    Runs:
                                    <ul>
                                        ${this.pathway.executable_ensembles.map((ensemble) => {
            let model = this.pathway.models[ensemble.modelid];
            return html `
                                            <li>Model: ${model.name}
                                                <ul>
                                                ${Object.keys(ensemble.bindings).map((inputid) => {
                let binding = ensemble.bindings[inputid];
                return html `
                                                    <li>${inputid} = ${binding}</li>
                                                    `;
            })}
                                                </ul>
                                                Results: ${ensemble.results}
                                            </li>
                                            `;
        })}
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>

        Visualization is still under development
        `;
    }
    stateChanged(state) {
        super.setUser(state);
        super.setPathway(state);
        this._subgoal = getUISelectedSubgoal(state);
        this._goal = getUISelectedGoal(state, this._subgoal);
    }
};
__decorate([
    property({ type: Object })
], MintVisualize.prototype, "_goal", void 0);
__decorate([
    property({ type: Object })
], MintVisualize.prototype, "_subgoal", void 0);
MintVisualize = __decorate([
    customElement('mint-visualize')
], MintVisualize);
export { MintVisualize };
