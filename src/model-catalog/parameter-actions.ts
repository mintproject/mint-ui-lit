import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, Parameter, ParameterApi } from '@mintproject/modelcatalog_client';
import { idReducer, getStatusConfigAndUser, repeatAction, PREFIX_URI, DEFAULT_GRAPH,
         START_LOADING, END_LOADING, START_POST, END_POST, MCACommon } from './actions';

function debug (...args: any[]) {}// console.log('OBA:', ...args); }

export const ALL_PARAMETERS = 'ALL_PARAMETERS'

export const PARAMETERS_GET = "PARAMETERS_GET";
interface MCAParametersGet extends Action<'PARAMETERS_GET'> { payload: any };
export const parametersGet: ActionCreator<ModelCatalogParameterThunkResult> = () => (dispatch) => {
    let state: any = store.getState();
    if (state.modelCatalog && (state.modelCatalog.loadedAll[ALL_PARAMETERS] || state.modelCatalog.loading[ALL_PARAMETERS])) {
        console.log('All parameters are already in memory or loading')
        return;
    }

    debug('Fetching all parameter');
    dispatch({type: START_LOADING, id: ALL_PARAMETERS});

    let api : ParameterApi = new ParameterApi();
    let req = api.parametersGet({username: DEFAULT_GRAPH});
    req.then((data) => {
            dispatch({
                type: PARAMETERS_GET,
                payload: data.reduce(idReducer, {})
            });
            dispatch({type: END_LOADING, id: ALL_PARAMETERS});
    });
    req.catch((err) => {console.log('Error on GET parameters', err)});
}

export const PARAMETER_GET = "PARAMETER_GET";
export interface MCAParameterGet extends Action<'PARAMETER_GET'> { payload: any };
export const parameterGet: ActionCreator<ModelCatalogParameterThunkResult> = ( uri:string ) => (dispatch) => {
    debug('Fetching parameter', uri);
    let id : string = uri.split('/').pop();
    let api : ParameterApi = new ParameterApi();
    let req = api.parametersIdGet({username: DEFAULT_GRAPH, id: id});
    req.then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: PARAMETER_GET,
                payload: data
            });
    });
    req.catch((err) => {console.log('Error on getParameter', err)});
}

export const PARAMETER_POST = "PARAMETER_POST";
interface MCAParameterPost extends Action<'PARAMETER_POST'> { payload: any };
export const parameterPost: ActionCreator<ModelCatalogParameterThunkResult> = (parameter:Parameter, identifier:string) => (dispatch) => {
    debug('creating new parameter', parameter);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_POST, id: identifier});
        parameter.id = undefined;
        let api : ParameterApi = new ParameterApi(cfg);
        let req = api.parametersPost({user: DEFAULT_GRAPH, parameter: parameter}) // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for POST parameter:', resp);
                //Its returning the ID without the prefix
                let uri = PREFIX_URI + resp.id;
                let data = {};
                data[uri] = resp;
                resp.id = uri;
                dispatch({
                    type: PARAMETER_GET,
                    payload: data
                });
                dispatch({type: END_POST, id: identifier, uri: uri});
        });
        req.catch((err) => {console.log('Error on POST parameter', err)});
    } else if (status === 'LOADING') {
        repeatAction(parameterPost, parameter);
    }
}

export const PARAMETER_PUT = "PARAMETER_PUT";
interface MCAParameterPut extends Action<'PARAMETER_PUT'> { payload: any };
export const parameterPut: ActionCreator<ModelCatalogParameterThunkResult> = ( parameter: Parameter ) => (dispatch) => {
    debug('updating parameter', parameter.id);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        dispatch({type: START_LOADING, id: parameter.id});
        let api : ParameterApi = new ParameterApi(cfg);
        let id : string = parameter.id.split('/').pop();
        let req = api.parametersIdPut({id: id, user: DEFAULT_GRAPH, parameter: parameter}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for PUT parameter:', resp);
                let data = {};
                data[parameter.id] = resp;
                dispatch({
                    type: PARAMETER_GET,
                    payload: data
                });
                dispatch({type: END_LOADING, id: parameter.id});
        });
        req.catch((err) => {console.log('Error on PUT parameter', err)});
    } else if (status === 'LOADING') {
        repeatAction(parameterPut, parameter);
    }
}

export const PARAMETER_DELETE = "PARAMETER_DELETE";
interface MCAParameterDelete extends Action<'PARAMETER_DELETE'> {uri: string};
export const parameterDelete: ActionCreator<ModelCatalogParameterThunkResult> = ( uri: string ) => (dispatch) => {
    debug('updating parameter', uri);
    let status : string, cfg : Configuration, user : string;
    [status, cfg, user] = getStatusConfigAndUser();

    if (status === 'DONE') {
        let api : ParameterApi = new ParameterApi(cfg);
        let id : string = uri.split('/').pop();
        let req = api.parametersIdDelete({id: id, user: DEFAULT_GRAPH}); // This should be my username on prod.
        req.then((resp) => {
                console.log('Response for DELETE parameter:', resp);
                dispatch({
                    type: PARAMETER_DELETE,
                    uri: uri
                });
        });
        req.catch((err) => {console.log('Error on DELETE parameter', err)});
    } else if (status === 'LOADING') {
        repeatAction(parameterDelete, uri);
    }
}

export type ModelCatalogParameterAction =  MCACommon | MCAParametersGet | MCAParameterGet | MCAParameterPost |
                                           MCAParameterPut | MCAParameterDelete;
type ModelCatalogParameterThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogParameterAction>;
