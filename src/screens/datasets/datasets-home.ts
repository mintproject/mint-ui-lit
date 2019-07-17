
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import datasets, { DatasetDetail, Dataset } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { listAllDatasets } from './actions';


store.addReducers({
    datasets
});

@customElement('datasets-home')
export class DatasetsHome extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _dataset!: DatasetDetail | null;
    
    @property({type: Array})
    private _datasets: Dataset[] = []

    static get styles() {
        return [
            css `
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`
            <wl-title level="3">Gather Data</wl-title>
            <p>
                This section allows you to:
                <ul>
                    <li>Browse datasets in the system</li>
                    <li>Incorporate datasets from other sources</li>
                    <li>Use automated methods to improve the quality of existing datasets</li>
                    <li>Use automated methods to generate new datasets (eg from remote sensing data)</li>
                </ul>
            </p>
            ${this._dataset && this._dataset.name ? 
                html`
                <h2>${this._dataset.name}</h2>
                Details about the dataset here
                `
                : html ``
            }
            <wl-title level="4">Browse Datasets</wl-title>
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
            this._dataset = state.datasets.dataset;
            this._datasets = state.datasets.datasets["*"]["*"];
        }
    }
}
