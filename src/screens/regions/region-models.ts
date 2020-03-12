import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { RegionQueryPage } from './region-query-page';
import { SharedStyles } from 'styles/shared-styles';
import { goToPage } from 'app/actions';
import { UserPreferences, IdMap } from 'app/reducers';
import { BoundingBox } from './reducers';

import { modelsGet, versionsGet, modelConfigurationsGet, modelConfigurationSetupsGet, regionsGet, geoShapesGet,
         datasetSpecificationGet, sampleResourceGet, sampleCollectionGet, setupGetAll } from 'model-catalog/actions';
/*=======
import { modelsGet, versionsGet, modelConfigurationsGet, regionsGet, geoShapesGet, ,
         datasetSpecificationGet, sampleResourceGet, sampleCollectionGet, setupGetAll,
         ALL_MODELS, ALL_VERSIONS, ALL_MODEL_CONFIGURATIONS, ALL_MODEL_CONFIGURATION_SETUPS, ALL_REGIONS, ALL_GEO_SHAPES } from 'model-catalog/actions';
>>>>>>> f10994b0085dc5eafecc152b9a48e41e5fbbe823*/
import { GeoShape } from '@mintproject/modelcatalog_client';

import { queryDatasetResourcesAndSave } from 'screens/datasets/actions';

interface GeoShapeBBox extends GeoShape {
    bbox?: BoundingBox
}

@customElement('region-models')
export class RegionModels extends connect(store)(RegionQueryPage)  {
    @property({type: Object})
    private prefs : UserPreferences;

    @property({type: Boolean})
    private _fullyLoaded : boolean = false;

    @property({type: Boolean})
    private _loadingDatasets : boolean = false;

    @property({type: Object})
    private _geoShapes : IdMap<GeoShapeBBox> = {} as IdMap<GeoShapeBBox>;

    @property({type: Object})
    private _mregions : any = {}

    @property({type: Object})
    private _models : any = {}

    @property({type: Object})
    private _versions : any = {}

    @property({type: Object})
    private _configs : any = {}

    @property({type: Object})
    private _setups : any = {}

    @property({type: Object})
    private _datasets : any = {}

    @property({type: Array})
    private _matchingModelSetups : any = [];

    @property({type: Object})
    private _categorizedMatchingSetups : any = {};

    @property({type: Array})
    private _matchingModelDatasets : any = [];

    static get styles() {
        return [SharedStyles, css`
        .info-center {
            font-size: 12pt;
            color: #999;
            padding-left: 16px;
            padding-bottom: 1em;
        }

        .no-decorator:hover {
            text-decoration: none;
        }`];
    }

    protected firstUpdated() {
        let pGeo = store.dispatch(geoShapesGet());
        let pReg = store.dispatch(regionsGet());
        let pMod = store.dispatch(modelsGet());
        let pVer = store.dispatch(versionsGet());
        let pCon = store.dispatch(modelConfigurationsGet());
        let pSet = store.dispatch(modelConfigurationSetupsGet());

        /*pGeo.then((v) => { this._geoShapes = v});
        pReg.then((v) => { this._mregions = v});
        pMod.then((v) => { this._models = v});
        pVer.then((v) => { this._versions = v});
        pCon.then((v) => { this._configs = v});*/

        Promise.all([pGeo, pReg, pMod, pVer, pCon, pSet]).then((v) => {
            this._fullyLoaded = true;
            if (this._selectedRegion) {
                this._getMatchingModels();
            }
        })
    }

    _getModelURL (setupURI: string) {
        let config : any, version : any, model : any;
        let configs = Object.values(this._configs)
                .filter((c:any) => c.hasSetup && c.hasSetup.filter((s:any) => s.id===setupURI).length > 0);

        if (configs.length > 0) config = configs[0];
        else {
            console.error('No config for this setup', setupURI);
            return;
        }

        let versions = Object.values(this._versions)
                .filter((v:any) => v.hasConfiguration && v.hasConfiguration.filter((c:any) => c.id===config.id).length > 0);
        if (versions.length > 0) version = versions[0];
        else {
            console.error('No version for this config', config.id);
            return;
        }

        let models = Object.values(this._models)
                .filter((m:any) => m.hasVersion && m.hasVersion.filter((v:any) => v.id===version.id).length >0);
        if (models.length > 0) model = models[0];
        else {
            console.error('No model for this version', version.id);
            return;
        }

        return this._regionid + '/models/explore/' + model.id.split('/').pop() + '/' + version.id.split('/').pop() +
               '/' + config.id.split('/').pop() + '/' + setupURI.split('/').pop();
    }

    private _doBoxesIntersect(box1: BoundingBox, box2: BoundingBox) {
        return(box1.xmin <= box2.xmax && box1.xmax >= box2.xmin &&
            box1.ymin <= box2.ymax && box1.ymax >= box2.ymin);
    }

