import { html, customElement, property, css } from "lit-element";

import { SharedStyles } from "../../styles/shared-styles";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../app/store";

import {
  subscribeProblemStatementsList,
  addProblemStatement,
  deleteProblemStatement,
  updateProblemStatement,
} from "./actions";
import {
  ProblemStatementList,
  ProblemStatementInfo,
  ProblemStatementEvent,
} from "./reducers";

import "weightless/list-item";
import "weightless/button";
import "weightless/icon";
import "weightless/nav";
import "weightless/title";
//import "weightless/progress-bar";
import "weightless/dialog";
import "weightless/tooltip";
import "weightless/popover-card";
import "weightless/snackbar";

import "./mint-problem-statement";
import "../../components/permissions-editor";

import { goToPage } from "../../app/actions";
import { PageViewElement } from "../../components/page-view-element";
import { renderNotifications } from "../../util/ui_renders";
import {
  formElementsComplete,
  showDialog,
  hideDialog,
  showNotification,
  resetForm,
  hideNotification,
} from "../../util/ui_functions";
import { Region, RegionMap } from "../regions/reducers";
import { toDateString, toDateTimeString } from "util/date-utils";
import { getLatestEventOfType, getLatestEvent } from "util/event_utils";
import { getCreateEvent, getUpdateEvent } from "../../util/graphql_adapter";
import { getUserPermission } from "../../util/permission_utils";
import { PermissionsEditor } from "../../components/permissions-editor";

@customElement("problem-statements-list")
export class ProblemStatementsList extends connect(store)(PageViewElement) {
  @property({ type: Object })
  private _top_region: Region;

  @property({ type: Object })
  private _regions!: RegionMap;

  @property({ type: Object })
  private _list!: ProblemStatementList;

  @property({ type: Boolean })
  private _dispatched: Boolean;

  @property({ type: String })
  private _top_regionid?: string;

  static get styles() {
    return [
      SharedStyles,
      css`
        .small-notes {
          font-size: 13px;
          color: black;
        }
        .top-paragraph {
          margin-left: 44px;
        }
        div.caption {
          width: 200px;
        }
        @media (max-width: 1024px) {
          .big-screen {
            display: none;
          }
          .top-paragraph {
            margin-left: 10px;
          }
          wl-list-item {
            --list-item-padding: 10px;
            --list-item-after-margin: 5px !important;
          }
        }
      `,
    ];
  }

