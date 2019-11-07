import { UserPreferences, IdMap, IdNameObject } from "app/reducers";
import { getResource, postFormResource, postJSONResource } from "./mint-requests";
import { resolve, reject } from "q";
import { ExecutableEnsemble } from "screens/modeling/reducers";

/* Defining all Wings Types */
export interface WingsTemplatePackage {
    template: WingsTemplate,
    constraints: WingsTemplateConstraint[]
}
export interface WingsTemplateConstraint {
    subject: any,
    predicate: any,
    object: any
}
export interface WingsTemplate extends IdNameObject {
    Nodes: IdMap<WingsNode>,
    Links: IdMap<WingsLink>,
    Variables: IdMap<WingsDataVariable | WingsParameterVariable>,
    inputRoles: IdMap<WingsPortRole>,
    outputRoles: IdMap<WingsPortRole>,

    version: number,
    onturl: string,
    wflowns: string,
    props: Object,
    rules: Object,
    subtemplates: Object,
    metadata: WingsTemplateMetadata,
}
export interface WingsTemplateMetadata {
    contributors: string[],
    createdFrom: string[],
    lastUpdateTime: string,
    documentation: string
}
export interface WingsNode extends IdNameObject {
    inputPorts: IdMap<WingsPort>,
    outputPorts: IdMap<WingsPort>,
    componentVariable: WingsComponentVariable,
    crule: WingsNodeRule,
    prule: WingsNodeRule,
}
export interface WingsNodeRule {
    type: "STYPE" | "WTYPE",
    expr?: WingsNodeRuleExpression
}
export interface WingsNodeRuleExpression {
    op?: "XPRODUCT" | "NWISE" | "SHIFT" | "REDUCEDIM" | "INCREASEDIM",
    args?: string[] | WingsNodeRuleExpression[]
}

export interface WingsVariable extends IdNameObject {
    type: number,
    comment: string,
    binding: URIBinding | URIBinding[] | ValueBinding | ValueBinding[],
    autofill: boolean,
    breakpoint: boolean
}

export interface WingsDataVariable extends WingsVariable {
    type: 1,
    unknown?: boolean,
    inactive?: boolean,
    derivedFrom?: string,
    binding: URIBinding[] | URIBinding
}

export interface WingsParameterVariable extends WingsVariable {
    type: 2,
    unknown?: boolean,
    inactive?: boolean,
    derivedFrom?: string,
    binding: ValueBinding[] | ValueBinding
}

export interface WingsComponentVariable extends WingsVariable {
    type: 3,
    isConcrete: boolean,
    binding: URIBinding
}

export interface WingsComponent extends IdNameObject {
    type: number,
    binding: URIBinding,
    inputs: WingsComponentArgument[],
    outputs: WingsComponentArgument[],
    rules: string[],
    inheritedRules: string[],
    requirement: WingsComponentRequirement
}
export interface WingsComponentArgument extends IdNameObject {
    type: string,
    role: string,
    prefix: string,
    isParam?: boolean,
    dimensionality?: number,
    paramDefaultValue?: any
}
export interface WingsComponentRequirement {
    storageGB: number,
    memoryGB: number,
    needs64bit: boolean,
    softwareIds: string[]
}

export interface WingsPort extends IdNameObject {
    role: WingsPortRole,
}
export interface WingsPortRole extends IdNameObject {
    type: number,
    roleid: string,
    dimensionality?: number
}

export interface WingsLink extends IdNameObject {
    fromNode?: IdNameObject,
    toNode?: IdNameObject,
    fromPort?: IdNameObject,
    toPort?: IdNameObject,
    variable?: IdNameObject
}

export interface URIBinding extends IdNameObject {
    type: string
}
export interface ValueBinding {
    type: string,
    value: any
}

export interface WingsPlannerResults {
    success: boolean,
    data: WingsPlannerData
}
export interface WingsPlannerData {
    explanations: string[],
    error: boolean,
}
export interface WingsPlannerExpansionsResults extends WingsPlannerResults{
    data: WingsWorkflowExpansions
}
export interface WingsWorkflowExpansions extends WingsPlannerData {
    seed: WingsTemplatePackage,
    templates: WingsTemplatePackage[]
}

export interface WingsDataBindings {
    [inputid: string] : string[]
}
export interface WingsParameterBindings {
    [inputid: string] : string
}
export interface WingsParameterTypes {
    [inputid: string] : string
}

