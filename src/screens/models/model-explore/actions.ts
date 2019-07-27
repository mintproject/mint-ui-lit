import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
//import { UriModels, FetchedModel } from "./reducers";
import { UriModels } from "./reducers";

import { apiFetch, VER_AND_CONF, MODELS, GET_IO, IO_VARS_AND_UNITS,
         COMPATIBLE_INPUT, COMPATIBLE_OUTPUT, MODEL_METADATA, GET_PARAMETERS } from './api-fetch';

export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_VERSIONS = 'EXPLORER_VERSIONS'
export const EXPLORER_IO = 'EXPLORER_IO'
export const EXPLORER_VAR_UNIT = 'EXPLORER_VAR_UNIT'
export const EXPLORER_COMPATIBLE_INPUT = 'EXPLORER_COMPATIBLE_INPUT'
export const EXPLORER_COMPATIBLE_OUTPUT = 'EXPLORER_COMPATIBLE_OUTPUT'
export const EXPLORER_MODEL_METADATA = 'EXPLORER_MODEL_METADATA'
export const EXPLORER_GET_PARAMETERS = 'EXPLORER_GET_PARAMETERS'

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionVersions extends Action<'EXPLORER_VERSIONS'> { uri: string, details: Array<any> };
export interface ExplorerActionIO extends Action<'EXPLORER_IO'> { uri: string, details: Array<any> };
export interface ExplorerActionVarUnit extends Action<'EXPLORER_VAR_UNIT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompInput extends Action<'EXPLORER_COMPATIBLE_INPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompOutput extends Action<'EXPLORER_COMPATIBLE_OUTPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionModelMetadata extends Action<'EXPLORER_MODEL_METADATA'> { uri: string, details: Array<any> };
export interface ExplorerActionGetParameters extends Action<'EXPLORER_GET_PARAMETERS'> { uri: string, details: Array<any> };

export type ExplorerAction = ExplorerActionFetch | ExplorerActionVersions | 
                             ExplorerActionIO | ExplorerActionVarUnit | ExplorerActionCompInput |
                             ExplorerActionCompOutput | ExplorerActionModelMetadata | ExplorerActionGetParameters;

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
                if (!acc[obj.version].configs) {
                    acc[obj.version].configs = [{uri: obj.config}]
                } else if (acc[obj.version].configs.filter((c:any)=>(c.uri===obj.config)).length === 0) {
                    acc[obj.version].configs.push({uri: obj.config}) 
                }
            }

            if (obj.calibration) {
                let cfg = acc[obj.version].configs.filter((c:any)=>(c.uri===obj.config))[0];
                if (!cfg.calibrations) {
                    cfg.calibrations = [{uri: obj.calibration}]
                } else {
                    cfg.calibrations.push( {uri: obj.calibration})
                }
            }
            return acc;
        }, {})
        console.log(data, Object.values(data));
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
        dispatch({
            type: EXPLORER_MODEL_METADATA,
            uri: uri,
            details: fetched
        })
    })
}

export const explorerFetchParameters: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching parameters for', uri);

    apiFetch({
        type: GET_PARAMETERS,
        config: uri,
        rules: {ptype: {newKey:'type', newValue: (old:any) => {
            let sp = old.split('#');
            return sp[sp.length-1];
        }}}
    }).then(fetched => {
        dispatch({
            type: EXPLORER_GET_PARAMETERS,
            uri: uri,
            details: fetched
        })
    })
}
