import { Reducer } from "redux"
import { RootAction } from "app/store"
import { DEXPLORER_SELECT_DATASET } from "./ui-actions"

export interface DExplorerUIState {
    selected_datasetid: string
}

const INITIAL_STATE: DExplorerUIState = { } as DExplorerUIState;

const dataExplorerUI: Reducer<DExplorerUIState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case DEXPLORER_SELECT_DATASET:
            return {
                ...state,
                selected_datasetid: action.id
            };
        default:
            return state;
    }
}

export default dataExplorerUI;