import { customElement, LitElement, property, html, css } from "lit-element";
import { SharedStyles } from "../styles/shared-styles";

import "weightless/icon";
import {
  Task,
  TaskEvent,
  ThreadInfo,
  ThreadEvent,
  Thread,
  ProblemStatementInfo,
} from "screens/modeling/reducers";
import {
  formElementsComplete,
  showNotification,
  resetForm,
  showDialog,
  hideDialog,
  hideNotification,
} from "util/ui_functions";
import { getUpdateEvent, getCreateEvent } from "util/graphql_adapter";
import {
  updateTask,
  updateThreadInformation,
  addTaskWithThread,
} from "screens/modeling/actions";
import { toDateString } from "util/date-utils";
import { renderVariables } from "util/ui_renders";
import { Region, RegionCategory, RegionMap } from "screens/regions/reducers";
import { store, RootState } from "app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { IdMap } from "app/reducers";
import { getCategorizedRegions } from "util/state_functions";
import { goToPage } from "app/actions";

import "./permissions-editor";
import { PermissionsEditor } from "./permissions-editor";
import { VariableMap } from "screens/variables/reducers";

@customElement("task-editor")
export class TaskEditor extends connect(store)(LitElement) {
  @property({ type: Object })
  public task: Task;

  @property({ type: Object })
  public problem_statement: ProblemStatementInfo;

  @property({ type: Function })
  public onSave: Function;

  @property({ type: Function })
  public onCancel: Function;

  @property({ type: Boolean })
  public editMode = false;

  @property({ type: String })
  private _regionid;

  @property({ type: Object })
  private _regionCategories: IdMap<RegionCategory>;

  @property({ type: Array })
  private _subRegionIds: string[];

  @property({ type: Object })
  private _regions: RegionMap;

  @property({ type: Object })
  private _categorizedRegions: any;

  @property({ type: Object })
  private _selectedCategory: RegionCategory;

  @property({ type: Object })
  private _selectedIntervention!: any;

  @property({ type: Object })
  private _variableMap: VariableMap = {};

  @property({ type: Boolean })
  public addingTask: boolean = false;

  @property({ type: String })
  public editingTaskId: string = null;

  static get styles() {
    return [
      SharedStyles,
      css`
        fieldset {
          margin: 10px 0px;
          padding: 5px 10px;
          border: 1px solid #d9d9d9;
          border-radius: 5px;
        }
        fieldset legend  {
          font-size: 10px;
        }

        fieldset textarea {
          resize: none;
          width: calc(100% - 5px);
          min-height: var(--min-height, 65px);
          max-height: var(--max-height, 150px);
          border: 0px solid #e9e9e9;
          /*font-family: cursive;*/
          font-size: 13px;
          color: #666;
        }

        fieldset textarea:focus {
          outline: none;
          border-color: #909090;
        }

        fieldset textarea:focus ~ #footer wl-button {
          visibility: visible;
          opacity: 1;
        }

        #footer {
          float: right;
          margin-top: -34px;
        }

        #footer wl-button {
          margin-left: 6px;
          visibility: hidden;
          opacity: 0;
          transition: visibility 0.1s linear, opacity 0.1s linear;
        }

        wl-button[disabled] {
          cursor: not-allowed;
        }
      `,
    ];
  }

  protected render() {
    return html`
      <wl-dialog id="taskDialog" fixed backdrop blockscrolling>
        <h3 slot="header">Task</h3>
        <div slot="content">
          <form id="taskForm">
            ${this._renderTaskForm()}
            <permissions-editor id="task_permissions"></permissions-editor>
          </form>
        </div>
        <div slot="footer">
          <wl-button @click="${this._onEditTaskCancel}" inverted flat
            >Cancel</wl-button
          >
          <wl-button
            @click="${this._onEditTaskSubmit}"
            class="submit"
            id="dialog-submit-button"
            >Submit</wl-button
          >
        </div>
      </wl-dialog>
    `;
  }

