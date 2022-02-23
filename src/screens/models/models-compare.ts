import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { ExplorerStyles } from './model-explore/explorer-styles';
import { ComparisonEntry } from './model-explore/ui-reducers';
import { IdMap } from "app/reducers";
import { ComparisonFeature } from "../modeling/reducers";

import { uriToId, getLabel, getModelTypeNames } from 'model-catalog/util';

import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';


import { Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup } from '@mintproject/modelcatalog_client';

import { ModelCatalogPerson } from './configure/resources/person';
import { ModelCatalogRegion } from './configure/resources/region';
import { ModelCatalogGrid } from './configure/resources/grid';
import { ModelCatalogDatasetSpecification } from './configure/resources/dataset-specification';
import { ModelCatalogProcess } from './configure/resources/process';
import { ModelCatalogParameter } from './configure/resources/parameter';
import { ModelCatalogSoftwareImage } from './configure/resources/software-image';
import { ModelCatalogTimeInterval } from './configure/resources/time-interval';
import { ModelCatalogVariablePresentation } from './configure/resources/variable-presentation';

import "./compare-tree";
import "weightless/progress-spinner";
import '../../components/loading-dots'

type modelLike = Model | SoftwareVersion | ModelConfiguration | ModelConfigurationSetup;

@customElement('models-compare')
export class ModelsCompare extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideLateral : boolean = false;

    @property({type: Object})
    private _loading : IdMap<boolean> = {};

    @property({type: Array})
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
        "Model": ModelCatalogApi.myCatalog.model.get,
        "SoftwareVersion": ModelCatalogApi.myCatalog.softwareVersion.get,
        "ModelConfiguration": ModelCatalogApi.myCatalog.modelConfiguration.get,
        "ModelConfigurationSetup": ModelCatalogApi.myCatalog.modelConfigurationSetup.get,
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
    private _iInputVariable : IdMap<ModelCatalogVariablePresentation> = {};
    private _iOutputVariable : IdMap<ModelCatalogVariablePresentation> = {};

    private _comparisonFeatures: Array<ComparisonFeature> = [
        {
            name: "Type",
            fn: (m:modelLike) => m.type && m.type.length > 0 ?
                    getModelTypeNames(m.type).join(", ") : html`<span style="color:#999">None</span>`
        },
        {
            name: "Category",
            fn: (setup:ModelConfigurationSetup) => setup.hasModelCategory && setup.hasModelCategory.length > 0 ?
                    setup.hasModelCategory.map(getLabel).join(', ') : html`<span style="color:#999">None</span>`
        },
        {
            name: "Keywords",
            fn: (model:ModelConfigurationSetup) => {
                if (model.keywords && model.keywords.length > 0 )
                    return model.keywords[0].split(';').join(', ');
                else
                    return html`<span style="color:#999">None specified</span>`
            }
        },
        {
            name: "Authors",
            fn: (m:modelLike) => m.author && m.author.length > 0 ?
                    this._iPerson[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Description",
            fn: (setup:ModelConfigurationSetup) => setup.description && setup.description.length > 0 ?
                    setup.description[setup.description.length -1] : html`<span style="color:#999">None provided</span>`
        },
        {
            name: "Theoretical Basis",
            fn: (model:ModelConfigurationSetup) => model.theoreticalBasis && model.theoreticalBasis.length > 0 ?
                    model.theoreticalBasis[0] : html`<span style="color:#999">None</span>`
        },
        {
            name: "Runtime Estimation",
            fn: (model:ModelConfigurationSetup) => model.runtimeEstimation && model.runtimeEstimation.length > 0 ?
                    model.runtimeEstimation[0] : html`<span style="color:#999">None</span>`
        },
        {
            name: "Parameterization",
            fn: (model:ModelConfigurationSetup) => model.parameterization && model.parameterization.length > 0 ?
                    model.parameterization[0] : html`<span style="color:#999">None</span>`
        },
        {
            name: "Limitations",
            fn: (model:ModelConfigurationSetup) => model.limitations && model.limitations.length > 0 ?
                    model.limitations[0] : html`<span style="color:#999">None</span>`
        },
        {
            name: "Modeled processes",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasProcess && m.hasProcess.length > 0 ? 
                    this._iProcess[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },

        {
            name: "Input variables:",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasInputVariable && m.hasInputVariable.length > 0 ? 
                    this._iInputVariable[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Output variables:",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasOutputVariable && m.hasOutputVariable.length > 0 ? 
                    this._iOutputVariable[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },

        {
            name: "Regions",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasRegion && m.hasRegion.length > 0 ?
                    this._iRegion[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Parameter assignment/estimation",
            fn: (model:ModelConfigurationSetup) => model.parameterAssignmentMethod && model.parameterAssignmentMethod.length > 0 ?
                    model.parameterAssignmentMethod[model.parameterAssignmentMethod.length -1] : html`<span style="color:#999">None</span>`
        },

        {
            name: "Adjustable variables",
            fn: (setup:ModelConfigurationSetup) => setup.adjustableParameter && setup.adjustableParameter.length > 0 ?
                    setup.adjustableParameter.map((p) => html`<span class="resource">${getLabel(p)}</span>`)
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Inputs",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasInput && m.hasInput.length > 0 ?
                    this._iInput[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Grid",
            fn: (m: Model | ModelConfiguration | ModelConfigurationSetup) => m.hasGrid && m.hasGrid.length > 0 ?
                    this._iGrid[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Time Interval",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasOutputTimeInterval && m.hasOutputTimeInterval.length > 0 ?
                    this._iTimeInterval[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Parameters",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasParameter && m.hasParameter.length > 0 ?
                    this._iParameter[m.id]
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Component Location",
            fn: (setup:ModelConfigurationSetup) => setup.hasComponentLocation && setup.hasComponentLocation.length > 0 ?
                    html`<span style="word-break: break-all;">${setup.hasComponentLocation[setup.hasComponentLocation.length -1]}</span>`
                    : html`<span style="color:#999">None specified</span>`
        },
        {
            name: "Software Image",
            fn: (m: ModelConfiguration | ModelConfigurationSetup) => m.hasSoftwareImage && m.hasSoftwareImage.length > 0 ?
                    this._iSoftwareImage[m.id]
                    : html`<span style="color:#999">None specified</span>`
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
            SharedStyles,
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

            .horizontal-table {
                table-layout:fixed;
                width: fit-content;
                overflow-x: auto;
            }
            `,
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    <wl-title level="4" style="margin: 4px; padding: 10px;">Select models:</wl-title>
                    <compare-tree></compare-tree>
                </div>
            </div>

            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    ${this._compare.length > 0 ? this._renderTable() : html`
                        <wl-title level="4">Select a model on the left panel.</wl-title>`}
                </div>
            </div>
        </div>
        `
    }

    private _renderTable () {
        let bigTable : boolean = this._compare.length > 3;
        return html`
            <table class="pure-table pure-table-striped ${bigTable? 'horizontal-table' : ''}">
                <thead>
                    <th style="border-right:1px solid #EEE; font-size: 14px; width:140px">
                    Model details
                    </th>
                    ${this._compare.map((c:ComparisonEntry) => {
                        return html`
                            <th .style="width:${bigTable ? '380px' : (100/this._compare.length).toString() + '%' }">
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
        if (this._iInputVariable[c.uri]) delete this._iInputVariable[c.uri];
        if (this._iOutputVariable[c.uri]) delete this._iOutputVariable[c.uri];
        goToPage('models/compare/' + this._getURL(newC));
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
                        if (r['hasInputVariable'] && r['hasInputVariable'].length > 0) {
                            this._iInputVariable[c.uri] = new ModelCatalogVariablePresentation();
                            this._iInputVariable[c.uri].setResources(r['hasInputVariable']);
                        }
                        if (r['hasOutputVariable'] && r['hasOutputVariable'].length > 0) {
                            this._iOutputVariable[c.uri] = new ModelCatalogVariablePresentation();
                            this._iOutputVariable[c.uri].setResources(r['hasOutputVariable']);
                        }
                    });
                }
            });
        }
    }
}
