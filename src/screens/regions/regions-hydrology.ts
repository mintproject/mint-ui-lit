
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'weightless/divider';
import './regions-editor';
import '../../components/image-gallery'

@customElement('regions-hydrology')
export class RegionsHydrology extends connect(store)(PageViewElement)  {

    static get styles() {
        return [
            SharedStyles,
            css `
            .cltrow wl-button {
                padding: 2px;
            }
            @media (min-width: 1025px) { 
                .content {
                    width: 75%;
                }
            }
            @media (max-width: 1024) { 
                .content {
                    width: 100%;
                }
            }
            .content {
                margin: 0 auto;
            }
            `
        ];
    }

    protected render() {
        let items : Array<any>;
        if (this._regionid === 'south_sudan') {
            items = [
            {   label: "South Sudan River Basins (PIHM)",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/2017.png",
                desc: "The three river basins that were our focus in 2018."},
            {   label: "South Sudan River Basins - POI",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/POI.png",
                desc: "The three river basins that were our focus in 2018 (overlayed with points of interest)."}
            ]
        } else {
            items = [];
        }

        return html`
        <div class="content">
            <regions-editor active
                style="--map-height: 320px;"
                regionType="hydrology"
            ></regions-editor>

            <br/>

            ${items.length > 0 ? html`
            <wl-divider style="margin: 20px 0px;"></wl-divider>
            <p>
                The following are areas of interest for hydrology modeling in this region
            </p>
            <div style="width: 90%; margin: 0px auto;">
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>
            </div>
            ` : ''}
        </div>
        `;
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}
