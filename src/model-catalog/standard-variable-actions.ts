import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, StandardVariable, StandardVariableApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC StandardVariable]', ...args); }

export const STANDARD_VARIABLE_ADD = "STANDARD_VARIABLE_ADD";
export const STANDARD_VARIABLE_DELETE = "STANDARD_VARIABLE_DELETE";

interface MCAStandardVariablesAdd extends Action<'STANDARD_VARIABLE_ADD'> { payload: IdMap<StandardVariable> };
interface MCAStandardVariableDelete extends Action<'STANDARD_VARIABLE_DELETE'> { uri: string };

export type ModelCatalogStandardVariableAction =  MCAStandardVariablesAdd | MCAStandardVariableDelete;

let standardVariablesPromise : Promise<IdMap<StandardVariable>> | null = null;

export const standardVariablesGet: ActionThunk<Promise<IdMap<StandardVariable>>, MCAStandardVariablesAdd> = () => (dispatch) => {
    if (!standardVariablesPromise) {
        debug('Fetching all');
        let api : StandardVariableApi = new StandardVariableApi();
        standardVariablesPromise = new Promise((resolve, reject) => {
            let req : Promise<StandardVariable[]> = api.standardvariablesGet({username: getUser(), perPage: 200});
            req.then((resp:StandardVariable[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<StandardVariable>
                dispatch({
                    type: STANDARD_VARIABLE_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET StandardVariables', err);
                reject(err);
            });
        });
    } else {
        debug('All standardVariables are already in memory or loading');
    }
    return standardVariablesPromise;
}

export const standardVariableGet: ActionThunk<Promise<StandardVariable>, MCAStandardVariablesAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : StandardVariableApi = new StandardVariableApi();
    let req : Promise<StandardVariable> = api.standardvariablesIdGet({username: getUser(), id: id});
    req.then((resp:StandardVariable) => {
        dispatch({
            type: STANDARD_VARIABLE_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET StandardVariable', err)
    });
    return req;
}

export const standardVariablePost: ActionThunk<Promise<StandardVariable>, MCAStandardVariablesAdd> = (standardVariable:StandardVariable) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', standardVariable);
        let postProm = new Promise((resolve,reject) => {
            let api : StandardVariableApi = new StandardVariableApi(cfg);
            let req = api.standardvariablesPost({user: user, standardVariable: standardVariable});
            req.then((resp:StandardVariable) => {
                debug('Response for POST', resp);
                dispatch({
                    type: STANDARD_VARIABLE_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST StandardVariable', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('StandardVariable error'));
    }
}

export const standardVariablePut: ActionThunk<Promise<StandardVariable>, MCAStandardVariablesAdd> = (standardVariable:StandardVariable) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', standardVariable);
        let api : StandardVariableApi = new StandardVariableApi(cfg);
        let id : string = getIdFromUri(standardVariable.id);
        let req : Promise<StandardVariable> = api.standardvariablesIdPut({id: id, user: user, standardVariable: standardVariable});
        req.then((resp:StandardVariable) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: STANDARD_VARIABLE_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT StandardVariable', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const standardVariableDelete: ActionThunk<void, MCAStandardVariableDelete> = (standardVariable:StandardVariable) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', standardVariable);
        let api : StandardVariableApi = new StandardVariableApi(cfg);
        let id : string = getIdFromUri(standardVariable.id);
        let req : Promise<void> = api.standardvariablesIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: STANDARD_VARIABLE_DELETE,
                uri: standardVariable.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE StandardVariable', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
