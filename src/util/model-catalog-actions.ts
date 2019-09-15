import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../app/store";

import { apiFetch, MODELS, VERSIONS_AND_CONFIGS, CATEGORIES, CONFIGS, CONFIGS_AND_IOS, INPUTS_AND_VARS_SN,
         OUTPUTS_AND_VARS_SN, VARS_AND_SN, METADATA_FOR_ANY, VERSIONS_FOR_MODEL, VARS_FOR_MODEL, AUTHORS_FOR_MODEL_CONFIG, 
         GRID_FOR_MODEL_CONFIG, SCREENSHOTS_FOR_MODEL_CONFIG, DIAGRAMS_FOR_MODEL_CONFIG, METADATA_FOR_MODEL_CONFIG,
         METADATA_NOIO_FOR_MODEL_CONFIG, PARAMETERS_FOR_CONFIG, INPUT_COMPATIBLE_FOR_CONFIG, OUTPUT_COMPATIBLE_FOR_CONFIG,
         IO_FOR_CONFIG, IO_AND_VARS_SN_FOR_CONFIG, VARS_SN_AND_UNITS_FOR_IO, CONFIGS_FOR_VAR, CONFIGS_FOR_VAR_SN, 
         CALIBRATIONS_FOR_VAR_SN, IO_FOR_VAR_SN, METADATA_FOR_VAR_SN, PROCESS_FOR_CAG, SEARCH_MODEL_BY_NAME, 
         SEARCH_MODEL_BY_CATEGORY, SEARCH_ANY, SEARCH_IO, SEARCH_MODEL, SEARCH_VAR, SEARCH_MODEL_BY_VAR_SN,
         SAMPLE_VIS_FOR_MODEL_CONFIG } from './model-catalog-requests';

function debug (...args) {
    //console.log(...arguments);
}

export const ADD_URLS                              = "ADD_URLS";
export const FETCH_MODELS                          = "FETCH_MODELS";
export const FETCH_VERSIONS_AND_CONFIGS            = "FETCH_VERSIONS_AND_CONFIGS";
export const FETCH_CATEGORIES                      = "FETCH_CATEGORIES";
export const FETCH_CONFIGS                         = "FETCH_CONFIGS";
export const FETCH_CONFIGS_AND_IOS                 = "FETCH_CONFIGS_AND_IOS";
export const FETCH_INPUTS_AND_VARS_SN              = "FETCH_INPUTS_AND_VARS_SN";
export const FETCH_OUTPUTS_AND_VARS_SN             = "FETCH_OUTPUTS_AND_VARS_SN";
export const FETCH_VARS_AND_SN                     = "FETCH_VARS_AND_SN";
export const FETCH_METADATA_FOR_ANY                = "FETCH_METADATA_FOR_ANY";
export const FETCH_VERSIONS_FOR_MODEL              = "FETCH_VERSIONS_FOR_MODEL";
export const FETCH_VARS_FOR_MODEL                  = "FETCH_VARS_FOR_MODEL";
export const FETCH_AUTHORS_FOR_MODEL_CONFIG        = "FETCH_AUTHORS_FOR_MODEL_CONFIG";
export const FETCH_GRID_FOR_MODEL_CONFIG           = "FETCH_GRID_FOR_MODEL_CONFIG";
export const FETCH_SCREENSHOTS_FOR_MODEL_CONFIG    = "FETCH_SCREENSHOTS_FOR_MODEL_CONFIG";
export const FETCH_DIAGRAMS_FOR_MODEL_CONFIG       = "FETCH_DIAGRAMS_FOR_MODEL_CONFIG";
export const FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG     = "FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG";
export const FETCH_METADATA_FOR_MODEL_CONFIG       = "FETCH_METADATA_FOR_MODEL_CONFIG";
export const FETCH_METADATA_NOIO_FOR_MODEL_CONFIG  = "FETCH_METADATA_NOIO_FOR_MODEL_CONFIG";
export const FETCH_PARAMETERS_FOR_CONFIG           = "FETCH_PARAMETERS_FOR_CONFIG";
export const FETCH_INPUT_COMPATIBLE_FOR_CONFIG     = "FETCH_INPUT_COMPATIBLE_FOR_CONFIG";
export const FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG    = "FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG";
export const FETCH_IO_FOR_CONFIG                   = "FETCH_IO_FOR_CONFIG";
export const FETCH_IO_AND_VARS_SN_FOR_CONFIG       = "FETCH_IO_AND_VARS_SN_FOR_CONFIG";
export const FETCH_VARS_SN_AND_UNITS_FOR_IO        = "FETCH_VARS_SN_AND_UNITS_FOR_IO";
export const FETCH_CONFIGS_FOR_VAR                 = "FETCH_CONFIGS_FOR_VAR";
export const FETCH_CONFIGS_FOR_VAR_SN              = "FETCH_CONFIGS_FOR_VAR_SN";
export const FETCH_CALIBRATIONS_FOR_VAR_SN         = "FETCH_CALIBRATIONS_FOR_VAR_SN";
export const FETCH_IO_FOR_VAR_SN                   = "FETCH_IO_FOR_VAR_SN";
export const FETCH_METADATA_FOR_VAR_SN             = "FETCH_METADATA_FOR_VAR_SN";
export const FETCH_PROCESS_FOR_CAG                 = "FETCH_PROCESS_FOR_CAG";
export const FETCH_SEARCH_MODEL_BY_NAME            = "FETCH_SEARCH_MODEL_BY_NAME";
export const FETCH_SEARCH_MODEL_BY_CATEGORY        = "FETCH_SEARCH_MODEL_BY_CATEGORY";
export const FETCH_SEARCH_ANY                      = "FETCH_SEARCH_ANY";
export const FETCH_SEARCH_IO                       = "FETCH_SEARCH_IO";
export const FETCH_SEARCH_MODEL                    = "FETCH_SEARCH_MODEL";
export const FETCH_SEARCH_VAR                      = "FETCH_SEARCH_VAR";
export const FETCH_SEARCH_MODEL_BY_VAR_SN          = "FETCH_SEARCH_MODEL_BY_VAR_SN";

