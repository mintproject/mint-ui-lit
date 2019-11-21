import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, ModelConfiguration, ModelConfigurationApi, ParameterApi, DatasetSpecificationApi, 
         SampleResourceApi, SampleCollectionApi, DatasetSpecification } from '@mintproject/modelcatalog_client';
import { idReducer, isValidId, fixObjects, getStatusConfigAndUser, repeatAction, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';
import { PARAMETER_GET, MCAParameterGet } from './parameter-actions'
import { DATASET_SPECIFICATION_GET, MCADatasetSpecificationGet } from './dataset-specification-actions'
import { SAMPLE_RESOURCE_GET, MCASampleResourceGet } from './sample-resource-actions'
import { SAMPLE_COLLECTION_GET, MCASampleCollectionGet } from './sample-collection-actions'

function debug (...args: any[]) { console.log('OBA:', ...args); }

export const ALL_MODEL_CONFIGURATIONS = 'ALL_MODEL_CONFIGURATIONS'

export const MODEL_CONFIGURATIONS_GET = "MODEL_CONFIGURATIONS_GET";
interface MCAModelConfigurationsGet extends Action<'MODEL_CONFIGURATIONS_GET'> { payload: any };
export const modelConfigurationsGet: ActionCreator<ModelCatalogModelConfigurationThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_MODEL_CONFIGURATIONS] || state.modelCatalog.loading[ALL_MODEL_CONFIGURATIONS])) {
        console.log('All modelConfigurations are already in memory or loading')
        return;
    }

    debug('Fetching all modelConfiguration');
    dispatch({type: START_LOADING, id: ALL_MODEL_CONFIGURATIONS});

    let api : ModelConfigurationApi = new ModelConfigurationApi();
    api.modelconfigurationsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            dispatch({
                type: MODEL_CONFIGURATIONS_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_MODEL_CONFIGURATIONS});
        })
        .catch((err) => {console.log('Error on GET modelConfigurations', err)})
}

export const MODEL_CONFIGURATION_GET = "MODEL_CONFIGURATION_GET";
interface MCAModelConfigurationGet extends Action<'MODEL_CONFIGURATION_GET'> { payload: any };
export const modelConfigurationGet: ActionCreator<ModelCatalogModelConfigurationThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching modelConfiguration', uri);
    let id : string = uri.split('/').pop();
    let api : ModelConfigurationApi = new ModelConfigurationApi();
    api.modelconfigurationsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: MODEL_CONFIGURATION_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getModelConfiguration', err)})
}

export const MODEL_CONFIGURATION_POST = "MODEL_CONFIGURATION_POST";
interface MCAModelConfigurationPost extends Action<'MODEL_CONFIGURATION_POST'> { payload: any };
export const modelConfigurationPost: ActionCreator<PostConfigThunk> = (modelConfiguration:ModelConfiguration, configUri:string, identifier:string) => (dispatch) => {
    debug('creating new modelConfiguration', modelConfiguration);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (isValidId(modelConfiguration.id)) {
        console.error('Cannot create', modelConfiguration)
        return;
    } else {
        dispatch({type: START_POST, id: identifier});
        let state: any = store.getState();
        let config = state.modelCatalog.configurations[configUri];
        console.log('FOR CONFIG', config);
        let configApi = new ModelConfigurationApi(cfg);
        let parameterApi = new ParameterApi(cfg);
        let allPromises = [];
        let parameterPromises = [];
        let newParameters = [];
        let adjustableParameters = [];
        modelConfiguration.hasParameter.forEach((parameter) => {
            let req = parameterApi.parametersPost({user: DEFAULT_GRAPH, parameter: parameter}) // This should be my username on prod.
            let isFixed = parameter.hasFixedValue && parameter.hasFixedValue.length > 0 && parameter.hasFixedValue[0];
            parameterPromises.push(req);
            allPromises.push(req);
            req.then((resp) => {
                    console.log('Response for POST parameter:', resp);
                    let uri = PREFIX_URI + resp.id;
                    let data = {};
                    resp.id = uri;
                    data[uri] = resp;
                    newParameters.push(resp);
                    if (!isFixed) adjustableParameters.push(resp);
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
        modelConfiguration.hasInput.forEach((input : DatasetSpecification) => {
            let samplePromises = [];
            let newSample = [];
            if (input.hasFixedResource) {
                input.hasFixedResource.forEach(sample => {
                    let isCollection = sample.type.indexOf('SampleCollection') >= 0;
                    let req = isCollection ?
                                sampleCollectionApi.samplecollectionsPost({user: DEFAULT_GRAPH, sampleCollection: sample}) 
                                : sampleResourceApi.sampleresourcesPost({user: DEFAULT_GRAPH, sampleResource: sample});
                    samplePromises.push(req);
                    req.then((resp) => {
                            console.log('Response for POST sample:', resp);
                            let uri = PREFIX_URI + resp.id;
                            let data = {};
                            data[uri] = resp;
                            resp.id = uri;
                            newSample.push(resp);
                            if (isCollection) {
                                dispatch({ type: SAMPLE_COLLECTION_GET, payload: data });
                            } else {
                                dispatch({ type: SAMPLE_RESOURCE_GET, payload: data });
                            }
                    });
                    req.catch((err) => {
                        console.log('Error on POST sample', err)
                    });
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
                            console.log('Response for POST datasetSpecification:', resp);
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
                        console.log('Error on POST datasetSpecification', err)
                        reject(err);
                    });
                });

            }) );

            allPromises.push(waitSamples);

        });

        let waiting = Promise.all(allPromises);
        waiting.then((values) => {
            console.log('AP', allPromises);
            modelConfiguration.adjustableParameter = adjustableParameters;
            modelConfiguration.hasParameter = newParameters;
            modelConfiguration.hasInput = newDS;
            console.log('SS', modelConfiguration)
            let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
            let req = api.modelconfigurationsPost({user: DEFAULT_GRAPH, modelConfiguration: modelConfiguration}) // This should be my username on prod.
            req.then((resp) => {
                console.log('Response for POST modelConfiguration:', resp);
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: MODEL_CONFIGURATION_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});

                console.log('PUT to', config)
                if (config.hasSetup) {
                    config.hasSetup.push(resp)
                } else {
                    config.hasSetup = [resp]
                }
                /*modelConfigurationPut(config);*/

            })
            req.catch((err) => {
                console.log('Error on POST modelConfiguration', err)
            })
        });
        waiting.catch((err) => {
            console.error('POST setup failed!', err);
        });
    }

    /*if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        modelConfiguration.id = undefined;
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        api.modelconfigurationsPost({user: DEFAULT_GRAPH, modelConfiguration: modelConfiguration}) // This should be my username on prod.
            .then((resp) => {
                console.log('Response for POST modelConfiguration:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: MODEL_CONFIGURATION_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
            })
            .catch((err) => {console.log('Error on POST modelConfiguration', err)})
    } else if (status === 'LOADING') {
        repeatAction(modelConfigurationPost, modelConfiguration);
    }*/
}

