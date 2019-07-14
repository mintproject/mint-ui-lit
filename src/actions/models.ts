import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../store";
import { Model, ModelDetail } from "../reducers/models";
import { matchVariables } from "../util/state_functions";
import { EXAMPLE_MODEL_QUERY } from "../offline_data/sample_models";

export const MODELS_QUERY = 'MODELS_QUERY';
export const MODELS_DETAIL = 'MODELS_DETAIL';

export interface ModelsActionQuery extends Action<'MODELS_QUERY'> { variables: string[], models: Model[] };
export interface ModelsActionDetail extends Action<'MODELS_DETAIL'> { model: ModelDetail };

export type ModelsAction = ModelsActionQuery |  ModelsActionDetail ;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";

// Query Model Catalog
type QueryModelsThunkResult = ThunkAction<void, RootState, undefined, ModelsActionQuery>;
export const queryModels: ActionCreator<QueryModelsThunkResult> = (response_variables: string[]) => (dispatch) => {
    let models = [] as Model[];
    //console.log(driving_variables);
    /*
    fetch(MODEL_CATALOG_URI + "/getModelConfigurationsForVariable?std=" + response_variable).then((response) => {
        console.log(response.json);
    });
    */
    EXAMPLE_MODEL_QUERY.map((model) => {
        let i=0;
        for(;i<model.output_files.length; i++) {
            let output = model.output_files[i];
            if(matchVariables(output.variables, response_variables, true)) // Do a full match
                models.push(model as Model);
        }
    });
    dispatch({
        type: MODELS_QUERY,
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