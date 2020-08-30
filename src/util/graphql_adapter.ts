import { Task, Thread, ProblemStatement, ProblemStatementDetails, ThreadInfo, MintEvent, ModelEnsembleMap, DataEnsembleMap, Execution, ExecutionSummary } from "../screens/modeling/reducers"
import { fromTimeStamp } from "util/date-utils";
import { auth } from "config/firebase";
import { Model, ModelIO, ModelParameter } from "screens/models/reducers";
import { Dataset, DataResource } from "screens/datasets/reducers";
import { Region } from "screens/regions/reducers";

export const regionToGQL = (region: Region) => {
    let regionobj = {
        id: region.id,
        name: region.name,
        category_id: region.category_id,
        geojson_blob: JSON.parse(region.geojson_blob),
        model_catalog_uri: region.model_catalog_uri
    };
    return regionobj;
}

export const regionFromGQL = (regionobj: any) : Region => {
    let region = {
        id: regionobj.id,
        name: regionobj.name,
        category_id: regionobj.category_id,
        geojson_blob: JSON.stringify(regionobj.geojson_blob),
        model_catalog_uri: regionobj.model_catalog_uri
    } as Region;
    return region;
}

export const problemStatementToGQL = (problem_statement: ProblemStatement) => {
    let problemobj = {
        name: problem_statement.name,
        start_date: fromTimeStamp(problem_statement.dates.start_date),
        end_date: fromTimeStamp(problem_statement.dates.end_date),
        region_id: problem_statement.regionid,
        events: {
            data: problem_statement.events
        }
    };
    return problemobj;
}

export const problemStatementUpdateToGQL = (problem_statement: ProblemStatement) => {
    let problemobj = {
        id: problem_statement.id,
        name: problem_statement.name,
        start_date: fromTimeStamp(problem_statement.dates.start_date),
        end_date: fromTimeStamp(problem_statement.dates.end_date),
        region_id: problem_statement.regionid,
        events: {
            data: problem_statement.events
        }
    };
    return problemobj;
}

export const problemStatementFromGQL = (problem: any) : ProblemStatementDetails => {
    let details = {
        id : problem["id"],
        regionid: problem["region_id"],
        name: problem["name"],
        dates: {
            start_date: problem["start_date"],
            end_date: problem["end_date"]
        },
        events: problem["events"],
        tasks: {}
    } as ProblemStatementDetails;
    if(problem["tasks"]) {
        problem["tasks"].forEach((task:any) => {
            let fbtask = taskFromGQL(task);
            details.tasks[fbtask.id] = fbtask;
        })
    }
    return details;
}

export const taskToGQL = (task: Task, problem_statement: ProblemStatement) => {
    let taskGQL = {
        name: task.name,
        problem_statement_id: problem_statement.id,
        start_date: fromTimeStamp(task.dates.start_date),
        end_date: fromTimeStamp(task.dates.end_date),
        region_id: task.regionid,
        response_variable_id: task.response_variables[0],
        driving_variable_id: task.driving_variables.length > 0 ? task.driving_variables[0] : null,
        events: {
            data: task.events
        }
    };
    return taskGQL;
}

export const taskUpdateToGQL = (task: Task) => {
    let taskGQL = {
        id: task.id,
        name: task.name,
        start_date: fromTimeStamp(task.dates.start_date),
        end_date: fromTimeStamp(task.dates.end_date),
        region_id: task.regionid,
        response_variable_id: task.response_variables[0],
        driving_variable_id: task.driving_variables.length > 0 ? task.driving_variables[0] : null,
        events: {
            data: task.events
        }
    };
    
    return taskGQL;
}

export const taskFromGQL = (task: any) : Task => {
    let taskobj = {
        id : task["id"],
        regionid: task["region_id"],
        name: task["name"],
        dates: {
            start_date: task["start_date"],
            end_date: task["end_date"]
        },
        threads: {},
        driving_variables: task.driving_variable_id != null ? [task.driving_variable_id] : [],
        response_variables: task.response_variable_id != null ? [task.response_variable_id] : [],
        events: task["events"]
    } as Task;
    if(task["threads"]) {
        task["threads"].forEach((thread:any) => {
            let fbthread = threadInfoFromGQL(thread);
            taskobj.threads[fbthread.id] = fbthread;
        });
    }
    return taskobj;
}

