
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/image-gallery'

@customElement('datasets-quality-workflows')
export class DatasetsQualityWorkflows extends connect(store)(PageViewElement) {

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
            /*{ FIXME: these url does not work now.
                label: "Ethiopia relief subbasins (94MB)",
                src: "http://mint.isi.edu/dev/data/Ethiopia_relief_subbasins_big.png"
            },
            {
                label: "Blue Nile Tributaries relief and boundaries (76MB)",
                src: "http://mint.isi.edu/dev/data/Blue_Nile_Tribs_relief_and_boundaries_big.png"
            },*/
            {
                label: "Ethiopia relief boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Ethiopia_relief_boundary.png"
            },
            { 
                label: "Guder relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Guder_relief_rivers_boundary.png"
            },
            { 
                label: "Jamma relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Jamma_relief_river_boundary.png"
            },
            { 
                label: "Muger relief rivers boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Muger_relief_rivers_boundary.png"
            },
            {
                label: "Dashilo relief river boundary",
                src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/ImproveQuality/Dashilo_relief_river_boundary.png"
            },
        ]
        return html`
        <div class="content">
            <p>
            This page is in progress, it will allow you to run tools that improve the quality of datasets. 
            Below is an example of the results of a tool that improves the quality of elevation models for a small area of Ethiopia
            </p>
            <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>
        </div>

        `
    }
}
