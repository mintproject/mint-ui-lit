import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { RootState, store } from 'app/store';
import { DatasetDetail, DatasetQueryParameters, DatasetsWithStatus } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { queryGeneralDatasets } from './actions';
import { toTimeStamp } from 'util/date-utils';
import { IdMap } from 'app/reducers';

import { searchDatasets, SearchQueryParameters } from 'data-catalog/actions';
import dataCatalog from 'data-catalog/reducers';
import { Dataset } from 'data-catalog/datacatalog_client';

import "weightless/card";
import "weightless/title";

import { ComparisonFeature } from 'screens/modeling/reducers';
import { UserPreferences } from 'app/reducers';

store.addReducers({
    dataCatalog
});

@customElement('datasets-search')
export class DatasetsSearch extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _datasetsPreview: IdMap<Dataset> = {};
    @property({type: Boolean})
    private _previewLoading : boolean = false;
    @property({type: Boolean})
    private _previewError : boolean = false;

    @property({type: String})
    private _searchType : string = 'dataset_names';
    @property({type: String})
    private _searchTerm : string = '';

    @property({type: Array})
    private _datasets: IdMap<Dataset> = {};
    @property({type: Boolean})
    private _searchLoading : boolean = false;
    @property({type: Boolean})
    private _searchError : boolean = false;

    @property({type: Object})
    private prefs : UserPreferences;

    private _datasetFeatures: Array<ComparisonFeature> = [
        {
            name: "Description",
            fn: (ds:Dataset) => ds.description
        },
        {
            name: "Source",
            fn: (ds:Dataset) => html`<a href="${ds.source.url}">${ds.source.name}</a>`
        },
        {
            name: "Source Type",
            fn: (ds:Dataset) => ds.source.type
        },
        {
            name: "Limitations",
            fn: (ds:Dataset) => ds.limitations
        },
        {
            name: "Version",
            fn: (ds:Dataset) => ds.version
        }
    ]

    static get styles() {
        return [
            css `
            wl-card {
                padding: 15px;
            }
            fieldset {
                border: 1px solid #ccc;
            }
            fieldset legend {
                color: #aaa;
                font-size: 12px;
            }
            .searchForm {
                display: flex;
            }
            .searchForm > wl-textfield {
                width:70%;
            }
            .searchForm > wl-select {
                width: calc(30% - 10px);
                padding-left: 10px;
            }
            .explanation {
                color: rgb(102, 102, 102);
                font-size: 13px;
            }
            .info-center {
                text-align: center;
                font-size: 13pt;
                height: 32px;
                line-height:32px;
                color: #999;
            }
            .info-center > a {
                cursor: pointer;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="explanation">
            <p>
            The MINT dataset browser allows you to learn about the different datasets available in MINT.  
            A single dataset can consist of many files (each file is called a resource).
            </p>
            <p>
            In the search bar below you can search datasets in two ways, which you can choose on the right.  
            One is to search their descriptions using a data source name (eg, GLDAS), keyword (eg crops), and regions 
            (e.g. Pongo, Ethiopia). Another is to search their variables (e.g., precipitation).
            </p>
            <p>
            You can then view more detailed information about a dataset by clicking on its name. You can also download 
            any of the files (resources) in the dataset by clicking on the download link.
            </p>
        </div>
        <div class="searchForm">
            <wl-textfield id="search-input" label="Search datasets" @change=${this._onSearchInput}>
                <div slot="before"> <wl-icon>search</wl-icon> </div>
            </wl-textfield><!--
            --><wl-select id="search-type-selector" label="Search on" @input="${this._onSearchTypeChange}" value="${this._searchType}">
            <option value="dataset_names">Dataset names</option>
            <option value="standard_variable_names">Variable names</option>
            </wl-select>
        </div>

        <div class="searchResults">
            ${!this._searchTerm ? ( this._previewError ? html`
                <div class="info-center">- An error has ocurred. <a @click="${this._reloadPreview}">Click here to retry.</a> -</div>`
                : (this._previewLoading ? html`
                <wl-progress-spinner class="loading"></wl-progress-spinner>`
                : this._renderDatasetResults(Object.values(this._datasetsPreview)))
            ) : this._searchError ? html`
                <div class="info-center">- An error has ocurred. <a @click="${this._performSearch}">Click here to retry.</a> -</div>`
                : (this._searchLoading ? html`
                <wl-progress-spinner class="loading"></wl-progress-spinner>`
                : this._renderDatasetResults(Object.values(this._datasets)))
            }
        </div>
        `
    }

    _renderDatasetResults (datasets: Dataset[]) {
        return html`
            <wl-title level="3" style="margin-top: 4px;">Found ${datasets.length} datasets</wl-title>
            ${datasets.map((ds) => {
                return html`
                <wl-card>
                    <div style="display:flex; justify-content:space-between">
                        <wl-title level="4">${ds.name}</wl-title>
                        <a href="${this._region ? this._region.id : 'none'}/datasets/browse/${ds.id}">More Details</a>
                    </div>
                    <div style="display:flex; justify-content:space-between">
                        <wl-title level="5" style="color:#aaa">ID: ${ds.id}</wl-title>
                        <span>
                            <span style="color: ${ds.is_cached ? 'green' : 'lightsalmon'}">
                                ${ds.is_cached ? 'Available on MINT servers' : 'Available for download'}
                            </span>
                            ${ds.resource_repr || ds.dataset_repr ? html` |
                            <span style="color: 'green'"> MINT Understandable Format </span>` : ''}
                        </span>
                    </div>
                    <br />
                    <table class="pure-table pure-table-striped">
                        <thead>
                            <tr>
                                <th style="width:15%">Metadata</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this._datasetFeatures.map((feature) => {
                                return html`
                                <tr>
                                    <td style="width:15%"><b>${feature.name}</b></td>
                                    <td>${feature.fn(ds)}</td>
                                </tr>
                                `;
                            })}
                        </tbody>
                    </table>
                </wl-card>
                <br />
                `;
            })}`
    }

    _onSearchInput () {
        let inputElement : HTMLElement | null = this.shadowRoot!.getElementById('search-input');
        if (!inputElement) return;
        let lastSearch : string = this._searchTerm;
        this._searchTerm = inputElement['value'].toLowerCase();
        if (!this._searchTerm || this._searchTerm === lastSearch) return;
        this._performSearch();
    }

    _performSearch () {
        this._searchError = false;
        this._searchLoading = true;
        let params : SearchQueryParameters = {};
        switch (this._searchType) {
            case 'dataset_names':
                params.name = "*" + this._searchTerm + "*";
                break;
            case 'standard_variable_names':
                params.variables = [ "*" + this._searchTerm + "*" ];
                break;
            default:
                console.log('Invalid search type');
        }
        //let value = this._searchTerm; Can use this if we want to search on input
        let searchPromise = store.dispatch(searchDatasets(params));
        searchPromise.then((datasets) => {
            this._searchLoading = false;
            this._datasets = datasets;
        });
        searchPromise.catch(() => {
            this._searchLoading = false;
            this._searchError = true;
        });
    }

    _onSearchTypeChange () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('search-type-selector');
        if (!selectElement) return;
        this._searchType = selectElement['value'].toLowerCase();
        this._datasets = {};
    }

    _reloadPreview () {
        this._previewLoading = true;
        this._previewError = false;
        let reqPrev = store.dispatch(searchDatasets({}));
        reqPrev.then((datasets) => {
            this._previewLoading = false;
            this._datasetsPreview = datasets;
        });
        reqPrev.catch((e) => {
            this._previewLoading = false;
            this._previewError = true;
        });
    }

    protected firstUpdated () {
        this._reloadPreview();
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        this.prefs = state.app.prefs!;

        /*if(state.datasets) {
            // If there are details about a particular dataset
            if(state.datasets.query_datasets) {
                this._datasets = state.datasets.query_datasets;
            }
        }*/
    }
}    
