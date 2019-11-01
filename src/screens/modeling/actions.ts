import { Action, ActionCreator } from 'redux';
import { ScenarioList, Scenario, ScenarioDetails, 
    Goal, Pathway, SubGoal, ExecutableEnsemble, PathwayInfo } from './reducers';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../../app/store';
import { db, fieldValue } from '../../config/firebase';
import { Dataset } from '../datasets/reducers';
import { Model } from '../models/reducers';
import { EXAMPLE_SCENARIOS_LIST_DATA, EXAMPLE_SCENARIO_DETAILS } from '../../offline_data/sample_scenarios';
import { IdMap } from '../../app/reducers';
import { OFFLINE_DEMO_MODE } from '../../app/actions';
import { listEnsembles } from 'util/state_functions';

export const SCENARIOS_LIST = 'SCENARIOS_LIST';
export const SCENARIOS_ADD = 'SCENARIOS_ADD';
export const SCENARIOS_REMOVE = 'SCENARIOS_REMOVE';
export const SCENARIOS_UPDATE = 'SCENARIOS_UPDATE';
export const SCENARIO_DETAILS = 'SCENARIO_DETAILS';
export const SCENARIO_SUBSCRIPTION = 'SCENARIO_SUBSCRIPTION';

export const GOALS_LIST = 'GOALS_LIST';
export const GOALS_ADD = 'GOALS_ADD';
export const GOALS_REMOVE = 'GOALS_REMOVE';
export const GOALS_UPDATE = 'GOALS_UPDATE';

export const SUBGOALS_LIST = 'SUBGOALS_LIST';
export const SUBGOALS_ADD = 'SUBGOALS_ADD';
export const SUBGOALS_REMOVE = 'SUBGOALS_REMOVE';
export const SUBGOALS_UPDATE = 'SUBGOALS_UPDATE';

export const PATHWAY_DETAILS = 'PATHWAY_DETAILS';
export const PATHWAY_SUBSCRIPTION = 'PATHWAY_SUBSCRIPTION';
export const PATHWAYS_ADD = 'PATHWAYS_ADD';
export const PATHWAYS_REMOVE = 'PATHWAYS_REMOVE';
export const PATHWAYS_UPDATE = 'PATHWAYS_UPDATE';

export const PATHWAY_VARIABLES_ADD = 'PATHWAY_VARIABLES_ADD';
export const PATHWAY_VARIABLES_REMOVE = 'PATHWAY_VARIABLES_REMOVE';

export const PATHWAY_MODELS_ADD = 'PATHWAY_MODELS_ADD';
export const PATHWAY_MODELS_REMOVE = 'PATHWAY_MODELS_REMOVE';

export const PATHWAY_DATASETS_ADD = 'PATHWAY_DATASETS_ADD';
export const PATHWAY_DATASETS_REMOVE = 'PATHWAY_DATASETS_REMOVE';

export const PATHWAY_ENSEMBLES_LIST = 'PATHWAY_ENSEMBLES_LIST';
export const PATHWAY_ENSEMBLES_ADD = 'PATHWAY_ENSEMBLES_ADD';
export const PATHWAY_ENSEMBLES_REMOVE = 'PATHWAY_ENSEMBLES_REMOVE';
export const PATHWAY_ENSEMBLES_RUN = 'PATHWAY_ENSEMBLES_RUN';

export interface ScenariosActionList extends Action<'SCENARIOS_LIST'> { list: ScenarioList };
export interface ScenariosActionAdd extends Action<'SCENARIOS_ADD'> { item: Scenario };
export interface ScenariosActionRemove extends Action<'SCENARIOS_REMOVE'> { id: string };
export interface ScenariosActionUpdate extends Action<'SCENARIOS_UPDATE'> { item: Scenario };

export interface ScenariosActionDetails extends Action<'SCENARIO_DETAILS'> { details: ScenarioDetails };
export interface ScenariosActionSubscription extends Action<'SCENARIO_SUBSCRIPTION'> { unsubscribe: Function };

export type ScenariosAction = ScenariosActionList | ScenariosActionAdd | ScenariosActionRemove |
    ScenariosActionUpdate | ScenariosActionDetails | ScenariosActionSubscription;

