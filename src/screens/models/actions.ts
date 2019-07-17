import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Model, ModelDetail } from "./reducers";
import { matchVariables } from "../../util/state_functions";
import { EXAMPLE_MODEL_QUERY } from "../../offline_data/sample_models";

export const MODELS_VARIABLES_QUERY = 'MODELS_VARIABLES_QUERY';
export const MODELS_LIST = 'MODELS_LIST';
export const MODELS_DETAIL = 'MODELS_DETAIL';

export interface ModelsActionList extends Action<'MODELS_LIST'> { models: Model[] };
export interface ModelsActionVariablesQuery extends Action<'MODELS_VARIABLES_QUERY'> { 
    variables: string[], 
    models: Model[] 
};
export interface ModelsActionDetail extends Action<'MODELS_DETAIL'> { model: ModelDetail };

export type ModelsAction = ModelsActionList | ModelsActionVariablesQuery |  ModelsActionDetail ;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";

// List all Model Configurations
type ListModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionList>;
export const listAllModels: ActionCreator<ListModelsThunkResult> = () => (dispatch) => {
    
    /*
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
    */

    // Offline mode example query
    dispatch({
        type: MODELS_LIST,
        models: EXAMPLE_MODEL_QUERY as Model[]
    });

};

// Query Model Catalog By Output? Variables
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionVariablesQuery>;
export const queryModelsByVariables: ActionCreator<QueryModelsThunkResult> = (response_variables: string[]) => (dispatch) => {
    let models = [] as Model[];

    /*
    fetch(MODEL_CATALOG_URI + "/getModelConfigurationsForVariable?std=" + response_variables).then((response) => {
        console.log(response.json);
    });
    */

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
        models: models
    });
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