import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";
import { PageViewElement } from "../../components/page-view-element";
import { ProblemStatement, Task, ThreadInfo } from "./reducers";
import { SharedStyles } from "../../styles/shared-styles";
import { deleteThread, deleteTask, subscribeProblemStatement } from "./actions";

import "weightless/icon";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import "components/loading-dots";
import "./thread/mint-thread";
import "../../components/task-editor";
import "../../components/thread-editor";

import { getUISelectedTask } from "../../util/state_functions";
import { goToPage } from "../../app/actions";
import { renderNotifications } from "../../util/ui_renders";
import {
  showDialog,
  showNotification,
  hideDialog,
} from "../../util/ui_functions";
import { toDateString, toDateTimeString } from "util/date-utils";
import { RegionMap } from "screens/regions/reducers";
import { TaskEditor } from "components/task-editor";
import { ThreadEditor } from "components/thread-editor";
import { getLatestEvent } from "util/event_utils";
import { getUserPermission } from "util/permission_utils";
import { VariableMap } from "@apollo/client/core/LocalState";
import { selectTask, selectThread } from "app/ui-actions";

@customElement("mint-problem-statement")
export class MintProblemStatement extends connect(store)(PageViewElement) {
  @property({ type: Object })
  private _regions: RegionMap;

  @property({ type: Object })
  private _problem_statement!: ProblemStatement | null;

  @property({ type: Object })
  private _selectedTask!: Task | null;

  @property({ type: String })
  private _selectedThreadId!: String | null;

  @property({ type: Boolean })
  private _hideTasks: boolean = false;

  @property({ type: Boolean })
  private _threadListExpanded: boolean = false;

  private _dispatched: boolean = false;

  @property({ type: Object })
  private _variableMap: VariableMap = {};

  static get styles() {
    return [
      SharedStyles,
      css`
        .subtask-desc {
          color:rgb(6, 108, 67) !important;
        }

        .simple-breadcrumbs {
          padding: 6px 12px 4px 12px;
          border-bottom:1px solid #f0f0f0;
        }

        div.simple-breadcrumbs > a {
          max-width: calc(-190px + 30vw);
        }

        .left-fixed {
          max-height: calc(100vh - 192px - 3em);
          overflow-y:auto;
          overflow-x:hidden;
        }

        .pslist {
          max-height: calc(100vh - 365px);
          overflow-y:auto;
          overflow-x:hidden;
        }

        .taskrow {
          display: grid;
          grid-template-columns: 36px auto;
        }

        .taskrow > div:first-child {
          display:flex;
          flex-direction:column;
          align-items: center;
          justify-content: space-around;
          height:100%;
        }

        .taskrow > div:first-child > wl-icon {
          --icon-size: 24px;
        }

        .clt > ul {
          padding-left: 12px;
          margin-top: unset;
        }

        .clt > ul > li::before, .clt > ul > li::after {
          content: unset;
        }

        ul.subtask-list > li::before, ul.subtask-list > li::after {
          content: unset;
        }

        li.subtask-desc {
          display:grid;
          grid-template-columns: 28px auto 40px;
        }

        li.subtask-desc > div:last-child {
          display:flex;
          align-items:center;
          justify-content: flex-end;
        }

        .task-content {
          display:flex;
          align-items: flex-start;
        }
        
        .highlighted > div {
          background-color: #f0f0f0;
          font-weight: bold;
          font-weight: bolder;
        }

        .taskname {
          overflow: hidden;
          text-overflow: ellipsis;
          text-wrap: nowrap;
        }

        wl-progress-bar {
          width: 300px;
        }

        .card2 {
          margin: 0px;
          left: 0px;
          right: 0px;
          padding: 10px;
          padding-top: 5px;
          height: calc(100% - 15px);
          background: #ffffff;
        }

        .right_full .card2 {
          height: calc(100% - 15px);
        }

        .twocolumns {
          position: absolute;
          top: calc(100px + 1em);
          bottom: calc(50px + 1em);
          left: 1em;
          right: 1em;
          display: flex;
          border: 1px solid #f0f0f0;
        }

        .left {
          width: 30%;
          padding-top: 0px;
          border-right: 1px solid #f0f0f0;
          padding-right: 5px;
          overflow: auto;
          height: 100%;
        }

        .left_closed {
          width: 0px;
          overflow: hidden;
        }

        .right,
        .right_full {
          width: 70%;
          padding-top: 0px;
          overflow: auto;
          height: 100%;
        }

        .right_full {
          width: 100%;
        }

        .header_description {
          padding-left: 5px;
          padding-bottom: 8px;
          font-size: 10px;
          color: #999;
        }

        h2 {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
        }

        .small-screen {
          display: none;
        }

        .new-thread {
          text-align: center;
          font-weight: normal;
          padding: 10px;
        }

        .new-thread:hover {
          font-weight: bold;
        }

        @media (max-width: 1024px) {
          .twocolumns {
            top: 100px;
            bottom: 5px;
            left: 5px;
            right: 5px;
            background-color: white;
          }

          div.simple-breadcrumbs > a {
            max-width: calc(-190px + 100vw);
          }
          .left {
            width: 100%;
            border-right: 0px;
            transition: width 0.2s;
          }
          .left_sm_closed {
            width: 0px;
            overflow: hidden;
            transition: width 0.2s;
            border-width: 0px;
            padding-right: 0px;
          }
          .right {
            width: 0px;
            transition: width 0.2s;
          }
          .right_sm_full {
            width: 100%;
            transition: width 0.2s;
          }
          wl-title {
            --title-font-size-level-3: 14px;
            line-height: 16px;
          }
          .small-screen wl-icon {
            --icon-size: 12px;
          }
          .small-screen {
            display: inline-block;
          }
          .card2 {
            border: 0px;
            padding: 0px;
          }
        }
      `,
    ];
  }

