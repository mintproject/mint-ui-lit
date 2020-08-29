import { Action, ActionCreator } from 'redux';
import { ProblemStatementList, ProblemStatement, ProblemStatementDetails,  Thread, Task, Execution, ThreadInfo, ThreadList, TaskList } from './reducers';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../../app/store';
//import { db, fieldValue, auth } from '../../config/firebase';
import { Dataset, DataResource } from '../datasets/reducers';
import { Model } from '../models/reducers';
import { IdMap, UserPreferences } from '../../app/reducers';

import { APOLLO_CLIENT } from 'config/graphql';

import subscribeProblemStatementsListGQL from '../../queries/problem-statement/list-subscription.graphql';
import subscribeTasksListGQL from '../../queries/task/list-subscription.graphql';
import subscribeThreadsListGQL from '../../queries/thread/list-subscription.graphql';
import subscribeProblemStatementGQL from '../../queries/problem-statement/get-subscription.graphql';
import subscribeTaskGQL from '../../queries/task/get-subscription.graphql';
import subscribeThreadGQL from '../../queries/thread/get-subscription.graphql';
import newProblemStatementGQL from '../../queries/problem-statement/new.graphql';
import newTaskGQL from '../../queries/task/new.graphql';
import newThreadGQL from '../../queries/thread/new.graphql';
import updateProblemStatementGQL from '../../queries/problem-statement/update.graphql';
import updateTaskGQL from '../../queries/task/update.graphql';
import updateThreadGQL from '../../queries/thread/update.graphql';
import deleteProblemStatementGQL from '../../queries/problem-statement/delete.graphql';
import deleteTaskGQL from '../../queries/task/delete.graphql';
import deleteThreadGQL from '../../queries/thread/delete.graphql';
import executionIdsForThreadGQL from '../../queries/execution/executionids-for-thread.graphql';
import subscribeExecutionsListGQL from '../../queries/execution/list-subscription.graphql';
import listExecutionsListGQL from '../../queries/execution/list.graphql';

import { fromTimeStamp } from 'util/date-utils';
import { problemStatementFromGQL, taskFromGQL, threadFromGQL, threadInfoFromGQL, taskToGQL, threadToGQL, problemStatementToGQL, executionFromGQL, taskUpdateToGQL, threadUpdateToGQL, problemStatementUpdateToGQL } from './graphql_adapter';
import { postJSONResource } from 'util/mint-requests';
import { isObject } from 'util';
import { Md5 } from 'ts-md5';

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

export interface ProblemStatementsActionList extends Action<'PROBLEM_STATEMENTS_LIST'> { list: ProblemStatementList };
export interface ProblemStatementsActionListSubscription extends Action<'PROBLEM_STATEMENTS_LIST_SUBSCRIPTION'> { unsubscribe: Function };
export interface ProblemStatementsActionAdd extends Action<'PROBLEM_STATEMENTS_ADD'> { item: ProblemStatement };
export interface ProblemStatementsActionRemove extends Action<'PROBLEM_STATEMENTS_REMOVE'> { id: string };
export interface ProblemStatementsActionUpdate extends Action<'PROBLEM_STATEMENTS_UPDATE'> { item: ProblemStatement };

export interface ProblemStatementsActionDetails extends Action<'PROBLEM_STATEMENT_DETAILS'> { details: ProblemStatementDetails };
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
    modelid: string
    loading: boolean
    executions: Execution[] 
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
    ThreadExecutionsActionList | ThreadsActionListSubscription;

export type ModelingAction =  ProblemStatementsAction | TasksAction | ThreadsAction | ThreadAction ;

// List ProblemStatements
type ProblemListThunkResult = ThunkAction<void, RootState, undefined, ProblemStatementsActionList | ProblemStatementsActionListSubscription>;
export const subscribeProblemStatementsList: ActionCreator<ProblemListThunkResult> = (regionid: string) => (dispatch) => {

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
            let problem_statements:IdMap<ProblemStatement> = {};
            let problem_statement_ids:string[] = [];
            let problems = result.data.problem_statement;
            //console.log(problems);
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
        unsubscribe: subscription.unsubscribe
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
        unsubscribe: subscription.unsubscribe
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
        unsubscribe: subscription.unsubscribe
    });
};
*/

