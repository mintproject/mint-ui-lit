
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element.js';

import { SharedStyles } from '../../styles/shared-styles.js';
import { store, RootState } from '../../app/store.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { GOOGLE_API_KEY } from '../../config/google-api-key.js';
import regions, { RegionList } from './reducers.js';
import { listRegions } from './actions.js';

store.addReducers({
    regions
});

@customElement('regions-home')
export class RegionsHome extends connect(store)(PageViewElement) {

    @property({type: Object})
    private _regions!: RegionList;
  
    @property({type:Array})
    private _mapStyles = '[{"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"stylers":[{"hue":"#00aaff"},{"saturation":-100},{"gamma":2.15},{"lightness":12}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"visibility":"on"},{"lightness":24}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":57}]}]';
    
    static get styles() {
        return [
            SharedStyles,
            css`
            .middle2main {
                width: 100%;
                height: calc(100% - 60px);
            }
            `
        ];
    }

    protected render() {
        return html`
            <wl-title level="3">Define Regions</wl-title>
            <p>
                This section allows you to:
                <ul>
                    <li>Specify regions of interest</li>
                    <li>Run automated tools that identify suitable regions for modeling</li>
                </ul>
            </p>

            <google-map class="middle2main" api-key="${GOOGLE_API_KEY}" 
                latitude="5" longitude="40" zoom="4" disable-default-ui
                styles="${this._mapStyles}">
                ${Object.keys(this._regions || {}).map((regionid) => {
                let region = this._regions![regionid];
                return html`
                <google-map-json-layer url="${region.geojson}"></google-map-json-layer>
                `;
                })}
            </google-map>
        `
    }

    protected firstUpdated() {
        store.dispatch(listRegions());
    }

    // This is called every time something is updated in the store.
    stateChanged(state: RootState) {
        if(state.regions && state.regions.regions) {
            this._regions = state.regions.regions;
        }
    }
}
