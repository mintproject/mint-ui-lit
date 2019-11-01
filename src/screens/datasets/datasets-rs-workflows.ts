
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';
import { RootState } from 'app/store';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/image-gallery'

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
            wl-title > wl-icon {
                --icon-size: 18px;
                padding-left: 4px;
            }

            .img-hover-zoom {
                position: relative;
                margin: 0 auto;
                overflow: hidden; /* Removing this will break the effects */
                width: 90%;
                height: 250px;
            }
            .img-hover-zoom img {
                transition: transform 1s, filter 1s ease-in-out;
                transform-origin: center center;
                filter: brightness(100%);
            }
            .img-hover-zoom:hover img {
                filter: brightness(65%);
                transform: scale(1.05);
            }

            .img-hover-zoom a {
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                line-height: 250px;
                text-align: center;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 0 1px black;
                visibility: hidden;
                opacity: 0;
                font-size: 40px;

                /* transition effect. not necessary */
                transition: opacity .5s, visibility .5s;
            }
            .img-hover-zoom:hover a {
                background-color: transparent;
                visibility: visible;
                opacity: 1;
            }

            .img-hover-zoom a > wl-icon {
                --icon-size: 30px;
                margin-left: 10px;
            }

            image-gallery {
                --width: 300px;
                --height: 160px;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        let items = [
            {label: "Virtual Gauge 1", src: "/videos/VirtualGage1.mp4", thumbnail: "images/thumbnails/virtual-gauge-1.png"},
            {label: "Virtual Gauge 2", src: "/videos/VirtualGage2.mp4", thumbnail: "images/thumbnails/virtual-gauge-2.png"},
            {label: "Virtual Gauge 3", src: "/videos/VirtualGage3.mp4", thumbnail: "images/thumbnails/virtual-gauge-3.png"}
        ]
        return html`
        <div class="content">
            <p>
            This page is in progress, it will allow you to run tools that create datasets from raw remote sensing data, that can be then used 
            in hydrological or other models.
            ${(this._regionid === 'ethiopia') ? html`
            Below are some example results of a tool that simulates river guage data by processing remote sensing data for Ethiopia.
            </p>
            <a target="_blank" href="http://umnlcc.cs.umn.edu/carto-test/"><wl-title level="4">
                Ethiopia River Width Visualization
            <wl-icon>open_in_new</wl-icon></wl-title></a>
            <p>
                Each dot represents a location on the river. 
                Size and color of the point changes based on the river depth as the slider is changed.
            </p>
            <div class="img-hover-zoom">
                <img src="/images/thumbnails/ethiopia-river-width-visualization.png"></img>
                <a target="_blank" href="http://umnlcc.cs.umn.edu/carto-test/">Open visualization <wl-icon>open_in_new</wl-icon></a>
            </div>
            
            <wl-divider style="margin: 20px 0px;"></wl-divider>

            <wl-title level="4">Virtual Gauge Videos</wl-title>
            <p>
                This represents river width/depth variation for a single cross section. The background in this animation is SRTM based elevation.
            </p>

            <div style="width: 90%; margin: 0px auto;">
                <image-gallery .items="${items}"></image-gallery>
            <div>
            ` : ''}
        </div>`
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}
