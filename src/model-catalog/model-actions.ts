import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Model, ModelApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) { console.log('[MC Model]', ...args); }

export const MODELS_ADD = "MODELS_ADD";
export const MODEL_DELETE = "MODEL_DELETE";

interface MCAModelsAdd extends Action<'MODELS_ADD'> { payload: IdMap<Model> };
interface MCAModelDelete extends Action<'MODEL_DELETE'> { uri: string };

export type ModelCatalogModelAction =  MCAModelsAdd | MCAModelDelete;

let modelsPromise : Promise<IdMap<Model>> | null = null;

export const modelsGet: ActionThunk<Promise<IdMap<Model>>, MCAModelsAdd> = () => (dispatch) => {
    if (!modelsPromise) {
        debug('Fetching all');
        let api : ModelApi = new ModelApi();
        modelsPromise = new Promise((resolve, reject) => {
            let req : Promise<Model[]> = api.modelsGet({username: getUser()});
            req.then((resp:Model[]) => {
                let data : IdMap<Model> = resp.reduce(idReducer, {});
                dispatch({
                    type: MODELS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Models', err);
                reject(err);
            });
        });
    } else {
        debug('All models are already in memory or loading');
    }
    return modelsPromise;
}

export const modelGet: ActionThunk<Promise<Model>, MCAModelsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ModelApi = new ModelApi();
    let req : Promise<Model> = api.modelsIdGet({username: getUser(), id: id});
    req.then((resp:Model) => {
        dispatch({
            type: MODELS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Model', err);
    });
    return req;
}

export const modelPost: ActionThunk<Promise<Model>, MCAModelsAdd> = (model:Model) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', model);
        let postProm = new Promise((resolve,reject) => {
            let api : ModelApi = new ModelApi(cfg);
            let req = api.modelsPost({user: user, model: model}); // This should be my username on prod.
            req.then((resp:Model) => {
                debug('Response for POST', resp);
                dispatch({
                    type: MODELS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Model', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Model error'));
    }
}

export const modelPut: ActionThunk<Promise<Model>, MCAModelsAdd> = (model: Model) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        if (model.dateCreated) delete model.dateCreated;
        debug('Updating', model);
        let api : ModelApi = new ModelApi(cfg);
        let id : string = getIdFromUri(model.id);
        let req : Promise<Model> = api.modelsIdPut({id: id, user: user, model: model});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: MODELS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Model', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const modelDelete: ActionThunk<void, MCAModelDelete> = (model:Model) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', model.id);
        let api : ModelApi = new ModelApi(cfg);
        let id : string = getIdFromUri(model.id);
        let req : Promise<void> = api.modelsIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: MODEL_DELETE,
                uri: model.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Model', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