interface ActionData<T> extends Action<T> { data: any };
interface UriParams<T> extends ActionData<T> { uri: string };

interface ActionAddURLs                            extends ActionData<'ADD_URLS'> {};
interface ActionFetchModels                        extends ActionData<'MODELS'> {};
interface ActionFetchVersionsAndConfigs            extends ActionData<'VERSIONS_AND_CONFIGS'> {};
interface ActionFetchCategories                    extends ActionData<'CATEGORIES'> {};
interface ActionFetchConfigs                       extends ActionData<'CONFIGS'> {};
interface ActionFetchConfigsAndIOs                 extends ActionData<'CONFIGS_AND_IOS'> {};
interface ActionFetchInputsAndVarsSN               extends ActionData<'INPUTS_AND_VARS_SN'> {};
interface ActionFetchOutputsAndVarsSN              extends ActionData<'OUTPUTS_AND_VARS_SN'> {};
interface ActionFetchVarsAndSN                     extends ActionData<'VARS_AND_SN'> {};
interface ActionFetchMetadataForAny                extends UriParams<'FETCH_METADATA_FOR_ANY'> {};
interface ActionFetchVersionsForModel              extends UriParams<'FETCH_VERSIONS_FOR_MODEL'> {};
interface ActionFetchVarsForModel                  extends UriParams<'FETCH_VARS_FOR_MODEL'> {};
interface ActionFetchAuthorsForModelConfig         extends UriParams<'FETCH_AUTHORS_FOR_MODEL_CONFIG'> {};
interface ActionFetchGridForModelConfig            extends UriParams<'FETCH_GRID_FOR_MODEL_CONFIG'> {};
interface ActionFetchScreenshotsForModelConfig     extends UriParams<'FETCH_SCREENSHOTS_FOR_MODEL_CONFIG'> {};
interface ActionFetchDiagramsForModelConfig        extends UriParams<'FETCH_DIAGRAMS_FOR_MODEL_CONFIG'> {};
interface ActionFetchSampleVisForModelConfig       extends UriParams<'FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG'> {};
interface ActionFetchMetadataForModelConfig        extends UriParams<'FETCH_METADATA_FOR_MODEL_CONFIG'> {};
interface ActionFetchMetadataNoioForModelConfig    extends UriParams<'FETCH_METADATA_NOIO_FOR_MODEL_CONFIG'> {};
interface ActionFetchParametersForConfig           extends UriParams<'FETCH_PARAMETERS_FOR_CONFIG'> {};
interface ActionFetchInputCompatibleForConfig      extends UriParams<'FETCH_INPUT_COMPATIBLE_FOR_CONFIG'> {};
interface ActionFetchOutputCompatibleForConfig     extends UriParams<'FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG'> {};
interface ActionFetchIOForConfig                   extends UriParams<'FETCH_IO_FOR_CONFIG'> {};
interface ActionFetchIOAndVarsSNForConfig          extends UriParams<'FETCH_IO_AND_VARS_SN_FOR_CONFIG'> {};
interface ActionFetchVarsSNAndUnitsForIO           extends UriParams<'FETCH_VARS_SN_AND_UNITS_FOR_IO'> {};
interface ActionFetchConfigsForVar                 extends UriParams<'FETCH_CONFIGS_FOR_VAR'> {};
interface ActionFetchConfigsForVarSN               extends UriParams<'FETCH_CONFIGS_FOR_VAR_SN'> {};
interface ActionFetchCalibrationsForVarSN          extends UriParams<'FETCH_CALIBRATIONS_FOR_VAR_SN'> {};
interface ActionFetchIOForVarSN                    extends UriParams<'FETCH_IO_FOR_VAR_SN'> {};
interface ActionFetchMetadataForVarSN              extends UriParams<'FETCH_METADATA_FOR_VAR_SN'> {};
interface ActionFetchProcessForCag                 extends UriParams<'FETCH_PROCESS_FOR_CAG'> {};
interface ActionFetchSearchModelByName             extends UriParams<'FETCH_SEARCH_MODEL_BY_NAME'> {};
interface ActionFetchSearchModelByCategory         extends UriParams<'FETCH_SEARCH_MODEL_BY_CATEGORY'> {};
interface ActionFetchSearchAny                     extends UriParams<'FETCH_SEARCH_ANY'> {};
interface ActionFetchSearchIO                      extends UriParams<'FETCH_SEARCH_IO'> {};
interface ActionFetchSearchModel                   extends UriParams<'FETCH_SEARCH_MODEL'> {};
interface ActionFetchSearchVar                     extends UriParams<'FETCH_SEARCH_VAR'> {};
interface ActionFetchSearchModelByVarSN            extends UriParams<'FETCH_SEARCH_MODEL_BY_VAR_SN'> {};          