export interface GoalsActionList extends Action<'GOALS_LIST'> { scenarioid: string };
export interface GoalsActionAdd extends Action<'GOALS_ADD'> { item: Goal, scenarioid: string };
export interface GoalsActionRemove extends Action<'GOALS_REMOVE'> { id: string, scenarioid: string };
export interface GoalsActionUpdate extends Action<'GOALS_UPDATE'> { item: Goal, scenarioid: string };

export type GoalsAction = GoalsActionList | GoalsActionAdd | GoalsActionRemove | GoalsActionUpdate;

export interface SubGoalsActionList extends Action<'SUBGOALS_LIST'> { scenarioid: string };
export interface SubGoalsActionAdd extends Action<'SUBGOALS_ADD'> { item: SubGoal, goalid: string, scenarioid: string };
export interface SubGoalsActionRemove extends Action<'SUBGOALS_REMOVE'> { id: string, scenarioid: string };
export interface SubGoalsActionUpdate extends Action<'SUBGOALS_UPDATE'> { item: SubGoal, scenarioid: string };

export type SubGoalsAction = SubGoalsActionList | SubGoalsActionAdd | SubGoalsActionRemove | SubGoalsActionUpdate;

export interface PathwaysActionList extends Action<'PATHWAYS_LIST'> { scenarioid: string };
export interface PathwaysActionAdd extends Action<'PATHWAYS_ADD'> { item: Pathway, subgoalid: string, scenarioid: string };
export interface PathwaysActionRemove extends Action<'PATHWAYS_REMOVE'> { id: string, scenarioid: string };
export interface PathwaysActionUpdate extends Action<'PATHWAYS_UPDATE'> { item: Pathway, scenarioid: string };
export interface PathwaysActionDetails extends Action<'PATHWAY_DETAILS'> { details: Pathway };
export interface PathwaysActionSubscription extends Action<'PATHWAY_SUBSCRIPTION'> { unsubscribe: Function };

export type PathwaysAction = PathwaysActionList | PathwaysActionAdd | PathwaysActionRemove 
    | PathwaysActionUpdate | PathwaysActionDetails | PathwaysActionSubscription;

export interface PathwayVariablesActionAdd extends Action<'PATHWAY_VARIABLES_ADD'> { 
    item: string, pathwayid: string, scenarioid: string 
};
export interface PathwayVariablesActionRemove extends Action<'PATHWAY_VARIABLES_REMOVE'> { 
    id: string, pathwayid: string, scenarioid: string 
};

export interface PathwayModelsActionAdd extends Action<'PATHWAY_MODELS_ADD'> { 
    item: Model, pathwayid: string, sceanarioid: string
};
export interface PathwayModelsActionRemove extends Action<'PATHWAY_MODELS_REMOVE'> { 
    id: string, pathwayid: string, sceanarioid: string
};

export interface PathwayDatasetsActionAdd extends Action<'PATHWAY_DATASETS_ADD'> { 
    item: Dataset, pathwayid: string, sceanarioid: string
};
export interface PathwayDatasetsActionRemove extends Action<'PATHWAY_DATASETS_REMOVE'> { 
    id: string, pathwayid: string, sceanarioid: string
};

export interface PathwayEnsemblesActionList extends Action<'PATHWAY_ENSEMBLES_LIST'> { 
    pathwayid: string
    modelid: string
    loading: boolean
    ensembles: ExecutableEnsemble[] 
};
export interface PathwayEnsemblesActionAdd extends Action<'PATHWAY_ENSEMBLES_ADD'> { 
    item: ExecutableEnsemble, pathwayid: string, sceanarioid: string
};
export interface PathwayEnsemblesActionRemove extends Action<'PATHWAY_ENSEMBLES_REMOVE'> { 
    id: string, pathwayid: string, sceanarioid: string
};
export interface PathwayEnsemblesActionRun extends Action<'PATHWAY_ENSEMBLES_RUN'> { 
    id: string, pathwayid: string, sceanarioid: string
};

export type PathwayAction = PathwayVariablesActionAdd | PathwayVariablesActionRemove |
    PathwayModelsActionAdd | PathwayModelsActionRemove | 
    PathwayDatasetsActionAdd | PathwayDatasetsActionRemove |
    PathwayEnsemblesActionAdd | PathwayEnsemblesActionRemove | PathwayEnsemblesActionRun | 
    PathwayEnsemblesActionList;

export type ModelingAction =  ScenariosAction | GoalsAction  | PathwaysAction | PathwayAction ;

