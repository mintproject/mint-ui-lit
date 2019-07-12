var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store } from "../store";
import { PageViewElement } from "./page-view-element";
import { SharedStyles } from "./shared-styles";
import { addGoal, addPathway, addSubGoal, deletePathway, deleteGoal, deleteSubGoal, getScenarioDetail, deleteScenario, addGoalFull, addSubGoalFull, updateSubGoal, updateGoal, updateScenario } from "../actions/mint";
import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";
import './mint-pathway';
import { selectSubgoal, selectPathway } from "../actions/ui";
import { getUISelectedSubgoal } from "../util/state_functions";
import { navigate, BASE_HREF } from "../actions/app";
import { renderVariables, renderNotifications } from "../util/ui_renders";
import { resetForm, showDialog, formElementsComplete, showNotification, hideDialog, hideNotification } from "../util/ui_functions";
let MintScenario = class MintScenario extends connect(store)(PageViewElement) {
    constructor() {
        super(...arguments);
        this._dispatched = false;
    }
    static get styles() {
        return [
            SharedStyles,
            css `

            wl-progress-bar {
                width: 300px;
            }

            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                display: flex;
                height: calc(100%);
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                overflow: auto;
                height: 100%;
            }

            .right {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            h2 {
                border-bottom: 1px solid #F0F0F0;
                padding-bottom: 10px;
            }

            `
        ];
    }
    render() {
        //console.log("rendering");
        if (!this._scenario_details) {
            return html ``;
        }
        return html `
        <div class="card">
            <div class="twocolumns">
                <div class="left">
                    <div class="clt">
                        <div class="cltrow_padded scenariorow">
                            <div class="cltmain">
                                <wl-title level="3" style="margin: 0px">${this._scenario.name}</wl-title>
                            </div>
                            <wl-icon @click="${this._addGoalDialog}" 
                                class="actionIcon addIcon">note_add</wl-icon>
                            <wl-icon @click="${this._onEditScenario}" 
                                class="actionIcon editIcon">edit</wl-icon>
                            <wl-icon @click="${this._onDeleteScenario}" 
                                class="actionIcon deleteIcon">delete</wl-icon>
                        </div>
                        <ul>
                        ${Object.keys(this._scenario_details.goals).map((goalid) => {
            const goal = this._scenario_details.goals[goalid];
            return html `
                            <li>
                                <div class="cltrow goalrow" id="goal_${goal.id}">
                                    <div class="cltmain">${goal.name}</div>
                                    <wl-icon @click="${this._addSubGoalDialog}" 
                                        data-goalid="${goal.id}"
                                        class="actionIcon addIcon">note_add</wl-icon>
                                    <wl-icon @click="${this._onEditGoal}" 
                                        data-goalid="${goal.id}"
                                        class="actionIcon editIcon">edit</wl-icon>
                                    <wl-icon @click="${this._onDeleteGoal}" 
                                        data-goalid="${goal.id}"
                                        class="actionIcon deleteIcon">delete</wl-icon>
                                </div>
                                <ul>
                                    ${(goal.subgoalids || []).map((subgoalid) => {
                const subgoal = this._scenario_details.subgoals[subgoalid];
                if (subgoal) {
                    return html `
                                            <li class="active ${this._getSubgoalClass(subgoal.id)}">
                                                <div class="cltrow subgoalrow" id="subgoal_${subgoal.id}"
                                                        @click="${this._onSelectSubgoal}"
                                                        data-subgoalid="${subgoal.id}">
                                                    <div class="cltmain">${subgoal.name}</div>
                                                    <wl-icon @click="${this._onEditSubGoal}" 
                                                        data-subgoalid="${subgoal.id}"
                                                        class="actionIcon editIcon">edit</wl-icon>
                                                    <wl-icon @click="${this._onDeleteSubGoal}" 
                                                        data-goalid="${goal.id}"
                                                        data-subgoalid="${subgoal.id}"
                                                        class="actionIcon deleteIcon">delete</wl-icon>
                                                </div>
                                            </li>
                                            `;
                }
                else {
                    return html ``;
                }
            })}
                                </ul>
                            </li>
                            `;
        })}
                        </ul>
                    </div>
                </div>
                <div class="right">
                        <div class="card2">
                            <mint-pathway ?active="${this._selectedSubgoal}"
                                .scenario=${this._scenario}></mint-pathway>
                        </div>
                </div>
            </div>
        </div>

        <!-- Tooltips -->
        ${this._renderTooltips()}

        <!-- Notifications -->
        ${renderNotifications()}

        <!-- Dialogs -->
        ${this._renderObjectiveDialog()}
        ${this._renderSubObjectiveDialog()}
        `;
    }
    _renderTooltips() {
        return html `
        <!-- Tooltips for the Scenario -->
        <wl-tooltip anchor=".scenariorow .addIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Add an Objective
        </wl-tooltip>
        <wl-tooltip anchor=".scenariorow .editIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Edit Scenario Name
        </wl-tooltip>
        <wl-tooltip anchor=".scenariorow .deleteIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Delete Scenario
        </wl-tooltip>
        
        ${Object.keys(this._scenario_details.goals).map((goalid) => {
            const goal = this._scenario_details.goals[goalid];
            return html `
            <!-- Tooltips for the goal -->
            <wl-tooltip anchor="#goal_${goalid} .addIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                anchorOriginX="center" anchorOriginY="bottom" 
                fixed transformOriginX="center">
                Add a Sub-Objective
            </wl-tooltip>
            <wl-tooltip anchor="#goal_${goalid} .editIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Edit Objective
            </wl-tooltip>
            <wl-tooltip anchor="#goal_${goalid} .deleteIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Delete Objective
            </wl-tooltip>

            ${(goal.subgoalids || []).map((subgoalid) => {
                return html `
                <!-- Tooltips for the sub-goal -->
                <wl-tooltip anchor="#subgoal_${subgoalid} .editIcon" 
                    .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                    fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                    Edit Sub-Objective
                </wl-tooltip>                
                <wl-tooltip anchor="#subgoal_${subgoalid} .deleteIcon" 
                    .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                    fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                    Delete Sub-Objective
                </wl-tooltip>
                `;
            })}
            `;
        })}        
        `;
    }
    _renderObjectiveDialog() {
        return html `
        <wl-dialog class="larger" id="objectiveDialog" fixed backdrop blockscrolling>
            <h3 slot="header">What is your objective ?*</h3>
            <div slot="content">
                <form id="objectiveForm">
                    <p>
                        Please specify a high level objective to be able to investigate your scenario
                    </p>
                    <div class="input_full">
                        <input name="goal_name"></input>
                    </div>
                    <fieldset>
                        <legend>Sub-Objective</legend>
                        ${this._renderSubObjectiveForm()}
                    </fieldset>
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onAddGoalCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onAddGoalSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }
    _renderSubObjectiveDialog() {
        return html `
        <wl-dialog id="subObjectiveDialog" fixed backdrop blockscrolling>
            <h3 slot="header">What is the Sub-Objective ?</h3>
            <div slot="content">
                <form id="subObjectiveForm">
                   ${this._renderSubObjectiveForm()}
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onAddSubGoalCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onAddSubGoalSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }
    _renderSubObjectiveForm() {
        return html `
            <p>
                Specify a subobjective and its variables.
                A Sub-objective is an actionable objective that one can run analyses for and get results.
            </p>
            <input type="hidden" name="goalid"></input>
            <div class="input_full">
                <label>Sub-Objective*</label>
                <input name="subgoal_name"></input>
            </div>
            <br />
            ${renderVariables()}
        `;
    }
    _addGoalDialog() {
        resetForm(this.shadowRoot.querySelector("#objectiveForm"));
        showDialog("objectiveDialog", this.shadowRoot);
    }
    _onAddGoalSubmit() {
        let form = this.shadowRoot.querySelector("#objectiveForm");
        if (formElementsComplete(form, ["goal_name", "subgoal_name"])) {
            let goal_name = form.elements["goal_name"].value;
            let subgoal_name = form.elements["subgoal_name"].value;
            let response_variable = form.elements["response_variable"].value;
            let driving_variable = form.elements["driving_variable"].value || "";
            let goal = {
                name: goal_name,
                subgoalids: []
            };
            let subgoal = {
                name: subgoal_name,
                pathwayids: []
            };
            let pathway = {
                driving_variables: [driving_variable],
                response_variables: [response_variable],
                models: {},
                datasets: {},
                model_ensembles: {},
                executable_ensembles: [],
                notes: {}
            };
            addGoalFull(this._scenario, goal, subgoal, pathway);
            showNotification("saveNotification", this.shadowRoot);
            hideDialog("objectiveDialog", this.shadowRoot);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot);
        }
    }
    _onAddGoalCancel() {
        hideDialog("objectiveDialog", this.shadowRoot);
    }
    _addSubGoalDialog(e) {
        let goalid = e.currentTarget.dataset['goalid'];
        let form = this.shadowRoot.querySelector("#subObjectiveForm");
        resetForm(form);
        form.elements["goalid"].value = goalid;
        showDialog("subObjectiveDialog", this.shadowRoot);
    }
    _onAddSubGoalSubmit() {
        let form = this.shadowRoot.querySelector("#subObjectiveForm");
        if (formElementsComplete(form, ["subgoal_name"])) {
            let goalid = form.elements["goalid"].value;
            let subgoal_name = form.elements["subgoal_name"].value;
            let response_variable = form.elements["response_variable"].value;
            let driving_variable = form.elements["driving_variable"].value || "";
            let subgoal = {
                name: subgoal_name,
                pathwayids: []
            };
            let pathway = {
                driving_variables: [driving_variable],
                response_variables: [response_variable],
                models: {},
                datasets: {},
                model_ensembles: {},
                executable_ensembles: [],
                notes: {}
            };
            addSubGoalFull(this._scenario, goalid, subgoal, pathway);
            showNotification("save", this.shadowRoot);
            hideDialog("subObjectiveDialog", this.shadowRoot);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot);
        }
    }
    _onAddSubGoalCancel() {
        hideDialog("subObjectiveDialog", this.shadowRoot);
    }
    _addGoal(name) {
        let goal = {
            name: name,
            subgoalids: []
        };
        addGoal(this._scenario, goal);
    }
    _addSubGoal(name, goalid) {
        let subgoal = {
            name: name,
            pathwayids: []
        };
        let subgoalid = addSubGoal(this._scenario, goalid, subgoal);
        this._addPathway(subgoalid);
    }
    _addPathway(subgoalid) {
        let pathway = {
            driving_variables: [],
            response_variables: [],
            models: {},
            datasets: {},
            model_ensembles: {},
            executable_ensembles: [],
            notes: {}
        };
        addPathway(this._scenario, subgoalid, pathway);
    }
    _onEditScenario() {
        let newname = prompt("Enter new name for the scenario", this._scenario.name);
        if (newname) {
            this._scenario.name = newname;
            updateScenario(this._scenario);
            showNotification("saveNotification", this.shadowRoot);
        }
    }
    _onDeleteScenario() {
        if (!confirm("Do you want to delete the scenario '" + this._scenario.name + "' ?"))
            return;
        showNotification("deleteNotification", this.shadowRoot);
        // Delete scenario itself. Scenario deletion returns a "Promise"
        deleteScenario(this._scenario).then(() => {
            hideNotification("deleteNotification", this.shadowRoot);
            window.history.pushState({}, "MINT", BASE_HREF);
            store.dispatch(navigate(decodeURIComponent(BASE_HREF)));
        });
    }
    _onEditGoal(e) {
        e.preventDefault();
        e.stopPropagation();
        let goalid = e.currentTarget.dataset['goalid'];
        if (goalid) {
            let goal = this._scenario_details.goals[goalid];
            if (goal) {
                let newname = prompt("Enter new name for the objective", goal.name);
                if (newname) {
                    goal.name = newname;
                    updateGoal(this._scenario, goal);
                    showNotification("saveNotification", this.shadowRoot);
                }
            }
        }
        return false;
    }
    _onDeleteGoal(e) {
        e.preventDefault();
        e.stopPropagation();
        let goalid = e.currentTarget.dataset['goalid'];
        if (goalid) {
            // Delete its subgoals
            let goal = this._scenario_details.goals[goalid];
            if (goal) {
                if (!confirm("Do you want to delete the objective '" + goal.name + "' ?"))
                    return false;
                this._deleteGoal(goalid);
            }
        }
        return false;
    }
    _deleteGoal(goalid) {
        if (goalid) {
            // Delete its subgoals
            let goal = this._scenario_details.goals[goalid];
            if (goal && goal.subgoalids) {
                goal.subgoalids.map((subgoalid) => {
                    this._deleteSubGoal(goalid, subgoalid);
                });
            }
            // Delete goal itself
            deleteGoal(this._scenario, goalid);
            showNotification("deleteNotification", this.shadowRoot);
        }
    }
    _onEditSubGoal(e) {
        e.preventDefault();
        e.stopPropagation();
        let subgoalid = e.currentTarget.dataset['subgoalid'];
        if (subgoalid) {
            let subgoal = this._scenario_details.subgoals[subgoalid];
            if (subgoal) {
                let newname = prompt("Enter new name for the sub-objective", subgoal.name);
                if (newname) {
                    subgoal.name = newname;
                    updateSubGoal(this._scenario, subgoal);
                    showNotification("saveNotification", this.shadowRoot);
                }
            }
        }
        return false;
    }
    _onDeleteSubGoal(e) {
        e.preventDefault();
        e.stopPropagation();
        let goalid = e.currentTarget.dataset['goalid'];
        let subgoalid = e.currentTarget.dataset['subgoalid'];
        if (goalid && subgoalid) {
            let subgoal = this._scenario_details.subgoals[subgoalid];
            if (subgoal) {
                if (!confirm("Do you want to delete the sub-objective '" + subgoal.name + "' ?"))
                    return false;
                this._deleteSubGoal(goalid, subgoalid);
            }
        }
        return false;
    }
    _deleteSubGoal(goalid, subgoalid) {
        if (goalid && subgoalid) {
            // Delete its pathways
            let subgoal = this._scenario_details.subgoals[subgoalid];
            if (subgoal && subgoal.pathwayids) {
                subgoal.pathwayids.map((pathwayid) => {
                    this._deletePathway(subgoalid, pathwayid);
                });
            }
            // Delete subgoal itself
            deleteSubGoal(this._scenario, goalid, subgoalid);
            showNotification("deleteNotification", this.shadowRoot);
        }
    }
    _onDeletePathway(e) {
        if (!confirm("Do you want to delete this pathway ?"))
            return;
        let pathwayid = e.currentTarget.dataset['pathwayid'];
        if (this._selectedSubgoal && pathwayid)
            this._deletePathway(this._selectedSubgoal.id, pathwayid);
    }
    _deletePathway(subgoalid, pathwayid) {
        if (subgoalid && pathwayid)
            deletePathway(this._scenario, subgoalid, pathwayid);
    }
    _onSelectSubgoal(e) {
        let subgoalid = e.currentTarget.dataset['subgoalid'];
        let subgoal = this._scenario_details.subgoals[subgoalid];
        if (subgoal && (!this._selectedSubgoal || (this._selectedSubgoal.id != subgoalid))) {
            store.dispatch(selectSubgoal(subgoal.id));
            store.dispatch(selectPathway(subgoal.pathwayids[0]));
            // Selecting the first pathway of the subgoal by default
            // TODO: Think about handling multiple pathways in an elegant manner
        }
    }
    _getSubgoalClass(subgoalid) {
        if (this._selectedSubgoal && this._selectedSubgoal.id == subgoalid) {
            return "highlighted";
        }
        return "";
    }
    stateChanged(state) {
        // If a scenario has been selected, fetch scenario details
        let scenarioid = state.ui.selected_scenarioid;
        if (scenarioid) {
            // If we don't have the right details for the scenario, make a call to fetch the details
            if (!this._dispatched && (!state.mint.scenario || (state.mint.scenario.id != scenarioid))) {
                // Unsubscribe to any existing scenario details listener
                if (state.mint.scenario && state.mint.scenario.unsubscribe) {
                    console.log("Unsubscribing to scenario " + state.mint.scenario.id);
                    state.mint.scenario.unsubscribe();
                }
                console.log("Subscribing to scenario " + scenarioid);
                // Reset the scenario details
                this._scenario = null;
                this._scenario_details = null;
                this._selectedSubgoal = null;
                this._dispatched = true;
                // Make a subscription call for the new scenario id
                store.dispatch(getScenarioDetail(scenarioid));
                return;
            }
            // If we've already got the details in the state
            // - extract details from the state
            if (state.mint.scenario && state.mint.scenario.id == scenarioid) {
                this._dispatched = false;
                this._scenario_details = state.mint.scenario;
                this._scenario = {
                    id: this._scenario_details.id,
                    dates: this._scenario_details.dates,
                    name: this._scenario_details.name,
                    regionid: this._scenario_details.regionid,
                    last_update: this._scenario_details.last_update
                };
                hideNotification("saveNotification", this.shadowRoot);
                hideNotification("deleteNotification", this.shadowRoot);
            }
        }
        // If a subgoal has been selected
        this._selectedSubgoal = getUISelectedSubgoal(state);
    }
};
__decorate([
    property({ type: Object })
], MintScenario.prototype, "_scenario_details", void 0);
__decorate([
    property({ type: Object })
], MintScenario.prototype, "_scenario", void 0);
__decorate([
    property({ type: Object })
], MintScenario.prototype, "_selectedSubgoal", void 0);
MintScenario = __decorate([
    customElement('mint-scenario')
], MintScenario);
export { MintScenario };