export type ApiAction = ActionFetchModels | ActionFetchVersionsAndConfigs | ActionFetchCategories | ActionFetchConfigs |
                        ActionFetchConfigsAndIOs | ActionFetchInputsAndVarsSN | ActionFetchOutputsAndVarsSN |
                        ActionFetchVarsAndSN | ActionFetchMetadataForAny | ActionFetchVersionsForModel |
                        ActionFetchVarsForModel | ActionFetchAuthorsForModelConfig | ActionFetchGridForModelConfig |
                        ActionFetchScreenshotsForModelConfig | ActionFetchDiagramsForModelConfig |
                        ActionFetchMetadataForModelConfig | ActionFetchMetadataNoioForModelConfig |
                        ActionFetchParametersForConfig | ActionFetchInputCompatibleForConfig | ActionFetchSampleVisForModelConfig |
                        ActionFetchOutputCompatibleForConfig | ActionFetchIOForConfig | ActionFetchIOAndVarsSNForConfig |
                        ActionFetchVarsSNAndUnitsForIO | ActionFetchConfigsForVar | ActionFetchConfigsForVarSN |
                        ActionFetchCalibrationsForVarSN | ActionFetchIOForVarSN | ActionFetchMetadataForVarSN |
                        ActionFetchProcessForCag | ActionFetchSearchModelByName | ActionFetchSearchModelByCategory |
                        ActionFetchSearchAny | ActionFetchSearchIO | ActionFetchSearchModel | ActionFetchSearchVar |
                        ActionFetchSearchModelByVarSN | ActionAddURLs;

type ApiThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

export const fetchModels: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    //apiFetch({type: MODELS}).then((fetched) => { dispatch({type: FETCH_MODELS, data: fetched}); });
    debug('Fetching all models');
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
            type: FETCH_MODELS,
            data: data
        });
    });
}

export const fetchVersionsAndConfigs: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: VERSIONS_AND_CONFIGS}).then((fetched) => {
        dispatch({type: FETCH_VERSIONS_AND_CONFIGS, data: fetched}); 
    });
}

export const fetchCategories: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: CATEGORIES}).then((fetched) => { dispatch({type: FETCH_CATEGORIES, data: fetched}); });
}

export const fetchConfigs: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: CONFIGS}).then((fetched) => { dispatch({type: FETCH_CONFIGS, data: fetched}); });
}

export const fetchConfigsAndIOs: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: CONFIGS_AND_IOS}).then((fetched) => { dispatch({type: FETCH_CONFIGS_AND_IOS, data: fetched}); });
}

export const fetchInputsAndVarsSN: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: INPUTS_AND_VARS_SN}).then((fetched) => { dispatch({type: FETCH_INPUTS_AND_VARS_SN, data: fetched}); });
}

export const fetchOutputsAndVarsSN: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: OUTPUTS_AND_VARS_SN}).then((fetched) => { dispatch({type: FETCH_OUTPUTS_AND_VARS_SN, data: fetched}); });
}

export const fetchVarsAndSN: ActionCreator<ApiThunkResult> = () => (dispatch) => {
    apiFetch({type: VARS_AND_SN}).then((fetched) => { dispatch({type: FETCH_VARS_AND_SN, data: fetched}); });
}

export const fetchMetadataForAny: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: METADATA_FOR_ANY, mv: uri}).then((fetched) => { dispatch({type: FETCH_METADATA_FOR_ANY, uri: uri, data: fetched}); });
}

export const fetchVersionsForModel: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: VERSIONS_FOR_MODEL, model: uri).then((fetched) => { dispatch({type: FETCH_VERSIONS_FOR_MODEL, data: fetched}); });
    debug('Fetching version for', uri);
    apiFetch({
        type: VERSIONS_FOR_MODEL,
        model: uri
    }).then(fetched => {
        let data = fetched.reduce((acc:any, obj:any) => {
            if (!acc[obj.version]) {
                acc[obj.version] = {uri: obj.version, label: obj.versionLabel, id: obj.versionId};
            } else if (!acc[obj.version].id && obj.versionId) {
                acc[obj.version].id = obj.versionId
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
            type: FETCH_VERSIONS_FOR_MODEL,
            uri: uri,
            data: Object.values(data)
        });
        
        dispatch({
            type: ADD_URLS,
            data: urls
        });
    })
}

export const fetchVarsForModel: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: VARS_FOR_MODEL, model: uri}).then((fetched) => { dispatch({type: FETCH_VARS_FOR_MODEL, uri: uri, data: fetched}); });
}

export const fetchAuthorsForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: AUTHORS_FOR_MODEL_CONFIG, v: uri}).then((fetched) => {
        dispatch({type: FETCH_AUTHORS_FOR_MODEL_CONFIG, uri: uri, data: fetched}); });
}

export const fetchGridForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: GRID_FOR_MODEL_CONFIG, v: uri}).then((fetched) => {
        dispatch({type: FETCH_GRID_FOR_MODEL_CONFIG, uri: uri, data: fetched}); });
}

export const fetchScreenshotsForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: SCREENSHOTS_FOR_MODEL_CONFIG, v: uri}).then((fetched) => {
        dispatch({type: FETCH_SCREENSHOTS_FOR_MODEL_CONFIG, uri:uri, data: fetched}); });
}

