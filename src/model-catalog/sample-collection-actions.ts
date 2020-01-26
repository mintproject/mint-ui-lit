import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, SampleCollection, SampleCollectionApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('OBA:', ...args); }

export const ALL_SAMPLE_COLLECTIONS = 'ALL_SAMPLE_COLLECTIONS'

export const SAMPLE_COLLECTIONS_GET = "SAMPLE_COLLECTIONS_GET";
interface MCASampleCollectionsGet extends Action<'SAMPLE_COLLECTIONS_GET'> { payload: any };
export const sampleCollectionsGet: ActionCreator<ModelCatalogSampleCollectionThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_SAMPLE_COLLECTIONS] || state.modelCatalog.loading[ALL_SAMPLE_COLLECTIONS])) {
        console.log('All sampleCollections are already in memory or loading')
        return;
    }

    debug('Fetching all sampleCollection');
    dispatch({type: START_LOADING, id: ALL_SAMPLE_COLLECTIONS});

    let api : SampleCollectionApi = new SampleCollectionApi();
    let req = api.samplecollectionsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
            dispatch({
                type: SAMPLE_COLLECTIONS_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_SAMPLE_COLLECTIONS});
    });
    req.catch((err) => {console.log('Error on GET sampleCollections', err)});
}

export const SAMPLE_COLLECTION_GET = "SAMPLE_COLLECTION_GET";
export interface MCASampleCollectionGet extends Action<'SAMPLE_COLLECTION_GET'> { payload: any };
export const sampleCollectionGet: ActionCreator<ModelCatalogSampleCollectionThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching sampleCollection', uri);

    let id : string = uri.split('/').pop();
    let api : SampleCollectionApi = new SampleCollectionApi();
    let req = api.samplecollectionsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: SAMPLE_COLLECTION_GET,
                payload: data
            });
    });
    req.catch((err) => {console.log('Error on getSampleCollection', err)});
}

export const SAMPLE_COLLECTION_POST = "SAMPLE_COLLECTION_POST";
interface MCASampleCollectionPost extends Action<'SAMPLE_COLLECTION_POST'> { payload: any };
export const sampleCollectionPost: ActionCreator<ModelCatalogSampleCollectionThunkResult> = (sampleCollection:SampleCollection, identifier:string) => (dispatch) => {
    debug('creating new sampleCollection', sampleCollection);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        sampleCollection.id = undefined;
        let api : SampleCollectionApi = new SampleCollectionApi(cfg);
        let req = api.samplecollectionsPost({user: DEFAULT_GRAPH, sampleCollection: sampleCollection}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for POST sampleCollection:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: SAMPLE_COLLECTION_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
            });
        req.catch((err) => {console.log('Error on POST sampleCollection', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const SAMPLE_COLLECTION_PUT = "SAMPLE_COLLECTION_PUT";
interface MCASampleCollectionPut extends Action<'SAMPLE_COLLECTION_PUT'> { payload: any };
export const sampleCollectionPut: ActionCreator<ModelCatalogSampleCollectionThunkResult> = ( sampleCollection: SampleCollection ) => (dispatch) => {
    debug('updating sampleCollection', sampleCollection.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: sampleCollection.id});
        let api : SampleCollectionApi = new SampleCollectionApi(cfg);
        let id : string = sampleCollection.id.split('/').pop();
        let req = api.samplecollectionsIdPut({id: id, user: DEFAULT_GRAPH, sampleCollection: sampleCollection}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for PUT sampleCollection:', resp);
                let data = {};
                data[sampleCollection.id] = resp;
                dispatch({
                    type: SAMPLE_COLLECTION_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: sampleCollection.id});
        });
        req.catch((err) => {console.log('Error on PUT sampleCollection', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const SAMPLE_COLLECTION_DELETE = "SAMPLE_COLLECTION_DELETE";
interface MCASampleCollectionDelete extends Action<'SAMPLE_COLLECTION_DELETE'> { uri: string };
export const sampleCollectionDelete: ActionCreator<ModelCatalogSampleCollectionThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting sampleCollection', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : SampleCollectionApi = new SampleCollectionApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.samplecollectionsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
                dispatch({
                    type: SAMPLE_COLLECTION_DELETE,
                    uri: uri
                });
        });
        req.catch((err) => {console.log('Error on DELETE sampleCollection', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogSampleCollectionAction =  MCACommon | MCASampleCollectionsGet | MCASampleCollectionGet | MCASampleCollectionPost | MCASampleCollectionPut |
                                        MCASampleCollectionDelete;
type ModelCatalogSampleCollectionThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogSampleCollectionAction>;
