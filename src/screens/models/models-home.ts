import { property, html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";
import { IdMap, User } from "app/reducers";

import { SharedStyles } from "../../styles/shared-styles";
import { store, RootState } from "../../app/store";
import models from "./reducers";
import { connect } from "pwa-helpers/connect-mixin";

import "./model-explore/model-explore";
import "./models-register";
import "./models-calibrate";
import "./models-configure";
import "./models-edit";
import "./models-cromo";
import "../../components/nav-title";

store.addReducers({
  models,
});

import modelCatalog from "model-catalog-api/reducers";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";
import { UserCatalog } from "model-catalog-api/user-catalog";
import { Model, ModelConfiguration, ModelConfigurationSetup } from "@mintproject/modelcatalog_client";
import { getLabel } from "model-catalog-api/util";

store.addReducers({
  modelCatalog,
});

@customElement("models-home")
export class ModelsHome extends connect(store)(PageViewElement) {
  @property({ type: Object }) private _selectedModel: Model;
  @property({ type: Object }) private _selectedConfig: ModelConfiguration;
  @property({ type: Object }) private _selectedSetup: ModelConfigurationSetup;
  @property({ type: String }) private _selectedVersionID: String;
  @property({ type: Object }) private user: User | null = null;

  static get styles() {
    return [
      css`
        wl-card.card-button {
          border: 2px solid rgba(98, 155, 48, 0.5);
          text-align: center;
          color: rgb(6, 67, 108);
          font-size: 1.2em;
          font-weight: bold;
          padding: 10px;
          cursor: pointer;
        }

        wl-card.card-button a {
          color: rgb(6, 67, 108);
          text-decoration: none;
        }

        .no-decoration,
        .no-decoration:hover {
          text-decoration: none;
        }

        wl-card.card-button a:hover {
          background-color: inherit;
        }

        wl-card.card-button img {
          padding: 15px;
          width: 150px;
          display: block;
          margin: auto;
        }

        .icongrid {
          grid-template-columns: 160px 160px 160px !important;
          margin-left: calc(50% - 240px) !important;
        }

        model-explorer {
          height: calc(100% - 40px);
        }

        @media (max-width: 768px) {
          .icongrid {
            grid-template-columns: 120px 120px 120px !important;
            margin-left: calc(50% - 180px) !important;
          }
        }

        a[disabled] {
          pointer-events: none;
        }
      `,
      SharedStyles,
    ];
  }

  private _getHelpLink() {
    let uri: string =
      "https://mintproject.readthedocs.io/en/latest/modelcatalog/";
    if (this._selectedSetup) return uri + "#model-configuration-setup";
    if (this._selectedConfig) return uri + "#model-configuration";
    return uri;
  }

  private _getAPILink() {
    return "https://api.models.wildfire.mint.isi.edu/latest/ui/";
  }

  protected render() {
    let extraNames = {}
    let ignore = [];
    if (this._selectedModel) {
      extraNames[this._selectedModel.id.split('/').pop()] = getLabel(this._selectedModel);
      if (this._selectedConfig) {
        extraNames[this._selectedConfig.id.split('/').pop()] = getLabel(this._selectedConfig);
        if (this._selectedSetup) {
          extraNames[this._selectedSetup.id.split('/').pop()] = getLabel(this._selectedSetup);
        }
      }
    }
    if (this._selectedVersionID) {
      ignore.push(this._selectedVersionID);
    }

    return html`
      <nav-title .names="${extraNames}" .ignore="${ignore}" .displaytitle=${true}>
        ${this._subpage === 'home' ? html`
        <span slot="after">
          <a
            class="no-decoration"
            target="_blank"
            href="${this._getAPILink()}"
            style="margin-right: 0.5em;"
          >
            <wl-button style="--button-padding: 8px;">
              <wl-icon style="margin-right: 5px;">help_outline</wl-icon>
              <b>API</b>
            </wl-button>
          </a>
          <a
            class="no-decoration"
            target="_blank"
            href="${this._getHelpLink()}"
          >
            <wl-button
              style="--button-bg: forestgreen; --button-bg-hover: darkgreen; --button-padding: 8px;"
            >
              <wl-icon style="margin-right: 5px;">help_outline</wl-icon>
              <b>Documentation</b>
            </wl-button>
          </a>
        </span>
          ` : null}
      </nav-title>

      <div class="${this._subpage != "home" ? "hiddensection" : "icongrid"}">
        <a href="${this._regionid}/models/explore">
          <wl-icon>search</wl-icon>
          <div>Browse Models</div>
        </a>
        <a
          href="${this._regionid}/models/register"
          ?disabled=${this.user === null}
        >
          <wl-icon>library_add</wl-icon>
          <div>Add Models</div>
        </a>
        <a href="${this._regionid}/models/edit" ?disabled=${this.user === null}>
          <wl-icon>edit</wl-icon>
          <div>Edit Models</div>
        </a>
        <a href="${this._regionid}/models/compare">
          <wl-icon>compare</wl-icon>
          <div>Compare Models</div>
        </a>
        <a
          href="${this._regionid}/models/configure"
          ?disabled=${this.user === null}
        >
          <wl-icon style="margin-left: 20px;">perm_data_settings</wl-icon>
          <div>Configure Models</div>
        </a>
        <a
          href="${this._regionid}/models/cromo"
          ?disabled=${this.user === null}
        >
          <wl-icon style="margin-top:0px">manage_search</wl-icon>
          <div style="margin-top: -10px;">Recommend Models</div>
        </a>
      </div>

      <model-explorer
        class="page"
        ?active="${this._subpage == "explore"}"
      ></model-explorer>
      <models-register
        class="page"
        ?active="${this._subpage == "register"}"
      ></models-register>
      <models-configure
        class="page"
        ?active="${this._subpage == "configure"}"
      ></models-configure>
      <models-calibrate
        class="page"
        ?active="${this._subpage == "calibrate"}"
      ></models-calibrate>
      <models-compare
        class="page"
        ?active="${this._subpage == "compare"}"
      ></models-compare>
      <models-edit
        class="page"
        ?active="${this._subpage == "edit"}"
      ></models-edit>
      <models-cromo
        class="page"
        ?active="${this._subpage == "cromo"}"
      ></models-cromo>
    `;
  }

  firstUpdated() {
    let api: UserCatalog = ModelCatalogApi.myCatalog;

    store.dispatch(api.model.getAll());
    store.dispatch(api.softwareVersion.getAll());
    store.dispatch(api.modelConfiguration.getAll());
    store.dispatch(api.modelConfigurationSetup.getAll());
    store.dispatch(api.region.getAll());
    store.dispatch(api.image.getAll());
    store.dispatch(api.modelCategory.getAll());
    store.dispatch(api.variablePresentation.getAll());

    //TEST
    /*console.log('Getting SWAT from the model-catalog...');
        store.dispatch(ModelCatalogApi.getCatalog('mint@isi.edu').model.get("SWAT")).then((m:Model) => {
            console.log('Response from mint@isi.edu:', m);
            console.log('Copy to user graph...');
            let swatCopy = { ...m, id: '' }
            //if (swatCopy.dateCreated) delete swatCopy.dateCreated
            store.dispatch(ModelCatalogApi.myCatalog.model.post(swatCopy)).then((s:Model) => {
                console.log('Response of post', s);
                console.log('Editing...');
                if (s && s.label && s.label.length > 0) {
                    s.label = [ s.label[0] + " (copy)" ];
                    store.dispatch(ModelCatalogApi.myCatalog.model.put(s)).then((w:Model) => {
                        console.log('Response of put', w);
                        console.log("Deleting...");
                        store.dispatch(ModelCatalogApi.myCatalog.model.delete(w.id)).then(() => {
                            console.log("DONE");
                        });
                    });
                } else {
                    console.log('error no s');
                }
            });
        });*/
  }

  stateChanged(state: RootState) {
    this.user = state.app!.user!;
    super.setSubPage(state);
    super.setRegionId(state);
    if (state && state.explorerUI && state.modelCatalog) {
      if (state.explorerUI.selectedVersion)
        this._selectedVersionID = state.explorerUI.selectedVersion.split('/').pop();
      else
        this._selectedVersionID = "";
      if (state.explorerUI.selectedModel && state.modelCatalog.model[state.explorerUI.selectedModel])
        this._selectedModel = state.modelCatalog.model[state.explorerUI.selectedModel]
      if (state.explorerUI.selectedModel && state.modelCatalog.modelconfiguration[state.explorerUI.selectedConfig]) {
        this._selectedConfig = state.modelCatalog.modelconfiguration[state.explorerUI.selectedConfig]
      }
      if (state.explorerUI.selectedModel && state.modelCatalog.modelconfigurationsetup[state.explorerUI.selectedCalibration]) {
        this._selectedSetup = state.modelCatalog.modelconfigurationsetup[state.explorerUI.selectedCalibration]
      }
    }
  }
}
