import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';
import { IdMap } from 'app/reducers'
import { Configuration, DefaultApi } from '@mintproject/modelcatalog_client';

import { ModelCatalogModelAction } from './model-actions';
import { ModelCatalogVersionAction } from './version-actions';
import { ModelCatalogModelConfigurationAction } from './model-configuration-actions';
import { ModelCatalogModelConfigurationSetupAction } from './model-configuration-setup-actions';
import { ModelCatalogPersonAction } from './person-actions';
import { ModelCatalogRegionAction } from './region-actions';
import { ModelCatalogGeoShapeAction } from './geo-shape-actions';
import { ModelCatalogGridAction } from './grid-actions';
import { ModelCatalogProcessAction } from './process-actions';
import { ModelCatalogParameterAction } from './parameter-actions';
import { ModelCatalogTimeIntervalAction } from './time-interval-actions';
import { ModelCatalogSoftwareImageAction } from './software-image-actions';
import { ModelCatalogDatasetSpecificationAction } from './dataset-specification-actions';
import { ModelCatalogSampleResourceAction } from './sample-resource-actions';
import { ModelCatalogSampleCollectionAction } from './sample-collection-actions';
import { ModelCatalogImageAction } from './image-actions';

export const DEFAULT_GRAPH = 'mint@isi.edu';
export const PREFIX_URI = 'https://w3id.org/okn/i/mint/'

export type ActionThunk<R,A extends Action> = ActionCreator<ThunkAction<R, RootState, undefined, A>>
interface IdObject { id?: string };

export const getIdFromUri = (uri: string) : string => {
    return uri.split('/').pop();
}

export function createIdMap<T extends IdObject> (item:T) : IdMap<T> {
    let uri : string = PREFIX_URI + item.id
    let map : IdMap<T> = {} as IdMap<T>;
    map[uri] = item;
    item.id = uri;
    return map;
}

export const idReducer = (dic:any, elem:any) => {
    dic[elem.id] = elem;
    return dic;
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

export type ModelCatalogAction = ModelCatalogModelAction | ModelCatalogVersionAction | 
        ModelCatalogModelConfigurationAction | ModelCatalogModelConfigurationSetupAction | ModelCatalogPersonAction |
        ModelCatalogRegionAction | ModelCatalogGeoShapeAction | ModelCatalogGridAction | ModelCatalogProcessAction |
        ModelCatalogParameterAction | ModelCatalogTimeIntervalAction | ModelCatalogSoftwareImageAction |
        ModelCatalogDatasetSpecificationAction | ModelCatalogSampleResourceAction | ModelCatalogSampleCollectionAction |
        ModelCatalogImageAction;

//FIXME: The API is returning only one model (void), doing the fetch instead.
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

export * from './model-actions';
export * from './version-actions';
export * from './model-configuration-actions';
export * from './model-configuration-setup-actions';
export * from './person-actions';
export * from './region-actions';
export * from './geo-shape-actions';
export * from './grid-actions';
export * from './process-actions';
export * from './parameter-actions';
export * from './time-interval-actions';
export * from './software-image-actions';
export * from './dataset-specification-actions';
export * from './sample-resource-actions';
export * from './sample-collection-actions';
export * from './image-actions';
