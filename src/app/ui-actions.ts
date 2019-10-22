import { Action, ActionCreator } from "redux";

// UI ACTIONS
export const UI_SELECT_SCENARIO = 'UI_SELECT_SCENARIO';
export const UI_SELECT_SUBGOAL = 'UI_SELECT_SUBGOAL';
export const UI_SELECT_PATHWAY = 'UI_SELECT_PATHWAY';
export const UI_SELECT_PATHWAY_SECTION = 'UI_SELECT_PATHWAY_SECTION';
export const UI_SELECT_TOP_REGION = 'SELECT_TOP_REGION';
export const UI_SELECT_THREAD = 'SELECT_THREAD';

export interface UIActionSelectScenario extends Action<'UI_SELECT_SCENARIO'> { scenarioid: string }
export interface UIActionSelectSubgoal extends Action<'UI_SELECT_SUBGOAL'> { subgoalid: string }
export interface UIActionSelectPathway extends Action<'UI_SELECT_PATHWAY'> { pathwayid: string }
export interface UIActionSelectPathwaySection extends Action<'UI_SELECT_PATHWAY_SECTION'> { section: string }
export interface UIActionSelectTopRegion extends Action<'SELECT_TOP_REGION'> { regionid?: string };
export interface UIActionSelectThread extends Action<'SELECT_THREAD'> { threadid?: string };

export type UIAction = UIActionSelectScenario | UIActionSelectSubgoal | UIActionSelectPathway 
    | UIActionSelectPathwaySection | UIActionSelectTopRegion | UIActionSelectThread;

export const selectScenario: ActionCreator<UIActionSelectScenario> = (scenarioid:string) => {
    console.log("SelectScenario:" + scenarioid);
    return {
        type: UI_SELECT_SCENARIO,
        scenarioid: scenarioid
    };
};

export const selectSubgoal: ActionCreator<UIActionSelectSubgoal> = (subgoalid:string) => {
    console.log("selectSubgoal:" + subgoalid);
    return {
        type: UI_SELECT_SUBGOAL,
        subgoalid: subgoalid
    };
};

export const selectPathway: ActionCreator<UIActionSelectPathway> = (pathwayid:string) => {
    console.log("selectPathway:" + pathwayid);
    return {
        type: UI_SELECT_PATHWAY,
        pathwayid: pathwayid
    };
};

export const selectPathwaySection: ActionCreator<UIActionSelectPathwaySection> = (section:string) => {
    //console.log("selectPathwaySection:" + section);
    return {
        type: UI_SELECT_PATHWAY_SECTION,
        section: section
    };
};

export const selectTopRegion: ActionCreator<UIActionSelectTopRegion> = (regionid: string) => {
    return {
        type: UI_SELECT_TOP_REGION,
        regionid: regionid
    }
}

export const selectThread: ActionCreator<UIActionSelectThread> = (threadid: string) => {
    return {
        type: UI_SELECT_THREAD,
        threadid: threadid
    }
}