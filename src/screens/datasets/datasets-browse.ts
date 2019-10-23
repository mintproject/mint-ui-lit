
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import { DatasetDetail, DatasetQueryParameters, Dataset, DatasetsWithStatus } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { queryGeneralDatasets } from './actions';
import { toTimeStamp } from 'util/date-utils';

@customElement('datasets-browse')
export class DatasetsBrowse extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _dataset!: DatasetDetail | null;

    @property({type: Boolean})
    private _initialLoad: Boolean = false;

    @property({type: Array})
    private _datasets: DatasetsWithStatus;

    static get styles() {
        return [
            css `
            .cltrow wl-button {
                padding: 2px;
            }

            iframe {
                width:100%;
                border: 0px solid black;
                height: 100%;
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
        <iframe src="https://data-catalog.mint.isi.edu/"></iframe>

        <!--
        <div style="display:flex">
            <div style="width:20%"><b>Name</b></div>
            <div style="width:20%"><b>Variables</b></div>
            <div style="width:20%"><b>Start Date</b></div>
            <div style="width:20%"><b>End Date</b></div>
            <div style="width:20%"></div>
        </div>

        <div class="input_full" style="display:flex">
            <input style="width:20%" id="ds_name"></input>
            <input style="width:20%" id="ds_variables"></input>
            <input style="width:20%" type="date" id="ds_start_date"></input>
            <input style="width:20%" type="date" id="ds_end_date"></input>
            <input type="button" 
                @click="this._findDatasets" 
                style="height:33px;width:20%;border:0px;margin-left:20px;background:#EEE" value="Search"></input>
        </div>
        -->

        ${this._datasets && this._datasets.loading ? 
            html`<wl-progress-spinner class="loading"></wl-progress-spinner>` : "" }
        ${this._datasets && !this._datasets.loading ? 
            this._datasets.datasets.map((ds) => {
                html`
                <li>${ds.name}</li>
                `
            })
            : ""
        }
        <!--
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
        -->
        
        `
    }

    firstUpdated() {
        //store.dispatch(listAllDatasets());
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
        queryParams.spatialCoverage = this._region.bounding_box;
        return queryParams;
    }

    _findDatasets() {
        let queryParams = this._createQueryParameters();
        store.dispatch(queryGeneralDatasets(queryParams));
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        if(state.datasets && state.datasets.dataset) {
            this._dataset = state.datasets.dataset;
            state.datasets.dataset = null;
        }
        else {
            this._dataset = null;
        }

        if(state.datasets && state.datasets.datasets && state.datasets.datasets["*"]) {
            this._datasets = state.datasets.datasets["*"]["*"];
        }
    }
}
