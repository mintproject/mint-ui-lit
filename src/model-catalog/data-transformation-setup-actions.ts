import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, DataTransformationSetup, DataTransformationSetupApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC dataTransformationSetup]', ...args); }

export const DATA_TRANSFORMATION_SETUP_ADD = "DATA_TRANSFORMATION_SETUP_ADD";
export const DATA_TRANSFORMATION_SETUP_DELETE = "DATA_TRANSFORMATION_SETUP_DELETE";

interface MCAdataTransformationSetupsAdd extends Action<'DATA_TRANSFORMATION_SETUP_ADD'> { payload: IdMap<DataTransformationSetup> };
interface MCAdataTransformationSetupDelete extends Action<'DATA_TRANSFORMATION_SETUP_DELETE'> { uri: string };

export type ModelCatalogDataTransformationSetupAction = MCAdataTransformationSetupsAdd | MCAdataTransformationSetupDelete;

let dataTransformationSetupsPromise : Promise<IdMap<DataTransformationSetup>> | null = null;

export const dataTransformationSetupsGet: ActionThunk<Promise<IdMap<DataTransformationSetup>>, MCAdataTransformationSetupsAdd> = () => (dispatch) => {
    if (!dataTransformationSetupsPromise) {
        debug('Fetching all');
        let api : DataTransformationSetupApi = new DataTransformationSetupApi();
        dataTransformationSetupsPromise = new Promise((resolve, reject) => {
            let req : Promise<DataTransformationSetup[]> = api.datatransformationsetupsGet({username: getUser()});
            req.then((resp:DataTransformationSetup[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<DataTransformationSetup>
                dispatch({
                    type: DATA_TRANSFORMATION_SETUP_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET dataTransformationSetups', err);
                reject(err);
            });
        });
    } else {
        debug('All dataTransformationSetups are already in memory or loading');
    }
    return dataTransformationSetupsPromise;
}

export const dataTransformationSetupGet: ActionThunk<Promise<DataTransformationSetup>, MCAdataTransformationSetupsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : DataTransformationSetupApi = new DataTransformationSetupApi();
    let req : Promise<DataTransformationSetup> = api.datatransformationsetupsIdGet({username: getUser(), id: id});
    req.then((resp:DataTransformationSetup) => {
        dispatch({
            type: DATA_TRANSFORMATION_SETUP_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET dataTransformationSetup', err)
    });
    return req;
}

export const dataTransformationSetupPost: ActionThunk<Promise<DataTransformationSetup>, MCAdataTransformationSetupsAdd> = (dataTransformationSetup:DataTransformationSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', dataTransformationSetup);
        let postProm = new Promise((resolve,reject) => {
            let api : DataTransformationSetupApi = new DataTransformationSetupApi(cfg);
            let req = api.datatransformationsetupsPost({user: user, dataTransformationSetup: dataTransformationSetup});
            req.then((resp:DataTransformationSetup) => {
                debug('Response for POST', resp);
                dispatch({
                    type: DATA_TRANSFORMATION_SETUP_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST dataTransformationSetup', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('dataTransformationSetup error'));
    }
}

export const dataTransformationSetupPut: ActionThunk<Promise<DataTransformationSetup>, MCAdataTransformationSetupsAdd> = (dataTransformationSetup:DataTransformationSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', dataTransformationSetup);
        let api : DataTransformationSetupApi = new DataTransformationSetupApi(cfg);
        let id : string = getIdFromUri(dataTransformationSetup.id);
        let req : Promise<DataTransformationSetup> = api.datatransformationsetupsIdPut({id: id, user: user, dataTransformationSetup: dataTransformationSetup});
        req.then((resp:DataTransformationSetup) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: DATA_TRANSFORMATION_SETUP_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT dataTransformationSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const dataTransformationSetupDelete: ActionThunk<void, MCAdataTransformationSetupDelete> = (dataTransformationSetup:DataTransformationSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', dataTransformationSetup);
        let api : DataTransformationSetupApi = new DataTransformationSetupApi(cfg);
        let id : string = getIdFromUri(dataTransformationSetup.id);
        let req : Promise<void> = api.datatransformationsetupsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: DATA_TRANSFORMATION_SETUP_DELETE,
                uri: dataTransformationSetup.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE dataTransformationSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