export const threadToGQL = (thread: Thread, task: Task) => {
    let threadobj = {
        id: thread.id,
        name: thread.name,
        task_id: task.id,
        start_date: fromTimeStamp(thread.dates.start_date),
        end_date: fromTimeStamp(thread.dates.end_date),
        region_id: task.regionid,
        response_variable_id: thread.response_variables[0],
        driving_variable_id: thread.driving_variables.length > 0 ? thread.driving_variables[0] : null,
        events: {
            data: thread.events
        }
    };
    return threadobj;
}

export const threadUpdateToGQL = (thread: Thread) => {
    let threadobj = {
        name: thread.name,
        start_date: fromTimeStamp(thread.dates.start_date),
        end_date: fromTimeStamp(thread.dates.end_date),
        response_variable_id: thread.response_variables[0],
        driving_variable_id: thread.driving_variables.length > 0 ? thread.driving_variables[0] : null,
        events: {
            data: thread.events
        }
    };
    return threadobj;
}

export const threadFromGQL = (thread: any) => {
    let fbthread = {
        id : thread["id"],
        regionid: thread["region_id"],
        name: thread["name"],
        dates: {
            start_date: thread["start_date"],
            end_date: thread["end_date"]
        },
        driving_variables: thread.driving_variable_id != null ? [thread.driving_variable_id] : [],
        response_variables: thread.response_variable_id != null ? [thread.response_variable_id] : [],
        execution_summary: {},
        events: thread["events"],
        models: {},
        datasets: {},
        model_ensembles: {}
    } as Thread;
    
    thread["thread_data"].forEach((tm:any) => {
        let m = tm["dataslice"];
        let data : Dataset = dataFromGQL(m);
        fbthread.datasets[data.id] = data;
    })

    thread["thread_models"].forEach((tm:any) => {
        let m = tm["model"];
        let model : Model = modelFromGQL(m);
        // **************** TODO: FIXME: ****************** 
        // Fix this. Store configuration in DB
        model.model_configuration = model.model_version;

        fbthread.models[model.id] = model;
        let model_ensemble = modelEnsembleFromGQL(tm["data_bindings"], tm["parameter_bindings"]);
        fbthread.model_ensembles[model.id] = model_ensemble;

        let totalconfigs = getTotalConfigs(model, model_ensemble, fbthread);
        fbthread.execution_summary[model.id] = {
            total_runs: totalconfigs,
            submitted_runs: tm["submitted_runs"]["aggregate"]["count"],
            successful_runs: tm["successful_runs"]["aggregate"]["count"],
            failed_runs: tm["failed_runs"]["aggregate"]["count"],
            submitted_for_execution: tm["submitted_runs"]["aggregate"]["count"] > 0
        } as ExecutionSummary
    })

    return fbthread;
}

export const getTotalConfigs = (model: Model, bindings: DataEnsembleMap, thread: Thread) => {
    let totalconfigs = 1;
    model.input_files.map((io) => {
        if(!io.value) {
            // Expand a dataset to it's constituent resources
            // FIXME: Create a collection if the model input has dimensionality of 1
            if(bindings[io.id]) {
                let nensemble : any[] = [];
                bindings[io.id].map((dsid) => {
                    let ds = thread.datasets[dsid];
                    let selected_resources = ds.resources.filter((res) => res.selected);
                    // Fix for older saved resources
                    if(selected_resources.length == 0) 
                        selected_resources = ds.resources;
                    nensemble = nensemble.concat(selected_resources);
                });
                totalconfigs *= nensemble.length;
            }
        }
        else {
            totalconfigs *= (io.value.resources as any[]).length;
        }
    })
    
    // Add adjustable parameters to the input ids
    model.input_parameters.map((io) => {
        if(!io.value)
            totalconfigs *= bindings[io.id].length;
    });

    return totalconfigs;
}

export const dataFromGQL = (d: any) => {
    let ds = d["dataset"];
    return {
        id: d["id"],
        name: ds["name"],
        resources: d["resources"],
        resource_count: d["resources"].length
    } as Dataset;
}

