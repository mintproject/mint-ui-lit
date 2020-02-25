import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, ModelConfigurationSetup, ModelConfigurationSetupApi, ModelConfiguration,
         ConfigurationSetupApi, Parameter, DatasetSpecification } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, fixObjects,
         DEFAULT_GRAPH, parameterPost, datasetSpecificationPost, modelConfigurationPut } from './actions';

function debug (...args: any[]) { }// console.log('[MC ModelConfigurationSetup]', ...args); }

export const MODEL_CONFIGURATION_SETUPS_ADD = "MODEL_CONFIGURATION_SETUPS_ADD";
export const MODEL_CONFIGURATION_SETUP_DELETE = "MODEL_CONFIGURATION_SETUP_DELETE";

interface MCAModelConfigurationSetupsAdd extends Action<'MODEL_CONFIGURATION_SETUPS_ADD'> { payload: IdMap<ModelConfigurationSetup> };
interface MCAModelConfigurationSetupDelete extends Action<'MODEL_CONFIGURATION_SETUP_DELETE'> { uri: string };

export type ModelCatalogModelConfigurationSetupAction =  MCAModelConfigurationSetupsAdd | MCAModelConfigurationSetupDelete;

let modelConfigurationSetupsPromise : Promise<IdMap<ModelConfigurationSetup>> | null = null;

export const modelConfigurationSetupsGet: ActionThunk<Promise<IdMap<ModelConfigurationSetup>>, MCAModelConfigurationSetupsAdd> = () => (dispatch) => {
    if (!modelConfigurationSetupsPromise) {
        modelConfigurationSetupsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
            let req : Promise<ModelConfigurationSetup[]> = api.modelconfigurationsetupsGet({username: DEFAULT_GRAPH});
            req.then((resp:ModelConfigurationSetup[]) => {
                let data : IdMap<ModelConfigurationSetup> = resp.reduce(idReducer, {});
                dispatch({
                    type: MODEL_CONFIGURATION_SETUPS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET ModelConfigurationSetups', err);
                reject(err);
            });
        });
    } else {
        debug('All modelConfigurationSetups are already in memory or loading');
    }
    return modelConfigurationSetupsPromise;
}

export const modelConfigurationSetupGet: ActionThunk<Promise<ModelConfigurationSetup>, MCAModelConfigurationSetupsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:ModelConfigurationSetup) => {
        dispatch({
            type: MODEL_CONFIGURATION_SETUPS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET ModelConfigurationSetup', err);
    });
    return req;
}

export const modelConfigurationSetupPost: ActionThunk<Promise<ModelConfigurationSetup>, MCAModelConfigurationSetupsAdd> = 
        (modelConfigurationSetup:ModelConfigurationSetup, modelConfiguration:ModelConfiguration) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', modelConfigurationSetup);
        if (modelConfigurationSetup.id) {
            return Promise.reject(new Error('Cannot create ModelConfigurationSetup, object has ID'));
        } else {
            return new Promise((resolve,reject) => {
                // Parameters
                let paramProm : Promise<Parameter>[] = modelConfigurationSetup.hasParameter
                        .map((parameter: Parameter) => dispatch(parameterPost(parameter)));
                Promise.all(paramProm).then((parameters:Parameter[]) => {
                    modelConfigurationSetup.hasParameter = parameters;
                    modelConfigurationSetup.adjustableParameter = parameters.filter(p => p["isAdjustable"]);
                });

                //Inputs
                let dsProm : Promise<DatasetSpecification>[] = modelConfigurationSetup.hasInput
                        .map((input:DatasetSpecification) => dispatch(datasetSpecificationPost(input)));
                Promise.all(dsProm).then((dss:DatasetSpecification[]) => {
                    modelConfigurationSetup.hasInput = dss;
                });

                Promise.all(paramProm.concat(dsProm)).then((v) => {
                    modelConfigurationSetup.hasOutput = fixObjects(modelConfigurationSetup.hasOutput);
                    //Create setup and update config
                    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
                    let req = api.modelconfigurationsetupsPost({user: DEFAULT_GRAPH, modelConfigurationSetup: modelConfigurationSetup});
                    req.then((resp:ModelConfigurationSetup) => {
                        debug('Response for POST', resp);
                        dispatch({
                            type: MODEL_CONFIGURATION_SETUPS_ADD,
                            payload: createIdMap(resp)
                        });

                        if (modelConfiguration.hasSetup) {
                            modelConfiguration.hasSetup.push(resp)
                        } else {
                            modelConfiguration.hasSetup = [resp]
                        }

                        dispatch(modelConfigurationPut(modelConfiguration)).then((v) => {
                            resolve(resp);
                        });
                    });
                    req.catch((err) => {
                        console.error('Error on POST ModelConfiguration', err);
                        reject(err);
                    });

                });

            });
        }
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('ModelConfigurationSetup Token error'));
    }
}

export const modelConfigurationSetupPut: ActionThunk<Promise<ModelConfigurationSetup>, MCAModelConfigurationSetupsAdd> = (modelConfigurationSetup: ModelConfigurationSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', modelConfigurationSetup);
        let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
        let id : string = getIdFromUri(modelConfigurationSetup.id);
        let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdPut({id: id, user: DEFAULT_GRAPH, modelConfigurationSetup: modelConfigurationSetup});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: MODEL_CONFIGURATION_SETUPS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT ModelConfigurationSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const modelConfigurationSetupDelete: ActionThunk<void, MCAModelConfigurationSetupDelete> = (modelConfigurationSetup:ModelConfigurationSetup) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', modelConfigurationSetup.id);
        let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
        let id : string = getIdFromUri(modelConfigurationSetup.id);
        let req : Promise<void> = api.modelconfigurationsetupsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: MODEL_CONFIGURATION_SETUP_DELETE,
                uri: modelConfigurationSetup.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE ModelConfigurationSetup', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export function setupGetAll (uri:string) : Promise<ModelConfigurationSetup> {
    debug('Fetching setup (all info)', uri);
    let id = uri.split('/').pop();
    let api = new ConfigurationSetupApi();
    return api.customConfigurationsetupsIdGet({username: DEFAULT_GRAPH, id: id});
}
