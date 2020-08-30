import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { PageViewElement } from "../../components/page-view-element";
import { ProblemStatementDetails, Task, Thread, ProblemStatement, ThreadInfo, TaskList, ThreadList, TaskEvent, ThreadEvent } from "./reducers";
import { SharedStyles } from "../../styles/shared-styles";
import { addThread, deleteThread, deleteTask, subscribeProblemStatement, updateTask, updateThreadVariables, addTaskWithThread } from "./actions";

import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import './thread/mint-thread';

//mport { selectTask, selectThread } from "../actions/ui";
import { getUISelectedTask, getUISelectedThread, getCategorizedRegions } from "../../util/state_functions";
import { goToPage } from "../../app/actions";
import { renderVariables, renderNotifications } from "../../util/ui_renders";
import { resetForm, showDialog, formElementsComplete, showNotification, hideDialog, hideNotification } from "../../util/ui_functions";
import { firestore } from "firebase";
import { toTimeStamp, fromTimeStampToDateString } from "util/date-utils";
import { RegionMap, Region, RegionCategory } from "screens/regions/reducers";
import { getVariableLongName, getVariableIntervention } from "offline_data/variable_list";
import { getCreateEvent, getUpdateEvent } from "../../util/graphql_adapter";
import { getLatestEventOfType, getLatestEvent } from "util/event_utils";
import { IdMap } from "app/reducers";


@customElement('mint-problem-statement')
export class MintProblemStatement extends connect(store)(PageViewElement) {

    @property({type: Object})
    private _regions: RegionMap;

    @property({type: Object})
    private _regionCategories: IdMap<RegionCategory>;

    @property({type: Array})
    private _subRegionIds: string[];

    @property({type: Object})
    private _categorizedRegions: any; 

    @property({type: String})
    private _selectedCategory: string = '';

    @property({type: Object})
    private _problem_statement_details!: ProblemStatementDetails | null;

    @property({type: Object})
    private _problem_statement!: ProblemStatement | null;

    @property({type: Object})
    private _selectedTask!: Task | null;

    @property({type: Object})
    private _selectedThreadId!: String | null;

    @property({type: Boolean})
    private _hideObjectives: boolean = false;
    
    @property({type: Boolean})
    private _threadListExpanded: boolean = false;
    
    @property({type: Boolean})
    private _taskEditMode: boolean = false;

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
        if(!this._problem_statement_details) {
            return html``;
        }

        let threads : string[] = []; //Threads id to show
        let totalThreads : number = 0;
        if (this._selectedTask && this._selectedTask.threads) {
            let orderedKeys : string[] = Object.values(this._selectedTask.threads)
                    .sort((a,b) => a.name.localeCompare(b.name))
                    .map(pw => pw.id);
            totalThreads = orderedKeys.length;
            if (totalThreads > 3 && !this._threadListExpanded) {
                let index = orderedKeys.indexOf(this._selectedThreadId as string);
                if (index == 0) {
                    threads.push(orderedKeys[index]);
                    threads.push(orderedKeys[index+1]);
                    threads.push(orderedKeys[index+2]);
                } else if (index + 1 == totalThreads) {
                    threads.push(orderedKeys[index-2]);
                    threads.push(orderedKeys[index-1]);
                    threads.push(orderedKeys[index]);
                } else {
                    threads.push(orderedKeys[index-1]);
                    threads.push(orderedKeys[index]);
                    threads.push(orderedKeys[index+1]);
                }
            } else {
                threads = orderedKeys;
            }
        }
        return html`
            <!-- Top ProblemStatement Heading -->
            <div class="cltrow problem_statementrow">
                <wl-button flat inverted @click="${()=> goToPage('modeling')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain navtop">
                    <wl-title level="3">${this._problem_statement!.name}</wl-title>
                </div>
            </div>

            <!-- Two Columns Section -->
            <div class="twocolumns">

                <!-- Left Column : Tree of Objectives/Subobjectives -->
                <div class="${this._hideObjectives ? 'left_closed' : 'left'}">
                    <div class="clt">
                        <div class="cltrow_padded problem_statementrow">
                            <div class="cltmain">
                                <wl-title level="4" style="margin: 0px">
                                    TASKS
                                </wl-title>
                            </div>
                            <wl-icon @click="${this._addTaskDialog}" 
                                class="actionIcon addIcon">note_add</wl-icon>
                        </div>
                        <div style="font-size:12.5px; color: #888; padding:5px; padding-left: 10px; padding-top:0px;">
                            Several modeling tasks can be created for a given problem statement. 
                            <a style="cursor:pointer" 
                                @click="${() => showDialog('tasksHelpDialog', this.shadowRoot)}">Read more</a>
                        </div>
                        <ul>
                        ${Object.keys(this._problem_statement_details.tasks).map((taskid) => {
                            const task = this._problem_statement_details!.tasks[taskid];
                            if(task) {
                                return html`
                                <li class="active ${this._getTaskClass(task.id!)}">
                                    <div class="cltrow taskrow" id="task_${task.id}"
                                            @click="${this._onSelectTask}"
                                            data-taskid="${task.id}">
                                        <div class="cltmain">
                                            ${this._getTaskVariablesText(task)}
                                            ${task.name ? 
                                                html `<div class='description'>${task.name}</div>` : ""
                                            }
                                            <div class='description'>
                                                ${this._getTaskRegionTimeText(task)}
                                            </div>
                                        </div>
                                        <wl-icon @click="${this._editTaskDialog}" 
                                            data-taskid="${task.id}"
                                            class="actionIcon editIcon">edit</wl-icon>
                                        <wl-icon @click="${this._onDeleteTask}" 
                                            data-taskid="${task.id}"
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

