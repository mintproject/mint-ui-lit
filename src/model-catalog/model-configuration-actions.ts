import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, ModelConfiguration, ModelConfigurationApi, Parameter, ParameterApi, DatasetSpecificationApi, 
         SampleResourceApi, SampleCollectionApi, DatasetSpecification, SampleResource, SampleCollection } from '@mintproject/modelcatalog_client';
import { idReducer, isValidId, fixObjects, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';
import { PARAMETERS_ADD, MCAParametersAdd } from './parameter-actions'
import { MCADatasetSpecificationsAdd } from './dataset-specification-actions'
import { SAMPLE_RESOURCES_ADD, MCASampleResourcesAdd } from './sample-resource-actions'
import { SAMPLE_COLLECTIONS_ADD, MCASampleCollectionsAdd } from './sample-collection-actions'

function debug (...args: any[]) { console.log('[MC configuration]', ...args); }

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
    let req : Promise<ModelConfiguration[]> = api.modelconfigurationsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        data = data.map(m => {
            return { ...m, 
                contributor: fixObjects(m.contributor),
                author: fixObjects(m.author),
                hasOutput: fixObjects(m.hasOutput),
                hasInput: fixObjects(m.hasInput),
                hasParameter: fixObjects(m.hasParameter),
            }
        })
        dispatch({
            type: MODEL_CONFIGURATIONS_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_MODEL_CONFIGURATIONS});
    });
    req.catch((err) => {console.log('Error on GET modelConfigurations', err)})
    return req;
}

export const MODEL_CONFIGURATION_GET = "MODEL_CONFIGURATION_GET";
interface MCAModelConfigurationGet extends Action<'MODEL_CONFIGURATION_GET'> { payload: any };
export const modelConfigurationGet: ActionCreator<ModelCatalogModelConfigurationThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching modelConfiguration', uri);
    let id : string = uri.split('/').pop();
    let api : ModelConfigurationApi = new ModelConfigurationApi();
    let req = api.modelconfigurationsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: MODEL_CONFIGURATION_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getModelConfiguration', err)});
    return req;
}

export const MODEL_CONFIGURATION_POST = "MODEL_CONFIGURATION_POST";
interface MCAModelConfigurationPost extends Action<'MODEL_CONFIGURATION_POST'> { payload: any };
export const modelConfigurationPost: ActionCreator<PostConfigThunk> =
        (modelConfiguration:ModelConfiguration, configUri:string, identifier:string) => (dispatch) => {
    debug('creating new modelConfiguration', modelConfiguration);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    console.error('POST ModelConfiguration not implemented yet');
}

export const MODEL_CONFIGURATION_PUT = "MODEL_CONFIGURATION_PUT";
interface MCAModelConfigurationPut extends Action<'MODEL_CONFIGURATION_PUT'> { payload: any };
export const modelConfigurationPut: ActionCreator<ModelCatalogModelConfigurationThunkResult> = ( modelConfiguration: ModelConfiguration ) => (dispatch) => {
    debug('updating modelConfiguration', modelConfiguration);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: modelConfiguration.id});
        let api : ModelConfigurationApi = new ModelConfigurationApi(cfg);
        let id : string = modelConfiguration.id.split('/').pop();
        let req : Promise<ModelConfiguration> = api.modelconfigurationsIdPut({id: id, user: DEFAULT_GRAPH, modelConfiguration: modelConfiguration}) // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for PUT modelConfiguration:', resp);
            let data = {};
            data[modelConfiguration.id] = resp;
            dispatch({
                type: MODEL_CONFIGURATION_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: modelConfiguration.id});
        });
        req.catch((err) => {console.log('Error on PUT modelConfiguration', err)});
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
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
        let req = api.modelconfigurationsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for DELETE modelConfiguration:', resp);
            dispatch({
                type: MODEL_CONFIGURATION_DELETE,
                uri: uri
            });
        });
        req.catch((err) => {console.log('Error on DELETE modelConfiguration', err)});
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogModelConfigurationAction =  MCACommon | MCAModelConfigurationsGet | MCAModelConfigurationGet | 
                                                    MCAModelConfigurationPost | MCAModelConfigurationPut | MCAModelConfigurationDelete;
type ModelCatalogModelConfigurationThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogModelConfigurationAction>;
type PostConfigThunk = ThunkAction<void, RootState, undefined, 
        ModelCatalogModelConfigurationAction | MCAParametersAdd | MCADatasetSpecificationsAdd | MCASampleResourcesAdd |
        MCASampleCollectionsAdd>;
