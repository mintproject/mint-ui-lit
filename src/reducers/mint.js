import { SCENARIOS_LIST, SCENARIO_DETAILS, REGIONS_LIST, SCENARIO_SUBSCRIPTION } from "../actions/mint";
const INITIAL_STATE = {};
const mint = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case REGIONS_LIST:
            return Object.assign({}, state, { regions: action.list });
        case SCENARIOS_LIST:
            return Object.assign({}, state, { scenarios: action.list });
        case SCENARIO_SUBSCRIPTION:
            let scenario_sub = Object.assign({}, state.scenario, { unsubscribe: action.unsubscribe });
            return Object.assign({}, state, { scenario: scenario_sub });
        case SCENARIO_DETAILS:
            let scenario = Object.assign({}, action.details, { unsubscribe: state.scenario.unsubscribe });
            return Object.assign({}, state, { scenario: scenario });
        default:
            return state;
    }
};
export default mint;
