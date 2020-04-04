import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Region, RegionApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Region]', ...args); }

export const REGIONS_ADD = "REGIONS_ADD";
export const REGION_DELETE = "REGION_DELETE";

interface MCARegionsAdd extends Action<'REGIONS_ADD'> { payload: IdMap<Region> };
interface MCARegionDelete extends Action<'REGION_DELETE'> { uri: string };

export type ModelCatalogRegionAction =  MCARegionsAdd | MCARegionDelete;

let regionsPromise : Promise<IdMap<Region>> | null = null;

export const regionsGet: ActionThunk<Promise<IdMap<Region>>, MCARegionsAdd> = () => (dispatch) => {
    if (!regionsPromise) {
        regionsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let user : string = getUser();
            let api : RegionApi = new RegionApi();
            let req2 : Promise<Region[]> = api.regionsGet({username: user});

            let promises : Promise<Region[]>[] = [req2];
            promises.forEach((p:Promise<Region[]>, i:number) => {
                p.then((resp:Region[]) => dispatch({ type: REGIONS_ADD, payload: resp.reduce(idReducer, {}) as IdMap<Region> }));
                p.catch((err) => console.error('Error on GET Regions' + (i==0?'System':'User'), err) );
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<Region> = {};
                values.forEach((regions:Region[]) => {
                    data = regions.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET Regions', err);
                reject(err);
            });
        });
    } else {
        debug('All regions are already in memory or loading');
    }
    return regionsPromise;
}

export const regionGet: ActionThunk<Promise<Region>, MCARegionsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let user : string = getUser();
    let id : string = getIdFromUri(uri);
    let api : RegionApi = new RegionApi();
    let req : Promise<Region> = api.regionsIdGet({username: user, id: id});
    req.then((resp:Region) => {
        dispatch({
            type: REGIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Region', err)
    });
    return req;
}

export const regionPost: ActionThunk<Promise<Region>, MCARegionsAdd> = (region:Region) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', region);
        return new Promise((resolve,reject) => {
            if (!region.geo || region.geo.length == 0 || (region.geo[0] as GeoShape).id) {
                reject(new Error('This Region has no valid GeoShape'));
            } else {
                let geoReq = dispatch(geoShapePost(region.geo[0]));
                geoReq.catch((error) => {
                    console.error('Can not create GeoShape of', region);
                    reject(error);
                });
                geoReq.then((geo:GeoShape) => {
                    region.geo = [geo];
                    let api : RegionApi = new RegionApi(cfg);
                    let req = api.regionsPost({user: user, region: region});
                    req.then((resp:Region) => {
                        debug('Response for POST', resp);
                        dispatch({
                            type: REGIONS_ADD,
                            payload: createIdMap(resp)
                        });
                        resolve(resp);
                    });
                    req.catch((err) => {
                        console.error('Error on POST Region', err);
                        reject(err);
                    });
                });
            }
        });
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Region error'));
    }
}

export const regionPut: ActionThunk<Promise<Region>, MCARegionsAdd> = (region:Region) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', region);
        let api : RegionApi = new RegionApi(cfg);
        let id : string = getIdFromUri(region.id);
        let req : Promise<Region> = api.regionsIdPut({id: id, user: user, region: region});
        req.then((resp:Region) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: REGIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Region', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const regionDelete: ActionThunk<void, MCARegionDelete> = (region:Region) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', region);
        if (region.geo && region.geo.length > 0) {
            dispatch(geoShapeDelete(region.geo[0]));
        }
        let api : RegionApi = new RegionApi(cfg);
        let id : string = getIdFromUri(region.id);
        let req : Promise<void> = api.regionsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: REGION_DELETE,
                uri: region.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Region', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
