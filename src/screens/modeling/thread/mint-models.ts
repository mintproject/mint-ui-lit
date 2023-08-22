import { customElement, html, property, css } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";
import ReactGA from "react-ga";

import { ModelMap, ModelEnsembleMap, ComparisonFeature } from "../reducers";
import models, {
  VariableModels,
  Model,
  getPathFromModel,
} from "../../models/reducers";
import { queryModelsByVariables, setupToOldModel } from "../../models/actions";

import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

import { SharedStyles } from "../../../styles/shared-styles";
import {
  cacheModelsFromCatalog,
  getThreadExecutionSummary,
  setThreadModels,
} from "../actions";
import { getUISelectedSubgoalRegion } from "../../../util/state_functions";
import { getId, isSubregion, getLabel } from "model-catalog-api/util";

import "weightless/tooltip";
import "weightless/popover-card";
import {
  renderNotifications,
  renderLastUpdateText,
} from "../../../util/ui_renders";
import { showNotification, showDialog } from "../../../util/ui_functions";
import { selectThreadSection } from "../../../app/ui-actions";
import { MintThreadPage } from "./mint-thread-page";
import { Region } from "screens/regions/reducers";
import { IdMap } from "app/reducers";
import {
  Model as MCModel,
  Region as MCRegion,
  SoftwareVersion,
  SoftwareImage,
  ModelConfiguration,
  ModelConfigurationSetup,
  ModelCategory,
  DatasetSpecification,
  VariablePresentation,
  Parameter,
  Intervention,
  StandardVariable,
} from "@mintproject/modelcatalog_client";
import "components/loading-dots";
import { getLatestEventOfType } from "util/event_utils";
import variables, { VariableMap } from "screens/variables/reducers";

store.addReducers({
  models,
});

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  url: string;
  category: string;
  region: string;
  selected: boolean;
}

@customElement("mint-models")
export class MintModels extends connect(store)(MintThreadPage) {
  @property({ type: Object })
  private _queriedModels: VariableModels = {} as VariableModels;

  @property({ type: Boolean })
  private _editMode: boolean = false;

  @property({ type: Array })
  private _modelsToCompare: Model[] = [];

  @property({ type: Object })
  private _subregion: Region;

  @property({ type: Boolean })
  private _showAllModels: boolean = false;

  @property({ type: Object })
  private _loadedModels: IdMap<Model> = {};

  @property({ type: String })
  private _textFilter: string = "";

  @property({ type: Boolean })
  private _loading: boolean = false;

  @property({ type: Boolean })
  private _baseLoaded: boolean = false;

  private _allModels: IdMap<MCModel> = {};
  private _allVersions: IdMap<SoftwareVersion> = {};
  private _allConfigs: IdMap<ModelConfiguration> = {};
  private _allSetups: IdMap<ModelConfigurationSetup> = {};
  private _allSoftwareImages: IdMap<SoftwareImage>;
  private _allRegions: IdMap<MCRegion> = {};
  private _allCategories: IdMap<ModelCategory> = {};

  @property({ type: Number })
  private _nresults: number = 0;

  private _dispatched: Boolean = false;
  private _pendingQuery: Boolean = false;

  private _responseVariables: string[] = [];
  private _drivingVariables: string[] = [];

  @property({ type: Object })
  private _variableMap: VariableMap = {};

