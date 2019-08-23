import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Model, ModelDetail, ModelIO, ModelParameter } from "./reducers";
import { matchVariables } from "../../util/state_functions";
import { EXAMPLE_MODEL_QUERY } from "../../offline_data/sample_models";
import { OFFLINE_DEMO_MODE } from "../../app/actions";

export const MODELS_VARIABLES_QUERY = 'MODELS_VARIABLES_QUERY';
export const MODELS_LIST = 'MODELS_LIST';
export const MODELS_DETAIL = 'MODELS_DETAIL';

import { apiFetch,  GET_CALIBRATIONS_FOR_VARIABLE, MODEL_METADATA_NOIO, GET_PARAMETERS, CONFIG_IO_VARS_STDNAMES, GET_CONFIGS_FOR_VARIABLE } from './model-explore/api-fetch';
import { Dataset } from "../datasets/reducers";

export interface ModelsActionList extends Action<'MODELS_LIST'> { models: Model[] };
export interface ModelsActionVariablesQuery extends Action<'MODELS_VARIABLES_QUERY'> { 
    variables: string[], 
    models: Model[] | null,
    loading: boolean
};
export interface ModelsActionDetail extends Action<'MODELS_DETAIL'> { model: ModelDetail };

export type ModelsAction = ModelsActionList | ModelsActionVariablesQuery |  ModelsActionDetail ;

const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries";

// List all Model Configurations
type ListModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionList>;
export const listAllModels: ActionCreator<ListModelsThunkResult> = () => (dispatch) => {
    
    // Offline mode example query
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: MODELS_LIST,
            models: EXAMPLE_MODEL_QUERY as Model[]
        });
        return;
    }

    fetch(MODEL_CATALOG_URI + "/getModelConfigurations").then((response) => {
        response.json().then((obj) => {
            let models = [] as Model[];
            let bindings = obj["results"]["bindings"];
            bindings.map((binding: Object) => {
                models.push({
                    name: binding["label"]["value"],
                    description: binding["desc"]["value"],
                    original_model: binding["model"]["value"]
                } as Model);
            });
            dispatch({
                type: MODELS_LIST,
                models
            });            
        })
    });

};

