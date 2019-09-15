import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../../app/store";
import { RESOURCE_PREFIX } from '../../../util/model-catalog-requests';
import { ComparisonEntry } from './ui-reducers'

export const EXPLORER_SELECT_MODEL = 'EXPLORER_SELECT_MODEL'
export const EXPLORER_SELECT_VERSION = 'EXPLORER_SELECT_VERSION'
export const EXPLORER_SELECT_CONFIG = 'EXPLORER_SELECT_CONFIG'
export const EXPLORER_SELECT_CALIBRATION = 'EXPLORER_SELECT_CALIBRATION'

export const EXPLORER_SET_MODE = 'EXPLORER_SET_MODE';

export const EXPLORER_SET_COMPARE_A = 'EXPLORER_SET_COMPARE_A';
export const EXPLORER_SET_COMPARE_B = 'EXPLORER_SET_COMPARE_B';
export const EXPLORER_COMPARE_MODEL = 'EXPLORER_COMPARE_MODEL';

interface ActionSelectUri<T> extends Action<T> { uri: string };

export interface ExplorerActionSelectModel extends ActionSelectUri<'EXPLORER_SELECT_MODEL'> {};
export interface ExplorerActionSelectVersion extends ActionSelectUri<'EXPLORER_SELECT_VERSION'> {};
export interface ExplorerActionSelectConfig extends ActionSelectUri<'EXPLORER_SELECT_CONFIG'> {};
export interface ExplorerActionSelectCalibration extends ActionSelectUri<'EXPLORER_SELECT_CALIBRATION'> {};

export interface ExplorerActionSetMode extends Action<'EXPLORER_SET_MODE'> {mode: string};

interface ActionCompare<T> extends Action<T> { compare: ComparisonEntry };

export interface ExplorerActionCompareA extends ActionCompare<'EXPLORER_SET_COMPARE_A'> {};
export interface ExplorerActionCompareB extends ActionCompare<'EXPLORER_SET_COMPARE_B'> {};
export interface ExplorerActionCompareModel extends ActionSelectUri<'EXPLORER_COMPARE_MODEL'> {};

export type ExplorerUIAction = ExplorerActionSelectModel | ExplorerActionSelectVersion | ExplorerActionSelectConfig | 
                               ExplorerActionSelectCalibration | ExplorerActionCompareA | ExplorerActionCompareB |
                               ExplorerActionCompareModel | ExplorerActionSetMode;

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

export const explorerSetMode: ActionCreator<ExplorerThunkResult> = (mode:string) => (dispatch) => {
    dispatch({ type: EXPLORER_SET_MODE, mode: mode})
};

export const explorerSetCompareA: ActionCreator<ExplorerThunkResult> = (comp:ComparisonEntry) => (dispatch) => {
    let comparison : ComparisonEntry = {model: '', version: '', config: '', calibration: ''};
    if (comp.model) comparison.model = comp.model;
    if (comp.version) comparison.version = comp.version;
    if (comp.config) comparison.config = comp.config;
    if (comp.calibration) comparison.calibration = comp.calibration;
    dispatch({ type: EXPLORER_SET_COMPARE_A, compare: comparison })
};

export const explorerSetCompareB: ActionCreator<ExplorerThunkResult> = (comp:ComparisonEntry) => (dispatch) => {
    let comparison : ComparisonEntry = {model: '', version: '', config: '', calibration: ''};
    if (comp.model) comparison.model = comp.model;
    if (comp.version) comparison.version = comp.version;
    if (comp.config) comparison.config = comp.config;
    if (comp.calibration) comparison.calibration = comp.calibration;
    dispatch({ type: EXPLORER_SET_COMPARE_B, compare: comp })
};

export const explorerCompareModel: ActionCreator<ExplorerThunkResult> = (modelUri:string) => (dispatch) => {
    dispatch({ type: EXPLORER_COMPARE_MODEL, uri: modelUri})
};
