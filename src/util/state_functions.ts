import { Thread, ModelIOBindings, InputBindings, Task, ProblemStatementInfo, ExecutionSummary } from "../screens/modeling/reducers";
import { RootState } from "../app/store";
import { IdMap, MintPreferences } from "app/reducers";
import { getLatestEventOfType } from "./event_utils";

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

export const getThreadConfigureStatus = (thread:Thread) => {
    if (getThreadModelsStatus(thread) === TASK_DONE && getThreadDatasetsStatus(thread) === TASK_DONE)
        return TASK_DONE;
    if (!thread.regionid || (thread.response_variables && thread.response_variables.length === 0))
        return TASK_NOT_STARTED;
    return TASK_PARTLY_DONE;
}

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
    // Check if any models have been selected
    if(Object.keys(thread.models).length > 0) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadDatasetsStatus = (thread:Thread) => {
    if(getThreadModelsStatus(thread) == TASK_DONE) {
        // If there is no event, check if datasets are needed and have been selected
        let event = getLatestEventOfType(["SELECT_DATA"], thread.events);
        if (event == null) {
            return TASK_NOT_STARTED;
        }
        let ok = true;
        Object.keys(thread.model_ensembles).forEach((modelid) => {
            let model = thread.models[modelid];
            let mensemble = thread.model_ensembles[modelid];
            model.input_files.forEach((input) => {
                if(!input.value && !mensemble.bindings[input.id]) {
                    ok = false;
                }
            })
        });
        if(ok) {
            return TASK_DONE;
        }
    }
    return TASK_NOT_STARTED;
}

export const getThreadParametersStatus = (thread:Thread) => {
    // If there is no event, check if parameters are needed and have been selected
    if(getThreadDatasetsStatus(thread) == TASK_DONE) {
        let event = getLatestEventOfType(["SELECT_PARAMETERS"], thread.events);
        if (event == null) {
            return TASK_NOT_STARTED;
        }

        let ok = true;
        Object.keys(thread.model_ensembles).forEach((modelid) => {
            let model = thread.models[modelid];
            let mensemble = thread.model_ensembles[modelid];
            model.input_parameters.forEach((input) => {
                if(!input.value && !mensemble.bindings[input.id]) {
                    ok = false;
                }
            })
        });
        if(ok) {
            return TASK_DONE;
        }
    }
    return TASK_NOT_STARTED;
}

export const getThreadRunsStatus = (thread: Thread) => {
    let sum = thread?.execution_summary;
    if (sum && Object.keys(sum).length > 0) {
        let ok = true;
        Object.keys(sum).map((modelid) => {
            let summary = sum[modelid];
            if(!summary.total_runs || 
                    (summary.successful_runs != summary.total_runs))
                ok = false;
        });
        if(ok)
            return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getThreadResultsStatus = (thread: Thread) => {
    if(getThreadRunsStatus(thread) != TASK_DONE)
        return TASK_NOT_STARTED;
    
    let sum = thread?.execution_summary;
    if (sum && Object.keys(sum).length > 0) {
        let ok = true;
        Object.keys(sum).map((modelid) => {
            let summary = sum[modelid];
            if(!summary.total_runs || 
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

export const getVisualizationURLs = (thread: Thread, task: Task, problem_statement: ProblemStatementInfo, prefs: MintPreferences) => {
    if(getThreadResultsStatus(thread) == "TASK_DONE") {
        let responseV = thread.response_variables.length > 0? thread.response_variables[0] : '';

        let visualizations = [];
        let data = {
            thread_id: thread.id,
            task_id: task.id,
            problem_statement_id: problem_statement.id
        };
        let qs = new URLSearchParams(data);
        let query : string = qs.toString();
        // FIXME: Hack
        if (responseV == "flooding_contour") {
            visualizations.push(prefs.visualization_url + "/hand?" + query);
        } else if(responseV == "channel~stream_water__flow_duration_index" || 
            responseV == "channel_water_flow__flood_volume-flux_severity_index" || 
            responseV == "downstream_volume_flow_rate") {
            visualizations.push(prefs.visualization_url + "/images?" + query);
        } else {
            if(responseV == "grain~dry__mass-per-area_yield")
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
            let data_ensembles: ModelIOBindings = thread.model_ensembles![modelid].bindings;                
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
