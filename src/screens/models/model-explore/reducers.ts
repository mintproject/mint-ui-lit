import { Reducer } from "redux";
import { RootAction } from "../../../app/store";
import { EXPLORER_FETCH } from './actions'

export interface FetchedModel {
    model: string,
    label: string,
    desc: string,
    categories: string[],
    versions: string[],
    doc?: string,
    assumptions?: string
}

export interface ExplorerState {
    models: Array<FetchedModel>,
    selected: FetchedModel | null
}

const INITIAL_STATE: ExplorerState = { 
    models: [],
    selected: null
};

const explorer: Reducer<ExplorerState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXPLORER_FETCH:
          state.models = action.models;
          break;
    }
    return {
      ...state
    }
};

export default explorer;
