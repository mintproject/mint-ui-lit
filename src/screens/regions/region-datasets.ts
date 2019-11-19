import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { RegionQueryPage } from './region-query-page';
import { DatasetsWithStatus } from 'screens/datasets/reducers';
import { queryDatasetsByRegion } from 'screens/datasets/actions';
import { SharedStyles } from 'styles/shared-styles';
import { UserPreferences } from 'app/reducers';

@customElement('region-datasets')
export class RegionDatasets extends connect(store)(RegionQueryPage)  {
    @property({type: Object})
    private _datasets : DatasetsWithStatus;
    
    @property({type: Object})
    private prefs : UserPreferences;
    
    static get styles() {
        return [
            SharedStyles,
            css `
            `
        ];
    }

    protected render() {
        let data_link_suffix = "";
        if(this._selectedRegion) {
            data_link_suffix = "/" + this._selectedRegion.id;
        }
        return html`
            ${this._selectedRegion ? 
                html`
                <wl-title level="4" style="font-size: 17px;">Datasets for ${this._selectedRegion.name}</wl-title>
                ${(!this._datasets || this._datasets.loading) ? 
                    html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` :
                    (!this._datasets.datasets || this._datasets.datasets.length === 0) ? 'No datasets for this region' : 
                        html`<ul>${this._datasets.datasets.map((ds) => {
                            return html`
                                <li>
                                    <a href="${this._regionid}/datasets/browse/${ds.id}${data_link_suffix}"
                                    >${ds.name} (${ds.resources.length} files)</a>
                                </li>
                            `
                        })}</ul>`
                }
                `
                : ""
            }
        `;
    }

    stateChanged(state: RootState) {
        let curregion = this._selectedRegion;
        super.setSelectedRegion(state);
        
        this.prefs = state.app.prefs;

        if(this._selectedRegion) {
            if(curregion != this._selectedRegion) {
                // New region. Requery
                store.dispatch(queryDatasetsByRegion(this._selectedRegion, this.prefs.mint));
            }

            if(state.datasets && state.datasets.region_datasets) {
                this._datasets = state.datasets.region_datasets;
            }
        }
    }
}