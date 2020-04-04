import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, VariablePresentation, VariablePresentationApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC VariablePresentation]', ...args); }

export const VARIABLE_PRESENTATIONS_ADD = "VARIABLE_PRESENTATIONS_ADD";
export const VARIABLE_PRESENTATION_DELETE = "VARIABLE_PRESENTATION_DELETE";

interface MCAVariablePresentationsAdd extends Action<'VARIABLE_PRESENTATIONS_ADD'> { payload: IdMap<VariablePresentation> };
interface MCAVariablePresentationDelete extends Action<'VARIABLE_PRESENTATION_DELETE'> { uri: string };

export type ModelCatalogVariablePresentationAction =  MCAVariablePresentationsAdd | MCAVariablePresentationDelete;

let variablePresentationsPromise : Promise<IdMap<VariablePresentation>> | null = null;

export const variablePresentationGetProm = (uri:string) => {
    let user : string = getUser();
    let id : string = getIdFromUri(uri);
    let api : VariablePresentationApi = new VariablePresentationApi();
    return api.variablepresentationsIdGet({username: user, id: id});
}

export const variablePresentationsGet: ActionThunk<Promise<IdMap<VariablePresentation>>, MCAVariablePresentationsAdd> = () => (dispatch) => {
    if (!variablePresentationsPromise) {
        debug('Fetching all');
        let api : VariablePresentationApi = new VariablePresentationApi();
        variablePresentationsPromise = new Promise((resolve, reject) => {
            let req : Promise<VariablePresentation[]> = api.variablepresentationsGet({username: getUser()});
            req.then((resp:VariablePresentation[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<VariablePresentation>
                dispatch({
                    type: VARIABLE_PRESENTATIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET VariablePresentations', err);
                reject(err);
            });
        });
    } else {
        debug('All variablePresentations are already in memory or loading');
    }
    return variablePresentationsPromise;
}

export const variablePresentationGet: ActionThunk<Promise<VariablePresentation>, MCAVariablePresentationsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : VariablePresentationApi = new VariablePresentationApi();
    let req : Promise<VariablePresentation> = api.variablepresentationsIdGet({username: getUser(), id: id});
    req.then((resp:VariablePresentation) => {
        dispatch({
            type: VARIABLE_PRESENTATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET VariablePresentation', err);
    });
    return req;
}

export const variablePresentationPost: ActionThunk<Promise<VariablePresentation>, MCAVariablePresentationsAdd> = (variablePresentation:VariablePresentation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', variablePresentation);
        let postProm = new Promise((resolve,reject) => {
            let api : VariablePresentationApi = new VariablePresentationApi(cfg);
            let req = api.variablepresentationsPost({user: getUser(), variablePresentation: variablePresentation});
            req.then((resp:VariablePresentation) => {
                debug('Response for POST', resp);
                dispatch({
                    type: VARIABLE_PRESENTATIONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST VariablePresentation', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('VariablePresentation error'));
    }
}

export const variablePresentationPut: ActionThunk<Promise<VariablePresentation>, MCAVariablePresentationsAdd> = (variablePresentation: VariablePresentation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', variablePresentation);
        let api : VariablePresentationApi = new VariablePresentationApi(cfg);
        let id : string = getIdFromUri(variablePresentation.id);
        let req : Promise<VariablePresentation> = api.variablepresentationsIdPut({id: id, user: getUser(), variablePresentation: variablePresentation});
        req.then((resp:VariablePresentation) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: VARIABLE_PRESENTATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT VariablePresentation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const variablePresentationDelete: ActionThunk<void, MCAVariablePresentationDelete> = (variablePresentation:VariablePresentation) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', variablePresentation.id);
        let api : VariablePresentationApi = new VariablePresentationApi(cfg);
        let id : string = getIdFromUri(variablePresentation.id);
        let req : Promise<void> = api.variablepresentationsIdDelete({id: id, user: getUser()});
        req.then(() => {
            dispatch({
                type: VARIABLE_PRESENTATION_DELETE,
                uri: variablePresentation.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE VariablePresentation', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
