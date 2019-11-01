
import { html, customElement, css, property } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';
import { queryRegions } from './actions';
import { RegionsEditor } from './regions-editor';
import { RegionList, Region } from './reducers';

import { db } from 'config/firebase';
import { fromTimeStampToDateString } from "util/date-utils";
import { getVariableLongName } from "offline_data/variable_list";

import 'weightless/divider';
import './regions-editor';
import '../../components/image-gallery'
import { Dataset, DatasetsWithStatus } from 'screens/datasets/reducers';
import { queryDatasetsByRegion } from 'screens/datasets/actions';
import { IdMap } from 'app/reducers';

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
        } else if (this._regionid === 'ethiopia') {
            items = [
            {   label: "Ethiopia relief boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png"},
            {   label: "Ethiopia relief subbasins (94MB)",
                src: "images/thumbnails/Ethiopia_relief_subbasins_med.png",
                thumbnail: "images/thumbnails/Ethiopia_relief_subbasins_small.png",
                external: "http://mint.isi.edu/data/Ethiopia_relief_subbasins_big.png"},
            {   label: "Blue Nile Tributaries relief and boundaries (76MB)",
                src: "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_med.png",
                thumbnail: "images/thumbnails/Blue_Nile_Tribs_relief_and_boundaries_small.png",
                external: "http://mint.isi.edu/data/Blue_Nile_Tribs_relief_and_boundaries_big.png"},
            {   label: "Guder relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png"},
            {   label: "Jamma relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png"},
            {   label: "Muger relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png"},
            {   label: "Dashilo relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png"},
            ]
        } else {
            items = [];
        }

        return html`
        <div class="content">
            <regions-editor active
                style="--map-height: 450px;"
                regionType="Hydrology"
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
