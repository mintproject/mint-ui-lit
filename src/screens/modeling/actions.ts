import { Action, ActionCreator } from 'redux';
import { ProblemStatementList, ProblemStatementInfo, 
    ProblemStatement,  Thread, Task, 
    Execution, ThreadInfo, ThreadList, TaskList, ModelEnsembleMap, DataMap, ExecutionSummary, ThreadEvent } from './reducers';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../../app/store';
//import { db, fieldValue, auth } from '../../config/firebase';
import { Dataset, DataResource, Dataslice } from '../datasets/reducers';
import { Model } from '../models/reducers';
import { IdMap, UserPreferences } from '../../app/reducers';

import { GraphQL } from 'config/graphql';

import subscribeProblemStatementsListGQL from '../../queries/problem-statement/list-subscription.graphql';
import subscribeProblemStatementGQL from '../../queries/problem-statement/get-subscription.graphql';
import subscribeThreadGQL from '../../queries/thread/get-subscription.graphql';

import newProblemStatementGQL from '../../queries/problem-statement/new.graphql';
import newTaskGQL from '../../queries/task/new.graphql';
import newThreadGQL from '../../queries/thread/new.graphql';

import updateProblemStatementGQL from '../../queries/problem-statement/update.graphql';
import updateTaskGQL from '../../queries/task/update.graphql';
import updateThreadModelGQL from '../../queries/thread/update-models.graphql';
import updateThreadDataGQL from '../../queries/thread/update-datasets.graphql';
import updateThreadParametersGQL from '../../queries/thread/update-parameters.graphql';
import updateThreadInfoGQL from '../../queries/thread/update-info.graphql';
import addThreadEventGQL from '../../queries/thread/add-event.graphql';
import setDatasliceResourcesGQL from '../../queries/thread/set-dataslice-resources.graphql';
import getDatasliceResourcesGQL from '../../queries/thread/get-dataslice-resources.graphql';

import deleteProblemStatementGQL from '../../queries/problem-statement/delete.graphql';
import deleteTaskGQL from '../../queries/task/delete.graphql';
import deleteThreadGQL from '../../queries/thread/delete.graphql';

import listExistingModelsGQL from '../../queries/model/list-in.graphql';
import newModelsGQL from '../../queries/model/new.graphql';

import executionIdsForThreadGQL from '../../queries/execution/executionids-for-thread.graphql';
import subscribeExecutionsListGQL from '../../queries/execution/list-subscription.graphql';
import listThreadModelExecutionsListGQL from '../../queries/execution/executions-for-thread-model.graphql';
import subscribeThreadExecutionSummaryListGQL from '../../queries/execution/thread-execution-summary-subscription.graphql';
import getThreadExecutionSummaryListGQL from '../../queries/execution/thread-execution-summary.graphql';
import listExecutionsListGQL from '../../queries/execution/list.graphql';

import { problemStatementFromGQL, taskFromGQL, threadFromGQL, 
    threadInfoFromGQL, taskToGQL, problemStatementToGQL, 
    executionFromGQL, taskUpdateToGQL, 
    problemStatementUpdateToGQL, 
    threadInfoUpdateToGQL,
    threadInfoToGQL,
    threadModelsToGQL,
    modelToGQL,
    getCustomEvent,
    threadDataBindingsToGQL,
    threadParameterBindingsToGQL, datasliceFromGQL, threadModelExecutionSummaryFromGQL} from '../../util/graphql_adapter';
import { postJSONResource } from 'util/mint-requests';
import { isObject } from 'util';
import { Md5 } from 'ts-md5';
import { Model as MCModel, SoftwareImage, ModelConfiguration, SoftwareVersion } from '@mintproject/modelcatalog_client';
import { fetchModelsFromCatalog } from 'screens/models/actions';
import { KeycloakAdapter } from 'util/keycloak-adapter';

