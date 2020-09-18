import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { renderNotifications } from "../../util/ui_renders";
import { showNotification } from "../../util/ui_functions";
import { ExplorerStyles } from './model-explore/explorer-styles';
import { ComparisonEntry } from './model-explore/ui-reducers';
import { IdMap } from "app/reducers";
import { setupGetAll } from 'model-catalog/actions';
import { ComparisonFeature } from "../modeling/reducers";
import { uriToId, getLabel, getId } from 'model-catalog/util';

import { modelGet, versionGet, modelConfigurationGet, modelConfigurationSetupGet,
         modelsGet, versionsGet, modelConfigurationsGet, modelConfigurationSetupsGet, regionsGet } from 'model-catalog/actions';
import { isSubregion, sortVersions, sortConfigurations, sortSetups } from 'model-catalog/util';

import './models-tree'

import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup, Region } from '@mintproject/modelcatalog_client';

import { showDialog, hideDialog } from 'util/ui_functions';

import { ModelCatalogPerson } from './configure/resources/person';
import { ModelCatalogRegion } from './configure/resources/region';
import { ModelCatalogGrid } from './configure/resources/grid';
import { ModelCatalogDatasetSpecification } from './configure/resources/dataset-specification';
import { ModelCatalogProcess } from './configure/resources/process';
import { ModelCatalogParameter } from './configure/resources/parameter';
import { ModelCatalogSoftwareImage } from './configure/resources/software-image';
import { ModelCatalogTimeInterval } from './configure/resources/time-interval';

import "weightless/progress-spinner";
import '../../components/loading-dots'

type modelLike = Model | SoftwareVersion | ModelConfiguration | ModelConfigurationSetup;

