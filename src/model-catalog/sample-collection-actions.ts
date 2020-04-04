import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, SampleCollection, SampleCollectionApi, SampleResource } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         sampleResourcePost } from './actions';

function debug (...args: any[]) {}// console.log('[MC SampleCollection]', ...args); }

export const SAMPLE_COLLECTIONS_ADD = "SAMPLE_COLLECTIONS_ADD";
export const SAMPLE_COLLECTION_DELETE = "SAMPLE_COLLECTION_DELETE";

export interface MCASampleCollectionsAdd extends Action<'SAMPLE_COLLECTIONS_ADD'> { payload: IdMap<SampleCollection> };
interface MCASampleCollectionDelete extends Action<'SAMPLE_COLLECTION_DELETE'> { uri: string };

export type ModelCatalogSampleCollectionAction =  MCASampleCollectionsAdd | MCASampleCollectionDelete;

let sampleCollectionsPromise : Promise<IdMap<SampleCollection>> | null = null;

export const sampleCollectionsGet: ActionThunk<Promise<IdMap<SampleCollection>>, MCASampleCollectionsAdd> = () => (dispatch) => {
    if (!sampleCollectionsPromise) {
        sampleCollectionsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : SampleCollectionApi = new SampleCollectionApi();
            let user : string = getUser();
            let req2 : Promise<SampleCollection[]> = api.samplecollectionsGet({username: user});

            let promises : Promise<SampleCollection[]>[] = [req2];
            promises.forEach((p:Promise<SampleCollection[]>, i:number) => {
                p.then((resp:SampleCollection[]) => dispatch({ type: SAMPLE_COLLECTIONS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET SampleCollections ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<SampleCollection> = {};
                values.forEach((arr:SampleCollection[]) => {
                    data = arr.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET SampleCollections', err);
                reject(err);
            });
        });
    } else {
        debug('All sampleCollections are already in memory or loading');
    }
    return sampleCollectionsPromise;
}

export const sampleCollectionGet: ActionThunk<Promise<SampleCollection>, MCASampleCollectionsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : SampleCollectionApi = new SampleCollectionApi();
    let req : Promise<SampleCollection> = api.samplecollectionsIdGet({username: user, id: id});
    req.then((resp:SampleCollection) => {
        dispatch({
            type: SAMPLE_COLLECTIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET SampleCollection', err);
    });
    return req;
}

export const sampleCollectionPost: ActionThunk<Promise<SampleCollection>, MCASampleCollectionsAdd> = (sampleCollection:SampleCollection) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', sampleCollection);
        if (sampleCollection.id) {
            return Promise.reject(new Error('Cannot create SampleCollection, object has ID'));
        } else {
            return new Promise((resolve,reject) => {
                Promise.all( 
                    (sampleCollection.hasPart || []).map((sample:SampleResource) => dispatch(sampleResourcePost(sample)))
                ).then((samples: SampleResource[]) => {
                    sampleCollection.hasPart = samples;
                    let api : SampleCollectionApi = new SampleCollectionApi(cfg);
                    let req = api.samplecollectionsPost({user: user, sampleCollection: sampleCollection}); // This should be my username on prod.
                    req.then((resp:SampleCollection) => {
                        debug('Response for POST', resp);
                        dispatch({
                            type: SAMPLE_COLLECTIONS_ADD,
                            payload: createIdMap(resp)
                        });
                        resolve(resp);
                    });
                    req.catch((err) => {
                        console.error('Error on POST SampleCollection', err);
                        reject(err);
                    });
                });
            });
        }
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('SampleCollection error'));
    }
}

export const sampleCollectionPut: ActionThunk<Promise<SampleCollection>, MCASampleCollectionsAdd> = (sampleCollection: SampleCollection) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', sampleCollection);
        let api : SampleCollectionApi = new SampleCollectionApi(cfg);
        let id : string = getIdFromUri(sampleCollection.id);
        let req : Promise<SampleCollection> = api.samplecollectionsIdPut({id: id, user: user, sampleCollection: sampleCollection});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: SAMPLE_COLLECTIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT SampleCollection', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const sampleCollectionDelete: ActionThunk<void, MCASampleCollectionDelete> = (sampleCollection:SampleCollection) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', sampleCollection.id);
        let api : SampleCollectionApi = new SampleCollectionApi(cfg);
        let id : string = getIdFromUri(sampleCollection.id);
        let req : Promise<void> = api.samplecollectionsIdDelete({id: id, user: user}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: SAMPLE_COLLECTION_DELETE,
                uri: sampleCollection.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE SampleCollection', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