export const PROBLEM_STATEMENTS_LIST = 'PROBLEM_STATEMENTS_LIST';
export const PROBLEM_STATEMENTS_LIST_SUBSCRIPTION = 'PROBLEM_STATEMENTS_LIST_SUBSCRIPTION';
export const PROBLEM_STATEMENTS_ADD = 'PROBLEM_STATEMENTS_ADD';
export const PROBLEM_STATEMENTS_REMOVE = 'PROBLEM_STATEMENTS_REMOVE';
export const PROBLEM_STATEMENTS_UPDATE = 'PROBLEM_STATEMENTS_UPDATE';
export const PROBLEM_STATEMENT_DETAILS = 'PROBLEM_STATEMENT_DETAILS';
export const PROBLEM_STATEMENT_SUBSCRIPTION = 'PROBLEM_STATEMENT_SUBSCRIPTION';

export const TASKS_LIST = 'TASKS_LIST';
export const TASKS_LIST_SUBSCRIPTION = 'TASKS_LIST_SUBSCRIPTION';
export const TASKS_ADD = 'TASKS_ADD';
export const TASKS_REMOVE = 'TASKS_REMOVE';
export const TASKS_UPDATE = 'TASKS_UPDATE';
export const TASK_DETAILS = 'TASK_DETAILS';
export const TASK_SUBSCRIPTION = 'TASK_SUBSCRIPTION';

export const THREADS_LIST = 'THREADS_LIST';
export const THREADS_LIST_SUBSCRIPTION = 'THREADS_LIST_SUBSCRIPTION';
export const THREADS_ADD = 'THREADS_ADD';
export const THREADS_REMOVE = 'THREADS_REMOVE';
export const THREADS_UPDATE = 'THREADS_UPDATE';

export const THREAD_DETAILS = 'THREAD_DETAILS';
export const THREAD_SUBSCRIPTION = 'THREAD_SUBSCRIPTION';
export const THREAD_VARIABLES_ADD = 'THREAD_VARIABLES_ADD';
export const THREAD_VARIABLES_REMOVE = 'THREAD_VARIABLES_REMOVE';
export const THREAD_MODELS_ADD = 'THREAD_MODELS_ADD';
export const THREAD_MODELS_REMOVE = 'THREAD_MODELS_REMOVE';
export const THREAD_DATASETS_ADD = 'THREAD_DATASETS_ADD';
export const THREAD_DATASETS_REMOVE = 'THREAD_DATASETS_REMOVE';
export const THREAD_EXECUTIONS_LIST = 'THREAD_EXECUTIONS_LIST';
export const THREAD_EXECUTIONS_ADD = 'THREAD_EXECUTIONS_ADD';
export const THREAD_EXECUTIONS_REMOVE = 'THREAD_EXECUTIONS_REMOVE';
export const THREAD_EXECUTIONS_RUN = 'THREAD_EXECUTIONS_RUN';
export const THREAD_EXECUTION_SUMMARY = 'THREAD_EXECUTION_SUMMARY';
export const THREAD_EXECUTION_SUMMARY_SUBSCRIPTION = 'THREAD_EXECUTION_SUMMARY_SUBSCRIPTION';

export interface ProblemStatementsActionList extends Action<'PROBLEM_STATEMENTS_LIST'> { list: ProblemStatementList };
export interface ProblemStatementsActionListSubscription extends Action<'PROBLEM_STATEMENTS_LIST_SUBSCRIPTION'> { unsubscribe: Function };
export interface ProblemStatementsActionAdd extends Action<'PROBLEM_STATEMENTS_ADD'> { item: ProblemStatementInfo };
export interface ProblemStatementsActionRemove extends Action<'PROBLEM_STATEMENTS_REMOVE'> { id: string };
export interface ProblemStatementsActionUpdate extends Action<'PROBLEM_STATEMENTS_UPDATE'> { item: ProblemStatementInfo };

