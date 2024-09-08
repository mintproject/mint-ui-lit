import { RootAction } from "../../app/store";
import { Reducer } from "redux";
import { PROBLEM_STATEMENT_DETAILS } from "screens/modeling/actions";
import {
  ProblemStatement,
  ProblemStatementList,
  Thread,
} from "screens/modeling/reducers";
import { PROBLEM_STATEMENTS_LIST, THREAD_DETAILS } from "./actions";

export interface AnalysisState {
  problem_statements?: ProblemStatementList;
  problem_statement?: ProblemStatement;
  thread?: Thread;
}

const INITIAL_STATE: AnalysisState = {};
const analysis: Reducer<AnalysisState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case PROBLEM_STATEMENTS_LIST:
      return {
        ...state,
        problem_statements: action.list,
      };
    case PROBLEM_STATEMENT_DETAILS:
      let problem_statement = {
        ...action.details,
        changed: true,
      } as ProblemStatement;
      return {
        ...state,
        problem_statement: problem_statement,
      };
    case THREAD_DETAILS:
      let thread = {
        ...action.details,
        changed: true,
      } as Thread;
      return {
        ...state,
        thread: thread,
      };
    default:
      return state;
  }
  return state;
};

export default analysis;
