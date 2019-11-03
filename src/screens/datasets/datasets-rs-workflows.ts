
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

            ul {
                margin-top: 5px;
                margin-bottom: 5px;
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
            </p>
            ${(this._regionid === 'ethiopia') ? html`
            <p>
            Below are some example results for Ethiopia, using a tool that generates river width and depth for model calibration in ungauged hydrological basins using satellite imagery and machine learning.  These “virtual gauges” are generated with a method that uses Sentinel-2 satellite imagery and deep learning.  A detailed description of the method is shown at the bottom of this page.
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
            </div>

            <div style="clear:both"></div>
            <wl-divider style="margin: 20px 0px;"></wl-divider>

            <wl-title level="4">Method for Generating River Width and Depth for Model Calibration in 
            Ungauged Hydrological Basins using Satellite Imagery and Machine Learning:</wl-title>
            <ul>
                <li>Global dataset from Sentinel-2 satellite imagery at 10m resolution from 2016
                    <ul>
                        <li>8434 predefined boxes around the globe
                            <ul><li>1805 in Ethiopia</li></ul>
                        </li>
                        <li>351888 Sentinel-2 image patches
                            <ul><li>~60k cloud free</li></ul>
                        </li>
                        <li>2976 labeled image patches taken from different parts of the world
                            <ul><li>created using visual inspection</li></ul>
                        </li>
                    </ul>
                </li>
                <li>Key steps:
                    <ol>
                        <li>Satellite data download and preprocessing
                            <ul><li>Predefined boxes across the globe to avoid asking for regions of interest from the user</li></ul>
                        </li>
                        <li>Classification of satellite imagery to land/water masks
                            <ul>
                                <li>Autoencoder based unsupervised feature learning using large unlabeled data
                                    <ul>
                                        <li>Uses 9,000 unlabeled image patches to learn features that could 
                                        reconstruct a wide variety of image patches</li>
                                        <li>Clustering of 2-D compression of auto-encoder features show 
                                        effectiveness in grouping similar image patches</li>
                                        <li>Land/Water mask creation using semantic segmentation
                                            <ul>
                                                <li>Uses features learned from previous steps to create masks</li>
                                                <li>Effective use of the structure/shape in image patches. </li>
                                                <li>Does not suffer from salt and pepper noise and shows better 
                                                performance even in the presence of haze and other atmospheric 
                                                disturbances</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li>Semantic segmentation-based classification to incorporate structural/shape constraints</li>
                            </ul>
                        </li>
                        <li>Identification of cross sections along the river segment by automatically identifying the 
                        center line and cross sections at regular intervals on the center line 
                            <ul>
                                <li>Create multi-temporal maps to create a fraction map
                                    <ul><li>Used to identify the core region of the river segment</li></ul>
                                </li>
                                <li>Extract the center line using morphological operations on the core region</li>
                                <li>Perpendicular cross-sections are calculated automatically at regular intervals 
                                along the center line</li>
                                <li>Cross sections along with elevation data are used to create river 
                                depth hydrographs (next slide)</li>
                            </ul>
                        </li>
                        <li>Estimating river width/depth hydrograph along the cross-section, merging with 
                            <ul>
                                <li>SRTM 30m elevation data to convert river width hydrograph to river depth hydrograph
                                    <ul><li>Elevation profile along the cross section is smoothed and approximated to a 
                                    triangular river bed.</li></ul>
                                </li>
                                <li>Constrained by surface extent to exclude irrelevant minimas in the elevation profile</li>
                                <li>For a given cross section, river width at any date can be calculated using the 
                                land/water mask on that date</li>
                                <li>Width variations are then converted to depth variations using the triangular river bed</li>
                            </ul>
                        </li>
                    </ol>
                </li>
                <li>Geospatial visualizations show river width, depth shown at select locations</li>
                <li>Quality of the results is still being evaluated:
                    <ul>
                        <li>The spatial resolution of the width is 10 meters</li>
                        <li>The quality of the depth is limited by the resolution (in meters) and 
                        quality (not very good on a global scale) of the Digital Elevation Model (DEM)</li>
                    </ul>
                </li>
            </ul>

            ` : ''}
        </div>`
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}