  protected firstUpdated() {
    this.addEventListener("on-thread-maximize", (e: Event) => {
      this._hideTasks = e["detail"];
    });
  }

  protected render() {
    if (this._dispatched)
      return html`<wl-progress-spinner class="loading"></wl-progress-spinner>`;

    if (!this._problem_statement) {
      return html``;
    }

    let tasks = this._problem_statement.tasks;
    let taskids = Object.keys(tasks);
    taskids.sort((a, b) =>
      getLatestEvent(tasks[a].events)?.timestamp >
      getLatestEvent(tasks[b].events)?.timestamp
        ? -1
        : 1
    );

    let threads: string[] = []; //Threads id to show
    let totalThreads: number = 0;
    if (this._selectedTask && this._selectedTask.threads) {
      let allThreads = this._selectedTask.threads;
      let orderedKeys = Object.keys(allThreads);
      orderedKeys.sort((a, b) =>
        getLatestEvent(allThreads[a].events)?.timestamp >
        getLatestEvent(allThreads[b].events)?.timestamp
          ? -1
          : 1
      );

      totalThreads = orderedKeys.length;
      threads = orderedKeys;
    }

    let selectedThread =
      this._selectedThreadId &&
      this._selectedTask &&
      this._selectedTask.threads[this._selectedThreadId.toString()]
        ? this._selectedTask.threads[this._selectedThreadId.toString()]
        : null;

    let problem_permissions = getUserPermission(
      this._problem_statement.permissions,
      this._problem_statement.events
    );
    let selected_task_permissions = getUserPermission(
      this._selectedTask?.permissions ?? [],
      this._selectedTask?.events ?? []
    );

    let taskEditor = this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
    let threadEditor =
      this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;

    //return html`
    //        <!-- Top ProblemStatement Heading -->
    //        <div class="cltrow problem_statementrow">
    //            <wl-button flat inverted @click="${() =>
    //              true || !selectedThread
    //                ? goToPage("modeling")
    //                : () => this._deselectTasks()}">
    //                <wl-icon>arrow_back_ios</wl-icon>
    //            </wl-button>
    //            <div class="cltmain navtop">
    //                <wl-title level="3" ?nowrap=${true}>
    //                    ${this._problem_statement!.name}
    //                    ${
    //                      this._selectedTask && this._selectedTask.name
    //                        ? " - " + this._selectedTask.name
    //                        : ""
    //                    } 
    //                    ${
    //                      selectedThread
    //                        ? ": " +
    //                          (!selectedThread.name ||
    //                          selectedThread.name == this._selectedTask.name
    //                            ? "Default thread"
    //                            : selectedThread.name)
    //                        : ""
    //                    }
    //                </wl-title>
    //            </div>
    //            <div style="display:flex; align-items: center; border: 1px solid; border-radius: 6px; padding: 3px 7px; background-color:aliceblue; color:black;">
    //                <wl-icon style="margin-right: 4px; color: cadetblue;">info</wl-icon>
    //                Models are shown for demonstration purposes and have not been validated
    //            </div>
    //        </div>

    return html`
      <div class="twocolumns">
        <!-- Left Column : List of Tasks -->
        <div class="${this._hideTasks ? "left_closed" : "left"} 
                    ${this._selectedTask ? "left_sm_closed" : ""}">
          <div class="clt left-fixed">
            <div class="cltrow_padded problem_statementrow">
              <div class="cltmain">
                <div class="simple-breadcrumbs">
                  <a href="${this._regionid}/modeling">Problem Statements</a>
                  <span>&gt;</span>
                  <a selected>
                    ${this._problem_statement.name || "Tasks and sub-tasks"}
                  </a>
                </div>
              </div>
            </div>
            <div style="font-size:12.5px; color: #888; padding: 0 12px;">
                Several modeling tasks can be created for a given problem statement. Each task can have multiple sub-tasks.
                <a style="cursor:pointer" @click="${() => showDialog( "tasksHelpDialog", this.shadowRoot)}">
                  Read more
                </a>
            </div>
            <ul style="margin-top:1em;" class="pslist">
              ${taskEditor?.addingTask ? html`
                <li class="active">
                  <div class="cltrow">
                    <div class="cltmain">
                      <loading-dots style="--width: 20px; margin-left:10px">
                      </loading-dots>
                    </div>
                  </div>
                </li>`
              : ``}
              ${taskids
                .map((taskid: string) => this._problem_statement!.tasks[taskid])
                .filter((task: Task) => !!task)
                .map((task: Task) => {
                  let task_permission = getUserPermission( task.permissions, task.events);
                  let last_event = getLatestEvent(task.events);
                  return html`
                    <li class="active ${this._getTaskClass(task.id!)}">
                      <div class="cltrow taskrow" id="task_${task.id}" @click="${this._onSelectTask}" data-taskid="${task.id}">
                        <div>
                          <wl-icon>
                            ${this._selectedTask && this._selectedTask.id === task.id ? "folder_open" : "folder"}
                          </wl-icon>
                        </div>
                        <div class="cltmain taskname">
                          ${task.name}
                        </div>

                        <div></div>
                        <div class="task-content">
                          <div class="cltmain">
                            <div class="description" style="margin-left: 0px">
                              ${this._getTaskRegionTimeText(task)}
                            </div>
                            ${last_event ? html`
                              <div class="caption" style="margin-left: 0px">
                                ${last_event?.userid} on ${toDateTimeString( last_event?.timestamp)}
                              </div>`
                            : ""}
                          </div>
                          ${task_permission.write ? html`
                            <wl-icon @click="${this._editTaskDialog}" data-taskid="${task.id}" class="actionIcon editIcon">
                              edit
                            </wl-icon>`
                          : html`
                            <wl-icon class="smallIcon">lock</wl-icon>
                          `}
                          ${task_permission.owner ? html`
                            <wl-icon @click="${this._onDeleteTask}" data-taskid="${task.id}" class="actionIcon deleteIcon">
                              delete
                            </wl-icon>`
                          : ""}
                        </div>
                      </div>
                      ${this._selectedTask && this._selectedTask.id == task.id ? html`
                        <ul class="subtask-list" style="padding-left: 40px;">
                          ${threadEditor?.addingThread? html`
                            <li class="active">
                              <div class="cltrow">
                                <div class="cltmain">
                                  <loading-dots style="--width: 20px; margin-left:10px">
                                  </loading-dots>
                                </div>
                              </div>
                            </li>`
                          : ""}
                          ${threads
                            .map((pid) => this._selectedTask.threads[pid])
                            .map((thread: ThreadInfo, i: number) => {
                              if (!thread) return "";
                              let pname = thread.name ? thread.name : this._selectedTask.name;
                              let last_event = getLatestEvent(thread.events);
                              let thread_permission = getUserPermission(thread.permissions, thread.events);
                              return html`
                                <li class="active ${this._getThreadClass(thread.id!)} subtask-desc">
                                  <div>
                                    <wl-icon>
                                      ${this._selectedThreadId === thread.id ? "edit_document" : "task"}
                                    </wl-icon>
                                  </div>
                                  <div class="cltrow" id="thread_${thread.id}" @click="${this._onSelectThread}" data-threadid="${thread.id}">
                                    <div class="cltmain" .style="${this ._selectedThreadId != thread.id ? "font-weight: normal;" : ""}">
                                      ${pname && pname != this._selectedTask.name ? pname : "Default sub-task"}
                                      <br />
                                      ${last_event ? html`
                                        <div class="thread_caption">
                                          ${last_event?.userid} on ${toDateTimeString(last_event?.timestamp)}
                                        </div>`
                                      : ""}
                                    </div>
                                  </div>
                                  <div style="padding-right: 8px;">
                                    ${thread_permission.write ? html`
                                      <wl-icon @click="${this._editThreadDialog}" data-threadid="${thread.id}" class="actionIcon editIcon">
                                        edit
                                      </wl-icon>`
                                    : html`
                                      <wl-icon class="smallIcon">lock</wl-icon>`}
                                    ${thread_permission.owner ? html`
                                      <wl-icon @click="${this._onDeleteThread}" data-threadid="${thread.id}" class="actionIcon deleteIcon">
                                        delete
                                      </wl-icon>`
                                    : ""}
                                  </div>
                                </li>`;
                              })}
                          ${selected_task_permissions.write ? html`
                            <li>
                              <wl-button style="display:flex;align-items:center; gap:1em; margin: 0; --button-padding: 6px; --button-font-size: .92em; background-color: #186818;"
                                         @click="${this._editThreadDialog}">
                                <wl-icon>note_add</wl-icon>
                                <span>Create new sub-tasks</span>
                              </wl-button>
                            </li>`
                          : ""}
                        </ul>`
                      : ""}
                    </li>`;
              })}
            </ul>
          </div>
          <div>
            <wl-button style="display:flex;align-items:center; gap:1em; margin: 0 1em;"
              @click="${this._addTaskDialog}"
              ?disabled=${!problem_permissions.write}
            >
              <wl-icon>
                ${problem_permissions.write ? "create_new_folder" : "lock"}
              </wl-icon>
              <span>Add new task</span>
            </wl-button>
          </div>
        </div>

        <!-- Right Column : Thread Tree + Thread details -->
        <div class="${this._hideTasks ? "right_full" : "right"} ${
      this._selectedTask ? "right_sm_full" : ""
    }">
                    <div class="card2">
                    ${
                      this._selectedTask
                        ? html`
                            <mint-thread
                              ?active="${!!this._selectedTask}"
                              .problem_statement=${this._problem_statement}
                              ?maximized=${this._hideTasks}
                            ></mint-thread>
                          `
                        : ""
                    }
                    </div>
                </div>
            </div>
        </div>

        <!-- Tooltips -->
        ${this._renderTooltips()}

        <!-- Notifications -->
        ${renderNotifications()}

        <!-- Editors -->
        <task-editor .problem_statement="${
          this._problem_statement
        }" id="taskEditor"></task-editor>
        <thread-editor .problem_statement_id="${this._problem_statement.id}"
            .task="${this._selectedTask}" id="threadEditor"></thread-editor>

        <!-- Help Dialogs -->
        ${this._renderHelpDialogs()}
        `;
  }

