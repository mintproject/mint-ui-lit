import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { ExplorerStyles } from './model-explore/explorer-styles'
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

import { IdMap } from 'app/reducers';
import { ModelConfigurationSetup, ModelConfiguration, SoftwareVersion, Model, Region } from '@mintproject/modelcatalog_client';
import { regionsGet } from 'model-catalog/actions';
import { isSubregion, sortVersions, sortConfigurations, sortSetups } from 'model-catalog/util';

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
            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
                vertical-align: middle;
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
                padding-left: 20px;
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

            span[selected], a[selected] {
                font-weight: 900;
                font-size: 14px;
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
        if (!this._models || !this._region || !this._regions) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;

        const visibleSetup = (setup: ModelConfigurationSetup) => ((setup||{}).hasRegion||[]).map((region:Region) =>
            isSubregion(this._region.model_catalog_uri, this._regions[region.id])
        ).some(x=>x);

        return html`
        <ul style="padding-left: 10px; margin-top: 4px;">
            ${Object.values(this._models)
                .filter((model: Model) => !!model.hasVersion)
                .map((model: Model) => html`
            <li>
                <span @click="${() => {
                    this._visible[model.id] = !this._visible[model.id];
                    this.requestUpdate();
                }}">
                    <wl-icon>${this._visible[model.id] ? 'expand_more' : 'expand_less'}</wl-icon>
                    <span ?selected="${this._selectedModel === model.id}" style="vertical-align: top;">
                        ${model.label}
                    </span>
                </span>
                ${this._visible[model.id] ? html`
                ${Object.keys(this._versions).length === 0 ? html`<loading-dots style="--width: 20px; vertical-align: top;"></loading-dots>` : html`
                <ul>
                    ${model.hasVersion
                        .filter((v:any) => !!this._versions[v.id])
                        .map((v:any) => this._versions[v.id])
                        .sort(sortVersions)
                        .map((version : SoftwareVersion) => html`
                    <li>
                        <span @click=${() => {
                             this._visible[version.id] = !this._visible[version.id];
                             this.requestUpdate();
                        }}>
                            <wl-icon>${this._visible[version.id] ? 'expand_more' : 'expand_less'}</wl-icon>
                            <!-- FIXME tag is not on the npm package right now -->
                            ${version['tag'] ? version['tag'].map((tag:string) => html`<span class="tag ${tag}">${tag}</span>`) : ''}
                            <span ?selected="${this._selectedVersion === version.id}" style="vertical-align: top;">
                                ${version.label ? version.label : this._getId(version)}
                            </span>
                        </span>
                        ${this._visible[version.id] ? html`
                        ${Object.keys(this._configs).length === 0 ? html`<loading-dots style="--width: 20px; vertical-align: top;"></loading-dots>` : html`
                        <ul style="padding-left: 30px;">
                            ${(version.hasConfiguration || [])
                                .filter(c => !!c.id)
                                .map((c) => this._configs[c.id])
                                .sort(sortConfigurations)
                                .map((config : ModelConfiguration) => html`
                            <li>
                                ${config.tag ? config.tag.map((tag:string) => html`<span class="tag ${tag}">${tag}</span>`) : ''}
                                <a class="config" @click="${()=>{this._select(model, version, config)}}"
                                   ?selected="${this._selectedConfig === config.id}">
                                    ${config ? config.label : this._getId(config)}
                                </a>
                                <ul>
                                    ${(config.hasSetup || [])
                                        .map((s:any) => this._setups[s.id])
                                        .filter(visibleSetup)
                                        .sort(sortSetups)
                                        .map((setup : ModelConfigurationSetup) => html`
                                    <li>
                                        ${setup.tag ? setup.tag.map((tag:string) => html`<span class="tag ${tag}">${tag}</span>`) : ''}
                                        <a class="setup" @click="${()=>{this._select(model, version, config, setup)}}"
                                           ?selected="${this._selectedSetup === setup.id}">
                                            ${setup ? setup.label : this._getId(setup)}
                                        </a>
                                    </li>
                                    `)}
                                    <li>
                                        <a class="inline-new-button setup" @click="${()=>{this._selectNew(model, version, config)}}">
                                            <wl-icon>add_circle_outline</wl-icon>
                                            <span ?selected="${this._creating && this._selectedConfig === config.id}">
                                                Add new setup
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            `)}
                            <!--li>
                                <a class="inline-new-button config" @click="">
                                    <wl-icon>add_circle_outline</wl-icon>
                                    Add new configuration
                                </a>
                            </li-->
                        </ul>`}
                        ` : ''}
                    </li>`)}
                </ul>
                `}
                ` : ''}
            </li>
        `)}
        </ul>`;
    }

    protected firstUpdated () {
        store.dispatch(regionsGet());
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
            }
        }
    }
}
