
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import { DatasetDetail, DatasetQueryParameters, Dataset, DatasetsWithStatus, DatasetWithStatus } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import "weightless/card";
import "weightless/title";

import "./datasets-search";
import "./dataset-detail";

@customElement('datasets-browse')
export class DatasetsBrowse extends connect(store)(PageViewElement) {
    @property({type: String})
    private _dsid!: string;

    static get styles() {
        return [
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
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <!--
        <iframe src="https://data-catalog.mint.isi.edu"></iframe>
        -->
        <div class="content">
            <datasets-search class="page" ?active="${!this._dsid}"></datasets-search>
            <dataset-detail class="page" ?active="${this._dsid}"></dataset-detail>
        </div>
        `
    }

    stateChanged(state: RootState) {
        // If there are details about a particular dataset
        if(state.dataExplorerUI) {
            this._dsid = state.dataExplorerUI.selected_datasetid;
        }
    }
}