export interface WingsTemplateSeed {
    tid?: string,
    datasets: Object,
    parameters: Object,
    paramtypes: Object,
}


/* End of Wings Types */


export const loginToWings = async(config: UserPreferences) : Promise<void> => {
    let config_wings = config.mint.wings;
    return new Promise<void>((resolve, reject) => {
        getResource({
            url: config_wings.server + '/login',
            onLoad: function(e: any) {
              var txt = e.target.responseText;
              if(txt.match(/j_security_check/)) {
                var data = {
                  j_username: config_wings.username,
                  j_password: config_wings.password
                };
                postFormResource({
                  url: config_wings.server + '/j_security_check',
                  onLoad: function(e2: any) {
                    var txt2 = e2.target.responseText;
                    if(txt2.match(/j_security_check/)) {
                        reject("Incorrect Login");
                    }
                    else {
                      // Success: Logged in
                      resolve();
                      //console.log("Success !! Logged in");
                    }
                  },
                  onError: function() {
                    //console.log("Cannot login");
                    getResource({
                      url: config_wings.server + '/login',
                      onLoad: function(e2: any) {
                        var match = /USER_ID\s*=\s*"(.+)"\s*;/.exec(e2.target.responseText);
                        if(match) {
                          let userid = match[1];
                          resolve();
                          console.log("Logged in as " + userid + " !");
                        }
                      },
                      onError: function(){
                          reject("Cannot load login page");
                      }
                    }, true);
                  }
                }, data, true);
              } else {
                var match = /USER_ID\s*=\s*"(.+)"\s*;/.exec(txt);
                if(match) {
                  let userid = match[1];
                  resolve();
                  console.log("Already Logged in as " + userid + " !");
                }
              }
            },
            onError: function(e: any) {
                reject("Cannot connect to Wings");
                //console.log("Cannot connect to wings");
            }
          }, true);
    });
}

export const fetchWingsComponent = async(cname: string, config: UserPreferences) : Promise<WingsComponent> => {
    let config_wings = config.mint.wings;
    return new Promise<WingsComponent>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var exurl = config_wings.export_url + "/export/users/" + config_wings.username + "/" + config_wings.domain;
        var cid = exurl + "/components/library.owl#" + cname;

        getResource({
            url: purl + "/components/getComponentJSON?cid=" + escape(cid),
            onLoad: function(e: any) {
                let comp = JSON.parse(e.target.responseText) as WingsComponent;
                resolve(comp);
            },
            onError: function(e: any) {
                reject("Could not get component");
            }
        }, true);
    });
}

export const logoutFromWings = async(config: UserPreferences) : Promise<void> => {
    let config_wings = config.mint.wings;
    return new Promise<void>((resolve, reject) => {
        getResource({
        url: config_wings.server + '/jsp/login/logout.jsp',
        onLoad: function(e: any) {
            resolve();
            //console.log("Logged out");
        },
        onError: function(e: any) {
            reject("Could not logout !");
            //console.log("Could not logout !");
        }
        }, true);
    });
}

export const fetchWingsTemplatesList = async(config: UserPreferences) : Promise<string[]> => {
    let config_wings = config.mint.wings;
    return new Promise<string[]>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        getResource({
            url: purl + "/workflows/getTemplatesListJSON",
            onLoad: function(e: any) {
                let list = JSON.parse(e.target.responseText)
                resolve(list);
            },
            onError: function(e: any) {
                reject("Could not get templates list");
            }
        }, true);
    });
}

export const fetchWingsTemplate = async(tid: string, config: UserPreferences) : Promise<WingsTemplatePackage> => {
    let config_wings = config.mint.wings;
    return new Promise<WingsTemplatePackage>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        //var exurl = config_wings.export_url + "/export/users/" + config_wings.username + "/" + config_wings.domain;
        //var tid = exurl + "/workflows/" + tname + ".owl#" + tname;

        getResource({
            url: purl + "/workflows/getEditorJSON?template_id=" + escape(tid),
            onLoad: function(e: any) {
                let tpl = JSON.parse(e.target.responseText) as WingsTemplatePackage;
                resolve(tpl);
            },
            onError: function(e: any) {
                reject("Could not get template");
            }
        }, true);
    });
}