// Get ProblemStatement details
type ProblemDetailsThunkResult = ThunkAction<void, RootState, undefined, ProblemStatementsActionDetails | ProblemStatementsActionSubscription>;
export const subscribeProblemStatement: ActionCreator<ProblemDetailsThunkResult> = (problem_statement_id: string) => (dispatch) => {
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
                console.log("Changes to the problem statement");
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
        unsubscribe: subscription.unsubscribe
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
        unsubscribe: subscription.unsubscribe
    });
};
*/

// Get Thread details
type ThreadDetailsThunkResult = ThunkAction<void, RootState, undefined, ThreadsActionDetails | ThreadsActionSubscription>;
export const subscribeThread: ActionCreator<ThreadDetailsThunkResult> = (threadid: string) => (dispatch) => {
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
        unsubscribe: subscription.unsubscribe
    });
};

// List Thread Runs
type ListExecutionsThunkResult = ThunkAction<void, RootState, undefined, ThreadExecutionsActionList>;
export const listThreadExecutions: ActionCreator<ListExecutionsThunkResult> = 
        (thread_id: string, modelid: string, executionids: string[]) => (dispatch) => {
    if(executionids && executionids.length > 0) {
        dispatch({
            type: THREAD_EXECUTIONS_LIST,
            thread_id: thread_id,
            modelid: modelid,
            executions: null,
            loading: true
        });

        listExecutions(executionids).then((executions) => {
            dispatch({
                type: THREAD_EXECUTIONS_LIST,
                thread_id: thread_id,
                modelid: modelid,
                loading: false,
                executions
            })
        });
    }
};

export const setThreadExecutionIds = (thread_id: string, modelid, ensembleids: string[]) : Promise<void> => {
    // TODO
    return null;
}

export const deleteAllThreadExecutionIds = async (thread_id: string, modelid: string) => {
    // TODO
}