// Query Model Catalog By Output? Variables
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionVariablesQuery>;
export const queryModelsByVariables: ActionCreator<QueryModelsThunkResult> = (response_variables: string[]) => (dispatch) => {
    let models = [] as Model[];

    if(OFFLINE_DEMO_MODE) {
        // Offline mode example query
        EXAMPLE_MODEL_QUERY.map((model) => {
            let i=0;
            for(;i<model.output_files.length; i++) {
                let output = model.output_files[i];
                if(matchVariables(output.variables, response_variables, true)) // Do a full match
                    models.push(model as Model);
            }
        });
        dispatch({
            type: MODELS_VARIABLES_QUERY,
            variables: response_variables,
            models: models,
            loading: false
        });
        return;
    }

    dispatch({
        type: MODELS_VARIABLES_QUERY,
        variables: response_variables,
        models: null,
        loading: true
    });

    let variables = response_variables[0].split(/\s*,\s/);
    Promise.all(
        variables.map((variable) => {
            return apiFetch({
                type: GET_CALIBRATIONS_FOR_VARIABLE,
                std: variable,
                rules: {
                    'model': { 
                        newKey: 'modelName',
                        newValue: (value: string) => value.substr(value.lastIndexOf('/')+1) 
                    },
                    'version': { 
                        newKey: 'versionName',
                        newValue: (value: string) => value.substr(value.lastIndexOf('/')+1) 
                    },
                    'configuration': { 
                        newKey: 'configurationName',
                        newValue: (value: string) => value.substr(value.lastIndexOf('/')+1) 
                    }
                }
            });
        })
    ).then((callist: Array<Array<Object>>) => {
        let modelrows: Array<Object> = [];
        callist.map((cal) => {
            modelrows = modelrows.concat(cal);
        });
        //console.log(modelrows);
        let calibrationPromises = 
            modelrows.map((row: Object) => {
                let modelid = row['calibration'] || row['configuration'];
                //console.log(modelid);
                return Promise.all([
                    apiFetch({
                        type: MODEL_METADATA_NOIO,
                        modelConfig: modelid,
                        rules: {
                            'targetVariables': {
                                newValue: (value: string) => value.split(/\s*,\s*/).map((val) => {
                                    return val.substr(val.lastIndexOf("/") + 1)
                                })
                            }
                        }
                    }),
                    apiFetch({
                        type: CONFIG_IO_VARS_STDNAMES,
                        config: modelid
                    }),
                    apiFetch({
                        type: GET_PARAMETERS,
                        config: modelid
                    }),
                ]).then((values) => {
                    // Get model config metadata
                    let meta:Object = values[0][0];

                    // Get model config input and output files
                    let fileio: any = {};
                    let inputs:ModelIO[] = [];
                    let outputs:ModelIO[] = [];
                    values[1].map((value: any) => {
                        let io: ModelIO = fileio[value.io];
                        if(!io) {
                            io = {
                                id: value.io,
                                name: value.iolabel,
                                type: value.type,
                                variables: []
                            };
                            // FIXME: Hack until we remove cycles_weather fixed value
                            if(value.fixedValueURL && value.iolabel != "cycles_weather") {
                                io.value = {
                                    id: value.fixedValueDCId,
                                    resources: [{
                                        url: value.fixedValueURL
                                    }]
                                } as Dataset;
                            }
                            fileio[value.io] = io;
                            if(value.prop.match(/#hasInput$/)) {
                                inputs.push(io);
                            } else {
                                outputs.push(io);
                            }
                        }
                        if(value.st)
                            io.variables.push(value.st);
                    });
                    
                    // Get model config input/output parameters
                    let params: any = {};
                    let parameters:ModelParameter[] = [];
                    values[2].map((value: any) => {
                        let param: ModelParameter =  {
                            id: value.p,
                            name: value.paramlabel,
                            type: value.pdatatype,
                            min: value.minVal || "",
                            max: value.maxVal || "",
                            default: value.defaultvalue || "",
                            description: value.description || ""
                        };
                        if(value.fixedValue)
                            param.value = value.fixedValue;
                        params[value.p] = param;
                        parameters.push(param);
                    });

                    let model: Model = {
                        id: modelid,
                        localname: modelid.substr(modelid.lastIndexOf("/") + 1),
                        name: meta['label'],
                        calibrated_region: meta["regionName"] || "",
                        description: row["desc"] || "",
                        category: row["category"] || "",
                        wcm_uri: row["compLoc"] || "",
                        input_files: inputs,
                        input_parameters: parameters,
                        output_files: outputs,
                        original_model: row["modelName"] || "",
                        model_version: row["versionName"] || "",
                        model_configuration: row["configurationName"] || "",
                        model_type: "",
                        parameter_assignment: meta["paramAssignMethod"] || "",
                        parameter_assignment_details: "",
                        target_variable_for_parameter_assignment: (meta["targetVariables"] || []).join(", "),
                        modeled_processes: meta["processes"] || "",
                        dimensionality: meta['gridDim'] || "",
                        spatial_grid_type: (meta['gridType'] || "").replace(/.*#/, ''),
                        spatial_grid_resolution: meta['gridSpatial'] || "",
                        minimum_output_time_interval: ""
                    };
                    console.log(model);
                    return model;
                });
            });
        Promise.all(calibrationPromises).then(function(models) {
            console.log(models)
            dispatch({
                type: MODELS_VARIABLES_QUERY,
                variables: response_variables,
                models: models,
                loading: false
            });            
        })
    });

    /*
    fetch(MODEL_CATALOG_URI + "/getCalibratedModelConfigurationsForVariable?std=" + response_variables).then((response) => {
        response.json().then((json) => {
            json.results.bindings.map((binding: Object) => {
                let model = {} as Model;
                model.id = binding["calibration"]["value"];
                model.description = binding["desc"]["value"];
                model.original_model = binding["model"]["value"];
                fetch(MODEL_CATALOG_URI + "/getModelConfigurationMetadata?modelConfig=" + model.id).then((mresponse) => {
                    mresponse.json().then((mjson) => {
                        console.log(mjson);
                    });
                });
            })
        });
    });
    */
};

// Query Model Details
type QueryModelDetailThunkResult = ThunkAction<void, RootState, undefined, ModelsActionDetail>;
export const queryModelDetail: ActionCreator<QueryModelDetailThunkResult> = (modelid: string) => (dispatch) => {
    if(modelid) {
        let model = {
            id: modelid,
            name: modelid
        } as ModelDetail;
        dispatch({
            type: MODELS_DETAIL,
            model: model
        });        
    }
};
