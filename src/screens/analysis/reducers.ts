import { RootAction } from "../../app/store";
import { Reducer } from "redux";

export interface AnalysisState {

}

const INITIAL_STATE: AnalysisState = {};
const analysis: Reducer<AnalysisState, RootAction> = (state = INITIAL_STATE, action) => {
    switch(action.type) {
        
    }
    return state;
}

export default analysis;