export interface ProblemStatementsActionDetails extends Action<'PROBLEM_STATEMENT_DETAILS'> { details: ProblemStatement };
export interface ProblemStatementsActionSubscription extends Action<'PROBLEM_STATEMENT_SUBSCRIPTION'> { unsubscribe: Function };

export type ProblemStatementsAction = ProblemStatementsActionList | ProblemStatementsActionAdd | ProblemStatementsActionRemove |
    ProblemStatementsActionUpdate | ProblemStatementsActionDetails | ProblemStatementsActionSubscription | ProblemStatementsActionListSubscription;

export interface TasksActionList extends Action<'TASKS_LIST'> { list: TaskList };
export interface TasksActionListSubscription extends Action<'TASKS_LIST_SUBSCRIPTION'> { unsubscribe: Function };
export interface TasksActionAdd extends Action<'TASKS_ADD'> { item: Task, goalid: string, problem_statement_id: string };
export interface TasksActionRemove extends Action<'TASKS_REMOVE'> { id: string, problem_statement_id: string };
export interface TasksActionUpdate extends Action<'TASKS_UPDATE'> { item: Task, problem_statement_id: string };
export interface TasksActionDetails extends Action<'TASK_DETAILS'> { details: Task };
export interface TasksActionSubscription extends Action<'TASK_SUBSCRIPTION'> { unsubscribe: Function };

export type TasksAction = TasksActionList | TasksActionAdd | TasksActionRemove 
    | TasksActionUpdate | TasksActionDetails | TasksActionSubscription | TasksActionListSubscription;

export interface ThreadsActionList extends Action<'THREADS_LIST'> { list: ThreadList };
export interface ThreadsActionListSubscription extends Action<'THREADS_LIST_SUBSCRIPTION'> { unsubscribe: Function };
export interface ThreadsActionAdd extends Action<'THREADS_ADD'> { item: Thread, subgoalid: string, problem_statement_id: string };
export interface ThreadsActionRemove extends Action<'THREADS_REMOVE'> { id: string, problem_statement_id: string };
export interface ThreadsActionUpdate extends Action<'THREADS_UPDATE'> { item: Thread, problem_statement_id: string };
export interface ThreadsActionDetails extends Action<'THREAD_DETAILS'> { details: Thread };
export interface ThreadsActionSubscription extends Action<'THREAD_SUBSCRIPTION'> { unsubscribe: Function };

export type ThreadsAction = ThreadsActionList | ThreadsActionAdd | ThreadsActionRemove 
    | ThreadsActionUpdate | ThreadsActionDetails | ThreadsActionSubscription | ThreadsActionListSubscription;


export interface ThreadVariablesActionAdd extends Action<'THREAD_VARIABLES_ADD'> { 
    item: string, thread_id: string
};
export interface ThreadVariablesActionRemove extends Action<'THREAD_VARIABLES_REMOVE'> { 
    id: string, thread_id: string
};

export interface ThreadModelsActionAdd extends Action<'THREAD_MODELS_ADD'> { 
    item: Model, thread_id: string, problem_statement_id: string
};
export interface ThreadModelsActionRemove extends Action<'THREAD_MODELS_REMOVE'> { 
    id: string, thread_id: string
};

export interface ThreadDatasetsActionAdd extends Action<'THREAD_DATASETS_ADD'> { 
    item: Dataset, thread_id: string
};
export interface ThreadDatasetsActionRemove extends Action<'THREAD_DATASETS_REMOVE'> { 
    id: string, thread_id: string
};

export interface ThreadExecutionsActionList extends Action<'THREAD_EXECUTIONS_LIST'> { 
    thread_id: string
    model_id: string
    loading: boolean
    executions: Execution[] 
};

export interface ThreadExecutionSummaryActionDetails extends Action<'THREAD_EXECUTION_SUMMARY'> { 
    thread_id: string
    model_id: string
    execution_summary?: ExecutionSummary
    unsubscribe?: Function 
};

