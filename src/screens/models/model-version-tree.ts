import { property, html, customElement, css } from "lit-element";
import { PageViewElement } from "../../components/page-view-element";

import { SharedStyles } from "../../styles/shared-styles";
import { ExplorerStyles } from "./model-explore/explorer-styles";
import { store, RootState } from "../../app/store";
import { connect } from "pwa-helpers/connect-mixin";
import { goToPage } from "../../app/actions";

import { IdMap } from "app/reducers";
import {
  SoftwareVersion,
  Model,
  ModelCategory,
} from "@mintproject/modelcatalog_client";
import { getLabel, sortVersions, getURL } from "model-catalog-api/util";

import "weightless/progress-spinner";
import "components/loading-dots";
import { Select } from "weightless";

@customElement("model-version-tree")
export class ModelVersionTree extends connect(store)(PageViewElement) {
  @property({ type: Object })
  private _models: IdMap<Model> = {} as IdMap<Model>;

  @property({ type: Object })
  private _versions: IdMap<SoftwareVersion> = {} as IdMap<SoftwareVersion>;

  @property({ type: Object })
  private _categories: IdMap<ModelCategory>;

  @property({ type: Object })
  private _visible: IdMap<boolean> = {};

  @property({ type: String })
  private _selectedModel: string = "";

  @property({ type: String })
  private _selectedVersion: string = "";

  @property({ type: Boolean })
  private _creating: boolean = false;

  @property({ type: String })
  private _selectedCategory: string = "all";

  @property({ type: String })
  private _searchString: string = "";

  static get styles() {
    return [
      ExplorerStyles,
      SharedStyles,
      css`
        .tree-content {
          height: calc(100vh - 366px);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .tooltip:hover::after {
          width: 80px;
          left: -10px;
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

        .version {
          color: rgb(6, 108, 67);
        }

        ul {
          padding-left: 14px;
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
          border: 1px solid;
          border-radius: 3px;
          padding: 0px 3px;
          font-weight: bold;
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

        div.tree-item.version > wl-icon.sample-icon {
          margin-right:4px;
          color: rgb(6, 148, 90);
        }

        div.tree-item.version > wl-icon.sample-icon[selected] {
          margin-right:4px;
          color: rgb(6, 108, 67);
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
      `,
    ];
  }

  _getId(resource: | Model | SoftwareVersion) {
    return resource.id.split("/").pop();
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

  _select(model: Model, version?: SoftwareVersion) {
    goToPage("models/edit/" + getURL(model, version));
  }

  _selectNew(model?: Model) {
    goToPage("models/edit/" + getURL(model) + "/new");
  }

  _renderCategoryTree(categoryModels, category) {
    const simpleSearch = (text:string) => text.toLowerCase().includes(this._searchString);
    const modelSearch = (m:Model) => m.label.some(simpleSearch) ||
      (m.hasVersion || [])
        .filter(v => !!this._versions[v.id])
        .map(v => this._versions[v.id])
        .some(v => v.label.some(simpleSearch));
    if ((categoryModels[category]||[]).filter(m => modelSearch(m) || simpleSearch(category)).length === 0)
      return html`<div class="empty_search"> No models found </div>`

    return html`
       <ul>
         ${categoryModels[category]
           .filter(m => modelSearch(m) || simpleSearch(category))
           .map(
             (model: Model) => html`
               <li ?selected="${this._selectedModel === model.id}">
                 <div class="tree-item" @click="${() => { this._visible[model.id] = !this._visible[model.id]; this._select(model); this.requestUpdate(); }}">
                   <wl-icon>${this._visible[model.id] ? "expand_more" : "expand_less"}</wl-icon>
                   <div class="name"> ${model.label} </div>
                 </div>
                 ${this._visible[model.id]
                   ? html` ${Object.keys(this._versions).length === 0
                         ? html`<loading-dots style="--width: 20px;" ></loading-dots>`
                         : html` <ul>
                               ${(model.hasVersion||[])
                                 .filter(v => !!this._versions[v.id])
                                 .map(v => this._versions[v.id])
                                 .sort(sortVersions)
                                 .map((version: SoftwareVersion) => 
                                   html` <li ?selected="${this ._selectedVersion === version.id}" >
                                     <div @click=${() => this._select(model, version)} class="tree-item version">
                                       <wl-icon class="sample-icon" ?selected="${this ._selectedVersion === version.id}">label</wl-icon>
                                       <div class="name">
                                         ${version.label ? version.label : this._getId(version)}
                                       </div>
                                       ${this._renderTag( version["tag"])}
                                     </div>
                                   </li>`
                                 )}
                                <li ?selected=${this._selectedModel === model.id && this._creating} >
                                  <a class="inline-new-button version" @click="${() => { this._selectNew(model); }}" >
                                    <wl-icon>add_circle_outline</wl-icon>
                                    <span>Add new version</span>
                                  </a>
                                </li>
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
    if (!this._models)
      return html`<div style="width:100%; text-align: center;">
        <wl-progress-spinner></wl-progress-spinner>
      </div>`;

    let categoryModels = { Uncategorized: [] };
    Object.values(this._categories).forEach((cat: ModelCategory) => {
      categoryModels[getLabel(cat)] = [];
    });

    Object.values(this._models).forEach((m: Model) => {
      if (m.hasModelCategory && m.hasModelCategory.length > 0) {
        m.hasModelCategory.forEach((cat: ModelCategory) => {
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
    const applySearch = (text:string) => text.toLowerCase().includes(this._searchString);

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
              if (version && (version.label||[]).some(applySearch)) {
                    found = true;
                    break;
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
            label="Search Models and Versions"
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
                    ? this._renderCategoryTree(categoryModels, category)
                    : ""}
                </li>
              `
            )}
          </ul>` 
        )
        : 
        this._renderCategoryTree(categoryModels, this._selectedCategory)}
      </div>
      <div>
        <wl-button style="display:flex;align-items:center; gap:1em; margin: 0 1em;"
          @click="${() => goToPage("models/edit/new")}"
        >
          <wl-icon>add_circle_outline</wl-icon>
          <span>Add new Model</span>
        </wl-button>
      </div>
    `;
  }

  private _renderTag(tag: string[]) {
    if (!tag || tag.length == 0) return "";
    if (tag[0] == "preferred")
      return html`<span tip="Preferred" class="tooltip"
        ><wl-icon style="width: 20px;">start</wl-icon></span
      >`;
    return html`<span class="tag ${tag[0]}">${tag[0]}</span>`;
  }

  stateChanged(state: RootState) {
    if (state.explorerUI) {
      let ui = state.explorerUI;
      // check whats changed
      let modelChanged: boolean = ui.selectedModel !== this._selectedModel;
      let versionChanged: boolean =
        modelChanged || ui.selectedVersion !== this._selectedVersion;
      this._creating = ui.mode === "new";

      if (modelChanged) {
        this._selectedModel = ui.selectedModel;
        this._visible[this._selectedModel] = true;
      }
      if (versionChanged) {
        this._selectedVersion = ui.selectedVersion;
        this._visible[this._selectedVersion] = true;
      }

      if (state.modelCatalog) {
        let db = state.modelCatalog;
        this._models = db.model;
        this._versions = db.softwareversion;
        this._categories = db.modelcategory;
      }
    }
  }
}