// List Scenarios
type ListThunkResult = ThunkAction<void, RootState, undefined, ScenariosActionList>;
export const listScenarios: ActionCreator<ListThunkResult> = () => (dispatch) => {

    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: SCENARIOS_LIST,
            list: EXAMPLE_SCENARIOS_LIST_DATA
        });
        return;
    }

    db.collection("scenarios").onSnapshot((querySnapshot) => {
        let scenarios:IdMap<Scenario> = {};
        let scenarioids:string[] = [];
        querySnapshot.forEach((sdoc) => {
            var data = sdoc.data();
            data.id = sdoc.id;
            scenarios[sdoc.id] = data as Scenario;
            scenarioids.push(sdoc.id);
        });

        let list = {
            scenarioids: scenarioids,
            scenarios: scenarios
        } as ScenarioList;
        //console.log(list);

        dispatch({
            type: SCENARIOS_LIST,
            list
        })
    });
};

// Get Scenario details
type DetailsThunkResult = ThunkAction<void, RootState, undefined, ScenariosActionDetails | ScenariosActionSubscription>;
export const getScenarioDetail: ActionCreator<DetailsThunkResult> = (scenarioid: string) => (dispatch) => {

    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: SCENARIO_SUBSCRIPTION,
            unsubscribe: ()=>{}
        });
        EXAMPLE_SCENARIO_DETAILS["id"] = scenarioid;    
        dispatch({
            type: SCENARIO_DETAILS,
            details: EXAMPLE_SCENARIO_DETAILS
        });
        return;
    }

    let unsubscribe = db.collection("scenarios").doc(scenarioid).onSnapshot({
        complete: () => {},
        error: (error) => {
            // FIXME: Check error code (if permissions error, then unsubscribe)
            console.log(error.code);
            unsubscribe();
        },
        next: (doc) => {
            var details = Object.assign({}, doc.data()) as ScenarioDetails;
            if(!details)
                return;
            details.id = doc.id;
            Promise.all([
                db.collection("scenarios/"+scenarioid+"/goals").get(),
                db.collection("scenarios/"+scenarioid+"/subgoals").get(),
            ]).then( (values) => {
                details.goals = {};
                details.subgoals = {};
                values[0].forEach((doc) => {
                    var data = Object.assign({}, doc.data());
                    data.id = doc.id;
                    details.goals[doc.id] = data as Goal;
                });
                values[1].forEach((doc) => {
                    var data = Object.assign({}, doc.data());
                    data.id = doc.id;
                    details.subgoals[doc.id] = data as SubGoal;
                });
                // Dispach scenario details on an edit
                dispatch({
                    type: SCENARIO_DETAILS,
                    details
                });
            });
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: SCENARIO_SUBSCRIPTION,
        unsubscribe: unsubscribe
    });
};


// Get Pathway details
type PathwayDetailsThunkResult = ThunkAction<void, RootState, undefined, PathwaysActionDetails | PathwaysActionSubscription>;
export const getPathway: ActionCreator<PathwayDetailsThunkResult> = (scenarioid: string, pathwayid: string) => (dispatch) => {
    let unsubscribe = db.collection("scenarios/"+scenarioid+"/pathways").doc(pathwayid).onSnapshot({
        complete: () => {},
        error: (error) => {
            // FIXME: Check error code (if permissions error, then unsubscribe)
            console.log(error.code);
            unsubscribe();
        },
        next: (doc) => {
            if(!doc.exists) {
                unsubscribe();
                dispatch({
                    type: PATHWAY_DETAILS,
                    details: null
                });
                return;
            }
            var details = Object.assign({}, doc.data()) as Pathway;
            if(!details)
                return;
            details.id = doc.id;
            // TODO: Move datasets and ensembles to separate collections
            // datasets/<dsid> => contains details about resources and metadata
            // ensembles<ensid> => contains details about the ensemble: bindings and run details

            // Dispach pathway details
            dispatch({
                type: PATHWAY_DETAILS,
                details
            });
        }
    });

    // Dispatch unsubscribe function
    dispatch({
        type: PATHWAY_SUBSCRIPTION,
        unsubscribe: unsubscribe
    });
};

