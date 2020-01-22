import { Action } from "redux";

import { Configuration, Region, RegionApi, GeoShape, GeoShapeApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri,
         idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH, GEO_SHAPE_GET, MCAGeoShapeGet
         } from './actions';

import { IdMap } from 'app/reducers'

function debug (...args: any[]) { console.log('[MC Region]', ...args); }

export const REGIONS_ADD = "REGIONS_ADD";
export const REGION_DELETE = "REGION_DELETE";

interface MCARegionsAdd extends Action<'REGIONS_ADD'> { payload: IdMap<Region> };
interface MCARegionDelete extends Action<'REGION_DELETE'> { uri: string };

export type ModelCatalogRegionAction =  MCARegionsAdd | MCARegionDelete;

let regionsPromise : Promise<Region[]> | null = null;

export const regionsGet: ActionThunk<Promise<Region[]>, MCARegionsAdd> = () => (dispatch) => {
    if (!regionsPromise) {
        debug('Fetching all');

        let api : RegionApi = new RegionApi();
        regionsPromise = api.regionsGet({username: DEFAULT_GRAPH});
        regionsPromise.then((data:Region[]) => {
            dispatch({
                type: REGIONS_ADD,
                payload: data.reduce(idReducer, {}) as IdMap<Region>
            });
        });
        regionsPromise.catch((err) => {
            console.error('Error on GET Regions', err);
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
        let data : IdMap<Region> = {}; //Change these two lines into idreducer
        data[uri] = resp;
        dispatch({
            type: REGIONS_ADD,
            payload: data
        });
    });
    req.catch((err) => {
        console.log('Error on GET', err)
    });
    return req;
}

export const regionPost: ActionThunk<Promise<Region>, MCARegionsAdd | MCAGeoShapeGet> = (region:Region) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        debug('Creating new', region);
        let postProm = new Promise((resolve,reject) => {
            /* Create GeoShape first (only one) */
            let geo = region.geo[0];
            geo['id'] = undefined;
            let geoApi : GeoShapeApi = new GeoShapeApi(cfg);
            let geoReq : Promise<GeoShape> = geoApi.geoshapesPost({user: DEFAULT_GRAPH, geoShape: geo})
            geoReq.then((resp:GeoShape) => {
                console.log('Response for POST geoShape:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: GEO_SHAPE_GET,
                    payload: data
                });
                region.geo = [resp];

                // Now create the region:
                region.id = undefined;
                let api : RegionApi = new RegionApi(cfg);
                let req = api.regionsPost({user: DEFAULT_GRAPH, region: region}); // This should be my username on prod.
                req.then((resp) => {
                    debug('Response for POST', resp);
                    //Its returning the ID without the prefix
                    let uri = PREFIX_URI + resp.id;
                    let data = {};
                    data[uri] = resp;
                    resp.id = uri;
                    dispatch({
                        type: REGIONS_ADD,
                        payload: data
                    });
                    resolve(resp);
                });
                req.catch((err) => {console.error('Error on POST Region', err); reject(err)});
            });
            geoReq.catch((err) => {console.error('Error on POST GeoShape', err); reject(err)})
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Region error'));
    }
}

export const regionPut: ActionThunk<Promise<Region>, MCARegionsAdd> = ( region: Region ) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        debug('Updating region', region);
        let api : RegionApi = new RegionApi(cfg);
        let id : string = getIdFromUri(region.id);
        let req : Promise<Region> = api.regionsIdPut({id: id, user: DEFAULT_GRAPH, region: region});
        req.then((resp) => {
            console.log('Response for PUT region:', resp);
            let data = {};
            data[region.id] = resp;
            dispatch({
                type: REGIONS_ADD,
                payload: data
            });
        });
        req.catch((err) => {console.error('Error on PUT region', err)});
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const regionDelete: ActionThunk<void, MCARegionDelete> = ( uri: string ) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        debug('deleting region', uri);
        let api : RegionApi = new RegionApi(cfg);
        let id : string = uri.split('/').pop();
        let req : Promise<void> = api.regionsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            dispatch({
                type: REGION_DELETE,
                uri: uri
            });
        });
        req.catch((err) => {console.log('Error on DELETE region', err)});
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
