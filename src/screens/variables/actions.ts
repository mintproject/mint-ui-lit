import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { ActionCreator, Action } from "redux";
import { VariableMap } from "./reducers";
import { ModelCatalogApi } from "../../model-catalog-api/model-catalog-api";
import { StandardVariable } from "@mintproject/modelcatalog_client";

export const VARIABLES_LIST = "VARIABLES_LIST";

export interface VariablesActionList extends Action<"VARIABLES_LIST"> {
  list: VariableMap;
}

export type VariablesAction = VariablesActionList;

// List Variables Categories
type ListVariablesThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  VariablesActionList
>;
export const listVariables: ActionCreator<ListVariablesThunkResult> =
  () => (dispatch) => {
    dispatch(ModelCatalogApi.myCatalog.standardVariable.getAll()).then((result: any) => {
      let variables = {} as VariableMap;
      Object.values(result).forEach((varobj: StandardVariable) => {
        variables[varobj.id] = {
          id: varobj.id,
          name: varobj.label?.[0] || "",
          description: varobj.description?.[0] || "",
          is_adjustment_variable: false,
          is_indicator: false,
          categories: [],
          intervention: {
            id: "",
            name: "",
            description: ""
          }
        };
      });
      dispatch({
        type: VARIABLES_LIST,
        list: variables,
      });
    });
  };
