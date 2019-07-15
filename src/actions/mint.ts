import { Action, ActionCreator } from 'redux';
import { ScenarioList, Scenario, ScenarioDetails, 
    Goal, IdMap, Pathway, Region, RegionList, SubGoal, ExecutableEnsemble } from '../reducers/mint';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store';
import { db, fieldValue } from '../config/firebase';
import { Dataset } from '../reducers/datasets';
import { Model } from '../reducers/models';
import { EXAMPLE_SCENARIOS_LIST_DATA, EXAMPLE_REGION_DATA, EXAMPLE_SCENARIO_DETAILS } from '../offline_data/sample_scenarios';

const OFFLINE_DEMO_MODE = false;

export const REGIONS_LIST = 'REGIONS_LIST';

export const SCENARIOS_LIST = 'SCENARIOS_LIST';
export const SCENARIOS_ADD = 'SCENARIOS_ADD';
export const SCENARIOS_REMOVE = 'SCENARIOS_REMOVE';
export const SCENARIOS_UPDATE = 'SCENARIOS_REMOVE';
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

export const PATHWAYS_LIST = 'PATHWAYS_LIST';
export const PATHWAYS_ADD = 'PATHWAYS_ADD';
export const PATHWAYS_REMOVE = 'PATHWAYS_REMOVE';
export const PATHWAYS_UPDATE = 'PATHWAYS_UPDATE';

export const PATHWAY_VARIABLES_ADD = 'PATHWAY_VARIABLES_ADD';
export const PATHWAY_VARIABLES_REMOVE = 'PATHWAY_VARIABLES_REMOVE';

export const PATHWAY_MODELS_ADD = 'PATHWAY_MODELS_ADD';
export const PATHWAY_MODELS_REMOVE = 'PATHWAY_MODELS_REMOVE';

export const PATHWAY_DATASETS_ADD = 'PATHWAY_DATASETS_ADD';
export const PATHWAY_DATASETS_REMOVE = 'PATHWAY_DATASETS_REMOVE';

export const PATHWAY_ENSEMBLES_ADD = 'PATHWAY_ENSEMBLES_ADD';
export const PATHWAY_ENSEMBLES_REMOVE = 'PATHWAY_ENSEMBLES_REMOVE';
export const PATHWAY_ENSEMBLES_RUN = 'PATHWAY_ENSEMBLES_RUN';

export interface RegionsActionList extends Action<'REGIONS_LIST'> { list: RegionList };

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

export type PathwaysAction = PathwaysActionList | PathwaysActionAdd | PathwaysActionRemove | PathwaysActionUpdate;

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
    PathwayEnsemblesActionAdd | PathwayEnsemblesActionRemove | PathwayEnsemblesActionRun;

export type MintAction = RegionsActionList | ScenariosAction | GoalsAction  | PathwaysAction | PathwayAction ;

// List Regions
type ListRegionsThunkResult = ThunkAction<void, RootState, undefined, RegionsActionList>;
export const listRegions: ActionCreator<ListRegionsThunkResult> = () => (dispatch) => {
    // Here you would normally get the data from the server. We're simulating
    // that by dispatching an async action (that you would dispatch when you
    // succesfully got the data back)
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: REGIONS_LIST,
            list: EXAMPLE_REGION_DATA
        });
        return;
    }

    db.collection("regions").get().then((querySnapshot) => {
        let regions:RegionList = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data as Region;
        });
        dispatch({
            type: REGIONS_LIST,
            list: regions
        });
    });
};

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
            var details = doc.data() as ScenarioDetails;
            if(!details)
                return;
            details.id = doc.id;
            details.goals = {};
            details.subgoals = {};
            details.pathways = {};
            Promise.all([
                db.collection("scenarios/"+scenarioid+"/goals").get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        var data = doc.data();
                        data.id = doc.id;
                        details.goals[doc.id] = data as Goal;
                    });
                }),
                db.collection("scenarios/"+scenarioid+"/subgoals").get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        var data = doc.data();
                        data.id = doc.id;
                        details.subgoals[doc.id] = data as SubGoal;
                    });
                }),
                db.collection("scenarios/"+scenarioid+"/pathways").get().then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        var data = doc.data();
                        data.id = doc.id;
                        details.pathways[doc.id] = data as Pathway;
                    });
                })
            ]).then( () => {
                console.log("Scenario " + scenarioid + " changed. Dispatching action");
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
    Promise.all([
        db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoalid).update({
            pathwayids: fieldValue.arrayUnion(pathwayRef.id)
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
    subgoal.pathwayids = [pathwayRef.id];

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
    subgoal.pathwayids = [pathwayRef.id];

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
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc(pathway.id);
    console.log(scenario.id + " ---- update pathway: " + pathway.id);
    pathwayRef.set(pathway).then(() => updateScenario(scenario));
};

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
export const deletePathway = (scenario:Scenario, subgoalid: string, pathwayid:string) =>  {
    let pathwayRef = db.collection("scenarios/"+scenario.id+"/pathways").doc(pathwayid);
    pathwayRef.delete();
    db.collection("scenarios/"+scenario.id+"/subgoals").doc(subgoalid).update({
        pathwayids: fieldValue.arrayRemove(pathwayid)
    }).then(() => updateScenario(scenario));
};

/* Helper Function */

const _deleteCollection = (collRef: firebase.firestore.CollectionReference) => {
    collRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
    });    
}