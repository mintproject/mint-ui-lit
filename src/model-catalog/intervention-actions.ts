import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Intervention, InterventionApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser,
         DEFAULT_GRAPH, geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Intervention]', ...args); }

export const INTERVENTIONS_ADD = "INTERVENTIONS_ADD";
export const INTERVENTION_DELETE = "INTERVENTION_DELETE";

interface MCAInterventionsAdd extends Action<'INTERVENTIONS_ADD'> { payload: IdMap<Intervention> };
interface MCAInterventionDelete extends Action<'INTERVENTION_DELETE'> { uri: string };

export type ModelCatalogInterventionAction =  MCAInterventionsAdd | MCAInterventionDelete;

let interventionsPromise : Promise<IdMap<Intervention>> | null = null;

export const interventionsGet: ActionThunk<Promise<IdMap<Intervention>>, MCAInterventionsAdd> = () => (dispatch) => {
    if (!interventionsPromise) {
        debug('Fetching all');
        let api : InterventionApi = new InterventionApi();
        interventionsPromise = new Promise((resolve, reject) => {
            let req : Promise<Intervention[]> = api.interventionsGet({username: DEFAULT_GRAPH});
            req.then((resp:Intervention[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Intervention>
                dispatch({
                    type: INTERVENTIONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Interventions', err);
                reject(err);
            });
        });
    } else {
        debug('All interventions are already in memory or loading');
    }
    return interventionsPromise;
}

export const interventionGet: ActionThunk<Promise<Intervention>, MCAInterventionsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : InterventionApi = new InterventionApi();
    let req : Promise<Intervention> = api.interventionsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Intervention) => {
        dispatch({
            type: INTERVENTIONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Intervention', err)
    });
    return req;
}

export const interventionPost: ActionThunk<Promise<Intervention>, MCAInterventionsAdd> = (intervention:Intervention) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', intervention);
        let postProm = new Promise((resolve,reject) => {
            let api : InterventionApi = new InterventionApi(cfg);
            let req = api.interventionsPost({user: DEFAULT_GRAPH, intervention: intervention});
            req.then((resp:Intervention) => {
                debug('Response for POST', resp);
                dispatch({
                    type: INTERVENTIONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Intervention', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Intervention error'));
    }
}

export const interventionPut: ActionThunk<Promise<Intervention>, MCAInterventionsAdd> = (intervention:Intervention) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', intervention);
        let api : InterventionApi = new InterventionApi(cfg);
        let id : string = getIdFromUri(intervention.id);
        let req : Promise<Intervention> = api.interventionsIdPut({id: id, user: DEFAULT_GRAPH, intervention: intervention});
        req.then((resp:Intervention) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: INTERVENTIONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Intervention', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const interventionDelete: ActionThunk<void, MCAInterventionDelete> = (intervention:Intervention) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', intervention);
        let api : InterventionApi = new InterventionApi(cfg);
        let id : string = getIdFromUri(intervention.id);
        let req : Promise<void> = api.interventionsIdDelete({id: id, user: DEFAULT_GRAPH});
        req.then(() => {
            dispatch({
                type: INTERVENTION_DELETE,
                uri: intervention.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Intervention', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
