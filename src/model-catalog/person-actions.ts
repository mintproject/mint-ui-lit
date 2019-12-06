import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, Person, PersonApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) { console.log('OBA:', ...args); }

export const ALL_PERSONS = 'ALL_PERSONS'

export const PERSONS_GET = "PERSONS_GET";
interface MCAPersonsGet extends Action<'PERSONS_GET'> { payload: any };
export const personsGet: ActionCreator<ModelCatalogPersonThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_PERSONS] || state.modelCatalog.loading[ALL_PERSONS])) {
        console.log('All persons are already in memory or loading')
        return;
    }

    debug('Fetching all person');
    dispatch({type: START_LOADING, id: ALL_PERSONS});

    let api : PersonApi = new PersonApi();
    let req = api.personsGet({username: DEFAULT_GRAPH});
    req.then((data) => {
        dispatch({
            type: PERSONS_GET,
            payload: data.reduce(idReducer, {})
        });
        dispatch({type: END_LOADING, id: ALL_PERSONS});
    });
    req.catch((err) => {console.log('Error on GET persons', err)});
}

export const PERSON_GET = "PERSON_GET";
interface MCAPersonGet extends Action<'PERSON_GET'> { payload: any };
export const personGet: ActionCreator<ModelCatalogPersonThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching person', uri);
    let id : string = uri.split('/').pop();
    let api : PersonApi = new PersonApi();
    let req = api.personsIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
        let data = {};
        data[uri] = resp;
        dispatch({
            type: PERSON_GET,
            payload: data
        });
    });
    req.catch((err) => {console.log('Error on getPerson', err)});
}

export const PERSON_POST = "PERSON_POST";
interface MCAPersonPost extends Action<'PERSON_POST'> { payload: any };
export const personPost: ActionCreator<ModelCatalogPersonThunkResult> = (person:Person, identifier:string) => (dispatch) => {
    debug('creating new person', person);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        person.id = undefined;
        let api : PersonApi = new PersonApi(cfg);
        let req = api.personsPost({user: DEFAULT_GRAPH, person: person}); // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for POST person:', resp);
            //Its returning the ID without the prefix
            let uri = PREFIX_URI + resp.id;
            let data = {};
            data[uri] = resp;
            resp.id = uri;
            dispatch({
                type: PERSON_GET,
                payload: data
            });
            dispatch({type: END_POST, id: identifier, uri: uri});
        });
        req.catch((err) => {console.log('Error on POST person', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const PERSON_PUT = "PERSON_PUT";
interface MCAPersonPut extends Action<'PERSON_PUT'> { payload: any };
export const personPut: ActionCreator<ModelCatalogPersonThunkResult> = ( person: Person ) => (dispatch) => {
    debug('updating person', person.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: person.id});
        let api : PersonApi = new PersonApi(cfg);
        let id : string = person.id.split('/').pop();
        let req = api.personsIdPut({id: id, user: DEFAULT_GRAPH, person: person}); // This should be my username on prod.
        req.then((resp) => {
            console.log('Response for PUT person:', resp);
            let data = {};
            data[person.id] = resp;
            dispatch({
                type: PERSON_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: person.id});
        });
        req.catch((err) => {console.log('Error on PUT person', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export const PERSON_DELETE = "PERSON_DELETE";
interface MCAPersonDelete extends Action<'PERSON_DELETE'> { uri: string };
export const personDelete: ActionCreator<ModelCatalogPersonThunkResult> = ( uri: string ) => (dispatch) => {
    debug('deleting person', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : PersonApi = new PersonApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.personsIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
            dispatch({
                type: PERSON_DELETE,
                uri: uri
            });
            /*console.log('Response for DELETE person:', resp);
            let data = {};
            data[person.id] = resp;
            dispatch({
                type: PERSON_GET,
                payload: data
            });
            dispatch({type: END_LOADING, id: person.id});*/
        });
        req.catch((err) => {console.log('Error on DELETE person', err)});
    } else {
        console.error('TOKEN ERROR:', status);
    }
}

export type ModelCatalogPersonAction =  MCACommon | MCAPersonsGet | MCAPersonGet | MCAPersonPost | MCAPersonPut |
                                        MCAPersonDelete;
type ModelCatalogPersonThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogPersonAction>;
