import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Parameter, ParameterApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC Parameter]', ...args); }

export const PARAMETERS_ADD = "PARAMETERS_ADD";
export const PARAMETER_DELETE = "PARAMETER_DELETE";

export interface MCAParametersAdd extends Action<'PARAMETERS_ADD'> { payload: IdMap<Parameter> };
interface MCAParameterDelete extends Action<'PARAMETER_DELETE'> { uri: string };

export type ModelCatalogParameterAction =  MCAParametersAdd | MCAParameterDelete;

let parametersPromise : Promise<IdMap<Parameter>> | null = null;

export const parametersGet: ActionThunk<Promise<IdMap<Parameter>>, MCAParametersAdd> = () => (dispatch) => {
    if (!parametersPromise) {
        parametersPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : ParameterApi = new ParameterApi();
            let req : Promise<Parameter[]> = api.parametersGet({username: DEFAULT_GRAPH});
            req.then((resp:Parameter[]) => {
                let data : IdMap<Parameter> = resp.reduce(idReducer, {});
                dispatch({
                    type: PARAMETERS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Parameters', err);
                reject(err);
            });
        });
    } else {
        debug('All parameters are already in memory or loading');
    }
    return parametersPromise;
}

export const parameterGet: ActionThunk<Promise<Parameter>, MCAParametersAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ParameterApi = new ParameterApi();
    let req : Promise<Parameter> = api.parametersIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Parameter) => {
        dispatch({
            type: PARAMETERS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Parameter', err);
    });
    return req;
}

export const parameterPost: ActionThunk<Promise<Parameter>, MCAParametersAdd> = (parameter:Parameter) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', parameter);
        if (parameter.id) {
            return Promise.reject(new Error('Cannot create Parameter, object has ID'));
        } else {
            return new Promise((resolve,reject) => {
                let api : ParameterApi = new ParameterApi(cfg);
                let req = api.parametersPost({user: DEFAULT_GRAPH, parameter: parameter}); // This should be my username on prod.
                req.then((resp:Parameter) => {
                    debug('Response for POST', resp);
                    //Parameter can have a flag 'isAdjustable'
                    resp['isAdjustable'] = parameter['isAdjustable'];
                    dispatch({
                        type: PARAMETERS_ADD,
                        payload: createIdMap(resp)
                    });
                    resolve(resp);
                });
                req.catch((err) => {
                    console.error('Error on POST Parameter', err);
                    reject(err);
                });
            });
        }
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Parameter error'));
    }
}

export const parameterPut: ActionThunk<Promise<Parameter>, MCAParametersAdd> = (parameter: Parameter) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', parameter);
        let api : ParameterApi = new ParameterApi(cfg);
        let id : string = getIdFromUri(parameter.id);
        let req : Promise<Parameter> = api.parametersIdPut({id: id, user: DEFAULT_GRAPH, parameter: parameter});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: PARAMETERS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Parameter', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const parameterDelete: ActionThunk<void, MCAParameterDelete> = (parameter:Parameter) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', parameter.id);
        let api : ParameterApi = new ParameterApi(cfg);
        let id : string = getIdFromUri(parameter.id);
        let req : Promise<void> = api.parametersIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: PARAMETER_DELETE,
                uri: parameter.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Parameter', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
