import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { RESOURCE_PREFIX } from './api-fetch';

export const EXPLORER_SELECT_MODEL = 'EXPLORER_SELECT_MODEL'
export const EXPLORER_SELECT_VERSION = 'EXPLORER_SELECT_VERSION'
export const EXPLORER_SELECT_CONFIG = 'EXPLORER_SELECT_CONFIG'
export const EXPLORER_SELECT_CALIBRATION = 'EXPLORER_SELECT_CALIBRATION'

interface ActionSelectUri<T> extends Action<T> { uri: string };

export interface ExplorerActionSelectModel extends ActionSelectUri<'EXPLORER_SELECT_MODEL'> {};
export interface ExplorerActionSelectVersion extends ActionSelectUri<'EXPLORER_SELECT_VERSION'> {};
export interface ExplorerActionSelectConfig extends ActionSelectUri<'EXPLORER_SELECT_CONFIG'> {};
export interface ExplorerActionSelectCalibration extends ActionSelectUri<'EXPLORER_SELECT_CALIBRATION'> {};

export type ExplorerUIAction = ExplorerActionSelectModel | ExplorerActionSelectVersion | 
                               ExplorerActionSelectConfig | ExplorerActionSelectCalibration;

type ExplorerThunkResult = ThunkAction<void, RootState, undefined, ExplorerUIAction>;

export const explorerSetModel: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    let uri : string = id ? RESOURCE_PREFIX + id : '';
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: uri })
};

export const explorerClearModel: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_MODEL, uri: '' })
};

export const explorerSetVersion: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    let uri : string = id ? RESOURCE_PREFIX + id : '';
    console.log('Version uri:', uri)
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: uri})
};

export const explorerClearVersion: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_VERSION, uri: '' })
};

export const explorerSetConfig: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    let uri : string = id ? RESOURCE_PREFIX + id : '';
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: uri})
};

export const explorerClearConfig: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CONFIG, uri: '' })
};

export const explorerSetCalibration: ActionCreator<ExplorerThunkResult> = (id:string) => (dispatch) => {
    let uri : string = id ? RESOURCE_PREFIX + id : '';
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: uri})
};

export const explorerClearCalibration: ActionCreator<ExplorerThunkResult> = () => (dispatch) => {
    dispatch({ type: EXPLORER_SELECT_CALIBRATION, uri: '' })
};