  _renderTooltips() {
    return html`
      <!-- Tooltips for the addPaProblemStatement -->
      <wl-tooltip
        anchor=".problem_statementrow .addIcon"
        .anchorOpenEvents="${["mouseover"]}"
        .anchorCloseEvents="${["mouseout"]}"
        fixed
        anchorOriginX="center"
        anchorOriginY="bottom"
        transformOriginX="center"
      >
        Add Task
      </wl-tooltip>

      ${Object.keys(this._problem_statement.tasks).map((taskid) => {
        return html`
          <!-- Tooltips for the sub-goal -->
          <wl-tooltip
            anchor="#task_${taskid} .editIcon"
            .anchorOpenEvents="${["mouseover"]}"
            .anchorCloseEvents="${["mouseout"]}"
            fixed
            anchorOriginX="center"
            anchorOriginY="bottom"
            transformOriginX="center"
          >
            Edit Task
          </wl-tooltip>
          <wl-tooltip
            anchor="#task_${taskid} .deleteIcon"
            .anchorOpenEvents="${["mouseover"]}"
            .anchorCloseEvents="${["mouseout"]}"
            fixed
            anchorOriginX="center"
            anchorOriginY="bottom"
            transformOriginX="center"
          >
            Delete Task
          </wl-tooltip>
        `;
      })}
    `;
  }

