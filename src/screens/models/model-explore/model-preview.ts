import { PageViewElement } from "../../../components/page-view-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { html, property, customElement, css } from "lit-element";

import { ExplorerStyles } from "./explorer-styles";

import {
  getId,
  isEmpty,
  isSubregion,
  getLatestVersion,
  getLatestConfiguration,
  isExecutable,
  getLabel,
  getModelTypeNames,
} from "model-catalog-api/util";
import {
  Model,
  SoftwareVersion,
  ModelConfiguration,
  ModelConfigurationSetup,
  Region,
  Image,
  ModelCategory,
} from "@mintproject/modelcatalog_client";

import "../../../components/loading-dots";
import { SharedStyles } from "styles/shared-styles";
import { navigate } from "app/actions";

@customElement("model-preview")
export class ModelPreview extends connect(store)(PageViewElement) {
  @property({ type: String }) public id: string = "";
  @property({ type: Number }) private _nVersions: number = -1;
  @property({ type: Number }) private _nConfigs: number = -1;
  @property({ type: Number }) private _nSetups: number = -1;
  @property({ type: Number }) private _nLocalSetups: number = -1;
  @property({ type: String }) private _url: string = "";
  @property({ type: Object }) private _regions: null | Set<Region> = null;
  @property({ type: Object }) private _model!: Model;
  @property({ type: Object }) private _logo!: Image;
  @property({ type: Boolean }) private _loadingLogo: boolean = false;
  @property({ type: String }) private _modelCategories: string = "...";

  private PREFIX: string = "/models/explore/";

  static get styles() {
    return [
      SharedStyles,
      ExplorerStyles,
      css`
        :host {
          display: block;
        }
        
        a.concept-card {
          display: block;
          color: unset;
          text-decoration: none;
        }
        
        .flex {
          display:flex;
          align-items: center;
          gap: 10px;
        }

        .between {
          justify-content: space-between;
        }

        .nowrap {
          text-wrap: nowrap;
        }

        .ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          text-wrap: nowrap;
        }

        .concept-card > div > h4 {
          margin-bottom: 0px;
        }

        .icon {
          cursor: pointer;
          display: inline-block;
          border-radius: 5px;
          padding: 4px 6px;
        }

        .icon:hover {
          background-color: #ddd;
        }
        
        img {
          min-height: 100px;
          min-width: 100px;
        }

        .content {
          text-align: justify;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          line-height: 16px;
          max-height: 96px;

          /* The number of lines to be displayed */
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          margin-bottom: 4px;
        }

        .content > code {
          line-height: 19px;
        }

        hr {
          margin-bottom: 1em;
        }

        img {
          vertical-align: middle;
          border: 1px solid black;
          max-width: calc(100% - 8px);
          max-height: calc(150px - 3.6em - 2px);
        }

        #img-placeholder {
          vertical-align: middle;
          --icon-size: 80px;
        }

        .keywords {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        loading-dots {
          --width: 20px;
        }

      `,
    ];
  }

  protected render() {
    if (this._model) {
      let modelType: string[] = this._model.type
        ? getModelTypeNames(this._model.type)
        : [];
      let modelUri: string = this._regionid + (this._url ? this._url : this.PREFIX + getId(this._model));
      return html`
        <a class="concept-card" style="margin-bottom:1em; cursor: pointer;" href=${modelUri}>
          <div class="flex between">
            <h4 class="ellipsis">${this._model.label}</h4>
            <div class="flex">
              <span class="nowrap">
                  ${this._nVersions > 0
                    ? this._nVersions.toString() +
                      " version" +
                      (this._nVersions > 1 ? "s" : "")
                    : "No versions"},
                  ${this._nConfigs > 0
                    ? this._nConfigs.toString() +
                      " config" +
                      (this._nConfigs > 1 ? "s" : "")
                    : "No configs"}
              </span>
              <span class="icon">
                <slot name="extra-icon"></slot>
              </span>
            </div>
          </div>
          <hr></hr>
          <div style="display:flex;">
            <div style="flex: 0 0 200px; display:flex; align-items:center; flex-direction: column;justify-content: space-between;">
                ${this._loadingLogo
                  ? html`<wl-progress-spinner></wl-progress-spinner>`
                  : this._logo && this._logo.value
                  ? html`<img src="${this._logo.value[0]}" />`
                  : html`<wl-icon id="img-placeholder">image</wl-icon>`}
              <div style="margin-top: .6em;">
                <b>Category:</b> ${this._modelCategories}
              </div>
            </div>

            <div style="display:flex; flex-direction: column; width: calc(100% - 200px); justify-content: space-between;">
              <div class="content">
                <slot name="description"></slot>
              </div>

              <div style="display:flex; flex-direction: column;">
                ${modelType && modelType.length > 0 ? html`
                  <span class="keywords">
                    <b>Type:</b>
                    ${modelType.join(", ")} ` : null}

                ${Array.from(this._regions || []).length > 0 ? html`
                  <span class="keywords">
                    <b>Regions:</b>
                    ${Array.from(this._regions).map((r) => r.label) .join(", ")}
                  </span>` : null}

                <span class="keywords">
                  <b>Keywords:</b>
                  ${this._model.keywords && this._model.keywords.length > 0
                    ? this._model.keywords.join(";").split(/ *; */).join(", ")
                    : "No keywords"}
                </span>
              </div>
            </div>

          </div>
        </a>
      `;
    } else {
      return html`Something when wrong!`;
    }
  }


