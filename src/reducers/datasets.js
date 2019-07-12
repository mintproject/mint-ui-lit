import { DATASETS_QUERY, DATASETS_DETAIL } from "../actions/datasets";
;
const INITIAL_STATE = { datasets: {}, dataset: {} };
const datasets = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case DATASETS_QUERY:
            // Return datasets
            state.datasets = Object.assign({}, state.datasets);
            state.datasets[action.modelid] = state.datasets[action.modelid] || {};
            state.datasets[action.modelid][action.inputid] = action.datasets;
            return Object.assign({}, state);
        case DATASETS_DETAIL:
            // Return model details
            return Object.assign({}, state, { dataset: action.dataset });
        default:
            return state;
    }
};
export default datasets;
