import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import { GraphQL } from "config/graphql";

import listVariablesGQL from '../../queries/variable/list.graphql';

import { VariableMap } from "@apollo/client/core/LocalState";
import { variableFromGQL } from "util/graphql_adapter";
import { KeycloakAdapter } from "util/keycloak-adapter";

export const VARIABLES_LIST = 'VARIABLES_LIST';

export interface VariablesActionList extends Action<'VARIABLES_LIST'> { 
    list: VariableMap
};

export type VariablesAction =  VariablesActionList;

// List Variables Categories
type ListVariablesThunkResult = ThunkAction<void, RootState, undefined, VariablesActionList>;
export const listVariables: ActionCreator<ListVariablesThunkResult> = () => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
        query: listVariablesGQL
    }).then(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let variables = {} as VariableMap;
            result.data.variable.forEach((varobj:any) => {
                variables[varobj.id] = variableFromGQL(varobj);
            })
            dispatch({
                type: VARIABLES_LIST,
                list: variables
            });
        }
    });
};