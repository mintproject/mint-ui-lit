import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "app/store";
import { BoundingBox } from "screens/regions/reducers";

export const DEXPLORER_SELECT_DATASET = 'DEXPLORER_SELECT_DATASET'
export const DEXPLORER_SELECT_DATASET_REGION = 'DEXPLORER_SELECT_DATASET_REGION'
export const DEXPLORER_SEARCH_DATASETS = 'DEXPLORER_SEARCH_DATASETS'

export interface DExplorerActionSelectDataset extends Action<'DEXPLORER_SELECT_DATASET'> { id: string };
export interface DExplorerActionSelectDatasetRegion extends Action<'DEXPLORER_SELECT_DATASET_REGION'> { 
    id: string 
    regionid: string
};

export type DExplorerUIAction = DExplorerActionSelectDataset | DExplorerActionSelectDatasetRegion;

export const dexplorerSelectDataset: ActionCreator<DExplorerActionSelectDataset> = (id:string) => {
    return({ 
        type: DEXPLORER_SELECT_DATASET, 
        id: id 
    });
};

export const dexplorerSelectDatasetArea: ActionCreator<DExplorerActionSelectDatasetRegion> = (id:string, regionid: string) => {
    if(regionid) {
        return({ 
            type: DEXPLORER_SELECT_DATASET_REGION,
            id: id,
            regionid: regionid
        });
    }
};