export interface ThreadExecutionSummaryActionSubscription extends Action<'THREAD_EXECUTION_SUMMARY_SUBSCRIPTION'> { 
    thread_id: string
    model_id?: string
    unsubscribe?: Function 
};

export interface ThreadExecutionsActionAdd extends Action<'THREAD_EXECUTIONS_ADD'> { 
    item: Execution, thread_id: string
};
export interface ThreadExecutionsActionRemove extends Action<'THREAD_EXECUTIONS_REMOVE'> { 
    id: string, thread_id: string
};
export interface ThreadExecutionsActionRun extends Action<'THREAD_EXECUTIONS_RUN'> { 
    id: string, thread_id: string
};

export type ThreadAction = ThreadVariablesActionAdd | ThreadVariablesActionRemove |
    ThreadModelsActionAdd | ThreadModelsActionRemove | 
    ThreadDatasetsActionAdd | ThreadDatasetsActionRemove |
    ThreadExecutionsActionAdd | ThreadExecutionsActionRemove | ThreadExecutionsActionRun | 
    ThreadExecutionsActionList | ThreadsActionListSubscription | 
    ThreadExecutionSummaryActionDetails | ThreadExecutionSummaryActionSubscription;

export type ModelingAction =  ProblemStatementsAction | TasksAction | ThreadsAction | ThreadAction ;