                <!-- Right Column : Thread Tree + Thread details -->
                <div class="${this._hideObjectives ? 'right_full' : 'right'}">
                    <div class="card2">
                    ${this._selectedTask ?
                        html`
                        <div class="clt">
                            <div class="cltrow problem_statementrow">
                                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                                    <wl-title level="4">
                                        Modeling threads
                                        &nbsp;&nbsp;
                                        <wl-icon @click="${() => this._hideObjectives = !this._hideObjectives}"
                                            class="actionIcon bigActionIcon" style="vertical-align:bottom">
                                            ${!this._hideObjectives ? "fullscreen" : "fullscreen_exit"}</wl-icon>
                                    </wl-title>
                                </div>
                                <wl-icon @click="${this._editThreadDialog}" 
                                    class="actionIcon addIcon">note_add</wl-icon>
                            </div>
                            ${this._hideObjectives ? '' : html`
                            <div style="font-size:12.5px; color: #888; padding: 5px; padding-top: 0px">
                                For a given task, you can investigate different initial conditions or different models.  
                                Each of them can be explored by creating a new modeling thread for that task.
                                <a style="cursor:pointer" 
                                    @click="${() => showDialog('threadsHelpDialog', this.shadowRoot)}">Read more</a>
                            </div>
                            <ul>
                            ${threads.map(pid => this._selectedTask.threads[pid]).map((thread: ThreadInfo, i: number) => {
                                if(!thread) {
                                    return "";
                                }
                                let pname = thread.name ? thread.name : this._selectedTask.name;
                                return html`
                                    <li class="active ${this._getThreadClass(thread.id!)}">
                                        <div class="cltrow taskrow" id="thread_${thread.id}"
                                                @click="${this._onSelectThread}"
                                                data-threadid="${thread.id}">
                                            <div class="cltmain">
                                                ${pname ? pname : 
                                                    html`<div style="color:#888">Default thread</div>`
                                                }
                                            </div>
                                            ${i != (threads.length-1) || totalThreads < 4 || this._threadListExpanded ? html`
                                            <wl-icon @click="${this._editThreadDialog}" 
                                                data-threadid="${thread.id}"
                                                class="actionIcon editIcon">edit</wl-icon>
                                            <wl-icon @click="${this._onDeleteThread}" 
                                                data-threadid="${thread.id}"
                                                class="actionIcon deleteIcon">delete</wl-icon>`
                                            : html`
                                            <a @click="${(e) => {e.stopPropagation(); this._threadListExpanded = true}}">
                                                <b>(Show more)</b>
                                            </a>
                                            `}
                                        </div>
                                    </li>
                                `;
                            })}
                            ${this._threadListExpanded ? html`
                                <li class="active">
                                    <div class="" @click="${() => {this._threadListExpanded = false}}"
                                         style="text-align: right;">
                                        <b>(Show less)</b>
                                    </div>
                                </li>
                            ` : ''}
                            </ul>
                            `}
                        </div>

                        <mint-thread ?active="${this._selectedTask}"
                            .problem_statement=${this._problem_statement}></mint-thread>
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
        ${this._renderTaskDialog()}
        ${this._renderThreadDialog()}
        ${this._renderHelpDialogs()}
        `;
    }

