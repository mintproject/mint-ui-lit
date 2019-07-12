// UI ACTIONS
export const UI_SELECT_SCENARIO = 'UI_SELECT_SCENARIO';
export const UI_SELECT_SUBGOAL = 'UI_SELECT_SUBGOAL';
export const UI_SELECT_PATHWAY = 'UI_SELECT_PATHWAY';
export const UI_SELECT_PATHWAY_SECTION = 'UI_SELECT_PATHWAY_SECTION';
export const selectScenario = (scenarioid) => {
    //console.log("SelectScenario:" + scenarioid);
    return {
        type: UI_SELECT_SCENARIO,
        scenarioid: scenarioid
    };
};
export const selectSubgoal = (subgoalid) => {
    //console.log("selectSubgoal:" + subgoalid);
    return {
        type: UI_SELECT_SUBGOAL,
        subgoalid: subgoalid
    };
};
export const selectPathway = (pathwayid) => {
    console.log("selectPathway:" + pathwayid);
    return {
        type: UI_SELECT_PATHWAY,
        pathwayid: pathwayid
    };
};
export const selectPathwaySection = (section) => {
    //console.log("selectPathwaySection:" + section);
    return {
        type: UI_SELECT_PATHWAY_SECTION,
        section: section
    };
};
