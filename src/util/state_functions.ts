import { Pathway, DatasetMap, ModelEnsembleMap, DataEnsembleMap, InputBindings, ExecutableEnsemble, Scenario, SubGoal } from "../screens/modeling/reducers";
import { RootState } from "../app/store";
import { updatePathway } from "../screens/modeling/actions";
import { UserPreferences } from "app/reducers";
import { loginToWings, fetchWingsTemplate, fetchWingsTemplatesList, fetchWingsComponent, createSingleComponentTemplate, saveWingsTemplate, layoutWingsTemplate, WingsParameterBindings, WingsDataBindings, WingsParameterTypes, registerWingsComponent, registerWingsDataset, fetchWingsRunStatus, WingsTemplateSeed, expandAndRunWingsWorkflow } from "./wings_functions";
import { DataResource } from "screens/datasets/reducers";
import { hideNotification } from "./ui_functions";

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

export const createPathwayExecutableEnsembles = (pathway: Pathway) => {
    // Create executable ensembles 
    let current_ensembles = (pathway.executable_ensembles || []).slice();
    let current_hashes = current_ensembles.map((ensemble) => {
        return _getEnsembleHash(ensemble);
    });
    pathway.executable_ensembles = [];
    
    (Object.keys(pathway.model_ensembles!) || []).map((modelid) => {
        // Get any existing ensemble selection for the model
        let dataEnsemble: DataEnsembleMap = pathway.model_ensembles![modelid] || {};

        let inputBindingsList: InputBindings[] = _crossProductInputs(dataEnsemble);

        inputBindingsList.map((inputBindings) => {
            let ensemble: ExecutableEnsemble = {
                modelid: modelid,
                bindings: inputBindings
            } as ExecutableEnsemble;

            // Note: Keep executable ensembles with existing run ids
            let current_ensemble = _getMatchingEnsemble(current_ensembles, ensemble, current_hashes);
            if (current_ensemble && current_ensemble.runid) {
                //console.log("Found a matching ensemble");
                ensemble.runid = current_ensemble.runid;
                ensemble.results = current_ensemble.results || [];
                ensemble.run_progress = current_ensemble.run_progress;
                ensemble.selected = current_ensemble.selected || false;
            }

            pathway.executable_ensembles!.push(ensemble);
        });
    });
    return pathway;
}

