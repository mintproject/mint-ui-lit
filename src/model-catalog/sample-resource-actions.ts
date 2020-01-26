import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, SampleResource, SampleResourceApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('OBA:', ...args); }

export const ALL_SAMPLE_RESOURCES = 'ALL_SAMPLE_RESOURCES'

export const SAMPLE_RESOURCES_GET = "SAMPLE_RESOURCES_GET";
interface MCASampleResourcesGet extends Action<'SAMPLE_RESOURCES_GET'> { payload: any };
export const sampleResourcesGet: ActionCreator<ModelCatalogSampleResourceThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_SAMPLE_RESOURCES] || state.modelCatalog.loading[ALL_SAMPLE_RESOURCES])) {
        console.log('All sampleResources are already in memory or loading')
        return;
    }

    debug('Fetching all sampleResource');
    dispatch({type: START_LOADING, id: ALL_SAMPLE_RESOURCES});

    let api : SampleResourceApi = new SampleResourceApi();
    let req = api.sampleresourcesGet({username: DEFAULT_GRAPH});
    req.then((data) => {
            dispatch({
                type: SAMPLE_RESOURCES_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_SAMPLE_RESOURCES});
    });
    req.catch((err) => {console.log('Error on GET sampleResources', err)});
}

export const SAMPLE_RESOURCE_GET = "SAMPLE_RESOURCE_GET";
export interface MCASampleResourceGet extends Action<'SAMPLE_RESOURCE_GET'> { payload: any };
export const sampleResourceGet: ActionCreator<ModelCatalogSampleResourceThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching sampleResource', uri);
    let id : string = uri.split('/').pop();
    let api : SampleResourceApi = new SampleResourceApi();
    let req = api.sampleresourcesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: SAMPLE_RESOURCE_GET,
                payload: data
            });
    });
    req.catch((err) => {console.log('Error on getSampleResource', err)});
}

export const SAMPLE_RESOURCE_POST = "SAMPLE_RESOURCE_POST";
interface MCASampleResourcePost extends Action<'SAMPLE_RESOURCE_POST'> { payload: any };
export const sampleResourcePost: ActionCreator<ModelCatalogSampleResourceThunkResult> = (sampleResource:SampleResource, identifier:string) => (dispatch) => {
    debug('creating new sampleResource', sampleResource);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        sampleResource.id = undefined;
        let api : SampleResourceApi = new SampleResourceApi(cfg);
        let req = api.sampleresourcesPost({user: DEFAULT_GRAPH, sampleResource: sampleResource}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for POST sampleResource:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: SAMPLE_RESOURCE_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
            });
        req.catch((err) => {console.log('Error on POST sampleResource', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const SAMPLE_RESOURCE_PUT = "SAMPLE_RESOURCE_PUT";
interface MCASampleResourcePut extends Action<'SAMPLE_RESOURCE_PUT'> { payload: any };
export const sampleResourcePut: ActionCreator<ModelCatalogSampleResourceThunkResult> = ( sampleResource: SampleResource ) => (dispatch) => {
    debug('updating sampleResource', sampleResource.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: sampleResource.id});
        let api : SampleResourceApi = new SampleResourceApi(cfg);
        let id : string = sampleResource.id.split('/').pop();
        let req = api.sampleresourcesIdPut({id: id, user: DEFAULT_GRAPH, sampleResource: sampleResource}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for PUT sampleResource:', resp);
                let data = {};
                data[sampleResource.id] = resp;
                dispatch({
                    type: SAMPLE_RESOURCE_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: sampleResource.id});
        });
        req.catch((err) => {console.log('Error on PUT sampleResource', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const SAMPLE_RESOURCE_DELETE = "SAMPLE_RESOURCE_DELETE";
interface MCASampleResourceDelete extends Action<'SAMPLE_RESOURCE_DELETE'> { uri: string };
export const sampleResourceDelete: ActionCreator<ModelCatalogSampleResourceThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting sampleResource', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : SampleResourceApi = new SampleResourceApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.sampleresourcesIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
                dispatch({
                    type: SAMPLE_RESOURCE_DELETE,
                    uri: uri
                });
        });
        req.catch((err) => {console.log('Error on DELETE sampleResource', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogSampleResourceAction =  MCACommon | MCASampleResourcesGet | MCASampleResourceGet | MCASampleResourcePost | MCASampleResourcePut |
                                        MCASampleResourceDelete;
type ModelCatalogSampleResourceThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogSampleResourceAction>;
