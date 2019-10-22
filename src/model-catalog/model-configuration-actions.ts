import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, ModelConfiguration, ModelConfigurationApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, repeatAction, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

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
export const modelConfigurationPost: ActionCreator<ModelCatalogModelConfigurationThunkResult> = (modelConfiguration:ModelConfiguration, identifier:string) => (dispatch) => {
    debug('creating new modelConfiguration', modelConfiguration);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
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
    }
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
