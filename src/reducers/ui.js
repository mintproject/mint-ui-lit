import { UI_SELECT_SUBGOAL, UI_SELECT_PATHWAY, UI_SELECT_PATHWAY_SECTION, UI_SELECT_SCENARIO } from "../actions/ui";
const INITIAL_STATE = {};
const ui = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UI_SELECT_SCENARIO:
            return Object.assign({}, state, { selected_scenarioid: action.scenarioid, selected_subgoalid: "", selected_pathwayid: "", selected_pathway_section: "" });
        case UI_SELECT_SUBGOAL:
            return Object.assign({}, state, { selected_subgoalid: action.subgoalid, selected_pathwayid: "", selected_pathway_section: "" });
        case UI_SELECT_PATHWAY:
            return Object.assign({}, state, { selected_pathwayid: action.pathwayid });
        case UI_SELECT_PATHWAY_SECTION:
            return Object.assign({}, state, { selected_pathway_section: action.section });
        default:
            return state;
    }
};
export default ui;
