import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, DefaultApi, ModelApi, ModelConfigurationApi, ParameterApi, GridApi,
         ConfigurationSetupApi, ModelConfigurationSetup,
         DatasetSpecificationApi, TimeIntervalApi, SoftwareImageApi } from '@mintproject/modelcatalog_client';

export * from './person-actions';
export * from './region-actions';
export * from './process-actions';
export * from './parameter-actions';
export * from './version-actions';
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
import { ModelCatalogVersionAction } from './version-actions';
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
    let req = MApi.modelsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: MODELS_GET,
            payload: data.reduce(idReducer, {})
        });
    });
    req.catch((err) => {console.log('Error on getModels', err)});
}

/*export const MODELS_SEARCH_INDEX = "MODELS_SEARCH_INDEX";
interface MCAModelsSearchIndex extends Action<'MODELS_SEARCH_INDEX'> { payload: any };
export const modelsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching models');
    let MApi : ModelApi = new ModelApi();
    let req = MApi.modelsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: MODELS_GET,
            payload: data.reduce(idReducer, {})
        });
    });
    req.catch((err) => {console.log('Error on getModels', err)});
}*/

const muri = "https://api.models.mint.isi.edu/v1.3.0/custom/model/"
export const modelsSearchIndex = (term:string) => {
    /*let MApi : ModelApi = new ModelApi();
    let req = MApi.customModelIndexGet({label:term, username: DEFAULT_GRAPH, customQueryName: 'custom_model_index'});
    return req;*/
    
    return new Promise((resolve, reject) => {
        let req = fetch(muri + "index?custom_query_name=custom_model_index&username=mint%40isi.edu&label=" + term);
        req.then((response) => {
            response.json().then(resolve);
        });
        req.catch(reject);
    });
}

export const modelsSearchIntervention = (term:string) => {
    /*let MApi : ModelApi = new ModelApi();
    let req = MApi.customModelInterventionGet({label:term, username: DEFAULT_GRAPH, customQueryName: 'custom_model_intervetion'});
    return req;*/
    return new Promise((resolve, reject) => {
        let req = fetch(muri + "intervention?custom_query_name=custom_model_intervetion&username=mint%40isi.edu&label=" + term);
        req.then((response) => {
            response.json().then(resolve);
        });
        req.catch(reject);
    });
}

export const modelsSearchRegion = (term:string) => {
    /*let MApi : ModelApi = new ModelApi();
    let req = MApi.customModelRegion({label:term, username: DEFAULT_GRAPH, customQueryName: 'custom_model_region'});
    return req;*/
    return new Promise((resolve, reject) => {
        let req = fetch(muri + "region?custom_query_name=custom_model_region&username=mint%40isi.edu&label=" + term);
        req.then((response) => {
            response.json().then(resolve);
        });
        req.catch(reject);
    });
}

export const GRID_GET = "GRID_GET";
interface MCAGridGet extends Action<'GRID_GET'> { payload: any };
export const gridGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching grid', uri);
    let id = uri.split('/').pop();
    let api = new GridApi();
    let req = api.gridsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: GRID_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getGrid', err)});
}

export const TIME_INTERVAL_GET = "TIME_INTERVAL_GET";
interface MCATimeIntervalGet extends Action<'TIME_INTERVAL_GET'> { payload: any };
export const timeIntervalGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching timeinterval', uri);
    let id = uri.split('/').pop();
    let api = new TimeIntervalApi();
    let req = api.timeintervalsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: TIME_INTERVAL_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getTimeInterval', err)});
}

export const SOFTWARE_IMAGE_GET = "SOFTWARE_IMAGE_GET";
interface MCASoftwareImageGet extends Action<'SOFTWARE_IMAGE_GET'> { payload: any };
export const softwareImageGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching software image', uri);
    let id = uri.split('/').pop();
    let api = new SoftwareImageApi();
    let req = api.softwareimagesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: SOFTWARE_IMAGE_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getSoftwareImage', err)});
}

/*export const SOFTWARE_IMAGE_GET = "SOFTWARE_IMAGE_GET";
interface MCASoftwareImageGet extends Action<'SOFTWARE_IMAGE_GET'> { payload: any };*/
export function setupGetAll (uri:string) : Promise<ModelConfigurationSetup> {
    debug('!Fetching setup', uri);
    let id = uri.split('/').pop();
    let api = new ConfigurationSetupApi();
    return api.customConfigurationsetupsIdGet({username: DEFAULT_GRAPH, id: id});
}

export type ModelCatalogAction = MCACommon | ModelCatalogPersonAction | ModelCatalogParameterAction | ModelCatalogProcessAction |
                                 ModelCatalogModelConfigurationAction | ModelCatalogRegionAction | ModelCatalogSampleCollectionAction |
                                 ModelCatalogSampleResourceAction | ModelCatalogDatasetSpecificationAction |
                                 ModelCatalogVersionAction | MCAModelsGet | ModelCatalogGeoShapeAction
                                 |ModelCatalogModelConfigurationSetupAction |
                                 MCAGridGet | MCATimeIntervalGet | MCASoftwareImageGet;

type ModelCatalogThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogAction>;