  stateChanged(state: RootState) {
    let lastParentRegion = this._regionid;
    super.setRegionId(state);
    let db = state.modelCatalog;
    /* Load this model and, if is needed versions, configs and setups */
    if (
      db &&
      db.model[this.id] &&
      (db.model[this.id] != this._model || lastParentRegion != this._regionid)
    ) {
      this._model = db.model[this.id];
      this._loadingLogo = this._model.logo && this._model.logo.length > 0;

      if (this._model.hasVersion) {
        this._nVersions = this._model.hasVersion.length;
        this._nConfigs = -1;
        this._nSetups = -1;
        this._nLocalSetups = -1;
        this._regions = null;
        this._url = "";
      } else {
        this._nVersions = 0;
        this._nConfigs = 0;
        this._nSetups = 0;
        this._nLocalSetups = 0;
        this._regions = new Set();
        this._url = this.PREFIX + getId(this._model);
      }
    }

    /* Set model categories */
    if (db && db.modelcategory) {
      if (
        !this._model.hasModelCategory ||
        this._model.hasModelCategory.length == 0
      ) {
        this._modelCategories = "-";
      } else {
        this._modelCategories = this._model.hasModelCategory
          .filter((c: ModelCategory) => !!db.modelcategory[c.id])
          .map((c: ModelCategory) => db.modelcategory[c.id])
          .map(getLabel)
          .join(", ");
      }
    }
    if (
      this._loadingLogo &&
      !isEmpty(db.image) &&
      db.image[(this._model.logo[0] as Image).id]
    ) {
      this._loadingLogo = false;
      this._logo = db.image[(this._model.logo[0] as Image).id];
    }

    if (
      this._nVersions > 0 &&
      this._nConfigs < 0 &&
      !isEmpty(db.softwareversion)
    ) {
      let lastVersion: SoftwareVersion | null = null;
      this._nConfigs = this._model.hasVersion
        .map((ver: any) => db.softwareversion[ver.id])
        .filter((ver: SoftwareVersion) => !!ver)
        .reduce((sum: number, ver: SoftwareVersion) => {
          lastVersion = getLatestVersion(lastVersion, ver);
          return sum + (ver.hasConfiguration || []).length;
        }, 0);
      if (this._nConfigs === 0) {
        this._nSetups = 0;
        this._nLocalSetups = 0;
        this._url =
          this.PREFIX +
          getId(this._model) +
          (lastVersion ? "/" + getId(lastVersion) : "");
      }
    }

    if (
      this._nConfigs > 0 &&
      this._nSetups < 0 &&
      !this._regions &&
      ![db.modelconfiguration, db.modelconfigurationsetup, db.region]
        .map(isEmpty)
        .some((b) => b)
    ) {
      // We filter for region, so we need to compute the url, local setups and regions.
      this._regions = new Set();
      this._nLocalSetups = 0;

      let lastVersion: SoftwareVersion | null = null;
      let lastConfig: ModelConfiguration | null = null;
      let lastSetup: ModelConfigurationSetup | null = null;

      // Count setups and compute url and regions.
      this._nSetups = this._model.hasVersion
        .map((ver: any) => db.softwareversion[ver.id])
        .filter((ver: SoftwareVersion) => {
          if (!lastSetup) lastVersion = getLatestVersion(lastVersion, ver);
          return !!ver;
        })
        .reduce(
          (sum: number, ver: SoftwareVersion) =>
            sum +
            (ver.hasConfiguration || [])
              .map((cfg: any) => db.modelconfiguration[cfg.id])
              .filter((cfg: ModelConfiguration) => {
                if (!lastSetup && lastVersion === ver)
                  lastConfig = getLatestConfiguration(lastConfig, cfg);
                return !!cfg;
              })
              .reduce(
                (sum2: number, cfg: ModelConfiguration) =>
                  sum2 +
                  (cfg.hasSetup || [])
                    .map((setup: any) => db.modelconfigurationsetup[setup.id])
                    .filter((setup: ModelConfigurationSetup) =>
                      isExecutable(setup)
                    )
                    .reduce((sum3: number, setup: ModelConfigurationSetup) => {
                      (setup.hasRegion || [])
                        .map((reg: any) => db.region[reg.id])
                        .forEach((reg: Region) => {
                          if (
                            this._region &&
                            isSubregion(this._region.model_catalog_uri, reg)
                          ) {
                            this._nLocalSetups += 1;
                            this._regions.add(reg);
                            if (!lastSetup) {
                              lastSetup = setup;
                              lastConfig = cfg;
                              lastVersion = ver;
                            } else {
                              let s_ver = getLatestVersion(lastVersion, ver);
                              if (s_ver != lastVersion) {
                                lastSetup = setup;
                                lastConfig = cfg;
                                lastVersion = ver;
                              }
                            }
                          }
                        });
                      return sum3 + 1;
                    }, 0),
                0
              ),
          0
        );

      this._url =
        this.PREFIX +
        getId(this._model) +
        (lastVersion
          ? "/" +
            getId(lastVersion) +
            (lastConfig
              ? "/" +
                getId(lastConfig) +
                (lastSetup ? "/" + getId(lastSetup) : "")
              : "")
          : "");
    }
  }
}
