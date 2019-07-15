
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../components/page-view-element.js';

import { SharedStyles } from '../components/shared-styles.js';
import { RootState, store } from '../store.js';
import { DatasetDetail, Dataset } from '../reducers/datasets.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { listAllDatasets } from '../actions/datasets.js';

@customElement('dataset-viewer')
export class DatasetViewer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _dataset!: DatasetDetail;
    
    @property({type: Array})
    private _datasets: Dataset[] = []

    static get styles() {
        return [
            css `
            .card2 {
                margin: 0px;
                left: 0px;
                right: 0px;
                padding: 10px;
                padding-top: 5px;
                height: calc(100% - 40px);
                overflow: auto;
                background: #FFFFFF;
            }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
        <div class="card">
            ${this._dataset ? 
                html`
                <h2>${this._dataset.name}</h2>
                Details about the dataset here
                `
                : html ``
            }
            <div class="card2">
                <wl-title level="4">Datasets</wl-title>
                <table class="pure-table pure-table-bordered">  
                    <thead>
                        <th>Dataset</th>
                        <th>Dataset Description</th>
                        <th>Dataset Categories</th>
                        <th>Region</th>
                        <th>Time Period</th>
                    </thead>
                    <tbody>
                    ${this._datasets.map((ds) => {
                        return html`
                        <tr>
                            <td>${ds.name}</td>
                            <td>${ds.description}</td>
                            <td>${ds.categories!.join(", ")}</td>
                            <td>${ds.region}</td>
                            <td>${ds.time_period}</td>
                        </tr>
                        `;
                    })}
                    </tbody>
                </table>
            </div>
        </div>
        `
    }

    firstUpdated() {
        store.dispatch(listAllDatasets());
    }    

    stateChanged(state: RootState) {
        if(state.datasets && state.datasets.dataset) {
            this._dataset = state.datasets.dataset;
        }
        if(state.datasets && state.datasets.datasets && state.datasets.datasets["*"]) {
            this._datasets = state.datasets.datasets["*"]["*"];
        }
    }
}
