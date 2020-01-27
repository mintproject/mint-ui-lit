import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Grid, GridApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC Grid]', ...args); }

export const GRIDS_ADD = "GRIDS_ADD";
export const GRID_DELETE = "GRID_DELETE";

interface MCAGridsAdd extends Action<'GRIDS_ADD'> { payload: IdMap<Grid> };
interface MCAGridDelete extends Action<'GRID_DELETE'> { uri: string };

export type ModelCatalogGridAction =  MCAGridsAdd | MCAGridDelete;

let gridsPromise : Promise<IdMap<Grid>> | null = null;

export const gridsGet: ActionThunk<Promise<IdMap<Grid>>, MCAGridsAdd> = () => (dispatch) => {
    if (!gridsPromise) {
        gridsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : GridApi = new GridApi();
            let req : Promise<Grid[]> = api.gridsGet({username: DEFAULT_GRAPH});
            req.then((resp:Grid[]) => {
                let data : IdMap<Grid> = resp.reduce(idReducer, {});
                dispatch({
                    type: GRIDS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Grids', err);
                reject(err);
            });
        });
    } else {
        debug('All grids are already in memory or loading');
    }
    return gridsPromise;
}

export const gridGet: ActionThunk<Promise<Grid>, MCAGridsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : GridApi = new GridApi();
    let req : Promise<Grid> = api.gridsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Grid) => {
        dispatch({
            type: GRIDS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Grid', err);
    });
    return req;
}

export const gridPost: ActionThunk<Promise<Grid>, MCAGridsAdd> = (grid:Grid) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', grid);
        let postProm = new Promise((resolve,reject) => {
            let api : GridApi = new GridApi(cfg);
            let req = api.gridsPost({user: DEFAULT_GRAPH, grid: grid}); // This should be my username on prod.
            req.then((resp:Grid) => {
                debug('Response for POST', resp);
                dispatch({
                    type: GRIDS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Grid', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Grid error'));
    }
}

export const gridPut: ActionThunk<Promise<Grid>, MCAGridsAdd> = (grid: Grid) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', grid);
        let api : GridApi = new GridApi(cfg);
        let id : string = getIdFromUri(grid.id);
        let req : Promise<Grid> = api.gridsIdPut({id: id, user: DEFAULT_GRAPH, grid: grid});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: GRIDS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Grid', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const gridDelete: ActionThunk<void, MCAGridDelete> = (grid:Grid) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', grid.id);
        let api : GridApi = new GridApi(cfg);
        let id : string = getIdFromUri(grid.id);
        let req : Promise<void> = api.gridsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: GRID_DELETE,
                uri: grid.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Grid', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