export const fetchDiagramsForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: DIAGRAMS_FOR_MODEL_CONFIG, v: uri).then((fetched) => { dispatch({type: FETCH_DIAGRAMS_FOR_MODEL_CONFIG, data: fetched}); });
    debug('Fetching exploration diagrams for', uri);
    apiFetch({
        type: DIAGRAMS_FOR_MODEL_CONFIG,
        v: uri,
        rules: {
            img: {newKey: 'uri'},
        }
    }).then(fetched => {
        dispatch({
            type: FETCH_DIAGRAMS_FOR_MODEL_CONFIG,
            uri: uri,
            data: fetched
        })
    })
}

export const fetchSampleVisForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    debug('Fetching sample visualizations for', uri);
    apiFetch({
        type: SAMPLE_VIS_FOR_MODEL_CONFIG,
        v: uri,
        rules: {
            description: {newKey: 'desc'},
        }
    }).then(fetched => {
        dispatch({
            type: FETCH_SAMPLE_VIS_FOR_MODEL_CONFIG,
            uri: uri,
            data: fetched
        })
    })
}

const parseUris = (v:string) => v.split(', ').map((l:string) => l.split('/').pop());

export const fetchMetadataForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({
        type: METADATA_FOR_MODEL_CONFIG,
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
            type: FETCH_METADATA_FOR_MODEL_CONFIG,
            uri: uri,
            data: fetched
        })
    })
}

export const fetchMetadataNoioForModelConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({
        type: METADATA_NOIO_FOR_MODEL_CONFIG,
        modelConfig: uri,
        rules: {
            cag: {newValue: (old) => old.split(', ')},
            calibrations: {newValue: (old) => old.split(', ')},
            adjustableVariables: {newValue: parseUris},
            targetVariables: {newValue: parseUris},
            keywords: {newValue: (old) => old.split(/ *; */)},
            processes: {newValue: (old) => old.split(', ')},
            gridType: {newValue: (old:any) => old.split('#').pop()}
        }
    }).then((fetched) => { dispatch({type: FETCH_METADATA_NOIO_FOR_MODEL_CONFIG, uri: uri, data: fetched}); });
}

export const fetchParametersForConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: PARAMETERS_FOR_CONFIG, config: uri).then((fetched) => { dispatch({type: FETCH_PARAMETERS_FOR_CONFIG, data: fetched}); });
    debug('Fetching parameters for', uri);
    apiFetch({
        type: PARAMETERS_FOR_CONFIG,
        config: uri,
        rules: {ptype: {newKey:'type', newValue: (old:any) => {
            let sp = old.split('#');
            return sp[sp.length-1];
        }}}
    }).then(fetched => {
        dispatch({
            type: FETCH_PARAMETERS_FOR_CONFIG,
            uri: uri,
            data: fetched
        })
    })
}

export const fetchCompatibleSoftwareForConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: INPUT_COMPATIBLE_FOR_CONFIG, config: uri).then((fetched) => { dispatch({type: FETCH_INPUT_COMPATIBLE_FOR_CONFIG, data: fetched}); });
    debug('Fetching compatible software for', uri);
    let compRule = {
        description: {newKey: 'desc'},
        comp_var: {newKey: 'vars', newValue: (old:any) => old.split(/ *, */) },
        comp_config: {newKey: 'uri'}
    }

    apiFetch({
        type: OUTPUT_COMPATIBLE_FOR_CONFIG,
        config: uri,
        rules: compRule
    }).then(fetched => {
        dispatch({
            type: FETCH_OUTPUT_COMPATIBLE_FOR_CONFIG,
            uri: uri,
            data: fetched
        })
    })

    apiFetch({
        type: INPUT_COMPATIBLE_FOR_CONFIG,
        config: uri,
        rules: compRule
    }).then(fetched => {
        dispatch({
            type: FETCH_INPUT_COMPATIBLE_FOR_CONFIG,
            uri: uri,
            data: fetched
        })
    })
}

export const fetchIOForConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: IO_FOR_CONFIG, config: uri}).then((fetched) => { dispatch({type: FETCH_IO_FOR_CONFIG, uri:uri, data: fetched}); });
}