export const modelFromGQL = (m: any) => {
    m.input_files = (m["inputs"] as any[]).map((input) => {
        return modelIOFromGQL(input);
    });
    delete m["inputs"];
    m.output_files = (m["outputs"] as any[]).map((output) => {
        return modelIOFromGQL(output);
    });
    delete m["outputs"];
    m.input_parameters = (m["parameters"] as any[]).map((parameter) => {
        return modelParameterFromGQL(parameter);
    });
    delete m["parameters"];
    return m;
}

export const modelIOFromGQL = (model_io: any) => {
    let io = model_io["model_io"];
    let fixed_ds = (io["fixed_bindings"] && io["fixed_bindings"].length > 0) ? 
        {
            id: io.id + "_fixed_dataset",
            name: io.name + "_fixed_dataset",
            resources: io["fixed_bindings"].map((res:any) => {
                return res["resource"]
            })
        } as Dataset
        : null;
    return {
        id: io["id"],
        name: io["name"],
        type: io["type"],
        value: fixed_ds,
        position: model_io["position"],
        variables: io["variables"].map((varobj:any) => {
            let v = varobj["variable"];
            return v["id"];
        })
    } as ModelIO
}

export const modelParameterFromGQL = (p: any) => {
    return {
        id: p["id"],
        name: p["name"],
        type: p["type"],
        accepted_values: p["accepted_values"],
        adjustment_variable: p["adjustment_variable"],
        default: p["default"],
        description: p["description"],
        max: p["max"],
        min: p["min"],
        unit: p["unit"],
        value: p["value"],
        position: p["position"]
    } as ModelParameter
}

export const modelEnsembleFromGQL = (dbs: any[], pbs: any[]): DataEnsembleMap => {
    let bindings = {} as DataEnsembleMap;
    dbs.forEach((db) => {
        let binding = bindings[db["model_io"]["id"]];
        if(!binding)
            binding = [];
        binding.push(db["dataslice_id"]);
        bindings[db["model_io"]["id"]] = binding;
    })
    pbs.forEach((pb) => {
        let binding = bindings[pb["model_parameter"]["id"]];
        if(!binding)
            binding = [];
        binding.push(pb["parameter_value"]);
        bindings[pb["model_parameter"]["id"]] = binding;        
    })
    return bindings;
}

export const threadInfoToGQL = (thread: ThreadInfo, taskid: string, regionid: string) => {
    let threadobj = {
        name: thread.name,
        task_id: taskid,
        start_date: fromTimeStamp(thread.dates.start_date),
        end_date: fromTimeStamp(thread.dates.end_date),
        region_id: regionid,
        events: {
            data: thread.events
        }
    };
    return threadobj;
}

export const threadInfoFromGQL = (thread: any) => {
    return {
        id : thread["id"],
        name: thread["name"],
        dates: {
            start_date: thread["start_date"],
            end_date: thread["end_date"]
        },
        events: thread["events"]
    } as ThreadInfo;
}

export const executionToGQL = (ex: Execution) => {
    return null;
}

export const executionFromGQL = (ex: any) : Execution => {
    let exobj = {
        id: ex.id,
        modelid: ex.model_id,
        status: ex.status,
        submission_time: ex.start_time,
        execution_engine: ex.execution_engine,
        run_progress: ex.run_progress,
        runid: ex.run_id,
        bindings: {},
        results: {}
    } as Execution;
    ex.parameter_bindings.forEach((param:any) => {
        exobj.bindings[param.model_parameter_id] = param.parameter_value;
    });
    ex.data_bindings.forEach((data:any) => {
        exobj.bindings[data.model_io_id] = data.resource as DataResource;
    });
    ex.results.forEach((data:any) => {
        exobj.results[data.model_output_id] = data.resource as DataResource;
    });
    return exobj;
}

export const getCreateEvent = (notes: string) => {
    return {
        event: "CREATE",
        timestamp: new Date(),
        userid: auth.currentUser.email,
        notes: notes
    } as MintEvent;
}

export const getUpdateEvent = (notes: string) => {
    return {
        event: "UPDATE",
        timestamp: new Date(),
        userid: auth.currentUser.email,
        notes: notes
    } as MintEvent;
}

export const getCustomEvent = (event:string, notes: string) => {
    return {
        event: event,
        timestamp: new Date(),
        userid: auth.currentUser.email,
        notes: notes
    } as MintEvent;
}