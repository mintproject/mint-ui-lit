import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, ModelConfigurationSetup, ModelConfigurationSetupApi, ModelConfiguration,
         ConfigurationSetupApi, Parameter, DatasetSpecification } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, fixObjects, getUser,
         parameterPost, datasetSpecificationPost, modelConfigurationPut } from './actions';

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
            let user : string = getUser();
            let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
            let req2 : Promise<ModelConfigurationSetup[]> = api.modelconfigurationsetupsGet({username: user});

            let promises : Promise<ModelConfigurationSetup[]>[] = [req2];
            promises.forEach((p:Promise<ModelConfigurationSetup[]>, i:number) => {
                p.then((resp:ModelConfigurationSetup[]) => dispatch({ type: MODEL_CONFIGURATION_SETUPS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET ModelConfigurationSetups ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<ModelConfigurationSetup> = {};
                values.forEach((arr:ModelConfigurationSetup[]) => {
                    data = arr.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
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
    let user : string = getUser();
    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdGet({username: user, id: id});
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
                    let req = api.modelconfigurationsetupsPost({user: user, modelConfigurationSetup: modelConfigurationSetup});
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
        let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdPut({id: id, user: user, modelConfigurationSetup: modelConfigurationSetup});
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
        let req : Promise<void> = api.modelconfigurationsetupsIdDelete({id: id, user: user}); // This should be my username on prod.
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
    let user : string = getUser();
    let id = uri.split('/').pop();
    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    return api.customModelconfigurationsetupsIdGet({username: user, id: id});
}

export const setupsSearchVariable = (term:string) => {
    debug('Searching by variable:', term);
    let user : string = getUser();
    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    let req : Promise<ModelConfigurationSetup[]> = api.customModelconfigurationsetupsVariableGet({username: user, label: term});
    return req;
}