// List ProblemStatements
type SubProblemListThunkResult = ThunkAction<void, RootState, undefined, ProblemStatementsActionList | ProblemStatementsActionListSubscription>;
export const subscribeProblemStatementsList: ActionCreator<SubProblemListThunkResult> = (regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeProblemStatementsListGQL,
        variables: {
            regionId: regionid
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let problem_statements:IdMap<ProblemStatementInfo> = {};
            let problem_statement_ids:string[] = [];
            let problems = result.data.problem_statement;
            //console.log(problems);
            /* FIXME: I've changed the query to return all variables used on task and threads, As
             * I'm processing the data here to do not break anything */
            problems.forEach((problem: any) => {
                if (problem["tasks"]) {
                    let varnameset : Set<string> = new Set();
                    problem["tasks"].forEach(t =>  
                        t["threads"].forEach(th => 
                            varnameset.add(th.response_variable.name)
                        )
                    );
                    problem["preview"] = Array.from(varnameset);
                    delete problem["tasks"]
                }
            });
            /**/
            problems.forEach((problem: any) => {
                problem_statement_ids.push(problem["id"]);
                problem_statements[problem["id"]] = problemStatementFromGQL(problem);
            })
            let list = {
                problem_statement_ids: problem_statement_ids,
                problem_statements: problem_statements
            } as ProblemStatementList;   
            dispatch({
                type: PROBLEM_STATEMENTS_LIST,
                list
            })
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: PROBLEM_STATEMENTS_LIST_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};

/*
// List Tasks
type ListTasksThunkResult = ThunkAction<void, RootState, undefined, TasksActionList | TasksActionListSubscription>;
export const subscribeTasksList: ActionCreator<ListTasksThunkResult> = (problem_statement_id: string) => (dispatch) => {
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeTasksListGQL,
        variables: {
            problem_statement_id: problem_statement_id
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let tasks:IdMap<Task> = {};
            let task_ids:string[] = [];
            //console.log(problems);
            result.data.task.forEach((task: any) => {
                task_ids.push(task["id"]);
                tasks[task["id"]] = taskFromGQL(task);
            })
            let list = {
                task_ids: task_ids,
                tasks: tasks
            } as TaskList;   
            dispatch({
                type: TASKS_LIST,
                list
            })
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: TASKS_LIST_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};


// List Threads
type ListThreadsThunkResult = ThunkAction<void, RootState, undefined, ThreadsActionList | ThreadsActionListSubscription >;
export const subscribeThreadsList: ActionCreator<ListThreadsThunkResult> = (task_id: string) => (dispatch) => {

    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeThreadsListGQL,
        variables: {
            task_id: task_id
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let threads:IdMap<ThreadInfo> = {};
            let thread_ids:string[] = [];
            //console.log(problems);
            result.data.thread.forEach((thread: any) => {
                thread_ids.push(thread["id"]);
                threads[thread["id"]] = threadInfoFromGQL(thread);
            })
            let list = {
                thread_ids: thread_ids,
                threads: threads
            } as ThreadList;   
            dispatch({
                type: THREADS_LIST,
                list
            })
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: THREADS_LIST_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};
*/

// Get ProblemStatement details
type SubProblemDetailsThunkResult = ThunkAction<void, RootState, undefined, ProblemStatementsActionDetails | ProblemStatementsActionSubscription>;
export const subscribeProblemStatement: ActionCreator<SubProblemDetailsThunkResult> = (problem_statement_id: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeProblemStatementGQL,
        variables: {
            id: problem_statement_id
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let problem = result.data.problem_statement_by_pk;
            if(problem) {
                //console.log("Changes to the problem statement");
                let details = problemStatementFromGQL(problem);
                // Dispatch problem_statement details on an edit
                dispatch({
                    type: PROBLEM_STATEMENT_DETAILS,
                    details
                });
            }
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: PROBLEM_STATEMENT_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};

/*
// Get Task details
type TaskDetailsThunkResult = ThunkAction<void, RootState, undefined, TasksActionDetails | TasksActionSubscription >;
export const subscribeTask: ActionCreator<TaskDetailsThunkResult> = (task_id: string) => (dispatch) => {
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeTaskGQL,
        variables: {
            id: task_id
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let task = result.data.task_by_pk;
            let details = taskFromGQL(task);
            // Dispatch problem_statement details on an edit
            dispatch({
                type: TASK_DETAILS,
                details
            });
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: TASK_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};
*/

// Get Thread details
type ThreadSubDetailsThunkResult = ThunkAction<void, RootState, undefined, ThreadsActionDetails | ThreadsActionSubscription>;
export const subscribeThread: ActionCreator<ThreadSubDetailsThunkResult> = (threadid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeThreadGQL,
        variables: {
            id: threadid
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            //console.log(result);
            //console.log("Changes to the thread " + threadid);
            let thread = result.data.thread_by_pk;
            if(thread) {
                let details = threadFromGQL(thread);
                // Dispatch problem_statement details on an edit
                dispatch({
                    type: THREAD_DETAILS,
                    details
                });
            }
        }
    });
    // Dispatch unsubscribe function
    dispatch({
        type: THREAD_SUBSCRIPTION,
        unsubscribe: () => { subscription.unsubscribe() }
    });
};

// List Thread Execution Summaries
type SubThreadExecutionSummaryThunkResult = ThunkAction<void, RootState, undefined, ThreadExecutionSummaryActionDetails | ThreadExecutionSummaryActionSubscription>;
export const subscribeThreadExecutionSummary: ActionCreator<SubThreadExecutionSummaryThunkResult> = 
        (thread_id:string, model_id: string, thread_model_id: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let subscription = APOLLO_CLIENT.subscribe({
        query: subscribeThreadExecutionSummaryListGQL,
        variables: {
            threadModelId: thread_model_id,
        }
    }).subscribe(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let tmsummary = result.data.thread_model_execution_summary;
            let summary = threadModelExecutionSummaryFromGQL(tmsummary[0] ?? {});
            summary.changed = true;
            //console.log("Updated summary for "+thread_id);
            dispatch({
                type: THREAD_EXECUTION_SUMMARY,
                model_id: model_id,
                thread_id: thread_id,
                execution_summary: summary,
            })
        }
    });
    // Dispatch unsubscribe function
    dispatch({
        type: THREAD_EXECUTION_SUMMARY_SUBSCRIPTION,
        thread_id: thread_id,
        model_id: model_id,
        unsubscribe: () => { subscription.unsubscribe() }
    });    
};

