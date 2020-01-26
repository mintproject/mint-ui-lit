import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { PageViewElement } from "../../components/page-view-element";
import { ScenarioDetails, SubGoal, Goal, Pathway, Scenario, Notes, PathwayInfo } from "./reducers";
import { SharedStyles } from "../../styles/shared-styles";
import { addGoal, addPathway, addSubGoal, deletePathway, deleteGoal, deleteSubGoal, getScenarioDetail, addGoalFull, addSubGoalFull, updateSubGoal, updateGoal, updatePathway, updatePathwayInfo, updatePathwayVariables } from "./actions";

import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import './pathway/mint-pathway';

//mport { selectSubgoal, selectPathway } from "../actions/ui";
import { getUISelectedSubgoal } from "../../util/state_functions";
import { goToPage } from "../../app/actions";
import { renderVariables, renderNotifications } from "../../util/ui_renders";
import { resetForm, showDialog, formElementsComplete, showNotification, hideDialog, hideNotification } from "../../util/ui_functions";
import { firestore } from "firebase";
import { toTimeStamp, fromTimeStampToDateString } from "util/date-utils";
import { RegionMap, Region, RegionCategory } from "screens/regions/reducers";
import { getVariableLongName, getVariableIntervention } from "offline_data/variable_list";


@customElement('mint-scenario')
export class MintScenario extends connect(store)(PageViewElement) {

    @property({type: Object})
    private _regions: RegionMap;

    @property({type: Array})
    private _subRegionIds: string[];

    @property({type: Object})
    private _categorizedRegions: any; 

    @property({type: String})
    private _selectedCategory: string = '';

    @property({type: Object})
    private _scenario_details!: ScenarioDetails | null;

    @property({type: Object})
    private _scenario!: Scenario | null;

    @property({type: Object})
    private _selectedSubgoal!: SubGoal | null;

    @property({type: String})
    private _selectedPathwayId!: String | null;

    @property({type: Boolean})
    private _hideObjectives: boolean = false;
    
    @property({type: Boolean})
    private _subgoalEditMode: boolean = false;

    @property({type: Object})
    private _selectedIntervention!: any;

    private _dispatched: boolean = false;

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
                height: calc(100% - 73px);
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

            .header_description {
                padding-left:5px;
                padding-bottom:8px;
                font-size:10px;
                color:#999;
            }

            h2 {
                border-bottom: 1px solid #F0F0F0;
                padding-bottom: 10px;
            }

