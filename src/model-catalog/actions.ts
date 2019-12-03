import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, DefaultApi, ModelApi, SoftwareVersionApi, ModelConfigurationApi, ParameterApi, GridApi,
         DatasetSpecificationApi, TimeIntervalApi, SoftwareImageApi } from '@mintproject/modelcatalog_client';

export * from './person-actions';
export * from './region-actions';
export * from './process-actions';
export * from './parameter-actions';
export * from './model-configuration-actions';
export * from './model-configuration-setup-actions';
export * from './dataset-specification-actions';
export * from './sample-resource-actions';
export * from './sample-collection-actions';
export * from './geo-shape-actions';

import { ModelCatalogPersonAction } from './person-actions';
import { ModelCatalogRegionAction } from './region-actions';
import { ModelCatalogGeoShapeAction } from './geo-shape-actions';
import { ModelCatalogParameterAction } from './parameter-actions';
import { ModelCatalogProcessAction } from './process-actions';
import { ModelCatalogModelConfigurationAction } from './model-configuration-actions';
import { ModelCatalogModelConfigurationSetupAction } from './model-configuration-setup-actions';
import { ModelCatalogDatasetSpecificationAction } from './dataset-specification-actions';
import { ModelCatalogSampleResourceAction } from './sample-resource-actions';
import { ModelCatalogSampleCollectionAction } from './sample-collection-actions';

function debug (...args: any[]) {
    //console.log('OBA:', ...args);
}

export const idReducer = (dic:any, elem:any) => {
    dic[elem.id] = elem;
    return dic;
}

export const fixPosition = (resource:any) => {
    if (resource.position) {
        resource.position = resource.position[0];
    }
    return resource;
}

export const fixObjects = (collection:any[]) => {
    return (collection||[]).map(s => typeof s === "string" ? {id: s} : s);
}

export const isValidId = (id:string) => typeof id === 'string' && id.includes(PREFIX_URI);

export const getStatusConfigAndUser = () => {
    let state: any = store.getState();
    let status = state.app.prefs.modelCatalog.status;
    let token = state.app.prefs.modelCatalog.accessToken;
    let user = state.app.user ? state.app.user.email : null;
    let cfg : Configuration = new Configuration({accessToken: token});
    return [status, cfg, user];
}

// Repeat an action when the TOKEN is ready
export const repeatAction = (action, args) => (dispatch) => {
    console.log('Action', action, 'waiting for token...');
    //FIXME: this is not working now.
    /*dispatch({
        type: 'WAIT_UNTIL',
        predicate: action => (action.type === 'FETCH_MODEL_CATALOG_ACCESS_TOKEN'),
        run: (dispatch, getState, action) => {
            dispatch(action(args));
            console.log('Dispaching', action, 'async');
        }
    })*/
}

export const DEFAULT_GRAPH = 'mint@isi.edu';
export const PREFIX_URI = 'https://w3id.org/okn/i/mint/'

export const START_LOADING = 'START_LOADING';
export interface MCAStartLoading extends Action<'START_LOADING'> { id: string };
export const END_LOADING = 'END_LOADING';
export interface MCAEndLoading extends Action<'END_LOADING'> { id: string };

export const START_POST = 'START_POST';
export interface MCAStartPost extends Action<'START_POST'> { id: string };
export const END_POST = 'END_POST';
export interface MCAEndPost extends Action<'END_POST'> { id: string, uri: string };

export type MCACommon = MCAStartLoading | MCAEndLoading | MCAStartPost | MCAEndPost ;

export const ALL_MODELS = 'ALL_MODELS';
export const ALL_VERSIONS = 'ALL_VERSIONS';

export const MODELS_GET = "MODELS_GET";
interface MCAModelsGet extends Action<'MODELS_GET'> { payload: any };
export const modelsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching models');

    let MApi : ModelApi = new ModelApi();
    MApi.modelsGet({username: DEFAULT_GRAPH})
    .then((data) => {
        dispatch({
            type: MODELS_GET,
            payload: data.reduce(idReducer, {})
        });
    })
    .catch((err) => {console.log('Error on getModels', err)})
}

export const VERSIONS_GET = "VERSIONS_GET";
interface MCAVersionsGet extends Action<'VERSIONS_GET'> { payload: any };
export const versionsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching versions');
    let api = new SoftwareVersionApi();
    api.softwareversionsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            dispatch({
                type: VERSIONS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getVersions', err)})
}

export const GRID_GET = "GRID_GET";
interface MCAGridGet extends Action<'GRID_GET'> { payload: any };
export const gridGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching grid', uri);
    let id = uri.split('/').pop();
    let api = new GridApi();
    api.gridsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: GRID_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getGrid', err)})
}

export const TIME_INTERVAL_GET = "TIME_INTERVAL_GET";
interface MCATimeIntervalGet extends Action<'TIME_INTERVAL_GET'> { payload: any };
export const timeIntervalGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching timeinterval', uri);
    let id = uri.split('/').pop();
    let api = new TimeIntervalApi();
    api.timeintervalsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: TIME_INTERVAL_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getTimeInterval', err)})
}

export const SOFTWARE_IMAGE_GET = "SOFTWARE_IMAGE_GET";
interface MCASoftwareImageGet extends Action<'SOFTWARE_IMAGE_GET'> { payload: any };
export const softwareImageGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching software image', uri);
    let id = uri.split('/').pop();
    let api = new SoftwareImageApi();
    api.softwareimagesIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: SOFTWARE_IMAGE_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getSoftwareImage', err)})
}

export type ModelCatalogAction = MCACommon | ModelCatalogPersonAction | ModelCatalogParameterAction | ModelCatalogProcessAction |
                                 ModelCatalogModelConfigurationAction | ModelCatalogRegionAction | ModelCatalogSampleCollectionAction |
                                 ModelCatalogSampleResourceAction | ModelCatalogDatasetSpecificationAction |
                                 MCAModelsGet | MCAVersionsGet | ModelCatalogGeoShapeAction
                                 |ModelCatalogModelConfigurationSetupAction |
                                 MCAGridGet | MCATimeIntervalGet | MCASoftwareImageGet;

type ModelCatalogThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogAction>;