// List Thread Execution Summaries
type ThreadExecutionSummaryThunkResult = ThunkAction<void, RootState, undefined, ThreadExecutionSummaryActionDetails>;
export const getThreadExecutionSummary: ActionCreator<ThreadExecutionSummaryThunkResult> = 
        (thread_id:string, model_id: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
        query: getThreadExecutionSummaryListGQL,
        variables: {
            thread_id: thread_id,
            model_id: model_id
        }
    }).then(result => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let tmsummary = result.data.thread_model_execution_summary;
            let summary = threadModelExecutionSummaryFromGQL(tmsummary[0] ?? {});
            summary.changed = true;
            //console.log("Updated summary for "+thread_id);
            dispatch({
                type: THREAD_EXECUTION_SUMMARY,
                model_id: model_id,
                thread_id: thread_id,
                execution_summary: summary,
            })
        }
    });  
};

// List Thread Runs
type ListExecutionsThunkResult = ThunkAction<void, RootState, undefined, ThreadExecutionsActionList>;
export const listThreadModelExecutionsAction: ActionCreator<ListExecutionsThunkResult> = 
        (thread_id:string, model_id: string, thread_model_id: string, 
            start: number, limit: number, order_by: Array<Object>,
            ) => (dispatch) => {

    dispatch({
        type: THREAD_EXECUTIONS_LIST,
        model_id: model_id,
        thread_id: thread_id,
        executions: null,
        loading: true
    });

    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    APOLLO_CLIENT.query({
        query: listThreadModelExecutionsListGQL,
        variables: {
            threadModelId: thread_model_id,
            start: start,
            limit: limit,
            orderBy: order_by ? order_by : []
        },
        fetchPolicy: "no-cache"
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let executions = result.data.execution.map((ex:any) => executionFromGQL(ex));
            dispatch({
                type: THREAD_EXECUTIONS_LIST,
                model_id: model_id,
                thread_id: thread_id,
                loading: false,
                executions
            })
        }
    });
};

export const getAllThreadExecutionIds = async (thread_id: string, modelid: string) : Promise<string[]> => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.query({
        query: executionIdsForThreadGQL,
        variables: {
            id: thread_id,
            modelId: modelid
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            if(result.data.thread_by_pk.thread_models.length > 0)
                return result.data.thread_by_pk.thread_models[0].executions.map((ex:any) => ex.execution_id);
        }
        return null;        
    });
}

// Add ProblemStatement
export const addProblemStatement = (problem_statement:ProblemStatementInfo) : Promise<string> =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let problemobj = problemStatementToGQL(problem_statement);
    //console.log(problemobj);
    return APOLLO_CLIENT.mutate({
        mutation: newProblemStatementGQL,
        variables: {
            object: problemobj
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return result.data.insert_problem_statement.returning[0].id;
        }
        return null;        
    });
};

// Add Task
export const addTask = (problem_statement: ProblemStatementInfo, task: Task) : Promise<string> =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let taskobj = taskToGQL(task, problem_statement);
    return APOLLO_CLIENT.mutate({
        mutation: newTaskGQL,
        variables: {
            object: taskobj
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return result.data.insert_task.returning[0].id;
        }
        return null;        
    });
};

// Add Task
export const addTaskWithThread = (problem_statement: ProblemStatementInfo, task: Task, thread: ThreadInfo) : Promise<string[]> =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let taskobj = taskToGQL(task, problem_statement);
    let threadobj = threadInfoToGQL(thread, task.id, task.regionid);
    taskobj["threads"] = {
        data: [threadobj]
    }
    return APOLLO_CLIENT.mutate({
        mutation: newTaskGQL,
        variables: {
            object: taskobj
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return [
                result.data.insert_task.returning[0].id,
                result.data.insert_task.returning[0].threads[0].id
            ];
        }
        return null;        
    });
};

