import { IdMap, IdNameObject } from "../../app/reducers";
import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { VARIABLES_LIST } from "./actions";

export type VariableMap = IdMap<Variable>;

export interface Variable extends IdNameObject {
    description: string,
    is_adjustment_variable: boolean,
    is_indicator: boolean,
    categories: string[],
    intervention: Intervention
}

export interface Intervention extends IdNameObject {
    description: string
}

export interface VariablesState {
    variables?: VariableMap
}

const INITIAL_STATE: VariablesState = {};

const variables: Reducer<VariablesState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case VARIABLES_LIST:
            state.variables = {
                ...action.list
            }
            return {
                ...state
            }
    }
    return state;
}

export default variables;
