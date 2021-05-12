import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Constraint, ConstraintApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser } from './actions';

function debug (...args: any[]) {}// console.log('[MC Constraint]', ...args); }

export const CONSTRAINTS_ADD = "CONSTRAINTS_ADD";
export const CONSTRAINT_DELETE = "CONSTRAINT_DELETE";

interface MCAConstraintsAdd extends Action<'CONSTRAINTS_ADD'> { payload: IdMap<Constraint> };
interface MCAConstraintDelete extends Action<'CONSTRAINT_DELETE'> { uri: string };

export type ModelCatalogConstraintAction =  MCAConstraintsAdd | MCAConstraintDelete;

let constraintsPromise : Promise<IdMap<Constraint>> | null = null;

export const constraintsGet: ActionThunk<Promise<IdMap<Constraint>>, MCAConstraintsAdd> = () => (dispatch) => {
    if (!constraintsPromise) {
        debug('Fetching all');
        let api : ConstraintApi = new ConstraintApi();
        constraintsPromise = new Promise((resolve, reject) => {
            let req : Promise<Constraint[]> = api.constraintsGet({username: getUser()});
            req.then((resp:Constraint[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Constraint>
                dispatch({
                    type: CONSTRAINTS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Constraints', err);
                reject(err);
            });
        });
    } else {
        debug('All constraints are already in memory or loading');
    }
    return constraintsPromise;
}

export const constraintGet: ActionThunk<Promise<Constraint>, MCAConstraintsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : ConstraintApi = new ConstraintApi();
    let req : Promise<Constraint> = api.constraintsIdGet({username: getUser(), id: id});
    req.then((resp:Constraint) => {
        dispatch({
            type: CONSTRAINTS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Constraint', err)
    });
    return req;
}

export const constraintPost: ActionThunk<Promise<Constraint>, MCAConstraintsAdd> = (constraint:Constraint) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', constraint);
        let postProm = new Promise((resolve,reject) => {
            let api : ConstraintApi = new ConstraintApi(cfg);
            let req = api.constraintsPost({user: user, constraint: constraint});
            req.then((resp:Constraint) => {
                debug('Response for POST', resp);
                dispatch({
                    type: CONSTRAINTS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Constraint', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Constraint error'));
    }
}

export const constraintPut: ActionThunk<Promise<Constraint>, MCAConstraintsAdd> = (constraint:Constraint) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', constraint);
        let api : ConstraintApi = new ConstraintApi(cfg);
        let id : string = getIdFromUri(constraint.id);
        let req : Promise<Constraint> = api.constraintsIdPut({id: id, user: user, constraint: constraint});
        req.then((resp:Constraint) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: CONSTRAINTS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Constraint', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const constraintDelete: ActionThunk<void, MCAConstraintDelete> = (constraint:Constraint) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', constraint);
        let api : ConstraintApi = new ConstraintApi(cfg);
        let id : string = getIdFromUri(constraint.id);
        let req : Promise<void> = api.constraintsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: CONSTRAINT_DELETE,
                uri: constraint.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Constraint', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
