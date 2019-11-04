import { Pathway, DatasetMap, ModelEnsembleMap, DataEnsembleMap, InputBindings, ExecutableEnsemble, Scenario, SubGoal, ExecutableEnsembleSummary } from "../screens/modeling/reducers";
import { RootState } from "../app/store";
import { updatePathway, addPathwayEnsembles } from "../screens/modeling/actions";
import { UserPreferences, MintPreferences } from "app/reducers";
import { loginToWings, fetchWingsTemplate, fetchWingsTemplatesList, fetchWingsComponent, createSingleComponentTemplate, saveWingsTemplate, layoutWingsTemplate, WingsParameterBindings, WingsDataBindings, WingsParameterTypes, registerWingsComponent, registerWingsDataset, fetchWingsRunStatus, WingsTemplateSeed, expandAndRunWingsWorkflow, WingsTemplatePackage, WingsTemplate } from "./wings_functions";
import { DataResource } from "screens/datasets/reducers";
import { hideNotification } from "./ui_functions";

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

/*
export const createPathwayExecutableEnsembles = (pathway: Pathway) => {
    // Create executable ensembles and add summary to pathway
    if(!pathway.executable_ensemble_summary) 
        pathway.executable_ensemble_summary = {};

    (Object.keys(pathway.model_ensembles!) || []).map((modelid) => {
        let dataEnsemble: DataEnsembleMap = pathway.model_ensembles![modelid] || {};
        let totalruns = _createExecutableEnsembles(pathway.id, modelid, dataEnsemble);
        if(totalruns) {
            pathway.executable_ensemble_summary[modelid] = {
                total_runs: totalruns
            } as ExecutableEnsembleSummary
        }
    });
    return pathway
}
*/

const MAX_CONFIGURATIONS = 10000;
export const getModelInputConfigurations = (
        dataEnsemble: DataEnsembleMap,
        inputIds: string[]) => {
    let inputBindings = [];
    let totalproducts = 1;
    inputIds.map((inputid) => {
        inputBindings.push(dataEnsemble[inputid]);
        totalproducts *= dataEnsemble[inputid].length;
    });
    if(totalproducts < MAX_CONFIGURATIONS) {
        return cartProd(inputBindings);
    }
    else {
        alert("Error: Too many Input combinations: " + totalproducts +". Max allowed : " + MAX_CONFIGURATIONS);
        return null;
    }
}

const cartProd = lists => {
    let ps = [],
        acc = [
            []
        ],
        i = lists.length;
    while (i--) {
        let subList = lists[i],
            j = subList.length;
        while (j--) {
            let x = subList[j],
                k = acc.length;
            while (k--) ps.push([x].concat(acc[k]))
        };
        acc = ps;
        ps = [];
    };
    return acc.reverse();
};

/*
const _createExecutableEnsembles = (pathwayid: string, 
        modelid: string, dataEnsemble: DataEnsembleMap) => {
    let inputBindings = [];
    let inputIds = [];
    let totalproducts = 1;
    Object.keys(dataEnsemble).map((inputid) => {
        inputBindings.push(dataEnsemble[inputid]);
        totalproducts *= dataEnsemble[inputid].length;
        inputIds.push(inputid);
    });
    if(totalproducts < 5000) {
        let prodBindings = cartProd(inputBindings);
        for(let i=0; i<totalproducts; i+=100) {
            let bindings = prodBindings.slice(i, i+100);
            let ensembles = [];
            let index = i;
            bindings.map((binding) => {
                let inputBindings = {};
                for(let j=0; j<inputIds.length; j++) {
                    inputBindings[inputIds[j]] = binding[j];
                }
                let ensemble = {
                    modelid: modelid,
                    bindings: inputBindings,
                    runid: null,
                    status: null,
                    results: [],
                    selected: false
                } as ExecutableEnsemble;
                ensemble.id = getEnsembleHash(ensemble);
                ensembles.push(ensemble);
            })
            // TODO: Give feedback => Keep resolving promises ? (Stream ?)
            addPathwayEnsembles(ensembles);
        }
    }
    else {
        alert("Error: Cannot handle more than 5000 workflows. Current workflows generated: " + totalproducts);
        return null;
    }
    return totalproducts;
}
*/