  protected render() {
    if (this._dispatched)
      return html`<wl-progress-spinner class="loading"></wl-progress-spinner>`;

    //console.log("rendering");
    return html`
      <div class="cltrow problem_statement_row">
        <wl-button flat inverted disabled>
          <wl-icon>arrow_back_ios</wl-icon>
        </wl-button>
        <div class="cltmain navtop">
          <wl-title level="3">Problem statements</wl-title>
        </div>
        <wl-icon
          @click="${this._addProblemStatementDialog}"
          class="actionIcon bigActionIcon addIcon"
          id="addProblemStatementIcon"
          >note_add</wl-icon
        >
      </div>
      <p class="top-paragraph">
        Choose an existing problem from the list below or click add to create a
        new one.
      </p>
      <!-- Show ProblemStatement List -->
      ${this._list &&
      this._list.problem_statement_ids.map((problem_statement_id) => {
        let problem_statement =
          this._list.problem_statements[problem_statement_id];
        let last_event = getLatestEvent(problem_statement.events);
        let permissions = getUserPermission(
          problem_statement.permissions,
          problem_statement.events
        );
        let create_event = getLatestEventOfType(
          ["CREATE"],
          problem_statement.events
        );
        //console.log(problem_statement.preview);
        //let region = this._regions[problem_statement.regionid];
        if (problem_statement.regionid == this._top_regionid) {
          return html`
            <wl-list-item
              class="active"
              @click="${this._onSelectProblemStatement}"
              data-problem_statement_id="${problem_statement.id}"
            >
              <div class="big-screen" slot="before">
                <wl-icon>label_important</wl-icon>
              </div>
              <div slot="after" style="display:flex">
                <div class="caption big-screen">
                  Last updated by: ${last_event?.userid}<br />
                  ${toDateTimeString(last_event?.timestamp)}
                </div>
                <div
                  style="height: 24px; width: 40px; padding-left: 10px; display:flex; justify-content: end"
                >
                  ${permissions.owner
                    ? html`
                        <wl-icon
                          @click="${this._editProblemStatementDialog}"
                          data-problem_statement_id="${problem_statement.id}"
                          id="editProblemStatementIcon"
                          class="actionIcon editIcon"
                          >edit</wl-icon
                        >
                      `
                    : !permissions.write
                    ? html`<div style="width:20px">&nbsp;</div>
                        <wl-icon class="smallIcon">lock</wl-icon>`
                    : ""}
                  ${permissions.owner
                    ? html`
                        <wl-icon
                          @click="${this._onDeleteProblemStatement}"
                          data-problem_statement_id="${problem_statement.id}"
                          id="delProblemStatementIcon"
                          class="actionIcon deleteIcon"
                          >delete</wl-icon
                        >
                      `
                    : ""}
                </div>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <wl-title level="4" style="margin: 0"
                    >${problem_statement.name}</wl-title
                  >
                  ${last_event?.notes
                    ? html`<div class="small-notes">
                        <b>Notes:</b> ${last_event.notes}
                      </div>`
                    : ""}
                  <div>
                    Time Period:
                    ${toDateString(problem_statement.dates.start_date)} to
                    ${toDateString(problem_statement.dates.end_date)}
                  </div>
                  <div class="caption">
                    Created by: ${create_event?.userid} at
                    ${toDateTimeString(create_event?.timestamp)}
                  </div>
                </div>
                <div class="big-screen" style="width: 250px;">
                  ${problem_statement.preview &&
                  problem_statement.preview.length > 0
                    ? html`<b>Indicators:</b> ${problem_statement.preview.join(
                          ", "
                        )}`
                    : ""}
                </div>
              </div>
            </wl-list-item>
          `;
        }
        return html``;
      })}
      ${this._renderTooltips()} ${renderNotifications()}
      ${this._renderDialogs()}
    `;
  }

  _renderTooltips() {
    return html`
      <wl-tooltip
        anchor="#addProblemStatementIcon"
        .anchorOpenEvents="${["mouseover"]}"
        .anchorCloseEvents="${["mouseout"]}"
        fixed
        anchorOriginX="center"
        anchorOriginY="bottom"
        transformOriginX="center"
      >
        Add a ProblemStatement
      </wl-tooltip>
      <wl-tooltip
        anchor="#editProblemStatementIcon"
        .anchorOpenEvents="${["mouseover"]}"
        .anchorCloseEvents="${["mouseout"]}"
        fixed
        anchorOriginX="center"
        anchorOriginY="bottom"
        transformOriginX="center"
      >
        Edit ProblemStatement
      </wl-tooltip>
      <wl-tooltip
        anchor="#delProblemStatementIcon"
        .anchorOpenEvents="${["mouseover"]}"
        .anchorCloseEvents="${["mouseout"]}"
        fixed
        anchorOriginX="center"
        anchorOriginY="bottom"
        transformOriginX="center"
      >
        Delete ProblemStatement
      </wl-tooltip>
    `;
  }

  _renderDialogs() {
    return html`
    <wl-dialog id="problem_statementDialog" fixed backdrop blockscrolling>
      <h3 slot="header">What is your Problem statement ?</h3>
      <div slot="content">
        <form id="problem_statementForm">
          <p>
          Please enter a short text to describe the overall problem. 
          For instance, “Explore interventions to increase agricultural productivity in South Sudan”,  
          “Explore interventions to improve farmer livelihoods in Gambella”. 
          </p>
          <input type="hidden" name="problem_statement_id"></input>
          <div class="input_full">
            <input name="problem_statement_name"></input>
          </div>
          
          <div style="height:10px;">&nbsp;</div>
          <input type="hidden" name="problem_statement_region" value="${this._top_region.id}"></input>
          <input type="hidden" name="problem_statement_subregion" value=""></input>

          <div class="input_full">
            <label>Time Period</label>
          </div>
          <div class="formRow">
            <div class="input_half">
              <input name="problem_statement_from" type="date"></input>
            </div>
            to
            <div class="input_half">
              <input name="problem_statement_to" type="date"></input>
            </div>
          </div>

          <p></p>
          <div class="input_full">
            <label>Notes</label>
          </div>
          <div class="input_full">
            <textarea style="color:unset; font: unset;" name="problem_statement_notes" rows="4"></textarea>
          </div>
          <permissions-editor id="problem_statement_permissions"></permissions-editor>
        </form>
      </div>
      <div slot="footer">
          <wl-button @click="${this._onAddEditProblemStatementCancel}" inverted flat>Cancel</wl-button>
          <wl-button @click="${this._onAddEditProblemStatementSubmit}" class="submit" id="dialog-submit-button">Submit</wl-button>
      </div>
    </wl-dialog>
    `;
  }

