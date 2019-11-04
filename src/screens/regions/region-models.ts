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
import { ModelConfigurationApi } from '@mintproject/modelcatalog_client';
import { DEFAULT_GRAPH } from 'model-catalog/actions';
import { BoundingBox } from './reducers';

@customElement('region-models')
export class RegionModels extends connect(store)(RegionQueryPage)  {
    
    @property({type: Object})
    private prefs : UserPreferences;
    
    @property({type: Array})
    private _matchingModels : any = [];

    @property({type: Object})
    private _models : any = {};

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

        },
        "texas": {

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
                        id: config.id.replace(/.*\//, ''),
                        name: config.label[0]
                    });
                }
            });
            console.log(this._models);
        })
        .catch((err) => {console.log('Error on GET modelConfigurations', err)})        
    }

    private _doBoxesIntersect(box1: BoundingBox, box2: BoundingBox) {
        return(box1.xmin <= box2.xmax && box1.xmax >= box2.xmin &&
            box1.ymin <= box2.ymax && box1.ymax >= box2.ymin);
    }

    private _getMatchingModels() {
        this._matchingModels = [];
        Object.keys(this._modelRegionBoundingBoxes).map((region_key) => {
            let bbox = this._modelRegionBoundingBoxes[region_key];
            let selbox = this._selectedRegion.bounding_box;
            if(!bbox.xmin) {
                return;
            }
            if(this._doBoxesIntersect(bbox, selbox)) {
                let models = this._models[region_key];
                if(models)
                    this._matchingModels = this._matchingModels.concat(models);
            }
        });
    }

    protected render() {
        return html`
            ${this._selectedRegion && this._matchingModels ? 
                html`
                    <wl-title level="4" style="font-size: 17px; margin-top: 20px;">Models for ${this._selectedRegion.name}</wl-title>
                    ${!this._matchingModels || this._matchingModels.length == 0 ? 'No models for this region' :
                    html`<ul>${this._matchingModels.map((model) => html`
                        <li><a @click="${() => goToPage(model.id)}">${model.name}</a></li>`)
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