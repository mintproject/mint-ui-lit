import { updatePathway } from "../actions/mint";
export const removeDatasetFromPathway = (pathway, datasetid, modelid, inputid) => {
    let datasets = pathway.datasets || {};
    let model_ensembles = pathway.model_ensembles || {};
    // Remove dataset from ensemble
    let dsindex = model_ensembles[modelid][inputid].indexOf(datasetid);
    model_ensembles[modelid][inputid].splice(dsindex, 1);
    if (model_ensembles[modelid][inputid].length == 0) {
        delete model_ensembles[modelid][inputid];
    }
    if (Object.keys(model_ensembles[modelid]).length == 0) {
        delete model_ensembles[modelid];
    }
    // Remove dataset from pathway, if no other models are using it
    if (!_datasetUsedInOtherModel(pathway, datasetid, modelid)) {
        delete datasets[datasetid];
    }
    return Object.assign({}, pathway, { datasets: datasets, model_ensembles: model_ensembles });
};
export const createPathwayExecutableEnsembles = (pathway) => {
    // Create executable ensembles 
    let current_ensembles = (pathway.executable_ensembles || []).slice();
    let current_hashes = current_ensembles.map((ensemble) => {
        return _getEnsembleHash(ensemble);
    });
    pathway.executable_ensembles = [];
    (Object.keys(pathway.model_ensembles) || {}).map((modelid) => {
        // Get any existing ensemble selection for the model
        let dataEnsemble = pathway.model_ensembles[modelid] || {};
        let inputBindingsList = _crossProductInputs(dataEnsemble);
        inputBindingsList.map((inputBindings) => {
            let ensemble = {
                modelid: modelid,
                bindings: inputBindings
            };
            // Note: Keep executable ensembles with existing run ids
            let current_ensemble = _getMatchingEnsemble(current_ensembles, ensemble, current_hashes);
            if (current_ensemble) {
                //console.log("Found a matching ensemble");
                ensemble.runid = current_ensemble.runid;
                ensemble.results = current_ensemble.results;
                ensemble.run_progress = current_ensemble.run_progress;
                ensemble.selected = current_ensemble.selected;
            }
            pathway.executable_ensembles.push(ensemble);
        });
    });
    return pathway;
};
export const runPathwayExecutableEnsembles = (scenario, pathway, indices) => {
    let clearTimer = setInterval(() => {
        let alldone = true;
        indices.map((index) => {
            let ensemble = pathway.executable_ensembles[index];
            if (!ensemble.runid) {
                ensemble.runid = Math.random() + "";
            }
            if (!ensemble.run_progress) {
                ensemble.run_progress = 0;
            }
            ensemble.run_progress += Math.random() * 0.25;
            if (ensemble.run_progress >= 1) {
                ensemble.run_progress = 1;
                let model = pathway.models[ensemble.modelid];
                ensemble.results =
                    Object.keys(model.output_files).filter((ioid) => {
                        let ok = false;
                        pathway.response_variables.map((response_variable) => {
                            if (model.output_files[ioid].variables.indexOf(response_variable) >= 0) {
                                ok = true;
                            }
                        });
                        return ok;
                    })
                        .map((ioid) => { return model.output_files[ioid].id + "_" + Math.floor(Math.random() * 10000) + ".tar.gz"; });
                // FIXME: HACK
                if (ensemble.modelid.match(/PIHM/)) {
                    ensemble.results.push("http://ontosoft.isi.edu/animations/flooding_2341.gif");
                }
            }
            else {
                alldone = false;
            }
        });
        if (alldone) {
            clearInterval(clearTimer);
        }
        updatePathway(scenario, pathway);
    }, 1000);
};
export const matchVariables = (variables1, variables2, fullmatch) => {
    let matched = fullmatch ? true : false;
    variables1.map((var1) => {
        if (!fullmatch && variables2.indexOf(var1) >= 0) {
            matched = true;
        }
        if (fullmatch && variables2.indexOf(var1) < 0) {
            matched = false;
        }
    });
    return matched;
};
export const TASK_NOT_STARTED = "TASK_NOT_STARTED";
export const TASK_DONE = "TASK_DONE";
export const TASK_PARTLY_DONE = "TASK_PARTLY_DONE";
export const getPathwayVariablesStatus = (pathway) => {
    if (pathway.response_variables && pathway.response_variables.length > 0) {
        return TASK_DONE;
    }
    if (pathway.driving_variables && pathway.driving_variables.length > 0) {
        return TASK_PARTLY_DONE;
    }
    return TASK_NOT_STARTED;
};
export const getPathwayModelsStatus = (pathway) => {
    if (pathway.models) {
        if (Object.keys(pathway.models).length > 0) {
            return TASK_DONE;
        }
    }
    return TASK_NOT_STARTED;
};
export const getPathwayDatasetsStatus = (pathway) => {
    if (pathway.datasets) {
        if (Object.keys(pathway.datasets).length > 0) {
            for (let modelid in pathway.models) {
                let model = pathway.models[modelid];
                let model_ensemble = pathway.model_ensembles[modelid];
                if (!model_ensemble) {
                    return TASK_PARTLY_DONE;
                }
                for (let i = 0; i < model.input_files.length; i++) {
                    let input = model.input_files[i];
                    if (!model_ensemble[input.id] || !model_ensemble[input.id].length) {
                        return TASK_PARTLY_DONE;
                    }
                }
            }
            return TASK_DONE;
        }
    }
    let number_of_inputs_needed = 0;
    if (pathway.models) {
        for (let modelid in pathway.models) {
            let model = pathway.models[modelid];
            number_of_inputs_needed += model.input_files.length;
        }
    }
    if (number_of_inputs_needed == 0 && getPathwayModelsStatus(pathway) == TASK_DONE)
        return TASK_DONE;
    return TASK_NOT_STARTED;
};
export const getPathwayParametersStatus = (pathway) => {
    //console.log(pathway.model_ensembles);
    if (getPathwayDatasetsStatus(pathway) != TASK_DONE)
        return TASK_NOT_STARTED;
    for (let modelid in pathway.models) {
        let model = pathway.models[modelid];
        let model_ensemble = pathway.model_ensembles[modelid];
        if (!model_ensemble) {
            return TASK_PARTLY_DONE;
        }
        for (let i = 0; i < model.input_parameters.length; i++) {
            let input = model.input_parameters[i];
            if (!model_ensemble[input.id] || !model_ensemble[input.id].length) {
                return TASK_PARTLY_DONE;
            }
        }
    }
    return TASK_DONE;
};
export const getPathwayRunsStatus = (pathway) => {
    if (pathway.executable_ensembles) {
        if (pathway.executable_ensembles.length > 0) {
            for (let i = 0; i < pathway.executable_ensembles.length; i++) {
                if (!pathway.executable_ensembles[i].runid
                    || (pathway.executable_ensembles[i].run_progress < 1))
                    return TASK_PARTLY_DONE;
            }
            return TASK_DONE;
        }
    }
    return TASK_NOT_STARTED;
};
export const getPathwayResultsStatus = (pathway) => {
    if (pathway.executable_ensembles) {
        if (pathway.executable_ensembles.length > 0) {
            for (let i = 0; i < pathway.executable_ensembles.length; i++) {
                if (pathway.executable_ensembles[i].selected)
                    return TASK_DONE;
            }
        }
    }
    return TASK_NOT_STARTED;
};
/* UI Functions */
export const getUISelectedScenario = (state) => {
    if (state.mint && state.mint.scenarios) {
        if (state.ui && state.ui.selected_scenarioid) {
            return state.mint.scenarios[state.ui.selected_scenarioid];
        }
    }
    return null;
};
export const getUISelectedSubgoal = (state) => {
    if (state.mint && state.mint.scenario) {
        if (state.ui && state.ui.selected_subgoalid) {
            return state.mint.scenario.subgoals[state.ui.selected_subgoalid];
        }
    }
    return null;
};
export const getUISelectedGoal = (state, subgoal) => {
    if (state.mint && state.mint.scenario) {
        for (let goalid in state.mint.scenario.goals) {
            let goal = state.mint.scenario.goals[goalid];
            if (goal.subgoalids.indexOf(subgoal.id) >= 0) {
                return goal;
            }
        }
    }
    return null;
};
export const getUISelectedPathway = (state) => {
    if (state.mint && state.mint.scenario) {
        if (state.ui && state.ui.selected_pathwayid) {
            return state.mint.scenario.pathways[state.ui.selected_pathwayid];
        }
    }
    return null;
};
/* End of UI Functions */
/* Helper Functions */
const _datasetUsedInOtherModel = (pathway, datasetid, notmodelid) => {
    let modelid = "";
    let inputid = "";
    for (modelid in pathway.model_ensembles) {
        if (modelid != notmodelid) {
            let data_ensembles = pathway.model_ensembles[modelid];
            for (inputid in data_ensembles) {
                if (data_ensembles[inputid].indexOf(datasetid) >= 0) {
                    return true;
                }
            }
        }
    }
    return false;
};
const _getInputBindingsCopy = (inputBindings) => {
    return Object.assign({}, inputBindings);
};
const _crossProductInputs = (ensembles) => {
    let inputBindingsList = [{}];
    Object.keys(ensembles).map((inputid) => {
        let datasets = ensembles[inputid];
        let currentInputBindingsList = inputBindingsList.slice();
        inputBindingsList = [];
        datasets.map((dataset) => {
            currentInputBindingsList.map((inputBindings) => {
                let newInputBindings = _getInputBindingsCopy(inputBindings);
                newInputBindings[inputid] = dataset;
                inputBindingsList.push(newInputBindings);
            });
        });
    });
    return inputBindingsList;
};
const _getMatchingEnsemble = (ensembles, execution, hashes) => {
    let hash = _getEnsembleHash(execution);
    let index = hashes.indexOf(hash);
    if (index >= 0) {
        return ensembles[index];
    }
    return null;
};
const _getEnsembleHash = (ensemble) => {
    let str = ensemble.modelid;
    let varids = Object.keys(ensemble.bindings).sort();
    varids.map((varid) => {
        str += varid + "=" + ensemble.bindings[varid] + "&";
    });
    return str;
};
/* End of Helper Functions */ 
