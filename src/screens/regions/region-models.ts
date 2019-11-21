import { customElement, property, html, css } from 'lit-element';

import { store, RootState } from '../../app/store';
import { connect } from 'pwa-helpers/connect-mixin';

import 'components/google-map-custom';
import 'weightless/progress-spinner';
import { RegionQueryPage } from './region-query-page';
import { SharedStyles } from 'styles/shared-styles';
import { goToPage } from 'app/actions';
import { UserPreferences } from 'app/reducers';
import { listAllModels } from 'screens/models/actions';
import { ModelConfigurationApi, ModelApi, SoftwareVersionApi } from '@mintproject/modelcatalog_client';
import { DEFAULT_GRAPH } from 'model-catalog/actions';
import { BoundingBox } from './reducers';

@customElement('region-models')
export class RegionModels extends connect(store)(RegionQueryPage)  {
    
    @property({type: Object})
    private prefs : UserPreferences;
    
    @property({type: Array})
    private _matchingModelSetups : any = [];

    @property({type: Object})
    private _models : any = {};

    @property({type: Object})
    private _configVersions : any = {};

    @property({type: Object})
    private _versionModels : any = {};

    @property({type: Object})
    private _setupConfigs : any = {};

    @property({type: Object})
    private _modelRegionBoundingBoxes: any = {
        "baro": {
            xmax: 36.31541666666567,
            xmin: 34.518749999999,
            ymax: 9.417083333332332,
            ymin: 7.431249999999
        },
        "gambella": {
            xmax: 35.402297999999995,
            xmin: 32.991536,
            ymax: 8.718837,
            ymin: 6.27026
        },
        "pongo_basin_ss": {
            xmax: 27.741570450529053,
            xmin: 24.14233611868619,
            ymax: 9.345303077456506,
            ymin: 6.682771856532459
        },
        "barton_springs": {
            ymin: 30.3075, 
            xmin: -97.730278,
            ymax: 30.3175,
            xmax: -97.63
        },
        "texas": {
            xmin: -106.65038428499993, 
            ymin: 25.829765046000137, 
            xmax: -93.51181051299993, 
            ymax: 36.51056885500015
        }
    };
    
    static get styles() {
        return [
            SharedStyles,
            css `
            `
        ];
    }

    protected firstUpdated() {
        this._fetchAllConfigurations();
    }

    private _fetchAllConfigurations() {
        let api : ModelConfigurationApi = new ModelConfigurationApi();
        api.modelconfigurationsGet({username: DEFAULT_GRAPH})
        .then((configs) => {
            configs.map((config) => {
                let cname = config.id.replace(/.*\//, '');
                if(config.hasRegion && config.hasRegion.length > 0) {
                    let region = config.hasRegion[0];
                    let regionname = region.id.replace(/.*\//, '');
                    if(region.label) {
                        regionname = region.label[0];
                    }
                    let region_key = regionname.toLowerCase();
                    if(!this._models[region_key])
                        this._models[region_key] = [];
                    this._models[region_key].push({
                        id: cname,
                        name: config.label[0]
                    });
                }
                if(config.hasSetup) {
                    config.hasSetup.map((setup: any) => {
                        let sname = setup.id.replace(/.*\//, '');
                        this._setupConfigs[sname] = cname;
                    })
                }
                if(this._selectedRegion) {
                    this._getMatchingModels();
                }
            });
        })
        .catch((err) => {console.log('Error on GET modelConfigurations', err)})        

        let api2 : ModelApi = new ModelApi();
        api2.modelsGet({username: DEFAULT_GRAPH})
        .then((models) => {
            this._versionModels = {};
            models.map((model) => {
                let mname = model.id.replace(/.*\//, '');
                model.hasVersion.map((version: any) => {
                    let vname = version.id.replace(/.*\//, '');
                    this._versionModels[vname] = mname;
                })
            });
        });

        let api3 : SoftwareVersionApi = new SoftwareVersionApi();
        api3.softwareversionsGet({username: DEFAULT_GRAPH})
        .then((versions) => {
            this._configVersions = {};
            versions.map((version) => {
                let vname = version.id.replace(/.*\//, '');
                if(!version.hasVersionId)
                    return;
                let versionId = version.hasVersionId[0];
                version.hasConfiguration.map((config) => {
                    let cname = config.id.replace(/.*\//, '');
                    this._configVersions[cname] = {
                        id: vname,
                        versionId: versionId
                    }
                })
            });
        });
    }

    _getModelURL (setupid: string) {
        let sname = setupid.replace(/.*\//, '');
        let cname = this._setupConfigs[sname];
        if(cname) {
            let vobj = this._configVersions[cname];
            if(vobj) {
                let vname = vobj.id;
                let vid = vobj.versionId;
                let mname = this._versionModels[vname];
                if(mname) 
                    return this._regionid + '/models/explore/' + mname + "/" + vid + "/" + cname + "/" + sname;
            }
        }
    }

    private _doBoxesIntersect(box1: BoundingBox, box2: BoundingBox) {
        return(box1.xmin <= box2.xmax && box1.xmax >= box2.xmin &&
            box1.ymin <= box2.ymax && box1.ymax >= box2.ymin);
    }

    private _getMatchingModels() {
        this._matchingModelSetups = [];
        Object.keys(this._modelRegionBoundingBoxes).map((region_key) => {
            let bbox = this._modelRegionBoundingBoxes[region_key];
            let selbox = this._selectedRegion.bounding_box;
            if(!bbox.xmin) {
                return;
            }
            if(this._doBoxesIntersect(bbox, selbox)) {
                let models = this._models[region_key];
                if(models)
                    this._matchingModelSetups = this._matchingModelSetups.concat(models);
            }
        });
    }

    protected render() {
        return html`
            ${this._selectedRegion && this._matchingModelSetups ? 
                html`
                    <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
                    ${!this._matchingModelSetups || this._matchingModelSetups.length == 0 ? 'No models for this region' :
                    html`<ul>${this._matchingModelSetups.map((model) => html`
                        <li><a href="${this._getModelURL(model.id)}">${model.name}</a></li>`)
                    }</ul>`
                    }
                `
                : ""
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
    }
}