export const saveWingsTemplate = async(tpl: WingsTemplatePackage, config: UserPreferences) : Promise<void> => {
    //TODO: Get a MD5 Hash for template to check if it is already saved.
    // - To avoid cluttering up template library

    let config_wings = config.mint.wings;
    // Get url prefix for operations
    return new Promise<void>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var data = {
            template_id: tpl.template.id,
            constraints_json: JSON.stringify(tpl.constraints),
            json: JSON.stringify(tpl.template)
        };
        postFormResource({
            url: purl + "/workflows/saveTemplateJSON",
            onLoad: function(e: any) {
                resolve();
            },
            onError: function() {
                reject("Cannot save");
            }
        }, data, true);
    });
}


export const layoutWingsTemplate = async(tpl: WingsTemplate, config: UserPreferences) 
        : Promise<WingsTemplatePackage> => {
    
    let config_wings = config.mint.wings;
    return new Promise<WingsTemplatePackage>((resolve, reject) => {
        // Get url prefix for operations
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        postJSONResource({
            url: purl + "/workflows/layoutTemplate",
            onLoad: function(e: any) {
                var ntpl = JSON.parse(e.target.responseText) as WingsTemplatePackage;
                resolve(ntpl);
            },
            onError: function() {
                reject("Cannot layout template");
            }
        }, tpl, true);
    });
}

export const elaborateWingsTemplate = async(tpl: WingsTemplatePackage, config: UserPreferences) 
        : Promise<WingsTemplate> => {
    
    let config_wings = config.mint.wings;
    return new Promise<WingsTemplate>((resolve, reject) => {
        // Get url prefix for operations
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var data = {
            template_id: tpl.template.id,
            constraints_json: JSON.stringify(tpl.constraints),
            json: JSON.stringify(tpl.template)
        }
        postFormResource({
            url: purl + "/plan/elaborateTemplateJSON",
            onLoad: function(e:any) {
                var ntpl = JSON.parse(e.target.responseText) as WingsTemplate;
                resolve(ntpl);
            },
            onError: function() {
                reject("Cannot elaborate template");
            }
        }, data, true);
    });
}

const _getComponentBindings = (tpl: WingsTemplatePackage) => {
    var cbindings = {};
    for(var nid in tpl.template.Nodes) {
        var c = tpl.template.Nodes[nid].componentVariable;
        cbindings[c.id] = c.binding.id;
    }
    return cbindings;
}

export const getWingsExpandedTemplates = async(
    tpl: WingsTemplatePackage, 
    dataBindings: WingsDataBindings,
    parameterBindings: WingsParameterBindings,
    parameterTypes: WingsParameterBindings,
    config: UserPreferences) 
        : Promise<WingsWorkflowExpansions> => {

    let config_wings = config.mint.wings;
    return new Promise<WingsWorkflowExpansions>((resolve, reject) => {
        // Get url prefix for operations
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var data = {
            templateId: tpl.template.id,
            parameterBindings: parameterBindings,
            parameterTypes: parameterTypes,
            componentBindings: _getComponentBindings(tpl),
            dataBindings: dataBindings            
        }
        postJSONResource({
            url: purl + "/plan/getExpansions",
            onLoad: function(e: any) {
                var results = JSON.parse(e.target.responseText) as WingsPlannerExpansionsResults;
                if(results.success) {
                    resolve(results.data);
                }
                else {
                    reject(results.data.explanations.join("\n"));
                }
              },
              onError: function() {
                reject("Cannot get expansions");
              }
            }, 
        data, true);
    });
}

export const executeWingsExpandedWorkflow = async(xtpl: WingsTemplatePackage, 
    seed: WingsTemplatePackage, config: UserPreferences) 
        : Promise<string> => {

    let config_wings = config.mint.wings;
    return new Promise<string>((resolve, reject) => {
        // Get url prefix for operations
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var data = {
            template_id: seed.template.id,
            json: JSON.stringify(xtpl.template),
            constraints_json: JSON.stringify(xtpl.constraints),
            seed_json: JSON.stringify(seed.template),
            seed_constraints_json: JSON.stringify(seed.constraints)
        }
        postFormResource({
            url: purl + "/executions/runWorkflow",
            onLoad: function(e: any) {
                var runid = e.target.responseText;
                resolve(runid);
              },
              onError: function() {
                reject("Cannot run workflow");
              }
            }, 
        data, true);
    });
}

