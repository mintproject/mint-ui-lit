import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { RegionQueryPage } from './region-query-page';
import { SharedStyles } from 'styles/shared-styles';
import { goToPage } from 'app/actions';

@customElement('region-models')
export class RegionModels extends connect(store)(RegionQueryPage)  {

    @property({type: Object})
    private _models : any = {
        'Hydrology': {
            'Pongo': [
                {'name': 'PIHM++ v4 configuration (v4) calibrated for South Sudan (Pongo Region) with aggregated outputs',
                'url': 'models/explore/PIHM/4/pihm-v4/pihm-v4-southSudan'},
                {'name': 'PIHM++ v4 configuration (v4) calibrated for South Sudan (Pongo Region) with aggregated outputs and customizable weather',
                'url': 'models/explore/PIHM/4/pihm-v4/pihm-v4-southSudan-weather'},
                /*{'name': 'Basic configuration of the economic model calibrated for South Sudan (v5) exposing no parameters',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/5/economic-v5/economic-v5_simple_pongo'},
                {'name': 'Advanced configuration of the economic model calibrated for South Sudan (v5) exposing 3 parameters',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/5/economic-v5/economic-v5_advanced_pongo'},
                {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6) exposing no parameters',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6/economic-v6/economic-v6_simple_pongo'},
                {'name': 'Advanced configuration of the economic model calibrated for South Sudan (v6) and exposing 15 parameters-3 per crop',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6/economic-v6/economic-v6_advanced_pongo'},
                {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6.1) exposing parameters to adjust maize',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1_single_crop/economic-v6.1_single_crop_pongo'},
                {'name': 'Advanced configuration of the economic model calibrated for the Pongo region of South Sudan (v6.1) and exposing 15 parameters-3 per crop',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1/economic-v6.1_advanced_pongo'},
                {'name': 'Basic configuration of the economic model calibrated for South Sudan (v6.1) exposing parameters to adjust maize',
                'url': 'models/explore/ECONOMIC_AGGREGATE_CROP_SUPPLY/6.1/economic-v6.1_single_crop/economic-v6.1_single_crop_pongo'}*/
            ]
        },
        'Agriculture': {
            '1060854480': [
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region-no file selection',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-simple-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates. Weather file can be chosen',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather'}
            ],
            '1060864590': [
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region-no file selection',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-simple-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates. Weather file can be chosen',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather'}
            ],
            '1060872120': [
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region-no file selection',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-simple-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates. Weather file can be chosen',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather'}
            ],
            '1060872280': [
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region-no file selection',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-simple-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo'},
                {'name': 'Cycles calibrated model (v0.9.4) for the Pongo region with planting dates. Weather file can be chosen',
                'url': 'models/explore/CYCLES/0.9.4-alpha/cycles-0.9.4-alpha/cycles-0.9.4-alpha-advanced-pongo-weather'}
            ]
        }
    }
    
    static get styles() {
        return [
            SharedStyles,
            css `
            `
        ];
    }

    protected render() {
        let models = this._models[this.regionType];
        return html`
            ${this._selectedRegion ? 
                html`
                    <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
                    ${!models[this._selectedRegion.name] || models[this._selectedRegion.name].length == 0 ? 'No models for this region' :
                    html`<ul>${models[this._selectedRegion.name].map((model) => html`
                        <li><a @click="${() => goToPage(model.url)}">${model.name}</a></li>`)
                    }</ul>`
                    }
                `
                : ""
            }
        `;
    }

    stateChanged(state: RootState) {
        let curregion = this._selectedRegion;
        super.setSelectedRegion(state);
        if(this._selectedRegion) {
            if(curregion != this._selectedRegion) {
                // New region. Requery
                // TODO: Query Model Catalog here
            }
        }
    }
}