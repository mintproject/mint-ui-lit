import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, TimeInterval, TimeIntervalApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, getUser,
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC TimeInterval]', ...args); }

export const TIME_INTERVALS_ADD = "TIME_INTERVALS_ADD";
export const TIME_INTERVAL_DELETE = "TIME_INTERVAL_DELETE";

interface MCATimeIntervalsAdd extends Action<'TIME_INTERVALS_ADD'> { payload: IdMap<TimeInterval> };
interface MCATimeIntervalDelete extends Action<'TIME_INTERVAL_DELETE'> { uri: string };

export type ModelCatalogTimeIntervalAction =  MCATimeIntervalsAdd | MCATimeIntervalDelete;

let timeIntervalsPromise : Promise<IdMap<TimeInterval>> | null = null;

export const timeIntervalsGet: ActionThunk<Promise<IdMap<TimeInterval>>, MCATimeIntervalsAdd> = () => (dispatch) => {
    if (!timeIntervalsPromise) {
        timeIntervalsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let user : string = getUser();
            let api : TimeIntervalApi = new TimeIntervalApi();
            //let req1 : Promise<TimeInterval[]> = api.timeintervalsGet({username: DEFAULT_GRAPH});
            let req2 : Promise<TimeInterval[]> = api.timeintervalsGet({username: user});

            let promises : Promise<TimeInterval[]>[] = [req2];
            promises.forEach((p:Promise<TimeInterval[]>, i:number) => {
                p.then((resp:TimeInterval[]) => dispatch({ type: TIME_INTERVALS_ADD, payload: resp.reduce(idReducer, {}) }));
                p.catch((err) => console.error('Error on GET TimeIntervals ' + (i==0?'System':'User'), err));
            });

            Promise.all(promises).then((values) => {
                let data : IdMap<TimeInterval> = {};
                values.forEach((tis:TimeInterval[]) => {
                    data = tis.reduce(idReducer, data);
                });
                resolve(data);
            }).catch((err) => {
                console.error('Error on GET TimeIntervals', err);
                reject(err);
            });
        });
    } else {
        debug('All timeIntervals are already in memory or loading');
    }
    return timeIntervalsPromise;
}

export const timeIntervalGet: ActionThunk<Promise<TimeInterval>, MCATimeIntervalsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let user : string = getUser();
    let api : TimeIntervalApi = new TimeIntervalApi();
    let req : Promise<TimeInterval> = api.timeintervalsIdGet({username: user, id: id});
    req.then((resp:TimeInterval) => {
        dispatch({
            type: TIME_INTERVALS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET TimeInterval', err);
    });
    return req;
}

export const timeIntervalPost: ActionThunk<Promise<TimeInterval>, MCATimeIntervalsAdd> = (timeInterval:TimeInterval) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', timeInterval);
        let postProm = new Promise((resolve,reject) => {
            let api : TimeIntervalApi = new TimeIntervalApi(cfg);
            let req = api.timeintervalsPost({user: DEFAULT_GRAPH, timeInterval: timeInterval}); // This should be my username on prod.
            req.then((resp:TimeInterval) => {
                debug('Response for POST', resp);
                dispatch({
                    type: TIME_INTERVALS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST TimeInterval', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('TimeInterval error'));
    }
}

export const timeIntervalPut: ActionThunk<Promise<TimeInterval>, MCATimeIntervalsAdd> = (timeInterval: TimeInterval) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', timeInterval);
        let api : TimeIntervalApi = new TimeIntervalApi(cfg);
        let id : string = getIdFromUri(timeInterval.id);
        let req : Promise<TimeInterval> = api.timeintervalsIdPut({id: id, user: DEFAULT_GRAPH, timeInterval: timeInterval});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: TIME_INTERVALS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT TimeInterval', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const timeIntervalDelete: ActionThunk<void, MCATimeIntervalDelete> = (timeInterval:TimeInterval) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', timeInterval.id);
        let api : TimeIntervalApi = new TimeIntervalApi(cfg);
        let id : string = getIdFromUri(timeInterval.id);
        let req : Promise<void> = api.timeintervalsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: TIME_INTERVAL_DELETE,
                uri: timeInterval.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE TimeInterval', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