  _getTaskVariablesText(task) {
    let response = task.response_variables
      ? this._variableMap[task.response_variables[0]]
      : null;
    let driving =
      task.driving_variables && task.driving_variables.length > 0
        ? this._variableMap[task.driving_variables[0]]
        : null;
    return (driving ? driving.name + " -> " : "") + (response?.name ?? "");
  }

  _getTaskRegionTimeText(task: Task) {
    let regionid = task.regionid;
    let regionname =
      regionid && this._regions && this._regions[regionid]
        ? this._regions[regionid].name
        : this._region?.name;
    let dates = task.dates ? task.dates : this._problem_statement.dates;
    let startdate = toDateString(dates!.start_date);
    let enddate = toDateString(dates!.end_date);
    return html`<b>${regionname}</b>: <b>${startdate}</b>
      <span style="font-size:10px">to</span> <b>${enddate}</b>`;
  }

  _getTaskRegionText(task: Task) {
    let regionid = task.regionid;
    let regionname =
      regionid && this._regions && this._regions[regionid]
        ? this._regions[regionid].name
        : this._region?.name;
    return regionname;
  }

  _getTaskTimeText(task: Task) {
    let dates = task.dates ? task.dates : this._problem_statement.dates;
    let startdate = toDateString(dates!.start_date);
    let enddate = toDateString(dates!.end_date);
    return html`<b>${startdate}</b> - <b>${enddate}</b>`;
  }