  private _comparisonFeatures: Array<ComparisonFeature> = [
    {
      name: "Adjustable variables",
      fn: (model: Model) => {
        if (model.input_parameters.length > 0) {
          let values = model.input_parameters.filter((ip) => !ip.value);
          if (values.length > 0) {
            return values.map((ip) => ip.name).join(", ");
          }
        }
        return html`<span style="color:#999">None</span>`;
      },
    },
    {
      name: "Model type",
      fn: (model: Model) => model.model_type,
    },
    {
      name: "Modeled processes",
      fn: (model: Model) =>
        model.modeled_processes.length > 0
          ? model.modeled_processes
          : html`<span style="color:#999">None specified</span>`,
    },
    {
      name: "Parameter assignment/estimation",
      fn: (model: Model) => model.parameter_assignment,
    },
    /*{
            name: "Parameter assignment/estimation details",
            fn: (model:Model) => model.parameter_assignment_details
        },*/
    {
      name: "Target variable for parameter assignment/estimation",
      fn: (model: Model) =>
        model.calibration_target_variable
          ? model.calibration_target_variable
          : html`<span style="color:#999">No specified</span>`,
    },
    {
      name: "Configuration region",
      fn: (model: Model) =>
        model.region_name
          ? model.region_name
          : html`<span style="color:#999">No specified</span>`,
    },
    {
      name: "Spatial dimensionality",
      fn: (model: Model) =>
        model.dimensionality
          ? html`<span style="font-family: system-ui;">
              ${model.dimensionality}
            </span>`
          : html`<span style="color:#999">No specified</span>`,
    },
    {
      name: "Spatial grid type",
      fn: (model: Model) =>
        model.spatial_grid_type
          ? model.spatial_grid_type
          : html`<span style="color:#999">No specified</span>`,
    },
    {
      name: "Spatial grid resolution",
      fn: (model: Model) =>
        model.spatial_grid_resolution
          ? model.spatial_grid_resolution
          : html`<span style="color:#999">No specified</span>`,
    },
    {
      name: "Minimum output time interval",
      fn: (model: Model) =>
        model.output_time_interval
          ? model.output_time_interval
          : html`<span style="color:#999">No specified</span>`,
    },
  ];

  static get styles() {
    return [SharedStyles, css``];
  }

  private _createModelCatalogUri(region: Region) {
    let prefix = "https://w3id.org/okn/i/mint/";
    return (prefix + region.name).replace(/\s/g, "_");
  }

  private onSearchBarChange(ev) {
    let intext: HTMLInputElement = this.shadowRoot!.getElementById(
      "searchBar"
    ) as HTMLInputElement;
    if (intext) {
      this._textFilter = intext.value;
    }
  }