export const expandAndRunWingsWorkflow = async(
    tpl: WingsTemplatePackage, 
    dataBindings: WingsDataBindings,
    parameterBindings: WingsParameterBindings,
    parameterTypes: WingsParameterBindings,
    config: UserPreferences) 
        : Promise<string> => {

    let config_wings = config.mint.wings;
    return new Promise<string>((resolve, reject) => {
        // Get url prefix for operations
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        var data = {
            templateId: tpl.template.id,
            parameterBindings: parameterBindings,
            parameterTypes: parameterTypes,
            componentBindings: _getComponentBindings(tpl),
            dataBindings: dataBindings            
        }
        postJSONResource({
            url: purl + "/executions/expandAndRunWorkflow",
            onLoad: function(e: any) {
                var runid = e.target.responseText;
                if(runid) {
                    resolve(runid);
                }
                else {
                    reject("Could not run workflow");
                }
              },
              onError: function() {
                reject("Cannot run workflow");
              }
            }, 
        data, true);
    });
}

export const executeWingsWorkflow = async(
        tpl_package : WingsTemplatePackage, 
        dataBindings: WingsDataBindings,
        parameterBindings: WingsParameterBindings,
        parameterTypes: WingsParameterBindings,
        prefs: UserPreferences) : Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        getWingsExpandedTemplates(tpl_package, dataBindings, 
            parameterBindings, parameterTypes, prefs).then((expansions) => {
                if(!expansions.error) {
                    executeWingsExpandedWorkflow(expansions.templates[0], expansions.seed, prefs).then((runid) => {
                        resolve(runid);
                    })
                }
        });
    });
}

export const fetchWingsRunsStatuses = (template_name: string, start_time: number, total_runs: number, config: UserPreferences) 
        : Promise<Map<string, any>> => {
    return new Promise<Map<string, any>>((resolve, reject) => {
        let statuses = {} as Map<string, any>;
        let promises = [];
        for(let i=0; i<total_runs; i+= 500) {
            promises.push(_fetchWingsRunsStatuses(template_name, start_time, i, 500, config));
        }
        Promise.all(promises).then((vals) => {
            vals.map((val) => {
                statuses =  Object.assign({}, statuses, val); 
            });
            resolve(statuses);
        })
    })
}

const _fetchWingsRunsStatuses = (template_name: string, start_time: number, start: number, limit: number, config: UserPreferences)
        : Promise<Map<string, any>> => {
    
    let config_wings = config.mint.wings;
    return new Promise<Map<string, any>>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        getResource({
            url: purl + "/executions/getRunListSimple?pattern="+template_name+"&start="+start+"&limit="+limit+"&sort=startTime&dir=ASC&started_after="+start_time,
            onLoad: function(e: any) {
                let runsjson = JSON.parse(e.target.responseText);
                if(runsjson.success) {
                    let statuses: Map<string, string> = {} as Map<string, string>;
                    let runslist : any[] = runsjson.rows;
                    runslist.map((runjson) => {
                        let runid = runjson.id;
                        statuses[runid] = runjson.runtimeInfo;
                    })
                    resolve(statuses);
                }
            },
            onError: function() {
                reject("Cannot fetch runs");
            }
        }, true);
    });
}

export const fetchWingsRunStatus = (ensemble: ExecutableEnsemble, config: UserPreferences)
        : Promise<ExecutableEnsemble> => {

    let config_wings = config.mint.wings;
    return new Promise<ExecutableEnsemble>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        if(!ensemble.runid) {
            reject();
            return;
        }

        let data = {
            run_id: ensemble.runid,
        };
        postFormResource({
            url: purl + "/executions/getRunPlan",
            onLoad: function(e: any) {
                let ex = JSON.parse(e.target.responseText);
                let nensemble = Object.assign({}, ensemble);
                nensemble.status = ex.runtimeInfo.status;
                if(!ex.queue) 
                    return;
                let totalsteps = ex.queue.steps.length;
                let numdone = 0;
                ex.queue.steps.map((step: any) => {
                    if(step.runtimeInfo.status == "SUCCESS") {
                        numdone ++;
                    }
                });
                nensemble.run_progress = numdone/totalsteps;
                nensemble.results = [];
                if(nensemble.status == "SUCCESS") {
                    nensemble.run_progress = 1;
                    
                    // Look for outputs that aren't inputs to any other steps
                    let outputfiles = {};
                    ex.plan.steps.map((step: any) => {
                        step.outputFiles.map((file: any) => {
                            outputfiles[file.id] = file;
                        })
                    })
                    ex.plan.steps.map((step: any) => {
                        step.inputFiles.map((file: any) => {
                            delete outputfiles[file.id];
                        })
                    })
                    nensemble.results = Object.values(outputfiles);
                }
                resolve(nensemble);
            },
            onError: function() {
                reject("Cannot create component");
            }
        }, data, true);
    });
}

