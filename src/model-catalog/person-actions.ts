import { Action } from "redux";
import { IdMap } from 'app/reducers'
import { Configuration, Person, PersonApi } from '@mintproject/modelcatalog_client';
import { ActionThunk, getIdFromUri, createIdMap, idReducer, getStatusConfigAndUser, 
         DEFAULT_GRAPH } from './actions';

function debug (...args: any[]) {}// console.log('[MC Person]', ...args); }

export const PERSONS_ADD = "PERSONS_ADD";
export const PERSON_DELETE = "PERSON_DELETE";

interface MCAPersonsAdd extends Action<'PERSONS_ADD'> { payload: IdMap<Person> };
interface MCAPersonDelete extends Action<'PERSON_DELETE'> { uri: string };

export type ModelCatalogPersonAction =  MCAPersonsAdd | MCAPersonDelete;

let personsPromise : Promise<IdMap<Person>> | null = null;

export const personsGet: ActionThunk<Promise<IdMap<Person>>, MCAPersonsAdd> = () => (dispatch) => {
    if (!personsPromise) {
        personsPromise = new Promise((resolve, reject) => {
            debug('Fetching all');
            let api : PersonApi = new PersonApi();
            let req : Promise<Person[]> = api.personsGet({username: DEFAULT_GRAPH});
            req.then((resp:Person[]) => {
                let data : IdMap<Person> = resp.reduce(idReducer, {});
                dispatch({
                    type: PERSONS_ADD,
                    payload: data
                });
                resolve(data);
            });
            req.catch((err) => {
                console.error('Error on GET Persons', err);
                reject(err);
            });
        });
    } else {
        debug('All persons are already in memory or loading');
    }
    return personsPromise;
}

export const personGet: ActionThunk<Promise<Person>, MCAPersonsAdd> = (uri:string) => (dispatch) => {
    debug('Fetching', uri);
    let id : string = getIdFromUri(uri);
    let api : PersonApi = new PersonApi();
    let req : Promise<Person> = api.personsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp:Person) => {
        dispatch({
            type: PERSONS_ADD,
            payload: idReducer({}, resp)
        });
    });
    req.catch((err) => {
        console.error('Error on GET Person', err);
    });
    return req;
}

export const personPost: ActionThunk<Promise<Person>, MCAPersonsAdd> = (person:Person) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Creating new', person);
        let postProm = new Promise((resolve,reject) => {
            let api : PersonApi = new PersonApi(cfg);
            let req = api.personsPost({user: DEFAULT_GRAPH, person: person}); // This should be my username on prod.
            req.then((resp:Person) => {
                debug('Response for POST', resp);
                dispatch({
                    type: PERSONS_ADD,
                    payload: createIdMap(resp)
                });
                resolve(resp);
            });
            req.catch((err) => {
                console.error('Error on POST Person', err);
                reject(err);
            });
        });
        return postProm;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Person error'));
    }
}

export const personPut: ActionThunk<Promise<Person>, MCAPersonsAdd> = (person: Person) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Updating', person);
        let api : PersonApi = new PersonApi(cfg);
        let id : string = getIdFromUri(person.id);
        let req : Promise<Person> = api.personsIdPut({id: id, user: DEFAULT_GRAPH, person: person});
        req.then((resp) => {
            debug('Response for PUT:', resp);
            dispatch({
                type: PERSONS_ADD,
                payload: idReducer({}, resp)
            });
        });
        req.catch((err) => {
            console.error('Error on PUT Person', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}

export const personDelete: ActionThunk<void, MCAPersonDelete> = (person:Person) => (dispatch) => {
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();
    if (status === 'DONE') {
        debug('Deleting', person.id);
        let api : PersonApi = new PersonApi(cfg);
        let id : string = getIdFromUri(person.id);
        let req : Promise<void> = api.personsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then(() => {
            dispatch({
                type: PERSON_DELETE,
                uri: person.id
            });
        });
        req.catch((err) => {
            console.error('Error on DELETE Person', err);
        });
        return req;
    } else {
        console.error('TOKEN ERROR:', status);
        return Promise.reject(new Error('Token error'));
    }
}
