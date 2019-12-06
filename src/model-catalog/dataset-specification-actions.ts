import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, DatasetSpecification, DatasetSpecificationApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) {}// console.log('OBA:', ...args); }

export const ALL_DATASET_SPECIFICATIONS = 'ALL_DATASET_SPECIFICATIONS'

export const DATASET_SPECIFICATIONS_GET = "DATASET_SPECIFICATIONS_GET";
interface MCADatasetSpecificationsGet extends Action<'DATASET_SPECIFICATIONS_GET'> { payload: any };
export const datasetSpecificationsGet: ActionCreator<ModelCatalogDatasetSpecificationThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_DATASET_SPECIFICATIONS] || state.modelCatalog.loading[ALL_DATASET_SPECIFICATIONS])) {
        console.log('All datasetSpecifications are already in memory or loading')
        return;
    }

    debug('Fetching all datasetSpecification');
    dispatch({type: START_LOADING, id: ALL_DATASET_SPECIFICATIONS});

    let api : DatasetSpecificationApi = new DatasetSpecificationApi();
    let req = api.datasetspecificationsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
            dispatch({
                type: DATASET_SPECIFICATIONS_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_DATASET_SPECIFICATIONS});
    });
    req.catch((err) => {console.log('Error on GET datasetSpecifications', err)});
}

export const DATASET_SPECIFICATION_GET = "DATASET_SPECIFICATION_GET";
export interface MCADatasetSpecificationGet extends Action<'DATASET_SPECIFICATION_GET'> { payload: any };
export const datasetSpecificationGet: ActionCreator<ModelCatalogDatasetSpecificationThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching datasetSpecification', uri);
    let id : string = uri.split('/').pop();
    let api : DatasetSpecificationApi = new DatasetSpecificationApi();
    let req = api.datasetspecificationsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: DATASET_SPECIFICATION_GET,
                payload: data
            });
    });
    req.catch((err) => {console.log('Error on getDatasetSpecification', err)});
}

export const DATASET_SPECIFICATION_POST = "DATASET_SPECIFICATION_POST";
interface MCADatasetSpecificationPost extends Action<'DATASET_SPECIFICATION_POST'> { payload: any };
export const datasetSpecificationPost: ActionCreator<ModelCatalogDatasetSpecificationThunkResult> = (datasetSpecification:DatasetSpecification, identifier:string) => (dispatch) => {
    debug('creating new datasetSpecification', datasetSpecification);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        datasetSpecification.id = undefined;
        let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
        let req = api.datasetspecificationsPost({user: DEFAULT_GRAPH, datasetSpecification: datasetSpecification}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for POST datasetSpecification:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: DATASET_SPECIFICATION_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
        });
        req.catch((err) => {console.log('Error on POST datasetSpecification', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const DATASET_SPECIFICATION_PUT = "DATASET_SPECIFICATION_PUT";
interface MCADatasetSpecificationPut extends Action<'DATASET_SPECIFICATION_PUT'> { payload: any };
export const datasetSpecificationPut: ActionCreator<ModelCatalogDatasetSpecificationThunkResult> = ( datasetSpecification: DatasetSpecification ) => (dispatch) => {
    debug('updating datasetSpecification', datasetSpecification.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: datasetSpecification.id});
        let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
        let id : string = datasetSpecification.id.split('/').pop();
        let req = api.datasetspecificationsIdPut({id: id, user: DEFAULT_GRAPH, datasetSpecification: datasetSpecification}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for PUT datasetSpecification:', resp);
                let data = {};
                data[datasetSpecification.id] = resp;
                dispatch({
                    type: DATASET_SPECIFICATION_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: datasetSpecification.id});
        });
        req.catch((err) => {console.log('Error on PUT datasetSpecification', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const DATASET_SPECIFICATION_DELETE = "DATASET_SPECIFICATION_DELETE";
interface MCADatasetSpecificationDelete extends Action<'DATASET_SPECIFICATION_DELETE'> { uri: string };
export const datasetSpecificationDelete: ActionCreator<ModelCatalogDatasetSpecificationThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting datasetSpecification', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : DatasetSpecificationApi = new DatasetSpecificationApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.datasetspecificationsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
                dispatch({
                    type: DATASET_SPECIFICATION_DELETE,
                    uri: uri
                });
        });
        req.catch((err) => {console.log('Error on DELETE datasetSpecification', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogDatasetSpecificationAction =  MCACommon | MCADatasetSpecificationsGet | MCADatasetSpecificationGet |
                                                      MCADatasetSpecificationPost | MCADatasetSpecificationPut | MCADatasetSpecificationDelete;
type ModelCatalogDatasetSpecificationThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogDatasetSpecificationAction>;
