import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, ModelConfiguration, SoftwareVersion, ModelConfigurationApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, fixObjects, getUser,
         versionGet, versionPut } from './actions';

function debug (...args: any[]) { console.log('[MC ModelConfiguration]', ...args); }

export const MODEL_CONFIGURATIONS_ADD = "MODEL_CONFIGURATIONS_ADD";
export const MODEL_CONFIGURATION_DELETE = "MODEL_CONFIGURATION_DELETE";

interface MCAModelConfigurationsAdd extends Action<'MODEL_CONFIGURATIONS_ADD'> { payload: IdMap<ModelConfiguration> };
interface MCAModelConfigurationDelete extends Action<'MODEL_CONFIGURATION_DELETE'> { uri: string };

export type ModelCatalogModelConfigurationAction =  MCAModelConfigurationsAdd | MCAModelConfigurationDelete;

let modelConfigurationsPromise : Promise<IdMap<ModelConfiguration>> | null = null;

export const modelConfigurationsGet: ActionThunk<Promise<IdMap<ModelConfiguration>>, MCAModelConfigurationsAdd> = () => (dispatch) => {
    if (!modelConfigurationsPromise) {
        modelConfigurationsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let user : string = getUser();
            let api : ModelConfigurationApi = new ModelConfigurationApi();
            let req2 : Promise<ModelConfiguration[]> = api.modelconfigurationsGet({username: user});

            let promises : Promise<ModelConfiguration[]>[] = [req2];
            promises.forEach((p:Promise<ModelConfiguration[]>, i:number) => {
                p.then((resp:ModelConfiguration[]) => dispatch({ type: MODEL_CONFIGURATIONS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET ModelConfigurations ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<ModelConfiguration> = {};
                values.forEach((arr:ModelConfiguration[]) => {
                    data = arr.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET ModelConfigurations', err);
                reject(err);
            });


            /*req.then((resp:ModelConfiguration[]) => {
                let data : IdMap<ModelConfiguration> = resp
                    .map((config:ModelConfiguration) => { return { ...config, 
                        contributor:    fixObjects(config.contributor),
                        author:         fixObjects(config.author),
                        hasOutput:      fixObjects(config.hasOutput),
                        hasInput:       fixObjects(config.hasInput),
                        hasParameter:   fixObjects(config.hasParameter),
                    }
                }).reduce(idReducer, {});
                dispatch({
                    type: MODEL_CONFIGURATIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET ModelConfigurations', err);
                reject(err);
            });*/

        });
    } else {
        debug('All modelConfigurations are already in memory or loading');
    }
    return modelConfigurationsPromise;
}

export const modelConfigurationGet: ActionThunk<Promise<ModelConfiguration>, MCAModelConfigurationsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : ModelConfigurationApi = new ModelConfigurationApi();
    let req : Promise<ModelConfiguration> = api.modelconfigurationsIdGet({username: user, id: id});
    req.then((resp:ModelConfiguration) => {
        dispatch({
            type: MODEL_CONFIGURATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET ModelConfiguration', err);
    });
    return req;
}

export const modelConfigurationPost: ActionThunk<Promise<ModelConfiguration>, MCAModelConfigurationsAdd> = 
        (modelConfiguration:ModelConfiguration, version:SoftwareVersion) => (dispatch) => {
    if (!version || !version.id) {
        return Promise.reject(new Error('Configuration creation needs a valid software version.'));
    }
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', modelConfiguration);
        let postProm = new Promise((resolve,reject) => {
            let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
            let req = api.modelconfigurationsPost({user: user, modelConfiguration: modelConfiguration}); // This should be my username on prod.
            req.then((resp:ModelConfiguration) => {
                debug('Response for POST', resp);
                dispatch({
                    type: MODEL_CONFIGURATIONS_ADD,
                    payload: createIdMap(resp)
                });

                // ADD Configuration to Version
                dispatch(versionGet(version.id)).then((sVersion:SoftwareVersion) => {
                    let syncVersion : SoftwareVersion = { ...sVersion };
                    if (syncVersion.hasConfiguration) syncVersion.hasConfiguration.push(resp);
                    else syncVersion.hasConfiguration = [resp];
                    //FIXME: --> FIX DATES
                    if (syncVersion.dateCreated) delete syncVersion.dateCreated;
                    dispatch(versionPut(syncVersion)).then((rVersion:SoftwareVersion) => {
                        resolve(resp);
                    });
                });

                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST ModelConfiguration', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('ModelConfiguration error'));
    }
}

export const modelConfigurationPut: ActionThunk<Promise<ModelConfiguration>, MCAModelConfigurationsAdd> = (modelConfiguration: ModelConfiguration) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', modelConfiguration);
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        let id : string = getIdFromUri(modelConfiguration.id);
        let req : Promise<ModelConfiguration> = api.modelconfigurationsIdPut({id: id, user: user, modelConfiguration: modelConfiguration});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: MODEL_CONFIGURATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT ModelConfiguration', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const modelConfigurationDelete: ActionThunk<void, MCAModelConfigurationDelete> = (modelConfiguration:ModelConfiguration) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', modelConfiguration.id);
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        let id : string = getIdFromUri(modelConfiguration.id);
        let req : Promise<void> = api.modelconfigurationsIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: MODEL_CONFIGURATION_DELETE,
                uri: modelConfiguration.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE ModelConfiguration', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