  _renderHelpDialogs() {
    return html`
      <wl-dialog
        class="larger"
        id="threadsHelpDialog"
        fixed
        backdrop
        blockscrolling
      >
        <h3 slot="header">Modeling sub-tasks</h3>
        <div slot="content">
          <p>
            For a given task, you can investigate different initial conditions
            or different models. Each of them can be explored by creating a new
            modeling sub-tasks for that task. For example, a sub-task can have a
            parameter set to a low value and another sub-task that sets the same
            parameter to a high value. Or a sub-task could use model M1 and
            another sub-task that uses model M2.
          </p>
          <p>
            You can also use sub-tasks to investigate possible interventions.
            For example, changing planting windows to an earlier time might
            increase crop production, which can be analyzed using an agriculture
            model. Another possible intervention to increase crop yield is the
            use of fertilizer subsidies, which can be studied by using an
            economic model.
          </p>
          <p>
            Create a new sub-task, then click on the first of the steps shown.
            You can move from one step to the next, and you can always go back
            and change any of the steps. At the bottom of the each step, there
            is a notepad where you can document your decisions, and your notes
            will be added to the final report so others can undertand your
            modeling decisions.
          </p>
        </div>
        <div slot="footer">
          <wl-button
            @click="${() => hideDialog("threadsHelpDialog", this.shadowRoot)}"
            inverted
            flat
            >Close</wl-button
          >
        </div>
      </wl-dialog>

      <wl-dialog
        class="larger"
        id="tasksHelpDialog"
        fixed
        backdrop
        blockscrolling
      >
        <h3 slot="header">Tasks and sub-tasks</h3>
        <div slot="content">
          <h4>Tasks</h4>
          <p>
            Several modeling tasks can be created for a given problem statement.
            Each modeling task is associated with an indicator relevant to the
            decision that want to inform or support, or a different time period,
            or a different driving variable. There are two types of indicators:
            indices and modeling variables. For example, the problem statement
            of food security in South Sudan described above, one modeling task
            can be framed as “Flooding effect on crop production during the
            growing season”, and a separate modeling task could be “Potential
            crop production without flooding”. Note that the time frame of the
            tasks does not necessarily reflect that of the problem statement. In
            the first example, flooding is relevant to both the planting time
            and growing season of an agriculture model which would place the
            start of the simulation earlier than the problem’s time frame.
          </p>
          <h4>Sub-tasks</h4>
          <p>
            For a given task, you can investigate different initial conditions
            or different models. Each of them can be explored by creating a new
            modeling sub-tasks for that task. For example, a task can have a
            sub-task that sets a parameter to a low value and another sub-task
            that sets a parameter to a high value. Or a sub-task could use model
            M1 and another sub-task that uses model M2.
          </p>
          <p>
            You can also use sub-tasks to investigate possible interventions.
            For example, changing planting windows to an earlier time might
            increase crop production, which can be analyzed using an agriculture
            model. Another possible intervention to increase crop yield is the
            use of fertilizer subsidies, which can be studied by using an
            economic model.
          </p>
          <p>
            Create a new sub-task, then click on the first of the steps shown.
            You can move from one step to the next, and you can always go back
            and change any of the steps. At the bottom of the step, there is a
            notepad where you can document your decisions, and your notes will
            be added to the final report so others can undertand your modeling
            decisions.
          </p>
        </div>
        <div slot="footer">
          <wl-button
            @click="${() => hideDialog("tasksHelpDialog", this.shadowRoot)}"
            inverted
            flat
            >Close</wl-button
          >
        </div>
      </wl-dialog>
    `;
  }

