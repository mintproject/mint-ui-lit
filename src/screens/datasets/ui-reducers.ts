import { Reducer } from "redux";
import { RootAction } from "app/store";
import {
  DEXPLORER_SELECT_DATASET,
  DEXPLORER_SELECT_DATASET_REGION,
} from "./ui-actions";

export interface DExplorerUIState {
  selected_datasetid: string;
  selected_regionid: string;
}

const INITIAL_STATE: DExplorerUIState = {} as DExplorerUIState;

const dataExplorerUI: Reducer<DExplorerUIState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case DEXPLORER_SELECT_DATASET:
      return {
        ...state,
        selected_datasetid: action.id,
        selected_regionid: null,
      };
    case DEXPLORER_SELECT_DATASET_REGION:
      return {
        ...state,
        selected_datasetid: action.id,
        selected_regionid: action.regionid,
      };
    default:
      return state;
  }
};

export default dataExplorerUI;
