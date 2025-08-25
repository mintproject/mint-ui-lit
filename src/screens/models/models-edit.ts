import { property, html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { goToPage } from "../../app/actions";
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from "./model-explore/explorer-styles";

import "./model-version-tree";

import { ModelCatalogModel } from "./configure/resources/model";
import { ModelCatalogSoftwareVersion } from "./configure/resources/software-version";
import { getLabel, getURL } from "model-catalog-api/util";
import { SoftwareVersion, Model } from "@mintproject/modelcatalog_client";

import "weightless/progress-spinner";
import "../../components/loading-dots";

@customElement("models-edit")
export class ModelsEdit extends connect(store)(PageViewElement) {
  @property({ type: Boolean })
  private _hideModels: boolean = false;

  @property({ type: Boolean })
  private _editing: boolean = false;

  @property({ type: Boolean })
  private _creating: boolean = false;

  @property({ type: Object })
  private _model: Model;

  @property({ type: Object })
  private _version: SoftwareVersion;

  private _iModel: ModelCatalogModel;
  private _iVersion: ModelCatalogSoftwareVersion;

  private _url: string = "";
  private _selectedModel: string = "";
  private _selectedVersion: string = "";

  public constructor() {
    super();
    this._iVersion = new ModelCatalogSoftwareVersion();
    this._iModel = new ModelCatalogModel();
  }

  static get styles() {
    return [
      ExplorerStyles,
      css`
        .card2 {
          margin: 0px;
          left: 0px;
          right: 0px;
          padding: 10px;
          padding-top: 5px;
          height: calc(100% - 40px);
          background: #ffffff;
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

        .custom-button {
          line-height: 20px;
          cursor: pointer;
          margin-right: 5px;
          border: 1px solid green;
          padding: 1px 3px;
          border-radius: 4px;
        }

        .custom-button:hover {
          background-color: rgb(224, 224, 224);
        }

        .title-prefix {
          font-size: 1.1em;
          font-weight: 700;
          color: rgb(153, 153, 153);
        }

        .simple-breadcrumbs {
          padding: 6px 12px 4px 12px;
          border-bottom:1px solid #f0f0f0;
        }
        
        .r-title {
          font-size: 1.2em;
          font-family: "Benton Sans Bold";
          font-weight: bolder;
        }

        .r-model {
          color:rgb(6, 108, 67);
        }

        .empty-message {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          font-size: 1.3em;
          font-family: "Benton Sans Bold";
          font-weight: bolder;
          color: #999;
        }
      `,
      SharedStyles,
    ];
  }

  protected render() {
    return html`
      <div class="twocolumns">
        <div class="${this._hideModels ? "left_closed" : "left"}">
          <div class="clt">
            <div class="simple-breadcrumbs">
              <a href="${this._regionid}/models">Prepare Models</a>
              <span>&gt;</span>
              <a selected>Edit Models:</a>
            </div>
            <model-version-tree active></model-version-tree>
          </div>
        </div>

        <div class="${this._hideModels ? "right_full" : "right"}">
          <div class="card2">
            <wl-icon
              @click="${() => (this._hideModels = !this._hideModels)}"
              class="actionIcon bigActionIcon"
              style="float:right"
            >
              ${!this._hideModels ? "fullscreen" : "fullscreen_exit"}
            </wl-icon>

            <div class="cltrow_padded">
              <div class="cltmain">
                <span class="title-prefix">
                  ${this._creating ? 
                    ("CREATING A NEW" + (this._model ? " VERSION FOR" : " MODEL")) 
                  :
                    (this._editing ? "EDITING" : "")}
                  ${this._version ? "VERSION:" : (this._model ? "MODEL:" : "")}
                </span>

                ${this._version ? html`
                  <a class="no-decoration clickable r-title" target="_blank" href="${
                    this._regionid + "/models/explore/" + getURL(this._model, this._version)
                  }">
                    ${getLabel(this._version)}
                  </a>
                ` : (this._model ? html`
                  <a class="no-decoration clickable r-title r-model" target="_blank" href="${
                    this._regionid + "/models/explore/" + getURL(this._model, this._version)
                  }">
                    ${getLabel( this._model)}
                  </span>
                ` : "")}
              </div>
            </div>

            ${!this._model && !this._creating ? html`<div class="empty-message">
              Select a model or software version on the left panel
            </div>` : ""}

            <div style="padding: 0px 10px;">
              ${this._selectedModel && (this._selectedVersion || this._creating) ?
                this._iVersion 
              : (this._selectedModel || this._creating ? this._iModel : "")}

            </div>
          </div>
        </div>
      </div>
      ${renderNotifications()}
    `;
  }

  private _goToCatalog() {
    let url = "models/explore/" + getURL(this._model, this._version);
    goToPage(url);
  }

  firstUpdated() {
    this.addEventListener("model-catalog-save", (e: Event) => {
      let detail: SoftwareVersion = e["detail"];
      if (this._creating && this._model && detail) {
        if (detail.type && detail.type.indexOf("SoftwareVersion") >= 0)
          goToPage("models/edit/" + getURL(this._model, detail));
      }
    });
    this.addEventListener("model-catalog-delete", (e: Event) => {
      let detail: Model | SoftwareVersion = e["detail"];
      if (
        detail &&
        detail.type &&
        (detail.type.indexOf("SoftwareVersion") >= 0 ||
          detail.type.indexOf("Model") >= 0)
      ) {
        if (this._selectedVersion)
          goToPage("models/edit/" + getURL(this._model));
        else if (this._selectedModel) goToPage("models/edit/");
      }
    });
    this.addEventListener("model-catalog-cancel", () => {
      if (this._creating && this._model)
        this._iVersion.enableSingleResourceCreation(this._model);
    });
  }

  stateChanged(state: RootState) {
    if (state.explorerUI) {
      let ui = state.explorerUI;
      // check whats changed
      let modelChanged: boolean = ui.selectedModel !== this._selectedModel;
      let versionChanged: boolean =
        modelChanged || ui.selectedVersion !== this._selectedVersion;

      let enableCreation: boolean = ui.mode === "new" && !this._creating;
      this._creating = ui.mode === "new";
      this._editing = ui.mode === "edit";

      super.setRegionId(state);

      if (modelChanged) {
        this._selectedModel = ui.selectedModel;
        this._model = null;
        if (!this._selectedModel) this._iModel.setResource(null);
      }
      if (versionChanged) {
        this._selectedVersion = ui.selectedVersion;
        this._version = null;
        if (!this._selectedVersion) this._iVersion.setResource(null);
      }

      if (state.modelCatalog) {
        let db = state.modelCatalog;
        // Set selected resource
        if (
          !this._model &&
          db.model &&
          this._selectedModel &&
          db.model[this._selectedModel]
        ) {
          this._model = db.model[this._selectedModel];
          this._iModel.disableSingleResourceCreation();
          this._iModel.setResource(this._model);
        }

        if (
          !this._version &&
          db.softwareversion &&
          this._selectedVersion &&
          db.softwareversion[this._selectedVersion]
        ) {
          this._version = db.softwareversion[this._selectedVersion];
          this._iVersion.disableSingleResourceCreation();
          this._iVersion.setResource(this._version);
        }
      }

      if (this._creating) {
        if (this._model) {
          this._iVersion.enableSingleResourceCreation(this._model);
        } else {
          this._iModel.enableSingleResourceCreation();
        }
      }

      if (this._model && !this._version) {
        if (this._editing) this._iModel.editSelectedResource();
      }
    }
  }
}
