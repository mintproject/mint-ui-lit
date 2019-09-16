import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { PageViewElement } from "../../components/page-view-element";
import { ScenarioDetails, SubGoal, Goal, Pathway, Scenario, Notes } from "./reducers";
import { SharedStyles } from "../../styles/shared-styles";
import { addGoal, addPathway, addSubGoal, deletePathway, deleteGoal, deleteSubGoal, getScenarioDetail, addGoalFull, addSubGoalFull, updateSubGoal, updateGoal, updatePathway } from "./actions";

import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import './pathway/mint-pathway';

//mport { selectSubgoal, selectPathway } from "../actions/ui";
import { getUISelectedSubgoal } from "../../util/state_functions";
import { navigate, BASE_HREF, goToPage } from "../../app/actions";
import { renderVariables, renderNotifications } from "../../util/ui_renders";
import { resetForm, showDialog, formElementsComplete, showNotification, hideDialog, hideNotification } from "../../util/ui_functions";
import { firestore } from "firebase";
import { toTimeStamp, fromTimeStampToDateString } from "util/date-utils";
import { RegionList } from "screens/regions/reducers";


@customElement('mint-scenario')
export class MintScenario extends connect(store)(PageViewElement) {

    @property({type: Object})
    private _subRegions: RegionList;

    @property({type: Object})
    private _scenario_details!: ScenarioDetails | null;

    @property({type: Object})
    private _scenario!: Scenario | null;

    @property({type: Object})
    private _selectedSubgoal!: SubGoal | null;

    @property({type: String})
    private _selectedPathwayId!: String | null;

    @property({type: Boolean})
    private _hideObjectives: Boolean = false;
    
    @property({type: Boolean})
    private _subgoalEditMode: Boolean = false;

    private _dispatched: Boolean = false;

    static get styles() {
        return [
          SharedStyles,
          css`

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
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
            }

            .right_full {
                width: 100%;
            }

            h2 {
                border-bottom: 1px solid #F0F0F0;
                padding-bottom: 10px;
            }

            `
        ];
    }