            `
        ];
    }

    protected render() {
        if(this._dispatched)
            return html`<wl-progress-spinner class="loading"></wl-progress-spinner>`;

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
                <div class="cltmain navtop">
                    <wl-title level="3">${this._scenario!.name}</wl-title>
                </div>
            </div>

            <!-- Two Columns Section -->
            <div class="twocolumns">

                <!-- Left Column : Tree of Objectives/Subobjectives -->
                <div class="${this._hideObjectives ? 'left_closed' : 'left'}">
                    <div class="clt">
                        <div class="cltrow_padded scenariorow">
                            <div class="cltmain">
                                <wl-title level="4" style="margin: 0px">
                                    TASKS
                                </wl-title>
                            </div>
                            <wl-icon @click="${this._addSubGoalDialog}" 
                                class="actionIcon addIcon">note_add</wl-icon>
                        </div>
                        <div style="font-size:12.5px; color: #888; padding:5px; padding-left: 10px; padding-top:0px;">
                            Several modeling tasks can be created for a given problem statement. 
                            <a style="cursor:pointer" 
                                @click="${() => showDialog('tasksHelpDialog', this.shadowRoot)}">Read more</a>
                        </div>
                        <ul>
                        ${Object.keys(this._scenario_details.subgoals).map((subgoalid) => {
                            const subgoal = this._scenario_details!.subgoals[subgoalid];
                            if(subgoal) {
                                return html`
                                <li class="active ${this._getSubgoalClass(subgoal.id!)}">
                                    <div class="cltrow subgoalrow" id="subgoal_${subgoal.id}"
                                            @click="${this._onSelectSubgoal}"
                                            data-subgoalid="${subgoal.id}">
                                        <div class="cltmain">
                                            ${this._getSubgoalVariablesText(subgoal)}
                                            ${subgoal.name ? 
                                                html `<div class='description'>${subgoal.name}</div>` : ""
                                            }
                                            <div class='description'>
                                                ${this._getSubgoalRegionTimeText(subgoal)}
                                            </div>
                                        </div>
                                        <wl-icon @click="${this._editSubGoalDialog}" 
                                            data-subgoalid="${subgoal.id}"
                                            class="actionIcon editIcon">edit</wl-icon>
                                        <wl-icon @click="${this._onDeleteSubGoal}" 
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
                                    <wl-title level="4">
                                        Modeling threads
                                        &nbsp;&nbsp;
                                        <wl-icon @click="${() => this._hideObjectives = !this._hideObjectives}"
                                            class="actionIcon bigActionIcon" style="vertical-align:bottom">
                                            ${!this._hideObjectives ? "fullscreen" : "fullscreen_exit"}</wl-icon>
                                    </wl-title>
                                </div>
                                <wl-icon @click="${this._editPathwayDialog}" 
                                    class="actionIcon addIcon">note_add</wl-icon>
                            </div>
                            <div style="font-size:12.5px; color: #888; padding: 5px; padding-top: 0px">
                                For a given task, you can investigate different initial conditions or different models.  
                                Each of them can be explored by creating a new modeling thread for that task.
                                <a style="cursor:pointer" 
                                    @click="${() => showDialog('threadsHelpDialog', this.shadowRoot)}">Read more</a>
                            </div>
                            <ul>
                            ${Object.values(((this._selectedSubgoal || {}) as SubGoal).pathways || {}).map((pathway: PathwayInfo) => {
                                let pname = pathway.name ? pathway.name : this._selectedSubgoal.name;
                                let url = "modeling/scenario/" + this._scenario!.id + "/" + 
                                    this._selectedSubgoal.id + "/" + pathway.id;
                                return html`
                                    <li class="active ${this._getPathwayClass(pathway.id!)}">
                                        <div class="cltrow subgoalrow" id="pathway_${pathway.id}"
                                                @click="${this._onSelectPathway}"
                                                data-pathwayid="${pathway.id}">
                                            <div class="cltmain">
                                                ${pname ? pname : 
                                                    html`<div style="color:#888">Default thread</div>`
                                                }
                                            </div>
                                            <wl-icon @click="${this._editPathwayDialog}" 
                                                data-pathwayid="${pathway.id}"
                                                class="actionIcon editIcon">edit</wl-icon>
                                            <wl-icon @click="${this._onDeletePathway}" 
                                                data-pathwayid="${pathway.id}"
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
        ${this._renderHelpDialogs()}
        `;
    }

    _renderTooltips() {
        return html`
        <!-- Tooltips for the addPaScenario -->
        <wl-tooltip anchor=".scenariorow .addIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Add Task
        </wl-tooltip>
        
        ${Object.keys(this._scenario_details!.subgoals).map((subgoalid) => {
            return html`
            <!-- Tooltips for the sub-goal -->
            <wl-tooltip anchor="#subgoal_${subgoalid} .editIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Edit Task
            </wl-tooltip>                
            <wl-tooltip anchor="#subgoal_${subgoalid} .deleteIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Delete Task
            </wl-tooltip>
            `
        })}        
        `        
    }

    _renderHelpDialogs() {
        return html`
        <wl-dialog class="larger" id="threadsHelpDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Modeling Threads</h3>
            <div slot="content">
                <p>
                    For a given task, you can investigate different initial conditions or different models.  
                    Each of them can be explored by creating a new modeling thread for that task.  
                    For example, a task can have a thread that sets a parameter to a low value and 
                    another thread that sets a parameter to a high value.  Or a thread could use 
                    model M1 and another thread that uses model M2.
                </p>
                <p>
                    You can also use threads to investigate possible interventions.  For example, 
                    changing planting windows to an earlier time might increase crop production, 
                    which can be analyzed using an agriculture model. Another possible intervention to 
                    increase crop yield is the use of fertilizer subsidies, which can be studied 
                    by using an economic model.
                </p>   
                <p>
                    Create a new thread, then click on the first of the steps shown.  
                    You can move from one step to the next, and you can always go back and change any of the steps.  
                    At the bottom of the step, there is a notepad where you can document your decisions, 
                    and your notes will be added to the final report so others can undertand your modeling decisions.
                </p>       
            </div>
            <div slot="footer">
                <wl-button @click="${() => hideDialog('threadsHelpDialog', this.shadowRoot)}" inverted flat>Close</wl-button>
            </div>
        </wl-dialog>

        <wl-dialog class="larger" id="tasksHelpDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Tasks</h3>
            <div slot="content">
                <p>
                    Several modeling tasks can be created for a given problem statement. Each modeling task is associated with an indicator relevant to the decision that want to inform or support, or a different time period, or a different driving variable. There are two types of indicators: indices and modeling variables. For example, the problem statement of food security in South Sudan described above, one modeling task can be framed as “Flooding effect on crop production during the growing season”, and a separate modeling task could be “Potential crop production without flooding”. Note that the time frame of the tasks does not necessarily reflect that of the problem statement. In the first example, flooding is relevant to both the planting time and growing season of an agriculture model which would place the start of the simulation earlier than the problem’s time frame. 
                </p>        
            </div>
            <div slot="footer">
                <wl-button @click="${() => hideDialog('tasksHelpDialog', this.shadowRoot)}" inverted flat>Close</wl-button>
            </div>
        </wl-dialog>        
        `;
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
            <h3 slot="header">Task</h3>
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

    _onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        let category = (form.elements["subgoal_subregion_category"] as HTMLSelectElement).value;
        let selector = form.elements["subgoal_subregion"] as HTMLSelectElement
        if (category != this._selectedCategory && selector) {
            this._selectedCategory = category;
            while (selector.options.length > 0) {
                selector.remove(selector.options.length - 1);
            }
            let defOption = document.createElement('option');
            defOption.text = 'None';
            defOption.value = '';
            selector.options.add(defOption);

            this._categorizedRegions[category].forEach((region:Region) => {
                let newOption = document.createElement('option');
                newOption.text = region.name;
                newOption.value = region.id;
                selector.options.add(newOption);
            });
        }
    }

    _renderSubObjectiveForm() {
        return html`
            <p>
            Specify the region, time period, and variables of interest.
            </p>
            <input type="hidden" name="goalid"></input>
            <input type="hidden" name="subgoalid"></input>

            <!-- Variables --> 
            ${renderVariables(this._subgoalEditMode, this._handleResponseVariableChange, this._handleDrivingVariableChange)}
            <br />

            <!-- Intervention Details (if any) -->
            ${this._selectedIntervention ? 
                html`
                    <b>Intervention: ${this._selectedIntervention.name}</b>
                    <div style="font-size:12px;color:#999">
                    ${this._selectedIntervention.description}
                    </div>
                    <div style="height:10px;">&nbsp;</div>
                `
                : ""
            }

            <!-- Sub Region -->
            <div class="formRow">
                <div class="input_half">
                    <label>Region category</label>
                    <select name="subgoal_subregion_category" value="${this._selectedCategory}" @change="${this._onRegionCategoryChange}">
                        <option value="">None</option>
                        ${this._region.categories.map((cat: RegionCategory) => {
                            let subCategories = this._region.subcategories[cat.id] || [];
                            return html`
                            <option value="${cat.id}">${cat.id}</option>
                            ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                                return html`<option value="${subcat.id}">&nbsp;&nbsp;&nbsp;&nbsp;${subcat.id}</option>`;
                            }) : html`
                                <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                            `}`
                        })}
                    </select>
                </div>            

                <div class="input_half">
                    <label>Region</label>
                    <select name="subgoal_subregion">
                        <option value="">None</option>
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
                    <input name="subgoal_from" type="date" value="${fromTimeStampToDateString(this._scenario!.dates.start_date)}">
                </div>
                to
                <div class="input_half">
                    <input name="subgoal_to" type="date" value="${fromTimeStampToDateString(this._scenario!.dates.end_date)}">
                </div>
            </div>
            <br />

            <br />
            <!-- Sub-Objective name -->
            <div class="input_full">
                <label>Description</label>
                <input name="subgoal_name"></input>
            </div>
            <br />
        `;        
    }

    _handleResponseVariableChange() {}
    
    _handleDrivingVariableChange(e: any) {
        let varid = e.target.value;
        this._selectedIntervention = getVariableIntervention(varid);
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

    _getSubgoalVariablesText(subgoal) {
        let response = subgoal.response_variables ? getVariableLongName(subgoal.response_variables[0]) : "";
        let driving = (subgoal.driving_variables && subgoal.driving_variables.length > 0) ? 
            getVariableLongName(subgoal.driving_variables[0]) : "";
        return (driving ? driving + " -> " : "") + response;
    }

    _getSubgoalRegionTimeText(subgoal) {
        let subregionid = (subgoal.subregionid && subgoal.subregionid != "Select") ? subgoal.subregionid : null;
        let regionname = (subregionid && this._regions && this._regions[subregionid]) ? 
                this._regions[subregionid].name : this._region.name;
        let dates = subgoal.dates ? subgoal.dates : this._scenario.dates;
        let startdate = fromTimeStampToDateString(dates!.start_date);
        let enddate = fromTimeStampToDateString(dates!.end_date);
        return regionname + " : " + startdate + " to " + enddate;
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
                pathways: {}
            } as SubGoal;
            let pathway = {
                driving_variables: driving_variable ? [driving_variable] : [],
                response_variables: response_variable ? [response_variable] : [],
                models: {},
                datasets: {},
                model_ensembles: {},
                executable_ensemble_summary: {},
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
        let goalid = null; //(e.currentTarget as HTMLButtonElement).dataset['goalid']; 
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        resetForm(form, null);

        this._subgoalEditMode = false;
        let dates = this._scenario.dates;
        (form.elements["goalid"] as HTMLInputElement).value = goalid!;
        (form.elements["subgoal_subregion"] as HTMLSelectElement).value = this._scenario.subregionid!;
        (form.elements["subgoal_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
        (form.elements["subgoal_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);

        this._selectedIntervention = null;

        showDialog("subObjectiveDialog", this.shadowRoot!);
    }

    _editPathwayDialog(e: Event) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        resetForm(form, null);

        let threadid = (e.currentTarget as HTMLButtonElement).dataset['pathwayid'];
        let dates = this._selectedSubgoal.dates || this._scenario.dates;
        if(threadid) {
            let pathway = this._selectedSubgoal!.pathways[threadid];
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
            let pathway : PathwayInfo = null;
            if(pathwayid) {
                // Edit Pathway Info (Summary)
                pathway = this._selectedSubgoal!.pathways[pathwayid];
                pathway.name = pathway_name;
                pathway.dates = {
                    start_date: firestore.Timestamp.fromDate(new Date(pathway_from)),
                    end_date: firestore.Timestamp.fromDate(new Date(pathway_to))
                };
                updatePathwayInfo(this._scenario!, subgoalid, pathway);
            }
            else {
                // Add Pathway
                let pathway = {
                    name: pathway_name,
                    dates: {
                        start_date: toTimeStamp(pathway_from),
                        end_date: toTimeStamp(pathway_to)
                    },
                    driving_variables: this._selectedSubgoal.driving_variables,
                    response_variables: this._selectedSubgoal.response_variables,
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    executable_ensemble_summary: {},
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
                
                this._subgoalEditMode = false; // FIXME: This should be true
                let dates = subgoal.dates ? subgoal.dates : this._scenario.dates;
                let response_variable = (subgoal.response_variables && subgoal.response_variables.length > 0) ? 
                    subgoal.response_variables[0] : "";
                let driving_variable = (subgoal.driving_variables && subgoal.driving_variables.length > 0) ? 
                    subgoal.driving_variables[0] : "";

                (form.elements["subgoalid"] as HTMLInputElement).value = subgoal.id;
                (form.elements["subgoal_name"] as HTMLInputElement).value = subgoal.name;
                (form.elements["subgoal_subregion"] as HTMLInputElement).value = subgoal.subregionid;
                (form.elements["subgoal_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
                (form.elements["subgoal_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
                (form.elements["response_variable"] as HTMLInputElement).value = response_variable;
                (form.elements["driving_variable"] as HTMLInputElement).value = driving_variable;

                this._selectedIntervention = getVariableIntervention(driving_variable);

                showDialog("subObjectiveDialog", this.shadowRoot!);
            }
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onEditSubGoalSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        if(formElementsComplete(form, ["response_variable", "subgoal_from", "subgoal_to"])) {
            let goalid = (form.elements["goalid"] as HTMLInputElement).value;
            let subgoalid = (form.elements["subgoalid"] as HTMLInputElement).value;
            let subgoal_subregion = (form.elements["subgoal_subregion"] as HTMLInputElement).value;
            let subgoal_name = (form.elements["subgoal_name"] as HTMLInputElement).value;
            let subgoal_from = (form.elements["subgoal_from"] as HTMLInputElement).value;
            let subgoal_to = (form.elements["subgoal_to"] as HTMLInputElement).value;

            // If no subgoalid then this is a new subgoal
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

                // Temporary addition FIXME:
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                subgoal.driving_variables = driving_variable ? [driving_variable] : [],
                subgoal.response_variables = response_variable ? [response_variable] : [],
                // End of Temporary Addition

                updateSubGoal(this._scenario!, subgoal);
                Object.values(subgoal.pathways!).map((pathway: PathwayInfo) => {
                    updatePathwayVariables(this._scenario!.id, pathway.id, 
                        subgoal.driving_variables, subgoal.response_variables);
                })
            }
            else {
                // Add Subgoal
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                subgoal = {
                    name: subgoal_name,
                    subregionid: subgoal_subregion,
                    driving_variables: driving_variable ? [driving_variable] : [],
                    response_variables: response_variable ? [response_variable] : [],
                    dates: {
                        start_date: toTimeStamp(subgoal_from),
                        end_date: toTimeStamp(subgoal_to)
                    },
                    pathways: {}
                } as SubGoal;

                let pathway = {
                    driving_variables: driving_variable ? [driving_variable] : [],
                    response_variables: response_variable ? [response_variable] : [],
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    executable_ensemble_summary: {},
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
            pathways: {}
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
            executable_ensemble_summary: {},
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
            goToPage("modeling/scenario/" + this._scenario!.id);
        }
    }

    _onDeleteSubGoal(e: Event) {
        e.preventDefault();
        e.stopPropagation();        

        //let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid'];
        let subgoalid = (e.currentTarget as HTMLButtonElement).dataset['subgoalid'];
        if(subgoalid) {
            let subgoal = this._scenario_details!.subgoals[subgoalid];
            if(subgoal) {
                if(!confirm("Do you want to delete the task '" + subgoal.name + "' ?"))
                    return false;
                this._deleteSubGoal(null, subgoalid);
            }
        }
        return false;
    }

    _deleteSubGoal(goalid: string, subgoalid: string) {
        if(subgoalid) {
            // Delete its pathways
            let subgoal = this._scenario_details!.subgoals[subgoalid];
            if(subgoal && subgoal.pathways) {
                Object.values(subgoal.pathways).map((pathway) => {
                    this._deletePathway(subgoalid!, pathway.id);
                });
            }
            // Delete subgoal itself
            deleteSubGoal(this._scenario!, goalid, subgoalid);
            showNotification("deleteNotification", this.shadowRoot!);
            goToPage("modeling/scenario/" + this._scenario!.id);
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
            let subgoal = this._scenario_details.subgoals[subgoalid];
            deletePathway(this._scenario!, subgoalid, subgoal.pathways[pathwayid]);
            delete subgoal.pathways[pathwayid];
            goToPage("modeling/scenario/" + this._scenario!.id + "/" + subgoal.id + "/");
        }
    }

    _onSelectSubgoal(e: Event) {
        let subgoalid = (e.currentTarget as HTMLButtonElement).dataset['subgoalid'];
        let subgoal = this._scenario_details!.subgoals[subgoalid!];
        if(subgoal && (!this._selectedSubgoal || (this._selectedSubgoal.id != subgoalid))) {
            // Selecting the first pathway of the subgoal by default
            // TODO: Think about handling multiple pathways in an elegant manner
            let pid = "";
            for(let pathwayid in subgoal.pathways) {
                pid = pathwayid; break;
            }
            // No pathway, go to the subgoal page
            goToPage("modeling/scenario/" + this._scenario!.id + "/" + subgoal.id + "/" + pid);
        }
    }

    _onSelectPathway(e: Event) {
        let pathwayid = (e.currentTarget as HTMLButtonElement).dataset['pathwayid'];
        let subgoal = this._selectedSubgoal;
        if(subgoal) {
            let pathway = subgoal!.pathways[pathwayid!];
            // Selecting the first pathway of the subgoal by default
            // TODO: Think about handling multiple pathways in an elegant manner
            if(pathway)
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

        if(state.regions.sub_region_ids && this._regionid && state.regions.sub_region_ids[this._regionid]) {
            let all_subregionids = state.regions.sub_region_ids[this._regionid];
            this._regions = state.regions.regions;
            if(all_subregionids != this._subRegionIds) {
                let categorized_regions = {
                    "Hydrology": [],
                    "Administrative": [],
                    "Agriculture": []
                };
                all_subregionids.map((regionid) => {
                    let region = this._regions[regionid];
                    if(!categorized_regions[region.region_type]) {
                        categorized_regions[region.region_type] = [];
                    }
                    categorized_regions[region.region_type].push(region);
                })
                Object.keys(categorized_regions).map((regionid) => {
                    let regions = categorized_regions[regionid];
                    regions.sort((a, b) => a.name.localeCompare(b.name));
                })
                this._categorizedRegions = categorized_regions;
                this._subRegionIds = all_subregionids;
            }
        }

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
                if(this.scenarioChanged(this._scenario_details, state.modeling.scenario)) {
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
            else if(!state.modeling.scenario) {
                this._dispatched = false;
            }
        }
        else {
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

    scenarioChanged(olds: ScenarioDetails, news: ScenarioDetails) {
        if(!olds && news)
            return true;
        if(olds && news) {
            let oldupdate = olds.last_update;
            let newupdate = news.last_update;
            if(oldupdate != newupdate) 
                return true;
        }
        return false;        
    }
}
