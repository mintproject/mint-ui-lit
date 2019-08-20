
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('regions-agriculture')
export class RegionsAgriculture extends connect(store)(PageViewElement) {

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
        <p>
        This page is in progress, it will allow you to run tools to identify agricultural regions of interest.
        Below are some example agricultural regions identified for South Sudan:
        <ul>
        <li><a href="https://raw.githubusercontent.com/mintproject/EthiopiaDemo/master/PIHMtoAgri/map_Landuse.png">Land Use Map</a
            >. Land use map of the Pongo Basin in South Sudan</li>
        </ul>        
        </p>
        `
    }
}
