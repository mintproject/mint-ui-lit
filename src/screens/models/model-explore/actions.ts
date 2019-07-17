import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { FetchedModel } from "./reducers";

export const EXPLORER_FETCH = 'EXPLORER_FETCH';

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: FetchedModel[] };

export type ExplorerAction = ExplorerActionFetch; // ModelsActionList | ModelsActionVariablesQuery |  ModelsActionDetail ;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";
const API_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries/" //getModels?

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerActionFetch>;

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    
    // FIXME: this is getting called a lot of times
    fetch(API_URI + "/getModels").then((response) => {
        response.json().then((obj) => {
            let bindings = obj["results"]["bindings"];
            let models= [] as FetchedModel[];

            bindings.map( (obj: Object) => {
                models.push({
                    model: obj['model']['value'],
                    label: obj['label']['value'],
                    desc: obj['desc']['value'],
                    //categories: [obj['categories']['value']],
                    //versions: [obj['versions']['value']],
                } as FetchedModel)
            })

            dispatch({
                type: EXPLORER_FETCH,
                models: models
            });

        })
    });
};
