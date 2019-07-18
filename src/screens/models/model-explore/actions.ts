import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { UriModels, FetchedModel } from "./reducers";

export const EXPLORER_FETCH = 'EXPLORER_FETCH';
export const EXPLORER_SELECT = 'EXPLORER_SELECT'
export const EXPLORER_DETAILS = 'EXPLORER_DETAILS'

export interface ExplorerActionFetch extends Action<'EXPLORER_FETCH'> { models: UriModels };
export interface ExplorerActionSelect extends Action<'EXPLORER_SELECT'> { key: string };
export interface ExplorerActionDetails extends Action<'EXPLORER_DETAILS'> { uri: string, details: Array<any> };

export type ExplorerAction = ExplorerActionFetch | ExplorerActionSelect | ExplorerActionDetails;

//const MODEL_CATALOG_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries";
//const API_URI = "https://query.mint.isi.edu/api/mintproject/MINT-ModelCatalogQueries/"
const API_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries/"
//const URI_PREFIX = "https://w3id.org/mint/instance/"
const URI_PREFIX = "https://w3id.org/okn/i/mint/"

// List all Model Configurations
type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerAction>;

export const explorerFetch: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    fetch(API_URI + "/getModels").then((response) => {
        response.json().then((obj) => {
            let bindings = obj["results"]["bindings"];
            let models = {} as UriModels;

            let uniq = {}

            //TODO: This should be in the reducer maybe
            bindings.map( (obj: Object) => {
                let curModel : FetchedModel = {
                    uri: obj['model']['value'],
                    label: obj['label']['value'],
                } as FetchedModel;

                if (obj['doc']) { curModel.doc = obj['doc']['value']; }
                if (obj['desc']) { curModel.desc = obj['desc']['value']; }
                if (obj['keywords']) { curModel.keywords = obj['keywords']['value']; }
                if (obj['assumptions']) { curModel.assumptions = obj['assumptions']['value']; }
                if (obj['versions']) { 
                    curModel.versions = obj['versions']['value'].split(', ');
                }
                if (obj['categories']) { 
                    curModel.categories = obj['categories']['value'].split(', ');
                }
                if (obj['screenshots']) { 
                    curModel.screenshots = obj['screenshots']['value'].split(', ');
                }

                models[obj['model']['value']] = curModel;

                Object.keys(obj).forEach( (key:string) => {
                    if (!uniq[key]) uniq[key] = [];
                    uniq[key].push( obj[key] )
                })
            })
            console.log(uniq)

            dispatch({
                type: EXPLORER_FETCH,
                models: models
            });

        })
    });
};

export const explorerFetchDetails: ActionCreator<ExplorerThunkResult> = (uri:string) => (dispatch) => {
    console.log('Fetching details of', uri);

    let url = new URL(API_URI + "getConfigI_OVariablesAndStandardNames")
    url.searchParams.append('config', uri.toLowerCase())

    fetch(String(url)).then((response) => {
        response.json().then((obj) => {
            let bindings = obj["results"]["bindings"];
            console.log(bindings)

            /*bindings.map( (obj: Object) => {
                let curModel : FetchedModel = {
                    uri: obj['model']['value'],
                    label: obj['label']['value'],
                    desc: obj['desc']['value'], //OPT
                    categories: [obj['categories']['value']], //OPT
                    versions: [obj['versions']['value']], //OPT
                } as FetchedModel;
                if (obj['doc']) {
                    curModel.doc = obj['doc']['value'];
                }
                models[obj['model']['value']] = curModel;
            })*/

            dispatch({
                type: EXPLORER_DETAILS,
                uri: uri,
                details: bindings
            });

        })
    });
}

export const explorerSetSelected: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: URI_PREFIX + id
    })
};

export const explorerClearSelected: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({
        type: EXPLORER_SELECT,
        key: ''
    })
};