export const fetchIOAndVarsSNForConfig: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: IO_AND_VARS_SN_FOR_CONFIG, config: uri).then((fetched) => { dispatch({type: FETCH_IO_AND_VARS_SN_FOR_CONFIG, data: fetched}); });
    debug('Fetching IO for', uri);
    apiFetch({
        type: IO_AND_VARS_SN_FOR_CONFIG,
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
            type: FETCH_IO_AND_VARS_SN_FOR_CONFIG,
            uri: uri,
            data: Object.values(data)
        })
    })
}

export const fetchVarsSNAndUnitsForIO: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    //apiFetch({type: VARS_SN_AND_UNITS_FOR_IO, io: uri).then((fetched) => { dispatch({type: FETCH_VARS_SN_AND_UNITS_FOR_IO, data: fetched}); });
    debug('Fetching variables and units for', uri);
    apiFetch({
        type: VARS_SN_AND_UNITS_FOR_IO,
        io: uri,
        rules: {
            vp: {newKey: 'uri'},
            description: {newKey: 'desc'}
        }
    }).then(fetched => {
        dispatch({
            type: FETCH_VARS_SN_AND_UNITS_FOR_IO,
            uri: uri,
            data: fetched
        })
    })
}

export const fetchConfigsForVar: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: CONFIGS_FOR_VAR, var: uri}).then((fetched) => { dispatch({type: FETCH_CONFIGS_FOR_VAR, uri:uri, data: fetched}); });
}

export const fetchConfigsForVarSN: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: CONFIGS_FOR_VAR_SN, std: uri}).then((fetched) => {
        dispatch({type: FETCH_CONFIGS_FOR_VAR_SN, uri:uri, data: fetched}); });
}

export const fetchCalibrationsForVarSN: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: CALIBRATIONS_FOR_VAR_SN, std: uri}).then((fetched) => {
        dispatch({type: FETCH_CALIBRATIONS_FOR_VAR_SN, uri: uri, data: fetched}); });
}

export const fetchIOForVarSN: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: IO_FOR_VAR_SN, std: uri}).then((fetched) => { dispatch({type: FETCH_IO_FOR_VAR_SN, uri:uri, data: fetched}); });
}

export const fetchMetadataForVarSN: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: METADATA_FOR_VAR_SN, std: uri}).then((fetched) => {
        dispatch({type: FETCH_METADATA_FOR_VAR_SN, uri: uri, data: fetched}); });
}

export const fetchProcessForCag: ActionCreator<ApiThunkResult> = (uri:string) => (dispatch) => {
    apiFetch({type: PROCESS_FOR_CAG, cag: uri}).then((fetched) => {
        dispatch({type: FETCH_PROCESS_FOR_CAG, uri:uri, data: fetched}); });
}

export const fetchSearchModelByName: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_MODEL_BY_NAME, label: uri}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_MODEL_BY_NAME, text:text, data: fetched}); });
}

export const fetchSearchModelByCategory: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_MODEL_BY_CATEGORY, cat: uri}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_MODEL_BY_CATEGORY, text:text, data: fetched}); });
}

export const fetchSearchAny: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_ANY, text: text}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_ANY, text:text, data: fetched}); });
}

export const fetchSearchIO: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_IO, text: text}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_IO, text:text, data: fetched}); });
}

export const fetchSearchModel: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_MODEL, text: text}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_MODEL, text:text, data: fetched}); });
}

export const fetchSearchVar: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    apiFetch({type: SEARCH_VAR, text: text}).then((fetched) => {
        dispatch({type: FETCH_SEARCH_VAR, text:text, data: fetched}); });
}

export const fetchSearchModelByVarSN: ActionCreator<ApiThunkResult> = (text:string) => (dispatch) => {
    //apiFetch({type: SEARCH_MODEL_BY_VAR_SN, text: text).then((fetched) => { dispatch({type: FETCH_SEARCH_MODEL_BY_VAR_SN, data: fetched}); });
    debug('Searching models by variable name:', text);
    apiFetch({
        type: SEARCH_MODEL_BY_VAR_SN,
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
            type: FETCH_SEARCH_MODEL_BY_VAR_SN,
            text: text,
            data: data
        })
    })
}
