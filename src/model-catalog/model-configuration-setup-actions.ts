import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, ModelConfiguration, ModelConfigurationSetup, ModelConfigurationSetupApi, Parameter, ParameterApi, DatasetSpecificationApi, 
         SampleResourceApi, SampleCollectionApi, DatasetSpecification, SampleResource, SampleCollection } from '@mintproject/modelcatalog_client';
import { idReducer, isValidId, fixObjects, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';
import { PARAMETER_GET, MCAParameterGet } from './parameter-actions'
import { DATASET_SPECIFICATION_GET, MCADatasetSpecificationGet } from './dataset-specification-actions'
import { SAMPLE_RESOURCE_GET, MCASampleResourceGet } from './sample-resource-actions'
import { SAMPLE_COLLECTION_GET, MCASampleCollectionGet } from './sample-collection-actions'
import { modelConfigurationPut } from './actions';

function debug (...args: any[]) {}// console.log('[MC setup]', ...args); }

export const ALL_MODEL_CONFIGURATION_SETUPS = 'ALL_MODEL_CONFIGURATION_SETUPS'

export const MODEL_CONFIGURATION_SETUPS_GET = "MODEL_CONFIGURATION_SETUPS_GET";
interface MCAModelConfigurationSetupsGet extends Action<'MODEL_CONFIGURATION_SETUPS_GET'> { payload: any };
export const modelConfigurationSetupsGet: ActionCreator<ModelCatalogModelConfigurationSetupThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_MODEL_CONFIGURATION_SETUPS] || state.modelCatalog.loading[ALL_MODEL_CONFIGURATION_SETUPS])) {
        debug('All modelConfigurationSetups are already in memory or loading')
        return;
    }

    debug('Fetching all');
    dispatch({type: START_LOADING, id: ALL_MODEL_CONFIGURATION_SETUPS});

    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    let req : Promise<ModelConfigurationSetup[]> = api.modelconfigurationsetupsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: MODEL_CONFIGURATION_SETUPS_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_MODEL_CONFIGURATION_SETUPS});
    });
    req.catch((err) => {debug('Error on GET all', err)});
    return req;
}

export const MODEL_CONFIGURATION_SETUP_GET = "MODEL_CONFIGURATION_SETUP_GET";
interface MCAModelConfigurationSetupGet extends Action<'MODEL_CONFIGURATION_SETUP_GET'> { payload: any };
export const modelConfigurationSetupGet: ActionCreator<ModelCatalogModelConfigurationSetupThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = uri.split('/').pop();
    let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi();
    let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: MODEL_CONFIGURATION_SETUP_GET,
            payload: data
        });
    });
    req.catch((err) => {debug('Error on GET', id, err)});
    return req;
}

