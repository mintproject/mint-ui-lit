import { Reducer } from "redux";
import { RootAction } from "../../app/store";
import {
  PROBLEM_STATEMENTS_LIST,
  PROBLEM_STATEMENT_DETAILS,
  PROBLEM_STATEMENT_SUBSCRIPTION,
  THREAD_SUBSCRIPTION,
  THREAD_DETAILS,
  THREAD_EXECUTIONS_LIST,
  TASKS_LIST,
  THREADS_LIST,
  TASK_DETAILS,
  THREADS_LIST_SUBSCRIPTION,
  TASKS_LIST_SUBSCRIPTION,
  THREAD_EXECUTION_SUMMARY_SUBSCRIPTION,
  THREAD_EXECUTION_SUMMARY,
} from "./actions";
import { Model } from "../models/reducers";
import { Dataset, DataResource, Dataslice } from "../datasets/reducers";
import { IdMap, IdNameObject } from "../../app/reducers";
import { REGIONS_LIST_TOP_REGIONS } from "../regions/actions";
import { DataTransformation } from "@mintproject/modelcatalog_client";

export interface ModelingState {
  problem_statements?: ProblemStatementList;
  problem_statement?: ProblemStatement;
  thread?: Thread;
  execution_summaries?: ThreadModelExecutionSummary;
  executions?: ThreadModelExecutions;
}

export interface ExecutionsWithStatus {
  loading: boolean;
  changed: boolean;
  executions: Execution[];
}

export type ModelExecutions = {
  [modelid: string]: ExecutionsWithStatus;
};

export type ThreadModelExecutions = {
  [threadid: string]: ModelExecutions;
};

export type ThreadModelExecutionSummary = {
  [threadid: string]: ModelExecutionSummary;
};

export type ModelExecutionSummary = {
  [modelid: string]: ExecutionSummary;
};

export interface MintPermission {
  userid: string;
  read: boolean;
  write: boolean;
  execute: boolean;
  owner: boolean;
}

export interface MintEvent {
  event: string;
  userid: string;
  timestamp: Date;
  notes: string;
}

export interface ProblemStatementEvent extends MintEvent {
  event: "CREATE" | "UPDATE" | "ADD_TASK" | "DELETE_TASK";
}

export interface TaskEvent extends MintEvent {
  event: "CREATE" | "UPDATE" | "ADD_THREAD" | "DELETE_THREAD";
}

export interface ThreadEvent extends MintEvent {
  event:
    | "CREATE"
    | "UPDATE"
    | "SELECT_DATA"
    | "SELECT_MODELS"
    | "SELECT_PARAMETERS"
    | "EXECUTE"
    | "INGEST"
    | "VISUALIZE";
}

export interface ProblemStatementList {
  problem_statement_ids: string[];
  problem_statements: IdMap<ProblemStatementInfo>;
  unsubscribe?: Function;
}

export interface ProblemStatementInfo extends IdNameObject {
  regionid: string;
  dates: DateRange;
  events?: ProblemStatementEvent[];
  permissions?: MintPermission[];
  preview?: string[];
}

export interface DateRange {
  start_date: Date;
  end_date: Date;
}

export interface ProblemStatement extends ProblemStatementInfo {
  tasks: IdMap<Task>;
  changed?: boolean;
  unsubscribe?: Function;
}

export interface ThreadInfo extends IdNameObject {
  dates?: DateRange;
  task_id: string;
  driving_variables: string[];
  response_variables: string[];
  regionid?: string;
  events?: ThreadEvent[];
  permissions?: MintPermission[];
}

export interface ThreadList {
  thread_ids: string[];
  threads: IdMap<ThreadInfo>;
  unsubscribe?: Function;
}

export interface Thread extends ThreadInfo {
  models?: ModelMap;
  data?: DataMap;
  model_ensembles?: ModelEnsembleMap;
  data_transformations?: IdMap<DataTransformation>;
  model_dt_ensembles?: ModelEnsembleMap;
  execution_summary: IdMap<ExecutionSummary>;
  visualizations?: Visualization[];
  events: ThreadEvent[];
  changed?: boolean;
  refresh?: boolean;
  unsubscribe?: Function;
  dataset_id?: string;
}

export interface Visualization {
  type: string;
  url: string;
}

export interface ComparisonFeature {
  name: string;
  fn: Function;
}

export type ModelMap = IdMap<Model>;

export type DataMap = IdMap<Dataslice>;

export interface TaskList {
  task_ids: string[];
  tasks: IdMap<Task>;
  unsubscribe?: Function;
}

export interface Task extends IdNameObject {
  problem_statement_id: string;
  dates?: DateRange;
  response_variables: string[];
  driving_variables: string[];
  regionid?: string;
  threads?: IdMap<ThreadInfo>;
  events?: TaskEvent[];
  permissions?: MintPermission[];
  unsubscribe?: Function;
}

// Mapping of model id to data ensembles
export interface ModelEnsembleMap {
  [modelid: string]: ThreadModelMap;
}

export interface ThreadModelMap {
  id: string;
  bindings: ModelIOBindings;
}

