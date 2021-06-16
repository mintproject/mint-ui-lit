import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { ExplorerStyles } from './model-explore/explorer-styles'
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { IdMap } from 'app/reducers';
import { ModelConfigurationSetup, ModelConfiguration, SoftwareVersion, Model, Region, ModelCategory } from '@mintproject/modelcatalog_client';
import { categoriesGet, regionsGet } from 'model-catalog/actions';
import { getLabel, isSubregion, sortVersions, sortConfigurations, sortSetups } from 'model-catalog/util';

import "weightless/progress-spinner";
import 'components/loading-dots'

@customElement('models-tree')
export class ModelsTree extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _regions : IdMap<Region> = {} as IdMap<Region>;

    @property({type: Object})
    private _models : IdMap<Model> = {} as IdMap<Model>;

    @property({type: Object})
    private _versions : IdMap<SoftwareVersion> = {} as IdMap<SoftwareVersion>;

    @property({type: Object})
    private _configs : IdMap<ModelConfiguration> = {} as IdMap<ModelConfiguration>;

    @property({type: Object})
    private _setups : IdMap<ModelConfigurationSetup> = {} as IdMap<ModelConfigurationSetup>;

    @property({type: Object})
    private _categories : IdMap<ModelCategory>;

    @property({type: Object})
    private _visible : IdMap<boolean> = {};

    @property({type: String})
    private _selectedModel : string = '';

    @property({type: String})
    private _selectedVersion : string = '';

    @property({type: String})
    private _selectedConfig : string = '';

    @property({type: String})
    private _selectedSetup : string = '';

    @property({type: Boolean})
    private _creating : boolean = false;

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
            .tooltip:hover::after {
                width: 80px;
                left: -10px;
            }

            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
                vertical-align: middle;
            }

            wl-icon {
                position: relative;
                top: 5px;
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

            li[selected] > span, li[selected] > a {
                font-weight: 900;
                font-size: 15px;
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
            }`
        ];
    }

    _getId (resource : Model | SoftwareVersion | ModelConfiguration | ModelConfigurationSetup) {
        return resource.id.split('/').pop();
    }

    _createUrl (model:Model, version?:SoftwareVersion, config?:ModelConfiguration, setup?:ModelConfigurationSetup) {
        let url = 'models/configure/' + this._getId(model);
        if (version) {
            url += '/' + this._getId(version);
            if (config) {
                url += '/' + this._getId(config);
                if (setup) {
                    url += '/' + this._getId(setup);
                }
            }
        }
        return url;
    }

    _select (model:Model, version:SoftwareVersion, config:ModelConfiguration, setup?:ModelConfigurationSetup) {
        goToPage(this._createUrl(model, version, config, setup));
    }

    _selectNew (model:Model, version:SoftwareVersion, config?:ModelConfigurationSetup) {
        goToPage(this._createUrl(model, version, config) + '/new');
    }

    protected render() {
        if (!this._models || !this._region || !this._regions || !this._categories) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;

        const visibleSetup = (setup: ModelConfigurationSetup) =>
                !!setup && (!setup.hasRegion || setup.hasRegion.length == 0 || (setup.hasRegion||[]).some((region:Region) =>
                    isSubregion(this._region.model_catalog_uri, this._regions[region.id])));

        let categoryModels = {"Uncategorized": []};
        Object.values(this._categories).forEach((cat:ModelCategory) => {
            categoryModels[getLabel(cat)] = []
        })

        Object.values(this._models).forEach((m:Model) => {
            if (m.hasModelCategory && m.hasModelCategory.length > 0) {
                m.hasModelCategory.forEach((cat:ModelCategory) => {
                    let category : string = getLabel(this._categories[cat.id]);
                    categoryModels[category].push(m);
                    if (this._selectedModel === m.id) this._visible[category] = true;
                });
            } else {
                let category : string = 'Uncategorized';
                categoryModels[category].push(m);
                if (this._selectedModel === m.id) this._visible[category] = true;
            }
        });

        //Remove empty categories
        Object.keys(categoryModels).forEach((cat:string) => {
            if (categoryModels[cat].length == 0) {
                delete categoryModels[cat];
            }
        })

        return html`
        <ul style="padding-left: 10px; margin-top: 4px;">
            ${Object.keys(categoryModels).map((category:string) => html`
            <li ?selected="${this._visible[category]}">
                <span @click="${() => {
                    this._visible[category] = !this._visible[category];
                    this.requestUpdate();
                }}">
                    <wl-icon>${this._visible[category] ? 'expand_more' : 'expand_less'}</wl-icon>
                    <span style="font-size: 15px;">
                        ${category}
                    </span>
                </span>
                ${this._visible[category] ? html`
                <ul>
            ${categoryModels[category]
                .filter((model: Model) => !!model.hasVersion)
                .map((model: Model) => html`
            <li ?selected="${this._selectedModel === model.id}">
                <span @click="${() => {
                    this._visible[model.id] = !this._visible[model.id];
                    this.requestUpdate();
                }}">
                    <wl-icon>${this._visible[model.id] ? 'expand_more' : 'expand_less'}</wl-icon>
                    <span>
                        ${model.label}
                    </span>
                </span>
                ${this._visible[model.id] ? html`
                ${Object.keys(this._versions).length === 0 ? html`<loading-dots style="--width: 20px;"></loading-dots>` : html`
                <ul>
                    ${model.hasVersion
                        .filter((v:any) => !!this._versions[v.id])
                        .map((v:any) => this._versions[v.id])
                        .sort(sortVersions)
                        .map((version : SoftwareVersion) => html`
                    <li ?selected="${this._selectedVersion === version.id}">
                        <span @click=${() => {
                             this._visible[version.id] = !this._visible[version.id];
                             this.requestUpdate();
                        }}>
                            <wl-icon>${this._visible[version.id] ? 'expand_more' : 'expand_less'}</wl-icon>
                            ${this._renderTag(version['tag'])}
                            <span>
                                ${version.label ? version.label : this._getId(version)}
                            </span>
                        </span>
                        ${this._visible[version.id] ? html`
                        <ul style="padding-left: 30px;">
                            ${(version.hasConfiguration || [])
                                .filter(c => !!c.id)
                                .map((c) => this._configs[c.id])
                                .filter(c => (c && c.id))
                                .sort(sortConfigurations)
                                .map((config : ModelConfiguration) => html`
                            <li ?selected="${this._selectedConfig === config.id}">
                                ${this._renderTag(config.tag)}
                                <a class="config" @click="${()=>{this._select(model, version, config)}}">
                                    ${config ? config.label : this._getId(config)}
                                </a>
                                <ul>
                                    ${(config.hasSetup || [])
                                        .map((s:any) => this._setups[s.id])
                                        .filter(visibleSetup)
                                        .sort(sortSetups)
                                        .map((setup : ModelConfigurationSetup) => html`
                                    <li style="list-style:disc" ?selected="${this._selectedSetup === setup.id}">
                                        ${this._renderTag(setup.tag)}
                                        <a class="setup" @click="${()=>{this._select(model, version, config, setup)}}">
                                            ${setup && setup.label ? setup.label : this._getId(setup)}
                                        </a>
                                    </li>
                                    `)}
                                    <li ?selected="${this._creating && this._selectedConfig === config.id}">
                                        <a class="inline-new-button setup" @click="${()=>{this._selectNew(model, version, config)}}">
                                            <wl-icon>add_circle_outline</wl-icon>
                                            <span> Add new setup </span>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            `)}
                            <li>
                                <a class="inline-new-button config" @click="${() => {this._selectNew(model, version)}}">
                                    <wl-icon>add_circle_outline</wl-icon>
                                    Add new configuration
                                </a>
                            </li>
                        </ul>
                        ` : ''}
                    </li>`)}
                </ul>
                `}
                ` : ''}
            </li>
        `)}
                </ul>
                ` : ''}
            </li>

            `)}
        </ul>
        `;
    }

    private _renderTag (tag : string[]) {
        if (!tag || tag.length == 0)
            return '';
        if (tag[0] == "preferred") 
            return html`<span tip="Preferred" class="tooltip"><wl-icon style="width: 20px;">start</wl-icon></span>`;
        return html`<span class="tag ${tag[0]}">${tag[0]}</span>`;
    }

    protected firstUpdated () {
        store.dispatch(regionsGet());
        store.dispatch(categoriesGet());
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            let ui = state.explorerUI;
            // check whats changed
            let modelChanged : boolean = (ui.selectedModel !== this._selectedModel);
            let versionChanged : boolean = (modelChanged || ui.selectedVersion !== this._selectedVersion)
            let configChanged : boolean = (versionChanged || ui.selectedConfig !== this._selectedConfig);
            let setupChanged : boolean = (configChanged || ui.selectedCalibration !== this._selectedSetup);
            this._creating = (ui.mode === 'new');

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
                this._models = db.models;
                this._versions = db.versions;
                this._configs = db.configurations;
                this._setups = db.setups;
                this._regions = db.regions;
                this._categories = db.categories;
            }
        }
    }
}