export const MODEL_CONFIGURATION_SETUP_POST = "MODEL_CONFIGURATION_SETUP_POST";
interface MCAModelConfigurationSetupPost extends Action<'MODEL_CONFIGURATION_SETUP_POST'> { payload: any };
export const modelConfigurationSetupPost: ActionCreator<PostConfigThunk> =
        (modelConfigurationSetup:ModelConfigurationSetup, modelConfiguration:ModelConfiguration, identifier:string) => (dispatch) => {
    debug('Creating new', modelConfigurationSetup);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (isValidId(modelConfigurationSetup.id)) {
        console.error('Cannot create', modelConfigurationSetup)
        return;
    } else {
        dispatch({type: START_POST, id: identifier});
        let parameterApi = new ParameterApi(cfg);
        let allPromises = [];
        let parameterPromises = [];
        let newParameters = [];
        modelConfigurationSetup.hasParameter.forEach((parameter: Parameter) => {
            let req = parameterApi.parametersPost({user: DEFAULT_GRAPH, parameter: parameter}) // This should be my username on prod.
            let isFixed = parameter.hasFixedValue && parameter.hasFixedValue.length > 0 && parameter.hasFixedValue[0];
            parameterPromises.push(req);
            allPromises.push(req);
            req.then((resp) => {
                    debug('Response for POST parameter:', resp);
                    let uri = PREFIX_URI + resp.id;
                    let data = {};
                    resp.id = uri;
                    resp['isAdjustable'] = parameter['isAdjustable'];
                    data[uri] = resp;
                    newParameters.push(resp);
                    dispatch({
                        type: PARAMETER_GET,
                        payload: data
                    });
            });
            req.catch((err) => {
                console.error('Error on POST parameter', err)
            });
        });

        let sampleResourceApi = new SampleResourceApi(cfg);
        let sampleCollectionApi = new SampleCollectionApi(cfg);
        let DSApi = new DatasetSpecificationApi(cfg);
        let newDS = [];
        modelConfigurationSetup.hasInput.forEach((input : DatasetSpecification) => {
            let samplePromises = [];
            let newSample = [];
            if (input.hasFixedResource) {
                input.hasFixedResource.forEach(sample => {

                    if (sample.type.indexOf('SampleCollection') >= 0) {
                        samplePromises.push(new Promise ((resolve, reject) => {
                            let resourcesForCollection = [];
                            let resourcesForCollectionPromises = [];
                            (<SampleCollection>sample).hasPart.map(s => {
                                let req = sampleResourceApi.sampleresourcesPost({user: DEFAULT_GRAPH, sampleResource: s});
                                resourcesForCollectionPromises.push(req);
                                req.then((resp) => {
                                    debug('Response for POST sampleResource:', resp);
                                    let uri = PREFIX_URI + resp.id;
                                    let data = {};
                                    data[uri] = resp;
                                    resp.id = uri;
                                    resourcesForCollection.push(resp);
                                    dispatch({ type: SAMPLE_RESOURCE_GET, payload: data });
                                });
                                req.catch((err) => {
                                    debug('Error on POST sampleResource', err)
                                });
                            })
                            let partPromises = Promise.all(resourcesForCollectionPromises);
                            partPromises.then((values) => {
                                (<SampleCollection>sample).hasPart = resourcesForCollection;
                                let req = sampleCollectionApi.samplecollectionsPost({user: DEFAULT_GRAPH, sampleCollection: sample});
                                samplePromises.push(req);
                                req.then((resp) => {
                                        debug('Response for POST sampleCollection:', resp);
                                        let uri = PREFIX_URI + resp.id;
                                        let data = {};
                                        data[uri] = resp;
                                        resp.id = uri;
                                        newSample.push(resp);
                                        dispatch({ type: SAMPLE_COLLECTION_GET, payload: data });
                                        resolve(resp);
                                });
                                req.catch((err) => {
                                    debug('Error on POST sampleCollection', err)
                                    reject(err);
                                });
                            });

                        }));
                    } else {
                        let req = sampleResourceApi.sampleresourcesPost({user: DEFAULT_GRAPH, sampleResource: sample});
                        samplePromises.push(req);
                        req.then((resp) => {
                                debug('Response for POST sampleResource:', resp);
                                let uri = PREFIX_URI + resp.id;
                                let data = {};
                                data[uri] = resp;
                                resp.id = uri;
                                newSample.push(resp);
                                dispatch({ type: SAMPLE_RESOURCE_GET, payload: data });
                        });
                        req.catch((err) => {
                            debug('Error on POST sampleResource', err)
                        });
                    }
                });
            }

            let waitSamples = Promise.all(samplePromises);
            waitSamples.catch((err) => { console.error('Some Sample creation failed! ABORT') });
            allPromises.push( new Promise ((resolve, reject) => {

                waitSamples.then((values) => {
                    let newInput = { ...input, hasFixedResource: newSample };
                    let req = DSApi.datasetspecificationsPost({user: DEFAULT_GRAPH, datasetSpecification: newInput}); // This should be my username on prod.
                    //allPromises.push(req);
                    req.then((resp) => {
                            debug('Response for POST datasetSpecification:', resp);
                            let uri = PREFIX_URI + resp.id;
                            let data = {};
                            data[uri] = resp;
                            resp.id = uri;
                            newDS.push(resp);
                            dispatch({
                                type: DATASET_SPECIFICATION_GET,
                                payload: data
                            });
                            resolve(resp);
                    });
                    req.catch((err) => {
                        debug('Error on POST datasetSpecification', err)
                        reject(err);
                    });
                });

            }) );

            allPromises.push(waitSamples);

        });

        let waiting = Promise.all(allPromises);
        waiting.then((values) => {
            modelConfigurationSetup.hasParameter = newParameters;
            modelConfigurationSetup.hasInput = newDS;
            modelConfigurationSetup.adjustableParameter = newParameters.filter(p => p["isAdjustable"]);
            modelConfigurationSetup.hasOutput = fixObjects(modelConfigurationSetup.hasOutput);
            debug('POST', modelConfigurationSetup)
            let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
            let req = api.modelconfigurationsetupsPost({user: DEFAULT_GRAPH, modelConfigurationSetup: modelConfigurationSetup}) // This should be my username on prod.
            req.then((resp) => {
                debug('Response for POST:', resp);
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: MODEL_CONFIGURATION_SETUP_GET,
                    payload: data
                });

                debug('Updating parent config', modelConfiguration);
                if (modelConfiguration.hasSetup) {
                    modelConfiguration.hasSetup.push(resp)
                } else {
                    modelConfiguration.hasSetup = [resp]
                }
                (<unknown>dispatch(modelConfigurationPut(modelConfiguration)) as Promise<any>).then((v) => {
                    dispatch({type: END_POST, id: identifier, uri: uri});
                });
            })
            req.catch((err) => {
                debug('Error on POST', err)
            });
        });
        waiting.catch((err) => {
            // If any has errors we should delete everything FIXME
            console.error('POST setup failed!', err);
        });
    }
}