// Add Thread
export const addThread = (task:Task, thread: ThreadInfo) : Promise<string> =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let threadobj = threadInfoToGQL(thread, task.id, task.regionid);
    //console.log(threadobj);
    return APOLLO_CLIENT.mutate({
        mutation: newThreadGQL,
        variables: {
            object: threadobj
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return result.data.insert_thread.returning[0].id;
        }
        return null;        
    });
};


// Update ProblemStatement
export const updateProblemStatement = (problem_statement: ProblemStatementInfo) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let problemobj = problemStatementUpdateToGQL(problem_statement);
    return APOLLO_CLIENT.mutate({
        mutation: updateProblemStatementGQL,
        variables: {
            object: problemobj
        }
    });
};

// Update Task
export const updateTask = (task: Task) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let taskobj = taskUpdateToGQL(task);
    return APOLLO_CLIENT.mutate({
        mutation: updateTaskGQL,
        variables: {
            object: taskobj
        }
    });
};

export const updateThreadInformation = (threadinfo: ThreadInfo) => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let threadobj = threadInfoUpdateToGQL(threadinfo);
    return APOLLO_CLIENT.mutate({
        mutation: updateThreadInfoGQL,
        variables: {
            object: threadobj
        }
    });
}

export const setThreadModels = (models: Model[], notes: string, thread: Thread) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let threadmodelsobj = models.map((model) => {
        return {
            model_id: model.id,
            thread_id: thread.id
        };
    });
    let event = getCustomEvent("SELECT_MODELS", notes);
    let eventobj = event;
    eventobj["thread_id"] = thread.id;
    return APOLLO_CLIENT.mutate({
        mutation: updateThreadModelGQL,
        variables: {
            threadId: thread.id,
            objects: threadmodelsobj,
            event: eventobj
        }
    });
};

export const setThreadData = (datasets: DataMap, model_ensembles: ModelEnsembleMap, 
        notes: string, thread: Thread) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    let bindings = threadDataBindingsToGQL(datasets, model_ensembles, thread);
    let event = getCustomEvent("SELECT_DATA", notes);
    let eventobj = event;
    eventobj["thread_id"] = thread.id;
    return APOLLO_CLIENT.mutate({
        mutation: updateThreadDataGQL,
        variables: {
            threadId: thread.id,
            data: bindings.data,
            modelIO: bindings.model_io,
            event: eventobj
        }
    });
};

export const setThreadParameters = (model_ensembles: ModelEnsembleMap, 
        execution_summary: IdMap<ExecutionSummary>,
        notes: string, thread: Thread) =>  {
    let bindings = threadParameterBindingsToGQL(model_ensembles, thread);
    let event = getCustomEvent("SELECT_PARAMETERS", notes);
    let eventobj = event;
    eventobj["thread_id"] = thread.id;
    let summaries = [];
    Object.keys(execution_summary).forEach((modelid) => {
        let summary = execution_summary[modelid];
        summary["thread_model_id"] = model_ensembles[modelid].id;
        summaries.push(summary);
    })
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: updateThreadParametersGQL,
        variables: {
            threadId: thread.id,
            summaries: summaries,
            modelParams: bindings,
            event: eventobj
        }
    });
};

export const getThreadDataResources = (sliceid: string): Promise<Dataslice> => {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.query({
        query: getDatasliceResourcesGQL,
        variables: {
            id: sliceid,
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return datasliceFromGQL(result.data.dataslice_by_pk);
        }
    });
}

export const selectThreadDataResources = (sliceid: string, resource_selections: any, threadid: string) => {
    let slice_resources = Object.keys(resource_selections).map((resid) => {
        return {
            dataslice_id: sliceid,
            resource_id: resid,
            selected: resource_selections[resid]
        };
    })
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: setDatasliceResourcesGQL,
        variables: {
            datasliceId: sliceid,
            threadId: threadid,
            resources: slice_resources
        },
        refetchQueries: [{
            query: getDatasliceResourcesGQL,
            variables: {
                id: sliceid
            }
        }]
    });
}

