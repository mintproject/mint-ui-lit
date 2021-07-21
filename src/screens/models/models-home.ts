
import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from '../../components/page-view-element';
import { IdMap } from 'app/reducers'

import { SharedStyles } from '../../styles/shared-styles';
import { store, RootState } from '../../app/store';
import models from './reducers';
import { connect } from 'pwa-helpers/connect-mixin';

import './model-explore/model-explore';
import './models-register';
import './models-calibrate';
import './models-configure';
import './models-edit';
import './models-cromo';
import '../../components/nav-title'

store.addReducers({
    models
});

import modelCatalog from 'model-catalog-api/reducers';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';
import { UserCatalog } from 'model-catalog-api/user-catalog';

store.addReducers({
    modelCatalog
});

@customElement('models-home')
export class ModelsHome extends connect(store)(PageViewElement) {
    @property({type: String})
    private _selectedModelId : string = '';
    @property({type: String})
    private _selectedConfig : string = '';
    @property({type: String})
    private _selectedSetup : string = '';

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

                .no-decoration, .no-decoration:hover {
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

                .icongrid {
                    grid-template-columns: 160px 160px 160px !important;
                    margin-left: calc(50% - 240px) !important;
                }

                model-explorer {
                    height: calc(100% - 40px);
                }

                @media (max-width: 768px) {
                    .icongrid {
                        grid-template-columns: 120px 120px 120px !important;
                        margin-left: calc(50% - 180px) !important;
                    }
                }
            `,
            SharedStyles
        ];
    }

    private _getHelpLink () {
        let uri : string = 'https://mintproject.readthedocs.io/en/latest/modelcatalog/';
        if (this._selectedSetup)
            return uri + '#model-configuration-setup';
        if (this._selectedConfig)
            return uri + '#model-configuration';
        return uri;
    }

    private _getAPILink () {
        return "https://api.models.wildfire.mint.isi.edu/latest/ui/";
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
            case 'compare':
                nav.push({label: 'Compare Models', url: 'models/compare'});
                break;
            case 'edit':
                nav.push({label: 'Edit Models', url: 'models/edit'});
                break;
            case 'cromo':
                nav.push({label: 'Recommend Models', url: 'models/cromo'});
                break;
            default:
                break;
        }

        return html`
            <nav-title .nav="${nav}" max="2">
                <a slot="after" class="no-decoration" target="_blank" href="${this._getAPILink()}" style="margin-right: 0.5em;">
                    <wl-button style="--button-padding: 8px;">
                        <wl-icon style="margin-right: 5px;">help_outline</wl-icon>
                        <b>API</b>
                    </wl-button>
                </a>
                <a slot="after" class="no-decoration" target="_blank" href="${this._getHelpLink()}">
                    <wl-button style="--button-bg: forestgreen; --button-bg-hover: darkgreen; --button-padding: 8px;">
                        <wl-icon style="margin-right: 5px;">help_outline</wl-icon>
                        <b>Documentation</b>
                    </wl-button>
                </a>
            </nav-title>

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
                <a href="${this._regionid}/models/edit">
                    <wl-icon>edit</wl-icon>
                    <div>Edit Models</div>
                </a>
                <a href="${this._regionid}/models/compare">
                    <wl-icon>compare</wl-icon>
                    <div>Compare Models</div>
                </a>
                <a href="${this._regionid}/models/configure">
                    <wl-icon>perm_data_settings</wl-icon>
                    <div>Configure Models</div>
                </a>
                <!--a href="{this._regionid}/models/calibrate"-->
                <a href="${this._regionid}/models/cromo">
                    <wl-icon style="margin-top:0px">manage_search</wl-icon>
                    <div style="margin-top: -10px;">Recommend Models</div>
                </a>
            </div>

            <model-explorer class="page" ?active="${this._subpage == 'explore'}"></model-explorer>
            <models-register class="page" ?active="${this._subpage == 'register'}"></models-register>
            <models-configure class="page" ?active="${this._subpage == 'configure'}"></models-configure>
            <models-calibrate class="page" ?active="${this._subpage == 'calibrate'}"></models-calibrate>
            <models-compare class="page" ?active="${this._subpage == 'compare'}"></models-compare>
            <models-edit class="page" ?active="${this._subpage == 'edit'}"></models-edit>
            <models-cromo class="page" ?active="${this._subpage == 'cromo'}"></models-cromo>
        `
    }

    firstUpdated() {
        let api : UserCatalog = ModelCatalogApi.myCatalog;

        store.dispatch(api.model.getAll());
        store.dispatch(api.softwareVersion.getAll());
        store.dispatch(api.modelConfiguration.getAll());
        store.dispatch(api.modelConfigurationSetup.getAll());
        store.dispatch(api.region.getAll());
        store.dispatch(api.image.getAll());
        store.dispatch(api.modelCategory.getAll());
        store.dispatch(api.variablePresentation.getAll());

        //TEST
        /*console.log('Getting SWAT from the model-catalog...');
        store.dispatch(ModelCatalogApi.getCatalog('mint@isi.edu').model.get("SWAT")).then((m:Model) => {
            console.log('Response from mint@isi.edu:', m);
            console.log('Copy to user graph...');
            let swatCopy = { ...m, id: '' }
            //if (swatCopy.dateCreated) delete swatCopy.dateCreated
            store.dispatch(ModelCatalogApi.myCatalog.model.post(swatCopy)).then((s:Model) => {
                console.log('Response of post', s);
                console.log('Editing...');
                if (s && s.label && s.label.length > 0) {
                    s.label = [ s.label[0] + " (copy)" ];
                    store.dispatch(ModelCatalogApi.myCatalog.model.put(s)).then((w:Model) => {
                        console.log('Response of put', w);
                        console.log("Deleting...");
                        store.dispatch(ModelCatalogApi.myCatalog.model.delete(w.id)).then(() => {
                            console.log("DONE");
                        });
                    });
                } else {
                    console.log('error no s');
                }
            });
        });*/
    }

    stateChanged(state: RootState) {
        super.setSubPage(state);
        super.setRegionId(state);
        if (state && state.explorerUI) {
            this._selectedModelId = state.explorerUI.selectedModel.split('/').pop();
            this._selectedConfig = state.explorerUI.selectedConfig;
            this._selectedSetup = state.explorerUI.selectedCalibration;
        }
    }
}