    protected render() {
        //console.log("rendering");
        if(!this._scenario_details) {
            return html``;
        }
        return html`
            <!-- Top Scenario Heading -->
            <div class="cltrow scenariorow">
                <wl-button flat inverted @click="${()=> goToPage('modeling')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                    <wl-title level="3" style="margin: 0px">${this._scenario!.name}</wl-title>
                </div>
            </div>

            <!-- Two Columns Section -->
            <div class="twocolumns">

                <!-- Left Column : Tree of Objectives/Subobjectives -->
                <div class="${this._hideObjectives ? 'left_closed' : 'left'}">
                    <div class="clt">
                        <div class="cltrow_padded scenariorow">
                            <div class="cltmain">
                                <wl-title level="4" style="margin: 0px">OBJECTIVES</wl-title>
                            </div>
                            <wl-icon @click="${this._addGoalDialog}" 
                                class="actionIcon addIcon">note_add</wl-icon>
                        </div>                    
                        <ul>
                        ${Object.keys(this._scenario_details.goals).map((goalid) => {
                            const goal = this._scenario_details!.goals[goalid];
                            return html`
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
                                        const subgoal = this._scenario_details!.subgoals[subgoalid];
                                        if(subgoal) {
                                            return html`
                                            <li class="active ${this._getSubgoalClass(subgoal.id!)}">
                                                <div class="cltrow subgoalrow" id="subgoal_${subgoal.id}"
                                                        @click="${this._onSelectSubgoal}"
                                                        data-subgoalid="${subgoal.id}">
                                                    <div class="cltmain">${subgoal.name}</div>
                                                    <wl-icon @click="${this._editSubGoalDialog}" 
                                                        data-subgoalid="${subgoal.id}"
                                                        class="actionIcon editIcon">edit</wl-icon>
                                                    <wl-icon @click="${this._onDeleteSubGoal}" 
                                                        data-goalid="${goal.id}"
                                                        data-subgoalid="${subgoal.id}"
                                                        class="actionIcon deleteIcon">delete</wl-icon>
                                                </div>
                                            </li>
                                            `
                                        }
                                        else {
                                            return html``
                                        }
                                    })}
                                </ul>
                            </li>
                            `
                        })}
                        </ul>
                    </div>
                </div>

                <!-- Right Column : Pathway Tree + Pathway details -->
                <div class="${this._hideObjectives ? 'right_full' : 'right'}">
                    <div class="card2">
                    ${this._selectedSubgoal ?
                        html`
                        <div class="clt">
                            <div class="cltrow scenariorow">
                                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                                    <wl-title level="4">Modeling threads</wl-title>
                                </div>
                                <wl-icon @click="${this._editPathwayDialog}" 
                                    class="actionIcon">note_add</wl-icon>
                                &nbsp;&nbsp;
                                <wl-icon @click="${() => this._hideObjectives = !this._hideObjectives}"
                                    class="actionIcon bigActionIcon" style="float:right">
                                    ${!this._hideObjectives ? "fullscreen" : "fullscreen_exit"}</wl-icon>
                            </div>
                            <ul>
                            ${((this._selectedSubgoal || {}).pathwayids || []).map((pathwayid) => {
                                let pathway = this._scenario_details.pathways[pathwayid];
                                let pname = pathway.name ? pathway.name : this._selectedSubgoal.name;
                                let url = "modeling/scenario/" + this._scenario!.id + "/" + 
                                    this._selectedSubgoal.id + "/" + pathwayid;
                                return html`
                                    <li class="active ${this._getPathwayClass(pathwayid!)}">
                                        <div class="cltrow subgoalrow" id="pathway_${pathwayid}"
                                                @click="${this._onSelectPathway}"
                                                data-pathwayid="${pathwayid}">
                                            <div class="cltmain">${pname}</div>
                                            <wl-icon @click="${this._editPathwayDialog}" 
                                                data-pathwayid="${pathwayid}"
                                                class="actionIcon editIcon">edit</wl-icon>
                                            <wl-icon @click="${this._onDeletePathway}" 
                                                data-pathwayid="${pathwayid}"
                                                class="actionIcon deleteIcon">delete</wl-icon>
                                        </div>
                                    </li>
                                `;
                            })}
                            </ul>
                        </div>

                        <mint-pathway ?active="${this._selectedSubgoal}"
                            .scenario=${this._scenario}></mint-pathway>
                    </div>
                    ` : ''
                    }
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
        ${this._renderThreadDialog()}
        `;
    }

    _renderTooltips() {
        return html`
        <!-- Tooltips for the addPaScenario -->
        <wl-tooltip anchor=".scenariorow .addIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Add an Objective
        </wl-tooltip>
        
        ${Object.keys(this._scenario_details!.goals).map((goalid) => {
            const goal = this._scenario_details!.goals[goalid];
            return html`
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
                return html`
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
                `
            })}
            `;
        })}        
        `        
    }

    _renderObjectiveDialog() {
        return html`
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
        return html`
        <wl-dialog id="subObjectiveDialog" fixed backdrop blockscrolling>
            <h3 slot="header">What is the Sub-Objective ?</h3>
            <div slot="content">
                <form id="subObjectiveForm">
                   ${this._renderSubObjectiveForm()}
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onEditSubGoalCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onEditSubGoalSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _renderSubObjectiveForm() {
        return html`
            <p>
                Specify a subobjective and its variables.
                A Sub-objective is an actionable objective that one can run analyses for and get results.
            </p>
            <input type="hidden" name="goalid"></input>
            <input type="hidden" name="subgoalid"></input>
            
            <!-- Sub-Objective name -->
            <div class="input_full">
                <label>Sub-Objective*</label>
                <input name="subgoal_name"></input>
            </div>
            <br />

            <!-- Sub Region -->
            <div class="formRow">
                <div class="input_half">
                    <label>Sub-Region</label>
                    <select name="subgoal_subregion">
                        <option disabled selected>Select</option>
                        <option value="">None</option>
                        ${Object.keys(this._subRegions || {}).map((subRegionid) => {
                            let subRegion = this._subRegions![subRegionid];
                            return html`
                            <option value="${subRegion.id}">${subRegion.name}</option>
                            `;
                        })}
                    </select>
                </div>            
            </div>            
            <div style="height:10px;">&nbsp;</div>

            <!-- Time Period -->
            <div class="input_full">
                <label>Time Period</label>
            </div>
            <div class="formRow">
                <div class="input_half">
                    <input name="subgoal_from" type="date" value="${this._scenario!.dates.start_date}">
                </div>
                to
                <div class="input_half">
                    <input name="subgoal_to" type="date" value="${this._scenario!.dates.end_date}">
                </div>
            </div>
            <br />

            <!-- Variables --> 
            ${!this._subgoalEditMode ? renderVariables() : ''}
        `;        
    }
    
    _renderThreadDialog() {
        return html`
        <wl-dialog id="threadDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Modeling thread</h3>
            <div slot="content">
                <form id="threadForm">
                <p>
                    Specify modeling thread details.
                    A Thread constitutes analysis of a sub-objective using a single model. A sub-objective may have multiple modeling threads.
                </p>
                <input type="hidden" name="pathwayid"></input>
                
                <!-- Sub-Objective name -->
                <div class="input_full">
                    <label>Modeling thread name*</label>
                    <input name="pathway_name"></input>
                </div>
                <br />

                <!-- Time Period -->
                <div class="input_full">
                    <label>Time Period</label>
                </div>
                <div class="formRow">
                    <div class="input_half">
                        <input name="pathway_from" type="date">
                    </div>
                    to
                    <div class="input_half">
                        <input name="pathway_to" type="date">
                    </div>
                </div>
                <br />
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onEditPathwayCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onEditPathwaySubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _addGoalDialog() {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#objectiveForm")!;
        resetForm(form, null);
        let dates = this._scenario.dates;
        (form.elements["goalid"] as HTMLInputElement).value = null!;
        (form.elements["subgoal_subregion"] as HTMLSelectElement).value = this._scenario.subregionid!;
        (form.elements["subgoal_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
        (form.elements["subgoal_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
        showDialog("objectiveDialog", this.shadowRoot!);
    }

    _onAddGoalSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#objectiveForm")!;
        if(formElementsComplete(form, ["goal_name", "subgoal_name"])) {
            let goal_name = (form.elements["goal_name"] as HTMLInputElement).value;
            let subgoal_name = (form.elements["subgoal_name"] as HTMLInputElement).value;
            let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
            let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
            let goal = {
                name: goal_name,
                subgoalids: []
            } as Goal;
            let subgoal = {
                name: subgoal_name,
                pathwayids: []
            } as SubGoal;
            let pathway = {
                driving_variables: [driving_variable],
                response_variables: [response_variable],
                models: {},
                datasets: {},
                model_ensembles: {},
                executable_ensembles: [],
                notes: {} as Notes
            } as Pathway;

            addGoalFull(this._scenario!, goal, subgoal, pathway);

            showNotification("saveNotification", this.shadowRoot!);
            hideDialog("objectiveDialog", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
    }

    _onAddGoalCancel() {
        hideDialog("objectiveDialog", this.shadowRoot!);
    }

    _addSubGoalDialog(e: Event) {
        let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid']; 
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        resetForm(form, null);
        this._subgoalEditMode = false;
        let dates = this._scenario.dates;
        (form.elements["goalid"] as HTMLInputElement).value = goalid!;
        (form.elements["subgoal_subregion"] as HTMLSelectElement).value = this._scenario.subregionid!;
        (form.elements["subgoal_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
        (form.elements["subgoal_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
        showDialog("subObjectiveDialog", this.shadowRoot!);
    }

    _editPathwayDialog(e: Event) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        resetForm(form, null);

        let threadid = (e.currentTarget as HTMLButtonElement).dataset['pathwayid'];
        let dates = this._selectedSubgoal.dates || this._scenario.dates;
        if(threadid) {
            let pathway = this._scenario_details!.pathways[threadid];
            if(pathway) {
                if(pathway.dates)
                    dates = pathway.dates;
                (form.elements["pathwayid"] as HTMLInputElement).value = pathway.id;
                (form.elements["pathway_name"] as HTMLInputElement).value = pathway.name || this._selectedSubgoal.name;
            }
        }
        (form.elements["pathway_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
        (form.elements["pathway_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);

        showDialog("threadDialog", this.shadowRoot!);
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onEditPathwaySubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        if(formElementsComplete(form, ["pathway_name"])) {
            let pathwayid = (form.elements["pathwayid"] as HTMLInputElement).value;
            let subgoalid = this._selectedSubgoal.id;
            let pathway_name = (form.elements["pathway_name"] as HTMLInputElement).value;
            let pathway_from = (form.elements["pathway_from"] as HTMLInputElement).value;
            let pathway_to = (form.elements["pathway_to"] as HTMLInputElement).value;

            // If no subgoalid, but goalid is there, then this is a new subgoal
            let pathway : Pathway = null;
            if(pathwayid) {
                // Edit Pathway 
                pathway = this._scenario_details!.pathways[pathwayid];
                pathway.name = pathway_name;
                pathway.dates = {
                    start_date: firestore.Timestamp.fromDate(new Date(pathway_from)),
                    end_date: firestore.Timestamp.fromDate(new Date(pathway_to))
                };
                updatePathway(this._scenario!, pathway);
            }
            else {
                // Add Pathway
                let pathway = {
                    name: pathway_name,
                    dates: {
                        start_date: toTimeStamp(pathway_from),
                        end_date: toTimeStamp(pathway_to)
                    },
                    driving_variables: [],
                    response_variables: [],
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    executable_ensembles: [],
                    notes: {} as Notes
                } as Pathway;

                addPathway(this._scenario!, subgoalid, pathway);
            }

            showNotification("saveNotification", this.shadowRoot!);
            hideDialog("threadDialog", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
    }

    _onEditPathwayCancel() {
        hideDialog("threadDialog", this.shadowRoot!);
    }
    
    _editSubGoalDialog(e: Event) {
        let subgoalid = (e.currentTarget as HTMLButtonElement).dataset['subgoalid'];
        if(subgoalid) {
            let subgoal = this._scenario_details!.subgoals[subgoalid];
            if(subgoal) {
                let form = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
                resetForm(form, null);
                this._subgoalEditMode = true;
                let dates = subgoal.dates ? subgoal.dates : this._scenario.dates;
                (form.elements["subgoalid"] as HTMLInputElement).value = subgoal.id;
                (form.elements["subgoal_name"] as HTMLInputElement).value = subgoal.name;
                (form.elements["subgoal_subregion"] as HTMLInputElement).value = subgoal.subregionid;
                (form.elements["subgoal_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
                (form.elements["subgoal_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
                showDialog("subObjectiveDialog", this.shadowRoot!);
            }
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onEditSubGoalSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        if(formElementsComplete(form, ["subgoal_name"])) {
            let goalid = (form.elements["goalid"] as HTMLInputElement).value;
            let subgoalid = (form.elements["subgoalid"] as HTMLInputElement).value;
            let subgoal_subregion = (form.elements["subgoal_subregion"] as HTMLInputElement).value;
            let subgoal_name = (form.elements["subgoal_name"] as HTMLInputElement).value;
            let subgoal_from = (form.elements["subgoal_from"] as HTMLInputElement).value;
            let subgoal_to = (form.elements["subgoal_to"] as HTMLInputElement).value;

            // If no subgoalid, but goalid is there, then this is a new subgoal
            let subgoal : SubGoal = null;
            if(subgoalid) {
                // Edit Subgoal 
                subgoal = this._scenario_details!.subgoals[subgoalid];
                subgoal.name = subgoal_name;
                subgoal.subregionid = subgoal_subregion;
                subgoal.dates = {
                    start_date: firestore.Timestamp.fromDate(new Date(subgoal_from)),
                    end_date: firestore.Timestamp.fromDate(new Date(subgoal_to))
                };
                updateSubGoal(this._scenario!, subgoal);
            }
            else if(goalid) {
                // Add Subgoal
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                subgoal = {
                    name: subgoal_name,
                    subregionid: subgoal_subregion,
                    dates: {
                        start_date: toTimeStamp(subgoal_from),
                        end_date: toTimeStamp(subgoal_to)
                    },
                    pathwayids: []
                } as SubGoal;

                let pathway = {
                    driving_variables: [driving_variable],
                    response_variables: [response_variable],
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    executable_ensembles: [],
                    notes: {} as Notes
                } as Pathway;

                addSubGoalFull(this._scenario!, goalid, subgoal, pathway);
            }

            showNotification("saveNotification", this.shadowRoot!);
            hideDialog("subObjectiveDialog", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
    }

    _onEditSubGoalCancel() {
        hideDialog("subObjectiveDialog", this.shadowRoot!);
    }

    _addGoal(name:string) {
        let goal = {
            name: name,
            subgoalids: []
        } as Goal;
        addGoal(this._scenario!, goal);
    }

    _addSubGoal(name:string, goalid:string) {
        let subgoal = {
            name: name,
            pathwayids: []
        } as SubGoal;
        let subgoalid = addSubGoal(this._scenario!, goalid, subgoal);
        this._addPathway(subgoalid);
    }

    _addPathway(subgoalid:string) {
        let pathway = {
            driving_variables: [],
            response_variables: [],
            models: {},
            datasets: {},
            model_ensembles: {},
            executable_ensembles: [],
            notes: {} as Notes
        } as Pathway;
        addPathway(this._scenario!, subgoalid!, pathway);
    }

    _onEditGoal(e: Event) {
        e.preventDefault();
        e.stopPropagation();        

        let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid'];
        if(goalid) {
            let goal = this._scenario_details!.goals[goalid];
            if(goal) {
                let newname = prompt("Enter new name for the objective", goal.name);
                if(newname) {
                    goal.name = newname;
                    updateGoal(this._scenario!, goal);
                    showNotification("saveNotification", this.shadowRoot!); 
                }
            }
        }
        return false;
    }

    _onDeleteGoal(e: Event) {
        e.preventDefault();
        e.stopPropagation();   

        let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid'];
        if(goalid) {
            // Delete its subgoals
            let goal = this._scenario_details!.goals[goalid];
            if(goal) {
                if(!confirm("Do you want to delete the objective '" + goal.name + "' ?"))
                    return false;
                this._deleteGoal(goalid);
            }
        }
        return false;
    }

    _deleteGoal(goalid: string) {
        if(goalid) {
            // Delete its subgoals
            let goal = this._scenario_details!.goals[goalid];
            if(goal && goal.subgoalids) {
                goal.subgoalids.map((subgoalid) => {
                    this._deleteSubGoal(goalid, subgoalid);
                });
            }
            // Delete goal itself
            deleteGoal(this._scenario!, goalid);
            showNotification("deleteNotification", this.shadowRoot!);
        }
    }

    _onDeleteSubGoal(e: Event) {
        e.preventDefault();
        e.stopPropagation();        

        let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid'];
        let subgoalid = (e.currentTarget as HTMLButtonElement).dataset['subgoalid'];
        if(goalid && subgoalid) {
            let subgoal = this._scenario_details!.subgoals[subgoalid];
            if(subgoal) {
                if(!confirm("Do you want to delete the sub-objective '" + subgoal.name + "' ?"))
                    return false;
                this._deleteSubGoal(goalid, subgoalid);
            }
        }
        return false;
    }

    _deleteSubGoal(goalid: string, subgoalid: string) {
        if(goalid && subgoalid) {
            // Delete its pathways
            let subgoal = this._scenario_details!.subgoals[subgoalid];
            if(subgoal && subgoal.pathwayids) {
                subgoal.pathwayids.map((pathwayid) => {
                    this._deletePathway(subgoalid!, pathwayid);
                });
            }
            // Delete subgoal itself
            deleteSubGoal(this._scenario!, goalid, subgoalid);

            showNotification("deleteNotification", this.shadowRoot!);
        }
    }

    _onDeletePathway(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if(!confirm("Do you want to delete this thread ?"))
            return;
        
        let pathwayid = (e.currentTarget as HTMLButtonElement).dataset['pathwayid'];    
        if(this._selectedSubgoal && pathwayid) {
            this._deletePathway(this._selectedSubgoal.id!, pathwayid);
            showNotification("deleteNotification", this.shadowRoot!);
        }
    }

    _deletePathway(subgoalid: string, pathwayid: string) {
        if(subgoalid && pathwayid) {
            deletePathway(this._scenario!, subgoalid, pathwayid);
            delete this._scenario_details.pathways[pathwayid];
        }
    }

    _onSelectSubgoal(e: Event) {
        let subgoalid = (e.currentTarget as HTMLButtonElement).dataset['subgoalid'];
        let subgoal = this._scenario_details!.subgoals[subgoalid!];
        if(subgoal && (!this._selectedSubgoal || (this._selectedSubgoal.id != subgoalid))) {
            // Selecting the first pathway of the subgoal by default
            // TODO: Think about handling multiple pathways in an elegant manner
            goToPage("modeling/scenario/" + this._scenario!.id + "/" + subgoal.id + "/" + subgoal.pathwayids![0]);
        }
    }

    _onSelectPathway(e: Event) {
        let pathwayid = (e.currentTarget as HTMLButtonElement).dataset['pathwayid'];
        let pathway = this._scenario_details!.pathways[pathwayid!];
        let subgoal = this._selectedSubgoal;
        if(pathway && subgoal) {
            // Selecting the first pathway of the subgoal by default
            // TODO: Think about handling multiple pathways in an elegant manner
            goToPage("modeling/scenario/" + this._scenario!.id + "/" + subgoal.id + "/" + pathway.id);
        }
    }

    _getSubgoalClass(subgoalid:string) {
        if(this._selectedSubgoal && this._selectedSubgoal.id! == subgoalid) {
            return "highlighted";
        }
        return "";
    }

    _getPathwayClass(pathwayid:string) {
        if(this._selectedPathwayId == pathwayid) {
            return "highlighted";
        }
        return "";
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if(state.ui && state.ui.selected_pathwayid) 
            this._selectedPathwayId = state.ui.selected_pathwayid;

        if(state.regions!.query_result && this._regionid && state.regions!.query_result[this._regionid]) 
            this._subRegions = state.regions!.query_result[this._regionid]["*"];

        // If a scenario has been selected, fetch scenario details
        let scenarioid = state.ui!.selected_scenarioid;
        let user = state.app.user;

        if(scenarioid && user) {
            // If we don't have the right details for the scenario, make a call to fetch the details
            if(!this._dispatched && (!state.modeling.scenario || (state.modeling.scenario.id != scenarioid))) {
                
                // Unsubscribe to any existing scenario details listener
                if(state.modeling.scenario && state.modeling.scenario.unsubscribe) {
                    console.log("Unsubscribing to scenario " + state.modeling.scenario.id);
                    state.modeling.scenario.unsubscribe();
                }
                console.log("Subscribing to scenario " + scenarioid);

                // Reset the scenario details
                this._scenario = null;
                this._scenario_details = null;
                this._selectedSubgoal = null;
                this._selectedPathwayId = null;

                this._dispatched = true;

                // Make a subscription call for the new scenario id
                store.dispatch(getScenarioDetail(scenarioid));

                return;
            }

            // If we've already got the details in the state
            // - extract details from the state
            if(state.modeling.scenario && state.modeling.scenario.id == scenarioid) {
                this._dispatched = false;
                this._scenario_details = state.modeling.scenario;
                this._scenario = {
                    id: this._scenario_details.id,
                    dates: this._scenario_details.dates,
                    name: this._scenario_details.name,
                    regionid: this._scenario_details.regionid,
                    subregionid: this._scenario_details.subregionid,
                    last_update: this._scenario_details.last_update
                } as Scenario;

                hideNotification("saveNotification", this.shadowRoot!);
                hideNotification("deleteNotification", this.shadowRoot!);
            }
        }

        // If no subgoal/pathway selected, then show objectives tree
        if(this._selectedSubgoal == null) {
            this._hideObjectives = false;
        }

        if(state.modeling.scenario && state.modeling.scenario.subgoals) {
            // If a subgoal has been selected
            this._selectedSubgoal = getUISelectedSubgoal(state)!;
        }

        if(!user && state.modeling.scenario) {
            // Logged out, Unsubscribe
            if(state.modeling.scenario.unsubscribe) {
                console.log("Unsubscribing to scenario " + state.modeling.scenario.id);
                state.modeling.scenario.unsubscribe();
            }
            state.modeling.scenario = undefined;
        }
    }
}