export const addThreadEvent = (eventobj: ThreadEvent, thread: Thread) =>  {
    eventobj["thread_id"] = thread.id;
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: addThreadEventGQL,
        variables: {
            threadId: thread.id,
            event: eventobj
        }
    });
};

// Cache Models in GraphQL backend
export const cacheModelsFromCatalog = async (
    models: Model[], 
    allSoftwareImages: IdMap<SoftwareImage>, 
    allConfigs: IdMap<ModelConfiguration>,
    allVersions: IdMap<SoftwareVersion>,
    allModels: IdMap<MCModel>) =>  {
        let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
        // First check if any of these models are already in GraphQL
        let result = await APOLLO_CLIENT.query({
            query: listExistingModelsGQL,
            variables: {
                modelIds: models.map((m) => m.id)
            }
        });
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            let uncached_models = {};
            models.forEach(model => {
                let found = false;
                result.data.model.forEach(m => {
                    if (m["id"] == model["id"])
                        found = true;
                });
                if(!found) {
                    uncached_models[model.id] = model;
                }
            });
            if(Object.keys(uncached_models).length > 0) {
                let full_models = await fetchModelsFromCatalog(uncached_models, 
                    allSoftwareImages, allConfigs, allVersions, allModels); 
                await APOLLO_CLIENT.mutate({
                    mutation: newModelsGQL,
                    variables: {
                        objects: Object.values(full_models).map((fullmodel) => modelToGQL(fullmodel))
                    }
                });
            }
        }
    }


// Delete ProblemStatement
export const deleteProblemStatement = (problem_statement_id: string) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: deleteProblemStatementGQL,
        variables: {
            id: problem_statement_id
        }
    });
};

// Delete Task
export const deleteTask = (taskid: string) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: deleteTaskGQL,
        variables: {
            id: taskid
        }
    });
};

// Delete Thread
export const deleteThread = (threadid: string) =>  {
    let APOLLO_CLIENT = GraphQL.instance(KeycloakAdapter.getUser());
    return APOLLO_CLIENT.mutate({
        mutation: deleteThreadGQL,
        variables: {
            id: threadid
        }
    });
};

/* Execution Functions */

export const getMatchingEnsemble = (ensembles: Execution[], execution: Execution, hashes: string[]) => {
    let hash = getEnsembleHash(execution);
    let index = hashes.indexOf(hash);
    if(index >= 0) {
        return ensembles[index];
    }
    return null;
}

export const getEnsembleHash = (ensemble: Execution) : string => {
    let str = ensemble.modelid;
    let varids = Object.keys(ensemble.bindings).sort();
    varids.map((varid) => {
        let binding = ensemble.bindings[varid];
        let bindingid = isObject(binding) ? (binding as DataResource).id : binding;
        str += varid + "=" + bindingid + "&";
    })
    return Md5.hashStr(str).toString();
}

export const sendDataForIngestion = (threadid: string, prefs: UserPreferences) => {
    let data = {
        thread_id: threadid
    };
    return new Promise<void>((resolve, reject) => {
        postJSONResource({
            url: prefs.mint.ingestion_api + "/modelthreads",
            onLoad: function(e: any) {
                resolve();
            },
            onError: function() {
                reject("Cannot ingest thread");
            }
        }, data, false);
    });    
}

export const threadTotalRunsChanged = (oldthread: Thread, newthread: Thread) => {
    if(oldthread == null && newthread != null)
        return true;
    if(newthread == null)
        return false;

    let oldtotal = 0;
    Object.keys(oldthread.execution_summary).map((modelid) => {
        oldtotal += oldthread.execution_summary[modelid].total_runs;
    })
    let newtotal = 0;
    Object.keys(newthread.execution_summary).map((modelid) => {
        newtotal += newthread.execution_summary[modelid].total_runs;
    })
    return oldtotal != newtotal;
}
