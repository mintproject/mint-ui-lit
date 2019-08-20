
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import { DatasetDetail } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('datasets-browse')
export class DatasetsBrowse extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _dataset!: DatasetDetail | null;

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            #iframe-container {
                padding: 15px;
            }

            #sheet {
                width: 100%;
                height: calc(100vh - 250px);
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
        ${this._dataset && this._dataset.name ? 
            html`
            <h2>${this._dataset.name}</h2>
            Details about the dataset here
            `
            : html ``
        }
        <div class="content">
            <p> This page is in progress, it will give you access to the Data Catalog,
                where you can browse and search for datasets.</p>
            <p> The World Modelers Ethiopia Data Survey contains more than 120 data sources for modeling,
                it can be accessed here:
                <div id="iframe-container">
                    <iframe id="sheet" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRYHXh4tMlnnwPauNvoeTPV0jdyTqamVc34B_-m24r-pqchtoh1joYVTr_g7RST-9sGSUGv-0IVyZGR/pubhtml?widget=true&amp;headers=false"></iframe>
                </div>
            </p>
        </div>
        `
    }

    firstUpdated() {
        //store.dispatch(listAllDatasets());
    }    

    stateChanged(state: RootState) {
        if(state.datasets && state.datasets.dataset) {
            this._dataset = state.datasets.dataset;
            state.datasets.dataset = null;
        }
        else {
            this._dataset = null;
        }
    }
}
