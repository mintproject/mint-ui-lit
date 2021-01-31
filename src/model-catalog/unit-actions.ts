import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Unit, UnitApi, GeoShape } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         geoShapePost, geoShapeDelete } from './actions';

function debug (...args: any[]) {}// console.log('[MC Unit]', ...args); }

export const UNITS_ADD = "UNITS_ADD";
export const UNIT_DELETE = "UNIT_DELETE";

interface MCAUnitsAdd extends Action<'UNITS_ADD'> { payload: IdMap<Unit> };
interface MCAUnitDelete extends Action<'UNIT_DELETE'> { uri: string };

export type ModelCatalogUnitAction =  MCAUnitsAdd | MCAUnitDelete;

let unitsPromise : Promise<IdMap<Unit>> | null = null;

export const unitsGet: ActionThunk<Promise<IdMap<Unit>>, MCAUnitsAdd> = () => (dispatch) => {
    if (!unitsPromise) {
        debug('Fetching all');
        let api : UnitApi = new UnitApi();
        unitsPromise = new Promise((resolve, reject) => {
            let req : Promise<Unit[]> = api.unitsGet({username: getUser()});
            req.then((resp:Unit[]) => {
                let data = resp.reduce(idReducer, {}) as IdMap<Unit>
                dispatch({
                    type: UNITS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Units', err);
                reject(err);
            });
        });
    } else {
        debug('All units are already in memory or loading');
    }
    return unitsPromise;
}

export const unitGet: ActionThunk<Promise<Unit>, MCAUnitsAdd> = ( uri:string ) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : UnitApi = new UnitApi();
    let req : Promise<Unit> = api.unitsIdGet({username: getUser(), id: id});
    req.then((resp:Unit) => {
        dispatch({
            type: UNITS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Unit', err)
    });
    return req;
}

export const unitPost: ActionThunk<Promise<Unit>, MCAUnitsAdd> = (unit:Unit) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', unit);
        let postProm = new Promise((resolve,reject) => {
            let api : UnitApi = new UnitApi(cfg);
            let req = api.unitsPost({user: user, unit: unit});
            req.then((resp:Unit) => {
                debug('Response for POST', resp);
                dispatch({
                    type: UNITS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Unit', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Unit error'));
    }
}

export const unitPut: ActionThunk<Promise<Unit>, MCAUnitsAdd> = (unit:Unit) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', unit);
        let api : UnitApi = new UnitApi(cfg);
        let id : string = getIdFromUri(unit.id);
        let req : Promise<Unit> = api.unitsIdPut({id: id, user: user, unit: unit});
        req.then((resp:Unit) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: UNITS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Unit', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const unitDelete: ActionThunk<void, MCAUnitDelete> = (unit:Unit) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', unit);
        let api : UnitApi = new UnitApi(cfg);
        let id : string = getIdFromUri(unit.id);
        let req : Promise<void> = api.unitsIdDelete({id: id, user: user});
        req.then(() => {
            dispatch({
                type: UNIT_DELETE,
                uri: unit.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Unit', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