// List Pathway Runs
type ListEnsemblesThunkResult = ThunkAction<void, RootState, undefined, PathwayEnsemblesActionList>;
export const fetchPathwayEnsembles: ActionCreator<ListEnsemblesThunkResult> = 
        (pathwayid: string, modelid: string, ensembleids: string[]) => (dispatch) => {

    
    dispatch({
        type: PATHWAY_ENSEMBLES_LIST,
        pathwayid: pathwayid,
        modelid: modelid,
        ensembles: null,
        loading: true
    });

    listEnsembles(ensembleids).then((ensembles) => {
        dispatch({
            type: PATHWAY_ENSEMBLES_LIST,
            pathwayid: pathwayid,
            modelid: modelid,
            loading: false,
            ensembles
        })
    });
};

export const setPathwayEnsembleIds = (scenarioid: string, pathwayid: string, 
        modelid, batchid: number, ensembleids: string[]) : Promise<void> => {
    let pathwayEnsembleIdsRef = db.collection("scenarios").doc(scenarioid).collection("pathways").doc(pathwayid).collection("ensembleids");
    let docid = modelid.replace(/.+\//, '') + "_" + batchid;
    let data = {
        modelid: modelid,
        ensemble_ids: ensembleids
    }
    return pathwayEnsembleIdsRef.doc(docid).set(data);
}

export const deleteAllPathwayEnsembleIds = async (scenarioid: string, pathwayid: string, modelid: string) => {
    let pathwayEnsembleIdsRef = db.collection("scenarios").doc(scenarioid).collection("pathways").doc(pathwayid).collection("ensembleids");
    let queryRef = null;
    if(modelid) {
        queryRef = pathwayEnsembleIdsRef.where("modelid", "==", modelid);
    }
    else {
        queryRef = pathwayEnsembleIdsRef;
    }
    queryRef.get().then((snapshot) => {
        snapshot.forEach((doc) => {
            doc.ref.delete();
        })
    })
}

export const getAllPathwayEnsembleIds = async (scenarioid: string, pathwayid: string,
        modelid: string) : Promise<string[]> => {
    let pathwayEnsembleIdsRef = db.collection("scenarios").doc(scenarioid).collection("pathways").doc(pathwayid).collection("ensembleids")
        .where("modelid", "==", modelid);

    return pathwayEnsembleIdsRef.get().then((snapshot) => {
        let ensembleids = [];
        snapshot.forEach((doc) => {
            ensembleids = ensembleids.concat(doc.data().ensemble_ids);
        })
        return ensembleids;
    });
}

// Add Scenario
export const addScenario = (scenario:Scenario) =>  {
    let scenarioRef = db.collection("scenarios").doc();
    scenarioRef.set(scenario);
    return scenarioRef.id;
};

// Add Goal
export const addGoal = (scenario:Scenario, goal:Goal) =>  {
    let goalRef = db.collection("scenarios/"+scenario.id+"/goals").doc();
    goalRef.set(goal).then(() => updateScenario(scenario));
    return goalRef.id;
};

// Add SubGoal
export const addSubGoal = (scenario:Scenario, goalid:string, subgoal: SubGoal) =>  {
    let subgoalRef = db.collection("scenarios/"+scenario.id+"/subgoals").doc();
    Promise.all([
        db.collection("scenarios/"+scenario.id+"/goals").doc(goalid).update({
            subgoalids: fieldValue.arrayUnion(subgoalRef.id)
        }),
        subgoalRef.set(subgoal)
    ])
    .then(() => updateScenario(scenario));

    return subgoalRef.id;
};

// Add Pathway
export const addPathway = (scenario:Scenario, subgoalid: string, pathway:Pathway) =>  {
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc();
    let pathwayinfo = {
        id: pathwayRef.id,
        name: pathway.name,
        dates: pathway.dates
    };
    Promise.all([
        db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoalid).update({
            [`pathways.${pathwayinfo.id}`]: pathwayinfo
        }),
        pathwayRef.set(pathway)
    ])
    .then(() => updateScenario(scenario));

    return pathwayRef.id;
};

// Add Goal along with Subgoal and a pathway with a response & driving variable
export const addGoalFull = (scenario:Scenario, goal: Goal, subgoal: SubGoal, pathway: Pathway) => {
    let goalRef = db.collection("scenarios/"+scenario.id+"/goals").doc();
    let subgoalRef = db.collection("scenarios/"+scenario.id+"/subgoals").doc();
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc();
    goal.subgoalids = [subgoalRef.id];
    subgoal.pathways[pathwayRef.id] = {
        id: pathwayRef.id,
        name: pathway.name ? pathway.name : subgoal.name
    };

    Promise.all([
        pathwayRef.set(pathway),
        subgoalRef.set(subgoal),
        goalRef.set(goal)
    ])
    .then(() => updateScenario(scenario));
    
    return goalRef.id;
}

