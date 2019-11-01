import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "app/store";

export const DEXPLORER_SELECT_DATASET = 'DEXPLORER_SELECT_DATASET'
export const DEXPLORER_SEARCH_DATASETS = 'DEXPLORER_SEARCH_DATASETS'

export interface DExplorerActionSelectDataset extends Action<'DEXPLORER_SELECT_DATASET'> { id: string };

export type DExplorerUIAction = DExplorerActionSelectDataset;

export const dexplorerSelectDataset: ActionCreator<DExplorerActionSelectDataset> = (id:string) => {
    return({ 
        type: DEXPLORER_SELECT_DATASET, 
        id: id 
    });
};