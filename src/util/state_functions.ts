import { Thread, DatasetMap, ModelEnsembleMap, DataEnsembleMap, InputBindings, Execution, Task, ProblemStatement } from "../screens/modeling/reducers";
import { RootState } from "../app/store";
import { getVariableLongName } from "offline_data/variable_list";
import { getLatestEventOfType } from "./event_utils";
import { MintPreferences } from "app/reducers";

export const removeDatasetFromThread = (thread: Thread,
        datasetid: string, modelid: string, inputid: string) => {
    let datasets: DatasetMap = thread.datasets || {};
    let model_ensembles: ModelEnsembleMap = thread.model_ensembles || {};

    // Remove dataset from ensemble
    let dsindex = model_ensembles[modelid][inputid].indexOf(datasetid);
    model_ensembles[modelid][inputid].splice(dsindex, 1);
    if (model_ensembles[modelid][inputid].length == 0) {
        delete model_ensembles[modelid][inputid];
    }
    if (Object.keys(model_ensembles[modelid]).length == 0) {
        delete model_ensembles[modelid];
    }

    // Remove dataset from thread, if no other models are using it
    if (!_datasetUsedInOtherModel(thread, datasetid, modelid)) {
        delete datasets[datasetid];
    }
    return {
        ...thread,
        datasets: datasets,
        model_ensembles: model_ensembles
    };
}

export const matchVariables = (variables1: string[], variables2: string[], fullmatch: boolean) => {
    let matched = fullmatch ? true: false;
    variables1.map((var1compound) => {
        var1compound.split(/\s*,\s/).map((var1) => {
            if (!fullmatch && variables2.indexOf(var1) >= 0) {
                matched = true;
            }
            if(fullmatch && variables2.indexOf(var1) < 0) {
                matched = false;
            }
        });
    });
    return matched;
}

export const TASK_NOT_STARTED = "TASK_NOT_STARTED"
export const TASK_DONE = "TASK_DONE";
export const TASK_PARTLY_DONE = "TASK_PARTLY_DONE";

