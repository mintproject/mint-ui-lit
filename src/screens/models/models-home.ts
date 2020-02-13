
import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import models from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import { fetchVersionsAndConfigs, fetchModels } from '../../util/model-catalog-actions';

import './model-explore/model-explore';
import './models-register';
import './models-calibrate';
import './models-configure';
import '../../components/nav-title'

store.addReducers({
    models
});

import modelCatalog from 'model-catalog/reducers'
import { modelsGet, versionsGet, modelConfigurationsGet, modelConfigurationSetupsGet, processesGet } from '../../model-catalog/actions';

store.addReducers({
    modelCatalog
});

@customElement('models-home')
export class ModelsHome extends connect(store)(PageViewElement) {
    @property({type: String})
    private _selectedModelId : string = '';

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

                model-explorer {
                    height: calc(100% - 40px);
                }
            `,
            SharedStyles
        ];
    }

    protected render() {
        let nav = [{label:'Prepare Models', url:'models'}] 
        switch (this._subpage) {
            case 'explore':
                nav.push({label: 'Model Catalog', url: 'models/explore'});
                if (this._selectedModelId) {
                    nav.push({label: this._selectedModelId, url: 'models/explore/'+this._selectedModelId });
                }
                break;
            case 'register':
                nav.push({label: 'Add Models', url: 'models/register'});
                break;
            case 'configure':
                nav.push({label: 'Configure Models', url: 'models/configure'});
                break;
            case 'calibrate':
                nav.push({label: 'Calibrate Models', url: 'models/calibrate'});
                break;
            default:
                break;
        }

        return html`
            <nav-title .nav="${nav}" max="2"></nav-title>

            <div class="${this._subpage != 'home' ? 'hiddensection' : 'icongrid'}">
                <a href="${this._regionid}/models/explore">
                    <wl-icon>search</wl-icon>
                    <div>Browse Models</div>
                </a>
                <a href="${this._regionid}/models/register">
                <!--a disabled-->
                    <wl-icon>library_add</wl-icon>
                    <div>Add Models</div>
                </a>
                <a href="${this._regionid}/models/configure">
                    <wl-icon>perm_data_settings</wl-icon>
                    <div>Configure Models</div>
                </a>
                <!--a href="{this._regionid}/models/calibrate"-->
                <a disabled>
                    <wl-icon>settings_input_composite</wl-icon>
                    <div>Calibrate Models</div>
                </a>
            </div>

            <model-explorer class="page" ?active="${this._subpage == 'explore'}"></model-explorer>
            <models-register class="page" ?active="${this._subpage == 'register'}"></models-register>
            <models-configure class="page" ?active="${this._subpage == 'configure'}"></models-configure>
            <models-calibrate class="page" ?active="${this._subpage == 'calibrate'}"></models-calibrate>
        `
    }

    firstUpdated() {
        store.dispatch(fetchModels());
        store.dispatch(fetchVersionsAndConfigs());

        store.dispatch(modelsGet());
        store.dispatch(versionsGet());
        store.dispatch(modelConfigurationsGet());
        store.dispatch(modelConfigurationSetupsGet());
        store.dispatch(processesGet());
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
        super.setRegionId(state);
        if (state && state.explorerUI) {
            this._selectedModelId = state.explorerUI.selectedModel.split('/').pop();
        }
    }
}
