import { property, html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { goToPage } from "../../app/actions";
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from "./model-explore/explorer-styles";
import {
  Model,
  SoftwareVersion,
  ModelConfiguration,
  ModelConfigurationSetup,
} from "@mintproject/modelcatalog_client";

import { showDialog, hideDialog } from "util/ui_functions";
import { ModelCatalogModelConfigurationSetup } from "./configure/resources/model-configuration-setup";
import { ModelCatalogModelConfiguration } from "./configure/resources/model-configuration";

import { ModelsTree } from "./models-tree";

import "weightless/slider";
import "weightless/progress-spinner";
import "weightless/tab";
import "weightless/tab-group";
import "../../components/loading-dots";

@customElement("models-configure")
export class ModelsConfigure extends connect(store)(PageViewElement) {
  @property({ type: Boolean })
  private _hideModels: boolean = false;

  @property({ type: Boolean })
  private _editing: boolean = false;

  @property({ type: Boolean })
  private _creating: boolean = false;

  @property({ type: Boolean })
  private _loading: boolean = false;

  @property({ type: Object })
  private _model: Model;

  @property({ type: Object })
  private _version: SoftwareVersion;

  @property({ type: Object })
  private _config: ModelConfiguration;

  @property({ type: Object })
  private _setup: ModelConfigurationSetup;

  private _iConfig: ModelCatalogModelConfiguration;
  private _iSetup: ModelCatalogModelConfigurationSetup;
  private _modelTree: ModelsTree;

  private _url: string = "";
  private _selectedModel: string = "";
  private _selectedVersion: string = "";
  private _selectedConfig: string = "";
  private _selectedSetup: string = "";

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
          top: 120px;
          bottom: 25px;
          left: 25px;
          right: 25px;
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
          font-size: 15px;
          font-weight: normal;
          color: rgb(153, 153, 153) !important;
        }
      `,
      SharedStyles,
    ];
  }

  public constructor() {
    super();
    this._iSetup = new ModelCatalogModelConfigurationSetup();
    this._iConfig = new ModelCatalogModelConfiguration();
    this._modelTree = new ModelsTree();
    this._modelTree.active = true;
  }

  firstUpdated() {
    let isConfig = (types: string[]) =>
      types &&
      types.length > 0 &&
      types.some((t: string) =>
        [
          "ModelConfiguration",
          "https://w3id.org/okn/o/sdm#ModelConfiguration",
        ].includes(t)
      );
    let isSetup = (types: string[]) =>
      types &&
      types.length > 0 &&
      types.some((t: string) =>
        [
          "ModelConfigurationSetup",
          "https://w3id.org/okn/o/sdm#ModelConfigurationSetup",
        ].includes(t)
      );

    this.addEventListener("model-catalog-save", (e: Event) => {
      let detail = e["detail"];
      if (this._creating && detail.id) {
        let id: string = detail.id.split("/").pop();
        let url: string =
          "models/configure/" +
          this._selectedModel.split("/").pop() +
          "/" +
          this._selectedVersion.split("/").pop() +
          "/";

        if (isSetup(detail["type"])) {
          this._iSetup.setResource(null);
          goToPage(url + this._selectedConfig.split("/").pop() + "/" + id);
        } else if (isConfig(detail["type"])) {
          this._iConfig.setResource(null);
          goToPage(url + id);
        }
      }
    });
    this.addEventListener("model-catalog-cancel", () => {
      if (this._creating) {
        if (!this._selectedSetup && this._config)
          this._iSetup.enableSingleResourceCreation(this._config);
        else if (!this._selectedConfig && this._version)
          this._iConfig.enableSingleResourceCreation(this._version);
      }
    });
    this.addEventListener("model-catalog-delete", (e: Event) => {
      let detail = e["detail"];
      let url: string =
        "models/configure/" +
        this._selectedModel.split("/").pop() +
        "/" +
        this._selectedVersion.split("/").pop() +
        "/";
      if (isSetup(detail["type"])) {
        goToPage(url + this._selectedConfig.split("/").pop());
      } else if (isConfig(detail["type"])) {
        goToPage(url);
      }
    });
  }

  protected render() {
    return html`
      <div class="twocolumns">
        <div class="${this._hideModels ? "left_closed" : "left"}">
          <div class="clt">
            <wl-title
              level="4"
              style="margin: 4px; padding: 10px 10px 0px 10px;"
              >Models:</wl-title
            >
            ${this._modelTree}
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
            ${this._selectedConfig && !this._creating
              ? html`
                  <span
                    style="float:right;"
                    class="custom-button"
                    @click="${this._goToCatalog}"
                    >See in catalog</span
                  >
                `
              : ""}
            <div class="cltrow_padded">
              <div class="cltmain">
                <wl-title
                  level="3"
                  .style="margin: 0px; ${this._config && !this._setup
                    ? "color:rgb(6, 108, 67);"
                    : ""}"
                >
                  ${this._creating
                    ? html`<span class="title-prefix">
                        CREATING A NEW
                        ${this._config ? "SETUP" : "CONFIGURATION"} FOR
                      </span>`
                    : this._editing
                    ? html`<span class="title-prefix">EDITING</span>`
                    : ""}
                  ${this._setup
                    ? html`<span class="title-prefix">SETUP:</span> ${this
                          ._setup.label}`
                    : this._config
                    ? html`<span class="title-prefix">CONFIGURATION:</span>
                        ${this._config.label}`
                    : this._version
                    ? this._version.label
                    : "Select a model configuration or setup on the left panel."}
                </wl-title>
                ${!this._version
                  ? html`
                      <wl-text>
                        You can create custom configurations of a model, by
                        fixing parameter values or input datasets or by
                        constraining the ranges that parameters can take.
                      </wl-text>
                      <wl-title level="4">
                        Select a model from the left panel, and edit the
                        parameters and files accordingly.
                      </wl-title>
                    `
                  : ""}
              </div>
            </div>

            ${this._config ||
            this._setup ||
            (this._selectedVersion && this._creating && !this._config)
              ? html`<div style="font-size: 13px; padding: 0px 10px;">
                  <p>
                    Model configurations are customizations of the model that
                    use a subset of all the processes and functions that are
                    possible with the general model software. Model set ups are
                    manual configurations of a model for a specific geographical
                    area or region, where some of the input data or parameters
                    are constrained or fixed.
                  </p>
                  <p>
                    You can create a new model set up or do further
                    customization of an existing one by editing the parameters
                    to constrain their values further or to set defaults, fix
                    input data files by providing a URL to them, and edit the
                    descriptions of the model configuration to reflect the
                    changes.
                  </p>
                </div>`
              : ""}

            <div style="padding: 0px 10px;">
              ${this._loading
                ? html`<div style="text-align: center;">
                    <wl-progress-spinner></wl-progress-spinner>
                  </div>`
                : (this._selectedConfig &&
                    !this._creating &&
                    !this._selectedSetup) ||
                  (!this._selectedConfig &&
                    this._selectedVersion &&
                    this._creating)
                ? this._iConfig
                : (this._selectedSetup && !this._creating) ||
                  (this._selectedConfig && this._creating)
                ? this._iSetup
                : ""}
            </div>
          </div>
        </div>
      </div>
      ${renderNotifications()}
    `;
  }

  private _goToCatalog() {
    let url =
      "models/explore/" +
      this._selectedModel.split("/").pop() +
      "/" +
      this._selectedVersion.split("/").pop() +
      "/" +
      this._selectedConfig.split("/").pop();
    if (this._selectedSetup) url += "/" + this._selectedSetup.split("/").pop();
    goToPage(url);
  }

  stateChanged(state: RootState) {
    if (state.explorerUI) {
      let ui = state.explorerUI;
      // check whats changed
      let modelChanged: boolean = ui.selectedModel !== this._selectedModel;
      let versionChanged: boolean =
        modelChanged || ui.selectedVersion !== this._selectedVersion;
      let configChanged: boolean =
        versionChanged || ui.selectedConfig !== this._selectedConfig;
      let calibrationChanged: boolean =
        configChanged || ui.selectedCalibration !== this._selectedSetup;
      this._editing = ui.mode === "edit";
      this._creating = ui.mode === "new";

      super.setRegionId(state);

      if (modelChanged) {
        this._selectedModel = ui.selectedModel;
        this._model = null;
      }
      if (versionChanged) {
        this._selectedVersion = ui.selectedVersion;
        this._version = null;
        this._iConfig.disableSingleResourceCreation();
      }
      if (configChanged) {
        this._selectedConfig = ui.selectedConfig;
        this._config = null;
        this._iSetup.disableSingleResourceCreation();
        if (!this._selectedConfig) this._iConfig.setResource(null);
      }
      if (calibrationChanged) {
        this._selectedSetup = ui.selectedCalibration;
        this._setup = null;
        if (!this._selectedSetup) {
          this._iConfig.disableSingleResourceCreation();
          this._iSetup.setResource(null);
        }
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
        }
        if (
          !this._version &&
          db.softwareversion &&
          this._selectedVersion &&
          db.softwareversion[this._selectedVersion]
        ) {
          this._version = db.softwareversion[this._selectedVersion];
        }
        if (
          !this._config &&
          db.modelconfiguration &&
          this._selectedConfig &&
          db.modelconfiguration[this._selectedConfig]
        ) {
          this._iConfig.disableSingleResourceCreation();
          this._config = db.modelconfiguration[this._selectedConfig];
          this._iConfig.setResource(this._config);
          if (this._version) this._iConfig.enableDuplication(this._version);
          else console.warn("Version is not loaded!");
        }
        if (
          !this._setup &&
          db.modelconfigurationsetup &&
          this._selectedSetup &&
          db.modelconfigurationsetup[this._selectedSetup]
        ) {
          this._iSetup.disableSingleResourceCreation();
          this._setup = db.modelconfigurationsetup[this._selectedSetup];
          this._iSetup.setResource(this._setup);
          if (this._config) this._iSetup.enableDuplication(this._config);
          else console.warn("Configuration is not loaded!");
        }

        if (this._creating) {
          if (this._config) {
            this._iSetup.enableSingleResourceCreation(this._config);
          } else if (this._version) {
            this._iConfig.enableSingleResourceCreation(this._version);
          }
        }

        if (this._model && this._version && this._editing) {
          if (this._config && !this._setup)
            this._iConfig.editSelectedResource();
          else if (this._config && this._setup)
            this._iSetup.editSelectedResource();
        }
      }
    }

    this._loading =
      (this._selectedModel &&
        this._selectedVersion &&
        this._selectedConfig &&
        ((this._selectedSetup && !this._setup) ||
          (this._creating && !this._selectedSetup && !this._config))) ||
      (this._selectedModel &&
        this._selectedVersion &&
        !this._selectedSetup &&
        ((this._selectedConfig && !this._config) ||
          (this._creating && !this._selectedVersion && !this._version)));
  }
}