export const MODEL_CONFIGURATION_PUT = "MODEL_CONFIGURATION_PUT";
interface MCAModelConfigurationPut extends Action<'MODEL_CONFIGURATION_PUT'> { payload: any };
export const modelConfigurationPut: ActionCreator<ModelCatalogModelConfigurationThunkResult> = ( modelConfiguration: ModelConfiguration ) => (dispatch) => {
    debug('updating modelConfiguration', modelConfiguration.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: modelConfiguration.id});
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        let id : string = modelConfiguration.id.split('/').pop();
        modelConfiguration.author = fixObjects(modelConfiguration.author);
        api.modelconfigurationsIdPut({id: id, user: DEFAULT_GRAPH, modelConfiguration: modelConfiguration}) // This should be my username on prod.
            .then((resp) => {
                console.log('Response for PUT modelConfiguration:', resp);
                let data = {};
                data[modelConfiguration.id] = resp;
                dispatch({
                    type: MODEL_CONFIGURATION_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: modelConfiguration.id});
            })
            .catch((err) => {console.log('Error on PUT modelConfiguration', err)})
    } else if (status === 'LOADING') {
        repeatAction(modelConfigurationPut, modelConfiguration);
    }
}

export const MODEL_CONFIGURATION_DELETE = "MODEL_CONFIGURATION_DELETE";
interface MCAModelConfigurationDelete extends Action<'MODEL_CONFIGURATION_DELETE'> { uri: string };
export const modelConfigurationDelete: ActionCreator<ModelCatalogModelConfigurationThunkResult> = ( uri : string ) => (dispatch) => {
    debug('deleting modelConfiguration', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        let id : string = uri.split('/').pop();
        api.modelconfigurationsIdDelete({id: id, user: DEFAULT_GRAPH}) // This should be my username on prod.
            .then((resp) => {
                console.log('Response for DELETE modelConfiguration:', resp);
                dispatch({
                    type: MODEL_CONFIGURATION_DELETE,
                    uri: uri
                });
            })
            .catch((err) => {console.log('Error on DELETE modelConfiguration', err)})
    } else if (status === 'LOADING') {
        repeatAction(modelConfigurationDelete, uri);
    }
}

export type ModelCatalogModelConfigurationAction =  MCACommon | MCAModelConfigurationsGet | MCAModelConfigurationGet | 
                                                    MCAModelConfigurationPost | MCAModelConfigurationPut | MCAModelConfigurationDelete;
type ModelCatalogModelConfigurationThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogModelConfigurationAction>;
type PostConfigThunk = ThunkAction<void, RootState, undefined, 
        ModelCatalogModelConfigurationAction | MCAParameterGet | MCADatasetSpecificationGet | MCASampleResourceGet |
        MCASampleCollectionGet>;