const _createModelTemplate = (
        cname: string,
        prefs: UserPreferences) : Promise<string> => {

    return new Promise((resolve, reject) => {
        loginToWings(prefs).then(() => {
            let config = prefs.wings;
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
        prefs: UserPreferences) : Promise<string[]> => {

    return new Promise((resolve, reject) => {
        loginToWings(prefs).then(() => {
            let config = prefs.wings;
            let expfx = config.export_url + "/export/users/" + config.username + "/" + config.domain;
        
            // Fetch wings template
            let tpl_indices = [];
            let tpl_promises = [];
            let i = 0;
            seeds.map((seed) => {
                if(!tpl_indices[seed.tid]) {
                    tpl_promises.push(fetchWingsTemplate(seed.tid, prefs));
                    tpl_indices[seed.tid] = i++;
                }
            });
            Promise.all(tpl_promises).then((tpl_packages) => {
                let seed_promises = [];
                seeds.map((seed) => {
                    let index = tpl_indices[seed.tid];
                    let tpl_package = tpl_packages[index];

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
            
                    seed_promises.push(expandAndRunWingsWorkflow(tpl_package, 
                        dataBindings, 
                        parameterBindings, 
                        parameterTypes, prefs));
                });
                Promise.all(seed_promises).then((runids) => {
                    resolve(runids);
                })
            })
        })
    });
}

export const runPathwayExecutableEnsembles = async(
        scenario: Scenario, pathway: Pathway, 
        prefs: UserPreferences, indices: number[], shadowRoot: ShadowRoot) => {

    let registered_resources = {};
    let model_indices = {};
    
    let i=0;
    // First Register all models in Wings
    Promise.all(
        Object.keys(pathway.models).map((modelid) => {
            let model = pathway.models[modelid];
            model_indices[modelid] = i;
            i++;
            let cname = model.model_configuration;
            //model.wcm_uri = "https://github.com/varunratnakar/mint-test-comps/blob/master/economic-v6.1-test.zip?raw=true"; // FIXME: Hack
            return registerWingsComponent(cname, model.wcm_uri, prefs);
        })
    ).then((compids) => {
        // Then Create workflow templates for these Models in Wings
        Promise.all(
            compids.map((compid) => {
                let cname = compid.replace(/^.*#/, '');
                return _createModelTemplate(cname, prefs);
            })
        )
        .then((templateids) => {
            // Then execute these workflow templates
            let registerDatasetPromises = [];
            let seeds : WingsTemplateSeed[] = [];

            // Get all input dataset bindings and parameter bindings
            indices.map((index) => {
                let ensemble = pathway.executable_ensembles[index];
                let model = pathway.models[ensemble.modelid];
                let model_index = model_indices[model.id];
                let tid = templateids[model_index];

                let bindings = ensemble.bindings;
                let datasets = {};
                let parameters = {};
                let paramtypes = {};

                // Get input datasets
                model.input_files.map((io) => {
                    let resources : DataResource[] = [];
                    let dsid = null;
                    if(io.value) {
                        dsid = io.value.id;
                        resources = io.value.resources;
                    }
                    else if(bindings[io.id]) {
                        // We have a dataset binding from the user for it
                        let ds = pathway.datasets[bindings[io.id]];
                        dsid = ds.id;
                        resources = io.value.resources;
                    }
                    if(resources.length > 0) {
                        let type = io.type.replace(/^.*#/, '');
                        resources.map((res) => {
                            if(!res.name && res.url) {
                                res.name =  res.url.replace(/^.*(#|\/)/, '');
                                if(!res.id)
                                    res.id = res.name;
                            }
                            if(!registered_resources[res.id])
                                registered_resources[res.id] = [res.name, type, res.url];
                        })
                        datasets[io.name] = resources.map((res) => res.name);
                    }
                });

                // Get Input parameters
                model.input_parameters.map((ip) => {
                    if(ip.value) {
                        let value = ip.value;
                        if(value == "https://w3id.org/okn/i/mint/econ_zero") {
                            value = "0";
                        }
                        parameters[ip.name] = value;
                    }
                    else if(bindings[ip.id]) {
                        let value = bindings[ip.id];
                        parameters[ip.name] = value;
                    }
                    paramtypes[ip.name] = ip.type;
                });

                // Register any datasets that need to be registered
                for(let resid in registered_resources) {
                    let args = registered_resources[resid];
                    registerDatasetPromises.push(registerWingsDataset(resid, args[0], args[1], args[2], prefs));
                }
                seeds.push({
                    tid: tid,
                    datasets: datasets,
                    parameters: parameters,
                    paramtypes: paramtypes
                } as WingsTemplateSeed);
            })

            // Register all datasets
            Promise.all(registerDatasetPromises).then(() => {
                // Now run all model templates
                _runModelTemplates(seeds, prefs).then((runids) => {
                    let i=0;
                    indices.map((index) => {
                        // Set run ids of each ensemble, and initialize the status
                        let ensemble = pathway.executable_ensembles[index];
                        ensemble.runid = runids[i];
                        ensemble.status = "WAITING";
                        ensemble.run_progress = 0;
                        pathway.executable_ensembles[index] = ensemble;
                        i++;
                    });
                    updatePathway(scenario, pathway);
                    hideNotification("runNotification", shadowRoot);
                    //checkPathwayEnsembleStatus(scenario, pathway, prefs);
                });
            });
        });
    });
};

export const runPathwayExecutableEnsembles_old = (
        scenario: Scenario, pathway: Pathway, 
        prefs: UserPreferences, indices: number[]) => {
    let clearTimer = setInterval(() => {
        let alldone = true;
        indices.map((index) => {
            let ensemble = pathway.executable_ensembles![index];
            if(!ensemble.runid) {
                ensemble.runid = Math.random() + "";
            }
            if (!ensemble.run_progress) {
                ensemble.run_progress = 0;
            }
            ensemble.run_progress += Math.random() * 0.25;
            if(ensemble.run_progress >= 1) {
                ensemble.run_progress = 1;
                let model = pathway.models![ensemble.modelid];
                
                ensemble.results = 
                Object.keys(model.output_files).filter((ioid) => {
                    return matchVariables(pathway.response_variables, model.output_files[ioid].variables, false); // Partial match
                })
                .map((ioid) => { return model.output_files[ioid].id + "_" + Math.floor(Math.random()*10000) + ".tar.gz" });
            }
            else {
                alldone = false;
            }
        });
        if(alldone) {
            clearInterval(clearTimer);
        }

        updatePathway(scenario, pathway);        
    }, 1000);
};

const ensembleNotDone = (ensemble: ExecutableEnsemble) => {
    return !ensemble.status || ensemble.status == "RUNNING" || ensemble.status == "WAITING";
}

const pathwayExecutionMonitor = {};

export const checkPathwayEnsembleStatus = (scenario: Scenario, pathway: Pathway, prefs: UserPreferences) => {
    /* Check if some ensembles need to be monitored or not */
    let alldone = true;
    if(pathway == null) return;
    pathway.executable_ensembles.map((ensemble) => {
        if(ensemble.runid && ensembleNotDone(ensemble)) {
            alldone = false;
        }
    });
    if(alldone) {
        stopMonitoringPathwayExecutions(pathway.id);
        return;
    }

    // If we area already monitoring the pathway, then return
    if(pathwayExecutionMonitor[pathway.id]) {
        return;
    }

    // Set a timer for regular monitoring of pathway executions
    pathwayExecutionMonitor[pathway.id] = setInterval(() => {
        if(pathway == null) {
            stopMonitoringPathwayExecutions(pathway.id);
            return;
        }
        loginToWings(prefs).then(() => {
            Promise.all(
                pathway.executable_ensembles.map((ensemble) => {
                    if(ensembleNotDone(ensemble)) {
                        return fetchWingsRunStatus(ensemble, prefs);
                    }
                })
            ).then((nensembles) => {
                let alldone = true;
                let changed = false;
                let i=0;
                pathway.executable_ensembles.map((ensemble) => {
                    if(ensembleNotDone(ensemble)) {
                        let nensemble = nensembles[i];
                        if(!nensemble || !ensemble) {
                            return;
                        }
                        if(nensemble.run_progress != ensemble.run_progress ||
                                nensemble.status != ensemble.status) {
                            ensemble.status = nensemble.status;
                            ensemble.run_progress = nensemble.run_progress;
                            ensemble.results = nensemble.results;
                            changed = true;
                        }
                        if(ensembleNotDone(nensemble)) 
                            alldone = false;
                    }
                    i++;
                });
                if(changed) {
                    console.log("Run details changed.. updating pathway");
                    updatePathway(scenario, pathway);
                }
                if(alldone) {
                    console.log("All runs finished.. stop polling");
                    stopMonitoringPathwayExecutions(pathway.id);
                }
            })
        })
    }, 15000);
}

export const stopMonitoringPathwayExecutions = (pathwayid: string) => {
    if(pathwayExecutionMonitor[pathwayid]) {
        clearInterval(pathwayExecutionMonitor[pathwayid]);
        delete pathwayExecutionMonitor[pathwayid];
    }
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
    if (pathway.executable_ensembles) {
        if (pathway.executable_ensembles.length > 0) {
            for(let i=0; i<pathway.executable_ensembles.length; i++) {
                if(!pathway.executable_ensembles[i].runid 
                    || (pathway.executable_ensembles[i].run_progress! < 1))
                    return TASK_PARTLY_DONE;
            }
            return TASK_DONE;
        }
    }
    return TASK_NOT_STARTED;
}

export const getPathwayResultsStatus = (pathway:Pathway) => {
    if (pathway.executable_ensembles) {
        if (pathway.executable_ensembles.length > 0) {
            for(let i=0; i<pathway.executable_ensembles.length; i++) {
                if(pathway.executable_ensembles[i].selected)
                    return TASK_DONE;
            }
        }
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
        if(state.ui && state.ui.selected_pathwayid) {
            return state.modeling.scenario.pathways[state.ui.selected_pathwayid];
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

const _getMatchingEnsemble = (ensembles: ExecutableEnsemble[], execution: ExecutableEnsemble, hashes: string[]) => {
    let hash = _getEnsembleHash(execution);
    let index = hashes.indexOf(hash);
    if(index >= 0) {
        return ensembles[index];
    }
    return null;
}

const _getEnsembleHash = (ensemble: ExecutableEnsemble) => {
    let str = ensemble.modelid;
    let varids = Object.keys(ensemble.bindings).sort();
    varids.map((varid) => {
        str += varid + "=" + ensemble.bindings[varid] + "&";
    })
    return str;
}
/* End of Helper Functions */