export const getThreadVariablesStatus = (thread:Thread) => {
    if (thread.response_variables && thread.response_variables.length > 0) {
        return TASK_DONE;
    }
    if (thread.driving_variables && thread.driving_variables.length > 0) {
        return TASK_PARTLY_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadModelsStatus = (thread:Thread) => {
    let latest_event = getLatestEventOfType(["SELECT_MODELS"], thread.events);
    if(latest_event) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadDatasetsStatus = (thread:Thread) => {
    let latest_event = getLatestEventOfType(["SELECT_DATA"], thread.events);
    if(latest_event) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadParametersStatus = (thread:Thread) => {
    let latest_event = getLatestEventOfType(["SELECT_PARAMETERS"], thread.events);
    if(latest_event) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadRunsStatus = (thread:Thread) => {
    let sum = thread.execution_summary;
    if (sum && Object.keys(sum).length > 0) {
        let ok = true;
        Object.keys(sum).map((modelid) => {
            let summary = sum[modelid];
            if(summary.total_runs == 0 || 
                    (summary.successful_runs != summary.total_runs))
                ok = false;
        });
        if(ok)
            return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadResultsStatus = (thread:Thread) => {
    if(getThreadRunsStatus(thread) != TASK_DONE)
        return TASK_NOT_STARTED;
    
    let sum = thread.execution_summary;
    if (sum && Object.keys(sum).length > 0) {
        let ok = true;
        Object.keys(sum).map((modelid) => {
            let summary = sum[modelid];
            if(summary.total_runs == 0 || 
                (summary.ingested_runs != summary.total_runs))
                ok = false;
        });
        if(ok)
            return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

/* UI Functions */
export const getUISelectedProblemStatement = (state: RootState) => {
    if(state.modeling && state.modeling.problem_statements) {
        if(state.ui && state.ui.selected_problem_statement_id) {
            return state.modeling.problem_statements[state.ui.selected_problem_statement_id];
        }
    }
    return null;
}

export const getUISelectedTask = (state: RootState) => {
    if(state.modeling && state.modeling.problem_statement && state.modeling.problem_statement.tasks) {
        if(state.ui && state.ui.selected_task_id) {
            return state.modeling.problem_statement.tasks[state.ui.selected_task_id];
        }
    }
    return null;
}

export const getUISelectedThread = (state: RootState) => {
    if(state.modeling && state.modeling.problem_statement) {
        if(state.ui && state.ui.selected_problem_statement_id && state.ui.selected_thread_id) {
            let task = state.modeling.problem_statement.tasks[state.ui.selected_task_id];
            if(task && task.threads)
                return task.threads[state.ui.selected_thread_id];
        }
    }
    return null;
}

export const getUISelectedSubgoalRegion = (state: RootState) => {
    let task = getUISelectedTask(state);
    if(task && task.regionid && state.regions && state.regions.regions) {
        return state.regions.regions[task.regionid];
    }
    return null;
}

export const getVisualizationURLs = (thread: Thread, task: Task, problem_statement: ProblemStatement, prefs: MintPreferences) => {
    if(getThreadResultsStatus(thread) == "TASK_DONE") {
        let responseV = thread.response_variables.length > 0?
            getVariableLongName(thread.response_variables[0]) : '';
        let drivingV = thread.driving_variables.length > 0?
            getVariableLongName(thread.driving_variables[0]) : '';

        let visualizations = [];
        let data = {
            thread_id: thread.id,
            task_id: task.id,
            problem_statement_id: problem_statement.id
        };
        let qs = new URLSearchParams(data);
        let query : string = qs.toString();
        // FIXME: Hack
        if (responseV == "Flooding Contour") {
            visualizations.push(prefs.visualization_url + "/hand?" + query);
        } else if(responseV == "Streamflow Duration Index" || 
            responseV == "Flood Severity Index" || 
            responseV == "River Discharge") {
            visualizations.push(prefs.visualization_url + "/images?" + query);
        } else {
            if(responseV == "Potential Crop Production")
                visualizations.push(prefs.visualization_url + "/cycles?" + query);
            visualizations.push(prefs.visualization_url + "/upload?" + query);
        }
        return visualizations;
    }
    return [];
}

export const getCategorizedRegions = (state: RootState) => {            
    if(state.regions && state.regions.categories && state.regions.regions && state.regions.sub_region_ids) {
        let top_region = state.regions.regions[state.ui.selected_top_regionid];
        let all_regionids = state.regions.sub_region_ids[state.ui.selected_top_regionid];       
        let categorized_regions = {};
        Object.keys(state.regions.categories).forEach((catid) => {
            categorized_regions[catid] = [];
        })
        all_regionids.map((regionid) => {
            let region = state.regions.regions[regionid];
            if(!categorized_regions[region.category_id]) {
                categorized_regions[region.category_id] = [];
            }
            categorized_regions[region.category_id].push(region);
        })
        Object.keys(categorized_regions).map((regionid) => {
            let regions = categorized_regions[regionid];
            regions.sort((a, b) => a.name.localeCompare(b.name));
        })
        // Add the top region with category "" (i.e. None)
        categorized_regions[""] = [top_region];
        return categorized_regions;
    }
    return null;
}

/* End of UI Functions */

/* Helper Functions */

const _datasetUsedInOtherModel = (thread: Thread, datasetid: string, notmodelid: string) => {
    let modelid:string = "";
    let inputid:string = "";
    for(modelid in thread.model_ensembles) {
        if(modelid != notmodelid) {
            let data_ensembles: DataEnsembleMap = thread.model_ensembles![modelid];                
            for(inputid in data_ensembles) {
                if(data_ensembles[inputid].indexOf(datasetid) >= 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

const _getInputBindingsCopy = (inputBindings: InputBindings) => {
    return {
        ...inputBindings
    };
}


/* End of Helper Functions */
