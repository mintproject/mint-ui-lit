import { IdMap } from "app/reducers";
import { RootState } from "app/store";
import { GraphQL } from "config/graphql";
import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import {
  ProblemStatement,
  ProblemStatementInfo,
  ProblemStatementList,
  Thread,
} from "screens/modeling/reducers";
import { problemStatementFromGQL, threadFromGQL } from "util/graphql_adapter";

import fetchProblemStatementsListGQL from "../../queries/problem-statement/list.graphql";
import fetchProblemStatementGQL from "../../queries/problem-statement/get.graphql";
import fetchThreadGQL from "../../queries/thread/get.graphql";
import { OAuth2Adapter } from "util/oauth2-adapter";

export const ANALYSIS_LIST = "ANALYSIS_LIST";

export const PROBLEM_STATEMENTS_LIST = "PROBLEM_STATEMENTS_LIST";
export const PROBLEM_STATEMENT_DETAILS = "PROBLEM_STATEMENT_DETAILS";
export const TASKS_LIST = "TASKS_LIST";
export const THREADS_LIST = "THREADS_LIST";
export const THREAD_DETAILS = "THREAD_DETAILS";

export interface AnalysisActionList extends Action<"ANALYSIS_LIST"> {}
export interface ProblemStatementsActionList
  extends Action<"PROBLEM_STATEMENTS_LIST"> {
  list: ProblemStatementList;
}
export interface ProblemStatementsActionDetails
  extends Action<"PROBLEM_STATEMENT_DETAILS"> {
  details: ProblemStatement;
}
export type ProblemStatementsAction =
  | ProblemStatementsActionList
  | ProblemStatementsActionDetails;

export interface ThreadsActionDetails extends Action<"THREAD_DETAILS"> {
  details: Thread;
}
export type ThreadsAction = ThreadsActionDetails;

export type AnalysisAction =
  | AnalysisActionList
  | ProblemStatementsAction
  | ThreadsAction;

// Get ProblemStatement details
type ProblemDetailsThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  ProblemStatementsActionDetails
>;
export const fetchProblemStatement: ActionCreator<ProblemDetailsThunkResult> =
  (problem_statement_id: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(OAuth2Adapter.getUser());
    APOLLO_CLIENT.query({
      query: fetchProblemStatementGQL,
      variables: {
        id: problem_statement_id,
      },
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
      } else {
        let problem = result.data.problem_statement_by_pk;
        if (problem) {
          //console.log("Fetched the problem statement");
          let details = problemStatementFromGQL(problem);
          // Dispatch problem_statement details on an edit
          dispatch({
            type: PROBLEM_STATEMENT_DETAILS,
            details,
          });
        }
      }
    });
  };

// Get Thread details
type ThreadDetailsThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  ThreadsActionDetails
>;
export const fetchThread: ActionCreator<ThreadDetailsThunkResult> =
  (threadid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(OAuth2Adapter.getUser());
    APOLLO_CLIENT.query({
      query: fetchThreadGQL,
      variables: {
        id: threadid,
      },
    }).then((result) => {
      if (result.errors && result.errors.length > 0) {
        console.log("ERROR");
        console.log(result);
      } else {
        //console.log(result);
        //console.log("Changes to the thread " + threadid);
        let thread = result.data.thread_by_pk;
        if (thread) {
          let details = threadFromGQL(thread);
          // Dispatch problem_statement details on an edit
          dispatch({
            type: THREAD_DETAILS,
            details,
          });
        }
      }
    });
  };

// List ProblemStatements
type ProblemListThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  ProblemStatementsActionList
>;
export const fetchProblemStatementsList: ActionCreator<
  ProblemListThunkResult
> = (regionid: string) => (dispatch) => {
  let APOLLO_CLIENT = GraphQL.instance(OAuth2Adapter.getUser());
  APOLLO_CLIENT.query({
    query: fetchProblemStatementsListGQL,
    variables: {
      regionId: regionid,
    },
  }).then((result) => {
    if (result.errors && result.errors.length > 0) {
      console.log("ERROR");
      console.log(result);
    } else {
      let problem_statements: IdMap<ProblemStatementInfo> = {};
      let problem_statement_ids: string[] = [];
      let problems = result.data.problem_statement;
      //console.log(problems);
      problems.forEach((problem: any) => {
        problem_statement_ids.push(problem["id"]);
        problem_statements[problem["id"]] = problemStatementFromGQL(problem);
      });
      let list = {
        problem_statement_ids: problem_statement_ids,
        problem_statements: problem_statements,
      } as ProblemStatementList;
      dispatch({
        type: PROBLEM_STATEMENTS_LIST,
        list,
      });
    }
  });
};