  _addTaskDialog(e: Event) {
    let taskEditor = this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
    taskEditor.addTaskDialog();
  }

  _editTaskDialog(e: Event) {
    let taskid = (e.currentTarget as HTMLButtonElement).dataset["taskid"];
    if (taskid) {
      let task = this._problem_statement!.tasks[taskid];
      let taskEditor =
        this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
      if (task) {
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

    let taskid = (e.currentTarget as HTMLButtonElement).dataset["taskid"];
    if (taskid) {
      let task = this._problem_statement!.tasks[taskid];
      if (task) {
        if (!confirm("Do you want to delete the task '" + task.name + "' ?"))
          return false;
        showNotification("deleteNotification", this.shadowRoot!);
        deleteTask(taskid);
        goToPage("modeling/problem_statement/" + this._problem_statement!.id);
      }
    }
    return false;
  }

  _deselectTasks() {
    this._hideTasks = false;
    store.dispatch(selectThread(null));
    store.dispatch(selectTask(null));
  }

  _addThreadDialog(e: Event) {
    let threadEditor =
      this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;
    threadEditor.addThreadDialog();
  }

  _editThreadDialog(e: Event) {
    let threadEditor =
      this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;
    let threadid = (e.currentTarget as HTMLButtonElement).dataset["threadid"];
    if (threadid) {
      let thread = this._selectedTask!.threads[threadid];
      if (thread) {
        threadEditor.editThreadDialog(thread);
      }
    } else {
      threadEditor.addThreadDialog();
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  _onDeleteThread(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Do you want to delete this sub-task ?")) return;

    let threadid = (e.currentTarget as HTMLButtonElement).dataset["threadid"];
    if (this._selectedTask && threadid) {
      showNotification("deleteNotification", this.shadowRoot!);
      deleteThread(threadid);
      if (this._selectedThreadId == threadid) {
        this._selectedThreadId = null;
        goToPage(
          "modeling/problem_statement/" +
            this._problem_statement!.id +
            "/" +
            this._selectedTask.id +
            "/"
        );
      }
    }
  }

  _onSelectTask(e: Event) {
    let taskid = (e.currentTarget as HTMLButtonElement).dataset["taskid"];

    let task = this._problem_statement!.tasks[taskid!];
    if (task && (!this._selectedTask || this._selectedTask.id != taskid)) {
      let threadid = "";
      for (let pathwayid in task.threads) {
        threadid = pathwayid;
        break;
      }
      // Go to the task page
      goToPage(
        "modeling/problem_statement/" +
          this._problem_statement!.id +
          "/" +
          task.id +
          "/" +
          threadid
      );
    }
  }

  _onSelectThread(e: Event) {
    let threadid = (e.currentTarget as HTMLButtonElement).dataset["threadid"];
    let task = this._selectedTask;
    if (task) {
      let thread = this._selectedTask.threads[threadid!];
      // Selecting the first thread of the task by default
      // TODO: Think about handling multiple threads in an elegant manner
      if (
        thread &&
        (!this._selectedThreadId || this._selectedThreadId != threadid)
      ) {
        goToPage(
          "modeling/problem_statement/" +
            this._problem_statement!.id +
            "/" +
            task.id +
            "/" +
            thread.id
        );
      }
    }
  }

  _getTaskClass(taskid: string) {
    if (this._selectedTask && this._selectedTask.id! == taskid) {
      return "highlighted";
    }
    return "";
  }

  _getThreadClass(threadid: string) {
    if (this._selectedThreadId == threadid) {
      return "highlighted";
    }
    return "";
  }

  stateChanged(state: RootState) {
    super.setRegionId(state);
    if (state.ui && state.ui.selected_thread_id)
      this._selectedThreadId = state.ui.selected_thread_id;

    if (
      state.regions.sub_region_ids &&
      this._regionid &&
      state.regions.sub_region_ids[this._regionid]
    ) {
      this._regions = state.regions.regions;
    }

    // If a problem_statement has been selected, fetch problem_statement details
    let problem_statement_id = state.ui!.selected_problem_statement_id;
    let user = state.app.user;

    if (problem_statement_id && user) {
      // If we don't have the right details for the problem_statement, make a call to fetch the details
      if (
        !this._dispatched &&
        (!state.modeling.problem_statement ||
          state.modeling.problem_statement.id != problem_statement_id)
      ) {
        // Reset the problem_statement details
        this._problem_statement = null;
        this._problem_statement = null;
        this._selectedTask = null;
        this._selectedThreadId = null;
        this._dispatched = true;

        // Unsubscribe to any existing problem_statement details listener
        if (
          state.modeling.problem_statement &&
          state.modeling.problem_statement.unsubscribe
        ) {
          console.log(
            "Unsubscribing to problem_statement " +
              state.modeling.problem_statement.id
          );
          state.modeling.problem_statement.unsubscribe();
        }
        console.log("Subscribing to problem_statement " + problem_statement_id);
        // Make a subscription call for the new problem_statement id
        store.dispatch(subscribeProblemStatement(problem_statement_id));

        return;
      }

      // If we've already got the details in the state
      // - extract details from the state
      if (
        state.modeling.problem_statement &&
        state.modeling.problem_statement.id == problem_statement_id &&
        state.modeling.problem_statement.changed
      ) {
        this._dispatched = false;
        state.modeling.problem_statement.changed = false;
        this._problem_statement = state.modeling.problem_statement;

        // Problem statement has changed. Reset Task/Thread data
        let taskEditor =
          this.shadowRoot.querySelector<TaskEditor>("#taskEditor")!;
        if (taskEditor) taskEditor.addingTask = false;
        let threadEditor =
          this.shadowRoot.querySelector<ThreadEditor>("#threadEditor")!;
        if (threadEditor) threadEditor.addingThread = false;
      } else if (!state.modeling.problem_statement) {
        this._dispatched = false;
      }
    } else {
      this._hideTasks = false;
    }

    if (
      state.modeling.problem_statement &&
      state.modeling.problem_statement.tasks
    ) {
      // If a task has been selected
      this._selectedTask = getUISelectedTask(state)!;
    }

    if (
      state.modeling &&
      state.ui &&
      state.ui.selected_problem_statement_id == null
    ) {
      if (state.modeling.problem_statement?.unsubscribe) {
        console.log(
          "Unsubscribing to problem_statement " +
            state.modeling.problem_statement.id
        );
        state.modeling.problem_statement.unsubscribe();
      }
      state.modeling.problem_statement = null;
    }

    if (!user && state.modeling.problem_statement) {
      // Logged out, Unsubscribe
      if (state.modeling.problem_statement.unsubscribe) {
        console.log(
          "Unsubscribing to problem_statement " +
            state.modeling.problem_statement.id
        );
        state.modeling.problem_statement.unsubscribe();
      }
      state.modeling.problem_statement = undefined;
    }

    if (state.variables && state.variables.variables) {
      this._variableMap = state.variables.variables;
    }
  }
}
