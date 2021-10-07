import { customElement, html, css, property, TemplateResult } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import { BASE_HREF } from "../../../app/actions";
import { renderNotifications, renderResponseVariables, renderDrivingVariables, renderLastUpdateText } from "../../../util/ui_renders";
import { formElementsComplete, showNotification, hideNotification } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { MintThreadPage } from "./mint-thread-page";
import { updateThreadInformation } from "../actions";
import variables, { VariableMap } from "screens/variables/reducers";

import { PermissionsEditor } from "components/permissions-editor";

import "components/permissions-editor";
import { Thread, ThreadInfo } from "../reducers";
import { IsInBoundingBoxQuestion } from "components/questions/custom_questions/is-in-bounding-box";
import { toDateString } from "util/date-utils";
import { getLatestEventOfType } from "util/event_utils";
import { getCreateEvent } from "util/graphql_adapter";
import 'components/loading-dots';
import { ModelQuestionComposer } from "components/questions/model-question-composer";

store.addReducers({
    variables
});

@customElement('mint-configure')
export class MintConfigure extends connect(store)(MintThreadPage) {
    @property({type: Boolean}) private editMode: boolean = false;
    @property({type: Boolean}) private loading: boolean = false;
    @property({type: Object}) private regionSelector : IsInBoundingBoxQuestion;
    
    static get styles() {
        return [ SharedStyles, css`
            .thread-detail-table {
                width: 100%;
            }
            .thread-detail-table > tbody > tr {
                vertical-align: top;
            }
            .thread-detail-table > tbody > tr > td:last-child > *:not(.formRow) {
                width: 100%;
            }
            .thread-detail-table > tbody > tr > td:first-child {
                font-weight: bold;
            }
        `]
    }

    public setQuestionComposer (composer:ModelQuestionComposer) : void {
        super.setQuestionComposer(composer);
        this.regionSelector = composer.getRegionQuestion();
    }
    
    protected render () : TemplateResult {
        if (this.lastActive != this.active) {
            // This happens when we go back without chaning anything
            this.lastActive = this.active;
            this.regionSelector.setSelected(this.thread.regionid);
            this.regionSelector.isEditable = this.editMode;
            setTimeout(() => { 
                this.regionSelector.updateMap()
                this.requestUpdate();
            }, 200);
            return html`<wl-progress-spinner class="loading"></wl-progress-spinner>`;
        }
        return html `
            <div class="clt">
                <wl-title level="3">
                    Configure thread
                    ${this.permission.write && !this.editMode ? html`
                        <wl-icon @click="${this.onEditEnable}" 
                            id="editModelsIcon" class="actionIcon editIcon">edit</wl-icon>`: ""
                    }
                </wl-title>
                <p>
                    A Thread constitutes analysis of a sub-objective using a single model. A sub-objective may have multiple modeling threads.
                    ${this.permission.write && !this.editMode ? 
                        html`<br/>Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.`
                        : ""
                    }
                </p>

                ${!this.thread ?
                    html``
                    : (this.editMode ? this.renderEditForm(this.thread) :  this.renderView(this.thread))
                }

                <div class="footer">
                    ${this.editMode ? 
                        html `<wl-button @click="${this.onCancelClicked}" flat inverted>CANCEL</wl-button>`
                        : ""
                    }
                    <wl-button type="button" class="submit" @click="${this.onContinueClicked}" ?disabled=${this.loading}>
                        ${this.editMode ? "Save" : "Continue"} 
                        ${this.loading ? html`<loading-dots style="--width: 20px"></loading-dots>` : ""}
                    </wl-button>
                </div>
            </div>
            ${renderNotifications()}`
    }

    renderView (thread: Thread): TemplateResult {
        let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
        return html`
            <table class="thread-detail-table">
                <tbody>
                    <tr>
                        <td> Thread name: </td>
                        <td> ${thread.name ? thread.name : ""} </td>
                    </tr>
                    ${threadEvent.notes ? 
                        html`<tr>
                            <td> Notes: </td>
                            <td> ${threadEvent.notes} </td>
                        </tr>`
                        : ''}
                    <tr>
                        <td> Time Period: </td>
                        <td>
                            <div class="formRow">
                                <div class="input_half">
                                    <input id="thread_from" type="date" value="${toDateString(thread.dates.start_date)}" disabled>
                                </div>
                                to
                                <div class="input_half">
                                    <input id="thread_to" type="date" value="${toDateString(thread.dates.end_date)}" disabled>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td> <label>Region:</label> </td>
                        <td>
                            ${this.regionSelector}
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <permissions-editor id="thread_permissions"></permissions-editor>
                        </td>
                    </tr>
                </tbody>
            </table>
        `
    }

