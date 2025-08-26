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
          height: calc(100% - 80px);
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

        .two-section {
          display: grid;
          grid-template-columns: auto 45%;
          gap: 2em;
          margin-bottom:3em;
        }

        .concept-grid-3 > .concept-card > div:first-child {
          display: flex;
          justify-content: space-between;
          flex-direction: column;
        }

        .concept-grid-3 > .concept-card > div > a:hover {
          background-color:transparent;
        }


        .gray-section {
          margin-top: 2em;
          padding-bottom: 3em;
        }

        .concept-grid-3 {
          padding-top: 40px;
          display: grid;
          grid-template-columns: auto auto auto;
          gap: 1em;
        }

        @media (max-width: 768px) {
          .concept-grid-3 {
            grid-template-columns: auto;
          }
        }

        @media (min-width: 769px) {
          .concept-grid-3 {
            grid-template-columns: auto auto;
          }
        }
        @media (min-width: 1024px) {
          .concept-grid-3 {
            grid-template-columns: auto auto auto;
          }
        }

        .concept-grid-3 .concept-card {
          display: grid;
          grid-template-columns: auto 100px;
          background-color:white;
        }

        .concept-grid-3 .concept-card > .card-icon {
          display: flex;
          align-items: center;
        }

        .concept-grid-3 > .concept-card > .card-icon > wl-icon {
          --icon-size: 100px;
          color:hsl(224,50%,38%);
        }
      `,
      SharedStyles,
    ];
  }

  private _getHelpLink() {
    let uri: string =
      "https://in-for-disaster-analytics.github.io/DYNAMO_USERGUIDE/modelcatalog/";
    if (this._selectedSetup) return uri + "#model-configuration-setup";
    if (this._selectedConfig) return uri + "#model-configuration";
    return uri;
  }

  private _getAPILink() {
    return "https://api.models.mint.tacc.utexas.edu/v1.8.0/docs";
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
    <div class="${this._subpage == "home" || this._subpage == "explore" ? "content-page" : "hiddensection"}">
      <nav-title .names="${extraNames}" .ignore="${ignore}" .displaytitle=${this._subpage !== 'explore'}>
      </nav-title>
    </div>

    <div class="${this._subpage == "home" ? "content-page" : "hiddensection"}">
      <div class="two-section">
        <div>
          <p>
            The DYNAMO Model Services describe physical, environmental, and social models
            (e.g., climate, hydrology, agriculture, or economy models) to help users:
          </p>
          <ul>
            <li>
              Find relevant models by name, keywords, variables, or region of execution.
            </li>
            <li>
              Understand how to use models and interpret their results. To support this,
              key variables in input and output files are described, along with essential
              geospatial and temporal information that provides context for interpreting results.
            </li>
            <li>
              Configure models by providing new input files and parameters, or by creating
              new expert-prepared setups.
            </li>
          </ul>
        </div>
        <div class="concept-card nohover">
          <h4>Whant to know more?</h4>
          <hr></hr>
          <ul>
            <li>
              <a target="_blank" href="${this._getHelpLink()}">
                Check out the documentation
              </a>
               for an introduction to how the model catalog defines models and configurations.
            </li>
            <li>
              The model catalog is also accessible through an OpenAPI-compatible API. For more details,
              <a target="_blank" href="${this._getAPILink()}" >
                read the API documentation.
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="${this._subpage == "home" ? "gray-section" : "hiddensection"}">
      <div class="content-page">
        <div class="concept-grid-3">
          <div class="concept-card">
            <div>
              <h4>Browse Models</h4>
              <p>
                The DYNAMO Model Browser helps you explore the models available in the catalog.
              </p>
              <a href="${this._regionid}/models/explore" class="no-decoration,"> 
                <wl-button>Browse Models</wl-button>
              </a>
            </div>
            <div class="card-icon">
              <wl-icon>search</wl-icon>
            </div>
          </div>

          <div class="concept-card">
            <div>
              <h4>Create or Edit Models</h4>
              <p>
                Create new models or software versions, or edit existing ones.
              </p>
              <a href="${this._regionid}/models/edit" ?disabled=${this.user === null}>
                <wl-button>Edit models</wl-button>
              </a>
            </div>
            <div class="card-icon">
              <wl-icon>edit</wl-icon>
            </div>
          </div>

          <div class="concept-card">
            <div>
              <h4>Configure Models</h4>
              <p>
                Create generic model configurations or set up heavily restricted executions.
              </p>
              <a href="${this._regionid}/models/configure" ?disabled=${this.user === null}>
                <wl-button>Set up models</wl-button>
              </a>
            </div>
            <div class="card-icon">
              <wl-icon>perm_data_settings</wl-icon>
            </div>
          </div>
        </div>
      </div>
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

//    <div>
//      <div class="${this._subpage != "home" ? "hiddensection" : "icongrid"}">
//        <a href="${this._regionid}/models/explore">
//          <wl-icon>search</wl-icon>
//          <div>Browse Models</div>
//        </a>
//        <a
//          href="${this._regionid}/models/register"
//          ?disabled=${this.user === null}
//        >
//          <wl-icon>library_add</wl-icon>
//          <div>Add Models</div>
//        </a>
//        <a href="${this._regionid}/models/edit" ?disabled=${this.user === null}>
//          <wl-icon>edit</wl-icon>
//          <div>Edit Models</div>
//        </a>
//        <a href="${this._regionid}/models/compare">
//          <wl-icon>compare</wl-icon>
//          <div>Compare Models</div>
//        </a>
//        <a
//          href="${this._regionid}/models/configure"
//          ?disabled=${this.user === null}
//        >
//          <wl-icon style="margin-left: 20px;">perm_data_settings</wl-icon>
//          <div>Configure Models</div>
//        </a>
//        <a
//          href="${this._regionid}/models/cromo"
//          ?disabled=${this.user === null}
//        >
//          <wl-icon style="margin-top:0px">manage_search</wl-icon>
//          <div style="margin-top: -10px;">Recommend Models</div>
//        </a>
//      </div>

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