// Mapping of model input to list of values (data ids or parameter values)
export interface ModelIOBindings {
  [inputid: string]: string[];
}

export interface ExecutionSummary {
  workflow_name?: string;
  changed?: boolean;
  unsubscribe?: Function;

  submitted_for_execution: boolean;
  submission_time: Date;
  total_runs: number;
  submitted_runs: number;
  successful_runs: number;
  failed_runs: number;

  submitted_for_ingestion: boolean;
  fetched_run_outputs: number; // Run data fetched for ingestion
  ingested_runs: number; // Run data ingested in the Visualization database

  submitted_for_registration: boolean;
  registered_runs: number; // Registered in the data catalog

  submitted_for_publishing: boolean;
  published_runs: number; // Published in the provenance catalog
}

export interface Execution {
  id?: string;
  modelid: string;
  bindings: InputBindings;
  runid?: string;
  start_time: Date;
  end_time?: Date;
  execution_engine?: string;
  status: "FAILURE" | "SUCCESS" | "RUNNING" | "WAITING";
  run_progress?: number; // 0 to 100 (percentage done)
  results: any[]; // Chosen results after completed run
  selected: boolean;
}

export interface InputBindings {
  [input: string]: string | DataResource;
}

const INITIAL_STATE: ModelingState = {};

const modeling: Reducer<ModelingState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case REGIONS_LIST_TOP_REGIONS:
      return {
        ...state,
        regions: action.regions,
      };
    case PROBLEM_STATEMENTS_LIST:
      return {
        ...state,
        problem_statements: action.list,
      };
    case PROBLEM_STATEMENT_SUBSCRIPTION:
      let problem_statement_sub = {
        ...state.problem_statement,
        unsubscribe: action.unsubscribe,
      } as ProblemStatement;
      return {
        ...state,
        problem_statement: problem_statement_sub,
      };
    case PROBLEM_STATEMENT_DETAILS:
      let problem_statement = {
        ...action.details,
        changed: true,
        unsubscribe: state.problem_statement?.unsubscribe,
      } as ProblemStatement;
      return {
        ...state,
        problem_statement: problem_statement,
      };
    /*
        case TASKS_LIST_SUBSCRIPTION:
            let tasks_list_sub = {
                ...state.tasks,
                unsubscribe: action.unsubscribe
            } as TaskList
            return {
                ...state,
                tasks: tasks_list_sub
            }
        case TASKS_LIST:
            let tasks = {
                ...action.list,
                unsubscribe: state.tasks!.unsubscribe
            } as TaskList
            return {
                ...state,
                tasks: tasks
            }
        case TASK_DETAILS:
            return {
                ...state,
                task: action.details
            }
        case THREADS_LIST_SUBSCRIPTION:
            let threads_list_sub = {
                ...state.threads,
                unsubscribe: action.unsubscribe
            } as ThreadList
            return {
                ...state,
                threads: threads_list_sub
            }
        case THREADS_LIST:
            let threads = {
                ...action.list,
                unsubscribe: state.threads!.unsubscribe
            } as ThreadList
            return {
                ...state,
                threads: threads
            }*/
    case THREAD_SUBSCRIPTION:
      let thread_sub = {
        ...state.thread,
        unsubscribe: action.unsubscribe,
      } as Thread;
      return {
        ...state,
        thread: thread_sub,
      };
    case THREAD_DETAILS:
      let thread = {
        ...action.details,
        changed: true,
        unsubscribe: state.thread?.unsubscribe,
      } as Thread;
      return {
        ...state,
        thread: thread,
      };
    case THREAD_EXECUTIONS_LIST:
      state.executions = { ...state.executions };
      state.executions[action.thread_id] = {
        ...state.executions[action.thread_id],
      };
      state.executions[action.thread_id][action.model_id] = {
        loading: action.loading,
        changed: true,
        executions: action.executions,
      };
      return {
        ...state,
      };
    case THREAD_EXECUTION_SUMMARY:
      state.execution_summaries = { ...state.execution_summaries };
      state.execution_summaries[action.thread_id] = {
        ...state.execution_summaries[action.thread_id],
      };
      let unsubscribefn =
        state.execution_summaries[action.thread_id][action.model_id]
          ?.unsubscribe;
      state.execution_summaries[action.thread_id][action.model_id] = {
        ...action.execution_summary,
        changed: true,
        unsubscribe: unsubscribefn,
      };
      if (unsubscribefn) {
        return { ...state };
      }
    case THREAD_EXECUTION_SUMMARY_SUBSCRIPTION:
      state.execution_summaries = { ...state.execution_summaries };
      state.execution_summaries[action.thread_id] = {
        ...state.execution_summaries[action.thread_id],
      };
      let summary =
        state.execution_summaries[action.thread_id][action.model_id];
      state.execution_summaries[action.thread_id][action.model_id] = {
        ...summary,
        unsubscribe: action.unsubscribe,
      };
      if (summary) {
        return { ...state };
      }
    default:
      return state;
  }
};

export default modeling;
