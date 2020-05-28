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
import { uriToId, getLabel } from 'model-catalog/util';

import './models-tree'

import { showDialog, hideDialog } from 'util/ui_functions';

import "weightless/progress-spinner";
import '../../components/loading-dots'

@customElement('models-compare')
export class ModelsCompare extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _hideLateral : boolean = true;

    @property({type: Object})
    private _loading : IdMap<boolean> = {};

    @property({type: Object})
    private _compare : ComparisonEntry[] = [];

    @property({type: Object})
    private _setups : IdMap<ModelConfigurationSetup> = {};

    private _comparisonFeatures: Array<ComparisonFeature> = [
        {
            name: "Category",
            fn: (setup:ModelConfigurationSetup) => setup.hasModelCategory && setup.hasModelCategory.length > 0 ?
                    setup.hasModelCategory.pop() : html`<span style="color:#999">None<span>`
        },
        {
            name: "Keywords",
            fn: (model:ModelConfigurationSetup) => {
                if (model.keywords.length > 0 )
                    return model.keywords[0].split(';').join(', ');
                else
                    return html`<span style="color:#999">None specified<span>`
            }
        },
        {
            name: "Description",
            fn: (setup:ModelConfigurationSetup) => setup.description && setup.description.length > 0 ?
                    setup.description.pop() : html`<span style="color:#999">None provided<span>`
        },
        {
            name: "Parameter assignment/estimation",
            fn: (model:Model) => model.parameterAssignmentMethod && model.parameterAssignmentMethod.length > 0 ?
                    model.parameterAssignmentMethod.pop() : html`<span style="color:#999">None<span>`
        },
        {
            name: "Authors",
            fn: (setup:ModelConfigurationSetup) => setup.author && setup.author.length > 0 ?
                    setup.author.map((author) => html`<span class="resource author">${getLabel(author)}</span>`)
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Regions",
            fn: (setup:ModelConfigurationSetup) => setup.hasRegion && setup.hasRegion.length > 0 ?
                    setup.hasRegion.map((region) => html`<span class="resource region">${getLabel(region)}</span>`)
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
            fn: (setup:ModelConfigurationSetup) => setup.hasInput && setup.hasInput.length > 0 ?
                    setup.hasInput.map(getLabel).join(', ')
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Grid",
            fn: (setup:ModelConfigurationSetup) => setup.hasGrid && setup.hasGrid.length > 0 ?
                    setup.hasGrid.map(getLabel).join(', ')
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Time Interval",
            fn: (setup:ModelConfigurationSetup) => setup.hasOutputTimeInterval && setup.hasOutputTimeInterval.length > 0 ?
                    setup.hasOutputTimeInterval.map((ti) => html`<span class="resource time-interval">${getLabel(ti)}</span>`)
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Parameters",
            fn: (setup:ModelConfigurationSetup) => setup.hasParameter && setup.hasParameter.length > 0 ?
                    setup.hasParameter.map(getLabel).join(', ')
                    : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Component Location",
            fn: (setup:ModelConfigurationSetup) => setup.hasComponentLocation && setup.hasComponentLocation.length > 0 ?
                    setup.hasComponentLocation.pop() : html`<span style="color:#999">None specified<span>`
        },
        {
            name: "Software Image",
            fn: (setup:ModelConfigurationSetup) => setup.hasSoftwareImage && setup.hasSoftwareImage.length > 0 ?
                    setup.hasSoftwareImage.map((si) => html`<span class="resource software-image">${getLabel(si)}</span>`)
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
            name: "Modeled processes",
            fn: (model:Model) => model.modeled_processes.length > 0 ?
                    model.modeled_processes : html`<span style="color:#999">None specified<span>`
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

            .right_full {
                width: 100%;
            }`,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="twocolumns">
            <div class="${this._hideLateral ? 'left_closed' : 'left'}">
                <div class="clt">
                    <wl-title level="4" style="margin: 4px; padding: 10px;">Models:</wl-title>
                    Search models here.
                </div>
            </div>

            <div class="${this._hideLateral ? 'right_full' : 'right'}">
                <div class="card2">
                    <wl-icon @click="${() => this._hideLateral = !this._hideLateral}"
                        class="actionIcon bigActionIcon" style="float:right">
                        ${!this._hideLateral ? "fullscreen" : "fullscreen_exit"}
                    </wl-icon>
                    ${this._renderTable()}
                </div>
            </div>
        </div>
        `
    }

                    //${loading ? html`<loading-dots style="--width: 20px; margin-left:10px"></loading-dots>`: ''}
    private _renderTable () {
        return html`
            <table class="pure-table pure-table-striped">
                <thead>
                    <th style="border-right:1px solid #EEE; font-size: 14px;">
                    Model details
                    </th>
                    ${this._compare.map(c => c.uri).map((mid) => {
                        return html`
                        <th .style="width:${100/(this._compare.length)}%">
                            ${this._loading[mid] ? html`
                                ${uriToId(mid)}
                                <loading-dots style="--width: 20px; margin-left:10px"></loading-dots>
                            ` : html `${getLabel(this._setups[mid])}`}
                        </th>`;
                    })}
                </thead>
                <tbody>
                    ${this._comparisonFeatures.map((feature) => {
                        return html`
                        <tr>
                            <td style="border-right:1px solid #EEE"><b>${feature.name}</b></td>
                            ${this._compare.map(c => c.uri).map((mid) => {
                                if (this._loading[mid])
                                    return html`<td>
                                        <loading-dots style="--width: 20px; margin-left:10px"></loading-dots>
                                    </td>`;
                                else 
                                    return html`<td>${feature.fn(this._setups[mid])}</td>`
                            })}
                        </tr>
                        `;
                    })}
                </tbody>
            </table>
        `;
    }

    stateChanged(state: RootState) {
        if (state.explorerUI) {
            this._compare = state.explorerUI.compare;
            this._compare.forEach((c:ComparisonEntry) => {
                if (!this._loading[c.uri] && !this._setups[c.uri]) {
                    this._loading[c.uri] = true;
                    setupGetAll(c.uri).then((setup) => {
                        console.log('<', setup);
                        this._loading[c.uri] = false;
                        this._setups[c.uri] = setup;
                        this.requestUpdate();
                    });
                }
            });
            //TODO: Has lo mismo de siempre, crea _setup, guarda _compare[] y luego revisas en loading o setup. Ver como
            //hacer para solo cargar lo necesario.
        }
    }
}
