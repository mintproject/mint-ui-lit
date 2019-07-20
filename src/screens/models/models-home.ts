
import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { RootState, store } from '../../app/store';
import models, { ModelDetail, Model } from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';
import { listAllModels } from './actions';

import "weightless/card";
import "./model-explore/model-explore";

store.addReducers({
    models
});

@customElement('models-home')
export class ModelsHome extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _model!: ModelDetail | null;

    @property({type: Object})
    private _models: Map<String, Map<String, Model[]>> = {} as Map<String, Map<String, Model[]>>;

    static get styles() {
        return [
            css `
                wl-card.card-button {
                    border: 2px solid rgba(98, 155, 48, 0.5);
                    text-align: center;
                    color: rgb(6, 67, 108);
                    font-size: 1.2em;
                    font-weight: bold;
                    padding: 10px;
                    cursor: pointer;
                }

                wl-card.card-button a {
                    color: rgb(6, 67, 108);
                    text-decoration: none;
                }

                wl-card.card-button a:hover {
                    background-color: inherit;
                }

                wl-card.card-button img {
                    padding: 15px;
                    width: 150px;
                    display:block;
                    margin:auto;
                }
            `,
            SharedStyles
        ];
    }

    protected render() {
        return html`<div>
            <model-explorer class="page fullpage" ?active="${this._subpage == 'explore'}"></model-explorer>
            ${this._subpage == 'home' ? this._renderHome() : html`` }
        </div>`
    }

    _renderHome () {
        return html`
            <wl-title level="3">Prepare Models</wl-title>
            <p>
                This section allows you to:
                <table style="width:50%;">
                    <tr>
                        <td><a href="/models/explore"><wl-card class="card-button">
                            <img src="/images/browse.png">
                            Browse models
                        </wl-card></a></td>
                        <td><wl-card class="card-button">
                            <img src="/images/add.png">
                            Add models
                        </wl-card></td>
                    </tr>
                    <tr>
                        <td><wl-card class="card-button">
                            <img src="/images/config.png">
                            Configure models
                        </wl-card></td>
                        <td><wl-card class="card-button">
                            <img src="/images/calibrate.png">
                            Calibrate models
                        </wl-card></td>
                    </tr>
                </table>
            </p>        
            ${this._model && this._model.name ? 
                html`
                <h2>${this._model.name}</h2>
                Details about the model here
                `
                : html ``
            }
            ${Object.keys(this._models).map((category) => {
                let category_models = this._models[category];
                return html`
                <wl-title level="4">${category}</wl-title>
                <table class="pure-table pure-table-bordered">
                    <thead>
                        <th>Model</th>
                        <th>Model Configuration</th>
                        <th>Model Description</th>
                        <th>Model Type</th>
                        <th>Dimensionality</th>
                        <th>Spatial Grid</th>
                    </thead>
                    <tbody>
                    ${Object.keys(category_models).map((original_model) => {
                        let models = category_models[original_model];
                        let i=0;
                        return html`
                        ${models.map((model: Model) => {
                            i++;
                            return html`
                            <tr>
                                ${i == 1 ? html`<td rowspan="${models.length}">${original_model}</td>`: html``}
                                <td>${model.name}</td>
                                <td>${model.description}</td>
                                <td>${model.model_type}</td>
                                <td>${model.dimensionality}D</td>
                                <td>${model.spatial_grid_type} : ${model.spatial_grid_resolution}</td>
                            </tr>
                            `;
                        })}
                        `;
                    })}
                    </tbody>
                </table>
                <br />
                `;
            })}
        `;
    }

    firstUpdated() {
        store.dispatch(listAllModels());
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
        if(state.models && state.models.model) {
            this._model = state.models.model;
            //console.log(this._model);
        }
        if(state.models && state.models.models && state.models.models["*"]) {
            this._model = state.models.model;
            this._models = {} as Map<String, Map<String, Model[]>>;
            state.models.models["*"].map((model : Model) => {
                if(!this._models[model.category])
                        this._models[model.category] = {};
                if(!this._models[model.category][model.original_model])
                    this._models[model.category][model.original_model] = [];
                this._models[model.category][model.original_model].push(model);
            });
        }
    }
}
