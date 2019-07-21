import { Action } from "redux";

export const ANALYSIS_LIST = 'ANALYSIS_LIST';

export interface AnalysisActionList extends Action<'ANALYSIS_LIST'> { };

export type AnalysisAction =  AnalysisActionList;