@customElement('models-compare')
export class ModelsCompare extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideLateral : boolean = false;

    @property({type: Object})
    private _loading : IdMap<boolean> = {};

    @property({type: Object})
    private _compare : ComparisonEntry[] = [];

    @property({type: Object})
    private _models : IdMap<Model> = {};

    @property({type: Object})
    private _versions : IdMap<SoftwareVersion> = {};

    @property({type: Object})
    private _configs : IdMap<ModelConfiguration> = {};

    @property({type: Object})
    private _setups : IdMap<ModelConfigurationSetup> = {};

    private _gets = {
        "Model": modelGet,
        "SoftwareVersion": versionGet,
        "ModelConfiguration": modelConfigurationGet,
        "ModelConfigurationSetup": modelConfigurationSetupGet,
    }

    private _dbs = {
        "Model": this._models,
        "SoftwareVersion": this._versions,
        "ModelConfiguration": this._configs,
        "ModelConfigurationSetup": this._setups,
    }

    private _iPerson : IdMap<ModelCatalogPerson> = {};
    private _iRegion : IdMap<ModelCatalogRegion> = {};
    private _iGrid : IdMap<ModelCatalogGrid> = {};
    private _iInput : IdMap<ModelCatalogDatasetSpecification> = {};
    private _iParameter : IdMap<ModelCatalogParameter> = {};
    private _iProcess : IdMap<ModelCatalogProcess> = {};
    private _iSoftwareImage : IdMap<ModelCatalogSoftwareImage> = {};
    private _iTimeInterval : IdMap<ModelCatalogTimeInterval> = {};

    private _comparisonFeatures: Array<ComparisonFeature> = [
        {
            name: "Type",
            fn: (m:modelLike) => m.type && m.type.length > 0 ?
                    m.type.join(", ") : html`<span style="color:#999">None<span>`
        },
        {
            name: "Category",
            fn: (setup:ModelConfigurationSetup) => setup.hasModelCategory && setup.hasModelCategory.length > 0 ?
                    setup.hasModelCategory[setup.hasModelCategory.length-1] : html`<span style="color:#999">None<span>`
        },
        {
            name: "Keywords",
            fn: (model:ModelConfigurationSetup) => {
                if (model.keywords && model.keywords.length > 0 )
                    return model.keywords[0].split(';').join(', ');
                else
                    return html`<span style="color:#999">None specified<span>`
            }
        },
        {
            name: "Description",
            fn: (setup:ModelConfigurationSetup) => setup.description && setup.description.length > 0 ?
                    setup.description[setup.description.length -1] : html`<span style="color:#999">None provided<span>`
        },
        {
            name: "Parameter assignment/estimation",
            fn: (model:ModelConfigurationSetup) => model.parameterAssignmentMethod && model.parameterAssignmentMethod.length > 0 ?
                    model.parameterAssignmentMethod[model.parameterAssignmentMethod.length -1] : html`<span style="color:#999">None<span>`
        },

        {
            name: "Authors",
            fn: (m:modelLike) => m.author && m.author.length > 0 ?
                    this._iPerson[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Regions",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasRegion && m.hasRegion.length > 0 ?
                    this._iRegion[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Adjustable variables",
            fn: (setup:ModelConfigurationSetup) => setup.adjustableParameter && setup.adjustableParameter.length > 0 ?
                    setup.adjustableParameter.map((p) => html`<span class="resource">${getLabel(p)}</span>`)
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Inputs",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasInput && m.hasInput.length > 0 ?
                    this._iInput[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Grid",
            fn: (m: Model | ModelConfiguration | ModelConfigurationSetup) => m.hasGrid && m.hasGrid.length > 0 ?
                    this._iGrid[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },

        {
            name: "Time Interval",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasOutputTimeInterval && m.hasOutputTimeInterval.length > 0 ?
                    this._iTimeInterval[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Parameters",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasParameter && m.hasParameter.length > 0 ?
                    this._iParameter[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Component Location",
            fn: (setup:ModelConfigurationSetup) => setup.hasComponentLocation && setup.hasComponentLocation.length > 0 ?
                    setup.hasComponentLocation[setup.hasComponentLocation.length -1] : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Software Image",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasSoftwareImage && m.hasSoftwareImage.length > 0 ?
                    this._iSoftwareImage[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Modeled processes",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasProcess && m.hasProcess.length > 0 ? 
                    this._iProcess[m.id]
                    : html`<span style="color:#999">None specified<span>`
        },
        /*{
            name: "Adjustable variables",
            fn: (model:Model) => {
                if (model.input_parameters.length > 0) {
                    let values = model.input_parameters.filter((ip) => !ip.value);
                    if (values.length > 0) {
                        return values.map((ip) => ip.name).join(', ');
                    }
                }
                return html`<span style="color:#999">None<span>`
            }
        },
        {
            name: "Target variable for parameter assignment/estimation",
            fn: (model:Model) => model.target_variable_for_parameter_assignment ? 
                    model.target_variable_for_parameter_assignment : html`<span style="color:#999">No specified<span>`
        },
        {
            name: "Configuration region",
            fn: (model:Model) => model.calibrated_region ?
                    model.calibrated_region : html`<span style="color:#999">No specified<span>`
        },
        {
            name: "Spatial dimensionality",
            fn: (model:Model) => model.dimensionality ? 
                    html`<span style="font-family: system-ui;"> ${model.dimensionality} </span>`
                    : html`<span style="color:#999">No specified<span>`
        },
        {
            name: "Spatial grid type",
            fn: (model:Model) => model.spatial_grid_type ? 
                    model.spatial_grid_type
                    : html`<span style="color:#999">No specified<span>`
        },
        {
            name: "Spatial grid resolution",
            fn: (model:Model) => model.spatial_grid_resolution ?
                    model.spatial_grid_resolution 
                    : html`<span style="color:#999">No specified<span>`
        },
        {
            name: "Minimum output time interval",
            fn: (model:Model) => model.minimum_output_time_interval ?
                    model.minimum_output_time_interval
                    : html`<span style="color:#999">No specified<span>`
        }*/
    ]

    static get styles() {
        return [ExplorerStyles,
            css `
            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                background: #FFFFFF;
            }

            .twocolumns {
                position: absolute;
                top: 120px;
                bottom: 25px;
                left: 25px;
                right: 25px;
                display: flex;
                border: 1px solid #F0F0F0;
            }

            .left {
                width: 30%;
                padding-top: 0px;
                border-right: 1px solid #F0F0F0;
                padding-right: 5px;
                overflow: auto;
                height: 100%;
            }

            .left_closed {
                width: 0px;
                overflow: hidden;
            }

            .right, .right_full {
                width: 70%;
                padding-top: 0px;
                overflow: auto;
                height: 100%;
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

            .right_full {
                width: 100%;
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
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    <!--wl-title level="4" style="margin: 4px; padding: 10px;">Comparison options:</wl-title>
                    <div style="margin-left: 10px;">
                      <input type="checkbox" id="showDiff" name="showDiff">
                      <label for="scales">Show only differences</label>
                    </div-->
                    <wl-title level="4" style="margin: 4px; padding: 10px;">Select models:</wl-title>
                    <!--wl-textfield label="Search models:" style="padding: 0px 10px;">
                        <wl-icon slot="after">search</wl-icon>
                    </wl-textfield-->
                    ${ this._renderComparisonTree() }
                </div>
            </div>

            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    ${this._compare.length > 0 ? this._renderTable() : html`
                        <wl-title level="4"> Select a model on the left panel.</wl-title>`}
                </div>
            </div>
        </div>
        `
    }

    private _goToCatalog () {
        goToPage('models/explore/');
    }

    private _renderTable () {
        return html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <th style="border-right:1px solid #EEE; font-size: 14px;">
                    Model details
                    </th>
                    ${this._compare.map((c:ComparisonEntry) => {
                        return html`
                            <th .style="width:${100/(this._compare.length)}%">
                            ${this._loading[c.uri] ? 
                                html`${uriToId(c.uri)}
                                <loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`
                                : html`
                                    <wl-icon class="actionIcon bigActionIcon" style="float:right"
                                            @click="${() => this._removeFromComparison(c)}">
                                        close
                                    </wl-icon>
                                    <wl-title level="4">${getLabel(this._dbs[c.type][c.uri])}</wl-title>
                                `}
                        </th>`;
                    })}
                </thead>
                <tbody>
                    ${this._comparisonFeatures.map((feature) => {
                        return html`
                        <tr>
                            <td style="border-right:1px solid #EEE"><b>${feature.name}</b></td>
                            ${this._compare.map((c:ComparisonEntry) => this._loading[c.uri] ?
                            html`<td> <loading-dots style="--width: 20px; margin-left:10px"></loading-dots></td>`
                            : html`<td>${feature.fn(this._dbs[c.type][c.uri])}</td>`
                            )}
                        </tr>
                        `;
                    })}
                </tbody>
            </table>
        `;
    }

    _removeFromComparison (c:ComparisonEntry) {
        let newC : ComparisonEntry[] = this._compare.filter((ce:ComparisonEntry) => ce.uri !== c.uri);
        if (this._iPerson[c.uri]) delete this._iPerson[c.uri];
        if (this._iRegion[c.uri]) delete this._iRegion[c.uri];
        if (this._iGrid[c.uri]) delete this._iGrid[c.uri];
        if (this._iInput[c.uri]) delete this._iInput[c.uri];
        if (this._iProcess[c.uri]) delete this._iProcess[c.uri];
        if (this._iParameter[c.uri]) delete this._iParameter[c.uri];
        if (this._iTimeInterval[c.uri]) delete this._iTimeInterval[c.uri];
        if (this._iSoftwareImage[c.uri]) delete this._iSoftwareImage[c.uri];
        goToPage('models/compare/' + this._getURL(newC));
    }

    _addToComparison (c:ComparisonEntry) {
        if (this._compare.filter((ce:ComparisonEntry) => ce.uri === c.uri).length === 0) {
            let newC : ComparisonEntry[] = [ ... this._compare ];
            console.log(this._compare)
            newC.push(c);
            goToPage('models/compare/' + this._getURL(newC));
        }
    }

    _getURL (cArr:ComparisonEntry[]) {
        let url = "";
        cArr.forEach((c:ComparisonEntry) => {
            if (url.length > 0) url += "&"
            if (c.type === "Model") url += "model=";
            else if (c.type === "SoftwareVersion") url += "version=";
            else if (c.type === "ModelConfiguration") url += "config=";
            else if (c.type === "ModelConfigurationSetup") url += "setup=";
            url += c.uri.split('/').pop();
        })
        return url;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
        if (state.explorerUI) {
            this._compare = state.explorerUI.compare;
            this._compare.forEach((c:ComparisonEntry) => {
                console.log('>', c);
                if (!this._loading[c.uri] && !this._dbs[c.type][c.uri]) {
                    let get = this._gets[c.type];
                    let db = this._dbs[c.type];
                    this._loading[c.uri] = true;
                    store.dispatch(get(c.uri)).then((r : modelLike) => {
                        db[c.uri] = { ... r };
                        this._loading[c.uri] = false;
                        this.requestUpdate();
                        if (r.author && r.author.length > 0) {
                            this._iPerson[c.uri] = new ModelCatalogPerson();
                            this._iPerson[c.uri].setResources(r.author);
                        }
                        if (r['hasRegion'] && r['hasRegion'].length > 0) {
                            this._iRegion[c.uri] = new ModelCatalogRegion();
                            this._iRegion[c.uri].setResources(r['hasRegion']);
                        }
                        if (r['hasGrid'] && r['hasGrid'].length > 0) {
                            this._iGrid[c.uri] = new ModelCatalogGrid();
                            this._iGrid[c.uri].setResources(r['hasGrid']);
                        }
                        if (r['hasInput'] && r['hasInput'].length > 0) {
                            this._iInput[c.uri] = new ModelCatalogDatasetSpecification();
                            this._iInput[c.uri].setResources(r['hasInput']);
                        }
                        if (r['hasProcess'] && r['hasProcess'].length > 0) {
                            this._iProcess[c.uri] = new ModelCatalogProcess();
                            this._iProcess[c.uri].setResources(r['hasProcess']);
                        }
                        if (r['hasParameter'] && r['hasParameter'].length > 0) {
                            this._iParameter[c.uri] = new ModelCatalogParameter();
                            this._iParameter[c.uri].setResources(r['hasParameter']);
                        }
                        if (r['hasOutputTimeInterval'] && r['hasOutputTimeInterval'].length > 0) {
                            this._iTimeInterval[c.uri] = new ModelCatalogTimeInterval();
                            this._iTimeInterval[c.uri].setResources(r['hasOutputTimeInterval']);
                        }
                        if (r['hasSoftwareImage'] && r['hasSoftwareImage'].length > 0) {
                            this._iSoftwareImage[c.uri] = new ModelCatalogSoftwareImage();
                            this._iSoftwareImage[c.uri].setResources(r['hasSoftwareImage']);
                        }
                    });
                }
            });
        }
    }

    private _allModels : IdMap<Model> = {};
    private _allVersions : IdMap<SoftwareVersion> = {};
    private _allConfigs : IdMap<ModelConfiguration> = {};
    private _allSetups : IdMap<ModelConfigurationSetup> = {};
    private _allRegions : IdMap<Region> = {};

    @property({type: Boolean}) private _loadingAllModels : boolean = true;
    @property({type: Boolean}) private _loadingAllVersions : boolean = true;
    @property({type: Boolean}) private _loadingAllConfigs : boolean = true;
    @property({type: Boolean}) private _loadingAllSetups : boolean = true;

    @property({type: Object})
    private _visible : IdMap<boolean> = {};

    protected firstUpdated () {
        store.dispatch(modelsGet()).then((models:IdMap<Model>) => {
            this._loadingAllModels = false;
            this._allModels = models;
        });
        store.dispatch(versionsGet()).then((versions:IdMap<SoftwareVersion>) => {
            this._loadingAllVersions = false;
            this._allVersions = versions;
        });
        store.dispatch(modelConfigurationsGet()).then((cfgs:IdMap<ModelConfiguration>) => {
            this._loadingAllConfigs = false;
            this._allConfigs = cfgs;
        });
        let setupReq = store.dispatch(modelConfigurationSetupsGet())
        setupReq.then((setups:IdMap<ModelConfigurationSetup>) => {
            this._allSetups = setups;
        });
        let regionReq = store.dispatch(regionsGet());
        regionReq.then((regions:IdMap<Region>) => {
            this._allRegions = regions;
        });
        Promise.all([setupReq, regionReq]).then(() => {
            this._loadingAllSetups = false;
        })
    }

    private _renderComparisonTree () {
        if (this._loadingAllModels) 
            return html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`;

        const visibleSetup = (setup: ModelConfigurationSetup) =>
            !!setup && (!setup.hasRegion || (setup.hasRegion||[]).some((region:Region) =>
                    isSubregion(this._region.model_catalog_uri, this._allRegions[region.id])));

        let categoryModels = {};
        Object.values(this._allModels).forEach((m:Model) => {
            let category : string = m.hasModelCategory && m.hasModelCategory.length > 0 ?
                    m.hasModelCategory[0] : 'Uncategorized';
            if (!categoryModels[category]) categoryModels[category] = [];
            categoryModels[category].push(m);
            /*if (this._selectedModel === m.id) {
                this._visible[category] = true;
            }*/
        });

        return html`
        <ul>
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
            <li>
                <span>
                    <wl-icon @click="${() => {
                        this._visible[model.id] = !this._visible[model.id];
                        this.requestUpdate();
                    }}">
                        ${this._visible[model.id] ? 'expand_more' : 'expand_less'}
                    </wl-icon>
                    <span @click="${()=>this._addToComparison({type:'Model', uri:model.id})}">
                        ${model.label}
                    </span>
                </span>
                ${this._visible[model.id] ? html`
                ${this._loadingAllVersions ? html`<loading-dots style="--width: 20px;"></loading-dots>` : html`
                <ul>
                    ${model.hasVersion
                        .filter((v:any) => !!this._allVersions[v.id])
                        .map((v:any) => this._allVersions[v.id])
                        .sort(sortVersions)
                        .map((version : SoftwareVersion) => html`
                    <li>
                        <span>
                            <wl-icon @click=${() => {
                             this._visible[version.id] = !this._visible[version.id];
                             this.requestUpdate();
                            }}>
                                ${this._visible[version.id] ? 'expand_more' : 'expand_less'}
                            </wl-icon>
                            ${this._renderTag(version['tag'])}
                            <span @click="${()=>this._addToComparison({type:'SoftwareVersion', uri:version.id})}">
                                ${version.label ? version.label : getId(version)}
                            </span>
                        </span>
                        ${this._visible[version.id] ? html`
                        ${this._loadingAllConfigs ? html`<loading-dots style="--width: 20px;"></loading-dots>` : html`
                        <ul style="padding-left: 30px;">
                            ${(version.hasConfiguration || [])
                                .filter(c => !!c.id)
                                .map((c) => this._allConfigs[c.id])
                                .filter(c => (c && c.id))
                                .sort(sortConfigurations)
                                .map((config : ModelConfiguration) => html`
                            <li>
                                ${this._renderTag(config.tag)}
                                <a class="config"
                                    @click="${()=>this._addToComparison({type:'ModelConfiguration', uri:config.id})}">
                                    ${config ? config.label : getId(config)}
                                </a>
                                <ul>
                                    ${(config.hasSetup || [])
                                        .map((s:any) => this._allSetups[s.id])
                                        .filter(visibleSetup)
                                        .sort(sortSetups)
                                        .map((setup : ModelConfigurationSetup) => html`
                                    <li style="list-style:disc">
                                        ${this._renderTag(setup.tag)}
                                        <a class="setup"
                                            @click="${()=>this._addToComparison({type:'ModelConfigurationSetup', uri:setup.id})}">
                                            ${setup ? setup.label : getId(setup)}
                                        </a>
                                    </li>
                                    `)}
                                </ul>
                            </li>
                            `)}
                        </ul>`}
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

    //FIXME: this is a copy from models-tree
    private _renderTag (tag : string[]) {
        if (!tag || tag.length == 0)
            return '';
        if (tag[0] == "preferred") 
            return html`<span tip="Preferred" class="tooltip"><wl-icon style="width: 20px;">start</wl-icon></span>`;
        return html`<span class="tag ${tag[0]}">${tag[0]}</span>`;
    }
}
