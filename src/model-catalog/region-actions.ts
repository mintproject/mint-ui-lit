import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, Region, RegionApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('[MC Region]', ...args); }

export const ALL_REGIONS = 'ALL_REGIONS'

export const REGIONS_GET = "REGIONS_GET";
interface MCARegionsGet extends Action<'REGIONS_GET'> { payload: any };
export const regionsGet: ActionCreator<ModelCatalogRegionThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_REGIONS] || state.modelCatalog.loading[ALL_REGIONS])) {
        console.log('All regions are already in memory or loading')
        return;
    }

    debug('Fetching all region');
    dispatch({type: START_LOADING, id: ALL_REGIONS});

    let api : RegionApi = new RegionApi();
    let req = api.regionsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: REGIONS_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_REGIONS});
    });
    req.catch((err) => {console.log('Error on GET regions', err)});
}

export const REGION_GET = "REGION_GET";
interface MCARegionGet extends Action<'REGION_GET'> { payload: any };
export const regionGet: ActionCreator<ModelCatalogRegionThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching region', uri);
    let id : string = uri.split('/').pop();
    let api : RegionApi = new RegionApi();
    let req = api.regionsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: REGION_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getRegion', err)});
}

export const REGION_POST = "REGION_POST";
interface MCARegionPost extends Action<'REGION_POST'> { payload: any };
export const regionPost: ActionCreator<ModelCatalogRegionThunkResult> = (region:Region, identifier:string) => (dispatch) => {
    debug('creating new region', region);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        region.id = undefined;
        let api : RegionApi = new RegionApi(cfg);
        let req = api.regionsPost({user: DEFAULT_GRAPH, region: region}); // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for POST region:', resp);
            //Its returning the ID without the prefix
            let uri = PREFIX_URI + resp.id;
            let data = {};
            data[uri] = resp;
            resp.id = uri;
            dispatch({
                type: REGION_GET,
                payload: data
            });
            dispatch({type: END_POST, id: identifier, uri: uri});
        });
        req.catch((err) => {console.log('Error on POST region', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const REGION_PUT = "REGION_PUT";
interface MCARegionPut extends Action<'REGION_PUT'> { payload: any };
export const regionPut: ActionCreator<ModelCatalogRegionThunkResult> = ( region: Region ) => (dispatch) => {
    debug('updating region', region.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: region.id});
        let api : RegionApi = new RegionApi(cfg);
        let id : string = region.id.split('/').pop();
        let req = api.regionsIdPut({id: id, user: DEFAULT_GRAPH, region: region}); // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for PUT region:', resp);
            let data = {};
            data[region.id] = resp;
            dispatch({
                type: REGION_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: region.id});
        });
        req.catch((err) => {console.log('Error on PUT region', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const REGION_DELETE = "REGION_DELETE";
interface MCARegionDelete extends Action<'REGION_DELETE'> { uri: string };
export const regionDelete: ActionCreator<ModelCatalogRegionThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting region', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : RegionApi = new RegionApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.regionsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            dispatch({
                type: REGION_DELETE,
                uri: uri
            });
            /*console.log('Response for DELETE region:', resp);
            let data = {};
            data[region.id] = resp;
            dispatch({
                type: REGION_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: region.id});*/
        });
        req.catch((err) => {console.log('Error on DELETE region', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogRegionAction =  MCACommon | MCARegionsGet | MCARegionGet | MCARegionPost | MCARegionPut |
                                        MCARegionDelete;
type ModelCatalogRegionThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogRegionAction>;