export const MODEL_CONFIGURATION_SETUP_PUT = "MODEL_CONFIGURATION_SETUP_PUT";
interface MCAModelConfigurationSetupPut extends Action<'MODEL_CONFIGURATION_SETUP_PUT'> { payload: any };
export const modelConfigurationSetupPut: ActionCreator<ModelCatalogModelConfigurationSetupThunkResult> = 
        ( modelConfigurationSetup: ModelConfigurationSetup ) => (dispatch) => {
    debug('Updating', modelConfigurationSetup.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: modelConfigurationSetup.id});
        let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
        let id : string = modelConfigurationSetup.id.split('/').pop();
        let req : Promise<ModelConfigurationSetup> = api.modelconfigurationsetupsIdPut({id: id, user: DEFAULT_GRAPH, modelConfigurationSetup: modelConfigurationSetup}); // This should be my username on prod.
        req.then((resp) => {
            debug('Response for PUT:', resp);
            let data = {};
            data[modelConfigurationSetup.id] = resp;
            dispatch({
                type: MODEL_CONFIGURATION_SETUP_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: modelConfigurationSetup.id});
        })
        req.catch((err) => {debug('Error on PUT', err)})
        return req;
    } else {
        console.error('TOKEN', status);
    }
}

export const MODEL_CONFIGURATION_SETUP_DELETE = "MODEL_CONFIGURATION_SETUP_DELETE";
interface MCAModelConfigurationSetupDelete extends Action<'MODEL_CONFIGURATION_SETUP_DELETE'> { uri: string };
export const modelConfigurationSetupDelete: ActionCreator<ModelCatalogModelConfigurationSetupThunkResult> = ( uri : string ) => (dispatch) => {
    debug('Deleting', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : ModelConfigurationSetupApi = new ModelConfigurationSetupApi(cfg);
        let id : string = uri.split('/').pop();
        let req : Promise<void> = api.modelconfigurationsetupsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            debug('Response for DELETE:', resp);
            dispatch({
                type: MODEL_CONFIGURATION_SETUP_DELETE,
                uri: uri
            });
        });
        req.catch((err) => {debug('Error on DELETE', err)});
        return req;
    } else {
        console.error('TOKEN', status);
    }
}

export type ModelCatalogModelConfigurationSetupAction =  MCACommon | MCAModelConfigurationSetupsGet | MCAModelConfigurationSetupGet | 
                                                    MCAModelConfigurationSetupPost | MCAModelConfigurationSetupPut | MCAModelConfigurationSetupDelete;
type ModelCatalogModelConfigurationSetupThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogModelConfigurationSetupAction>;
type PostConfigThunk = ThunkAction<void, RootState, undefined, 
        ModelCatalogModelConfigurationSetupAction | MCAParameterGet | MCADatasetSpecificationGet | MCASampleResourceGet |
        MCASampleCollectionGet>;
