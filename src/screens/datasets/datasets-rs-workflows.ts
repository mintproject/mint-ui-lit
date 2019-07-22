
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

@customElement('datasets-rs-workflows')
export class DatasetsRemoteSensingWorkflows extends connect(store)(PageViewElement) {

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
            <wl-button flat inverted @click="${()=> goToPage('datasets')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">Remote sensing</wl-title>
            </div>
        </div>   

        <p>
        This page is in progress, it will allow you to run tools that create datasets from raw remote sensing data, that can be then used 
        in hydrological or other models.
        Below are some example results of a tool that simulates river guage data by processing remote sensing data for Ethiopia.
        </p>
        <ul>
            <li><a href="http://umnlcc.cs.umn.edu/carto-test/">Ethiopia river width visualisation</a>. Each dot represents a location on the river. 
                Size and color of the point changes based on the river depth as the slider is changed.</li>
            <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/RemoteSensing/RiverEthiopia.mp4">Cross section video</a
                >. This represents river width/depth variation for a single cross section. The background in this animation is SRTM based elevation.</a>
            </li>
        </ul>
        `
    }
}
