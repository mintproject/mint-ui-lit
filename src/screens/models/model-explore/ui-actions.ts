import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { PREFIX_URI } from "config/default-graph";
import { ComparisonEntry } from "./ui-reducers";

export const EXPLORER_SELECT_MODEL = "EXPLORER_SELECT_MODEL";
export const EXPLORER_SELECT_VERSION = "EXPLORER_SELECT_VERSION";
export const EXPLORER_SELECT_CONFIG = "EXPLORER_SELECT_CONFIG";
export const EXPLORER_SELECT_CALIBRATION = "EXPLORER_SELECT_CALIBRATION";
export const REGISTER_SET_STEP = "REGISTER_SET_STEP";

export const EXPLORER_SET_MODE = "EXPLORER_SET_MODE";
export const ADD_MODELS_TO_COMPARE = "ADD_MODELS_TO_COMPARE";
export const CLEAR_COMPARE = "CLEAR_COMPARE";

interface ActionSelectUri<T> extends Action<T> {
  uri: string;
}

export interface ExplorerActionSelectModel
  extends ActionSelectUri<"EXPLORER_SELECT_MODEL"> {}
export interface ExplorerActionSelectVersion
  extends ActionSelectUri<"EXPLORER_SELECT_VERSION"> {}
export interface ExplorerActionSelectConfig
  extends ActionSelectUri<"EXPLORER_SELECT_CONFIG"> {}
export interface ExplorerActionSelectCalibration
  extends ActionSelectUri<"EXPLORER_SELECT_CALIBRATION"> {}

export interface ExplorerActionSetMode extends Action<"EXPLORER_SET_MODE"> {
  mode: string;
}
export interface ExplorerActionSetStep extends Action<"REGISTER_SET_STEP"> {
  step: number;
}

export interface CompareActionAdd extends Action<"ADD_MODELS_TO_COMPARE"> {
  comparisons: ComparisonEntry[];
}
export interface CompareActionClear extends Action<"CLEAR_COMPARE"> {}

export type ExplorerUIAction =
  | ExplorerActionSelectModel
  | ExplorerActionSelectVersion
  | ExplorerActionSelectConfig
  | ExplorerActionSelectCalibration
  | ExplorerActionSetMode
  | CompareActionAdd
  | CompareActionClear
  | ExplorerActionSetStep;

type ExplorerThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  ExplorerUIAction
>;

export const registerSetStep: ActionCreator<ExplorerThunkResult> =
  (step: number) => (dispatch) => {
    dispatch({ type: REGISTER_SET_STEP, step: step });
  };

export const explorerSetModel: ActionCreator<ExplorerThunkResult> =
  (id: string) => (dispatch) => {
    let uri: string = id ? PREFIX_URI + id : "";
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: uri });
  };

export const explorerClearModel: ActionCreator<ExplorerThunkResult> =
  () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: "" });
    dispatch({ type: REGISTER_SET_STEP, step: 0 });
  };

export const explorerSetVersion: ActionCreator<ExplorerThunkResult> =
  (id: string) => (dispatch) => {
    let uri: string = id ? PREFIX_URI + id : "";
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: uri });
  };

export const explorerClearVersion: ActionCreator<ExplorerThunkResult> =
  () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: "" });
  };

export const explorerSetConfig: ActionCreator<ExplorerThunkResult> =
  (id: string) => (dispatch) => {
    let uri: string = id ? PREFIX_URI + id : "";
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: uri });
  };

export const explorerClearConfig: ActionCreator<ExplorerThunkResult> =
  () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: "" });
  };

export const explorerSetCalibration: ActionCreator<ExplorerThunkResult> =
  (id: string) => (dispatch) => {
    let uri: string = id ? PREFIX_URI + id : "";
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: uri });
  };

export const explorerClearCalibration: ActionCreator<ExplorerThunkResult> =
  () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: "" });
  };

export const explorerSetMode: ActionCreator<ExplorerThunkResult> =
  (mode: string) => (dispatch) => {
    dispatch({ type: EXPLORER_SET_MODE, mode: mode });
  };

export const addModelToCompare: ActionCreator<ExplorerThunkResult> =
  (models: string) => (dispatch) => {
    //models is a string with the following format:
    // model=model_id&config=config_id&version=version_id&setup=setup_id

    let compare: ComparisonEntry[] = [];
    models.split("&").forEach((code: string) => {
      let [t, id] = code.split("=");
      let entry: ComparisonEntry = { type: "Model", uri: "" };
      if (t === "model") entry.type = "Model";
      else if (t === "version") entry.type = "SoftwareVersion";
      else if (t === "config") entry.type = "ModelConfiguration";
      else if (t === "setup") entry.type = "ModelConfigurationSetup";
      entry.uri = PREFIX_URI + id;
      if (id) compare.push(entry);
    });

    dispatch({
      type: ADD_MODELS_TO_COMPARE,
      comparisons: compare,
    });
  };

export const clearCompare: ActionCreator<ExplorerThunkResult> =
  () => (dispatch) => {
    dispatch({
      type: CLEAR_COMPARE,
    });
  };
