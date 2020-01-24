import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, SoftwareImage, SoftwareImageApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) { console.log('[MC SoftwareImage]', ...args); }

export const SOFTWARE_IMAGES_ADD = "SOFTWARE_IMAGES_ADD";
export const SOFTWARE_IMAGE_DELETE = "SOFTWARE_IMAGE_DELETE";

interface MCASoftwareImagesAdd extends Action<'SOFTWARE_IMAGES_ADD'> { payload: IdMap<SoftwareImage> };
interface MCASoftwareImageDelete extends Action<'SOFTWARE_IMAGE_DELETE'> { uri: string };

export type ModelCatalogSoftwareImageAction =  MCASoftwareImagesAdd | MCASoftwareImageDelete;

let softwareImagesPromise : Promise<IdMap<SoftwareImage>> | null = null;

export const softwareImagesGet: ActionThunk<Promise<IdMap<SoftwareImage>>, MCASoftwareImagesAdd> = () => (dispatch) => {
    if (!softwareImagesPromise) {
        softwareImagesPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : SoftwareImageApi = new SoftwareImageApi();
            let req : Promise<SoftwareImage[]> = api.softwareimagesGet({username: DEFAULT_GRAPH});
            req.then((resp:SoftwareImage[]) => {
                let data : IdMap<SoftwareImage> = resp.reduce(idReducer, {});
                dispatch({
                    type: SOFTWARE_IMAGES_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET SoftwareImages', err);
                reject(err);
            });
        });
    } else {
        debug('All softwareImages are already in memory or loading');
    }
    return softwareImagesPromise;
}

export const softwareImageGet: ActionThunk<Promise<SoftwareImage>, MCASoftwareImagesAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : SoftwareImageApi = new SoftwareImageApi();
    let req : Promise<SoftwareImage> = api.softwareimagesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:SoftwareImage) => {
        dispatch({
            type: SOFTWARE_IMAGES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET SoftwareImage', err);
    });
    return req;
}

export const softwareImagePost: ActionThunk<Promise<SoftwareImage>, MCASoftwareImagesAdd> = (softwareImage:SoftwareImage) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', softwareImage);
        let postProm = new Promise((resolve,reject) => {
            let api : SoftwareImageApi = new SoftwareImageApi(cfg);
            let req = api.softwareimagesPost({user: DEFAULT_GRAPH, softwareImage: softwareImage}); // This should be my username on prod.
            req.then((resp:SoftwareImage) => {
                debug('Response for POST', resp);
                dispatch({
                    type: SOFTWARE_IMAGES_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST SoftwareImage', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('SoftwareImage error'));
    }
}

export const softwareImagePut: ActionThunk<Promise<SoftwareImage>, MCASoftwareImagesAdd> = (softwareImage: SoftwareImage) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', softwareImage);
        let api : SoftwareImageApi = new SoftwareImageApi(cfg);
        let id : string = getIdFromUri(softwareImage.id);
        let req : Promise<SoftwareImage> = api.softwareimagesIdPut({id: id, user: DEFAULT_GRAPH, softwareImage: softwareImage});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: SOFTWARE_IMAGES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT SoftwareImage', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const softwareImageDelete: ActionThunk<void, MCASoftwareImageDelete> = (softwareImage:SoftwareImage) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', softwareImage.id);
        let api : SoftwareImageApi = new SoftwareImageApi(cfg);
        let id : string = getIdFromUri(softwareImage.id);
        let req : Promise<void> = api.softwareimagesIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: SOFTWARE_IMAGE_DELETE,
                uri: softwareImage.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE SoftwareImage', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
