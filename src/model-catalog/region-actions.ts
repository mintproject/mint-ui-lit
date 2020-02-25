import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Region, RegionApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser,
         DEFAULT_GRAPH, geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Region]', ...args); }

export const REGIONS_ADD = "REGIONS_ADD";
export const REGION_DELETE = "REGION_DELETE";

interface MCARegionsAdd extends Action<'REGIONS_ADD'> { payload: IdMap<Region> };
interface MCARegionDelete extends Action<'REGION_DELETE'> { uri: string };

export type ModelCatalogRegionAction =  MCARegionsAdd | MCARegionDelete;

let regionsPromise : Promise<IdMap<Region>> | null = null;

export const regionsGet: ActionThunk<Promise<IdMap<Region>>, MCARegionsAdd> = () => (dispatch) => {
    if (!regionsPromise) {
        debug('Fetching all');
        let api : RegionApi = new RegionApi();
        regionsPromise = new Promise((resolve, reject) => {
            let req : Promise<Region[]> = api.regionsGet({username: DEFAULT_GRAPH});
            req.then((resp:Region[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Region>
                dispatch({
                    type: REGIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
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
    let id : string = getIdFromUri(uri);
    let api : RegionApi = new RegionApi();
    let req : Promise<Region> = api.regionsIdGet({username: DEFAULT_GRAPH, id: id});
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
                    let req = api.regionsPost({user: DEFAULT_GRAPH, region: region});
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
        let req : Promise<Region> = api.regionsIdPut({id: id, user: DEFAULT_GRAPH, region: region});
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
        let req : Promise<void> = api.regionsIdDelete({id: id, user: DEFAULT_GRAPH});
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
