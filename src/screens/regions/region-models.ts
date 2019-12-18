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
import { modelsGet, versionsGet, modelConfigurationsGet, regionsGet, geoShapesGet,
         datasetSpecificationGet, sampleResourceGet, sampleCollectionGet,
         ALL_MODELS, ALL_VERSIONS, ALL_MODEL_CONFIGURATIONS, ALL_REGIONS, ALL_GEO_SHAPES } from 'model-catalog/actions';
import { GeoShape } from '@mintproject/modelcatalog_client';

import { queryDatasetResourcesAndSave } from 'screens/datasets/actions';

interface GeoShapeBBox extends GeoShape {
    bbox?: BoundingBox
}

@customElement('region-models')
export class RegionModels extends connect(store)(RegionQueryPage)  {
    @property({type: Object})
    private _datasetSpecsLoading : Set<string> = new Set();
    @property({type: Object})
    private _sampleCollectionsLoading : Set<string> = new Set();
    @property({type: Object})
    private _sampleResourcesLoading : Set<string> = new Set();

    @property({type: Object})
    private prefs : UserPreferences;

    @property({type: Boolean})
    private _fullyLoaded : boolean = false;

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
    private _datasets : any = {}

    @property({type: Array})
    private _matchingModelSetups : any = [];

    @property({type: Array})
    private _matchingModelDatasets : any = [];

    static get styles() {
        return [SharedStyles, css``];
    }

    protected firstUpdated() {
        store.dispatch(regionsGet());
        store.dispatch(geoShapesGet());
        store.dispatch(modelsGet());
        store.dispatch(versionsGet());
        store.dispatch(modelConfigurationsGet());
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
        Object.keys(this._geoShapes).map((geoId:string) => {
            let bbox = this._geoShapes[geoId].bbox as BoundingBox;
            let selbox = this._selectedRegion.bounding_box;
            if (!bbox || !bbox.xmin) {
                return;
            }
            if (this._doBoxesIntersect(bbox, selbox)) {
                let region : any = Object.values(this._mregions).filter((r:any) => r.geo && r.geo.length > 0 && r.geo[0].id === geoId)[0];
                let regionType = this.regionType === 'Administrative' ? 'Economy' : this.regionType;
                let modelsInside = Object.values(this._configs)
                    .filter((c:any) => c.hasModelCategory && c.hasModelCategory.indexOf(regionType) >= 0 &&
                                       c.type && c.type.indexOf('ModelConfigurationSetup') >= 0 &&
                                       c.hasRegion && c.hasRegion.length > 0 &&
                                       c.hasRegion.filter((r:any) => r.id === region.id).length > 0);
                if (modelsInside) {
                    this._matchingModelSetups = this._matchingModelSetups.concat(modelsInside);
                }
            }
        });
        let dspecs : Set<string> = new Set();
        this._matchingModelSetups.forEach((model:any) => (model.hasInput||[]).forEach(input => dspecs.add(input.id)));
        this._datasetSpecsLoading = dspecs;

        let state : any = store.getState();
        dspecs.forEach(dspecUri => {
            if (state && state.modelCatalog && state.modelCatalog.datasetSpecifications &&
                state.modelCatalog.datasetSpecifications[dspecUri]) {
                console.log(dspecUri, 'already loaded');
            } else {
                store.dispatch(datasetSpecificationGet(dspecUri))
            }
        });
    }

    protected render() {
        return html`
            ${this._selectedRegion && this._matchingModelSetups ? 
                html`
                    <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
                    ${this._fullyLoaded ? html`
                    ${!this._matchingModelSetups || this._matchingModelSetups.length == 0 ? 'No models for this region' :
                    html`<ul>${this._matchingModelSetups.map((model) => html`
                        <li><a href="${this._getModelURL(model.id)}">${model.label}</a></li>`)
                    }</ul>`}
                    ` : html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                    }
                `
                : ""
            }
            ${this._selectedRegion && this._matchingModelDatasets && this._matchingModelSetups.length > 0?
            html`
                <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Datasets used by models in ${this._selectedRegion.name}</wl-title>

                ${!this._fullyLoaded || this._datasetSpecsLoading.size > 0 || this._sampleCollectionsLoading.size > 0 || this._sampleResourcesLoading.size > 0 ?
                html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`: ''}

                ${this._matchingModelDatasets.length === 0 ? 'No datasets for models in ' + this._selectedRegion.name : ''}

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
            if (!this._fullyLoaded) {
                let loaded = db.loadedAll;
                if (loaded[ALL_REGIONS] && loaded[ALL_MODELS] && loaded[ALL_GEO_SHAPES] && loaded[ALL_VERSIONS] &&
                    loaded[ALL_MODEL_CONFIGURATIONS]) {
                    this._geoShapes = db.geoShapes;
                    this._mregions = db.regions;
                    this._models = db.models;
                    this._versions = db.versions;
                    this._configs = db.configurations;
                    this._fullyLoaded = true;
                    if (this._selectedRegion) {
                        this._getMatchingModels();
                    }
                }
            }

            if (this._datasetSpecsLoading.size > 0) {
                this._datasetSpecsLoading.forEach((uri:string) => {
                    if (db.datasetSpecifications[uri]) {
                        let dss = db.datasetSpecifications[uri];
                        this._datasetSpecsLoading.delete(uri);
                        this.requestUpdate();
                        if (dss.hasFixedResource && dss.hasFixedResource.length > 0) {
                            dss.hasFixedResource.forEach(fixed => {
                                if (fixed.type.indexOf('SampleCollection') >= 0) {
                                    if (!db.sampleCollections || !db.sampleCollections[fixed.id])
                                        store.dispatch(sampleCollectionGet(fixed.id))
                                    this._sampleCollectionsLoading.add(fixed.id);
                                } else {
                                    if (!db.sampleResources || !db.sampleResources[fixed.id])
                                        store.dispatch(sampleResourceGet(fixed.id))
                                    this._sampleResourcesLoading.add(fixed.id);
                                }
                            });
                        }
                    }
                });
            }

            if (this._sampleResourcesLoading.size > 0) {
                this._sampleResourcesLoading.forEach((uri:string) => {
                    if (db.sampleResources[uri]) {
                        let sample = db.sampleResources[uri];
                        this._sampleResourcesLoading.delete(uri);
                        this.requestUpdate();
                        if (sample.dataCatalogIdentifier) {
                            sample.dataCatalogIdentifier.forEach(id => {
                                if (id[0] != 'F' && id[1] != 'F' && id[2] != 'F') {
                                    this._matchingModelDatasets.push(id)
                                    store.dispatch(queryDatasetResourcesAndSave(id, this._selectedRegion, this.prefs.mint));
                                    this.requestUpdate();
                                }
                            });
                        }
                    }
                });
            }

            if (this._sampleCollectionsLoading.size > 0) {
                this._sampleCollectionsLoading.forEach((uri:string) => {
                    if (db.sampleCollections[uri]) {
                        let collection = db.sampleCollections[uri];
                        this._sampleCollectionsLoading.delete(uri);
                        this.requestUpdate();
                        if (collection.hasPart) {
                            collection.hasPart.forEach((sample:any) => {
                                if (!db.sampleResources || !db.sampleResources[sample.id])
                                    store.dispatch(sampleResourceGet(sample.id))
                                this._sampleResourcesLoading.add(sample.id);
                            });
                        }
                    }
                });
            }

        }
    }
}
