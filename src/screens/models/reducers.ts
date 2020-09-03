import { IdNameObject } from "../../app/reducers";
import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { MODELS_VARIABLES_QUERY } from "./actions";
import { Dataset } from "../datasets/reducers";


export interface Model extends IdNameObject {
    localname?: string,
    region_name: string,
    description?: string,
    category: string,
    input_files: ModelIO[],
    input_parameters: ModelParameter[],
    output_files: ModelIO[],
    code_url?: string,
    model_type?: string,
    model_name?: string,
    model_version?: string,
    model_configuration?:string,
    parameter_assignment?: string,
    parameter_assignment_details?: string,
    software_image?: string,
    calibration_target_variable?: string,
    modeled_processes?: string[],
    dimensionality?: number|string,
    spatial_grid_type?: string,
    spatial_grid_resolution?: string,
    minimum_output_time_interval?: string,
    usage_notes?: string,
    hasRegion?: any
};

const getLastPart = (s:string) => {
    let sp = s.split('/');
    if (sp && sp.length > 0) return sp.pop();
    return '';
}

export const getPathFromModel = (m:Model) => {
    let path = "";
    let model = getLastPart(m.model_name);
    if (model) {
        path += "/" + model;
        let version = getLastPart(m.model_version);
        if (version) {
            path += "/" + version;
            let cfg = getLastPart(m.model_configuration)
            if (cfg) {
                path += "/" + cfg;
                if (m.localname) path += "/" + m.localname;
            }
        }
    }
    return path;
}

export interface ModelIO extends IdNameObject {
    type?: string,
    variables: string[],
    value?: Dataset,
    position?: number
}

export interface ModelParameter extends IdNameObject {
    type: string,
    description?: string,
    min?: string,
    max?: string,
    unit?: string,
    default?: string,
    value?: string,
    adjustment_variable?: string,
    accepted_values?: string[],
    position?: number
}

export interface ModelDetail extends Model {
    documentation: string,
    lookupTable: string,
    image: string
}

export interface ModelsState {
    models: VariableModels,
    model: ModelDetail | null,
    loading: boolean
}

export type VariableModels = Map<string, Model[]> // Map of response variable to models

const INITIAL_STATE: ModelsState = { 
    models: {} as VariableModels, 
    loading: false,
    model: null
};

const models: Reducer<ModelsState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case MODELS_VARIABLES_QUERY:
            // Return models list
            state.models = { ...state.models };
            state.models[action.variables.join(",")] = action.models;
            state.loading = action.loading;
            return {
                ...state
            };
        default:
            return state;
    }
};

export default models;
