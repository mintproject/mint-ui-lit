import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { ExplorerStyles } from './model-explore/explorer-styles'

import { IdMap } from 'app/reducers';

//import { ModelConfiguration, SoftwareVersion, Model, Region } from '@mintproject/modelcatalog_client';

import './configure/configuration';
import './configure/setup';
import './configure/new-setup';
import './configure/parameter';

//import {  } from '../../util/model-catalog-actions';

import "weightless/progress-spinner";
import '../../components/loading-dots'

@customElement('models-tree')
export class ModelsTree extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _regions : any = null;

    @property({type: Object})
    private _models : any = null;

    @property({type: Object})
    private _versions : any = null;

    @property({type: Object})
    private _configs : any = null;

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
        return [ExplorerStyles,
            css `
            .inline-new-button {
                line-height: 1.2em;
                font-size: 1.2em;
            }

            .inline-new-button > wl-icon {
                --icon-size: 1.2em;
                vertical-align: top;
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
            `,
            SharedStyles
        ];
    }

    _getId (resource) {
        return resource.id.split('/').pop();
    }

    _createUrl (model, version?, config?, setup?) {
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

    _select (model, version, config, setup?) {
        goToPage(this._createUrl(model, version, config, setup));
    }

    _selectNew (model, version, config?) {
        goToPage(this._createUrl(model, version, config) + '/new');
    }

    protected render() {
        if (!this._models || !this._region || !this._regions) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;

        if (this._region && this._region.model_catalog_uri === 'https://w3id.org/okn/i/mint/Texas')
            this._region.model_catalog_uri = 'https://w3id.org/okn/i/mint/United_States';

        const visibleSetup = (setup) => setup && (
            !setup.hasRegion || setup.hasRegion.length === 0 ||
            (this._region && !this._region.model_catalog_uri) ||
            setup.hasRegion.filter((r:any) => r.id === this._region.model_catalog_uri).length > 0 ||
            setup.hasRegion.filter((r:any) => 
                this._regions[r.id] &&
                this._regions[r.id].country &&
                this._regions[r.id].country.length > 0 &&
                this._regions[r.id].country[0].id === this._region.model_catalog_uri
            ).length > 0
        );

        return html`
        <ul style="padding-left: 10px; margin-top: 4px;">
            ${Object.values(this._models).filter((model: any) => !!model.hasVersion).map((model: any) => html`
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
                ${!this._versions ? html`<loading-dots style="--width: 20px"></loading-dots>` : html`
                <ul>
                    ${model.hasVersion.filter(v => !!this._versions[v.id]).map((v) => this._versions[v.id]).map((version) => html`
                    <li>
                        <span @click=${() => {
                             this._visible[version.id] = !this._visible[version.id];
                             this.requestUpdate();
                        }}>
                            <wl-icon>${this._visible[version.id] ? 'expand_more' : 'expand_less'}</wl-icon>
                            <span ?selected="${this._selectedVersion === version.id}" style="vertical-align: top;">
                                ${version.label ? version.label : version.id.split('/').pop()}
                            </span>
                        </span>
                        ${this._visible[version.id] ? html`
                        ${!this._configs ? html`<loading-dots style="--width: 20px"></loading-dots>` : html`
                        <ul style="padding-left: 30px;">
                            ${(version.hasConfiguration || []).filter(c => !!c.id).map((c) => this._configs[c.id]).map((config) => html`
                            <li>
                                <a @click="${()=>{this._select(model, version, config)}}" ?selected="${this._selectedConfig === config.id}">
                                    ${config ? config.label : config.id.split('/').pop()}
                                </a>
                                <ul>
                                    ${((config ? config.hasSetup : []) || []).map((s) => this._configs[s.id])
                                        .filter(visibleSetup)
                                        .map(setup => html`
                                    <li>
                                        <a @click="${()=>{this._select(model, version, config, setup)}}" ?selected="${this._selectedSetup === setup.id}">
                                            ${setup ? setup.label : setup.id.split('/').pop()}
                                        </a>
                                    </li>
                                    `)}
                                    <li>
                                        <a class="inline-new-button" @click="${()=>{this._selectNew(model, version, config)}}">
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
                                <a class="inline-new-button" @click="">
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

    firstUpdated () {
        /*Everything is loaded*/
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
                this._regions = db.regions;
            }
        }
    }
}