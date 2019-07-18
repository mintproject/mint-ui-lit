import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { UriModels, FetchedModel } from "./reducers";

export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_SELECT = 'EXPLORER_SELECT'

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionSelect extends Action<'EXPLORER_SELECT'> { key: String };

export type ExplorerAction = ExplorerActionFetch | ExplorerActionSelect; // ModelsActionList | ModelsActionVariablesQuery |  ModelsActionDetail ;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";
const API_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries/" //getModels?

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    // FIXME: this is getting called a lot of times
    fetch(API_URI + "/getModels").then((response) => {
        response.json().then((obj) => {
            let bindings = obj["results"]["bindings"];
            let models = {} as UriModels;

            bindings.map( (obj: Object) => {
                let curModel : FetchedModel = {
                    //model: obj['model']['value'],
                    label: obj['label']['value'],
                    desc: obj['desc']['value'],
                    categories: [obj['categories']['value']],
                    versions: [obj['versions']['value']],
                } as FetchedModel;
                models[obj['model']['value']] = curModel;
            })

            dispatch({
                type: EXPLORER_FETCH,
                models: models
            });

        })
    });
};

export const explorerSetSelected: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: id
    })
};

export const explorerClearSelected: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: ''
    })
};
