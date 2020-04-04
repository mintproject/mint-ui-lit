import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Visualization, VisualizationApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Visualization]', ...args); }

export const VISUALIZATIONS_ADD = "VISUALIZATIONS_ADD";
export const VISUALIZATION_DELETE = "VISUALIZATION_DELETE";

interface MCAVisualizationsAdd extends Action<'VISUALIZATIONS_ADD'> { payload: IdMap<Visualization> };
interface MCAVisualizationDelete extends Action<'VISUALIZATION_DELETE'> { uri: string };

export type ModelCatalogVisualizationAction =  MCAVisualizationsAdd | MCAVisualizationDelete;

let visualizationsPromise : Promise<IdMap<Visualization>> | null = null;

export const visualizationsGet: ActionThunk<Promise<IdMap<Visualization>>, MCAVisualizationsAdd> = () => (dispatch) => {
    if (!visualizationsPromise) {
        debug('Fetching all');
        let api : VisualizationApi = new VisualizationApi();
        visualizationsPromise = new Promise((resolve, reject) => {
            let req : Promise<Visualization[]> = api.visualizationsGet({username: getUser()});
            req.then((resp:Visualization[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Visualization>
                dispatch({
                    type: VISUALIZATIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Visualizations', err);
                reject(err);
            });
        });
    } else {
        debug('All visualizations are already in memory or loading');
    }
    return visualizationsPromise;
}

export const visualizationGet: ActionThunk<Promise<Visualization>, MCAVisualizationsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : VisualizationApi = new VisualizationApi();
    let req : Promise<Visualization> = api.visualizationsIdGet({username: getUser(), id: id});
    req.then((resp:Visualization) => {
        dispatch({
            type: VISUALIZATIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Visualization', err)
    });
    return req;
}

export const visualizationPost: ActionThunk<Promise<Visualization>, MCAVisualizationsAdd> = (visualization:Visualization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', visualization);
        let postProm = new Promise((resolve,reject) => {
            let api : VisualizationApi = new VisualizationApi(cfg);
            let req = api.visualizationsPost({user: user, visualization: visualization});
            req.then((resp:Visualization) => {
                debug('Response for POST', resp);
                dispatch({
                    type: VISUALIZATIONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Visualization', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Visualization error'));
    }
}

export const visualizationPut: ActionThunk<Promise<Visualization>, MCAVisualizationsAdd> = (visualization:Visualization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', visualization);
        let api : VisualizationApi = new VisualizationApi(cfg);
        let id : string = getIdFromUri(visualization.id);
        let req : Promise<Visualization> = api.visualizationsIdPut({id: id, user: user, visualization: visualization});
        req.then((resp:Visualization) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: VISUALIZATIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Visualization', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const visualizationDelete: ActionThunk<void, MCAVisualizationDelete> = (visualization:Visualization) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', visualization);
        let api : VisualizationApi = new VisualizationApi(cfg);
        let id : string = getIdFromUri(visualization.id);
        let req : Promise<void> = api.visualizationsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: VISUALIZATION_DELETE,
                uri: visualization.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Visualization', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
