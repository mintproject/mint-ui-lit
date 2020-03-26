import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, SampleResource, SampleResourceApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC SampleResource]', ...args); }

export const SAMPLE_RESOURCES_ADD = "SAMPLE_RESOURCES_ADD";
export const SAMPLE_RESOURCE_DELETE = "SAMPLE_RESOURCE_DELETE";

export interface MCASampleResourcesAdd extends Action<'SAMPLE_RESOURCES_ADD'> { payload: IdMap<SampleResource> };
interface MCASampleResourceDelete extends Action<'SAMPLE_RESOURCE_DELETE'> { uri: string };

export type ModelCatalogSampleResourceAction =  MCASampleResourcesAdd | MCASampleResourceDelete;

let sampleResourcesPromise : Promise<IdMap<SampleResource>> | null = null;

export const sampleResourcesGet: ActionThunk<Promise<IdMap<SampleResource>>, MCASampleResourcesAdd> = () => (dispatch) => {
    if (!sampleResourcesPromise) {
        sampleResourcesPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : SampleResourceApi = new SampleResourceApi();
            let user : string = getUser();
            let req1 : Promise<SampleResource[]> = api.sampleresourcesGet({username: DEFAULT_GRAPH});
            let req2 : Promise<SampleResource[]> = api.sampleresourcesGet({username: user});

            let promises : Promise<SampleResource[]>[] = [req1, req2];
            promises.forEach((p:Promise<SampleResource[]>, i:number) => {
                p.then((resp:SampleResource[]) => dispatch({ type: SAMPLE_RESOURCES_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET SampleResources ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<SampleResource> = {};
                values.forEach((arr:SampleResource[]) => {
                    data = arr.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET SampleResources', err);
                reject(err);
            });
        });
    } else {
        debug('All sampleResources are already in memory or loading');
    }
    return sampleResourcesPromise;
}

export const sampleResourceGet: ActionThunk<Promise<SampleResource>, MCASampleResourcesAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : SampleResourceApi = new SampleResourceApi();
    let req : Promise<SampleResource> = api.sampleresourcesIdGet({username: user, id: id});
    req.then((resp:SampleResource) => {
        dispatch({
            type: SAMPLE_RESOURCES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET SampleResource', err);
    });
    return req;
}

export const sampleResourcePost: ActionThunk<Promise<SampleResource>, MCASampleResourcesAdd> = (sampleResource:SampleResource) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', sampleResource);
        if (sampleResource.id) {
            return Promise.reject(new Error('Cannot create SampleResource, object has ID'));
        } else {
            return new Promise((resolve,reject) => {
                let api : SampleResourceApi = new SampleResourceApi(cfg);
                let req = api.sampleresourcesPost({user: DEFAULT_GRAPH, sampleResource: sampleResource}); // This should be my username on prod.
                req.then((resp:SampleResource) => {
                    debug('Response for POST', resp);
                    dispatch({
                        type: SAMPLE_RESOURCES_ADD,
                        payload: createIdMap(resp)
                    });
                    resolve(resp);
                });
                req.catch((err) => {
                    console.error('Error on POST SampleResource', err);
                    reject(err);
                });
            });
        }
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('SampleResource error'));
    }
}

export const sampleResourcePut: ActionThunk<Promise<SampleResource>, MCASampleResourcesAdd> = (sampleResource: SampleResource) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', sampleResource);
        let api : SampleResourceApi = new SampleResourceApi(cfg);
        let id : string = getIdFromUri(sampleResource.id);
        let req : Promise<SampleResource> = api.sampleresourcesIdPut({id: id, user: DEFAULT_GRAPH, sampleResource: sampleResource});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: SAMPLE_RESOURCES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT SampleResource', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const sampleResourceDelete: ActionThunk<void, MCASampleResourceDelete> = (sampleResource:SampleResource) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', sampleResource.id);
        let api : SampleResourceApi = new SampleResourceApi(cfg);
        let id : string = getIdFromUri(sampleResource.id);
        let req : Promise<void> = api.sampleresourcesIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: SAMPLE_RESOURCE_DELETE,
                uri: sampleResource.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE SampleResource', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
