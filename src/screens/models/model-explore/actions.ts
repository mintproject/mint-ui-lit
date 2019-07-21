import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
//import { UriModels, FetchedModel } from "./reducers";
import { UriModels } from "./reducers";

import { apiFetch, MODEL_PREFIX, VER_AND_CONF, MODELS, GET_IO, IO_VARS_AND_UNITS } from './api-fetch';

export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_SELECT = 'EXPLORER_SELECT'
export const EXPLORER_VERSIONS = 'EXPLORER_VERSIONS'
export const EXPLORER_IO = 'EXPLORER_IO'
export const EXPLORER_VAR_UNIT = 'EXPLORER_VAR_UNIT'

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionSelect extends Action<'EXPLORER_SELECT'> { key: string };
export interface ExplorerActionVersions extends Action<'EXPLORER_VERSIONS'> { uri: string, details: Array<any> };
export interface ExplorerActionIO extends Action<'EXPLORER_IO'> { uri: string, details: Array<any> };
export interface ExplorerActionVarUnit extends Action<'EXPLORER_VAR_UNIT'> { uri: string, details: Array<any> };

export type ExplorerAction = ExplorerActionFetch | ExplorerActionSelect | ExplorerActionVersions | ExplorerActionIO |
                             ExplorerActionVarUnit;

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    apiFetch({
        type: MODELS,
        rules: {
            'model': {newKey: 'uri'},
            'versions': {newValue: (value) => value.split(', ')},
            'categories': {newValue: (value) => value.split(', ')},
            'modelType': {
                newKey: 'type', 
                newValue: (value) => {
                    let sp = value.split('#');
                    return sp[sp.length-1];
                }
            },
        }
    }).then( (fetched) => {
        let data : UriModels = fetched.reduce((acc:UriModels, obj:any) => {
            acc[obj.uri] = obj;
            return acc;
        }, {} as UriModels);
        dispatch({
            type: EXPLORER_FETCH,
            models: data
        });
    });
};

export const explorerFetchVersions: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching version for', uri);
    apiFetch({
        type: VER_AND_CONF,
        model: uri
    }).then(fetched => {
        let data = fetched.reduce((acc:any, obj:any) => {
            if (!acc[obj.version]) acc[obj.version] = {}
            if (obj.config && !acc[obj.version][obj.config]) acc[obj.version][obj.config] = {};
            if (obj.calibration && !acc[obj.version][obj.config][obj.calibration])
                acc[obj.version][obj.config][obj.calibration] = {};
            return acc;
        }, {})
        dispatch({
            type: EXPLORER_VERSIONS,
            uri: uri,
            details: data
        });
    })
}

export const explorerFetchIO: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching version for', uri);
    apiFetch({
        type: GET_IO,
        config: uri,
        rules: {
            io: {newKey: 'uri'},
            prop: {newKey: 'kind', newValue: (value) => {
                let sp = value.split('#');
                return sp[sp.length -1].substring(3);
            }},
            iolabel: {newKey: 'label'},
            ioDescription: {newKey: 'desc'}
        }
    }).then(fetched => {
        dispatch({
            type: EXPLORER_IO,
            uri: uri,
            details: fetched
        })
    })
}

export const explorerFetchIOVarsAndUnits: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching variables and units for', uri);
    apiFetch({
        type: IO_VARS_AND_UNITS,
        io: uri,
        rules: {
            vp: {newKey: 'uri'},
            description: {newKey: 'desc'}
        }
    }).then(fetched => {
        dispatch({
            type: EXPLORER_VAR_UNIT,
            uri: uri,
            details: fetched
        })
    })
}

export const explorerSetSelected: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: MODEL_PREFIX + id
    })
};

export const explorerClearSelected: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: ''
    })
};
