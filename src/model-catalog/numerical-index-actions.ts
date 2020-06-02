import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, NumericalIndex, NumericalIndexApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC NumericalIndex]', ...args); }

export const NUMERICAL_INDEX_ADD = "NUMERICAL_INDEX_ADD";
export const NUMERICAL_INDEX_DELETE = "NUMERICAL_INDEX_DELETE";

interface MCANumericalIndexsAdd extends Action<'NUMERICAL_INDEX_ADD'> { payload: IdMap<NumericalIndex> };
interface MCANumericalIndexDelete extends Action<'NUMERICAL_INDEX_DELETE'> { uri: string };

export type ModelCatalogNumericalIndexAction =  MCANumericalIndexsAdd | MCANumericalIndexDelete;

let numericalIndexsPromise : Promise<IdMap<NumericalIndex>> | null = null;

export const numericalIndexsGet: ActionThunk<Promise<IdMap<NumericalIndex>>, MCANumericalIndexsAdd> = () => (dispatch) => {
    if (!numericalIndexsPromise) {
        debug('Fetching all');
        let api : NumericalIndexApi = new NumericalIndexApi();
        numericalIndexsPromise = new Promise((resolve, reject) => {
            let req : Promise<NumericalIndex[]> = api.numericalindexsGet({username: getUser()});
            req.then((resp:NumericalIndex[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<NumericalIndex>
                dispatch({
                    type: NUMERICAL_INDEX_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET NumericalIndexs', err);
                reject(err);
            });
        });
    } else {
        debug('All numericalIndexs are already in memory or loading');
    }
    return numericalIndexsPromise;
}

export const numericalIndexGet: ActionThunk<Promise<NumericalIndex>, MCANumericalIndexsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : NumericalIndexApi = new NumericalIndexApi();
    let req : Promise<NumericalIndex> = api.numericalindexsIdGet({username: getUser(), id: id});
    req.then((resp:NumericalIndex) => {
        dispatch({
            type: NUMERICAL_INDEX_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET NumericalIndex', err)
    });
    return req;
}

export const numericalIndexPost: ActionThunk<Promise<NumericalIndex>, MCANumericalIndexsAdd> = (numericalIndex:NumericalIndex) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', numericalIndex);
        let postProm = new Promise((resolve,reject) => {
            let api : NumericalIndexApi = new NumericalIndexApi(cfg);
            let req = api.numericalindexsPost({user: user, numericalIndex: numericalIndex});
            req.then((resp:NumericalIndex) => {
                debug('Response for POST', resp);
                dispatch({
                    type: NUMERICAL_INDEX_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST NumericalIndex', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('NumericalIndex error'));
    }
}

export const numericalIndexPut: ActionThunk<Promise<NumericalIndex>, MCANumericalIndexsAdd> = (numericalIndex:NumericalIndex) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', numericalIndex);
        let api : NumericalIndexApi = new NumericalIndexApi(cfg);
        let id : string = getIdFromUri(numericalIndex.id);
        let req : Promise<NumericalIndex> = api.numericalindexsIdPut({id: id, user: user, numericalIndex: numericalIndex});
        req.then((resp:NumericalIndex) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: NUMERICAL_INDEX_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT NumericalIndex', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const numericalIndexDelete: ActionThunk<void, MCANumericalIndexDelete> = (numericalIndex:NumericalIndex) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', numericalIndex);
        let api : NumericalIndexApi = new NumericalIndexApi(cfg);
        let id : string = getIdFromUri(numericalIndex.id);
        let req : Promise<void> = api.numericalindexsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: NUMERICAL_INDEX_DELETE,
                uri: numericalIndex.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE NumericalIndex', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
