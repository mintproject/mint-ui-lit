import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { SCENARIOS_LIST, SCENARIO_DETAILS, SCENARIO_SUBSCRIPTION } from "./actions";
import { Model } from "../models/reducers";
import { Dataset } from "../datasets/reducers";
import { IdMap, IdNameObject } from "../../app/reducers";
import { REGIONS_LIST } from "../regions/actions";

export interface ModelingState {
    scenarios?: ScenarioList
    scenario?: ScenarioDetails
}

export interface ScenarioList {
    scenarioids: string[]
    scenarios: IdMap<Scenario>
}

export interface Scenario extends IdNameObject {
    regionid: string
    dates: DateRange
    last_update?: string
}

export interface DateRange {
    start_date: string
    end_date: string
}

export interface ScenarioDetails extends Scenario {
    goals: IdMap<Goal>
    subgoals: IdMap<SubGoal>
    pathways: IdMap<Pathway>
    unsubscribe?: Function    
}

export interface Pathway {
    id?: string
    driving_variables: string[]
    response_variables: string[]
    models?: ModelMap
    datasets?: DatasetMap
    model_ensembles?: ModelEnsembleMap
    executable_ensembles?: ExecutableEnsemble[]
    notes?: Notes
    last_update?: PathwayUpdateInformation
}

export interface Notes {
    variables: string,
    models: string,
    datasets: string,
    parameters: string,
    results: string
}

export interface PathwayUpdateInformation {
    variables: StepUpdateInformation
    models: StepUpdateInformation
    datasets: StepUpdateInformation
    parameters: StepUpdateInformation
    results: StepUpdateInformation
}

export interface StepUpdateInformation {
    time: number
    user: string
}

export interface ComparisonFeature {
    name: string,
    fn: Function
}

export type ModelMap = IdMap<Model>

export type DatasetMap = IdMap<Dataset>

export interface Goal extends IdNameObject {
    subgoalids?: string[]
}

export interface SubGoal extends IdNameObject {
    dates?: DateRange,
    pathwayids?: string[]
}

// Mapping of model id to data ensembles
export interface ModelEnsembleMap {
    [modelid: string]: DataEnsembleMap
}

// Mapping of model input to list of values (data ids or parameter values)
export interface DataEnsembleMap {
    [inputid: string]: string[]
}

export interface ExecutableEnsemble {
    modelid: string
    bindings: InputBindings
    runid?: string
    status: "FAILED" | "SUCCESSFUL" | "ONGOING",
    run_progress?: number // 0 to 100 (percentage done)
    results: string[] // Chosen results after completed run
    selected: boolean
}

export interface InputBindings {
    [input: string]: string
}

const INITIAL_STATE: ModelingState = {};

const modeling: Reducer<ModelingState, RootAction> = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case REGIONS_LIST:
            return {
                ...state,
                regions: action.list
            }        
        case SCENARIOS_LIST:
            return {
                ...state,
                scenarios: action.list
            }
        case SCENARIO_SUBSCRIPTION: 
            let scenario_sub = {
                ...state.scenario,
                unsubscribe: action.unsubscribe
            } as ScenarioDetails
            return {
                ...state,
                scenario: scenario_sub
            }
        case SCENARIO_DETAILS:
            let scenario = {
                ...action.details,
                unsubscribe: state.scenario!.unsubscribe
            } as ScenarioDetails            
            return {
                ...state,
                scenario: scenario
            }
        default:
            return state;
    }
};

export default modeling;