  _addProblemStatementDialog() {
    let form: HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>(
      "#problem_statementForm"
    )!;
    (form.elements["problem_statement_id"] as HTMLInputElement).value = "";
    (form.elements["problem_statement_name"] as HTMLInputElement).value = "";
    (form.elements["problem_statement_notes"] as HTMLInputElement).value = "";
    (form.elements["problem_statement_from"] as HTMLInputElement).value = "";
    (form.elements["problem_statement_to"] as HTMLInputElement).value = "";
    (
      form.querySelector("#problem_statement_permissions") as PermissionsEditor
    ).setPermissions([]);

    showDialog("problem_statementDialog", this.shadowRoot!);
  }

  async _onAddEditProblemStatementSubmit() {
    let form: HTMLFormElement = this.shadowRoot!.querySelector<HTMLFormElement>(
      "#problem_statementForm"
    )!;
    if (
      formElementsComplete(form, [
        "problem_statement_name",
        "problem_statement_region",
        "problem_statement_from",
        "problem_statement_to",
      ])
    ) {
      let problem_statement_id = (
        form.elements["problem_statement_id"] as HTMLInputElement
      ).value;
      let problem_statement_name = (
        form.elements["problem_statement_name"] as HTMLInputElement
      ).value;
      let problem_statement_region = (
        form.elements["problem_statement_region"] as HTMLInputElement
      ).value;
      let problem_statement_subregion = (
        form.elements["problem_statement_subregion"] as HTMLInputElement
      ).value;
      let problem_statement_from = new Date(
        (form.elements["problem_statement_from"] as HTMLInputElement).value
      );
      let problem_statement_to = new Date(
        (form.elements["problem_statement_to"] as HTMLInputElement).value
      );
      let problem_statement_notes = (
        form.elements["problem_statement_notes"] as HTMLInputElement
      ).value;
      let problem_statement_permissions = (
        form.querySelector(
          "#problem_statement_permissions"
        ) as PermissionsEditor
      ).permissions;
      if (problem_statement_from >= problem_statement_to) {
        alert("The start date should be before the end date");
        return;
      }

      let problem_statement = {
        name: problem_statement_name,
        regionid: problem_statement_region,
        subregionid: problem_statement_subregion,
        dates: {
          start_date: problem_statement_from,
          end_date: problem_statement_to,
        },
        notes: problem_statement_notes,
        events: [],
        permissions: problem_statement_permissions,
      } as ProblemStatementInfo;

      showNotification("saveNotification", this.shadowRoot!);
      if (problem_statement_id) {
        problem_statement.id = problem_statement_id;
        problem_statement.events = [
          getUpdateEvent(problem_statement_notes) as ProblemStatementEvent,
        ];
        await updateProblemStatement(problem_statement);
      } else {
        problem_statement.events.push(
          getCreateEvent(problem_statement_notes) as ProblemStatementEvent
        );
        problem_statement_id = await addProblemStatement(problem_statement);
        goToPage("modeling/problem_statement/" + problem_statement_id);
      }
      hideNotification("saveNotification", this.shadowRoot!);
      hideDialog("problem_statementDialog", this.shadowRoot!);
    } else {
      showNotification("formValuesIncompleteNotification", this.shadowRoot!);
    }
  }

  _onAddEditProblemStatementCancel() {
    hideDialog("problem_statementDialog", this.shadowRoot!);
  }