  protected render() {
    let modelids = Object.keys(this.thread.models || {}) || [];
    let done = this.thread.models && modelids.length > 0;
    let latest_update_event = getLatestEventOfType(
      ["CREATE", "UPDATE"],
      this.thread.events
    );
    let latest_model_event = getLatestEventOfType(
      ["SELECT_MODELS"],
      this.thread.events
    );

    return html`
      <div class="footer">
        <wl-button
          type="button"
          flat
          inverted
          outlined
          @click="${this._compareModels}"
          >Compare Selected Models</wl-button
        >
        <div style="flex-grow: 1">&nbsp;</div>
        ${this._editMode
          ? html`<wl-button
              @click="${() => {
                this._editMode = false;
              }}"
              flat
              inverted
              >CANCEL</wl-button
            >`
          : html``}
        <wl-button
          type="button"
          class="submit"
          @click="${this._selectThreadModels}"
          ?disabled=${this._waiting}
        >
          Select &amp; Continue
          ${this._waiting
            ? html`<loading-dots
                style="--width: 20px; margin-left:10px"
              ></loading-dots>`
            : ""}
        </wl-button>
      </div>

      <fieldset class="notes">
        <legend>Notes</legend>
        <textarea id="notes">
${latest_model_event?.notes ? latest_model_event.notes : ""}</textarea
        >
      </fieldset>

      ${renderNotifications()} ${this._renderDialogs()}
    `;
  }

  private computedURLs: IdMap<string> = {};
  private getSetupURL(setup: ModelConfigurationSetup) {
    if (!this.computedURLs[setup.id]) {
      let url: string = this._regionid + "/models/explore/";
      let config: ModelConfiguration = Object.values(this._allConfigs)
        .filter(
          (cfg: ModelConfiguration) =>
            cfg.hasSetup &&
            cfg.hasSetup.some((s: ModelConfigurationSetup) => s.id === setup.id)
        )
        .pop();
      if (config) {
        let version: SoftwareVersion = Object.values(this._allVersions)
          .filter(
            (ver: SoftwareVersion) =>
              ver.hasConfiguration &&
              ver.hasConfiguration.some(
                (c: ModelConfiguration) => c.id === config.id
              )
          )
          .pop();
        if (version) {
          let model: MCModel = Object.values(this._allModels)
            .filter(
              (m: MCModel) =>
                m.hasVersion &&
                m.hasVersion.some((v: SoftwareVersion) => v.id === version.id)
            )
            .pop();
          if (model) {
            this.computedURLs[setup.id] =
              url +
              getId(model) +
              "/" +
              getId(version) +
              "/" +
              getId(config) +
              "/" +
              getId(setup);
          }
        }
      }
    }
    return this.computedURLs[setup.id];
  }

  private renderMatchingModels() {
    //Filter for main region;
    let matchingModels: ModelInfo[] = [];

    // all setups should be the setups after being filtered
    let setups: ModelConfigurationSetup[] = Object.values(
      this._allSetups
    ).filter(
      (s: ModelConfigurationSetup) =>
        !s.hasRegion ||
        s.hasRegion.some((r: MCRegion) =>
          isSubregion(this._region.model_catalog_uri, this._allRegions[r.id])
        )
    );
    if (this._textFilter) {
      let t = this._textFilter.toLowerCase();
      setups = setups.filter(
        (s: ModelConfigurationSetup) =>
          getLabel(s).toLowerCase().includes(t) ||
          (s.description && s.description[0].toLowerCase().includes(t)) ||
          (s.hasRegion &&
            s.hasRegion.some((r) =>
              getLabel(this._allRegions[r.id]).toLowerCase().includes(t)
            ))
      );
    }

    matchingModels = setups.map((setup: ModelConfigurationSetup) => {
      return {
        id: setup.id,
        name: getLabel(setup),
        description: setup.description ? setup.description : "",
        url: this.getSetupURL(setup),
        category: setup.hasModelCategory
          ? setup.hasModelCategory
              .map((c) => getLabel(this._allCategories[c.id]))
              .join(", ")
          : "",
        region: setup.hasRegion
          ? setup.hasRegion
              .map((r) => getLabel(this._allRegions[r.id]))
              .join(", ")
          : "",
        selected: false, //FIXME
      } as ModelInfo;
    });
    return matchingModels.length == 0
      ? html`
          <tr>
            <td
              colspan="4"
              style="text-align:center; color: rgb(153, 153, 153);"
            >
              - No models found -
            </td>
          </tr>
        `
      : matchingModels.map(this.renderModelRow);
  }

  private renderModelRow(model: ModelInfo) {
    return html`
        <tr>
            <td><input class="checkbox" type="checkbox" data-modelid="${
              model.id
            }"
                ?checked="${model.selected}"></input></td>
            <td>
                <a target="_blank" href="${model.url}">${model.name}</a>
                ${
                  model.description ? html`<div>${model.description}</div>` : ""
                }
            </td> 
            <td>${model.category}</td>
            <td> ${model.region} </td>
        </tr>`;
  }

  protected oldrender() {
    if (!this.thread) {
      return html``;
    }

    let modelids = Object.keys(this.thread.models || {}) || [];
    let done = this.thread.models && modelids.length > 0;

    //if(!this._responseVariables) Not necesary now
    //    return;
    let availableModels: Model[] =
      this._queriedModels[this._responseVariables.join(",")] || [];

    // Filter out all models without component location
    availableModels = availableModels.filter((m: Model) => !!m.code_url);

    // Filter all available models by region
    let regionModels = [];
    // Filter by subregion first
    if (this._subregion) {
      // If no model catalog uri for this region, create one
      if (!this._subregion.model_catalog_uri)
        this._subregion.model_catalog_uri = this._createModelCatalogUri(
          this._subregion
        );
      regionModels = availableModels.filter(
        (model: Model) =>
          !model.hasRegion ||
          model.hasRegion.length == 0 ||
          (model.hasRegion || []).some((region) =>
            isSubregion(this._subregion.model_catalog_uri, region)
          )
      );
    }
    // Then filter by main region if no models for subregion
    if (regionModels.length == 0) {
      if (!this._region.model_catalog_uri)
        this._region.model_catalog_uri = this._createModelCatalogUri(
          this._region
        );
      regionModels = availableModels.filter(
        (model: Model) =>
          !model.hasRegion ||
          model.hasRegion.length == 0 ||
          (model.hasRegion || []).some((region) =>
            isSubregion(this._region.model_catalog_uri, region)
          )
      );
    }

    let latest_update_event = getLatestEventOfType(
      ["CREATE", "UPDATE"],
      this.thread.events
    );
    let latest_model_event = getLatestEventOfType(
      ["SELECT_MODELS"],
      this.thread.events
    );
    return html`
      <p>
        The models below are appropriate for the indicators of interest. You can
        select multiple calibrated models and compare them.
      </p>
      ${done && this.permission.write && !this._editMode
        ? html`<p>
            Please click on the <wl-icon class="actionIcon">edit</wl-icon> icon
            to make changes.
          </p>`
        : html``}
      ${done && !this._editMode
        ? // Models chosen already
          html`
            <div class="clt">
              <wl-title level="3">
                Models
                ${this.permission.write
                  ? html` <wl-icon
                      @click="${() => {
                        this._setEditMode(true);
                      }}"
                      id="editModelsIcon"
                      class="actionIcon editIcon"
                      >edit</wl-icon
                    >`
                  : ""}
              </wl-title>
              ${this.permission.write
                ? html` <wl-tooltip
                    anchor="#editModelsIcon"
                    .anchorOpenEvents="${["mouseover"]}"
                    .anchorCloseEvents="${["mouseout"]}"
                    fixed
                    anchorOriginX="center"
                    anchorOriginY="bottom"
                    transformOriginX="center"
                  >
                    Change Model Selection
                  </wl-tooltip>`
                : ""}
              <ul>
                ${modelids.map((modelid) => {
                  let model = this.thread.models![modelid];
                  return html`
                    <li>
                      <a
                        target="_blank"
                        href="${this._getStoredModelURL(model)}"
                        >${model.name}</a
                      >
                    </li>
                  `;
                })}
              </ul>
            </div>
            <div class="footer">
              <wl-button
                type="button"
                class="submit"
                @click="${() =>
                  store.dispatch(selectThreadSection("datasets"))}"
                >Continue</wl-button
              >
            </div>

            ${latest_model_event
              ? html`
                  <div class="notepage">
                    ${renderLastUpdateText(latest_model_event)}
                  </div>
                `
              : html``}
            ${latest_model_event?.notes
              ? html`
                  <fieldset class="notes">
                    <legend>Notes</legend>
                    <div class="notepage">${latest_model_event?.notes}</div>
                  </fieldset>
                `
              : html``}
          `
        : !(
            this.thread.response_variables &&
            this.thread.response_variables.length > 0
          )
        ? html`Please select a response variable first`
        : // Choose Models
          html`
            <div class="clt">
              <wl-title level="3"> Models </wl-title>
              <p>
                The models below generate data that includes the indicator that
                you selected earlier:
                "${this.thread.response_variables
                  .map((variable) => this._variableMap[variable]?.name ?? "")
                  .join(", ")}".
                Other models that are available in the system do not generate
                that kind of result.
                ${this.thread.driving_variables.length
                  ? html`
                      These models also allow adjusting the adjustable variable
                      you selected earlier:
                      "${this.thread.driving_variables
                        .map(
                          (variable) => this._variableMap[variable]?.name ?? ""
                        )
                        .join(", ")}".
                    `
                  : ""}
              </p>
              <ul>
                <li>
                  ${this._dispatched || !this._allSoftwareImages
                    ? html`<wl-progress-bar></wl-progress-bar>`
                    : html`
                        <table class="pure-table pure-table-striped">
                          <thead>
                            <tr>
                              <th></th>
                              <th><b>Model</b></th>
                              <th>Category</th>
                              <th>Calibration Region</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${availableModels.length > 0
                              ? availableModels.map((model: Model) => {
                                  if (!model) return;
                                  //console.log('>>', model);
                                  if (
                                    this._showAllModels ||
                                    regionModels.indexOf(model) >= 0
                                  ) {
                                    return html`
                                            <tr>
                                                <td><input class="checkbox" type="checkbox" data-modelid="${
                                                  model.id
                                                }"
                                                    ?checked="${
                                                      modelids.indexOf(
                                                        model.id!
                                                      ) >= 0
                                                    }"></input></td>
                                                <td>
                                                    <a target="_blank" href="${this._getModelURL(
                                                      model
                                                    )}">${model.name}</a>
                                                    ${
                                                      model.description
                                                        ? html`<div>
                                                            ${model.description}
                                                          </div>`
                                                        : ""
                                                    }
                                                </td> 
                                                <td>${model.category}</td>
                                                <td>
                                                ${
                                                  model.hasRegion
                                                    ? model.hasRegion
                                                        .map(
                                                          (region: any) =>
                                                            this._allRegions[
                                                              region.id
                                                            ]
                                                        )
                                                        .map(getLabel)
                                                        .join(", ")
                                                    : ""
                                                }
                                                </td>
                                            </tr>
                                            `;
                                  }
                                })
                              : html`
                                  <tr>
                                    <td
                                      colspan="5"
                                      style="text-align:center; color: rgb(153, 153, 153);"
                                    >
                                      - No model found -
                                    </td>
                                  </tr>
                                `}
                            ${availableModels.length - regionModels.length > 0
                              ? html`
                                  <tr>
                                    <td
                                      colspan="5"
                                      style="text-align:left; color: rgb(153, 153, 153);"
                                    >
                                      <a
                                        style="cursor:pointer"
                                        @click="${() => {
                                          this._showAllModels =
                                            !this._showAllModels;
                                        }}"
                                      >
                                        ${!this._showAllModels
                                          ? "Show"
                                          : "Hide"}
                                        ${availableModels.length -
                                        regionModels.length}
                                        models for other regions
                                      </a>
                                    </td>
                                  </tr>
                                `
                              : ""}
                          </tbody>
                        </table>

                        <div class="footer">
                          <wl-button
                            type="button"
                            flat
                            inverted
                            outlined
                            @click="${this._compareModels}"
                            >Compare Selected Models</wl-button
                          >
                          <div style="flex-grow: 1">&nbsp;</div>
                          ${this._editMode
                            ? html`<wl-button
                                @click="${() => {
                                  this._editMode = false;
                                }}"
                                flat
                                inverted
                                >CANCEL</wl-button
                              >`
                            : html``}
                          <wl-button
                            type="button"
                            class="submit"
                            @click="${this._selectThreadModels}"
                            ?disabled=${this._waiting}
                          >
                            Select &amp; Continue
                            ${this._waiting
                              ? html`<loading-dots
                                  style="--width: 20px; margin-left:10px"
                                ></loading-dots>`
                              : ""}
                          </wl-button>
                        </div>
                      `}
                </li>
              </ul>
            </div>

            <fieldset class="notes">
              <legend>Notes</legend>
              <textarea id="notes">
