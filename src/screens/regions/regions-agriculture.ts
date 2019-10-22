
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import '../../components/image-gallery'

@customElement('regions-agriculture')
export class RegionsAgriculture extends connect(store)(PageViewElement) {

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
        let items = [{
            label: "Land use map of the Pongo Basin in South Sudan",
            src: "https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMtoAgri/map_Landuse.png"}]
        return html`
        <div class="content">
            <p>
                The following are agricultural areas of interest in this region.
            </p>
            <div style="width: 90%; margin: 0px auto;">
                <image-gallery style="--width: 300px; --height: 160px;" .items="${items}"></image-gallery>
            </div>
        </div>
        `
    }
}