// Add Subgoal and a pathway with a response & driving variable, to an existing Goal
export const addSubGoalFull = (scenario:Scenario, goalid: string, subgoal: SubGoal, pathway: Pathway) => {
    let subgoalRef = db.collection("scenarios/"+scenario.id+"/subgoals").doc();
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc();
    subgoal.pathways[pathwayRef.id] = {
        id: pathwayRef.id,
        name: pathway.name ? pathway.name : subgoal.name
    };

    Promise.all([
        db.collection("scenarios/"+scenario.id+"/goals").doc(goalid).update({
            subgoalids: fieldValue.arrayUnion(subgoalRef.id)
        }),
        pathwayRef.set(pathway),
        subgoalRef.set(subgoal)
    ])
    .then(() => updateScenario(scenario));

    return subgoalRef.id;
}

// Update Scenario
export const updateScenario = (scenario: Scenario) =>  {
    let scenarioRef = db.collection("scenarios").doc(scenario.id);
    scenario.last_update = Date.now().toString();
    if(!scenario.subregionid)
        scenario.subregionid = null;
    scenarioRef.set(scenario);
};

// Update Goal
export const updateGoal = (scenario: Scenario, goal: Goal) =>  {
    let goalRef = db.collection("scenarios/"+scenario.id+"/goals").doc(goal.id);
    goalRef.set(goal).then(() => updateScenario(scenario));
};

// Update Sub Goal
export const updateSubGoal = (scenario: Scenario, subgoal: SubGoal) =>  {
    let goalRef = db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoal.id);
    goalRef.set(subgoal).then(() => updateScenario(scenario));
};

// Update Pathway
export const updatePathway = (scenario: Scenario, pathway: Pathway) =>  {
    let npathway = Object.assign({}, pathway);
    delete npathway.unsubscribe;
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc(pathway.id);
    console.log(scenario.id + " ---- update pathway: " + pathway.id);
    //console.log(pathway);
    return pathwayRef.set(npathway); //.then(() => updateScenario(scenario));
};

// Add Ensembles
export const addPathwayEnsembles = (ensembles: ExecutableEnsemble[]) => {
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
            if(!curdoc.exists)
                batch.set(curdoc.ref, ensemble);
        })
        return batch.commit();
    })
}

// Update Pathway Ensembles
export const updatePathwayEnsembles = (ensembles: ExecutableEnsemble[]) => {
    let ensemblesRef = db.collection("ensembles");
    let batch = db.batch();
    let i = 0;
    ensembles.map((ensemble) => {
        batch.update(ensemblesRef.doc(ensemble.id), ensemble);
    })
    return batch.commit();
}

// Delete Scenario
export const deleteScenario = (scenario:Scenario) =>  {
    let scenarioRef = db.collection("scenarios").doc(scenario.id);
    _deleteCollection(scenarioRef.collection("goals"));
    _deleteCollection(scenarioRef.collection("subgoals"));
    _deleteCollection(scenarioRef.collection("pathways"));
    return scenarioRef.delete();
};

// Delete Goal
export const deleteGoal = (scenario:Scenario, goalid: string) =>  {
    let goalRef = db.collection("scenarios/"+scenario.id+"/goals").doc(goalid);
    goalRef.delete().then(() => updateScenario(scenario));
};

// Delete SubGoal
export const deleteSubGoal = (scenario:Scenario, goalid:string, subgoalid: string) =>  {
    let subgoalRef = db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoalid);
    subgoalRef.delete();
    db.collection("scenarios/"+scenario.id+"/goals").doc(goalid).update({
        subgoalids: fieldValue.arrayRemove(subgoalid)
    }).then(() => updateScenario(scenario));
};

// Delete Pathway
export const deletePathway = (scenario:Scenario, subgoalid: string, pathway:PathwayInfo) =>  {
    deleteAllPathwayEnsembleIds(scenario.id, pathway.id, null);
    
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc(pathway.id);
    pathwayRef.delete()
    db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoalid).update({
        [`pathways.${pathway.id}`]: fieldValue.delete()
    }).then(() => updateScenario(scenario));;
};

/* Helper Function */

const _deleteCollection = (collRef: firebase.firestore.CollectionReference) => {
    collRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
    });    
}