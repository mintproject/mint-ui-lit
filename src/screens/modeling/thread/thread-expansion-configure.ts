import { customElement, html, css, TemplateResult } from "lit-element";
import { RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/expansion";
import "weightless/icon";
import "weightless/button";

import { ThreadExpansion } from "./thread-expansion";
import { Thread, ThreadInfo } from "../reducers";
import { getLatestEventOfType } from "util/event_utils";
import { toDateString } from "util/date-utils";
import { RegionSelector } from "components/region-selector";
import { updateThreadInformation } from "../actions";
import { getCreateEvent } from "util/graphql_adapter";

import { Variable, VariableMap } from "screens/variables/reducers";

type StatusType = "warning" | "done" | "error";

/*export interface ThreadConstraints {
    region: LocalRegion,
}*/

@customElement('thread-expansion-configure')
export class ThreadExpansionConfigure extends ThreadExpansion {
    protected _name: string = "General framing";
    protected _description : TemplateResult = html`General framing for this sub-task.
        The constraints set here will filter the models and datasets available on next step`;

    private regionSelector : RegionSelector;
    private indicators : VariableMap;

    constructor () {
        super();
        this.regionSelector = new RegionSelector();
    }

    static get styles() {
        return [SharedStyles, this.generalStyles, css`
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
        `];
    }

    protected getStatusInfo () : string {
        if (this.open)
            return "Edit framing options";
        return "Open to see general framing options";
    }

    public getStatus () : StatusType {
        if (!this.thread) return "error";
        if (this.thread.name && this.thread.regionid) return 'done';
        return "warning";
    }

    protected renderView (): TemplateResult {
        let thread: Thread = this.thread;
        let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
        return html`
            <table class="thread-detail-table">
                <tbody>
                    <tr>
                        <td> Goal: </td>
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
                    ${this.thread.response_variables && this.thread.response_variables.length > 0 ? html`
                    <tr>
                        <td> <label>Indicator:</label> </td>
                        <td>
                            ${this.indicators && Object.keys(this.indicators).length > 0 ? this.indicators[this.thread.response_variables[0]].name
                             : html`
                            <loading-dots></loading-dots>`}
                        </td>
                    </tr>`: ""
                    }
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

    protected renderEditForm (): TemplateResult {
        let thread: Thread = this.thread;
        let threadEvent = getLatestEventOfType(["CREATE", "UPDATE"], thread.events);
        return html`
            <table class="thread-detail-table">
                <tbody>
                    <tr>
                        <td> <label>Goal:</label> </td>
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
                            <select id="indicator_selector">
                                <option value="">Any</option>
                                ${Object.values(this.indicators).map((i:Variable) => html`
                                    <option value="${i.id}" 
                                            .selected=${this.thread.response_variables &&i.id === this.thread.response_variables[0]}>
                                        ${i.name}</option>
                                `)}
                            </select>
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

    protected onEditEnable(): void {
        super.onEditEnable();
        this.regionSelector.setEditable();
        this.regionSelector.updateMap();
    }

    protected onCancelClicked(): void {
        super.onCancelClicked();
        this.regionSelector.cancel();
    }

    protected onSaveClicked(): void {
        this.loading = true;
        this.regionSelector.save();
        let oldreg : string = this.thread.regionid;
        let req : Promise<void> = this.save();
        req.then(() => {
            this.editMode = false;
            this.loading = false;
            /*let constraints : ThreadConstraints = {
                region: this.regionSelector.getSelectedRegion()
            }*/

            let event : CustomEvent = new CustomEvent('thread-configuration-updated', {
                bubbles: true,
                composed: true,
                // detail: constraints
            });
            this.dispatchEvent(event);
        });
        req.catch(() => {
            this.regionSelector.setSelected(oldreg);
            this.onCancelClicked();
            this.loading = false;
            //TODO: show notification.
        })
    }

    protected onThreadChange(thread: Thread): void {
        if (this.thread) {
            this.regionSelector.setSelected(thread.regionid);
        } else {
            this.regionSelector.setSelected(null);
        }
    }

    stateChanged(state: RootState) {
        super.stateChanged(state);

        if (state.ui && state.regions) {
            this.regionSelector.loadRegionState(state.regions, state.ui.selected_top_regionid);
        }

        if(state.variables && state.variables.variables) {
            this.indicators = state.variables.variables;
        }
    }

    private async save () : Promise<void> {
        if (this.editMode) {
            let curThread : ThreadInfo = { ...this.thread };
            let formThread : ThreadInfo = this.getThreadFromForm();
            let editedThread : ThreadInfo = {
                id: curThread.id,
                task_id: curThread.task_id,
                regionid: this.regionSelector.getSelectedId(),
                name: formThread.name,
                dates: formThread.dates,
                response_variables: formThread.response_variables, //--
                driving_variables: curThread.driving_variables,  //--
                events: formThread.events,
                permissions: curThread.permissions
            };
            console.log(editedThread);

            this.loading = true;
            await updateThreadInformation(editedThread);
            this.loading = false;
        }
    }

    private getThreadFromForm () : ThreadInfo {
        let nameEl : HTMLInputElement = this.shadowRoot.getElementById("thread_name") as HTMLInputElement;
        let fromEl : HTMLInputElement = this.shadowRoot.getElementById("thread_from") as HTMLInputElement;
        let toEl : HTMLInputElement = this.shadowRoot.getElementById("thread_to") as HTMLInputElement;
        let notesEl : HTMLInputElement = this.shadowRoot.getElementById("thread_notes") as HTMLInputElement;
        let indicatorEl : HTMLInputElement = this.shadowRoot.getElementById("indicator_selector") as HTMLInputElement;

        let name : string = nameEl ? nameEl.value : "";
        let from : Date = fromEl ? new Date(fromEl.value) : null;
        let to : Date = toEl ? new Date(toEl.value) : null;
        let notes : string = notesEl ? notesEl.value : "";
        let regionid : string = this.regionSelector.getSelectedId();
        let indicatorid : string = indicatorEl ? indicatorEl.value : "";
        
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
}