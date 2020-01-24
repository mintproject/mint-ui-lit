import { IdNameObject } from "../../app/reducers";
import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { MODELS_DETAIL, MODELS_VARIABLES_QUERY, MODELS_LIST } from "./actions";
import { Dataset } from "../datasets/reducers";


export interface Model extends IdNameObject {
    localname?: string,
    calibrated_region: string,
    description?: string,
    category: string,
    input_files: ModelIO[],
    input_parameters: ModelParameter[],
    output_files: ModelIO[],
    wcm_uri?: string,
    model_type?: string,
    original_model?: string,
    model_version?: string,
    model_configuration?:string,
    parameter_assignment?: string,
    parameter_assignment_details?: string,
    target_variable_for_parameter_assignment?: string,
    modeled_processes?: string[],
    dimensionality?: number,
    spatial_grid_type?: string,
    spatial_grid_resolution?: string,
    minimum_output_time_interval?: string,
    usage_notes?: string
};

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
    //let scenario:ScenarioDetails = { ...state.scenario } as ScenarioDetails;
    //let scenarios:ScenarioList = { ...state.scenarios } as ScenarioList;

    switch (action.type) {
        case MODELS_VARIABLES_QUERY:
            // Return models list
            state.models = { ...state.models };
            state.models[action.variables.join(",")] = action.models;
            state.loading = action.loading;
            return {
                ...state
            };
        case MODELS_LIST:
            // Return models list
            state.models = { ...state.models };
            state.models["*"] = action.models;
            return {
                ...state
            };
        case MODELS_DETAIL:
            // Return model details
            return {
                ...state,
                model: action.model
            };
        default:
            return state;
    }
};

export default models;
