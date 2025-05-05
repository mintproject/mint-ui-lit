import { property, html, customElement, css } from "lit-element";

import { SharedStyles } from "styles/shared-styles";
import { ExplorerStyles } from "../../model-explore/explorer-styles";

import { store, RootState } from "app/store";
import { CustomNotification } from "components/notification";
import { IdMap } from "app/reducers";
import { showDialog, hideDialog } from "util/ui_functions";
import { PREFIX_URI } from "config/default-graph";

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/textarea";
import "weightless/card";
import "weightless/dialog";
import "weightless/button";
import "components/loading-dots";

import { Textfield } from "weightless/textfield";
import { Textarea } from "weightless/textarea";
import { Select } from "weightless/select";

/************/
import { LitElement } from "lit-element";
import { getId, getLabel, capitalizeFirstLetter } from "model-catalog-api/util";
interface BaseResources {
  id?: string;
  label?: string[];
  description?: string[];
}

export enum Action {
  NONE,
  SELECT,
  MULTISELECT,
  EDIT_OR_ADD,
}

export enum Status {
  NONE,
  CREATE,
  EDIT,
  CUSTOM_CREATE,
}

import { BaseAPI } from "@mintproject/modelcatalog_client";
import { DefaultReduxApi } from "model-catalog-api/default-redux-api";

@customElement("model-catalog-resource")
export class ModelCatalogResource<T extends BaseResources> extends LitElement {
  static get styles() {
    return [ExplorerStyles, SharedStyles, this.getBasicStyles()];
  }

  public static getBasicStyles() {
    return css`
      #select-button {
        border: 1px solid gray;
        margin-right: 5px;
        --button-padding: 4px;
      }

      .list-item {
        display: grid !important;
        margin: 2px 0px !important;
        grid-template-columns: auto 58px;
        align-items: center;
      }

      .list-item.no-buttons {
        grid-template-columns: auto !important;
      }

      .clickable-area {
        display: grid;
        grid-template-columns: 30px auto;
        align-items: center;
        overflow: hidden;
        cursor: pointer;
      }

      .buttons-area {
        display: inline-block;
      }

      .buttons-area > wl-button {
        --button-padding: 5px;
      }

      wl-button.edit {
        --button-padding: 5px;
        border: 1px solid grey;
      }

      .custom-radio {
        width: 28px;
        line-height: 1.5em;
      }

      wl-icon.warning:hover {
        color: darkred;
      }

      span.bold {
        font-weight: bold;
      }

      .striped tr:nth-child(2n-1) td {
        background-color: #f6f6f6;
      }

      .resources-list {
        margin-top: 5px;
        height: var(--list-height, 400px);
        overflow-y: scroll;
      }
      .grab {
        cursor: grab;
      }
      .grabCursor,
      .grabCursor * {
        cursor: grabbing !important;
      }
      .grabbed {
        border: 2px solid grey;
      }

      #resource-dialog {
        --dialog-height: var(--dialog-height, unset);
      }

      #retry-button {
        display: inline-block;
        height: 1em;
        width: 20px;
        cursor: pointer;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0px 0px;
      }

      .pagination > wl-button {
        padding: 8px;
        border-radius: 4px;
      }
    `;
  }

  // Resources
  protected _loadedResources: IdMap<T> = {} as IdMap<T>;
  protected _resourcesToEdit: IdMap<T> = {} as IdMap<T>;
  protected _resourcesToCreate: IdMap<T> = {} as IdMap<T>;
  @property({ type: Object }) protected _loading: IdMap<boolean> = {};
  @property({ type: Object }) protected _error: IdMap<boolean> = {};
  @property({ type: Boolean }) protected _allResourcesLoaded: boolean = false;
  @property({ type: Boolean }) protected _allResourcesLoading: boolean = false;
  // FIXME: this could be only one.
  @property({ type: String }) protected _selectedResourceId: string = "";
  @property({ type: String }) protected _editingResourceId: string = "";
  protected _selectedResources: IdMap<boolean> = {};

  // FLAGS
  @property({ type: Number }) protected _action: Action = Action.NONE; //NONE, SELECT, MULTISELECT, EDIT_OR_ADD,
  @property({ type: Number }) protected _status: Status = Status.NONE; //NONE, CREATE, EDIT, CUSTOM_CREATE,

  @property({ type: Boolean }) public inline: boolean = true;
  @property({ type: Boolean }) public uniqueLabel: boolean = false;
  @property({ type: Boolean }) private _dialogOpen: boolean = false;
  @property({ type: Boolean }) protected _waiting: boolean = false;
  @property({ type: Boolean }) protected _singleMode: boolean = false;

  @property({ type: Array }) protected _resources: T[] = [] as T[];
  @property({ type: Array }) protected _orderedResources: T[] = [] as T[];

  @property({ type: String }) protected _textFilter: string = "";
  @property({ type: Boolean }) protected _creationEnabled: boolean = true;
  @property({ type: Boolean }) protected _editionEnabled: boolean = true;
  @property({ type: Boolean }) protected _deletionEnabled: boolean = true;
  @property({ type: Boolean }) protected _duplicationEnabled: boolean = false;

  @property({ type: Number }) protected _page: number = 0;
  public pageMax: number = -1;
  public inlineMax: number = -1;
  @property({ type: Boolean }) private inlineMaxShowMore: boolean = false;

  private _order: IdMap<T> = {} as IdMap<T>;
  protected _notification: CustomNotification;

  private _idToCopy: IdMap<string> = {} as IdMap<string>;
  public lazy: boolean = false;
  private _nameEditable: boolean = true;

  protected classes: string = "resource";
  protected name: string = "resource";
  protected pname: string = "resources";
  public colspan: number = 2;
  protected positionAttr: string = "";

  protected resourceApi: DefaultReduxApi<T, BaseAPI>;

  protected resourcePost = (r: T) => {
    //This should replaced
    return this.resourceApi?.post(r);
  };

  protected _filters: ((r: T) => boolean)[] = [
    (r: T) => this._resourceToText(r).toLowerCase().includes(this._textFilter),
  ];

