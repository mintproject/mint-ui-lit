import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { PageViewElement } from 'components/page-view-element';
import { SharedStyles } from 'styles/shared-styles';
import { goToPage } from 'app/actions';
import { UserPreferences, IdMap } from 'app/reducers';
import { BoundingBox, Region as GQLRegion } from './reducers';
import { bboxInRegion, doBoxesIntersect, getBoundingBoxFromGeoShape, setPreview } from './actions';
import { selectSubRegion } from 'app/ui-actions';

import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

import { isSubregion, isMainRegion, getLabel } from 'model-catalog-api/util';
import { GeoShape, Region, Model, SoftwareVersion, ModelConfiguration, ModelConfigurationSetup } from '@mintproject/modelcatalog_client';
import { Dataset } from "screens/datasets/reducers";

import { queryDatasetResourcesAndSave, queryDatasetResourcesRaw } from 'screens/datasets/actions';

@customElement('region-models')
export class RegionModels extends connect(store)(PageViewElement)  {
    @property({type: Object})
    private prefs : UserPreferences;

    @property({type: Object})
    protected _selectedRegion: GQLRegion;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: String})
    public regionType : string = '';

    /* Model catalog data */
    @property({type: Object}) private _geoShapes : IdMap<GeoShape> = {};
    @property({type: Object}) private _regions : IdMap<Region> = {};
    @property({type: Object}) private _models : IdMap<Model> = {};
    @property({type: Object}) private _versions : IdMap<SoftwareVersion> = {};
    @property({type: Object}) private _configs : IdMap<ModelConfiguration> = {};
    @property({type: Object}) private _setups : IdMap<ModelConfigurationSetup> = {};

    @property({type: Boolean}) private _loadingSetups : boolean = false;
    @property({type: Array}) private _matchingSetups : ModelConfigurationSetup[] = [];
    @property({type: Object}) private _categorizedMatchingSetups : IdMap<ModelConfigurationSetup[]> = {};

    @property({type: Boolean}) private _loadingDatasets : boolean = false;
    @property({type: Array}) private _matchingModelDatasets : Dataset[] = [];

    private _bbox_preview = [];

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
        let pGeo = store.dispatch(ModelCatalogApi.myCatalog.geoShape.getAll());
        let pReg = store.dispatch(ModelCatalogApi.myCatalog.region.getAll());
        let pMod = store.dispatch(ModelCatalogApi.myCatalog.model.getAll());
        let pVer = store.dispatch(ModelCatalogApi.myCatalog.softwareVersion.getAll());
        let pCon = store.dispatch(ModelCatalogApi.myCatalog.modelConfiguration.getAll());
        let pSet = store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getAll());

        this._loading = true;
        Promise.all([pGeo, pReg, pMod, pVer, pCon, pSet]).then((v) => {
            this._loading = false;
            if (this._selectedRegion) {
                this._getMatchingModels();
            }
        })
    }

    _getModelURL (setupURI: string) {
        let base : string = this._regionid + '/models/explore/';
        let config : any, version : any, model : any;
        let configs = Object.values(this._configs)
                .filter((c:any) => c.hasSetup && c.hasSetup.filter((s:any) => s.id===setupURI).length > 0);

        if (configs.length > 0) config = configs[0];
        else {
            console.error('No config for this setup', setupURI);
            return base;
        }

        let versions = Object.values(this._versions)
                .filter((v:any) => v.hasConfiguration && v.hasConfiguration.filter((c:any) => c.id===config.id).length > 0);
        if (versions.length > 0) version = versions[0];
        else {
            console.error('No version for this config', config.id);
            return base;
        }

        let models = Object.values(this._models)
                .filter((m:any) => m.hasVersion && m.hasVersion.filter((v:any) => v.id===version.id).length >0);
        if (models.length > 0) model = models[0];
        else {
            console.error('No model for this version', version.id);
            return base;
        }

        return this._regionid + '/models/explore/' + model.id.split('/').pop() + '/' + version.id.split('/').pop() +
               '/' + config.id.split('/').pop() + '/' + setupURI.split('/').pop();
    }


    private _getMatchingModels() {
        /* Get setups */
        this._matchingSetups = [];
        if (!this._selectedRegion) {
            this._loadingSetups = false;
            return;
        }
        this._loadingSetups = true;
        let selbox : BoundingBox = this._selectedRegion.bounding_box;
        let selArea : number = (selbox.xmax - selbox.xmin) * (selbox.ymax - selbox.ymin);
        let regions : Set<string> = new Set();
        let parentRegion : string = this._region.model_catalog_uri;

        Object.values(this._regions).forEach((region:Region) => {
            if (!isMainRegion(region))
                (region.geo || []).forEach((geo:GeoShape) => {
                    let geoshape : GeoShape= this._geoShapes[geo.id];
                    let bbox : BoundingBox = getBoundingBoxFromGeoShape(geoshape);
                    if (geoshape && bbox) {
                        if (bbox && bbox.xmin && doBoxesIntersect(bbox, selbox) && isSubregion(parentRegion, region)) {
                            // A point inside the bbox does not mean that the point is inside the polygon
                            let area : number = (bbox.xmax - bbox.xmin) * (bbox.ymax - bbox.ymin);
                            if (area >= selArea || bboxInRegion(bbox, this._selectedRegion) ) {
                                regions.add(region.id);
                            }
                        }
                    }
                });
        });
        //console.log('regions:', regions);

        let setups : Set<string> = new Set();
        Object.values(this._setups).forEach((setup:ModelConfigurationSetup) => {
            if ( (setup.hasRegion || []).some((region:Region) => regions.has(region.id)) ) {
                setups.add(setup.id);
            }
        });
        //console.log('setups:', setups);

        this._matchingSetups = Array.from(setups).map((sid:string) => this._setups[sid]);

        this._categorizedMatchingSetups = this._matchingSetups
                .reduce((map:IdMap<ModelConfigurationSetup[]>, setup:ModelConfigurationSetup) => {
            let categories : string[] = null
            if (setup.hasModelCategory && setup.hasModelCategory.length > 0) {
                categories = setup.hasModelCategory.map(getLabel);
            } else {
                categories = ['Uncategorized'];
            }
            categories.forEach((cat:string) => {
                if (!map[cat]) map[cat] = [setup];
                else map[cat].push(setup)
            });
            return map;
        }, {});
        this._loadingSetups = false;

        if (this._matchingSetups.length == 0) return;

        this._matchingModelDatasets = [];
        this._loadingDatasets = true;

        Promise.all(this._matchingSetups.map((setup:ModelConfigurationSetup) =>
                store.dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.getDetails(setup.id))))
        .then((setups:ModelConfigurationSetup[]) => {
            let datasets : Set<string> = new Set();
            setups.forEach((setup:ModelConfigurationSetup) => {
                (setup.hasInput||[]).forEach(input => {
                    (input.hasFixedResource||[]).forEach(sample => {
                        (sample.dataCatalogIdentifier||[]).forEach(dsid => {
                            if (dsid[0] != 'F' && dsid[1] != 'F' && dsid[2] != 'F')
                                datasets.add(dsid);
                        });
                        /*TODO: this can be a sampleCollection.
                        if (sample.hasPart && sample.hasPart.length > 0) {
                            console.log('is a collection!', sample.hasPart);
                        }*/
                    });
                });
            });

            if (datasets.size > 0) {
                Promise.all(
                    Array.from(datasets).map((ds:string) => queryDatasetResourcesRaw(ds, this._selectedRegion, this.prefs.mint))
                ).then((results) => {
                    let dss : Dataset[] = [];
                    results.forEach((arr: Dataset[]) => {
                        arr.forEach((ds: Dataset) => {
                            dss.push(ds);
                        });
                    });
                    this._matchingModelDatasets = dss;
                    this._loadingDatasets = false;
                }).catch((err) => {
                    console.warn(err);
                    this._loadingDatasets = false;
                });
            } else {
                this._loadingDatasets = false;
            }
        }).catch((err) => {
            console.warn(err);
            this._loadingDatasets = false;
        });
    }

    private _setSetupPreview (setup:ModelConfigurationSetup) {
        let parentRegion : string = this._region.model_catalog_uri;
        let selGeo : Set<string> = new Set();
        (setup.hasRegion || []).forEach((reg) => {
            let region = this._regions[reg.id];
            if (isSubregion(parentRegion, region)) {
                (region.geo || []).forEach((g:any) => {
                    selGeo.add(g.id);
                });
            }
        })

        store.dispatch(setPreview(
            Array.from(selGeo).map((gid) => getBoundingBoxFromGeoShape(this._geoShapes[gid]))
        ));
    }


    private _clearPreview () {
        if (this._bbox_preview && this._bbox_preview.length > 0) {
            store.dispatch(setPreview([]));
        }
    }

    protected render() {
        if (!this._selectedRegion) return html``;
        else return html`
            <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
            ${this._loadingSetups || this._loading ? 
                html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                : (Object.keys(this._categorizedMatchingSetups).length == 0 ? 
                    html`<div class="info-center">No models for this region</div>`
                    : Object.keys(this._categorizedMatchingSetups).map((category:string) => html`
                        <wl-expansion name="models" @mouseleave="${this._clearPreview}">
                            <span slot="title">${category} models</span>
                            <span slot="description">${this._categorizedMatchingSetups[category].length} setups found</span>
                            ${this._categorizedMatchingSetups[category].map((setup:ModelConfigurationSetup) => html`
                            <a href="${this._getModelURL(setup.id)}" class="no-decorator"
                                    @mouseenter="${() => this._setSetupPreview(setup)}">
                            <wl-list-item class="active">
                                <wl-icon slot="before">web</wl-icon>
                                <wl-title level="4" style="margin: 0;">${setup.label}</wl-title>

                                <div>
                                    <b>Regions:</b>
                                    ${setup.hasRegion.map(r => this._regions[r.id].label).join(', ')}
                                </div>

                            </wl-list-item>
                            </a>`
                            )}
                        </wl-expansion>`
                    ) 
                )
            }

            ${this._matchingSetups.length > 0 ? 
                html`
                <wl-title level="4" style="font-size: 17px; margin-top: 20px;">
                    Datasets used by models in ${this._selectedRegion.name}
                </wl-title>
                ${this._loadingDatasets ? 
                    html`<div style="width:100%; text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>`
                    : (this._matchingModelDatasets.length == 0 ?
                        html`<div class="info-center"> No datasets for models in ${this._selectedRegion.name} </div>`
                        : this._matchingModelDatasets.map((ds:Dataset) => html`
                            <wl-list-item class="active" @click="${() => goToPage('datasets/browse/'+ds.id)}">
                                <wl-icon slot="before">folder</wl-icon>
                                <wl-title level="4" style="margin: 0">${ds.name}</wl-title>
                                <div>
                                    ${ds.is_cached ? 
                                        html`<span style="color: green">Available on MINT servers</span>`
                                        : html`<span style="color: lightsalmon">Available for download</span>`}
                                    <span style="color: gray">-</span> ${ds.resource_count} files
                                </div>
                            </wl-list-item>`
                        )
                    )
                }`
                : ''}`;
    }

    stateChanged(state: RootState) {
        super.setRegion(state);
        this.prefs = state.app.prefs;

        let curregion = this._selectedRegion;
        if(state.regions) {
            this._bbox_preview = state.regions.bbox_preview;
            if (state.regions.regions) {
                let regions = state.regions.regions;
                this._selectedRegion = regions[state.ui.selected_sub_regionid];
            }
        }

        if (this._selectedRegion != curregion) {
            this._getMatchingModels();
        }

        if (state && state.modelCatalog) {
            let db = state.modelCatalog;
            this._geoShapes = db.geoshape;
            this._regions = db.region;
            this._models = db.model;
            this._versions = db.softwareversion;
            this._configs = db.modelconfiguration;
            this._setups = db.modelconfigurationsetup;
        }
    }
}