  _renderTaskForm() {
    /*
             Specify the region, time period, and variables of interest.
            <!-- Variables --> 
            ${renderVariables(this._variableMap, this.editMode, this._handleResponseVariableChange, this._handleDrivingVariableChange)}
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
                    <select name="task_region_category" value="${this._selectedCategory}" @change="${this._onRegionCategoryChange}">
                        <option value="">None</option>
                        ${Object.values(this._regionCategories).map((cat: RegionCategory) => {
                            let subCategories = cat.subcategories || [];
                            return html`
                            <option value="${cat.id}">${cat.name}</option>
                            ${subCategories.length > 0 ? subCategories.map((subcat: RegionCategory) => {
                                if(this._categorizedRegions && this._categorizedRegions[subcat.id])
                                    return html`<option value="${subcat.id}">&nbsp;&nbsp;&nbsp;&nbsp;${subcat.name}</option>`;
                            }) : html`
                                <option disabled>&nbsp;&nbsp;&nbsp;&nbsp;No subcategories</option>
                            `}`
                        })}
                    </select>
                </div>            

                <div class="input_half">
                    <label>Region</label>
                    <select name="task_region">
                        <option value="">None</option>
                    </select>
                </div>            
            </div>

            <div style="height:10px;">&nbsp;</div>


            <br />
             */

    return html`
            <p> Write a description for this task </p>
            <input type="hidden" name="taskid"></input>

            <!-- Time Period -->
            <div class="input_full">
                <label>Time Period</label>
            </div>
            <div class="formRow">
                <div class="input_half">
                    <input name="task_from" type="date" value="${toDateString(
                      this.problem_statement!.dates?.start_date
                    )}">
                </div>
                to
                <div class="input_half">
                    <input name="task_to" type="date" value="${toDateString(
                      this.problem_statement!.dates?.end_date
                    )}">
                </div>
            </div>
            <br />

            <!-- Sub-Objective name -->
            <div class="input_full">
                <label>Description</label>
                <input name="task_name"></input>
            </div>
            <br/>
        `;
  }

  addTaskDialog() {
    this.task = null;
    this.resetForm();
    showDialog("taskDialog", this.shadowRoot!);
  }

  editTaskDialog(task: Task) {
    this.setTask(task);
    showDialog("taskDialog", this.shadowRoot!);
  }

  resetForm() {
    let form = this.shadowRoot!.querySelector<HTMLFormElement>("#taskForm")!;
    resetForm(form, null);

    this.editMode = false;
    let dates = this.problem_statement.dates;
    //(form.elements["task_region"] as HTMLSelectElement).value = ""; //this.problem_statement.regionid!;
    (form.elements["task_from"] as HTMLInputElement).value = toDateString(
      dates?.start_date
    );
    (form.elements["task_to"] as HTMLInputElement).value = toDateString(
      dates?.end_date
    );
    (
      form.querySelector("#task_permissions") as PermissionsEditor
    ).setPermissions([]);
    this._selectedIntervention = null;
  }

  setTask(task: Task) {
    this.task = task;
    let form = this.shadowRoot!.querySelector<HTMLFormElement>("#taskForm")!;
    resetForm(form, null);

    this.editMode = false; // FIXME: This should be true
    let dates = task.dates ? task.dates : this.problem_statement.dates;
    /*let response_variable = (task.response_variables && task.response_variables.length > 0) ? 
            task.response_variables[0] : "";
        let driving_variable = (task.driving_variables && task.driving_variables.length > 0) ? 
            task.driving_variables[0] : "";
        */

    (form.elements["taskid"] as HTMLInputElement).value = task.id;
    (form.elements["task_name"] as HTMLInputElement).value = task.name;

    //(form.elements["task_region_category"] as HTMLInputElement).value = this._regions && this._regions[task.regionid] ? this._regions[task.regionid].category_id : "";
    //this._onRegionCategoryChange();

    //(form.elements["task_region"] as HTMLInputElement).value = task.regionid;
    (form.elements["task_from"] as HTMLInputElement).value = toDateString(
      dates.start_date
    );
    (form.elements["task_to"] as HTMLInputElement).value = toDateString(
      dates.end_date
    );
    /*(form.elements["response_variable"] as HTMLInputElement).value = response_variable;
        (form.elements["driving_variable"] as HTMLInputElement).value = driving_variable;*/
    (
      form.querySelector("#task_permissions") as PermissionsEditor
    ).setPermissions(task.permissions);

    //this._selectedIntervention = this._variableMap[driving_variable]?.intervention;
  }

  //_handleResponseVariableChange() {}

  /*_handleDrivingVariableChange(e: any) {
        let varid = e.target.value;
        this._selectedIntervention = this._variableMap[varid]?.intervention;
    }


    _onRegionCategoryChange () {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#taskForm")!;
        let category_id = (form.elements["task_region_category"] as HTMLSelectElement).value;
        let selector = form.elements["task_region"] as HTMLSelectElement
        if (category_id && category_id != this._selectedCategory?.id && selector) {
            this._selectedCategory = this._regionCategories[category_id];
            while (selector.options.length > 0) {
                selector.remove(selector.options.length - 1);
            }
            let defOption = document.createElement('option');
            defOption.text = 'None';
            defOption.value = '';
            selector.options.add(defOption);

            (this._categorizedRegions[category_id]||[]).forEach((region:Region) => {
                let newOption = document.createElement('option');
                newOption.text = region.name;
                newOption.value = region.id;
                selector.options.add(newOption);
            });
        }
    }*/