  public enableCreation() {
    this._creationEnabled = true;
  }

  public disableCreation() {
    this._creationEnabled = false;
  }

  public enableEdition() {
    this._editionEnabled = true;
  }

  public disableEdition() {
    this._editionEnabled = false;
  }

  public enableDeletion() {
    this._deletionEnabled = true;
  }

  public disableDeletion() {
    this._deletionEnabled = false;
  }


  public enableDuplication(...args: any[]) {
    this._duplicationEnabled = true;
  }

  public disableDuplication() {
    this._duplicationEnabled = false;
  }

  public isCreating() {
    return this._status == Status.CREATE;
  }

  protected _singleModeInitialized: boolean = false;

  /* Must be defined */
  protected _initializeSingleMode() {
    console.error("Single mode no defined");
  }

  public unsetAction() {
    this._action = Action.NONE;
  }

  public setActionSelect() {
    this._action = Action.SELECT;
  }

  public setActionMultiselect() {
    this._action = Action.MULTISELECT;
  }

  public setActionEditOrAdd() {
    this._action = Action.EDIT_OR_ADD;
  }

  /* Complex resources can have inner resources */
  protected _setSubActions() {}

  protected _unsetSubActions() {}

  public setName(newName: string) {
    this.name = newName;
  }

  public constructor() {
    super();
    this._notification = new CustomNotification();
  }

  protected render() {
    return html`
      ${this._singleMode
        ? this._renderFullView()
        : this.inline
        ? this._renderInline()
        : this._renderTable()}
      <wl-dialog
        class="larger"
        id="resource-dialog"
        fixed
        backdrop
        blockscrolling
        persistent
      >
        ${this._dialogOpen ? this._renderDialogContent() : ""}
      </wl-dialog>
      ${this._notification}
    `;
  }

  private _renderFullView() {
    if (this._status === Status.CREATE) {
      return html` ${this._renderFullForm()} ${this._renderActionButtons()} `;
    } else if (this._resources.length > 0) {
      let r: T = this._resources[0];
      if (this._loading[r.id])
        return html`<div style="text-align: center;">
          <wl-progress-spinner></wl-progress-spinner>
        </div>`;
      if (this._error[r.id])
        return html`<p>
          An error has ocurred trying to load this resource.
          <span @click="${() => this._forceLoad(r)}" id="retry-button">
            <wl-icon style="position:fixed;">cached</wl-icon>
          </span>
        </p>`;
      return html`
        ${this._status === Status.EDIT
          ? this._renderFullForm()
          : this._renderFullResource(this._loadedResources[r.id])}
        ${this._renderActionButtons()}
      `;
    } else {
      return this._renderEmpty();
    }
  }

  private _renderInline() {
    return html` <div style="display: flex; justify-content: space-between;">
      <span>
        ${this._resources.length == 0
          ? this._renderEmpty()
          : this._resources
              .filter(
                (r: T, i: number) =>
                  this.inlineMaxShowMore ||
                  this.inlineMax < 0 ||
                  i < this.inlineMax
              )
              .map((r: T) => this._renderStatus(r))}
        ${this.inlineMax > 0 && this.inlineMax < this._resources.length
          ? html`
              <a
                style="display: block"
                @click=${() =>
                  (this.inlineMaxShowMore = !this.inlineMaxShowMore)}
              >
                Show ${this.inlineMaxShowMore ? "less" : "more"}
              </a>
            `
          : ""}
      </span>
      <span>
        ${this._action === Action.SELECT || this._action === Action.MULTISELECT
          ? html` <wl-button
              @click="${this._showEditSelectionDialog}"
              id="select-button"
              flat
              inverted
            >
              <wl-icon>edit</wl-icon>
            </wl-button>`
          : ""}
      </span>
    </div>`;
  }

