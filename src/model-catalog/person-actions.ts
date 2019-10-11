import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, Person, PersonApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, repeatAction, DEFAULT_GRAPH, START_LOADING, END_LOADING } from './actions';

function debug () { console.log('OBA:', ...arguments); }

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
    api.personsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            dispatch({
                type: PERSONS_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_PERSONS});
        })
        .catch((err) => {console.log('Error on GET persons', err)})
}

export const PERSON_GET = "PERSON_GET";
interface MCAPersonGet extends Action<'PERSON_GET'> { payload: any };
export const personGet: ActionCreator<ModelCatalogPersonThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching person', uri);
    let id : string = uri.split('/').pop();
    let api : PersonApi = new PersonApi();
    api.personsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: PERSON_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getPerson', err)})
}

export const PERSON_POST = "PERSON_POST";
interface MCAPersonPost extends Action<'PERSON_POST'> { payload: any };
export const personPost: ActionCreator<ModelCatalogPersonThunkResult> = (person:Person) => (dispatch) => {
    debug('creating new person', person);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusAndConfig();

    if (status === 'DONE') {
        person.id = undefined;
        let api : PersonApi = new PersonApi(cfg);
        api.personsPost({user: DEFAULT_GRAPH, person: person}) // This should be my username on prod.
            .then((data) => {
                //TODO its not returning right now,
                console.log(data);
            })
            .catch((err) => {console.log('Error on POST person', err)})
    } else if (status === 'LOADING') {
        repeatAction(personPost, person);
    }
}

export const PERSON_PUT = "PERSON_PUT";
interface MCAPersonPut extends Action<'PERSON_PUT'> { payload: any };
export const personPut: ActionCreator<ModelCatalogPersonThunkResult> = ( uri: string ) => (dispatch) => {
    debug('updating person', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusAndConfig();

    if (status === 'DONE') {
        let api : PersonApi = new PersonApi(cfg);
        let id : string = uri.split('/').pop();
        api.personsIdPut({id: id, user: DEFAULT_GRAPH, person: person}) // This should be my username on prod.
            .then((data) => {
                //TODO its not returning right now,
                console.log(data);
            })
            .catch((err) => {console.log('Error on PUT person', err)})
    } else if (status === 'LOADING') {
        repeatAction(personPut, person);
    }
}

export type ModelCatalogPersonAction =  MCAPersonsGet | MCAPersonGet | MCAPersonPost | MCAPersonPut;
type ModelCatalogPersonThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogPersonAction>;
