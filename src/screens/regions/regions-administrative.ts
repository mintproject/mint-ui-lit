
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';

import './regions-editor';

@customElement('regions-administrative')
export class RegionsAdministrative extends PageViewElement {

    static get styles() {
        return [
            SharedStyles,
            css `
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
            `
        ];
    }

    protected render() {
        return html`
        <div class="content">
            <regions-editor active
                style="--map-height: 320px;"
                regionType="administrative"
            ></regions-editor>
        </div>
        `;
    }
}
