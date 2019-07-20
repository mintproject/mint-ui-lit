import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

@customElement('models-calibrate')
export class ModelsCalibrate extends connect(store)(PageViewElement) {

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
            <wl-button flat inverted @click="${()=> goToPage('models')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">Calibrate Models</wl-title>
            </div>
        </div>   

        <p>
        This page is in progress, it will allow you to run workflows to Calibrate existing models for a particular region
        </p>
        `
    }
}
