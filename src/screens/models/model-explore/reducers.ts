import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH, EXPLORER_SELECT } from './actions'

export interface FetchedModel {
    label: string,
    desc: string,
    categories: string[],
    versions: string[],
    doc?: string,
    assumptions?: string
}

export type UriModels = Map<String, FetchedModel>;

export interface ExplorerState {
    models: UriModels,
    selected: String
}

const INITIAL_STATE: ExplorerState = { 
    models: {} as UriModels,
    selected: ''
};

const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_FETCH:
            state.models = action.models;
            break;
        case EXPLORER_SELECT:
            //FIXME: this dont work if EXPLORER_FETCH wasnt called before
            /*let filtered = state.models.filter( (m : FetchedModel) => {
                let sp = m.model.split('/')
                return (sp[sp.length-1] == action.key)
            })
            if (filtered.length == 1) {
                state.selected = filtered[0]
            }*/
            state.selected = action.key
            break;
    }
    return {
      ...state
    }
};

export default explorer;
