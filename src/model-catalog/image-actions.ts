import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Image, ImageApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser,
         DEFAULT_GRAPH, geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Image]', ...args); }

export const IMAGES_ADD = "IMAGES_ADD";
export const IMAGE_DELETE = "IMAGE_DELETE";

interface MCAImagesAdd extends Action<'IMAGES_ADD'> { payload: IdMap<Image> };
interface MCAImageDelete extends Action<'IMAGE_DELETE'> { uri: string };

export type ModelCatalogImageAction =  MCAImagesAdd | MCAImageDelete;

let imagesPromise : Promise<IdMap<Image>> | null = null;

export const imagesGet: ActionThunk<Promise<IdMap<Image>>, MCAImagesAdd> = () => (dispatch) => {
    if (!imagesPromise) {
        debug('Fetching all');
        let api : ImageApi = new ImageApi();
        imagesPromise = new Promise((resolve, reject) => {
            let req : Promise<Image[]> = api.imagesGet({username: DEFAULT_GRAPH});
            req.then((resp:Image[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Image>
                dispatch({
                    type: IMAGES_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Images', err);
                reject(err);
            });
        });
    } else {
        debug('All images are already in memory or loading');
    }
    return imagesPromise;
}

export const imageGet: ActionThunk<Promise<Image>, MCAImagesAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ImageApi = new ImageApi();
    let req : Promise<Image> = api.imagesIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Image) => {
        dispatch({
            type: IMAGES_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Image', err)
    });
    return req;
}

export const imagePost: ActionThunk<Promise<Image>, MCAImagesAdd> = (image:Image) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', image);
        let postProm = new Promise((resolve,reject) => {
            let api : ImageApi = new ImageApi(cfg);
            let req = api.imagesPost({user: DEFAULT_GRAPH, image: image});
            req.then((resp:Image) => {
                debug('Response for POST', resp);
                dispatch({
                    type: IMAGES_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Image', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Image error'));
    }
}

export const imagePut: ActionThunk<Promise<Image>, MCAImagesAdd> = (image:Image) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', image);
        let api : ImageApi = new ImageApi(cfg);
        let id : string = getIdFromUri(image.id);
        let req : Promise<Image> = api.imagesIdPut({id: id, user: DEFAULT_GRAPH, image: image});
        req.then((resp:Image) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: IMAGES_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Image', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const imageDelete: ActionThunk<void, MCAImageDelete> = (image:Image) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', image);
        let api : ImageApi = new ImageApi(cfg);
        let id : string = getIdFromUri(image.id);
        let req : Promise<void> = api.imagesIdDelete({id: id, user: DEFAULT_GRAPH});
        req.then(() => {
            dispatch({
                type: IMAGE_DELETE,
                uri: image.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Image', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
