import { customElement, LitElement, property, html, css } from "lit-element";
import { SharedStyles } from '../styles/shared-styles';

import "weightless/icon";
import { Task, ThreadInfo, ThreadEvent } from "screens/modeling/reducers";
import { formElementsComplete, showNotification, resetForm, showDialog, hideDialog, hideNotification } from "util/ui_functions";
import { getUpdateEvent, getCreateEvent } from "util/graphql_adapter";
import { updateThreadInformation, addThread } from "screens/modeling/actions";
import { toDateString } from "util/date-utils";
import { getLatestEventOfType } from "util/event_utils";
import { PermissionsEditor } from "./permissions-editor";

import "./permissions-editor";

@customElement('thread-editor')
export class ThreadEditor extends LitElement {
    @property({type: Object})
    public thread: ThreadInfo;

    @property({type: Object})
    public task: Task;

    @property({type: Function})
    public onSave : Function;

    @property({type: Function})
    public onCancel : Function;

    @property({type: Boolean})
    public editMode = false;
    
    static get styles() {
        return [SharedStyles, css`
            fieldset {
                margin: 10px 0px;
                padding: 5px 10px;
                border: 1px solid #D9D9D9;
                border-radius: 5px;
            }
            fieldset legend {
                font-size: 10px;
            }

            fieldset textarea {
                resize: none;
                width: calc(100% - 5px);
                min-height: var(--min-height, 65px);
                max-height: var(--max-height, 150px);
                border: 0px solid #E9E9E9;
                /*font-family: cursive;*/
                font-size:13px;
                color: #666;
            }

            fieldset textarea:focus {
                outline: none;
                border-color: #909090;
            }

            fieldset textarea:focus~#footer wl-button {
                visibility: visible;
                opacity:1;
            }

            #footer {
                float:right;
                margin-top: -34px;
            }

            #footer wl-button {
                margin-left: 6px;
                visibility: hidden;
                opacity:0;
                transition:visibility 0.1s linear,opacity 0.1s linear;
            }

            wl-button[disabled] {
                cursor: not-allowed;
            }
        `];
    }

    protected render() {
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
                
                <!-- Thread name -->
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
                <permissions-editor id="thread_permissions"></permissions-editor>
                </form>
            </div>
            <div slot="footer">
                <wl-button @click="${this._onEditThreadCancel}" inverted flat>Cancel</wl-button>
                <wl-button @click="${this._onEditThreadSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
            </div>
        </wl-dialog>
        `;
    }

    _onEditThreadSubmit() {
        let form:HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        //if(formElementsComplete(form, ["thread_name"])) {
            let threadid = (form.elements["threadid"] as HTMLInputElement).value;
            let thread_name = (form.elements["thread_name"] as HTMLInputElement).value;
            let thread_from = new Date((form.elements["thread_from"] as HTMLInputElement).value);
            let thread_to = new Date((form.elements["thread_to"] as HTMLInputElement).value);
            let thread_notes = (form.elements["thread_notes"] as HTMLInputElement).value;
            let thread_permissions = (form.querySelector("#thread_permissions") as PermissionsEditor).permissions;
            if(thread_from >= thread_to) {
                alert("The start date should be before the end date");
                return;
              }

            showNotification("saveNotification", this.shadowRoot!);
            
            let thread : ThreadInfo = null;
            if (threadid) {
                // Edit Thread Info (Summary)
                thread = this.task!.threads[threadid];
                thread.name = thread_name;
                thread.dates = {
                    start_date: thread_from,
                    end_date: thread_to
                };
                thread.events = [getUpdateEvent(thread_notes) as ThreadEvent];
                thread.permissions = thread_permissions;
                updateThreadInformation(thread);
            }
            else {
                // Add Thread
                let thread = {
                    name: thread_name,
                    task_id: this.task.id,
                    dates: {
                        start_date: thread_from,
                        end_date: thread_to
                    },
                    driving_variables: this.task.driving_variables,
                    response_variables: this.task.response_variables,
                    models: {},
                    datasets: {},
                    model_ensembles: {},
                    execution_summary: {},
                    events: [getCreateEvent(thread_notes)],
                    permissions: thread_permissions
                } as ThreadInfo;

                addThread(this.task, thread);
            }
            hideDialog("threadDialog", this.shadowRoot!);
        /*}
        else {
            showNotification("formValuesIncompleteNotification", this.shadowRoot!);
        }*/
    }

    _onEditThreadCancel() {
        hideDialog("threadDialog", this.shadowRoot!);
    }

    addThreadDialog() {
        this.thread = null;
        this.resetForm();
        showDialog("threadDialog", this.shadowRoot!);
    }

    editThreadDialog(thread: ThreadInfo) {
        this.setThread(thread);
        showDialog("threadDialog", this.shadowRoot!);
    }

    resetForm() {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
        resetForm(form, null);
        let dates = this.task.dates;
        (form.elements["thread_from"] as HTMLInputElement).value = toDateString(dates.start_date);
        (form.elements["thread_to"] as HTMLInputElement).value = toDateString(dates.end_date);
        (form.elements["thread_notes"] as HTMLInputElement).value = "";
        (form.querySelector("#thread_permissions") as PermissionsEditor).setPermissions([]);
    }

    setThread(thread: ThreadInfo) {
        if(thread) {
            this.thread = thread;
            let form = this.shadowRoot!.querySelector<HTMLFormElement>("#threadForm")!;
            resetForm(form, null);
            let dates = thread.dates ? thread.dates : this.task.dates;
            (form.elements["threadid"] as HTMLInputElement).value = thread.id;
            (form.elements["thread_name"] as HTMLInputElement).value = thread.name || this.task.name;
            
            let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
            let notes = threadEvent.notes;
            (form.elements["thread_from"] as HTMLInputElement).value = toDateString(dates.start_date);
            (form.elements["thread_to"] as HTMLInputElement).value = toDateString(dates.end_date);
            (form.elements["thread_notes"] as HTMLInputElement).value = notes;
            (form.querySelector("#thread_permissions") as PermissionsEditor).setPermissions(thread.permissions);
        } 
    }
}