    private _getMatchingModels() {
        this._matchingModelSetups = [];
        this._matchingModelDatasets = [];
        this._loadingDatasets = true;
        Object.keys(this._geoShapes).map((geoId:string) => {
            let bbox = this._geoShapes[geoId].bbox as BoundingBox;
            let selbox = this._selectedRegion.bounding_box;
            if (!bbox || !bbox.xmin) {
                return;
            }
            if (this._doBoxesIntersect(bbox, selbox)) {
                let region : any = Object.values(this._mregions).filter((r:any) => r.geo && r.geo.length > 0 && r.geo[0].id === geoId)[0];
                let modelsInside = Object.values(this._setups)
                    .filter((c:any) => (c.hasRegion||[]).filter((r:any) => r.id === region.id).length > 0);
                if (modelsInside) {
                    this._matchingModelSetups = this._matchingModelSetups.concat(modelsInside);
                }
            }
        });
        this._categorizedMatchingSetups = this._matchingModelSetups.reduce((dic, setup) => {
            let cat : string = setup.hasModelCategory && setup.hasModelCategory.length > 0 ?
                    setup.hasModelCategory[0] : ''; 
            if (cat) {
                if (!dic[cat]) dic[cat] = [setup];
                else dic[cat].push(setup)
            }
            return dic;
        }, {})

        let uniq = {}
        Object.keys(this._categorizedMatchingSetups).forEach((key:string) => {
            uniq[key] = Array.from(new Set(this._categorizedMatchingSetups[key]));
        });
        this._categorizedMatchingSetups = uniq;

        Promise.all(this._matchingModelSetups.map(setup => setupGetAll(setup.id))).then((setups) => {
            let datasets = new Set();
            setups.forEach((setup:any) => {
                (setup.hasInput||[]).forEach(input => {
                    (input.hasFixedResource||[]).forEach(sample => {
                        (sample.dataCatalogIdentifier||[]).forEach(dsid => {
                            if (dsid[0] != 'F' && dsid[1] != 'F' && dsid[2] != 'F')
                                datasets.add(dsid);
                        });
                    });
                    (input.hasPart||[]).forEach(sample => {
                        console.log('!collection', sample)
                    });
                });
            });
            datasets.forEach(ds => {
                this._matchingModelDatasets.push(ds);
                store.dispatch(queryDatasetResourcesAndSave(ds, this._selectedRegion, this.prefs.mint));
            });
            this._loadingDatasets = false;
        });
    }

    protected render() {
        return html`
            ${this._selectedRegion ? html`
            <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
                ${this._fullyLoaded ? html`
                    ${Object.keys(this._categorizedMatchingSetups).length == 0 ?  'No models for this region' : ''}
                    ${Object.keys(this._categorizedMatchingSetups).map((category:string) => html`
                        <wl-expansion name="models">
                            <span slot="title">${category} models</span>
                            <span slot="description">${this._categorizedMatchingSetups[category].length} setups found</span>
                            ${this._categorizedMatchingSetups[category].map((setup) => html`
                            <a href="${this._getModelURL(setup.id)}" class="no-decorator"><wl-list-item class="active">
                                <wl-icon slot="before">web</wl-icon>
                                <wl-title level="4" style="margin: 0;">${setup.label}</wl-title>

                                <div>
                                    <b>Regions:</b>
                                    ${setup.hasRegion.map(r => this._mregions[r.id].label).join(', ')}
                                </div>

                            </wl-list-item></a>
                            `)}
                        </wl-expansion>
                    `)}` 
                    : html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`}`
                : ""
            }

            ${this._selectedRegion && this._matchingModelSetups.length > 0?
            html`
                <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Datasets used by models in ${this._selectedRegion.name}</wl-title>
                ${this._loadingDatasets ? html`
                <div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` 
                : html`
                    ${this._matchingModelDatasets.length === 0 ? html`
                    <div class="info-center">
                        No datasets for models in ${this._selectedRegion.name}
                    </div>`
                    : html`
                        ${this._matchingModelDatasets.map(dsId => this._datasets && this._datasets[dsId] ? html`
                            <wl-list-item class="active" @click="${() => goToPage('datasets/browse/'+dsId)}">
                                <wl-icon slot="before">folder</wl-icon>
                                <wl-title level="4" style="margin: 0">${this._datasets[dsId].name}</wl-title>
                                <div>
                                    ${this._datasets[dsId].is_cached ? 
                                        html`<span style="color: green">Available on MINT servers</span>` :
                                        html`<span style="color: lightsalmon">Available for download</span>`}
                                    <span style="color: gray">-</span> ${this._datasets[dsId].resource_count} files
                                </div>
                            </wl-list-item>
                        `: '')}
                    `}
                `}
            `: ''
            }
        `;
    }

    stateChanged(state: RootState) {
        let curregion = this._selectedRegion;
        super.setSelectedRegion(state);
        this.prefs = state.app.prefs;

        if(this._selectedRegion) {
            if(curregion != this._selectedRegion) {
                this._getMatchingModels();
            }
        }

        this._datasets = state.datasets ? state.datasets.datasets : state.datasets;

        if (state && state.modelCatalog) {
            let db = state.modelCatalog;
            this._geoShapes = db.geoShapes;
            this._mregions = db.regions;
            this._models = db.models;
            this._versions = db.versions;
            this._configs = db.configurations;
            this._setups = db.setups;
        }
    }
}
