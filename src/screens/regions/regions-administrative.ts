
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';

import { store } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import './regions-editor';

@customElement('regions-administrative')
export class RegionsAdministrative extends PageViewElement {

    static get styles() {
        return [
            SharedStyles,
            css ``
        ];
    }

    protected render() {
        return html`
        <regions-editor active
            regionType="Administrative" 
            parentRegionId="${this._regionid}"
        ></regions-editor>
        `;
    }
}
