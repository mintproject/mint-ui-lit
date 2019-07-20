
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import { DatasetDetail } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from '../../app/actions';

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
        <div class="cltrow">
            <wl-button flat inverted @click="${()=> goToPage('datasets')}">
                <wl-icon>arrow_back_ios</wl-icon>
            </wl-button>
            <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                <wl-title level="4" style="margin: 0px">Browse Datasets</wl-title>
            </div>
        </div>   

        <p>
        This page is in progress, it will give you access to the Data Catalog, where you can browse and search for
        datasets
        </p>
        `
    }

    firstUpdated() {
        //store.dispatch(listAllDatasets());
    }    

    stateChanged(state: RootState) {
        if(state.datasets && state.datasets.dataset) {
            this._dataset = state.datasets.dataset;
        }
    }
}