    _renderTooltips() {
        return html`
        <!-- Tooltips for the addPaProblemStatement -->
        <wl-tooltip anchor=".problem_statementrow .addIcon" 
            .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" fixed
            anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
            Add Task
        </wl-tooltip>
        
        ${Object.keys(this._problem_statement_details.tasks).map((taskid) => {
            return html`
            <!-- Tooltips for the sub-goal -->
            <wl-tooltip anchor="#task_${taskid} .editIcon" 
                .anchorOpenEvents="${["mouseover"]}" .anchorCloseEvents="${["mouseout"]}" 
                fixed anchorOriginX="center" anchorOriginY="bottom" transformOriginX="center">
                Edit Task
            </wl-tooltip>                
            <wl-tooltip anchor="#task_${taskid} .deleteIcon" 
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

    _renderTaskDialog() {
        return html`
        <wl-dialog id="subObjectiveDialog" fixed backdrop blockscrolling>
            <h3 slot="header">Task</h3>
            <div slot="content">
                <form id="subObjectiveForm">
                   ${this._renderSubObjectiveForm()}
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onEditTaskCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onEditTaskSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        let category = (form.elements["task_subregion_category"] as HTMLSelectElement).value;
        let selector = form.elements["task_subregion"] as HTMLSelectElement
        if (category != this._selectedCategory && selector) {
            this._selectedCategory = category;
            while (selector.options.length > 0) {
                selector.remove(selector.options.length - 1);
            }
            let defOption = document.createElement('option');
            defOption.text = 'None';
            defOption.value = '';
            selector.options.add(defOption);

            (this._categorizedRegions[category]||[]).forEach((region:Region) => {
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
            <input type="hidden" name="taskid"></input>

            <!-- Variables --> 
            ${renderVariables(this._taskEditMode, this._handleResponseVariableChange, this._handleDrivingVariableChange)}
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
                    <select name="task_subregion_category" value="${this._selectedCategory}" @change="${this._onRegionCategoryChange}">
                        <option value="">None</option>
                        ${Object.values(this._regionCategories).map((cat: RegionCategory) => {
                            let subCategories = cat.subcategories || [];
                            return html`
                            <option value="${cat.id}">${cat.name}</option>
                            ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                                if(this._categorizedRegions[subcat.id])
                                    return html`<option value="${subcat.id}">&nbsp;&nbsp;&nbsp;&nbsp;${subcat.name}</option>`;
                            }) : html`
                                <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                            `}`
                        })}
                    </select>
                </div>            

                <div class="input_half">
                    <label>Region</label>
                    <select name="task_subregion">
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
                    <input name="task_from" type="date" value="${this._problem_statement!.dates?.start_date}">
                </div>
                to
                <div class="input_half">
                    <input name="task_to" type="date" value="${this._problem_statement!.dates?.end_date}">
                </div>
            </div>
            <br />

            <br />
            <!-- Sub-Objective name -->
            <div class="input_full">
                <label>Description</label>
                <input name="task_name"></input>
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
                <input type="hidden" name="threadid"></input>
                
                <!-- Sub-Objective name -->
                <div class="input_full">
                    <label>Modeling thread name*</label>
                    <input name="thread_name"></input>
                </div>
                <br />

              <div class="input_full">
                <label>Notes</label>
                <textarea style="color:unset; font: unset;" name="thread_notes" rows="4"></textarea>
              </div>
              <br/>

                <!-- Time Period -->
                <div class="input_full">
                    <label>Time Period</label>
                </div>
                <div class="formRow">
                    <div class="input_half">
                        <input name="thread_from" type="date">
                    </div>
                    to
                    <div class="input_half">
                        <input name="thread_to" type="date">
                    </div>
                </div>
                <br />
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onEditThreadCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onEditThreadSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _getTaskVariablesText(task) {
        let response = task.response_variables ? getVariableLongName(task.response_variables[0]) : "";
        let driving = (task.driving_variables && task.driving_variables.length > 0) ? 
            getVariableLongName(task.driving_variables[0]) : "";
        return (driving ? driving + " -> " : "") + response;
    }

    _getTaskRegionTimeText(task) {
        let regionid = (task.regionid && task.regionid != "Select") ? task.regionid : null;
        let regionname = (regionid && this._regions && this._regions[regionid]) ? 
                this._regions[regionid].name : this._region.name;
        let dates = task.dates ? task.dates : this._problem_statement.dates;
        let startdate = dates!.start_date;
        let enddate = dates!.end_date;
        return regionname + " : " + startdate + " to " + enddate;
    }

    _addTaskDialog(e: Event) {
        let goalid = null; //(e.currentTarget as HTMLButtonElement).dataset['goalid']; 
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        resetForm(form, null);

        this._taskEditMode = false;
        let dates = this._problem_statement.dates;
        (form.elements["goalid"] as HTMLInputElement).value = goalid!;
        (form.elements["task_subregion"] as HTMLSelectElement).value = this._problem_statement.regionid!;
        (form.elements["task_from"] as HTMLInputElement).value = "" + dates?.start_date;
        (form.elements["task_to"] as HTMLInputElement).value = "" + dates?.end_date;

        this._selectedIntervention = null;

        showDialog("subObjectiveDialog", this.shadowRoot!);
    }

    _editThreadDialog(e: Event) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        resetForm(form, null);

        let threadid = (e.currentTarget as HTMLButtonElement).dataset['threadid'];
        let dates = this._selectedTask.dates || this._problem_statement.dates;
        let notes = "";
        if(threadid) {
            let thread = this._selectedTask.threads[threadid];
            if(thread) {
                if(thread.dates)
                    dates = thread.dates;
                (form.elements["threadid"] as HTMLInputElement).value = thread.id;
                (form.elements["thread_name"] as HTMLInputElement).value = thread.name || this._selectedTask.name;
                
                let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
                notes = threadEvent.notes;
            }
        }
        (form.elements["thread_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
        (form.elements["thread_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
        (form.elements["thread_notes"] as HTMLInputElement).value = notes;

        showDialog("threadDialog", this.shadowRoot!);
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onEditThreadSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        if(formElementsComplete(form, ["thread_name"])) {
            let threadid = (form.elements["threadid"] as HTMLInputElement).value;
            let taskid = this._selectedTask.id;
            let thread_name = (form.elements["thread_name"] as HTMLInputElement).value;
            let thread_from = (form.elements["thread_from"] as HTMLInputElement).value;
            let thread_to = (form.elements["thread_to"] as HTMLInputElement).value;
            let thread_notes = (form.elements["thread_notes"] as HTMLInputElement).value;

            // If no taskid, but goalid is there, then this is a new task
            let thread : ThreadInfo = null;
            if (threadid) {
                // Edit Thread Info (Summary)
                thread = this._selectedTask!.threads[threadid];
                thread.name = thread_name;
                thread.dates = {
                    start_date: firestore.Timestamp.fromDate(new Date(thread_from)),
                    end_date: firestore.Timestamp.fromDate(new Date(thread_to))
                };
                //updateThreadInfo(thread);
            }
            else {
                // Add Thread
                let thread = {
                    name: thread_name,
                    dates: {
                        start_date: toTimeStamp(thread_from),
                        end_date: toTimeStamp(thread_to)
                    },
                    driving_variables: this._selectedTask.driving_variables,
                    response_variables: this._selectedTask.response_variables,
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    execution_summary: {},
                    events: [getCreateEvent(thread_notes)]
                } as Thread;

                addThread(this._selectedTask, thread);
            }

            showNotification("saveNotification", this.shadowRoot!);
            hideDialog("threadDialog", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
    }

    _onEditThreadCancel() {
        hideDialog("threadDialog", this.shadowRoot!);
    }
    
    _editTaskDialog(e: Event) {
        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];
        if(taskid) {
            let task = this._problem_statement_details!.tasks[taskid];
            if(task) {
                let form = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
                resetForm(form, null);
                
                this._taskEditMode = false; // FIXME: This should be true
                let dates = task.dates ? task.dates : this._problem_statement.dates;
                let response_variable = (task.response_variables && task.response_variables.length > 0) ? 
                    task.response_variables[0] : "";
                let driving_variable = (task.driving_variables && task.driving_variables.length > 0) ? 
                    task.driving_variables[0] : "";

                (form.elements["taskid"] as HTMLInputElement).value = task.id;
                (form.elements["task_name"] as HTMLInputElement).value = task.name;
                (form.elements["task_subregion"] as HTMLInputElement).value = task.regionid;
                (form.elements["task_from"] as HTMLInputElement).value = fromTimeStampToDateString(dates.start_date);
                (form.elements["task_to"] as HTMLInputElement).value = fromTimeStampToDateString(dates.end_date);
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

    _onEditTaskSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#subObjectiveForm")!;
        if(formElementsComplete(form, ["response_variable", "task_from", "task_to"])) {
            let goalid = (form.elements["goalid"] as HTMLInputElement).value;
            let taskid = (form.elements["taskid"] as HTMLInputElement).value;
            let task_subregion = (form.elements["task_subregion"] as HTMLInputElement).value;
            let task_name = (form.elements["task_name"] as HTMLInputElement).value;
            let task_from = (form.elements["task_from"] as HTMLInputElement).value;
            let task_to = (form.elements["task_to"] as HTMLInputElement).value;

            // If no taskid then this is a new task
            let task : Task = null;
            if(taskid) {
                // Edit Task 
                task = this._problem_statement_details!.tasks[taskid];
                task.name = task_name;
                task.regionid = task_subregion;
                task.dates = {
                    start_date: firestore.Timestamp.fromDate(new Date(task_from)),
                    end_date: firestore.Timestamp.fromDate(new Date(task_to))
                };

                // Temporary addition FIXME:
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                task.driving_variables = driving_variable ? [driving_variable] : [],
                task.response_variables = response_variable ? [response_variable] : [],
                task.events.push(getUpdateEvent(task_name) as TaskEvent);
                // End of Temporary Addition

                updateTask(task);
                Object.values(task.threads!).map((thread: ThreadInfo) => {
                    updateThreadVariables(this._problem_statement!.id, thread.id, 
                        task.driving_variables, task.response_variables);
                })
            }
            else {
                // Add Task
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                task = {
                    name: task_name,
                    regionid: task_subregion,
                    driving_variables: driving_variable ? [driving_variable] : [],
                    response_variables: response_variable ? [response_variable] : [],
                    dates: {
                        start_date: toTimeStamp(task_from),
                        end_date: toTimeStamp(task_to)
                    },
                    threads: {},
                    events: [getCreateEvent(task_name) as TaskEvent]
                } as Task;

                let thread = {
                    driving_variables: driving_variable ? [driving_variable] : [],
                    response_variables: response_variable ? [response_variable] : [],
                    dates: {
                        start_date: toTimeStamp(task_from),
                        end_date: toTimeStamp(task_to)
                    },
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    execution_summary: {},
                    events: [getCreateEvent("Default Thread Created") as ThreadEvent]
                } as Thread

                addTaskWithThread(this._problem_statement!, task, thread);
            }

            showNotification("saveNotification", this.shadowRoot!);
            hideDialog("subObjectiveDialog", this.shadowRoot!);
        }
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }
    }

    _onEditTaskCancel() {
        hideDialog("subObjectiveDialog", this.shadowRoot!);
    }

    _onDeleteTask(e: Event) {
        e.preventDefault();
        e.stopPropagation();        

        //let goalid = (e.currentTarget as HTMLButtonElement).dataset['goalid'];
        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];
        if(taskid) {
            let task = this._problem_statement_details!.tasks[taskid];
            if(task) {
                if(!confirm("Do you want to delete the task '" + task.name + "' ?"))
                    return false;
                this._deleteTask(null, taskid);
            }
        }
        return false;
    }

    _deleteTask(goalid: string, taskid: string) {
        if(taskid) {
            deleteTask(taskid);
            showNotification("deleteNotification", this.shadowRoot!);
            goToPage("modeling/problem_statement/" + this._problem_statement!.id);
        }
    }

    _onDeleteThread(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if(!confirm("Do you want to delete this thread ?"))
            return;
        
        let threadid = (e.currentTarget as HTMLButtonElement).dataset['threadid'];    
        if(this._selectedTask && threadid) {
            this._deleteThread(this._selectedTask.id!, threadid);
            showNotification("deleteNotification", this.shadowRoot!);
        }
    }

    _deleteThread(taskid: string, threadid: string) {
        if(taskid && threadid) {
            let task = this._problem_statement_details.tasks[taskid];
            deleteThread(threadid);
            goToPage("modeling/problem_statement/" + this._problem_statement!.id + "/" + task.id + "/");
        }
    }

    _onSelectTask(e: Event) {
        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];

        let task = this._problem_statement_details!.tasks[taskid!];
        if(task && (!this._selectedTask || (this._selectedTask.id != taskid))) {     
            let threadid = "";
            for(let pathwayid in task.threads) {
                threadid = pathwayid; break;
            }
            // Go to the task page
            goToPage("modeling/problem_statement/" + this._problem_statement!.id + "/" + task.id + "/" + threadid);
        }
    }
       
    _onSelectThread(e: Event) {
        let threadid = (e.currentTarget as HTMLButtonElement).dataset['threadid'];
        let task = this._selectedTask;
        if(task) {
            let thread = this._selectedTask.threads[threadid!];
            // Selecting the first thread of the task by default
            // TODO: Think about handling multiple threads in an elegant manner
            if(thread && (!this._selectedThreadId || (this._selectedThreadId != threadid))) {
                goToPage("modeling/problem_statement/" + this._problem_statement!.id + "/" + task.id + "/" + thread.id);
            }
        }
    }

    _getTaskClass(taskid:string) {
        if(this._selectedTask && this._selectedTask.id! == taskid) {
            return "highlighted";
        }
        return "";
    }

    _getThreadClass(threadid:string) {
        if(this._selectedThreadId == threadid) {
            return "highlighted";
        }
        return "";
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        super.setRegionId(state);
        if(state.ui && state.ui.selected_thread_id) 
            this._selectedThreadId = state.ui.selected_thread_id;

        if(state.regions.categories && !this._regionCategories) {
            this._regionCategories = state.regions.categories;
        }
        if(state.regions.sub_region_ids && this._regionid && state.regions.sub_region_ids[this._regionid]) {
            let all_regionids = state.regions.sub_region_ids[this._regionid];
            this._regions = state.regions.regions;
            if(all_regionids != this._subRegionIds) {
                this._subRegionIds = all_regionids;
                this._categorizedRegions = getCategorizedRegions(state);
            }
        }

        // If a problem_statement has been selected, fetch problem_statement details
        let problem_statement_id = state.ui!.selected_problem_statement_id;
        let user = state.app.user;

        if(problem_statement_id && user) {
            // If we don't have the right details for the problem_statement, make a call to fetch the details
            if(!this._dispatched && (!state.modeling.problem_statement || (state.modeling.problem_statement.id != problem_statement_id))) {
                // Reset the problem_statement details
                this._problem_statement = null;
                this._problem_statement_details = null;
                this._selectedTask = null;
                this._selectedThreadId = null;
                this._dispatched = true;

                // Unsubscribe to any existing problem_statement details listener
                if(state.modeling.problem_statement && state.modeling.problem_statement.unsubscribe) {
                    console.log("Unsubscribing to problem_statement " + state.modeling.problem_statement.id);
                    state.modeling.problem_statement.unsubscribe();
                }
                console.log("Subscribing to problem_statement " + problem_statement_id);
                // Make a subscription call for the new problem_statement id
                store.dispatch(subscribeProblemStatement(problem_statement_id));

                return;
            }

            // If we've already got the details in the state
            // - extract details from the state
            if(state.modeling.problem_statement && 
                state.modeling.problem_statement.id == problem_statement_id && 
                state.modeling.problem_statement.changed) {

                this._dispatched = false;
                state.modeling.problem_statement.changed = false;
                this._problem_statement_details = state.modeling.problem_statement;
                
                this._problem_statement = {
                    id: this._problem_statement_details.id,
                    dates: this._problem_statement_details.dates,
                    name: this._problem_statement_details.name,
                    regionid: this._problem_statement_details.regionid,
                    events: this._problem_statement_details.events
                } as ProblemStatement;
            }
            else if(!state.modeling.problem_statement) {
                this._dispatched = false;
            }
        }
        else {
            this._hideObjectives = false;
        }

        if(state.modeling.problem_statement && state.modeling.problem_statement.tasks) {
            // If a task has been selected
            this._selectedTask = getUISelectedTask(state)!;
        }

        if(!user && state.modeling.problem_statement) {
            // Logged out, Unsubscribe
            if(state.modeling.problem_statement.unsubscribe) {
                console.log("Unsubscribing to problem_statement " + state.modeling.problem_statement.id);
                state.modeling.problem_statement.unsubscribe();
            }
            state.modeling.problem_statement = undefined;
        }
    }
}
