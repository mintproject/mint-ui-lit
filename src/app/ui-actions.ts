import { Action, ActionCreator } from "redux";

// UI ACTIONS
export const UI_SELECT_PROBLEM_STATEMENT = "UI_SELECT_PROBLEM_STATEMENT";
export const UI_SELECT_TASK = "UI_SELECT_TASK";
export const UI_SELECT_THREAD = "UI_SELECT_THREAD";
export const UI_SELECT_THREAD_SECTION = "UI_SELECT_THREAD_SECTION";
export const UI_SELECT_TOP_REGION = "UI_SELECT_TOP_REGION";
export const UI_SELECT_SUB_REGION = "UI_SELECT_SUB_REGION";
export const UI_SELECT_DATA_TRANSFORMATION = "UI_SELECT_DATA_TRANSFORMATION";

export interface UIActionSelectProblemStatement
  extends Action<"UI_SELECT_PROBLEM_STATEMENT"> {
  problem_statement_id: string;
}
export interface UIActionSelectTask extends Action<"UI_SELECT_TASK"> {
  task_id: string;
}
export interface UIActionSelectThread extends Action<"UI_SELECT_THREAD"> {
  thread_id: string;
}
export interface UIActionSelectThreadSection
  extends Action<"UI_SELECT_THREAD_SECTION"> {
  section: string;
}
export interface UIActionSelectTopRegion
  extends Action<"UI_SELECT_TOP_REGION"> {
  regionid?: string;
}
export interface UIActionSelectSubRegion
  extends Action<"UI_SELECT_SUB_REGION"> {
  regionid?: string;
}
export interface UIActionSelectDataTransformation
  extends Action<"UI_SELECT_DATA_TRANSFORMATION"> {
  dtid?: string;
}

export type UIAction =
  | UIActionSelectProblemStatement
  | UIActionSelectTask
  | UIActionSelectThread
  | UIActionSelectThreadSection
  | UIActionSelectTopRegion
  | UIActionSelectSubRegion
  | UIActionSelectThread
  | UIActionSelectDataTransformation;

export const selectProblemStatement: ActionCreator<
  UIActionSelectProblemStatement
> = (problem_statement_id: string) => {
  return {
    type: UI_SELECT_PROBLEM_STATEMENT,
    problem_statement_id: problem_statement_id,
  };
};

export const selectTask: ActionCreator<UIActionSelectTask> = (
  task_id: string
) => {
  return {
    type: UI_SELECT_TASK,
    task_id: task_id,
  };
};

export const selectThread: ActionCreator<UIActionSelectThread> = (
  thread_id: string
) => {
  return {
    type: UI_SELECT_THREAD,
    thread_id: thread_id,
  };
};

export const selectThreadSection: ActionCreator<UIActionSelectThreadSection> = (
  section: string
) => {
  return {
    type: UI_SELECT_THREAD_SECTION,
    section: section,
  };
};

export const selectTopRegion: ActionCreator<UIActionSelectTopRegion> = (
  regionid: string
) => {
  return {
    type: UI_SELECT_TOP_REGION,
    regionid: regionid,
  };
};

export const selectSubRegion: ActionCreator<UIActionSelectSubRegion> = (
  regionid: string
) => {
  return {
    type: UI_SELECT_SUB_REGION,
    regionid: regionid,
  };
};

export const selectDataTransformation: ActionCreator<
  UIActionSelectDataTransformation
> = (dtid: string) => {
  return {
    type: UI_SELECT_DATA_TRANSFORMATION,
    dtid: dtid ? dtid : "",
  };
};
