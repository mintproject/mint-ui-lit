
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

            li {
                margin-bottom: 10px;
            }

            video {
                width: 90%;
                margin-bottom: 1em;
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
        return html`
        <div class="cltrow">
            <wl-button flat inverted @click="${()=> goToPage('datasets')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">Remote sensing</wl-title>
            </div>
        </div>   

        <div class="content">
            <p>
            This page is in progress, it will allow you to run tools that create datasets from raw remote sensing data, that can be then used 
            in hydrological or other models.
            Below are some example results of a tool that simulates river guage data by processing remote sensing data for Ethiopia.
            </p>
            <ul>
                <li><a href="http://umnlcc.cs.umn.edu/carto-test/">Ethiopia river width visualisation</a>. Each dot represents a location on the river. 
                    Size and color of the point changes based on the river depth as the slider is changed.</li>
                <li><b>Virtual Gauge Videos.</b>
                    This represents river width/depth variation for a single cross section. The background in this animation is SRTM based elevation.
                    <div style="text-align: center;"> 
                        <h3>Virtual Gauge 1:</h3>
                        <video autoplay loop controls>
                          <source src="/images/VirtualGage1.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <wl-divider></wl-divider>
                        <br/>
                        <h3>Virtual Gauge 2:</h3>
                        <video autoplay loop controls>
                          <source src="/images/VirtualGage2.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <wl-divider></wl-divider>
                        <br/>
                        <h3>Virtual Gauge 3:</h3>
                        <video autoplay loop controls>
                          <source src="/images/VirtualGage3.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </li>
            </ul>
        </div>`
    }
}
