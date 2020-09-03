import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { PageViewElement } from "../../components/page-view-element";
import { ProblemStatement, Task, ProblemStatementInfo, ThreadInfo } from "./reducers";
import { SharedStyles } from "../../styles/shared-styles";
import { deleteThread, deleteTask, subscribeProblemStatement } from "./actions";

import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import './thread/mint-thread';
import '../../components/task-editor';
import '../../components/thread-editor';

//mport { selectTask, selectThread } from "../actions/ui";
import { getUISelectedTask} from "../../util/state_functions";
import { goToPage } from "../../app/actions";
import { renderNotifications } from "../../util/ui_renders";
import { showDialog, showNotification, hideDialog } from "../../util/ui_functions";
import { toDateString } from "util/date-utils";
import { RegionMap } from "screens/regions/reducers";
import { getVariableLongName } from "offline_data/variable_list";
import { TaskEditor } from "components/task-editor";
import { ThreadEditor } from "components/thread-editor";
import { getLatestEvent } from "util/event_utils";


@customElement('mint-problem-statement')
export class MintProblemStatement extends connect(store)(PageViewElement) {

    @property({type: Object})
    private _regions: RegionMap;

    @property({type: Object})
    private _problem_statement!: ProblemStatement | null;

    @property({type: Object})
    private _selectedTask!: Task | null;

    @property({type: Object})
    private _selectedThreadId!: String | null;

    @property({type: Boolean})
    private _hideTasks: boolean = false;
    
    @property({type: Boolean})
    private _threadListExpanded: boolean = false;

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

