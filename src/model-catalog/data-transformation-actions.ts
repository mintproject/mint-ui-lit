import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, DataTransformation, DataTransformationApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC DataTransformation]', ...args); }

export const DATA_TRANSFORMATION_ADD = "DATA_TRANSFORMATION_ADD";
export const DATA_TRANSFORMATION_DELETE = "DATA_TRANSFORMATION_DELETE";

interface MCADataTransformationsAdd extends Action<'DATA_TRANSFORMATION_ADD'> { payload: IdMap<DataTransformation> };
interface MCADataTransformationDelete extends Action<'DATA_TRANSFORMATION_DELETE'> { uri: string };

export type ModelCatalogDataTransformationAction =  MCADataTransformationsAdd | MCADataTransformationDelete;

let dataTransformationsPromise : Promise<IdMap<DataTransformation>> | null = null;

export const dataTransformationsGet: ActionThunk<Promise<IdMap<DataTransformation>>, MCADataTransformationsAdd> = () => (dispatch) => {
    if (!dataTransformationsPromise) {
        debug('Fetching all');
        let api : DataTransformationApi = new DataTransformationApi();
        dataTransformationsPromise = new Promise((resolve, reject) => {
            let req : Promise<DataTransformation[]> = api.datatransformationsGet({username: getUser()});
            req.then((resp:DataTransformation[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<DataTransformation>
                dispatch({
                    type: DATA_TRANSFORMATION_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET DataTransformations', err);
                reject(err);
            });
        });
    } else {
        debug('All dataTransformations are already in memory or loading');
    }
    return dataTransformationsPromise;
}

export const dataTransformationGet: ActionThunk<Promise<DataTransformation>, MCADataTransformationsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : DataTransformationApi = new DataTransformationApi();
    let req : Promise<DataTransformation> = api.datatransformationsIdGet({username: getUser(), id: id});
    req.then((resp:DataTransformation) => {
        dispatch({
            type: DATA_TRANSFORMATION_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET DataTransformation', err)
    });
    return req;
}

export const dataTransformationPost: ActionThunk<Promise<DataTransformation>, MCADataTransformationsAdd> = (dataTransformation:DataTransformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', dataTransformation);
        let postProm = new Promise((resolve,reject) => {
            let api : DataTransformationApi = new DataTransformationApi(cfg);
            let req = api.datatransformationsPost({user: user, dataTransformation: dataTransformation});
            req.then((resp:DataTransformation) => {
                debug('Response for POST', resp);
                dispatch({
                    type: DATA_TRANSFORMATION_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST DataTransformation', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('DataTransformation error'));
    }
}

export const dataTransformationPut: ActionThunk<Promise<DataTransformation>, MCADataTransformationsAdd> = (dataTransformation:DataTransformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', dataTransformation);
        let api : DataTransformationApi = new DataTransformationApi(cfg);
        let id : string = getIdFromUri(dataTransformation.id);
        let req : Promise<DataTransformation> = api.datatransformationsIdPut({id: id, user: user, dataTransformation: dataTransformation});
        req.then((resp:DataTransformation) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: DATA_TRANSFORMATION_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT DataTransformation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const dataTransformationDelete: ActionThunk<void, MCADataTransformationDelete> = (dataTransformation:DataTransformation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', dataTransformation);
        let api : DataTransformationApi = new DataTransformationApi(cfg);
        let id : string = getIdFromUri(dataTransformation.id);
        let req : Promise<void> = api.datatransformationsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: DATA_TRANSFORMATION_DELETE,
                uri: dataTransformation.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE DataTransformation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
