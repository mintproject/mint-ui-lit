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
import { HasIndicatorQuestion } from "components/questions/custom_questions/has-indicator";
import { ModelSelector } from "components/model-selector";
import { DatasetSelector } from "components/dataset-selector";

import { ThreadExpansionConfigure } from "./thread-expansion-configure";
import { ThreadExpansionModels } from "./thread-expansion-models";
import { ThreadExpansionDatasets } from "./thread-expansion-datasets";

store.addReducers({
    variables
});

@customElement('mint-configure')
export class MintConfigure extends connect(store)(MintThreadPage) {
    @property({type: Boolean}) private editMode: boolean = false;
    @property({type: Boolean}) private loading: boolean = false;
    @property({type: Object}) private regionSelector : IsInBoundingBoxQuestion;
    @property({type: Object}) private indicatorSelector : HasIndicatorQuestion;
    
    static get styles() {
        return [ SharedStyles, css`
            .expansion-title {
                display: flex;
                align-items: center;
            }
            .expansion-title > wl-icon {
                margin-right: 10px;
            }

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

    private threadConfig : ThreadExpansionConfigure;
    private threadModelSelector : ThreadExpansionModels;
    private threadDatasetSelector : ThreadExpansionDatasets;

    constructor () {
        super();
        this.threadConfig = new ThreadExpansionConfigure();
        this.threadModelSelector = new ThreadExpansionModels();
        this.threadDatasetSelector = new ThreadExpansionDatasets();
        
        this.addEventListener('thread-configuration-updated', (e:Event) => {
            //let constraints : ThreadConstraints = e['detail'] as ThreadConstraints;
            //this.threadModelSelector.setRegionFilter(constraints.region);
            this.threadModelSelector.requestUpdate();
        })
    }

    protected render () : TemplateResult {
        return html`
            <wl-title level="3"> Configure thread executions </wl-title>
            <p>
                A Thread constitutes analysis of a sub-objective. This page allows you to set a general configuration for this thread,
                choose one or more models and datasets to generate a set of executions to be run.
                ${this.permission && this.permission.write && !this.editMode ? 
                    html`Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon to make changes.` : "" }
            </p>

            ${this.threadConfig}
            ${this.threadModelSelector}
            ${this.threadDatasetSelector}

            <div class="footer">
                <wl-button type="button" class="submit" @click="${this.continue}" ?disabled=${this._waiting}>
                    Select &amp; Continue
                    ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`: ''}
                </wl-button>
            </div>
        `;
    }

    private continue () : void {

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
                            ${this.indicatorSelector}
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
                response_variables: formThread.response_variables,
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
        let indicatorid : string = this.indicatorSelector.getSelectedId();
        
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
            response_variables: indicatorid ? [indicatorid] : [],
            //permissions: thread_permissions
        } as ThreadInfo;
    }

    private onEditEnable () : void {
        this.editMode = true;
        this.regionSelector.isEditable = true;
        this.indicatorSelector.isEditable = true;
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