import { Pathway, DatasetMap, ModelEnsembleMap, DataEnsembleMap, InputBindings, ExecutableEnsemble, SubGoal } from "../screens/modeling/reducers";
import { RootState } from "../app/store";
import { UserPreferences, MintPreferences } from "app/reducers";
import { DataResource } from "screens/datasets/reducers";

import {Md5} from 'ts-md5/dist/md5'
import { db } from "config/firebase";
import { Model } from "screens/models/reducers";
import { isObject } from "util";
import { postJSONResource } from "./mint-requests";
import { getVariableLongName } from "offline_data/variable_list";

export const removeDatasetFromPathway = (pathway: Pathway,
        datasetid: string, modelid: string, inputid: string) => {
    let datasets: DatasetMap = pathway.datasets || {};
    let model_ensembles: ModelEnsembleMap = pathway.model_ensembles || {};

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
    return {
        ...pathway,
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

export const getPathwayVariablesStatus = (pathway:Pathway) => {
    if (pathway.response_variables && pathway.response_variables.length > 0) {
        return TASK_DONE;
    }
    if (pathway.driving_variables && pathway.driving_variables.length > 0) {
        return TASK_PARTLY_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getPathwayModelsStatus = (pathway:Pathway) => {
    if(pathway.last_update && pathway.last_update.models) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getPathwayDatasetsStatus = (pathway:Pathway) => {
    if(pathway.last_update && pathway.last_update.datasets) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getPathwayParametersStatus = (pathway:Pathway) => {
    if(pathway.last_update && pathway.last_update.parameters) {
        return TASK_DONE;
    }
    return TASK_NOT_STARTED;
}

export const getPathwayRunsStatus = (pathway:Pathway) => {
    let sum = pathway.executable_ensemble_summary;
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

export const getPathwayResultsStatus = (pathway:Pathway) => {
    if(getPathwayRunsStatus(pathway) != TASK_DONE)
        return TASK_NOT_STARTED;
    
    let sum = pathway.executable_ensemble_summary;
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
export const getUISelectedScenario = (state: RootState) => {
    if(state.modeling && state.modeling.scenarios) {
        if(state.ui && state.ui.selected_scenarioid) {
            return state.modeling.scenarios[state.ui.selected_scenarioid];
        }
    }
    return null;
}

export const getUISelectedSubgoal = (state: RootState) => {
    if(state.modeling && state.modeling.scenario) {
        if(state.ui && state.ui.selected_subgoalid) {
            return state.modeling.scenario.subgoals[state.ui.selected_subgoalid];
        }
    }
    return null;
}

export const getUISelectedGoal = (state: RootState, subgoal: SubGoal) => {
    if(state.modeling && state.modeling.scenario) {
        for(let goalid in state.modeling.scenario.goals) {
            let goal = state.modeling.scenario.goals[goalid];
            if(goal.subgoalids!.indexOf(subgoal.id!) >=0) {
                return goal;
            }
        }
    }
    return null;
}

export const getUISelectedPathway = (state: RootState) => {
    if(state.modeling && state.modeling.scenario) {
        if(state.ui && state.ui.selected_subgoalid && state.ui.selected_pathwayid) {
            let subgoal = state.modeling.scenario.subgoals[state.ui.selected_subgoalid];
            if(subgoal && subgoal.pathways)
                return subgoal.pathways[state.ui.selected_pathwayid];
        }
    }
    return null;
}

export const getUISelectedSubgoalRegion = (state: RootState) => {
    let subgoal = getUISelectedSubgoal(state);
    if(subgoal && subgoal.subregionid && state.regions && state.regions.regions) {
        return state.regions.regions[subgoal.subregionid];
    }
    return null;
}
/* End of UI Functions */

/* Helper Functions */

const _datasetUsedInOtherModel = (pathway: Pathway, datasetid: string, notmodelid: string) => {
    let modelid:string = "";
    let inputid:string = "";
    for(modelid in pathway.model_ensembles) {
        if(modelid != notmodelid) {
            let data_ensembles: DataEnsembleMap = pathway.model_ensembles![modelid];                
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

// List Ensembles
export const listEnsembles = (ensembleids: string[]) : Promise<ExecutableEnsemble[]> => {
    let ensemblesRef = db.collection("ensembles");
    return Promise.all(ensembleids.map((ensembleid) => {
        return ensemblesRef.doc(ensembleid).get().then((sdoc) => {
            if(sdoc && sdoc.exists && sdoc.data()) {
                let ensemble = sdoc.data() as ExecutableEnsemble;
                ensemble.id = sdoc.id;
                return ensemble;
            }
        })
    }));
};

// List Ensemble Ids (i.e. which ensemble ids exist)
export const listExistingEnsembleIds = (ensembleids: string[]) : Promise<string[]> => {
    let ensemblesRef = db.collection("ensembles");
    return Promise.all(ensembleids.map((ensembleid) => {
        return ensemblesRef.doc(ensembleid).get().then((sdoc) => {
            if(sdoc.exists)
                return ensembleid;
        })
    }));
};

// List Ensemble Ids (i.e. which ensemble ids exist)
export const listAlreadyRunEnsembleIds = (ensembleids: string[]) : Promise<string[]> => {
    let ensemblesRef = db.collection("ensembles");
    return Promise.all(ensembleids.map((ensembleid) => {
        return ensemblesRef.doc(ensembleid).get().then((sdoc) => {
            if(sdoc.exists) {
                let ensemble = sdoc.data() as ExecutableEnsemble;
                if(ensemble.status == "SUCCESS" && ensemble.results) {
                    return ensembleid;
                }
            }
        })
    }));
};

export const getMatchingEnsemble = (ensembles: ExecutableEnsemble[], execution: ExecutableEnsemble, hashes: string[]) => {
    let hash = getEnsembleHash(execution);
    let index = hashes.indexOf(hash);
    if(index >= 0) {
        return ensembles[index];
    }
    return null;
}

export const getEnsembleHash = (ensemble: ExecutableEnsemble) : string => {
    let str = ensemble.modelid;
    let varids = Object.keys(ensemble.bindings).sort();
    varids.map((varid) => {
        let binding = ensemble.bindings[varid];
        let bindingid = isObject(binding) ? (binding as DataResource).id : binding;
        str += varid + "=" + bindingid + "&";
    })
    return Md5.hashStr(str).toString();
}

export const sendDataForIngestion = (scenarioid: string, subgoalid: string, threadid: string, prefs: UserPreferences) => {
    let data = {
        scenario_id: scenarioid,
        subgoal_id: subgoalid,
        thread_id: threadid
    };
    return new Promise<void>((resolve, reject) => {
        postJSONResource({
            url: prefs.mint.ingestion_api + "/modelthreads",
            onLoad: function(e: any) {
                resolve();
            },
            onError: function() {
                reject("Cannot ingest thread");
            }
        }, data, false);
    });    
}

export const getVisualizationURLs = (pathway: Pathway, prefs: MintPreferences) => {
    if(getPathwayResultsStatus(pathway) == "TASK_DONE") {
        let responseV = pathway.response_variables.length > 0?
            getVariableLongName(pathway.response_variables[0]) : '';
        let drivingV = pathway.driving_variables.length > 0?
            getVariableLongName(pathway.driving_variables[0]) : '';

        let visualizations = [];
        // FIXME: Hack
        if(responseV == "Streamflow Duration Index" || responseV == "Flood Severity Index" || responseV == "Flooding Contour") {
            visualizations.push(prefs.visualization_url + "/images?thread_id=" + pathway.id);
        }
        else {
            if(responseV == "Potential Crop Production")
                visualizations.push(prefs.visualization_url + "/cycles?thread_id=" + pathway.id);
            visualizations.push(prefs.visualization_url + "/upload?thread_id=" + pathway.id);
        }
        return visualizations;
    }
    return null;
}

export const pathwayTotalRunsChanged = (oldpathway: Pathway, newpathway: Pathway) => {
    if((oldpathway == null || newpathway == null) && oldpathway != newpathway)
        return true;

    let oldtotal = 0;
    Object.keys(oldpathway.executable_ensemble_summary).map((modelid) => {
        oldtotal += oldpathway.executable_ensemble_summary[modelid].total_runs;
    })
    let newtotal = 0;
    Object.keys(newpathway.executable_ensemble_summary).map((modelid) => {
        newtotal += newpathway.executable_ensemble_summary[modelid].total_runs;
    })
    return oldtotal != newtotal;
}


export const pathwaySummaryChanged = (oldpathway: Pathway, newpathway: Pathway) => {
    if((oldpathway == null || newpathway == null) && oldpathway != newpathway)
        return true;
    let oldsummary = _stringify_ensemble_summary(oldpathway.executable_ensemble_summary);
    let newsummary = _stringify_ensemble_summary(newpathway.executable_ensemble_summary);
    return oldsummary != newsummary;
}

const _stringify_ensemble_summary = (obj: Object) => {
    if(!obj) {
        return "";
    }
    let keys = Object.keys(obj);
    keys = keys.sort();
    let str = "";
    keys.map((key) => {
        if(key.match(/ingested_runs/) 
            || key.match(/fetched_run_outputs/) 
            || key.match(/submitted_for_ingestion/)) {
            return;
        }
        let binding = isObject(obj[key]) ? _stringify_ensemble_summary(obj[key]) : obj[key];
        str += key + "=" + binding + "&";
    })
    return str;
}

/* End of Helper Functions */