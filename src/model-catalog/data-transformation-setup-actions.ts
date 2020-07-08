import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, datatransformationsetupSetup, datatransformationsetupSetupApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC datatransformationsetupSetup]', ...args); }

export const DATA_TRANSFORMATION_SETUP_ADD = "DATA_TRANSFORMATION_SETUP_ADD";
export const DATA_TRANSFORMATION_SETUP_DELETE = "DATA_TRANSFORMATION_SETUP_DELETE";

interface MCAdatatransformationsetupSetupsAdd extends Action<'DATA_TRANSFORMATION_SETUP_ADD'> { payload: IdMap<datatransformationsetupSetup> };
interface MCAdatatransformationsetupSetupDelete extends Action<'DATA_TRANSFORMATION_SETUP_DELETE'> { uri: string };

export type ModelCatalogdatatransformationsetupSetupAction =  MCAdatatransformationsetupSetupsAdd | MCAdatatransformationsetupSetupDelete;

let datatransformationsetupSetupsPromise : Promise<IdMap<datatransformationsetupSetup>> | null = null;

export const datatransformationsetupSetupsGet: ActionThunk<Promise<IdMap<datatransformationsetupSetup>>, MCAdatatransformationsetupSetupsAdd> = () => (dispatch) => {
    if (!datatransformationsetupSetupsPromise) {
        debug('Fetching all');
        let api : datatransformationsetupSetupApi = new datatransformationsetupSetupApi();
        datatransformationsetupSetupsPromise = new Promise((resolve, reject) => {
            let req : Promise<datatransformationsetupSetup[]> = api.datatransformationsetupsGet({username: getUser()});
            req.then((resp:datatransformationsetupSetup[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<datatransformationsetupSetup>
                dispatch({
                    type: DATA_TRANSFORMATION_SETUP_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET datatransformationsetupSetups', err);
                reject(err);
            });
        });
    } else {
        debug('All datatransformationsetupSetups are already in memory or loading');
    }
    return datatransformationsetupSetupsPromise;
}

export const datatransformationsetupSetupGet: ActionThunk<Promise<datatransformationsetupSetup>, MCAdatatransformationsetupSetupsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : datatransformationsetupSetupApi = new datatransformationsetupSetupApi();
    let req : Promise<datatransformationsetupSetup> = api.datatransformationsetupsIdGet({username: getUser(), id: id});
    req.then((resp:datatransformationsetupSetup) => {
        dispatch({
            type: DATA_TRANSFORMATION_SETUP_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET datatransformationsetupSetup', err)
    });
    return req;
}

export const datatransformationsetupSetupPost: ActionThunk<Promise<datatransformationsetupSetup>, MCAdatatransformationsetupSetupsAdd> = (datatransformationsetupSetup:datatransformationsetupSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', datatransformationsetupSetup);
        let postProm = new Promise((resolve,reject) => {
            let api : datatransformationsetupSetupApi = new datatransformationsetupSetupApi(cfg);
            let req = api.datatransformationsetupsPost({user: user, datatransformationsetupSetup: datatransformationsetupSetup});
            req.then((resp:datatransformationsetupSetup) => {
                debug('Response for POST', resp);
                dispatch({
                    type: DATA_TRANSFORMATION_SETUP_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST datatransformationsetupSetup', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('datatransformationsetupSetup error'));
    }
}

export const datatransformationsetupSetupPut: ActionThunk<Promise<datatransformationsetupSetup>, MCAdatatransformationsetupSetupsAdd> = (datatransformationsetupSetup:datatransformationsetupSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', datatransformationsetupSetup);
        let api : datatransformationsetupSetupApi = new datatransformationsetupSetupApi(cfg);
        let id : string = getIdFromUri(datatransformationsetupSetup.id);
        let req : Promise<datatransformationsetupSetup> = api.datatransformationsetupsIdPut({id: id, user: user, datatransformationsetupSetup: datatransformationsetupSetup});
        req.then((resp:datatransformationsetupSetup) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: DATA_TRANSFORMATION_SETUP_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT datatransformationsetupSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const datatransformationsetupSetupDelete: ActionThunk<void, MCAdatatransformationsetupSetupDelete> = (datatransformationsetupSetup:datatransformationsetupSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', datatransformationsetupSetup);
        let api : datatransformationsetupSetupApi = new datatransformationsetupSetupApi(cfg);
        let id : string = getIdFromUri(datatransformationsetupSetup.id);
        let req : Promise<void> = api.datatransformationsetupsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: DATA_TRANSFORMATION_SETUP_DELETE,
                uri: datatransformationsetupSetup.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE datatransformationsetupSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