  async _onEditTaskSubmit() {
    let form: HTMLFormElement =
      this.shadowRoot!.querySelector<HTMLFormElement>("#taskForm")!;
    if (formElementsComplete(form, ["task_name", "task_from", "task_to"])) {
      let task_name = (form.elements["task_name"] as HTMLInputElement).value;
      let task_from = new Date(
        (form.elements["task_from"] as HTMLInputElement).value
      );
      let task_to = new Date(
        (form.elements["task_to"] as HTMLInputElement).value
      );
      //let task_region = (form.elements["task_region"] as HTMLInputElement).value;
      //if(!task_region)
      let task_region = this._regionid;
      let task_permissions = (
        form.querySelector("#task_permissions") as PermissionsEditor
      ).permissions;
      if (task_from >= task_to) {
        alert("The start date should be before the end date");
        return;
      }
      showNotification("saveNotification", this.shadowRoot!);
      // If no taskid then this is a new task
      if (this.task) {
        // Edit Task
        this.task.name = task_name;
        //this.task.regionid = task_region;
        this.task.dates = {
          start_date: task_from,
          end_date: task_to,
        };

        /* Temporary addition FIXME:
                let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
                let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
                this.task.driving_variables = driving_variable ? [driving_variable] : [];
                this.task.response_variables = response_variable ? [response_variable] : [];*/
        this.task.response_variables = [];
        this.task.events.push(getUpdateEvent(task_name) as TaskEvent);
        this.task.permissions = task_permissions;
        // End of Temporary Addition

        // Update the task
        this.task.events = [getUpdateEvent(task_name) as TaskEvent];
        updateTask(this.task);

        // Update Threads of this task if variables have been modified
        Object.values(this.task.threads!).map((thread: ThreadInfo) => {
          if (
            thread.driving_variables?.toString() !=
              this.task.driving_variables?.toString() ||
            thread.response_variables?.toString() !=
              this.task.response_variables?.toString()
          ) {
            thread.driving_variables = this.task.driving_variables;
            thread.response_variables = this.task.response_variables;
            thread.events = [
              getUpdateEvent("Updated Task Variables") as ThreadEvent,
            ];
            updateThreadInformation(thread);
          }
        });

        this.editingTaskId = this.task.id;
      } else {
        // Add Task
        //let response_variable = (form.elements["response_variable"] as HTMLInputElement).value;
        //let driving_variable = (form.elements["driving_variable"] as HTMLInputElement).value || "";
        this.task = {
          name: task_name,
          regionid: task_region,
          //driving_variables: driving_variable ? [driving_variable] : [],
          //response_variables: [response_variable],
          dates: {
            start_date: task_from,
            end_date: task_to,
          },
          threads: {},
          events: [getCreateEvent(task_name) as TaskEvent],
          permissions: task_permissions,
        } as Task;

        // Create a default thread for this task
        let thread = {
          //driving_variables: driving_variable ? [driving_variable] : [],
          //response_variables: [response_variable],
          dates: {
            start_date: task_from,
            end_date: task_to,
          },
          models: {},
          data: {},
          model_ensembles: {},
          execution_summary: {},
          events: [getCreateEvent("Default Thread Created") as ThreadEvent],
          permissions: task_permissions,
        } as Thread;

        this.addingTask = true;

        // Create the Task along with default thread
        let ids = await addTaskWithThread(
          this.problem_statement!,
          this.task,
          thread
        );
        goToPage(
          "modeling/problem_statement/" +
            this.problem_statement.id +
            "/" +
            ids[0] +
            "/" +
            ids[1]
        );
      }
      hideDialog("taskDialog", this.shadowRoot!);
    } else {
      showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }
  }

  _onEditTaskCancel() {
    hideDialog("taskDialog", this.shadowRoot!);
  }

  stateChanged(state: RootState) {
    this._regionid = state.ui.selected_top_regionid;

    if (state.regions.categories && !this._regionCategories) {
      this._regionCategories = state.regions.categories;
    }

    if (state.regions.sub_region_ids && this._regionid) {
      if (
        state.regions.sub_region_ids &&
        state.regions.sub_region_ids[this._regionid] != this._subRegionIds
      ) {
        this._subRegionIds = state.regions.sub_region_ids[this._regionid];
        this._categorizedRegions = getCategorizedRegions(state);
      }
    }

    if (state.variables && state.variables.variables) {
      this._variableMap = state.variables.variables;
    }
  }
}