    renderEditForm (thread: Thread): TemplateResult {
        let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
        return html`
            <table class="thread-detail-table">
                <tbody>
                    <tr>
                        <td> <label>Thread name:</label> </td>
                        <td> <input id="thread_name" value="${thread.name ? thread.name : ""}"></input> </td>
                    </tr>
                    <tr>
                        <td> <label>Notes:</label> </td>
                        <td>
                            <textarea style="color:unset; font: unset;" id="thread_notes" rows="4">${
                                threadEvent.notes
                            }</textarea>
                        </td>
                    </tr>
                    <tr>
                        <td> <label>Time Period:</label> </td>
                        <td>
                            <div class="formRow">
                                <div class="input_half">
                                    <input id="thread_from" type="date" value="${toDateString(thread.dates.start_date)}">
                                </div>
                                to
                                <div class="input_half">
                                    <input id="thread_to" type="date" value="${toDateString(thread.dates.end_date)}">
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td> <label>Region:</label> </td>
                        <td>
                            ${this.regionSelector}
                        </td>
                    </tr>
                    <tr>
                        <td> <label>Indicator:</label> </td>
                        <td>
                            IDICATOR HERE
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <permissions-editor id="thread_permissions"></permissions-editor>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    private async onContinueClicked () : Promise<void> {
        if (this.editMode) {
            let curThread : ThreadInfo = { ...this.thread };
            let formThread : ThreadInfo = this.getThreadFromForm();
            let editedThread : ThreadInfo = {
                id: curThread.id,
                task_id: curThread.task_id,
                regionid: formThread.regionid,
                name: formThread.name,
                dates: formThread.dates,
                response_variables: curThread.response_variables,
                driving_variables: curThread.driving_variables,
                events: formThread.events,
                permissions: curThread.permissions
            };

            this.loading = true;
            showNotification("saveNotification", this.shadowRoot!);
            await updateThreadInformation(editedThread);
            this.loading = false;
            hideNotification("saveNotification", this.shadowRoot!);
            this.onCancelClicked();
        } else {
            store.dispatch(selectThreadSection("models"));
        }
    }

    private getThreadFromForm () : ThreadInfo {
        let nameEl : HTMLInputElement = this.shadowRoot.getElementById("thread_name") as HTMLInputElement;
        let fromEl : HTMLInputElement = this.shadowRoot.getElementById("thread_from") as HTMLInputElement;
        let toEl : HTMLInputElement = this.shadowRoot.getElementById("thread_to") as HTMLInputElement;
        let notesEl : HTMLInputElement = this.shadowRoot.getElementById("thread_notes") as HTMLInputElement;

        let name : string = nameEl ? nameEl.value : "";
        let from : Date = fromEl ? new Date(fromEl.value) : null;
        let to : Date = toEl ? new Date(toEl.value) : null;
        let notes : string = notesEl ? notesEl.value : "";
        let regionid : string = this.regionSelector.getSelectedRegionId();

        if (!name || !from || !to || !regionid) {
            alert("You must fill all inputs");
            return;
        }
        if (from >= to) {
            alert("The start date should be before the end date");
            return;
        }

        return {
            name: name,
            dates: {
                start_date: from,
                end_date: to
            },
            events: [getCreateEvent(notes)],
            regionid: regionid,
            //permissions: thread_permissions
        } as ThreadInfo;
    }

    private onEditEnable () : void {
        this.editMode = true;
        this.regionSelector.isEditable = true;
    }

    private onCancelClicked () : void {
        this.editMode = false;
        this.regionSelector.isEditable = false;
        this.regionSelector.updateMap();
    }

    private lastActive : boolean;
    private lastThread : Thread;
    stateChanged(state: RootState) {
        super.setUser(state);
        if (super.setThread(state)) {
            hideNotification("saveNotification", this.shadowRoot!);
        }
        if (this.regionSelector) {
            this.regionSelector.isEditable = this.editMode;
        }
        this.lastActive = this.active;
    }
}