${latest_model_event?.notes ? latest_model_event.notes : ""}</textarea
              >
            </fieldset>
          `}
      ${renderNotifications()} ${this._renderDialogs()}
    `;
  }

  _renderDialogs() {
    let compUrl: string =
      this._regionid +
      "/models/compare/" +
      this._modelsToCompare.map(getId).join("/");
    let loading: boolean = this._modelsToCompare.some(
      (m: Model) => !this._loadedModels[m.id]
    );
    return html`
      <wl-dialog
        class="comparison"
        fixed
        backdrop
        blockscrolling
        id="comparisonDialog"
      >
        <table class="pure-table pure-table-striped">
          <thead>
            <th style="border-right:1px solid #EEE; font-size: 14px;">
              Model details
              ${loading
                ? html`<loading-dots
                    style="--width: 20px; margin-left:10px"
                  ></loading-dots>`
                : ""}
            </th>
            ${this._modelsToCompare.map((model) => {
              return html`
                <th .style="width:${100 / this._modelsToCompare.length}%">
                  <a
                    target="_blank"
                    href="${this._getModelURL(model)}"
                    style="font-weight: bold; font-size: 15px;"
                  >
                    ${model.name}
                  </a>
                </th>
              `;
            })}
          </thead>
          <tbody>
            ${this._comparisonFeatures.map((feature) => {
              return html`
                <tr>
                  <td style="border-right:1px solid #EEE">
                    <b>${feature.name}</b>
                  </td>
                  ${this._modelsToCompare.map((model) => {
                    let smodel = this._loadedModels[model.id]
                      ? this._loadedModels[model.id]
                      : model;
                    return html` <td>${feature.fn(smodel)}</td> `;
                  })}
                </tr>
              `;
            })}
          </tbody>
        </table>
        <div style="padding: 10px;">
          For more details, see the
          <a href="${compUrl}">full comparison page</a>
        </div>
      </wl-dialog>
    `;
  }

  private _getStoredModelURL(model: Model) {
    //console.log(model);
    let uri = this._regionid + "/models/explore" + getPathFromModel(model);
    return uri;
  }

  _getModelURL(model: Model) {
    //FIXME find a better way to do this.
    if (this._baseLoaded) {
      let setupid: string = model.id;
      let config: ModelConfiguration = Object.values(this._allConfigs)
        .filter(
          (cfg: ModelConfiguration) =>
            cfg.hasSetup &&
            cfg.hasSetup.some((s: ModelConfigurationSetup) => s.id === setupid)
        )
        .pop();
      if (config) {
        let version: SoftwareVersion = Object.values(this._allVersions)
          .filter(
            (ver: SoftwareVersion) =>
              ver.hasConfiguration &&
              ver.hasConfiguration.some(
                (c: ModelConfiguration) => c.id === config.id
              )
          )
          .pop();
        if (version) {
          let model: MCModel = Object.values(this._allModels)
            .filter(
              (m: MCModel) =>
                m.hasVersion &&
                m.hasVersion.some((v: SoftwareVersion) => v.id === version.id)
            )
            .pop();
          if (model) {
            return (
              this._regionid +
              "/models/explore/" +
              getId(model) +
              "/" +
              getId(version) +
              "/" +
              getId(config) +
              "/" +
              setupid.split("/").pop()
            );
          }
        }
      }
    }

    return this._regionid + "/models/explore/";
  }

  _getSelectedModels() {
    let models: ModelMap = {};

    /*let selectedSetups : ModelConfigurationSetup[] = this.questionComposer.getModels();
        selectedSetups.forEach((s:ModelConfigurationSetup) => {
            models[s.id] = setupToOldModel(s, this._allSoftwareImages);
        });*/

    this.shadowRoot!.querySelectorAll("input.checkbox").forEach((cbox) => {
      let cboxinput = cbox as HTMLInputElement;
      let modelid = cboxinput.dataset["modelid"];
      if (cboxinput.checked) {
        this._queriedModels[this._responseVariables.join(",")].map(
          (model: Model) => {
            if (model.id == modelid) {
              models[model.id!] = model;
              return;
            }
          }
        );
      }
    });

    return models;
  }

  _setEditMode(mode: boolean) {
    if (!this.permission.write) mode = false;
    this._editMode = mode;
    if (mode) {
      this._queryModelCatalog();
    }
  }

  _compareModels() {
    let models = this._getSelectedModels();
    if (Object.keys(models).length < 2) {
      showNotification("selectTwoModelsNotification", this.shadowRoot!);
      return;
    }
    this._modelsToCompare = Object.values(models);
    Promise.all(
      this._modelsToCompare.map((m: Model) => {
        if (!this._loadedModels[m.id]) {
          //let p = setupGetAll(m.id);
          let p: Promise<ModelConfigurationSetup> = store.dispatch(
            ModelCatalogApi.myCatalog.modelConfigurationSetup.getDetails(m.id)
          );
          p.then((setup: ModelConfigurationSetup) => {
            this._loadedModels[setup.id] = setupToOldModel(
              setup,
              this._allSoftwareImages
            );
          });
          return p;
        } else return null;
      })
    ).then((setups) => {
      this.requestUpdate();
    });
    showDialog("comparisonDialog", this.shadowRoot!);
  }

  async _selectThreadModels() {
    ReactGA.event({
      category: "Thread",
      action: "Models continue",
    });
    let modelmap = this._getSelectedModels();
    let models = [];

    showNotification("saveNotification", this.shadowRoot!);

    for (let modelid in modelmap) {
      models.push(modelmap[modelid]);
    }

    // Cache models from Catalog
    this._waiting = true;
    await cacheModelsFromCatalog(
      models,
      this._allSoftwareImages,
      this._allConfigs,
      this._allVersions,
      this._allModels
    );

    let notes = (
      this.shadowRoot!.getElementById("notes") as HTMLTextAreaElement
    ).value;

    // Mark selected models in thread
    // NOTE: This deletes existing data & parameter selections.
    // FIXME: Warn user that this will delete existing data/parameter/runs ?

    await setThreadModels(models, notes, this.thread);

    this._waiting = false;
    this.selectAndContinue("models");
  }

  _queryModelCatalog() {
    if (!this._allSoftwareImages) {
      // Wait
      this._pendingQuery = true;
    } else {
      this._pendingQuery = false;
      // Only query for models if we don't already have them
      // Unless we're in edit mode
      if (
        !this.thread.models ||
        Object.keys(this.thread.models).length == 0 ||
        this._editMode
      ) {
        if (this._responseVariables && this._responseVariables.length > 0) {
          //console.log("Querying model catalog for " + this._responseVariables);
          this._dispatched = true;
          store.dispatch(
            queryModelsByVariables(
              this._responseVariables,
              this._drivingVariables,
              this._allSoftwareImages
            )
          );
        }
      }
    }
  }

  protected firstUpdated() {
    store
      .dispatch(ModelCatalogApi.myCatalog.region.getAll())
      .then((regions: IdMap<MCRegion>) => {
        this._allRegions = regions;
      });

    let pm = store
      .dispatch(ModelCatalogApi.myCatalog.model.getAll())
      .then((models: IdMap<MCModel>) => {
        this._allModels = models;
      });
    let pv = store
      .dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll())
      .then((versions: IdMap<SoftwareVersion>) => {
        this._allVersions = versions;
      });
    let pc = store
      .dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll())
      .then((configs: IdMap<ModelConfiguration>) => {
        this._allConfigs = configs;
      });
    let si = store
      .dispatch(ModelCatalogApi.myCatalog.softwareImage.getAll())
      .then((images: IdMap<SoftwareImage>) => {
        this._allSoftwareImages = images;
        if (this._pendingQuery) this._queryModelCatalog();
      });
    let st = store
      .dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll())
      .then((setups: IdMap<ModelConfigurationSetup>) => {
        this._allSetups = setups;
      });
    let cat = store
      .dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll())
      .then((cats: IdMap<ModelCategory>) => {
        this._allCategories = cats;
      });

    Promise.all([pm, pv, pc, si, st, cat]).then(() => {
      this._baseLoaded = true;
    });
  }

  stateChanged(state: RootState) {
    super.setUser(state);
    super.setRegionId(state);

    let thread_id = this.thread ? this.thread.id : null;
    super.setThread(state);

    /*
        if (this.thread && thread_id != this.thread.id) {
            let modelids = Object.keys((this.thread.models || {})) || [];
            this.questionComposer.setModelsIds(modelids);
        }

        if (this.thread && this.thread.regionid)
            this.questionComposer.setMainRegion(this.thread.regionid);
        */

    this._subregion = getUISelectedSubgoalRegion(state);

    if (
      this.thread &&
      this.thread.response_variables != this._responseVariables &&
      this.thread.driving_variables != this._drivingVariables &&
      !this._dispatched
    ) {
      this._responseVariables = this.thread.response_variables;
      this._drivingVariables = this.thread.driving_variables;
      this._queryModelCatalog();
      this._setEditMode(false);
    }

    if (state.models && !state.models.loading && this._dispatched) {
      this._queriedModels = state.models!.models;
      this._dispatched = false;
    }

    if (state.variables && state.variables.variables) {
      this._variableMap = state.variables.variables;
    }
  }
}