  private _renderTable() {
    let displayedResources: T[] =
      this.positionAttr && this._orderedResources.length > 0
        ? this._orderedResources
        : this._resources;
    let editing: boolean = this._action === Action.EDIT_OR_ADD;
    return html`
      <table class="pure-table striped" style="width: 100%">
        <thead>
          ${editing && this.positionAttr
            ? html`<th style="width:10px;"></th>`
            : ""}
          ${this._renderTableHeader()}
          ${editing ? html`<th style="width:10px;"></th>` : ""}
        </thead>
        ${this._resources.length > 0
          ? displayedResources.map((r: T) => this._renderStatus(r))
          : ""}
        ${this._action === Action.EDIT_OR_ADD && this._creationEnabled
          ? html` <tr class="ignore-grab">
              <td
                colspan="${this.positionAttr
                  ? this.colspan + 2
                  : this.colspan + 1}"
                align="center"
              >
                <a class="clickable" @click=${this._createResource}
                  >Add a new ${this.name}</a
                >
              </td>
            </tr>`
          : this._resources.length == 0
          ? html` <tr>
              <td colspan="${this.colspan + 1}" align="center">
                ${this._renderEmpty()}
              </td>
            </tr>`
          : ""}
      </table>
    `;
  }

  protected _renderTableHeader() {
    return html`
      <th><b>Name</b></th>
      <th><b>Description</b></th>
    `;
  }

  private _renderDialogContent() {
    if (this._status === Status.CREATE || this._status === Status.EDIT) {
      return this._renderFormDialog();
    } else if (
      this._action === Action.SELECT ||
      this._action === Action.MULTISELECT
    ) {
      return this._renderSelectDialog();
    }
  }

  protected _renderSelectDialog() {
    return html` <h3 slot="header">
        Select ${this._action === Action.SELECT ? this.name : this.pname}
      </h3>
      <div slot="content">
        ${this._renderSearchOnList()} ${this._renderSelectList()}
      </div>
      <div
        slot="footer"
        style="justify-content: space-between; padding: 0px 20px 20px;"
      >
        <div>
          ${this._creationEnabled
            ? html` <wl-button
                @click="${this._createResource}"
                style="--primary-hue: 124; --button-border-radius: 3px;"
              >
                Create a new ${this.name}
              </wl-button>`
            : ""}
        </div>
        <div>
          <wl-button
            @click="${this._closeDialog}"
            style="margin-right: 5px;"
            inverted
            flat
          >
            Cancel
          </wl-button>
          <wl-button class="submit" @click="${this._onSelectButtonClicked}">
            Select
          </wl-button>
        </div>
      </div>`;
  }

  protected _renderEmpty() {
    return "None specified";
  }

  private _renderStatus(r: T) {
    let lr: T = this._loadedResources[r.id];
    if (this.inline)
      return html`<span class="${this.classes}">
        ${this._loading[r.id]
          ? html`${getId(r)}
              <loading-dots
                style="--width: 20px; margin-left: 5px;"
              ></loading-dots>`
          : this._error[r.id]
          ? html` <span style="color:red;">${getId(r)}</span>
              <span @click="${() => this._forceLoad(r)}" id="retry-button">
                <wl-icon style="position:fixed;">cached</wl-icon>
              </span>`
          : this._renderResource(lr)}
      </span>`;
    else
      return html`<tr>
        ${this._loading[r.id]
          ? html`<td
              colspan="${this.positionAttr ? this.colspan + 1 : this.colspan}"
              align="center"
            >
              ${getId(r)}
              <loading-dots
                style="--width: 20px; margin-left: 5px;"
              ></loading-dots>
            </td>`
          : html` ${this._action === Action.EDIT_OR_ADD && this.positionAttr
              ? html` <td class="grab" @mousedown=${this._grabPosition}>
                  ${this._getResourcePosition(lr) > 0
                    ? this._getResourcePosition(lr)
                    : "-"}
                </td>`
              : ""}
            ${this._renderRow(lr)}
            ${this._action === Action.EDIT_OR_ADD
              ? html` <td
                  style="width: ${this._deletionEnabled ? "65" : "30"}px"
                >
                  <div style="display: flex; justify-content: space-between;">
                    <wl-button
                      class="edit"
                      @click="${() => this._editResource(r)}"
                      flat
                      inverted
                    >
                      <wl-icon>edit</wl-icon>
                    </wl-button>
                    ${this._deletionEnabled
                      ? html`
                          <wl-button
                            class="edit"
                            @click="${() => this._deleteResource(r)}"
                            flat
                            inverted
                          >
                            <wl-icon>delete</wl-icon>
                          </wl-button>
                        `
                      : ""}
                  </div>
                </td>`
              : ""}`}
      </tr>`;
  }

  protected _renderResource(r: T) {
    return html`${getLabel(r)}`;
  }

  protected _renderFullResource(r: T) {
    return this._renderResource(r);
  }

  protected _renderRow(r: T) {
    if (r)
      return html`
        <td>${getLabel(r)}</td>
        <td>${r.description ? r.description[0] : ""}</td>
      `;
    return html``;
  }

  protected _renderSearchOnList() {
    return html`
      <wl-textfield
        label="Search ${this.pname}"
        @input="${this._onSearchChange}"
        id="search-input"
      >
        <wl-icon slot="after">search</wl-icon>
      </wl-textfield>
    `;
  }

  protected _renderActionButtons() {
    if (this._status === Status.CREATE || this._status === Status.EDIT) {
      return html` <div style="float:right; margin-top: 1em;">
        <wl-button
          @click="${this._onCancelButtonClicked}"
          style="margin-right: 1em;"
          flat
          inverted
          ?disabled=${this._waiting}
        >
          <wl-icon>cancel</wl-icon>&ensp;Discard changes
        </wl-button>
        <wl-button
          @click="${this._onSaveButtonClicked}"
          ?disabled=${this._waiting}
        >
          <wl-icon>save</wl-icon>&ensp;Save
          ${this._waiting
            ? html`<loading-dots
                style="--width: 20px; margin-left: 4px;"
              ></loading-dots>`
            : ""}
        </wl-button>
      </div>`;
    } else {
      return html` <div
        style="display: flex; justify-content: space-between; padding: 1em 0;"
      >
        <span>
          <wl-button
            style="--primary-hue: 0; --primary-saturation: 75%"
            ?disabled="${!this._deletionEnabled || this._waiting}"
            @click="${() => this._deleteResource(this._resources[0])}"
          >
            <wl-icon>delete</wl-icon>&ensp;Delete
          </wl-button>
          <wl-button
            style="--primary-hue: 124; --primary-saturation: 45%; margin-left: 0.5em;"
            ?disabled="${!this._duplicationEnabled || this._waiting}"
            @click="${this._onDuplicateButtonClicked}"
          >
            <wl-icon>edit</wl-icon>&ensp;Duplicate
            ${this._waiting
              ? html`<loading-dots
                  style="--width: 20px; margin-left: 4px;"
                ></loading-dots>`
              : ""}
          </wl-button>
        </span>
        <wl-button
          @click="${() => this._editResource(this._resources[0])}"
          ?disabled=${this._waiting}
        >
          <wl-icon>edit</wl-icon>&ensp;Edit
        </wl-button>
      </div>`;
    }
  }

  private _onCancelButtonClicked() {
    this._clearStatus();
    this._eventCancel();
  }

  private _onDuplicateButtonClicked() {
    let p: Promise<T> = this.duplicate();
    this._waiting = true;
    p.then((r: T) => {
      this._notification.save(
        capitalizeFirstLetter(this.name) + " duplicated."
      );
      this._eventSave(r);
      this._waiting = false;
    });
    p.catch((err) => {
      this._notification.error("Error trying to duplicate resource");
      this._waiting = false;
    });
  }

  _searchPromise = null;
  private _onSearchChange() {
    let searchInput = this.shadowRoot.getElementById(
      "search-input"
    ) as Textfield;
    if (this._searchPromise) {
      clearTimeout(this._searchPromise);
    }
    this._searchPromise = setTimeout(() => {
      this._textFilter = searchInput.value.toLowerCase();
      this._page = 0;
      this._searchPromise = null;
    }, 300);
  }

  private _filterByText(r: T) {
    return this._resourceToText(r).toLowerCase().includes(this._textFilter);
  }

  protected _resourceToText(r: T) {
    return getLabel(r);
  }

  protected _renderSelectList() {
    if (!this._allResourcesLoaded && !this._allResourcesLoading)
      this._loadAllResources();
    let sortBySelection = (a: T, b: T) => {
      if (a && isSelected(a.id)) return -1;
      if (b && isSelected(b.id)) return 1;
      return 0;
    };

    // Diff between SELECT and MULTISELECT
    let checked: string =
      this._action === Action.SELECT ? "radio_button_checked" : "check_box";
    let unchecked: string =
      this._action === Action.SELECT
        ? "radio_button_unchecked"
        : "check_box_outline_blank";
    let isSelected: (id: string) => boolean =
      this._action === Action.SELECT
        ? (id: string) => this._selectedResourceId === id
        : (id: string) => !!this._selectedResources[id];
    let setSelected: (id: string) => void =
      this._action === Action.SELECT
        ? (id: string) => {
            this._selectedResourceId = id;
          }
        : (id: string) => {
            this._selectedResources[id] = !this._selectedResources[id];
            this.requestUpdate();
          };
    let resourcesToShow: T[] = [];
    let pages: number = -1;
    if (!this._allResourcesLoading) {
      resourcesToShow = Object.values(this._loadedResources).sort(
        sortBySelection
      );
      this._filters.forEach((filter: (r: T) => boolean) => {
        resourcesToShow = resourcesToShow.filter(filter);
      });
      if (this.pageMax > 0 && this.pageMax < resourcesToShow.length) {
        pages = Math.ceil(resourcesToShow.length / this.pageMax);
        resourcesToShow = resourcesToShow.filter((r, i) => {
          let a: boolean = i >= this._page * this.pageMax;
          let b: boolean = i < (this._page + 1) * this.pageMax;
          return a && b;
        });
      }
    }

    return html`
      <div class="resources-list">
        ${this._action === Action.SELECT
          ? html` <span class="${this.classes} list-item no-buttons">
              <span
                class="clickable-area"
                @click=${() => {
                  this._selectedResourceId = "";
                }}
              >
                <span style="display: inline-block; vertical-align: top;">
                  <wl-icon class="custom-radio">
                    ${!this._selectedResourceId ? checked : unchecked}
                  </wl-icon>
                </span>
                <span
                  class="${!this._selectedResourceId ? "bold" : ""}"
                  style="display: inline-block;"
                >
                  No ${this.name}
                </span>
              </span>
            </span>`
          : ""}
        ${this._allResourcesLoading
          ? html`<div style="text-align: center;">
              <wl-progress-spinner></wl-progress-spinner>
            </div>`
          : resourcesToShow.map(
              (r: T) => html` <span class="${this.classes} list-item">
                <span
                  class="clickable-area"
                  @click="${() => setSelected(r.id)}"
                >
                  <span style="display: inline-block; vertical-align: top;">
                    <wl-icon class="custom-radio">
                      ${isSelected(r.id) ? checked : unchecked}
                    </wl-icon>
                  </span>
                  <span
                    class="${isSelected(r.id) ? "bold" : ""}"
                    style="display: inline-block;"
                  >
                    ${this._renderResource(r)}
                  </span>
                </span>
                <span class="buttons-area">
                  <wl-button
                    @click="${() => this._editResource(r)}"
                    flat
                    inverted
                    ?disabled="${!this._editionEnabled}"
                  >
                    <wl-icon>edit</wl-icon>
                  </wl-button>
                  <wl-button
                    @click="${() => this._deleteResource(r)}"
                    flat
                    inverted
                    ?disabled="${!this._deletionEnabled}"
                  >
                    <wl-icon class="warning">delete</wl-icon>
                  </wl-button>
                </span>
              </span>`
            )}
      </div>
      ${pages > 0
        ? html`
            <div class="pagination">
              <wl-button
                @click="${() => {
                  this._page = this._page - 1;
                }}"
                .disabled="${this._page == 0}"
              >
                Prev
              </wl-button>
              <span> Page ${this._page + 1} of ${pages} </span>
              <wl-button
                @click="${() => {
                  this._page = this._page + 1;
                }}"
                .disabled="${this._page == pages - 1}"
              >
                Next
              </wl-button>
            </div>
          `
        : ""}
    `;
  }

  protected _getEditingResource() {
    if (
      this._status === Status.EDIT &&
      this._editingResourceId &&
      this._loadedResources[this._editingResourceId]
    ) {
      return this._loadedResources[this._editingResourceId];
    }
    return null;
  }

  private _renderFormDialog() {
    let edResource = this._getEditingResource();
    return html` <h3 slot="header">
        ${this._status === Status.CREATE
          ? "Creating new " + this.name
          : "Editing " +
            this.name +
            " " +
            (edResource ? getLabel(edResource) : "-")}
      </h3>
      <div slot="content">${this._renderForm()}</div>
      <div slot="footer">
        <wl-button
          @click="${this._clearStatus}"
          style="margin-right: 5px;"
          inverted
          flat
          ?disabled="${this._waiting}"
        >
          Cancel
        </wl-button>
        <wl-button
          class="submit"
          ?disabled="${this._waiting}"
          @click="${this._onSaveButtonClicked}"
        >
          Save
          ${this._waiting
            ? html`<loading-dots
                style="--width: 20px; margin-left: 4px;"
              ></loading-dots>`
            : ""}
        </wl-button>
      </div>`;
  }

  protected _renderForm() {
    let edResource = this._getEditingResource();
    return html` <form>
      <wl-textfield
        id="resource-label"
        label="Name"
        required
        value=${edResource ? getLabel(edResource) : ""}
      >
      </wl-textfield>
      <wl-textarea
        id="resource-desc"
        label="Description"
        required
        value=${edResource && edResource.description
          ? edResource.description[0]
          : ""}
      >
      </wl-textarea>
    </form>`;
  }

  protected _renderFullForm() {
    return this._renderForm();
  }

  public clearForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "resource-label"
    ) as Textfield;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "resource-desc"
    ) as Textarea;
    // VALIDATE
    if (inputLabel) inputLabel.value = "";
    if (inputDesc) inputDesc.value = "";
  }

  private _grabPosition(e) {
    let tr = e.target.closest("TR");
    let trRect = tr.getBoundingClientRect();
    let trMax = trRect.top + trRect.height;
    let oldIndex = tr.rowIndex;
    let table = tr.parentElement;
    let drag;
    let thisElement = this;

    table.classList.add("grabCursor");
    table.style.userSelect = "none";
    tr.classList.add("grabbed");

    function move(e) {
      if (!drag && e.pageY > trRect.top && e.pageY < trMax) {
        return;
      }
      drag = true;
      let sibling = tr.parentNode.firstChild; //This can be improved as we know where can be the element.
      while (sibling) {
        if (
          sibling.nodeType === 1 &&
          sibling !== tr &&
          !sibling.classList.contains("ignore-grab")
        ) {
          let tRect = sibling.getBoundingClientRect();
          let tMax = tRect.top + tRect.height;
          if (e.pageY > tRect.top && e.pageY < tMax) {
            if (sibling.rowIndex < tr.rowIndex)
              tr.parentNode.insertBefore(tr, sibling);
            else tr.parentNode.insertBefore(tr, sibling.nextSibling);
            return false;
          }
        }
        sibling = sibling.nextSibling;
      }
    }

    function up(e) {
      if (drag && oldIndex != tr.rowIndex) {
        drag = false;
        if (confirm("Are you sure you want to move this " + thisElement.name)) {
          thisElement._changeOrder(oldIndex + 1, tr.rowIndex + 1);
        }
        let sibling = tr.parentNode.firstChild;
        while (sibling) {
          if (
            sibling.nodeType === 1 &&
            sibling !== tr &&
            sibling.rowIndex === oldIndex
          ) {
            if (tr.rowIndex > oldIndex) tr.parentNode.insertBefore(tr, sibling);
            else tr.parentNode.insertBefore(tr, sibling.nextSibling);
            break;
          }
          sibling = sibling.nextSibling;
        }
      }
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      table.classList.remove("grabCursor");
      table.style.userSelect = "none";
      tr.classList.remove("grabbed");
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  private _changeOrder(oldIndex: number, newIndex: number) {
    let min: number = oldIndex > newIndex ? newIndex : oldIndex;
    let max: number = oldIndex > newIndex ? oldIndex : newIndex;
    let mov: number = oldIndex > newIndex ? +1 : -1;
    for (let i = min; i < max + 1; i++) {
      let index: number = i === oldIndex ? newIndex : i + mov;
      this._setResourcePosition(this._orderedResources[i - 1], index);
    }
    this._refreshOrder();
  }

  protected _closeDialog() {
    hideDialog("resource-dialog", this.shadowRoot);
    this._dialogOpen = false;
  }

  protected _clearStatus() {
    if (
      this._status === Status.CREATE ||
      this._status === Status.CUSTOM_CREATE
    ) {
      this._unsetSubResources();
    }
    this._status = Status.NONE;
    this._editingResourceId = "";
    if (this._action === Action.EDIT_OR_ADD) {
      this._closeDialog();
    }
    this.clearForm();
    this._unsetSubActions();
  }

  protected _onSelectButtonClicked() {
    if (this._action === Action.MULTISELECT) {
      this._resources = Object.keys(this._selectedResources)
        .filter((id: string) => this._selectedResources[id])
        .map((id: string) => this._loadedResources[id]);
    } else if (this._action === Action.SELECT) {
      if (this._selectedResourceId) {
        this._resources = [this._loadedResources[this._selectedResourceId]];
      } else {
        this._resources = [];
      }
    }
    this._closeDialog();
  }

  protected _onSaveButtonClicked() {
    //FIXME: this should be a unique getresourceformfrom function.
    let resource = this._singleMode
      ? this._getResourceFromFullForm()
      : this._getResourceFromForm();
    if (resource && this._status != Status.NONE) {
      if (
        this._status === Status.CREATE ||
        this._status === Status.CUSTOM_CREATE
      ) {
        if (!this.uniqueLabel || this._checkLabelUniq(resource)) {
          resource.id = "";
        } else {
          this._uniqueLabelError(resource);
          return null;
        }
      } else if (this._status === Status.EDIT) {
        resource.id = this._editingResourceId;
        resource = this._createEditedResource(resource);
      }

      if (this.lazy) this._saveResourceLazy(resource);
      else this._saveResource(resource);
    }
  }

  protected _checkLabelUniq(resource: T) {
    //Is all loaded?
    let label: string = getLabel(resource).toLowerCase();
    return !Object.values(this._loadedResources).some(
      (r: T) =>
        r &&
        r.label &&
        r.label.some((name: string) => name.toLowerCase() == label)
    );
  }

  protected _uniqueLabelError(resource: T) {
    this._notification.error(
      'The name "' + getLabel(resource) + '" is already on use.'
    );
  }

  protected _saveResource(r: T) {
    this._waiting = true;
    return new Promise((resolve, reject) => {
      let inner: Promise<T> = this._createLazyInnerResources(r);
      inner.catch(reject);
      inner.then((resource: T) => {
        let req: Promise<T>;
        if (resource.id) {
          req = store.dispatch(this.resourceApi.put(resource));
        } else {
          req = store.dispatch(this.resourcePost(resource));
        }
        req.catch(reject);
        req.then((r: T) => {
          this._waiting = false;
          this._loadedResources[r.id] = r;
          this._notification.save(this.name + " saved");
          this._postSaveUpdate(r);
          this._eventSave(r);
          resolve(r);
        });
      });
    });
  }

  /* This function must be redefined when a complex resource is saved and some of his inner resources is lazy */
  protected _createLazyInnerResources(r: T) {
    return Promise.resolve(r);
  }

  protected _postSaveUpdate(r: T) {
    this._clearStatus();
    if (
      this._action === Action.EDIT_OR_ADD &&
      this._resources.filter((s: T) => s.id === r.id).length === 0
    ) {
      //Check if saved resource is already selected.
      if (this._resources.some((r2: T) => r2.id === r.id))
        this._resources.map((r2: T) => (r2.id === r.id ? r : r2));
      else this._resources.push(r);
      if (this.positionAttr) this._orderedResources.push(r);
    } else if (this._action === Action.MULTISELECT) {
      this._selectedResources[r.id] = true;
    } else if (this._action === Action.SELECT) {
      this._selectedResourceId = r.id;
    }
  }

  private _createEditedResource(edited: T) {
    // Merges the resource to edit with the original resource.
    // TODO: how to erase a property?
    let orig = this._getEditingResource();
    //console.log("Original resource:", orig);
    Object.keys(edited).forEach((key: string) => {
      if (edited[key] === undefined) delete edited[key];
    });
    //console.log("Edited resource:", edited);
    let merged = { ...orig, ...edited };
    //console.log("Merged:", merged);
    // To remove stuff, we need to send a empty array on the edited resource,
    // We need to save so remove it.
    Object.keys(merged).forEach((key: string) => {
      if (Array.isArray(merged[key]) && merged[key].length === 0)
        merged[key] = undefined;
    });
    return merged;
  }

  private _eventSave(r: T) {
    let event: CustomEvent = new CustomEvent("model-catalog-save", {
      bubbles: true,
      composed: true,
      detail: r,
    });
    this.dispatchEvent(event);
  }

  private _eventDelete(r: T) {
    let event: CustomEvent = new CustomEvent("model-catalog-delete", {
      bubbles: true,
      composed: true,
      detail: r,
    });
    this.dispatchEvent(event);
  }

  private _eventCancel() {
    let event: CustomEvent = new CustomEvent("model-catalog-cancel", {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private _saveResourceLazy(resource: T) {
    //Update memory now
    this._postSaveUpdate(this._addToSaveQueue(resource));
  }

   public _addToSaveQueue(r: T) {
    if (r.id && r.id.includes(PREFIX_URI)) {
      // if the resource has an ID and its part of the model catalog, is an edition.
      this._resourcesToEdit[r.id] = r;
    } else {
      // The resource has no Id or is not part of the model-catalog.
      //Do no modify already created resources. Temp resources start with '0.'
      if (!r.id || !(r.id[0] == "0" && r.id[1] == ".")) {
        r.id = Math.random().toString(36);
      }
      this._resourcesToCreate[r.id] = r;
    }
    this._loadedResources[r.id] = r;
    return r;
  }

  // When lazy is on, this function must be used to perform the save
  // Only save the selected resources
  public save(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      let creation = Object.values(this._resourcesToCreate)
        .filter((r: T) => this._resources.some((r2: T) => r2.id === r.id))
        .map((r: T) => {
          let tempId: string = r.id;
          let toSend: T = { ...r, id: "" };

          let req = store.dispatch(this.resourcePost(toSend));
          req.then((resource: T) => {
            this._loadedResources[resource.id] = resource;
            this._resources = this._resources.map((r2: T) =>
              r2.id === tempId ? resource : r2
            );
          });
          return req;
        });
      let edition = Object.values(this._resourcesToEdit)
        .filter((r: T) => this._resources.some((r2: T) => r2.id === r.id))
        .map((r: T) => {
          let req = store.dispatch(this.resourceApi.put(r));
          req.then((resource: T) => {
            this._loadedResources[resource.id] = resource;
          });
          return req;
        });
      let allp = Promise.all([...creation, ...edition]);
      allp.then((rs: T[]) => {
        this._resourcesToEdit = {};
        this._resourcesToCreate = {};
        if (this.positionAttr) this._refreshOrder();
        resolve(this._resources.map((l: T) => this._loadedResources[l.id]));
      });
      allp.catch(reject);
    });
  }

  protected _getResourceFromForm() {
    // GET ELEMENTS
    let inputLabel: Textfield = this.shadowRoot.getElementById(
      "resource-label"
    ) as Textfield;
    let inputDesc: Textarea = this.shadowRoot.getElementById(
      "resource-desc"
    ) as Textarea;
    // VALIDATE
    let label: string = inputLabel ? inputLabel.value : "";
    let desc: string = inputDesc ? inputDesc.value : "";
    if (label && desc) {
      return {
        label: [label],
        description: [desc],
      } as T;
    } else {
      // Show errors
      if (!label) (<any>inputLabel).onBlur();
      if (!desc) (<any>inputDesc).onBlur();
    }
  }

  protected _getResourceFromFullForm() {
    return this._getResourceFromForm();
  }

  private _showEditSelectionDialog() {
    // Set 'selected' variables and open dialog
    if (this._action === Action.MULTISELECT) {
      let selected: IdMap<boolean> = {};
      this._resources.forEach((r: T) => (selected[r.id] = true));
      this._selectedResources = selected;
    } else if (this._resources.length > 0) {
      //ON SELECT
      this._selectedResourceId = this._resources[0].id;
    }
    this._dialogOpen = true;
    this._textFilter = "";
    showDialog("resource-dialog", this.shadowRoot);
  }

  protected _editResource(r: T) {
    this._editingResourceId = r.id;
    this._status = Status.EDIT;
    if (this._action === Action.EDIT_OR_ADD) {
      this._dialogOpen = true;
      showDialog("resource-dialog", this.shadowRoot);
    }
    this._setSubActions();
  }

  public _deleteResource(r: T, notify: boolean = true) {
    if (
      r
    ) {
      if (this._selectedResources[r.id]) this._selectedResources[r.id] = false;
      if (this._selectedResourceId === r.id) this._selectedResourceId = "";
      if (this._loadedResources[r.id]) delete this._loadedResources[r.id];
      let index: number = -1;
      this._resources.forEach((r2: T, i: number) => {
        if (r2.id === r.id) index = i;
      });
      if (index >= 0) {
        this._resources.splice(index, 1);
        this.requestUpdate();
      }
      store.dispatch(this.resourceApi.delete(r.id)).then(() => {
        if (notify) this._notification.save(this.name + " deleted");
        this._eventDelete(r);
      });
    }
  }

  protected _createResource() {
    this._status = Status.CREATE;
    if (this._action === Action.EDIT_OR_ADD) {
      this._dialogOpen = true;
      showDialog("resource-dialog", this.shadowRoot);
    }
  }

  public enableSingleResourceCreation(...args: any[]) {
    this._singleMode = true;
    if (!this._singleModeInitialized) {
      this._initializeSingleMode();
      this._singleModeInitialized = true;
    }
    this._status = Status.CREATE;
    this._setSubActions();
  }

  public disableSingleResourceCreation() {
    this._clearStatus();
    this._singleMode = false;
  }

  public editSelectedResource() {
    this._editResource(this._resources[0]);
  }

  private _getResourcePosition(r: T) {
    let p = r[this.positionAttr];
    if (p && p.length > 0) return p[0];
    return -1;
  }

  private _setResourcePosition(r: T, position: number) {
    let lr = this._loadedResources[r.id];
    if (position > 0 && lr) {
      let newR: T = { ...lr };
      newR[this.positionAttr] = [position];
      this._loadedResources[r.id] = newR; //this is not necesary i think.
      if (this.lazy) this._saveResourceLazy(newR);
      else this._saveResource(newR);
    }
  }

  /* Check position attribute and compute order array */
  protected _refreshOrder() {
    if (this.positionAttr) {
      // Check resources with position
      let done: Set<string> = new Set();
      let ordered: T[] = this._resources
        .map((r: T) => this._loadedResources[r.id])
        .filter((r: T) => (r ? this._getResourcePosition(r) > 0 : false))
        .sort(
          (r1: T, r2: T) =>
            this._getResourcePosition(r1) - this._getResourcePosition(r2)
        );
      ordered.forEach((r: T) => done.add(r.id));
      let unordered = this._resources.filter((r: T) => !done.has(r.id));
      this._orderedResources = [...ordered, ...unordered];
      //console.log('New order:', this._orderedResources.map(console.log));
      this.requestUpdate();
    }
  }

  public isOrdered(): boolean {
    if (!this.positionAttr) return false;
    for (let i = 0; i < this._orderedResources.length; i++) {
      let r: T = this._orderedResources[i];
      if (!r || this._getResourcePosition(r) != i + 1) return false;
    }
    return true;
  }

  public forceOrder(): void {
    if (this.positionAttr) {
      for (let i: number = 0; i < this._orderedResources.length; i++) {
        let r: T = this._orderedResources[i];
        if (this._getResourcePosition(r) != i + 1)
          this._setResourcePosition(r, i + 1);
      }
    }
    this.requestUpdate();
  }

  protected _forceLoad(r: T) {
    this._loading[r.id] = true;
    let req = store.dispatch(this.resourceApi.get(r.id));
    this.requestUpdate();
    req.then((r2: T) => {
      this._loading[r.id] = false;
      this._loadedResources[r.id] = r2;
      this.requestUpdate();
    });
    req.catch(() => {
      this._error[r.id] = true;
      this._loading[r.id] = false;
      this.requestUpdate();
    });
  }

  private _loadResources(r: T[]) {
    let ids: string[] = r.map((l: T) => l.id);
    ids.forEach((id: string) => (this._loading[id] = true));
    let dbResources: IdMap<T> = this._getDBResources();
    return Promise.all(
      ids.map((id: string) => {
        if (dbResources[id]) {
          this._loadedResources[id] = dbResources[id];
          this._loading[id] = false;
          return Promise.resolve(this._loadedResources[id]);
        } else {
          let req = store.dispatch(this.resourceApi.get(id));
          req.then((r: T) => {
            this._loadedResources[id] = r;
            this._loading[id] = false;
            this.requestUpdate();
          });
          req.catch(() => {
            this._error[id] = true;
            this._loading[id] = false;
          });
          return req;
        }
      })
    );
  }

  /* This is the way to set a list of resources */
  public setResources(r: T[]) {
    this._singleMode = false;
    if (!r || r.length === 0 || r.filter((l: T) => !!l.id).length === 0) {
      this._resources = [];
      this._orderedResources = [];
      this._order = {};
      return;
    }
    this._resources = [...r];
    let shouldLoad: string[] = this._resources
      .map((r: T) => r.id)
      .filter(
        (id: string) =>
          id.includes(PREFIX_URI) &&
          (!this._loading[id] || !this._loadedResources[id])
      );

    //External resources
    this._resources.map((r: T) => {
      if (!r.id.includes(PREFIX_URI)) this._loadedResources[r.id] = { ...r };
    });

    if (shouldLoad.length > 0) {
      let dbResources: IdMap<T> = this._getDBResources();
      Promise.all(
        shouldLoad.map((id: string) => {
          if (dbResources[id]) {
            this._loadedResources[id] = dbResources[id];
            return Promise.resolve(this._loadedResources[id]);
          } else {
            this._loading[id] = true;
            let req = store.dispatch(this.resourceApi.get(id));
            req.then((r: T) => {
              this._loading[id] = false;
              this._loadedResources[id] = r;
              this.requestUpdate();
            });
            req.catch(() => {
              this._error[id] = true;
              this._loading[id] = false;
            });
            return req;
          }
        })
      )
        .then((resources: T[]) => {
          if (this.positionAttr) this._refreshOrder();
        })
        .catch(() => {
          if (this.positionAttr) this._refreshOrder();
        });
    } else if (this.positionAttr) {
      this._refreshOrder();
    }
  }

  /* Same as before but removes the id to set is as a copy. To use when lazy */
  public setResourcesAsCopy(r: T[]) {
    if (r == null) return;
    // FIXME: This does not work it loads everything always... should change the API redux.
    if (!this.lazy) {
      console.error("Cannot copy resource", r);
      return;
    }
    this._singleMode = false;
    if (!r || r.length === 0) {
      this._resources = [];
      this._order = {};
      this._idToCopy = {};
      return;
    }

    let copyFn = (l: T) => {
      if (!this._idToCopy[l.id]) {
        let copy: T = this._addToSaveQueue({
          ...this._loadedResources[l.id],
          id: "",
        });
        this._idToCopy[l.id] = copy.id;
      }
    };
    let replaceFn = (l: T) => {
      let r = { ...l };
      if (this._idToCopy[r.id]) r.id = this._idToCopy[r.id];
      return r;
    };

    let shouldLoad: T[] = r.filter(
      (l: T) =>
        l.id &&
        l.id.includes(PREFIX_URI) &&
        (!this._loading[l.id] || !this._loadedResources[l.id])
    );

    //Add external resources
    r.filter((l: T) => !l.id.includes(PREFIX_URI)).forEach(
      (l: T) => (this._loadedResources[l.id] = { ...l })
    );

    //Copy loaded resources
    r.filter(
      (l: T) => l.id && l.id.includes(PREFIX_URI) && this._loadedResources[l.id]
    ).forEach(copyFn);

    this._resources = [...r].map(replaceFn);

    if (shouldLoad.length > 0) {
      this._loadResources(shouldLoad)
        .then((resources: T[]) => {
          resources.forEach(copyFn);
          this._resources = [...r].map(replaceFn);
          if (this.positionAttr) this._refreshOrder();
        })
        .catch(() => {
          if (this.positionAttr) this._refreshOrder();
        });
    } else if (this.positionAttr) {
      this._refreshOrder();
    }
  }

  /* Set a single resource */
  public setResource(r: T) {
    return new Promise<T>((resolve, reject) => {
      if (!this._singleModeInitialized) {
        this._initializeSingleMode();
        this._singleModeInitialized = true;
      }
      this._singleMode = true;
      if (r && r.id) {
        let id: string = r.id;
        this._resources = [r];
        if (!this._loading[id] && !this._loadedResources[id]) {
          let dbResources: IdMap<T> = this._getDBResources();
          if (dbResources[id]) {
            this._loadedResources[id] = dbResources[id];
            this._setSubResources(dbResources[id]);
            resolve(dbResources[id]);
          } else {
            this._loading[id] = true;
            let req = store.dispatch(this.resourceApi.get(id));
            req.then((r: T) => {
              this._loading[id] = false;
              this._loadedResources[id] = r;
              this.requestUpdate();
              this._setSubResources(r);
              resolve(r);
            });
            req.catch(() => {
              this._error[id] = true;
              this._loading[id] = false;
              reject();
            });
          }
        } else if (this._loadedResources[id]) {
          this._setSubResources(this._loadedResources[id]);
          resolve(this._loadedResources[id]);
        }
      } else {
        this._resources = [];
        this._orderedResources = [];
        this._unsetSubResources();
        resolve(null);
      }
    });
  }

  protected _duplicateResource(r: T): Promise<T> {
    let copy: T = { ...r, id: "" };
    return new Promise((resolve, reject) => {
      let inner: Promise<T> = this._duplicateInnerResources(copy);
      inner.catch(reject);
      inner.then((fullResource: T) => {
        fullResource.id = undefined;
        let post: Promise<T> = store.dispatch(this.resourcePost(fullResource));
        post.catch(reject);
        post.then(resolve);
      });
    });
  }

  protected _duplicateInnerResources(r: T): Promise<T> {
    //MUST be remplaced
    return new Promise((resolve, reject) => {
      resolve(r);
    });
  }

  public duplicateAllResources(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      //Check that all resources are loaded
      if (this._resources.some((r: T) => !this._loadedResources[r.id]))
        reject("Some resources have not been loaded.");
      let allRes: Promise<T>[] = this._resources
        .map((r: T) => this._loadedResources[r.id])
        .map((r: T) => this._duplicateResource(r));
      let p: Promise<T[]> = Promise.all(allRes);
      p.catch(reject);
      p.then(resolve);
    });
  }

  public duplicate(): Promise<T> {
    return new Promise((resolve, reject) => {
      if (
        !this._singleMode ||
        this._resources.length != 1 ||
        !this._loadedResources[this._resources[0].id]
      )
        reject();
      let p: Promise<T> = this._duplicateResource(
        this._loadedResources[this._resources[0].id]
      );
      p.catch(reject);
      p.then(resolve);
    });
  }

  /* Complex resources could have inner resources. Must be initialized here */
  protected _setSubResources(r: T) {}

  protected _unsetSubResources() {}

  public getResources() {
    return this._resources.map((r: T) => {
      let lr = this._loadedResources[r.id];
      if (lr.id.length < 15) return { ...lr, id: "" };
      else return lr;
    });
  }

  public getResourceIdNotUri() {
    return this._resources.map((r: T) => {
      let lr = this._loadedResources[r.id];
      return lr
    });
  }

  public isSaved(): boolean {
    return (
      !this.lazy ||
      (Object.keys(this._resourcesToEdit).length === 0 &&
        Object.keys(this._resourcesToCreate).length === 0)
    );
  }

  // Gets the resources from Redux
  protected _getDBResources(): IdMap<T> {
    let db = (store.getState() as RootState).modelCatalog;
    let dbname: string = this.resourceApi.getName();
    return db[dbname] as IdMap<T>;
  }

  protected _loadAllResources(): Promise<IdMap<T>> {
    this._allResourcesLoading = true;
    //let allr : Promise<IdMap<T>> = store.dispatch(this.resourcesGet()); FIXME
    let allr: Promise<IdMap<T>> = store.dispatch(this.resourceApi.getAll());
    allr.then((resources: IdMap<T>) => {
      // This are the resources that are in memory but not on the dc
      let nonDCResources = Object.values(this._loadedResources).filter(
        (r: T) => !r.id.includes(PREFIX_URI)
      );
      let nonDC: IdMap<T> = {};
      if (nonDCResources.length > 0)
        nonDCResources.forEach((r: T) => (nonDC[r.id] = r));
      this._loadedResources = { ...nonDC, ...resources };
      // Check that selected resources are in the resources loaded.
      this._resources.forEach((r: T) => {
        if (
          !Object.values(this._loadedResources).some((l: T) => l.id === r.id)
        ) {
          console.warn("Selected resource not found on loaded resources, ", r);
          this._loadedResources[r.id] = r;
        }
      });
      this._allResourcesLoading = false;
      this._allResourcesLoaded = true;
    });
    return allr;
  }

  public getAllResources(): Promise<IdMap<T>> {
    return this._loadAllResources();
  }

  public setNameEditable(editable: boolean) {
    this._nameEditable = editable;
  }


}