export const fetchWingsRunResults = (ensemble: ExecutableEnsemble, config: UserPreferences)
        : Promise<any> => {

    let config_wings = config.mint.wings;
    return new Promise<any>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        if(!ensemble.runid) {
            reject();
            return;
        }

        let data = {
            run_id: ensemble.runid,
        };
        postFormResource({
            url: purl + "/executions/getRunPlan",
            onLoad: function(e: any) {
                let ex = JSON.parse(e.target.responseText);
                if(ensemble.status == "SUCCESS") {                    
                    // Look for outputs that aren't inputs to any other steps
                    let outputfiles = {};
                    ex.plan.steps.map((step: any) => {
                        step.outputFiles.map((file: any) => {
                            outputfiles[file.id] = file;
                        })
                    })
                    ex.plan.steps.map((step: any) => {
                        step.inputFiles.map((file: any) => {
                            delete outputfiles[file.id];
                        })
                    })
                    resolve(outputfiles);
                }
            },
            onError: function() {
                reject("Cannot get run details");
            }
        }, data, true);
    });
}

export const fetchWingsRunLog = (runid: string, config: UserPreferences)
        : Promise<any> => {

    let config_wings = config.mint.wings;
    return new Promise<any>((resolve, reject) => {
        var purl = config_wings.server + "/users/" + config_wings.username + "/" + config_wings.domain;
        let data = {
            run_id: runid,
        };
        postFormResource({
            url: purl + "/executions/getRunDetails",
            onLoad: function(e: any) {
                let response = JSON.parse(e.target.responseText);
                let ex = response.execution;
                let log = ex.runtimeInfo.log;
                log += "\n----------------------------------------------\n";
                ex.queue.steps.map((step: any) => {
                    log += step.id.replace(/.*#/, '') + "\n"
                    log += step.runtimeInfo.log;
                    log += "\n----------------------------------------------\n";
                })
                resolve(log);
            },
            onError: function() {
                reject("Cannot get run details");
            }
        }, data, true);
    });
}

export const createSingleComponentTemplate = (comp: WingsComponent, config: UserPreferences) : WingsTemplate => {
    let config_wings = config.mint.wings;
    var cname = comp.id.replace(/^.+#/, '');
    var exurl = config_wings.export_url + "/export/users/" + config_wings.username + "/" + config_wings.domain;
    var tname = "workflow_" + cname;
    var tns = exurl + "/workflows/" + tname + ".owl#";
    var tid = tns + tname;

    var storage = config_wings.storage;
    var dotpath = config_wings.dotpath;
    var ontpfx = config_wings.onturl;

    var clibns = exurl + "/components/library.owl#";
    var usfx = "/users/" + config_wings.username + "/" + config_wings.domain;
    var purl = config_wings.server + usfx;
    var pdir = storage + usfx;

    let tpl : WingsTemplate = {
        id: tid,
        Nodes: {},
        Links: {},
        Variables: {},
        inputRoles: {},
        outputRoles: {},
        onturl: ontpfx + "/workflow.owl",
        wflowns: ontpfx + "/workflow.owl#",
        version: 0,
        subtemplates: {},
        metadata: {
            documentation: "",
            contributors: []
        } as WingsTemplateMetadata,
        rules: {},
        props: {
          "lib.concrete.url": exurl + "/components/library.owl",
          "lib.domain.execution.url": exurl + "/executions/library.owl",
          "lib.domain.code.storage": pdir + "/code/library",
          "domain.workflows.dir.url": exurl + "/workflows",
          "user.id": config_wings.username,
          "tdb.repository.dir": storage + "/TDB",
          "viewer.id": config_wings.username,
          "domain.executions.dir.url": exurl + "/executions",
          "lib.domain.data.url": exurl + "/data/library.owl",
          "ont.domain.data.url": exurl + "/data/ontology.owl",
          "lib.abstract.url": exurl + "/components/abstract.owl",
          "lib.provenance.url": config_wings.export_url + "/export/common/provenance/library.owl",
          "ont.data.url": ontpfx + "/data.owl",
          "lib.domain.data.storage": pdir + "/data",
          "lib.domain.workflow.url": exurl + "/workflows/library.owl",
          "lib.resource.url": config_wings.export_url + "/export/common/resource/library.owl",
          "ont.component.url": ontpfx + "/component.owl",
          "ont.workflow.url": ontpfx + "/workflow.owl",
          "ont.dir.url": ontpfx,
          "dot.path": dotpath,
          "ont.domain.component.ns": clibns,
          "ont.execution.url": ontpfx + "/execution.owl",
          "ont.resource.url": ontpfx + "/resource.owl"
        }
    };

    let nodeid = tns + cname + "_node";
    let inputPorts : IdMap<WingsPort> = {};
    let outputPorts : IdMap<WingsPort> = {};

    comp.inputs.map((arg) => {
        let portid = nodeid + "_" + arg.role;
        inputPorts[portid] = {
            id: portid,
            role: {
                type: arg.isParam ? 2 : 1,
                roleid: arg.role,
                dimensionality: arg.dimensionality,
                id: portid + "_role"
            } as WingsPortRole
        }
        let varid = tns + arg.role;
        tpl.Variables[varid] = {
            id: varid,
            type: arg.isParam ? 2 : 1,
        } as WingsDataVariable | WingsParameterVariable;

        tpl.inputRoles[varid] = {
            type: arg.isParam ? 2 : 1,
            roleid: portid,
            dimensionality: arg.dimensionality,
            id: varid + "_trole"
        };

        let linkid = portid + "_input";
        tpl.Links[linkid] = {
            id: linkid,
            toNode: { id: nodeid },
            toPort: { id: portid },
            variable: { id: varid }
        }
    });
    comp.outputs.map((arg) => {
        let portid = nodeid + "_" + arg.role;
        outputPorts[portid] = {
            id: portid,
            role: {
                type: arg.isParam ? 2 : 1,
                roleid: arg.role,
                dimensionality: arg.dimensionality,
                id: portid + "_role"
            } as WingsPortRole
        }
        let varid = tns + arg.role;
        tpl.Variables[varid] = {
            id: varid,
            type: arg.isParam ? 2 : 1,
        } as WingsDataVariable | WingsParameterVariable;
        
        tpl.outputRoles[varid] = {
            type: arg.isParam ? 2 : 1,
            roleid: portid,
            dimensionality: arg.dimensionality,
            id: varid + "_trole"
        };

        let linkid = portid + "_output";
        tpl.Links[linkid] = {
            id: linkid,
            fromNode: { id: nodeid },
            fromPort: { id: portid },
            variable: { id: varid }
        }
    });   

    let node : WingsNode = {
        id: nodeid,
        componentVariable: {
            id: nodeid + "_comp",
            isConcrete: true,
            binding: {
                id: comp.id,
                type: "uri"
            },
            type: 3
        } as WingsComponentVariable,
        inputPorts: inputPorts,
        outputPorts: outputPorts,
        crule: {
            type: 'WTYPE'
        },
        prule: {
            type: 'STYPE'
        }
    }
    tpl.Nodes[nodeid] = node;

    return tpl;
}

/* WCM API based Wings calls */
export const registerWingsComponent = async(name: string, uri: string, config: UserPreferences) 
        : Promise<string> => {

    let config_wings = config.mint.wings;
    let data = {
        id: name,
        model_catalog_uri: uri,
        wings_instance: {
            server: config_wings.server,
            export_url: config_wings.export_url,
            domain: config_wings.domain,
            username: config_wings.username,
            password: config_wings.password
        }
    }
    return new Promise<string>((resolve, reject) => {
        postJSONResource({
            url: config_wings.api + "/components",
            onLoad: function(e: any) {
                let compjson = JSON.parse(e.target.responseText);
                resolve(compjson.id);
            },
            onError: function() {
                reject("Cannot create component");
            }
        }, data, false);
    });
}

export const registerWingsDataset = async(dcid: string, name: string, type: string, uri: string, config: UserPreferences) 
        : Promise<void> => {

    let config_wings = config.mint.wings;
    let data = {
        data_catalog_id: dcid,
        id: name,
        type: type,
        url: uri,
        wings_instance: {
            server: config_wings.server,
            export_url: config_wings.export_url,
            domain: config_wings.domain,
            username: config_wings.username,
            password: config_wings.password
        }
    }
    return new Promise<void>((resolve, reject) => {
        postJSONResource({
            url: config_wings.api + "/datasets",
            onLoad: function(e: any) {
                resolve();
            },
            onError: function() {
                reject("Cannot create component");
            }
        }, data, false);
    });
}