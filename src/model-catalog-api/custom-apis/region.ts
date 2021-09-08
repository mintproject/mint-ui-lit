import { MCActionAdd, ActionThunk } from '../actions';
import { Configuration } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from '../default-redux-api';
import { Region, RegionApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

export class CustomRegionApi extends DefaultReduxApi<Region, RegionApi> {
    public constructor (ApiType: new (cfg?:Configuration) => RegionApi, user:string, config?:Configuration) {
        super(RegionApi, user, config);
    }

    private simplePost : ActionThunk<Promise<Region>, MCActionAdd> = this.post;

    public post : ActionThunk<Promise<Region>, MCActionAdd> = (resource:Region) => (dispatch) => {
        return new Promise((resolve,reject) => {
            // Create geoShape first
            if (resource.geo && resource.geo.length > 0) {
                let geoShapePost : Promise<GeoShape> = dispatch(ModelCatalogApi.myCatalog.geoShape.post(resource.geo[0]));
                geoShapePost.catch(reject);
                geoShapePost.then((newGeo: GeoShape) => {
                    resource.geo = [newGeo];
                    // Then create region
                    let regionPost : Promise<Region> = dispatch(this.simplePost(resource));
                    regionPost.then(resolve);
                    regionPost.catch(reject);
                })
            } else {
                let regionPost : Promise<Region> = dispatch(this.simplePost(resource));
                regionPost.then(resolve);
                regionPost.catch(reject);
            }
        });
    }
}
