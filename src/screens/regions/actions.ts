import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import { EXAMPLE_REGION_DATA } from "../../offline_data/sample_scenarios";
import { db } from "../../config/firebase";
import { RegionList, Region } from "./reducers";
import { OFFLINE_DEMO_MODE } from "../../app/actions";

export const REGIONS_LIST = 'REGIONS_LIST';

export interface RegionsActionList extends Action<'REGIONS_LIST'> { list: RegionList };

export type RegionsAction =  RegionsActionList;

// List Regions
type ListRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionList>;
export const listRegions: ActionCreator<ListRegionsThunkResult> = () => (dispatch) => {
    // Here you would normally get the data from the server. We're simulating
    // that by dispatching an async action (that you would dispatch when you
    // succesfully got the data back)
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: REGIONS_LIST,
            list: EXAMPLE_REGION_DATA
        });
        return;
    }

    db.collection("regions").get().then((querySnapshot) => {
        let regions:RegionList = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
        });
        dispatch({
            type: REGIONS_LIST,
            list: regions
        });
    });
};