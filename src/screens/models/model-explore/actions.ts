import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
//import { UriModels, FetchedModel } from "./reducers";
import { UriModels } from "./reducers";

import { apiFetch, VER_AND_CONF, MODELS, GET_IO, IO_VARS_AND_UNITS, EXPLANATION_DIAGRAMS,
         COMPATIBLE_INPUT, COMPATIBLE_OUTPUT, MODEL_METADATA, GET_PARAMETERS, SEARCH_BY_VAR_NAME } from './api-fetch';

export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_VERSIONS = 'EXPLORER_VERSIONS'
export const EXPLORER_URLS = 'EXPLORER_URLS'
export const EXPLORER_IO = 'EXPLORER_IO'
export const EXPLORER_VAR_UNIT = 'EXPLORER_VAR_UNIT'
export const EXPLORER_COMPATIBLE_INPUT = 'EXPLORER_COMPATIBLE_INPUT'
export const EXPLORER_COMPATIBLE_OUTPUT = 'EXPLORER_COMPATIBLE_OUTPUT'
export const EXPLORER_MODEL_METADATA = 'EXPLORER_MODEL_METADATA'
export const EXPLORER_GET_PARAMETERS = 'EXPLORER_GET_PARAMETERS'
export const EXPLORER_GET_EXPL_DIAGS = 'EXPLORER_GET_EXPL_DIAGS'
export const EXPLORER_SEARCH_BY_VAR_NAME = 'EXPLORER_SEARCH_BY_VAR_NAME'

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionVersions extends Action<'EXPLORER_VERSIONS'> { uri: string, details: Array<any> };
export interface ExplorerActionUrls extends Action<'EXPLORER_URLS'> { details: Map<string, string> };
export interface ExplorerActionIO extends Action<'EXPLORER_IO'> { uri: string, details: Array<any> };
export interface ExplorerActionVarUnit extends Action<'EXPLORER_VAR_UNIT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompInput extends Action<'EXPLORER_COMPATIBLE_INPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionCompOutput extends Action<'EXPLORER_COMPATIBLE_OUTPUT'> { uri: string, details: Array<any> };
export interface ExplorerActionModelMetadata extends Action<'EXPLORER_MODEL_METADATA'> { uri: string, details: Array<any> };
export interface ExplorerActionGetParameters extends Action<'EXPLORER_GET_PARAMETERS'> { uri: string, details: Array<any> };
export interface ExplorerActionGetExplDiags extends Action<'EXPLORER_GET_EXPL_DIAGS'> { uri: string, details: Array<any> };
export interface ExplorerActionSearchByVarName extends Action<'EXPLORER_SEARCH_BY_VAR_NAME'> { text: string, details: Array<any> };

export type ExplorerAction = ExplorerActionFetch | ExplorerActionVersions | ExplorerActionGetExplDiags | ExplorerActionUrls |
                             ExplorerActionIO | ExplorerActionVarUnit | ExplorerActionCompInput | ExplorerActionSearchByVarName |
                             ExplorerActionCompOutput | ExplorerActionModelMetadata | ExplorerActionGetParameters;

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

