import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import { DatasetDetail, DatasetQueryParameters, Dataset, DatasetsWithStatus } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { queryGeneralDatasets } from './actions';
import { toTimeStamp } from 'util/date-utils';

import "weightless/card";
import "weightless/title";
import { ComparisonFeature } from 'screens/modeling/reducers';

@customElement('datasets-search')
export class DatasetsSearch extends connect(store)(PageViewElement) {
    @property({type: Array})
    private _datasets: DatasetsWithStatus;

    @property({type: Object})
    private _params : DatasetQueryParameters;

    @property({type: String})
    private _searchType : string = 'dataset_names';

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
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
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
            ${this._datasets ? 
                (this._datasets.loading ? html`<wl-progress-spinner class="loading"></wl-progress-spinner>` :
                html`
                    <br />
                    <wl-title level="3">Found ${this._datasets.datasets.length} datasets</wl-title>
                    ${this._datasets.datasets.map((ds) => {
                        return html`
                        <wl-card>
                            <div style="display:flex; justify-content:space-between">
                                <wl-title level="4">${ds.name}</wl-title>
                                <a href="${this._region.id}/datasets/browse/${ds.id}">More Details</a>
                            </div>
                            <wl-title level="5" style="color:#aaa">id:${ds.id}</wl-title>
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
                    })}
                `
                ) : ""
            }
        </div>
        `
    }

    _createQueryParameters() {
        let dsname = (this.shadowRoot.querySelector("#ds_name") as HTMLInputElement).value;
        let dsvars = (this.shadowRoot.querySelector("#ds_variables") as HTMLInputElement).value;
        let dsstart = (this.shadowRoot.querySelector("#ds_start_date") as HTMLInputElement).value;
        let dsend = (this.shadowRoot.querySelector("#ds_end_date") as HTMLInputElement).value;

        let queryParams = {} as DatasetQueryParameters;
        if(dsname)
            queryParams.name = dsname;
        if(dsvars)
            queryParams.variables = dsvars.split(/\s*,\s*/);
        if(dsstart || dsend) {
            queryParams.dateRange = {
                start_date: dsstart ? toTimeStamp(dsstart) : null,
                end_date: dsend ? toTimeStamp(dsend) : null
            }
        }
        //queryParams.spatialCoverage = this._region.bounding_box;
        return queryParams;
    }

    _findDatasets() {
        let queryParams = this._createQueryParameters();
        store.dispatch(queryGeneralDatasets(queryParams));
    }

    _onSearchInput () {
        let inputElement : HTMLElement | null = this.shadowRoot!.getElementById('search-input');
        if (!inputElement) return;

        let input : string = inputElement['value'].toLowerCase();
        let params : DatasetQueryParameters = {};
        switch (this._searchType) {
            case 'dataset_names':
                params.name = "*" + input + "*";
                break;
            case 'standard_variable_names':
                params.variables = [ "*" + input + "*" ]
                break;
            default:
                console.log('Invalid search type')
        }
        this._params = params;
        this._params.spatialCoverage = this._region.bounding_box;
        store.dispatch(queryGeneralDatasets(this._params))
    }

    _clearSearchInput () {
        this._params = {};
        this._datasets = null;
    }

    _onSearchTypeChange () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('search-type-selector');
        if (!selectElement) return;
        this._searchType = selectElement['value'].toLowerCase();
        this._clearSearchInput();
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        if(state.datasets) {
            // If there are details about a particular dataset
            if(state.datasets.query_datasets) {
                this._datasets = state.datasets.query_datasets;
            }
        }
    }
}    