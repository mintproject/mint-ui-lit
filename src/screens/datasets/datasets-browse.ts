
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
            .explanation {
                color: rgb(102, 102, 102);
                font-size: 13px;
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
            <wl-text class="explanation">
            The MINT dataset browser allows you to learn about the different datasets available in MINT.  A single dataset can consist of many files (each file is called a resource).
            <br/>
In the search bar below you can search datasets in two ways, which you can choose on the right.  One is to search their descriptions using a data source name (eg, GLDAS), keyword (eg crops), and regions (e.g. Pongo, Ethiopia). Another is to search their variables (e.g., precipitation).

            <br/>
You can then view more detailed information about a dataset by clicking on its name. You can also download any of the files (resources) in the dataset by clicking on the download link.
            </wl-text>
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
