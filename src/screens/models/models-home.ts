
import { html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import models from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import './model-explore/model-explore';
import './models-register';
import './models-calibrate';
import './models-configure';

store.addReducers({
    models
});

@customElement('models-home')
export class ModelsHome extends connect(store)(PageViewElement) {

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
        return html`
            <wl-title level="3">Prepare Models</wl-title>
            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="models/explore">
                    <wl-icon>search</wl-icon>
                    <div>Browse Models</div>
                </a>
                <a href="models/register">
                    <wl-icon>library_add</wl-icon>
                    <div>Add Models</div>
                </a>
                <a href="models/configure">
                    <wl-icon>perm_data_settings</wl-icon>
                    <div>Configure Models</div>
                </a>
                <a href="models/calibrate">
                    <wl-icon>settings_input_composite</wl-icon>
                    <div>Calibrate Models</div>
                </a>
            </div>

            <model-explorer class="page fullpage" ?active="${this._subpage == 'explore'}"></model-explorer>
            <models-register class="page fullpage" ?active="${this._subpage == 'register'}"></models-register>
            <models-configure class="page fullpage" ?active="${this._subpage == 'configure'}"></models-configure>
            <models-calibrate class="page fullpage" ?active="${this._subpage == 'calibrate'}"></models-calibrate>
        `
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
    }
}