function debug (...args) {
    //console.log(...arguments);
}

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    apiFetch({
        type: MODELS,
        rules: {
            'model': {newKey: 'uri'},
            'versions': {newKey: 'ver',newValue: (value:any) => value.split(', ')},
            'categories': {newValue: (value:any) => value.split(', ')},
            'modelType': {
                newKey: 'type', 
                newValue: (old:any) => old.replace(/(.*?#)(.*)(Model)/, '$2').replace('-', ' ')
            },
            'authors': {newValue: (old:any) => old.split(', ')},
            'citations': {newValue: (old:any) => old.split(', ')},
            'os': {newValue: (old:any)=>old.split(/ *; */)},
            'pl': {newValue: (old:any)=>old.split(/ *; */)},
            'keywords': {newValue: (old:any)=>old.split(/ *; */)},
            'restrictions': {newValue: (old:any)=>old.split(', ')},
            'typicalDataSource': {newValue: (old:any)=>old.split(', ')},
            'screenshots': {newValue: (old:any)=>old.split(', ')},
            'explanationDiagrams': {newValue: (old:any)=>old.split(', ')},
            'purpose': {newValue: (old:any)=>old.split(/ *; */)}
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
    debug('Fetching version for', uri);
    apiFetch({
        type: VER_AND_CONF,
        model: uri
    }).then(fetched => {
        let data = fetched.reduce((acc:any, obj:any) => {
            if (!acc[obj.version]) {
                acc[obj.version] = {uri: obj.version, label: obj.versionLabel, id: obj.versionId};
            }

            if (obj.config) {
                if (!acc[obj.version].configs) {
                    acc[obj.version].configs = [{uri: obj.config, label: obj.configLabel}]
                } else if (acc[obj.version].configs.filter((c:any)=>(c.uri===obj.config)).length === 0) {
                    acc[obj.version].configs.push({uri: obj.config, label: obj.configLabel}) 
                }
            }

            if (obj.calibration) {
                let cfg = acc[obj.version].configs.filter((c:any)=>(c.uri===obj.config))[0];
                if (!cfg.calibrations) {
                    cfg.calibrations = [{uri: obj.calibration, label: obj.calibrationLabel}]
                } else {
                    cfg.calibrations.push( {uri: obj.calibration, label: obj.calibrationLabel})
                }
            }
            return acc;
        }, {})

        let urls = {}
        let baseUrl = 'models/explore/' + uri.split('/').pop();
        // create urls going backwards on versions 
        Object.values(data).forEach((ver:any, i:number) => {
            let verUrl = baseUrl + '/' + ver.id;
            let cfgUrl, calUrl;
            for (let j = (ver.configs ? ver.configs.length : 0)-1; j >= 0; j--) {
                cfgUrl = verUrl + '/' + ver.configs[j].uri.split('/').pop();
                calUrl = '';
                for (let k = (ver.configs[j].calibrations ? ver.configs[j].calibrations.length : 0)-1; k >= 0; k--) {
                    calUrl = cfgUrl + '/' + ver.configs[j].calibrations[k].uri.split('/').pop();
                    urls[ver.configs[j].calibrations[k].uri] = calUrl;
                }
                urls[ver.configs[j].uri] = calUrl || cfgUrl;
            }
            urls[ver.uri] = calUrl || cfgUrl || verUrl;
            if (i === 0) {
                urls[uri] = calUrl || cfgUrl || verUrl || baseUrl;
            }
        });

        dispatch({
            type: EXPLORER_VERSIONS,
            uri: uri,
            details: Object.values(data)
        });
        
        dispatch({
            type: EXPLORER_URLS,
            details: urls
        });
    })
}

export const explorerFetchIO: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    debug('Fetching IO for', uri);
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
        let data = fetched.reduce((acc:any, item:any) => {
            if (!acc[item.uri]) {
                acc[item.uri] = { ...item, st: [], units: [], vp :[] };
            }
            if (item.st)    acc[item.uri].st.push(item.st);
            if (item.units) acc[item.uri].units.push(item.units);
            if (item.vp)    acc[item.uri].vp.push(item.vp);
            return acc;
        }, {});
        dispatch({
            type: EXPLORER_IO,
            uri: uri,
            details: Object.values(data)
        })
    })
}

export const explorerFetchIOVarsAndUnits: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    debug('Fetching variables and units for', uri);
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
    debug('Fetching compatible software for', uri);
    let compRule = {
        description: {newKey: 'desc'},
        comp_var: {newKey: 'vars', newValue: (old:any) => old.split(/ *, */) },
        comp_config: {newKey: 'uri'}
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
    debug('Fetching metadata for', uri);
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
    debug('Fetching parameters for', uri);

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

export const explorerFetchExplDiags: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    debug('Fetching exploration diagrams for', uri);
    apiFetch({
        type: EXPLANATION_DIAGRAMS,
        v: uri,
        rules: {
            img: {newKey: 'uri'},
        }
    }).then(fetched => {
        dispatch({
            type: EXPLORER_GET_EXPL_DIAGS,
            uri: uri,
            details: fetched
        })
    })
}

export const explorerSearchByVarName: ActionCreator<ExplorerThunkResult> = (text:string) => (dispatch) => {
    debug('Searching models by variable name:', text);
    apiFetch({
        type: SEARCH_BY_VAR_NAME,
        text: text,
        rules: {
            c: {newKey: 'config'},
            modelV: {newKey: 'version'}
        }
    }).then(fetched => {
        let data = fetched.reduce((acc:any, obj:any) => {
            if (!acc[obj.model]) acc[obj.model] = new Set();
            acc[obj.model].add(obj.desc);
            return acc;
        }, {});
        Object.keys(data).forEach((key:string) => {
            data[key] = Array.from(data[key]);
        });
        dispatch({
            type: EXPLORER_SEARCH_BY_VAR_NAME,
            text: text,
            details: data
        })
    })
}
