import { MODELS_QUERY, MODELS_DETAIL } from "../actions/models";
;
const INITIAL_STATE = { models: {}, model: {} };
const models = (state = INITIAL_STATE, action) => {
    //let scenario:ScenarioDetails = { ...state.scenario } as ScenarioDetails;
    //let scenarios:ScenarioList = { ...state.scenarios } as ScenarioList;
    switch (action.type) {
        case MODELS_QUERY:
            // Return models list
            state.models = Object.assign({}, state.models);
            state.models[action.variables.join(",")] = action.models;
            return Object.assign({}, state);
        case MODELS_DETAIL:
            // Return model details
            return Object.assign({}, state, { model: action.model });
        default:
            return state;
    }
};
export default models;