            .right_full .card2 {
                height: 100%;
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
        if(!this._problem_statement) {
            return html``;
        }

        let tasks = this._problem_statement.tasks;
        let taskids = Object.keys(tasks);
        taskids = taskids.sort((a, b) => 
            (getLatestEvent(tasks[a].events)?.timestamp < 
            getLatestEvent(tasks[b].events)?.timestamp ? -1 : 1));

        let threads : string[] = []; //Threads id to show
        let totalThreads : number = 0;
        if (this._selectedTask && this._selectedTask.threads) {
            let allThreads = this._selectedTask.threads;
            let orderedKeys = Object.keys(allThreads);
            orderedKeys = orderedKeys.sort((a, b) => 
                (getLatestEvent(allThreads[a].events)?.timestamp < 
                getLatestEvent(allThreads[b].events)?.timestamp ? -1 : 1));

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
                <div class="${this._hideTasks ? 'left_closed' : 'left'}">
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
                        ${Object.keys(this._problem_statement.tasks).map((taskid) => {
                            const task = this._problem_statement!.tasks[taskid];
                            if(task) {
                                let last_event = getLatestEvent(task.events);
                                return html`
                                <li class="active ${this._getTaskClass(task.id!)}">
                                    <div class="cltrow taskrow" id="task_${task.id}"
                                            @click="${this._onSelectTask}"
                                            data-taskid="${task.id}">
                                        <div class="cltmain">
                                            ${this._getTaskVariablesText(task)}
                                            <div class='description'>
                                            ${this._getTaskRegionText(task)}${task.name ? (": " + task.name) :  ""}
                                            </div>
                                            <div class='description'>
                                                ${this._getTaskTimeText(task)}
                                            </div>
                                            ${last_event ? 
                                            html`
                                            <div class='caption'>
                                                ${last_event?.userid} on ${last_event?.timestamp.toDateString()}
                                            </div>` : ""}                                            
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
                <div class="${this._hideTasks ? 'right_full' : 'right'}">
                    <div class="card2">
                    ${this._selectedTask ?
                        html`
                        <div class="clt">
                            <div class="cltrow problem_statementrow">
                                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                                    <wl-title level="4">
                                        Modeling threads
                                        &nbsp;&nbsp;
                                        <wl-icon @click="${() => this._hideTasks = !this._hideTasks}"
                                            class="actionIcon bigActionIcon" style="vertical-align:bottom">
                                            ${!this._hideTasks ? "fullscreen" : "fullscreen_exit"}</wl-icon>
                                    </wl-title>
                                </div>
                                <wl-icon @click="${this._editThreadDialog}" 
                                    class="actionIcon addIcon">note_add</wl-icon>
                            </div>
                            ${this._hideTasks ? '' : html`
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
                                let last_event = getLatestEvent(thread.events);
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
                                            ${last_event ? 
                                            html`
                                            <div class='thread_caption'>
                                                ${last_event?.userid} on ${last_event?.timestamp.toDateString()}
                                            </div>` : ""}
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

        <!-- Editors -->
        <task-editor .problem_statement="${this._problem_statement}" id="taskEditor"></task-editor>
        <thread-editor .task="${this._selectedTask}" id="threadEditor"></thread-editor>

        <!-- Help Dialogs -->
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
        
        ${Object.keys(this._problem_statement.tasks).map((taskid) => {
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

    _getTaskVariablesText(task) {
        let response = task.response_variables ? getVariableLongName(task.response_variables[0]) : "";
        let driving = (task.driving_variables && task.driving_variables.length > 0) ? 
            getVariableLongName(task.driving_variables[0]) : "";
        return (driving ? driving + " -> " : "") + response;
    }

    _getTaskRegionTimeText(task: Task) {
        let regionid = task.regionid;
        let regionname = (regionid && this._regions && this._regions[regionid]) ? 
                this._regions[regionid].name : this._region.name;
        let dates = task.dates ? task.dates : this._problem_statement.dates;
        let startdate = toDateString(dates!.start_date);
        let enddate = toDateString(dates!.end_date);
        return regionname + " : " + startdate + " to " + enddate;
    }

    _getTaskRegionText(task: Task) {
        let regionid = task.regionid;
        let regionname = (regionid && this._regions && this._regions[regionid]) ? 
                this._regions[regionid].name : this._region.name;
        return regionname;
    }

    _getTaskTimeText(task: Task) {
        let dates = task.dates ? task.dates : this._problem_statement.dates;
        let startdate = toDateString(dates!.start_date);
        let enddate = toDateString(dates!.end_date);
        return startdate + " to " + enddate;
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
    

    _addTaskDialog(e: Event) {
        let taskEditor = this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
        taskEditor.addTaskDialog();
    }

    _editTaskDialog(e: Event) {
        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];
        if(taskid) {
            let task = this._problem_statement!.tasks[taskid];
            let taskEditor = this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
            if(task) {
                taskEditor.editTaskDialog(task);
            }
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onDeleteTask(e: Event) {
        e.preventDefault();
        e.stopPropagation();        

        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];
        if(taskid) {
            let task = this._problem_statement!.tasks[taskid];
            if(task) {
                if(!confirm("Do you want to delete the task '" + task.name + "' ?"))
                    return false;
                showNotification("deleteNotification", this.shadowRoot!);
                deleteTask(taskid);
                goToPage("modeling/problem_statement/" + this._problem_statement!.id);
            }
        }
        return false;
    }
    
    _addThreadDialog(e: Event) {
        let threadEditor = this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;
        threadEditor.addThreadDialog();
    }

    _editThreadDialog(e: Event) {
        let threadEditor = this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;
        let threadid = (e.currentTarget as HTMLButtonElement).dataset['threadid'];
        if(threadid) {
            let thread = this._selectedTask!.threads[threadid];
            if(thread) {
                threadEditor.editThreadDialog(thread);
            }
        }
        else {
            threadEditor.addThreadDialog();
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    _onDeleteThread(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if(!confirm("Do you want to delete this thread ?"))
            return;
        
        let threadid = (e.currentTarget as HTMLButtonElement).dataset['threadid'];    
        if(this._selectedTask && threadid) {
            showNotification("deleteNotification", this.shadowRoot!);
            deleteThread(threadid);
            if(this._selectedThreadId == threadid)
                goToPage("modeling/problem_statement/" + this._problem_statement!.id + "/" + this._selectedTask.id + "/");
        }
    }

    _onSelectTask(e: Event) {
        let taskid = (e.currentTarget as HTMLButtonElement).dataset['taskid'];

        let task = this._problem_statement!.tasks[taskid!];
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
        if(state.ui && state.ui.selected_thread_id) 
            this._selectedThreadId = state.ui.selected_thread_id;

        if(state.regions.sub_region_ids && this._regionid && state.regions.sub_region_ids[this._regionid]) {
            this._regions = state.regions.regions;
        }
        
        // If a problem_statement has been selected, fetch problem_statement details
        let problem_statement_id = state.ui!.selected_problem_statement_id;
        let user = state.app.user;

        if(problem_statement_id && user) {
            // If we don't have the right details for the problem_statement, make a call to fetch the details
            if(!this._dispatched && (!state.modeling.problem_statement || (state.modeling.problem_statement.id != problem_statement_id))) {
                // Reset the problem_statement details
                this._problem_statement = null;
                this._problem_statement = null;
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
                this._problem_statement = state.modeling.problem_statement;
            }
            else if(!state.modeling.problem_statement) {
                this._dispatched = false;
            }
        }
        else {
            this._hideTasks = false;
        }

        if(state.modeling.problem_statement && state.modeling.problem_statement.tasks) {
            // If a task has been selected
            this._selectedTask = getUISelectedTask(state)!;
        }

        if(state.modeling && state.ui && state.ui.selected_problem_statement_id == null) {
            if(state.modeling.problem_statement?.unsubscribe) {
                console.log("Unsubscribing to problem_statement " + state.modeling.problem_statement.id);
                state.modeling.problem_statement.unsubscribe();
            }
            state.modeling.problem_statement = null;
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