const _createModelTemplate = (
        cname: string,
        prefs: UserPreferences) : Promise<string> => {

    return new Promise((resolve, reject) => {
        loginToWings(prefs).then(() => {
            let config = prefs.mint.wings;
            let expfx = config.export_url + "/export/users/" + config.username + "/" + config.domain;

            
            let tname = "workflow_" + cname;
            let tns = expfx + "/workflows/" + tname + ".owl#";
            let tid = tns + tname;

            fetchWingsTemplatesList(prefs).then((list) => {
                if(list.indexOf(tid) >= 0) {
                    console.log(tid + " template already exists");
                    resolve(tid);
                }
                else {
                    // Create template
                    fetchWingsComponent(cname, prefs).then((comp) => {
                        let tpl = createSingleComponentTemplate(comp, prefs);
                        layoutWingsTemplate(tpl, prefs).then((tpl_package) => {
                            saveWingsTemplate(tpl_package, prefs).then(() => {
                                console.log("Template saved as " + tpl.id);
                                resolve(tpl.id);
                            })
                        });
                    });
                }
            });
        }).catch((reason) => {
            console.log("Could not login: " + reason);
        });
    });
}

const _runModelTemplates = (
        seeds: WingsTemplateSeed[],
        tpl_package: WingsTemplatePackage,
        prefs: UserPreferences) : Promise<string[]> => {
            
    let config = prefs.mint.wings;
    let expfx = config.export_url + "/export/users/" + config.username + "/" + config.domain;
    return Promise.all(
        seeds.map((seed) => {
            let tns = seed.tid.replace(/#.*$/, "#");

            let dataBindings = {} as WingsDataBindings;
            let parameterBindings = {} as WingsParameterBindings;
            let parameterTypes = {} as WingsParameterTypes;
            for(let varname in seed.datasets) {
                let varid = tns + varname;
                dataBindings[varid] = seed.datasets[varname].map((ds: string)=> expfx + "/data/library.owl#" + ds);
            }
            for(let varname in seed.parameters) {
                let varid = tns + varname;
                parameterBindings[varid] = seed.parameters[varname];
                parameterTypes[varid] = "http://www.w3.org/2001/XMLSchema#" + seed.paramtypes[varname];
            }

            return expandAndRunWingsWorkflow(tpl_package, 
                dataBindings, 
                parameterBindings, 
                parameterTypes, prefs);
        })
    );
}

export const setupModelWorkflow = async(model: Model, pathway: Pathway, prefs: UserPreferences) => {
    let cname = model.model_configuration;
    let compid = await registerWingsComponent(cname, model.wcm_uri, prefs);
    let compname = compid.replace(/^.*#/, '');
    let templateid = await _createModelTemplate(compname, prefs);
    return templateid;
}

export const runModelEnsembles = async(pathway: Pathway, 
        ensembles: ExecutableEnsemble[], 
        existing_registered_resources: Object,
        tpl_package: WingsTemplatePackage,
        prefs: UserPreferences) => {
    let registerDatasetPromises = [];
    let seeds : WingsTemplateSeed[] = [];
    let registered_resources = {};

    // Get all input dataset bindings and parameter bindings
    ensembles.map((ensemble) => {
        let model = pathway.models[ensemble.modelid];
        let bindings = ensemble.bindings;
        let datasets = {};
        let parameters = {};
        let paramtypes = {};

        // Get input datasets
        model.input_files.map((io) => {
            let resources : DataResource[] = [];
            let dsid = null;
            if(bindings[io.id]) {
                // We have a dataset binding from the user for it
                resources = [ bindings[io.id] as DataResource ];
            }
            else if(io.value) {
                // There is a hardcoded value in the model itself
                dsid = io.value.id;
                resources = io.value.resources;
            }
            if(resources.length > 0) {
                let type = io.type.replace(/^.*#/, '');
                resources.map((res) => {
                    if(res.url) {
                        res.name =  res.url.replace(/^.*(#|\/)/, '');
                        res.name = res.name.replace(/^([0-9])/, '_$1');
                        if(!res.id)
                            res.id = res.name;
                    }
                    if(!existing_registered_resources[res.id]) {
                        registered_resources[res.id] = [res.name, type, res.url];
                    }
                })
                datasets[io.name] = resources.map((res) => res.name);
            }
        });

        // Get Input parameters
        model.input_parameters.map((ip) => {
            if(ip.value) {
                parameters[ip.name] = ip.value;
            }
            else if(bindings[ip.id]) {
                let value = bindings[ip.id];
                parameters[ip.name] = value;
            }
            paramtypes[ip.name] = ip.type;
        });

        seeds.push({
            tid: tpl_package.template.id,
            datasets: datasets,
            parameters: parameters,
            paramtypes: paramtypes
        } as WingsTemplateSeed);
    })

    // Register any datasets that need to be registered
    for(let resid in registered_resources) {
        let args = registered_resources[resid];
        existing_registered_resources[resid] = args;
        registerDatasetPromises.push(registerWingsDataset(resid, args[0], args[1], args[2], prefs));
    }

    // Register all datasets
    if(registerDatasetPromises.length > 0)
        await Promise.all(registerDatasetPromises);

    let runids = await _runModelTemplates(seeds, tpl_package, prefs);
    return runids;
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
    if (pathway.models) {
        if (Object.keys(pathway.models).length > 0) {
            return TASK_DONE;
        }
    }   
    return TASK_NOT_STARTED;
}

export const getPathwayDatasetsStatus = (pathway:Pathway) => {
    if (pathway.datasets) {
        if (Object.keys(pathway.datasets).length > 0) {
            for(let modelid in pathway.models) {
                let model_ensemble = pathway.model_ensembles![modelid];
                if(!model_ensemble) {
                    return TASK_PARTLY_DONE;
                }
                let model = pathway.models![modelid];
                for(let i=0; i<model.input_files.length; i++) {
                    let input = model.input_files[i];
                    if(input.value)
                        continue;
                    if(!model_ensemble[input.id!] || !model_ensemble[input.id!].length) {
                        return TASK_PARTLY_DONE;
                    }
                }
            }
            return TASK_DONE;
        }
    }
    let number_of_inputs_needed = 0;
    if(pathway.models) {
        for(let modelid in pathway.models) {
            let model = pathway.models![modelid];
            number_of_inputs_needed += model.input_files.filter((input) => !input.value).length;
        }
    }

    if(number_of_inputs_needed == 0 && getPathwayModelsStatus(pathway) == TASK_DONE)
        return TASK_DONE;
    return TASK_NOT_STARTED;
}

export const getPathwayParametersStatus = (pathway:Pathway) => {
    let sum = pathway.executable_ensemble_summary;
    if(!sum || Object.keys(sum).length == 0) {
        return TASK_NOT_STARTED;
    }
    
    //console.log(pathway.model_ensembles);
    if(getPathwayDatasetsStatus(pathway) != TASK_DONE)
        return TASK_NOT_STARTED;

    for(let modelid in pathway.models) {
        let model = pathway.models![modelid];
        let model_ensemble = pathway.model_ensembles![modelid];
        if(!model_ensemble) {
            return TASK_PARTLY_DONE;
        }
        let input_parameters = model.input_parameters.filter((input) => !input.value);
        for(let i=0; i<input_parameters.length; i++) {
            let input = input_parameters[i];
            if(!model_ensemble[input.id!] || !model_ensemble[input.id!].length) {
                return TASK_PARTLY_DONE;
            }
        }
    }
    return TASK_DONE;
}

export const getPathwayRunsStatus = (pathway:Pathway) => {
    let sum = pathway.executable_ensemble_summary;
    if (sum && Object.keys(sum).length > 0) {
        let ok = true;
        Object.keys(sum).map((modelid) => {
            let summary = sum[modelid];
            if(summary.total_runs == 0 || 
                    (summary.successful_runs + summary.failed_runs != summary.total_runs))
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
            if(!summary.submitted_for_ingestion)
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
    if(subgoal && subgoal.subregionid && state.regions && state.regions.query_result 
            && state.regions.query_result[state.ui.selected_top_regionid]) {
        let res = state.regions.query_result[state.ui.selected_top_regionid]["*"]
        if(res && res[subgoal.subregionid]) {
            return res[subgoal.subregionid];
        }
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
            let ensemble = sdoc.data() as ExecutableEnsemble;
            ensemble.id = sdoc.id;
            return ensemble;
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

const _crossProductInputs = (ensembles: DataEnsembleMap) => {
    let inputBindingsList: InputBindings[] = [{}];
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
        })
    });
    return inputBindingsList;
}

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

export const getVisualizationURL = (pathway: Pathway, prefs: MintPreferences) => {
    if(getPathwayResultsStatus(pathway) == "TASK_DONE") {
        let responseV = pathway.response_variables.length > 0?
            getVariableLongName(pathway.response_variables[0]) : '';
        let drivingV = pathway.driving_variables.length > 0?
            getVariableLongName(pathway.driving_variables[0]) : '';

        // FIXME: Hack
        if(responseV == "Potential Crop Production")
            return prefs.visualization_url + "/cycles?thread_id=" + pathway.id;
        else
            return prefs.visualization_url + "/upload?thread_id=" + pathway.id;
    }
    return null;
}
/* End of Helper Functions */