export const getAllThreadExecutionIds = async (thread_id: string, modelid: string) : Promise<string[]> => {
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
export const addProblemStatement = (problem_statement:ProblemStatement) =>  {
    let problemobj = problemStatementToGQL(problem_statement);
    //console.log(problemobj);
    return APOLLO_CLIENT.mutate({
        mutation: newProblemStatementGQL,
        variables: {
            object: problemobj
        }
    });
};

// Add Task
export const addTask = (problem_statement: ProblemStatement, task: Task) =>  {
    let taskobj = taskToGQL(task, problem_statement);
    return APOLLO_CLIENT.mutate({
        mutation: newTaskGQL,
        variables: {
            object: taskobj
        }
    });
};

// Add Task
export const addTaskWithThread = (problem_statement: ProblemStatement, task: Task, thread: Thread) =>  {
    let taskobj = taskToGQL(task, problem_statement);
    let threadobj = threadToGQL(thread, task);
    taskobj["threads"] = {
        data: [threadobj]
    }
    return APOLLO_CLIENT.mutate({
        mutation: newTaskGQL,
        variables: {
            object: taskobj
        }
    });
};

// Add Thread
export const addThread = (task:Task, thread:Thread) =>  {
    let threadobj = threadToGQL(thread, task);
    //console.log(threadobj);
    return APOLLO_CLIENT.mutate({
        mutation: newThreadGQL,
        variables: {
            object: threadobj
        }
    });
};


// Update ProblemStatement
export const updateProblemStatement = (problem_statement: ProblemStatement) =>  {
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
    let taskobj = taskUpdateToGQL(task);
    return APOLLO_CLIENT.mutate({
        mutation: updateTaskGQL,
        variables: {
            id: task.id,
            object: taskobj
        }
    });
};

// Update Thread
export const updateThread = (thread:Thread) =>  {
    let threadobj = threadUpdateToGQL(thread);
    return APOLLO_CLIENT.mutate({
        mutation: updateThreadGQL,
        variables: {
            id: thread.id,
            object: threadobj
        }
    });
};

export const updateThreadVariables = (problem_statement_id: string, thread_id: string, 
        driving_variables: string[], response_variables: string[]) =>  {
    /*
    let pathwayRef = db.collection("problem_statements/"+problem_statement_id+"/pathways").doc(thread_id);
    return pathwayRef.set({
        driving_variables: driving_variables,
        response_variables: response_variables
    }, {merge: true});
    */
};

export const updateThreadFromThreadInformation = (problem_statement_id: string, thread_id: string, pathwayinfo: ThreadInfo) => {
    /*
    let pathwayRef = db.collection("problem_statements/"+problem_statement_id+"/pathways").doc(pathwayinfo.id);
    return pathwayRef.set(pathwayinfo, {merge: true});
    */
}

// Add Executions
export const addThreadExecutions = (executions: Execution[]) => {
    /*
    let ensemblesRef = db.collection("ensembles");
    // Read all docs (to check if they exist or not)
    let readpromises = [];
    ensembles.map((ensemble) => {
        readpromises.push(ensemblesRef.doc(ensemble.id).get());
    });
    let batch = db.batch();
    let i = 0;
    return Promise.all(readpromises).then((docs) => {
        docs.map((curdoc: firebase.firestore.DocumentSnapshot) => {
            // If doc doesn't exist, write ensemble
            let ensemble = ensembles[i++];
            //if(!curdoc.exists)
            batch.set(curdoc.ref, ensemble);
        })
        return batch.commit();
    })*/
}

// Update Thread Executions
export const updateThreadExecutions = (executions: Execution[]) => {
    /*
    let ensemblesRef = db.collection("ensembles");
    let batch = db.batch();
    let i = 0;
    ensembles.map((ensemble) => {
        batch.update(ensemblesRef.doc(ensemble.id), ensemble);
    })
    return batch.commit();*/
}

// Delete ProblemStatement
export const deleteProblemStatement = (problem_statement_id: string) =>  {
    return APOLLO_CLIENT.mutate({
        mutation: deleteProblemStatementGQL,
        variables: {
            id: problem_statement_id
        }
    });
};

// Delete Task
export const deleteTask = (taskid: string) =>  {
    return APOLLO_CLIENT.mutate({
        mutation: deleteTaskGQL,
        variables: {
            id: taskid
        }
    });
};

// Delete Thread
export const deleteThread = (threadid: string) =>  {
    return APOLLO_CLIENT.mutate({
        mutation: deleteThreadGQL,
        variables: {
            id: threadid
        }
    });
};

/* Helper Function */

const _deleteCollection = (collRef: firebase.firestore.CollectionReference, subCollectionName: string) => {
    collRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            // Do a recursive delete if doc has a subcollection
            if(subCollectionName) {
                let subCollRef = doc.ref.collection(subCollectionName);
                _deleteCollection(subCollRef, null);
            }
            // Delete document inside the collection
            doc.ref.delete();
        });
    });
}

/* Execution Functions */

// List Executions
export const listExecutions = (executionids: string[]) : Promise<Execution[]> => {
    return APOLLO_CLIENT.query({
        query: listExecutionsListGQL,
        variables: {
            ids: executionids
        }
    }).then((result) => {
        if(result.errors && result.errors.length > 0) {
            console.log("ERROR");
            console.log(result);
        }
        else {
            return result.data.execution.map((ex:any) => executionFromGQL(ex));
        }
        return null;        
    });
};

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

export const sendDataForIngestion = (problem_statement_id: string, task_id: string, threadid: string, prefs: UserPreferences) => {
    let data = {
        problem_statement_id: problem_statement_id,
        task_id: task_id,
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
    if((oldthread == null || newthread == null) && oldthread != newthread)
        return true;

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


export const threadSummaryChanged = (oldthread: Thread, newthread: Thread) => {
    if((oldthread == null || newthread == null) && oldthread != newthread)
        return true;
    let oldsummary = _stringify_ensemble_summary(oldthread.execution_summary);
    let newsummary = _stringify_ensemble_summary(newthread.execution_summary);
    return oldsummary != newsummary;
}

const _stringify_ensemble_summary = (obj: Object) => {
    if(!obj) {
        return "";
    }
    let keys = Object.keys(obj);
    keys = keys.sort();
    let str = "";
    keys.map((key) => {
        if(key.match(/ingested_runs/) 
            || key.match(/fetched_run_outputs/) 
            || key.match(/submitted_for_ingestion/)) {
            return;
        }
        let binding = isObject(obj[key]) ? _stringify_ensemble_summary(obj[key]) : obj[key];
        str += key + "=" + binding + "&";
    })
    return str;
}