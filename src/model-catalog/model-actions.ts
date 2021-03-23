import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Model, ModelApi, CoupledModel, CoupledModelApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) { console.log('[MC Model]', ...args); }

export const MODELS_ADD = "MODELS_ADD";
export const MODEL_DELETE = "MODEL_DELETE";

interface MCAModelsAdd extends Action<'MODELS_ADD'> { payload: IdMap<Model> };
interface MCAModelDelete extends Action<'MODEL_DELETE'> { uri: string };

export type ModelCatalogModelAction =  MCAModelsAdd | MCAModelDelete;

const isCoupledModel = (t:string) => t === "https://w3id.org/okn/o/sdm#CoupledModel" || t === "CoupledModel";

let modelsPromise : Promise<IdMap<Model>> | null = null;

export const modelsGet: ActionThunk<Promise<IdMap<Model>>, MCAModelsAdd> = () => (dispatch) => {
    if (!modelsPromise) {
        debug('Fetching all');
        let api : ModelApi = new ModelApi();
        modelsPromise = new Promise((resolve, reject) => {
            let req : Promise<Model[]> = api.modelsGet({username: getUser()});
            req.then((resp:Model[]) => {
                let realModels : Model[] = resp.filter((r:Model) => !r.type.some(isCoupledModel));
                let data : IdMap<Model> = realModels.reduce(idReducer, {});
                dispatch({
                    type: MODELS_ADD,
                    payload: data
                });
                // If some model is a coupled model, get all coupled models.
                if (resp.length != realModels.length) {
                    console.log("Getting coupled models!");
                    let api2 : CoupledModelApi = new CoupledModelApi();
                    let req2 : Promise<CoupledModel[]> = api2.coupledmodelsGet({username: getUser()});
                    req2.then((resp2:CoupledModel[]) => {
                        let data2 : IdMap<CoupledModel> = resp2.reduce(idReducer, {});
                        dispatch({
                            type: MODELS_ADD,
                            payload: data2
                        });
                        resolve({...data, ...data2});
                    });
                    req2.catch(reject);
                } else {
                    resolve(data);
                }
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
    //TODO: how to get coupledModel?
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
            let req : Promise<Model|CoupledModel>;

            if (model.type && model.type.some((t:string) => 
                    t === "https://w3id.org/okn/o/sdm#CoupledModel" || t === "CoupledModel")) {
                let api : CoupledModelApi = new CoupledModelApi(cfg);
                req = api.coupledmodelsPost({user: user, coupledModel: model});
            } else {
                let api : ModelApi = new ModelApi(cfg);
                req = api.modelsPost({user: user, model: model});
            }

            //let api : ModelApi = new ModelApi(cfg);
            //let req = api.modelsPost({user: user, model: model}); // This should be my username on prod.
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
        //if (model.dateCreated) delete model.dateCreated;
        debug('Updating', model);
        let id : string = getIdFromUri(model.id);
        let req : Promise<Model|CoupledModel>;

        if (model.type && model.type.some(isCoupledModel)) {
            let api : CoupledModelApi = new CoupledModelApi(cfg);
            req = api.coupledmodelsIdPut({id: id, user: user, coupledModel: model});
        } else {
            let api : ModelApi = new ModelApi(cfg);
            req = api.modelsIdPut({id: id, user: user, model: model});
        }

        //let api : ModelApi = new ModelApi(cfg);
        //let req : Promise<Model> = api.modelsIdPut({id: id, user: user, model: model});
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
