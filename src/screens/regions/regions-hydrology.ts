
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

@customElement('regions-hydrology')
export class RegionsHydrology extends connect(store)(PageViewElement) {

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="cltrow">
            <wl-button flat inverted @click="${()=> goToPage('regions')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">Hydrology Regions</wl-title>
            </div>
        </div>   

        <p>
        This page is in progress, it will allow you to run workflows to identify hydrological regions of interest. 
        Below are some example hydrological regions identified for South Sudan:
        <ul>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/2017.png"
            >South Sudan River Basins (PIHM)</a>. The three river basins that we worked on earlier.</li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMRiverBasin/POI.png"
            >South Sudan River Basins - POI</a>. The three river basins that we worked on earlier (overlayed with points of interest).</li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png"
            >Ethiopia relief boundary</a>. 
            <a href="http://mint.isi.edu/dev/data/Ethiopia_relief_subbasins_big.png">Ethiopia relief subbasins (BIG FILE !)</a>
        </li>
        <li><a href="http://mint.isi.edu/dev/data/Blue_Nile_Tribs_relief_and_boundaries_big.png"
            >Blue Nile Tributaries relief and boundaries (BIG FILE !)</a></li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png"
            >Guder relief rivers boundary</a></li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png"
            >Jamma relief river boundary</a></li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png"
            >Muger relief rivers boundary</a></li>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png"
            >Dashilo relief river boundary</a></li>
        </ul>            
        </p>
        `
    }
}
