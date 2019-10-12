import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import { SCENARIOS_LIST, SCENARIO_DETAILS, SCENARIO_SUBSCRIPTION, PATHWAY_SUBSCRIPTION, PATHWAY_DETAILS, PATHWAY_ENSEMBLES_LIST } from "./actions";
import { Model } from "../models/reducers";
import { Dataset, DataResource } from "../datasets/reducers";
import { IdMap, IdNameObject } from "../../app/reducers";
import { REGIONS_LIST } from "../regions/actions";

export interface ModelingState {
    scenarios?: ScenarioList
    scenario?: ScenarioDetails
    pathway?: Pathway
    ensembles?: ModelEnsembles
}

export interface EnsemblesWithStatus {
    loading: boolean,
    ensembles: ExecutableEnsemble[]
}
export type ModelEnsembles = Map<string, EnsemblesWithStatus[]>

export interface ScenarioList {
    scenarioids: string[]
    scenarios: IdMap<Scenario>
}

export interface Scenario extends IdNameObject {
    regionid: string
    subregionid?: string
    dates: DateRange
    last_update?: string
}

export interface DateRange {
    start_date: firebase.firestore.Timestamp
    end_date: firebase.firestore.Timestamp
}

export interface ScenarioDetails extends Scenario {
    goals: IdMap<Goal>
    subgoals: IdMap<SubGoal>
    unsubscribe?: Function
}


export interface PathwayInfo extends IdNameObject {
    dates?: DateRange
}

export interface Pathway extends PathwayInfo {
    driving_variables: string[]
    response_variables: string[]
    models?: ModelMap
    datasets?: DatasetMap
    model_ensembles?: ModelEnsembleMap
    executable_ensemble_summary: IdMap<ExecutableEnsembleSummary>
    notes?: Notes
    last_update?: PathwayUpdateInformation
    visualizations?: Visualization[]
    unsubscribe?: Function
}

export interface Visualization {
    type: string,
    url: string
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
    response_variables: string[],
    driving_variables: string[],
    subregionid?: string
    pathways?: IdMap<PathwayInfo>
}

// Mapping of model id to data ensembles
export interface ModelEnsembleMap {
    [modelid: string]: DataEnsembleMap
}

// Mapping of model input to list of values (data ids or parameter values)
export interface DataEnsembleMap {
    [inputid: string]: string[]
}

export interface ExecutableEnsembleSummary {
    workflow_name: string
    submission_time: number
    total_runs: number
    submitted_runs: number
    successful_runs: number
    failed_runs: number
}

export interface ExecutableEnsemble {
    id: string
    modelid: string
    bindings: InputBindings
    runid?: string
    submission_time: number
    status: "FAILURE" | "SUCCESS" | "RUNNING" | "WAITING",
    run_progress?: number // 0 to 100 (percentage done)
    results: any[] // Chosen results after completed run
    selected: boolean
}

export interface InputBindings {
    [input: string]: string | DataResource
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
        case PATHWAY_SUBSCRIPTION: 
            let pathway_sub = {
                ...state.pathway,
                unsubscribe: action.unsubscribe
            } as Pathway
            return {
                ...state,
                pathway: pathway_sub
            }
        case PATHWAY_DETAILS:
            let pathway = {
                ...action.details,
                unsubscribe: state.pathway!.unsubscribe
            } as Pathway            
            return {
                ...state,
                pathway: pathway
            }
        case PATHWAY_ENSEMBLES_LIST: 
            state.ensembles = { ...state.ensembles };
            state.ensembles[action.modelid] = state.ensembles[action.modelid] || [];
            state.ensembles[action.modelid] = {
                loading: action.loading,
                ensembles: action.ensembles
            }
            return {
                ...state
            };   
        default:
            return state;
    }
};

export default modeling;

