import { property, html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { ExplorerStyles } from "./model-explore/explorer-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { goToPage } from "../../app/actions";

import { IdMap } from "app/reducers";
import {
  ModelConfigurationSetup,
  ModelConfiguration,
  SoftwareVersion,
  Model,
  Region,
  ModelCategory,
} from "@mintproject/modelcatalog_client";
import {
  getLabel,
  isSubregion,
  sortVersions,
  sortConfigurations,
  sortSetups,
} from "model-catalog-api/util";
import { ModelCatalogApi } from "model-catalog-api/model-catalog-api";

import "weightless/progress-spinner";
import "components/loading-dots";
import { Select } from "weightless";

interface ConfigurationOptions {
  categories: string[];
  onlyLatest: boolean;

}

@customElement("models-tree")
export class ModelsTree extends connect(store)(PageViewElement) {
  active: boolean = true;
  @property({ type: Object })
  private _regions: IdMap<Region> = {} as IdMap<Region>;

  @property({ type: Object })
  private _models: IdMap<Model> = {} as IdMap<Model>;

  @property({ type: Object })
  private _versions: IdMap<SoftwareVersion> = {} as IdMap<SoftwareVersion>;

  @property({ type: Object })
  private _configs: IdMap<ModelConfiguration> = {} as IdMap<ModelConfiguration>;

  @property({ type: Object })
  private _setups: IdMap<ModelConfigurationSetup> =
    {} as IdMap<ModelConfigurationSetup>;

  @property({ type: Object })
  private _categories: IdMap<ModelCategory>;

  @property({ type: Object })
  private _visible: IdMap<boolean> = {};

  @property({ type: String })
  private _selectedModel: string = "";

  @property({ type: String })
  private _selectedVersion: string = "";

  @property({ type: String })
  private _selectedConfig: string = "";

  @property({ type: String })
  private _selectedSetup: string = "";

  @property({ type: String })
  private _selectedCategory: string = "all";

  @property({ type: String })
  private _searchString: string = "";

  @property({ type: Boolean })
  private _creating: boolean = false;

  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      css`
        .tooltip:hover::after {
          width: 60px;
          left: -60px;
        }

        .inline-new-button {
          line-height: 1.2em;
          font-size: 1.2em;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 4px;
        }

        .inline-new-button:hover {
          text-decoration: none;
        }

        .inline-new-button > span {
          padding-top:4px;
        }

        .inline-new-button > wl-icon {
          --icon-size: 1em;
          margin: 1px;
        }

        .config {
          color: rgb(6, 108, 67);
        }

        .setup {
          color: rgb(6, 67, 108);
        }

        ul {
          padding-left: 12px;
          font-size: 13px;
        }

        li {
          list-style-type: none;
          font-size: 13px;
        }

        li > a {
          cursor: pointer;
        }

        .ta-right {
          text-align: right;
        }

        li[selected] > span,
        li[selected] > div,
        li[selected] > a {
          font-weight: 900;
        }

        span {
          cursor: pointer;
        }

        span.tag {
          display: block;
          border: 1px solid;
          border-radius: 3px;
          padding: 0px 5px;
          font-weight: bold;
          height: 1.4em;
        }

        span.tag.deprecated {
          border-color: chocolate;
          background: chocolate;
          color: white;
        }

        span.tag.latest {
          border-color: forestgreen;
          background: forestgreen;
          color: white;
        }

        div.tree-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          heigth: 2em;
          padding: 2px 4px 2px 0px;
          cursor:pointer;
        }

        div.tree-item > div.name {
          width: 100%;
        }

        div.tree-item.config > wl-icon.sample-icon {
          margin-right:4px;
          color: rgb(6, 148, 90);
        }

        div.tree-item.config > wl-icon.sample-icon[selected] {
          margin-right:4px;
          color: rgb(6, 108, 67);
        }

        div.tree-item.setup > wl-icon.sample-icon {
          margin-right:4px;
          color: rgb(6, 101, 162);
        }

        div.tree-item.setup > wl-icon.sample-icon[selected] {
          margin-right:4px;
          color: rgb(6, 67, 108);

        }
        
        div.empty-search {
          text-align:center;
          color: rgb(153, 153, 153);
          width:100%;
          padding: 10px 0px;
        }

        .tree-item:hover {
          background-color: rgb(240, 240, 240);
        }
        
        .tree-content {
          max-height: calc(100vh - 320px);
          overflow-y: auto;
          overflow-x: hidden;
        }
      `,
    ];
  }

  _getId(resource: | Model | SoftwareVersion | ModelConfiguration | ModelConfigurationSetup) {
    return resource.id.split("/").pop();
  }

  _createUrl(model: Model, version?: SoftwareVersion, config?: ModelConfiguration, setup?: ModelConfigurationSetup) {
    let url = "models/configure/" + this._getId(model);
    if (version) {
      url += "/" + this._getId(version);
      if (config) {
        url += "/" + this._getId(config);
        if (setup) {
          url += "/" + this._getId(setup);
        }
      }
    }
    return url;
  }

  _search (arg) {
    this._searchString = arg.target.value.toLowerCase();
  }

  _changeCategory (elem) {
    this._selectedCategory = elem.target.value;
    this._searchString = "";

    let selector: Select = this.shadowRoot!.getElementById(
      "search-input"
    ) as Select;
    if (selector) selector.value ="";
  }

  _select(model: Model, version: SoftwareVersion, config: ModelConfiguration, setup?: ModelConfigurationSetup) {
    goToPage(this._createUrl(model, version, config, setup));
  }

  _selectNew(model: Model, version: SoftwareVersion, config?: ModelConfigurationSetup) {
    goToPage(this._createUrl(model, version, config) + "/new");
  }

  _renderCategoryTree(categoryModels, category, visibleSetup) {
    const simpleSearch = (text:string) => text.toLowerCase().includes(this._searchString);
    const setupSearch = (s:ModelConfigurationSetup) => (s.label||[]).some(simpleSearch);
    const configSearch = (c:ModelConfiguration) => c.label.some(simpleSearch) ||
      (c.hasSetup || []).some(setupSearch);
    const modelSearch = (m:Model) => m.label.some(simpleSearch) ||
      (m.hasVersion || [])
        .filter(v => !!this._versions[v.id])
        .map(v => this._versions[v.id])
        .some(v => v.hasConfiguration
          .filter(c => !!c.id)
          .map(c => this._configs[c.id])
          .some(configSearch)
        )
    if ((categoryModels[category]||[]).filter(m => modelSearch(m) || simpleSearch(category)).length === 0)
      return html`<div class="empty_search"> No models found </div>`

    return html`
       <ul>
         ${categoryModels[category]
           .filter((model: Model) => !!model.hasVersion)
           .filter(m => modelSearch(m) || simpleSearch(category))
           .map(
             (model: Model) => html`
               <li ?selected="${this._selectedModel === model.id}">
                 <div class="tree-item" @click="${() => { this._visible[model.id] = !this._visible[model.id]; this.requestUpdate(); }}">
                   <wl-icon>${this._visible[model.id] ? "expand_more" : "expand_less"}</wl-icon>
                   <div class="name"> ${model.label} </div>
                 </div>
                 ${this._visible[model.id]
                   ? html` ${Object.keys(this._versions).length === 0
                         ? html`<loading-dots style="--width: 20px;" ></loading-dots>`
                         : html` <ul>
                               ${model.hasVersion
                                 .filter(v => !!this._versions[v.id])
                                 .map(v => this._versions[v.id])
                                 .sort(sortVersions)
                                 .map((version: SoftwareVersion) => 
                                   html` <li ?selected="${this ._selectedVersion === version.id}" >
                                     <div @click=${() => { this._visible[ version.id ] = !this._visible[ version.id ]; this.requestUpdate(); }} class="tree-item">
                                       <wl-icon>${this._visible[ version.id ] ? "expand_more" : "expand_less"}</wl-icon >
                                       <div class="name">
                                         ${version.label ? version.label : this._getId(version)}
                                       </div>
                                       ${this._renderTag( version["tag"])}
                                     </div>
                                     ${this._visible[version.id] ? html`
                                           <ul>
                                             ${( version.hasConfiguration || [])
                                               .filter(c => !!c.id)
                                               .map(c => this._configs[c.id])
                                               .filter(c => c && c.id)
                                               .filter(c => configSearch(c) || model.label.some(simpleSearch))
                                               .sort(sortConfigurations)
                                               .map( ( config: ModelConfiguration) => html`
                                                   <li ?selected="${this ._selectedConfig === config.id}" >
                                                     <div @click=${() => {this._select( model, version, config)}} class="tree-item config">
                                                       <wl-icon class="sample-icon" ?selected="${this ._selectedConfig === config.id}">label</wl-icon>
                                                       <a class="config" style="width:100%" @click="${() => { this._select( model, version, config); }}" >
                                                         ${config ? config.label : this._getId( config)}
                                                       </a>
                                                       ${this._renderTag(config.tag)}
                                                     </div>

                                                     <ul> ${( config.hasSetup || [])
                                                         .map(s => this ._setups[s.id])
                                                         .filter(visibleSetup)
                                                         .filter(s => setupSearch(s) || config.label.some(simpleSearch) || model.label.some(simpleSearch))
                                                         .sort(sortSetups)
                                                         .map((setup: ModelConfigurationSetup) => html`
                                                             <li ?selected="${this ._selectedSetup === setup.id}" >
                                                               <div @click=${() => {this._select( model, version, config, setup)}} class="tree-item setup">
                                                                 <wl-icon class="sample-icon" ?selected="${this ._selectedSetup === setup.id}">label</wl-icon>
                                                                 <a class="setup" style="width:100%" @click="${() => { this._select( model, version, config, setup); }}" >
                                                                   ${setup && setup.label ? setup.label : this._getId( setup)}
                                                                 </a>
                                                                 ${this._renderTag( setup.tag)}
                                                               </div>
                                                             </li>
                                                           `
                                                         )}
                                                       <li ?selected="${this ._creating && this ._selectedConfig === config.id}" >
                                                         <a class="inline-new-button setup" @click="${() => { this._selectNew( model, version, config); }}" >
                                                           <wl-icon >add_circle_outline</wl-icon >
                                                           <span> Add new setup </span>
                                                         </a>
                                                       </li>
                                                     </ul>
                                                   </li>
                                                 `
                                               )}
                                             <li>
                                             <li ?selected="${this ._creating && !this ._selectedConfig && this._selectedVersion === version.id}" >
                                               <a class="inline-new-button config" @click="${() => { this._selectNew( model, version); }}" >
                                                 <wl-icon>add_circle_outline</wl-icon>
                                                 <span>Add new configuration</span>
                                               </a>
                                             </li>
                                           </ul>
                                         `
                                       : ""}
                                   </li>`
                                 )}
                             </ul>
                           `}
                     `
                   : ""}
               </li>
             `
           )}
       </ul>`
  }

  protected render() {
    if (!this._models || !this._region || !this._regions || !this._categories)
      return html`<div style="width:100%; text-align: center;">
        <wl-progress-spinner></wl-progress-spinner>
      </div>`;

    const visibleSetup = (setup: ModelConfigurationSetup) =>
      !!setup &&
      (!setup.hasRegion ||
        setup.hasRegion.length == 0 ||
        (setup.hasRegion || []).some((region: Region) =>
          isSubregion(this._region.model_catalog_uri, this._regions[region.id])
        ));
    
    const applySearch = (text:string) => text.toLowerCase().includes(this._searchString);

    let categoryModels = { Uncategorized: [] };
    Object.values(this._categories)
      .forEach((cat: ModelCategory) => {
        categoryModels[getLabel(cat)] = [];
      });

    Object.values(this._models).forEach((m: Model) => {
      if (
        m.hasModelCategory &&
        m.hasModelCategory.filter((c) => !!c.id).length > 0
      ) {
        m.hasModelCategory
          .filter((c) => !!c.id)
          .forEach((cat: ModelCategory) => {
            let category: string = getLabel(this._categories[cat.id]);
            categoryModels[category].push(m);
            if (this._selectedModel === m.id) this._visible[category] = true;
          });
      } else {
        let category: string = "Uncategorized";
        categoryModels[category].push(m);
        if (this._selectedModel === m.id) this._visible[category] = true;
      }
    });

    //Remove empty categories
    Object.keys(categoryModels).forEach((cat: string) => {
      if (categoryModels[cat].length == 0) {
        delete categoryModels[cat];
      }
    });

    const categoryOptions = Object.keys(categoryModels);

    //When searching, remove categories with zero results
    if (this._searchString) {
      for (let categoryName of Object.keys(categoryModels)) {
        let found = false;
        if (applySearch(categoryName)) {
          found = true;
        } else {
          for (let model of categoryModels[categoryName]) {
            if (model.label.some(applySearch)) {
              found = true;
              break;
            } 
            for (let tver of (model.hasVersion || [])) {
              let version = this._versions[tver.id];
              if (version) for (let tconf of (version.hasConfiguration || [])) {
                let config = this._configs[tconf.id];
                if (config) {
                  if (config.label.some(applySearch)) {
                    found = true;
                    break;
                  } 
                  for (let tset of (config.hasSetup || [])) {
                    let setup = this._setups[tset.id];
                    if (setup) {
                      if (setup.label.some(applySearch)) {
                        found = true;
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        //--
        if (!found) {
          delete categoryModels[categoryName];
        }
      }
    }

    return html`
      <div style="margin-bottom:1em; padding: 0px 6px;" >
        <div style="display: flex; ">
          <wl-textfield
            label="Search model configurations"
            @input=${this._search}
            id="search-input"
            style="--input-font-size: 14px; --input-label-space: 10px; width: 100%;"
          >
            <wl-icon slot="after">search</wl-icon>
          </wl-textfield>
        </div>
        <wl-select label="Model Category" @input=${this._changeCategory} value=${this._selectedCategory}>
          <option value="all">All model categories</option>
          ${categoryOptions.map(n => html`<option value="${n}">${n}</value>`)}
        </wl-select>
      </div>
      <div class="tree-content">
        ${this._selectedCategory === 'all' ?  (Object.keys(categoryModels).length === 0 ? 
          html`<div class="empty-search"> No models found </div>`
        : 
          html`
          <ul style="padding-left: 8px; margin-top: 4px;">
            ${Object.keys(categoryModels)
              .map((category: string) => html`
                <li ?selected="${this._visible[category]}">
                  <div class="tree-item" @click="${() => { this._visible[category] = !this._visible[category]; this.requestUpdate(); }}" >
                    <wl-icon>${this._visible[category] ? "expand_more" : "expand_less"}</wl-icon >
                    <div class="name" style="font-size: 15px;"> ${category} </div>
                  </div>
                  ${this._visible[category]
                    ? this._renderCategoryTree(categoryModels, category, visibleSetup)
                    : ""}
                </li>
              `
            )}
          </ul>` 
        )
        : 
        this._renderCategoryTree(categoryModels, this._selectedCategory, visibleSetup)}
      </div>`
  }

  private _renderTag(tag: string[]) {
    if (!tag || tag.length == 0) return "";
    if (tag[0] == "preferred")
      return html`<span tip="Preferred" class="tooltip"
        ><wl-icon style="width: 20px;">start</wl-icon></span
      >`;
    return html`<span class="tag ${tag[0]}">${tag[0]}</span>`;
  }

  protected firstUpdated() {
    store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
    store.dispatch(ModelCatalogApi.myCatalog.modelCategory.getAll());
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
      let setupChanged: boolean =
        configChanged || ui.selectedCalibration !== this._selectedSetup;
      this._creating = ui.mode === "new";

      super.setRegionId(state);

      if (modelChanged) {
        this._selectedModel = ui.selectedModel;
        this._visible[this._selectedModel] = true;
      }
      if (versionChanged) {
        this._selectedVersion = ui.selectedVersion;
        this._visible[this._selectedVersion] = true;
      }
      if (configChanged) {
        this._selectedConfig = ui.selectedConfig;
      }
      if (setupChanged) {
        this._selectedSetup = ui.selectedCalibration;
      }

      if (state.modelCatalog) {
        let db = state.modelCatalog;
        this._models = db.model;
        this._versions = db.softwareversion;
        this._configs = db.modelconfiguration;
        this._setups = db.modelconfigurationsetup;
        this._regions = db.region;
        this._categories = db.modelcategory;
      }
    }
  }
}
