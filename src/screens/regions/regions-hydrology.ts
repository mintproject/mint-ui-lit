
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/image-gallery'

@customElement('regions-hydrology')
export class RegionsHydrology extends connect(store)(PageViewElement) {

    static get styles() {
        return [
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
            `,
            SharedStyles
        ];
    }

    protected render() {
        let items = [
            {   label: "South Sudan River Basins (PIHM)",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/2017.png",
                desc: "The three river basins that were our focus in 2018."},
            {   label: "South Sudan River Basins - POI",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/POI.png",
                desc: "The three river basins that were our focus in 2018 (overlayed with points of interest)."},
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
        return html`
        <div class="content">
            <p>
                This page is in progress, it will allow you to run tools to identify hydrological regions of interest. 
                Below are some example hydrological regions identified for South Sudan:
            </p>
            <div style="width: 90%; margin: 0px auto;">
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>
            </div>
        </div>
        `
    }
}
