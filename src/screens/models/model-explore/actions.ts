import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
//import { UriModels, FetchedModel } from "./reducers";
import { UriModels } from "./reducers";

import { apiFetch, MODEL_PREFIX, VER_AND_CONF, MODELS, GET_IO, IO_VARS_AND_UNITS,
         COMPATIBLE_INPUT, COMPATIBLE_OUTPUT, MODEL_METADATA} from './api-fetch';

export const EXPLORER_SELECT_MODEL = 'EXPLORER_SELECT_MODEL'
export const EXPLORER_SELECT_VERSION = 'EXPLORER_SELECT_VERSION'
export const EXPLORER_SELECT_CONFIG = 'EXPLORER_SELECT_CONFIG'
export const EXPLORER_SELECT_CALIBRATION = 'EXPLORER_SELECT_CALIBRATION'
export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_VERSIONS = 'EXPLORER_VERSIONS'
export const EXPLORER_IO = 'EXPLORER_IO'
export const EXPLORER_VAR_UNIT = 'EXPLORER_VAR_UNIT'
export const EXPLORER_COMPATIBLE_INPUT = 'EXPLORER_COMPATIBLE_INPUT'
export const EXPLORER_COMPATIBLE_OUTPUT = 'EXPLORER_COMPATIBLE_OUTPUT'
export const EXPLORER_MODEL_METADATA = 'EXPLORER_MODEL_METADATA'

export interface ExplorerActionSelectModel extends Action<'EXPLORER_SELECT_MODEL'> { uri: string };
export interface ExplorerActionSelectVersion extends Action<'EXPLORER_SELECT_VERSION'> { uri: string };
export interface ExplorerActionSelectConfig extends Action<'EXPLORER_SELECT_CONFIG'> { uri: string };
export interface ExplorerActionSelectCalibration extends Action<'EXPLORER_SELECT_CALIBRATION'> { uri: string };
export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionVersions extends Action<'EXPLORER_VERSIONS'> { uri: string, details: Array<any> };
export interface ExplorerActionIO extends Action<'EXPLORER_IO'> { uri: string, details: Array<any> };
export interface ExplorerActionVarUnit extends Action<'EXPLORER_VAR_UNIT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompInput extends Action<'EXPLORER_COMPATIBLE_INPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompOutput extends Action<'EXPLORER_COMPATIBLE_OUTPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionModelMetadata extends Action<'EXPLORER_MODEL_METADATA'> { uri: string, details: Array<any> };

export type ExplorerAction = ExplorerActionSelectModel | ExplorerActionSelectVersion | ExplorerActionSelectConfig |
                             ExplorerActionSelectCalibration | ExplorerActionFetch | ExplorerActionVersions | 
                             ExplorerActionIO | ExplorerActionVarUnit | ExplorerActionCompInput |
                             ExplorerActionCompOutput | ExplorerActionModelMetadata;

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    apiFetch({
        type: MODELS,
        rules: {
            'model': {newKey: 'uri'},
            'versions': {newKey: 'ver',newValue: (value:any) => value.split(', ')},
            'categories': {newValue: (value:any) => value.split(', ')},
            'modelType': {
                newKey: 'type', 
                newValue: (value:any) => {
                    let sp = value.split('#');
                    return sp[sp.length-1];
                }
            },
            'os': {newValue: (old:any)=>old.split('; ')},
            'pl': {newValue: (old:any)=>old.split(';')}
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
            if (!acc[obj.version]) {
                acc[obj.version] = {uri: obj.version};
            }

            if (obj.config) {
                if (!acc[obj.version].config) {
                    acc[obj.version].config = [{uri: obj.config}]
                } else if (acc[obj.version].config.filter((c:any)=>(c.uri===obj.config)).length === 0) {
                    acc[obj.version].config.push({uri: obj.config}) 
                }
            }

            if (obj.calibration) {
                let cfg = acc[obj.version].config.filter((c:any)=>(c.uri===obj.config))[0];
                if (!cfg.calibration) {
                    cfg.calibration = [{uri: obj.calibration}]
                } else {
                    cfg.calibration.push( {uri: obj.calibration})
                }
            }
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
    console.log('Fetching IO for', uri);
    apiFetch({
        type: GET_IO,
        config: uri,
        rules: {
            io: {newKey: 'uri'},
            prop: {newKey: 'kind', newValue: (value:any) => {
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

export const explorerFetchCompatibleSoftware: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching compatible software for', uri);
    let compRule = {
        description: {newKey: 'desc'},
        comp_var: {newKey: 'vars', newValue: (old:any) => [old] }
    }

    apiFetch({
        type: COMPATIBLE_OUTPUT,
        config: uri,
        rules: compRule
    }).then(fetched => {
        dispatch({
            type: EXPLORER_COMPATIBLE_OUTPUT,
            uri: uri,
            details: fetched
        })
    })

    apiFetch({
        type: COMPATIBLE_INPUT,
        config: uri,
        rules: compRule
    }).then(fetched => {
        dispatch({
            type: EXPLORER_COMPATIBLE_INPUT,
            uri: uri,
            details: fetched
        })
    })
}

export const explorerFetchMetadata: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching metadata for', uri);
    let parseUris = (v:any) => {
        return v.split(', ').map((l:any)=>{
            let sp = l.split('/');
            return sp[sp.length-1];
        })
    };

    apiFetch({
        type: MODEL_METADATA,
        modelConfig: uri,
        rules: {
            input_variables: {newValue: parseUris},
            output_variables: {newValue: parseUris},
            targetVariables: {newValue: parseUris},
            adjustableVariables: {newValue: parseUris},
            parameters: {newValue: parseUris},
            processes: {newValue: parseUris},
            gridType: {newValue: (old:any) => {
                let sp = old.split('#');
                return sp[sp.length-1];
            }},
        }
    }).then(fetched => {
        console.log(fetched)
        dispatch({
            type: EXPLORER_MODEL_METADATA,
            uri: uri,
            details: fetched
        })
    })
}


export const explorerSetModel: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: MODEL_PREFIX + id })
};

export const explorerClearModel: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: '' })
};

export const explorerSetVersion: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: uri})
};

export const explorerClearVersion: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: '' })
};

export const explorerSetConfig: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: uri})
};

export const explorerClearConfig: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: '' })
};

export const explorerSetCalibration: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: uri})
};

export const explorerClearCalibration: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: '' })
};