  _editProblemStatementDialog(e: Event) {
    let problem_statement_id = (e.currentTarget as HTMLButtonElement).dataset[
      "problem_statement_id"
    ];
    if (problem_statement_id) {
      let problem_statement =
        this._list!.problem_statements[problem_statement_id];
      if (problem_statement) {
        let form = this.shadowRoot!.querySelector<HTMLFormElement>(
          "#problem_statementForm"
        )!;
        resetForm(form, null);
        let dates = problem_statement.dates;
        let last_event = getLatestEventOfType(
          ["CREATE", "UPDATE"],
          problem_statement.events
        );
        (form.elements["problem_statement_id"] as HTMLInputElement).value =
          problem_statement.id;
        (form.elements["problem_statement_name"] as HTMLInputElement).value =
          problem_statement.name;
        (form.elements["problem_statement_region"] as HTMLInputElement).value =
          problem_statement.regionid;
        (form.elements["problem_statement_from"] as HTMLInputElement).value =
          toDateString(dates.start_date);
        (form.elements["problem_statement_to"] as HTMLInputElement).value =
          toDateString(dates.end_date);
        (form.elements["problem_statement_notes"] as HTMLInputElement).value =
          last_event?.notes ? last_event.notes : "";
        (
          form.querySelector(
            "#problem_statement_permissions"
          ) as PermissionsEditor
        ).setPermissions(problem_statement.permissions);
        showDialog("problem_statementDialog", this.shadowRoot!);
      }
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  _onDeleteProblemStatement(e: Event) {
    let problem_statement_id = (e.currentTarget as HTMLButtonElement).dataset[
      "problem_statement_id"
    ];
    e.stopPropagation();
    e.preventDefault();
    if (problem_statement_id) {
      let problem_statement =
        this._list!.problem_statements[problem_statement_id];
      if (problem_statement) {
        if (
          !confirm(
            "Do you want to delete the problem_statement '" +
              problem_statement.name +
              "' ?"
          )
        )
          return false;

        showNotification("deleteNotification", this.shadowRoot!);
        // Delete problem_statement itself. ProblemStatement deletion returns a "Promise"
        deleteProblemStatement(problem_statement.id!).then(() => {
          hideNotification("deleteNotification", this.shadowRoot!);
        });
      }
    }
    return false;
  }

  _showProblemStatements() {
    var item = this.shadowRoot!.getElementById("problem_statementsTab");
    var item2 = this.shadowRoot!.getElementById("datasetsTab");
    item!.className = "middle2 active";
    item2!.className = "middle2";
  }

  _showDatasets() {
    var item = this.shadowRoot!.getElementById("problem_statementsTab");
    var item2 = this.shadowRoot!.getElementById("datasetsTab");
    item!.className = "middle2";
    item2!.className = "middle2 active";
  }

  _onSelectProblemStatement(e: Event) {
    let selectedProblemStatementId =
      (e.currentTarget as HTMLButtonElement).dataset["problem_statement_id"] +
      "";
    this._selectProblemStatement(selectedProblemStatementId);
  }

  _selectProblemStatement(problem_statement_id: string) {
    goToPage("modeling/problem_statement/" + problem_statement_id);
  }

  _subscribeToProblemStatementList() {
    if (this._list && this._list.unsubscribe) this._list.unsubscribe();
    this._dispatched = true;
    console.log(
      "Subscribing to Problem Statement List for " + this._top_regionid
    );
    store.dispatch(subscribeProblemStatementsList(this._top_regionid));
  }

  // This is called every time something is updated in the store.
  stateChanged(state: RootState) {
    //console.log(state);
    if (state.modeling) {
      if (state.modeling.problem_statements) {
        this._list = state.modeling.problem_statements;
        this._dispatched = false;
        this._list.problem_statement_ids.sort((id1, id2) => {
          return getLatestEvent(this._list.problem_statements[id2].events)
            ?.timestamp <
            getLatestEvent(this._list.problem_statements[id1].events)?.timestamp
            ? -1
            : 1;
        });
      }
    }
    if (state.ui && state.ui.selected_top_regionid && state.regions!.regions) {
      if (this._top_regionid != state.ui.selected_top_regionid) {
        this._top_regionid = state.ui.selected_top_regionid;
        this._regions = state.regions!.regions;
        this._top_region = this._regions[this._top_regionid];
        this._subscribeToProblemStatementList();
      }
    }
    super.setRegionId(state);
  }
}
