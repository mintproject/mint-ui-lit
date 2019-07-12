import { db, fieldValue } from '../config/firebase';
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
export const listRegions = () => (dispatch) => {
    // Here you would normally get the data from the server. We're simulating
    // that by dispatching an async action (that you would dispatch when you
    // succesfully got the data back)
    db.collection("regions").get().then((querySnapshot) => {
        let regions = {};
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            data.id = doc.id;
            regions[doc.id] = data;
        });
        dispatch({
            type: REGIONS_LIST,
            list: regions
        });
    });
};
export const listScenarios = () => (dispatch) => {
    db.collection("scenarios").onSnapshot((querySnapshot) => {
        let scenarios = {};
        let scenarioids = [];
        querySnapshot.forEach((sdoc) => {
            var data = sdoc.data();
            data.id = sdoc.id;
            scenarios[sdoc.id] = data;
            scenarioids.push(sdoc.id);
        });
        let list = {
            scenarioids: scenarioids,
            scenarios: scenarios
        };
        //console.log(list);
        dispatch({
            type: SCENARIOS_LIST,
            list
        });
    });
};
export const getScenarioDetail = (scenarioid) => (dispatch) => {
    let unsubscribe = db.collection("scenarios").doc(scenarioid).onSnapshot((doc) => {
        var details = doc.data();
        if (!details)
            return;
        details.id = doc.id;
        details.goals = {};
        details.subgoals = {};
        details.pathways = {};
        Promise.all([
            db.collection("scenarios/" + scenarioid + "/goals").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    var data = doc.data();
                    data.id = doc.id;
                    details.goals[doc.id] = data;
                });
            }),
            db.collection("scenarios/" + scenarioid + "/subgoals").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    var data = doc.data();
                    data.id = doc.id;
                    details.subgoals[doc.id] = data;
                });
            }),
            db.collection("scenarios/" + scenarioid + "/pathways").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    var data = doc.data();
                    data.id = doc.id;
                    details.pathways[doc.id] = data;
                });
            })
        ]).then(() => {
            console.log("Scenario " + scenarioid + " changed. Dispatching action");
            // Dispach scenario details on an edit
            dispatch({
                type: SCENARIO_DETAILS,
                details
            });
        });
    });
    // Dispatch unsubscribe function
    dispatch({
        type: SCENARIO_SUBSCRIPTION,
        unsubscribe: unsubscribe
    });
};
// Add Scenario
export const addScenario = (scenario) => {
    let scenarioRef = db.collection("scenarios").doc();
    scenarioRef.set(scenario);
    return scenarioRef.id;
};
// Add Goal
export const addGoal = (scenario, goal) => {
    let goalRef = db.collection("scenarios/" + scenario.id + "/goals").doc();
    goalRef.set(goal).then(() => updateScenario(scenario));
    return goalRef.id;
};
// Add SubGoal
export const addSubGoal = (scenario, goalid, subgoal) => {
    let subgoalRef = db.collection("scenarios/" + scenario.id + "/subgoals").doc();
    Promise.all([
        db.collection("scenarios/" + scenario.id + "/goals").doc(goalid).update({
            subgoalids: fieldValue.arrayUnion(subgoalRef.id)
        }),
        subgoalRef.set(subgoal)
    ])
        .then(() => updateScenario(scenario));
    return subgoalRef.id;
};
// Add Pathway
export const addPathway = (scenario, subgoalid, pathway) => {
    let pathwayRef = db.collection("scenarios/" + scenario.id + "/pathways").doc();
    Promise.all([
        db.collection("scenarios/" + scenario.id + "/subgoals").doc(subgoalid).update({
            pathwayids: fieldValue.arrayUnion(pathwayRef.id)
        }),
        pathwayRef.set(pathway)
    ])
        .then(() => updateScenario(scenario));
    return pathwayRef.id;
};
// Add Goal along with Subgoal and a pathway with a response & driving variable
export const addGoalFull = (scenario, goal, subgoal, pathway) => {
    let goalRef = db.collection("scenarios/" + scenario.id + "/goals").doc();
    let subgoalRef = db.collection("scenarios/" + scenario.id + "/subgoals").doc();
    let pathwayRef = db.collection("scenarios/" + scenario.id + "/pathways").doc();
    goal.subgoalids = [subgoalRef.id];
    subgoal.pathwayids = [pathwayRef.id];
    Promise.all([
        pathwayRef.set(pathway),
        subgoalRef.set(subgoal),
        goalRef.set(goal)
    ])
        .then(() => updateScenario(scenario));
    return goalRef.id;
};
// Add Subgoal and a pathway with a response & driving variable, to an existing Goal
export const addSubGoalFull = (scenario, goalid, subgoal, pathway) => {
    let subgoalRef = db.collection("scenarios/" + scenario.id + "/subgoals").doc();
    let pathwayRef = db.collection("scenarios/" + scenario.id + "/pathways").doc();
    subgoal.pathwayids = [pathwayRef.id];
    Promise.all([
        db.collection("scenarios/" + scenario.id + "/goals").doc(goalid).update({
            subgoalids: fieldValue.arrayUnion(subgoalRef.id)
        }),
        pathwayRef.set(pathway),
        subgoalRef.set(subgoal)
    ])
        .then(() => updateScenario(scenario));
    return subgoalRef.id;
};
// Update Scenario
export const updateScenario = (scenario) => {
    let scenarioRef = db.collection("scenarios").doc(scenario.id);
    scenario.last_update = Date.now().toString();
    scenarioRef.set(scenario);
};
// Update Goal
export const updateGoal = (scenario, goal) => {
    let goalRef = db.collection("scenarios/" + scenario.id + "/goals").doc(goal.id);
    goalRef.set(goal).then(() => updateScenario(scenario));
};
// Update Sub Goal
export const updateSubGoal = (scenario, subgoal) => {
    let goalRef = db.collection("scenarios/" + scenario.id + "/subgoals").doc(subgoal.id);
    goalRef.set(subgoal).then(() => updateScenario(scenario));
};
// Update Pathway
export const updatePathway = (scenario, pathway) => {
    let pathwayRef = db.collection("scenarios/" + scenario.id + "/pathways").doc(pathway.id);
    console.log(scenario.id + " ---- update pathway: " + pathway.id);
    pathwayRef.set(pathway).then(() => updateScenario(scenario));
};
// Delete Scenario
export const deleteScenario = (scenario) => {
    let scenarioRef = db.collection("scenarios").doc(scenario.id);
    _deleteCollection(scenarioRef.collection("goals"));
    _deleteCollection(scenarioRef.collection("subgoals"));
    _deleteCollection(scenarioRef.collection("pathways"));
    return scenarioRef.delete();
};
// Delete Goal
export const deleteGoal = (scenario, goalid) => {
    let goalRef = db.collection("scenarios/" + scenario.id + "/goals").doc(goalid);
    goalRef.delete().then(() => updateScenario(scenario));
};
// Delete SubGoal
export const deleteSubGoal = (scenario, goalid, subgoalid) => {
    let subgoalRef = db.collection("scenarios/" + scenario.id + "/subgoals").doc(subgoalid);
    subgoalRef.delete();
    db.collection("scenarios/" + scenario.id + "/goals").doc(goalid).update({
        subgoalids: fieldValue.arrayRemove(subgoalid)
    }).then(() => updateScenario(scenario));
};
// Delete Pathway
export const deletePathway = (scenario, subgoalid, pathwayid) => {
    let pathwayRef = db.collection("scenarios/" + scenario.id + "/pathways").doc(pathwayid);
    pathwayRef.delete();
    db.collection("scenarios/" + scenario.id + "/subgoals").doc(subgoalid).update({
        pathwayids: fieldValue.arrayRemove(pathwayid)
    }).then(() => updateScenario(scenario));
};
/* Helper Function */
const _deleteCollection = (collRef) => {
    collRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
    });
};
