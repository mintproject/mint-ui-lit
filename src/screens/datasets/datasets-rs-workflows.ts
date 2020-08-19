
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
            <a target="_blank" href="http://umnlcc.cs.umn.edu/river-width-demo-v2/"><wl-title level="4">
                Ethiopia River Width Visualization
            <wl-icon>open_in_new</wl-icon></wl-title></a>
            <p>
                Each point on the map represents a river segment.
                Click on the point to visualize the surface area changes of the river segment.
            </p>
            <div class="img-hover-zoom">
                <img src="/images/thumbnails/ethiopia-river-width-visualization.png"></img>
                <a target="_blank" href="http://umnlcc.cs.umn.edu/river-width-demo-v2/">Open visualization <wl-icon>open_in_new</wl-icon></a>
            </div>
            
            <wl-divider style="margin: 20px 0px;"></wl-divider>

            <wl-title level="4">
                Virtual Gauges Videos
            </wl-title>
            <video class="hidden" loop controls style="width: 100%">
                <source src="/videos/data-1050819440-658.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <p>
                The left panel shows the raw multi-spectral imagery from Sentinel-2, the middle panel shows the land/water mask created by our ML approach, and the right panel shows the land/water mask created using an existing algorithm (for comparison) that uses traditional remote sensing indices to classify land/water, and the bottom panel shows the surface area timeseries.
            </p>

            <p>
                These area timeseries can be used to build relationships between ground observations of streamflow to complement ground observations for periods when they are not available. For example, the video below shows the comparison of surface area of a river segment (blue curve) with streamflow measurements from a nearby gage station (red curve). The high agreement suggests that this segment can be potentially used for model calibration.
            </p>

            <div style="display: flex; width:100%;">
                <img src="/images/thumbnails/GageLocation.png" style="width:50%;"></img>
                <video class="hidden" loop controls style="width:50%;">
                    <source src="/videos/data-1050883510-17704.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>

            <div style="clear:both"></div>
            <wl-divider style="margin: 20px 0px;"></wl-divider>

            <wl-title level="4">
                Methodology for Generating Surface Area Variations for Model Calibration in Ungauged Hydrological Basins using Satellite Imagery and Machine Learning:
            </wl-title>
            <ul>
                <li>Training dataset
                    <ul>
                        <li>
                            ~4,000 label image patches taken from different parts of the world.
                        </li>
                        <li>
                            ~90,000 unlabeled (and cloud free) images from Ethiopia.
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
                                        <li>Uses 90,000 unlabeled image patches to learn features that could 
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
                    </ol>
                </li>
                <li>
                    The quality of the ML approach to generate surface area variations is being evaluated, and will be
                    presented in a peer reviewed publication.
                </li>
                <li>
                    Data Specifications and Availability
                    <ul>
                        <li>
                            The spatial resolution of the land/water masks is 10m.
                            The temporal resolution is ~10 days (however, very cloudy images are not considered which impacts the temporal frequency of the land/water masks). 
                        </li>
                        <li>
                            The surface area variations of river segments in Ethiopia (from Jan-2016 till May-2020) are available 
                            <a targe="_blank" href="https://data-catalog.mint.isi.edu/datasets/da6b6d47-7672-4e6e-a455-7bbc7e7ceb99">
                                here in the MINT data catalog
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>

            <wl-title level="4">
                Extraction of River Depth using Surface Area Variations and Digital Elevation Data
            </wl-title>
            <p>
                If high quality bathymetric information is available for some river segments, it can be combined with surface area variations to derive changes in river depth over time. For example, videos below demonstrate the concept by combining area/width variations with SRTM elevation data at 30m resolution.
            </p>
            <div style="width: 90%; margin: 0px auto;">
                <image-gallery .items="${items}"></image-gallery>
            </div>


            ` : ''}
        </div>`
    }

    stateChanged(state: RootState) {
        super.setRegionId(state);
    }
}
