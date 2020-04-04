import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Parameter, ParameterApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

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
            let user : string = getUser();
            let req2 : Promise<Parameter[]> = api.parametersGet({username: user});

            let promises : Promise<Parameter[]>[] = [req2];
            promises.forEach((p:Promise<Parameter[]>, i:number) => {
                p.then((resp:Parameter[]) => dispatch({ type: PARAMETERS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET Parameters ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<Parameter> = {};
                values.forEach((params:Parameter[]) => {
                    data = params.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
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
    let user : string = getUser();
    let api : ParameterApi = new ParameterApi();
    let req : Promise<Parameter> = api.parametersIdGet({username: user, id: id});
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
                let req = api.parametersPost({user: user, parameter: parameter}); // This should be my username on prod.
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
        let req : Promise<Parameter> = api.parametersIdPut({id: id, user: user, parameter: parameter});
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
        let req : Promise<void> = api.parametersIdDelete({id: id, user: user}); // This should be my username on prod.
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
