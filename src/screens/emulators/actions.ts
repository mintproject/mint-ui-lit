import { Action, ActionCreator } from "redux";
import { GraphQL } from "config/graphql";
import { ThunkAction } from "redux-thunk";
import { RootState } from "app/store";
import { Emulator } from "@mintproject/modelcatalog_client";

import modelTypesQuery from "../../queries/emulator/model-types.graphql";
import modelExecutionsQuery from "../../queries/emulator/model-executions.graphql";
import threadExecutionsQuery from "../../queries/emulator/thread-executions.graphql";

import modelTypeIOQuery from "../../queries/emulator/get-model-type-io.graphql";
import modelTypeInputValuesQuery from "../../queries/emulator/get-model-input-values.graphql";
import modelTypeParameterValuesQuery from "../../queries/emulator/get-model-parameter-values.graphql";

import executionInfoFragment from "../../queries/fragments/emulator-execution-info.graphql";
import modelTypeConfigsQuery from "../../queries/emulator/get-model-type-configs.graphql";
import modelConfigInputsQuery from "../../queries/emulator/get-model-config-inputs.graphql";

import { auth } from "config/firebase";
import { EmulatorModelIO, EmulatorSearchConstraint } from "./reducers";
import { DataResource } from "screens/datasets/reducers";
import { executionFromGQL, resourceFromGQL } from "util/graphql_adapter";
import { gql } from "@apollo/client";

export const EMULATORS_LIST = 'EMULATORS_LIST_MODELS';
export const EMULATORS_SELECT_MODEL = 'EMULATORS_SELECT_MODEL';
export const EMULATORS_LIST_EXECUTIONS_FOR_MODEL = 'EMULATORS_LIST_EXECUTIONS_FOR_MODEL';
export const EMULATORS_LIST_THREAD_EXECUTIONS_JSON = 'EMULATORS_LIST_THREAD_EXECUTIONS_JSON';
export const EMULATORS_LIST_MODEL_IO = 'EMULATORS_LIST_MODEL_IO';
export const EMULATORS_LIST_MODEL_INPUT_DATA_VALUES = 'EMULATORS_LIST_MODEL_INPUT_DATA_VALUES';
export const EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES = 'EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES';
export const EMULATORS_LIST_EXECUTIONS_FOR_FILTER = 'EMULATORS_LIST_EXECUTIONS_FOR_FILTER';
export const EMULATORS_NUM_EXECUTIONS_FOR_FILTER = 'EMULATORS_NUM_EXECUTIONS_FOR_FILTER';

export interface EmulatorsActionListModels extends Action<'EMULATORS_LIST_MODELS'> {
    loading: boolean,
    models?: string[]
};
export interface EmulatorsActionSelectModel extends Action<'EMULATORS_SELECT_MODEL'> {
    selected_model: string
};
export interface EmulatorsActionListEmulatorsForModel extends Action<'EMULATORS_LIST_EXECUTIONS_FOR_MODEL'> {
    model: string,
    loading: boolean,
    emulators?: any[]
};
export interface EmulatorsActionListEmulatorsForFilter extends Action<'EMULATORS_LIST_EXECUTIONS_FOR_FILTER'> {
    model: string,
    loading: boolean,
    filtered_emulators?: any[]
};
export interface EmulatorsActionNumEmulatorsForFilter extends Action<'EMULATORS_NUM_EXECUTIONS_FOR_FILTER'> {
    model: string,
    loading: boolean,
    num_filtered_emulators?: number
};
export interface EmulatorsActionListThreadExecutionsJson extends Action<'EMULATORS_LIST_THREAD_EXECUTIONS_JSON'> {
    threadid: string,
    loading: boolean,
    json: string
};
export interface EmulatorsActionListModelIO extends Action<'EMULATORS_LIST_MODEL_IO'> {
    model: string,
    loading: boolean,
    inputs?: EmulatorModelIO[]
};
export interface EmulatorsActionListModelInputDataValues extends Action<'EMULATORS_LIST_MODEL_INPUT_DATA_VALUES'> {
    model: string,
    input: string,
    loading: boolean,
    values?: DataResource[]
};
export interface EmulatorsActionListModelInputParamValues extends Action<'EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES'> {
    model: string,
    input: string,
    loading: boolean,
    values?: any[]
};

export type EmulatorsAction = EmulatorsActionListModels | EmulatorsActionListEmulatorsForModel | 
    EmulatorsActionListEmulatorsForFilter | EmulatorsActionNumEmulatorsForFilter | 
    EmulatorsActionSelectModel | 
    EmulatorsActionListThreadExecutionsJson | EmulatorsActionListModelIO | 
    EmulatorsActionListModelInputDataValues | EmulatorsActionListModelInputParamValues;

const MODEL_PREFIX = "https://w3id.org/okn/i/mint/";

type ListModelsThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListModels>;
export const listEmulatorModelTypes: ActionCreator<ListModelsThunkAction> = (regionid) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    console.log
    APOLLO_CLIENT.query({
        query: modelTypesQuery,
        variables: {
            regionId: regionid
        }
    }).then((result) => {
        if(result.error) {
            dispatch({
                type: EMULATORS_LIST,
                models: null,
                loading: false
            });
        }
        else {
            let types = result.data.execution.map((m:any) => 
                m.model.model_name.replace(MODEL_PREFIX, ""));
            types = types.filter((item: string, pos: number) => 
                item && (types.indexOf(item) == pos));
            types.sort();
            dispatch({
                type: EMULATORS_LIST,
                models: types,
                loading: false
            });
        }
    });
    dispatch({
        type: EMULATORS_LIST,
        models: null,
        loading: true
    });
}

type ListEmulatorsThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListEmulatorsForModel>;
export const searchEmulatorsForModel: ActionCreator<ListEmulatorsThunkAction> = 
        (model: string, regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    APOLLO_CLIENT.query({
        query: modelExecutionsQuery,
        variables: {
            modelTypes: [model, MODEL_PREFIX + model],
            regionId: regionid
        }
    }).then((result) => {
        if(result.error) {
            dispatch({
                type: EMULATORS_LIST_EXECUTIONS_FOR_MODEL,
                emulators: null,
                model: model,
                loading: false
            });
        }
        else {
            let executions = result.data.model.filter((item: any) => 
                item.thread_models.length > 0)
            dispatch({
                type: EMULATORS_LIST_EXECUTIONS_FOR_MODEL,
                model: model,
                emulators: executions,
                loading: false
            });
        }
    });
    dispatch({
        type: EMULATORS_LIST_EXECUTIONS_FOR_MODEL,
        loading: true,
        model: model,
        emulators: null
    });
}

const getExecutionWhereClauseForFilter = (filters: EmulatorSearchConstraint[]) => {
    let query = " where: {";
    query += "status: {_eq: \"SUCCESS\"}\n"
    query += "thread_model_executions: {thread_model: {model: {model_name: {_eq: $modelType}}, thread: {_or: [{region_id: {_eq: $regionId}}, {region: {parent_region_id: {_eq: $regionId}}}]}}}";
    query += "_and: [ ";
    query += filters.filter((filter) => filter.inputtype == "parameter").map((filter) => {
        return "{  _or: [ " + 
            "{ parameter_bindings: {" + 
            " model_parameter: { name: { _eq: \"" + filter.input +"\"} } " +
            " parameter_value: {_in: [ " + filter.values.map((v) => "\"" + v + "\"") + " ]}\n" +
            "}}\n" +
            "{ model: { parameters: {" + 
            " name: { _eq: \"" + filter.input +"\"} " +
            " fixed_value: {_in: [ " + filter.values.map((v) => "\"" + v + "\"") + " ]}\n" +
            "}}}\n" +
            "]}\n";
    });
    query += filters.filter((filter) => filter.inputtype == "input").map((filter) => {
        return "{  _or: [ " + 
        "{ data_bindings: {" + 
        " model_io: { name: { _eq: \"" + filter.input +"\"} }" +
        " resource_id: {_in: [ " + filter.values.map((v) => "\"" + v.id + "\"") + " ]}\n" +
        "}}\n" +
        "{ model: { inputs: { model_io: {" + 
        " name: { _eq: \"" + filter.input +"\"} " +
        " fixed_bindings: { resource_id: {_in: [ " + filter.values.map((v) => "\"" + v.id + "\"") + " ]}}\n" +
        "}}}}\n" +
        "]}\n";
    });
    query += " ]\n";
    query += "}\n";
    return query;
}

type NumFilteredEmulatorsThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionNumEmulatorsForFilter>;
export const getNumEmulatorsForFilter: ActionCreator<NumFilteredEmulatorsThunkAction> = 
        (model: string, regionid: string, filters: EmulatorSearchConstraint[]) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    // Create a dynamic query based on the filters
    let query = "query executions_for_parameter_values($regionId:String!, $modelType:String!) { \n" +
            " execution_aggregate ( \n" + 
            getExecutionWhereClauseForFilter(filters) + 
            " ) {\n" +
            " aggregate { count }\n" +
            "}}\n";
    APOLLO_CLIENT.query({
        query: gql`${query}`,
        variables: {
            modelType: MODEL_PREFIX + model,
            regionId: regionid
        }
    }).then((result) => {
        if(result.error) {
            dispatch({
                type: EMULATORS_NUM_EXECUTIONS_FOR_FILTER,
                num_filtered_emulators: 0,
                model: model,
                loading: false
            });
        }
        else {
            dispatch({
                type: EMULATORS_NUM_EXECUTIONS_FOR_FILTER,
                model: model,
                num_filtered_emulators: result.data.execution_aggregate.aggregate.count,
                loading: false
            });
        }
    });
    dispatch({
        type: EMULATORS_NUM_EXECUTIONS_FOR_FILTER,
        loading: true,
        model: model,
        num_filtered_emulators: 0
    });
}

type ListFilteredEmulatorsThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListEmulatorsForFilter>;
export const searchEmulatorsForFilter: ActionCreator<ListFilteredEmulatorsThunkAction> = 
        (model: string, regionid: string, filters: EmulatorSearchConstraint[], 
            start: number, limit: number, order_by: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    // Create a dynamic query based on the filters
    let fragment = executionInfoFragment;
    let queryString = fragment.loc.source.body + "\n" + 
            "query executions_for_parameter_values($regionId:String!, $modelType:String!) { \n" +
            " execution ( \n" + 
            " limit: " + (limit ? limit : 100) + "\n" +
            " offset: " + (start ? start : 0) + "\n" +
            (order_by ? " order_by: [ " + order_by + " ]\n" : "") +
            getExecutionWhereClauseForFilter(filters) + "\n" +
            " ) {\n" +
            " ...emulator_execution_info \n" +
            "}}\n";
    let query = gql`${queryString}`;
    APOLLO_CLIENT.query({
        query: query,
        variables: {
            modelType: MODEL_PREFIX + model,
            regionId: regionid
        }
    }).then((result) => {
        if(result.error) {
            dispatch({
                type: EMULATORS_LIST_EXECUTIONS_FOR_FILTER,
                filtered_emulators: null,
                model: model,
                loading: false
            });
        }
        else {
            let executions = result.data.execution.map((ex:any) => executionFromGQL(ex, true));
            dispatch({
                type: EMULATORS_LIST_EXECUTIONS_FOR_FILTER,
                model: model,
                filtered_emulators: executions,
                loading: false
            });
        }
    });
    dispatch({
        type: EMULATORS_LIST_EXECUTIONS_FOR_FILTER,
        loading: true,
        model: model,
        filtered_emulators: null
    });
}

export const selectEmulatorModel: ActionCreator<EmulatorsActionSelectModel> = (model: string) => {
    return {
        type: EMULATORS_SELECT_MODEL,
        selected_model: model
    }
}

type ListExecutionsJsonThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListThreadExecutionsJson>;
export const getThreadExecutionsJSON: ActionCreator<ListExecutionsJsonThunkAction> = 
        (threadid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    APOLLO_CLIENT.query({
        query: threadExecutionsQuery,
        variables: {
            threadId: threadid
        }
    }).then((result) => {
        if(result.error) {
            dispatch({
                type: EMULATORS_LIST_THREAD_EXECUTIONS_JSON,
                threadid: threadid,
                json: null,
                loading: false
            });
        }
        else {
            let json = JSON.stringify(result);
            dispatch({
                type: EMULATORS_LIST_THREAD_EXECUTIONS_JSON,
                threadid: threadid,
                json: json,
                loading: false
            });
        }
    });
    dispatch({
        type: EMULATORS_LIST_THREAD_EXECUTIONS_JSON,
        threadid: threadid,
        loading: true,
        json: null
    });
}

type ListModelIOThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListModelIO>;
export const listModelTypeIO: ActionCreator<ListModelIOThunkAction> = 
        (model: string, regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    APOLLO_CLIENT.query({
        query: modelTypeIOQuery,
        variables: {
            regionId: regionid,
            modelType: MODEL_PREFIX + model
        }
    }).then((result) => {
        if(result.error) {
            console.log(result.error);
            dispatch({
                type: EMULATORS_LIST_MODEL_IO,
                loading: false,
                model: model,
                inputs: null
            });
        }
        else {
            let modelIO : EmulatorModelIO[] = [];
            result.data.model_inputs.forEach((io) => {
                modelIO.push({
                    name: io["name"],
                    datatype: io["type"],
                    type: "input"
                });
            })
            result.data.model_outputs.forEach((io) => {
                modelIO.push({
                    name: io["name"],
                    datatype: io["type"],
                    type: "output"
                });
            })
            result.data.model_parameter.forEach((param) => {
                modelIO.push({
                    name: param["name"],
                    datatype: param["datatype"],
                    type: "parameter"
                });
            })
            dispatch({
                type: EMULATORS_LIST_MODEL_IO,
                loading: false,
                model: model,
                inputs: modelIO
            });
        }
    });

    dispatch({
        type: EMULATORS_LIST_MODEL_IO,
        loading: true,
        model: model,
        inputs: null
    });
}

const convertType = (value: string, type: string) => {
    if(type == "int") {
        return parseInt(value);
    }
    else if(type == "float") {
        return parseFloat(value);
    }
    else if(type == "boolean") {
        return Boolean(value.toLowerCase() == "true");
    }
    else {
        return value;
    }
}

type ListModelInputParamValuesThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListModelInputParamValues>;
export const listModelTypeInputParamValues: ActionCreator<ListModelInputParamValuesThunkAction> = 
        (model: string, input: EmulatorModelIO, regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    APOLLO_CLIENT.query({
        query: modelTypeParameterValuesQuery,
        variables: {
            regionId: regionid,
            modelType: MODEL_PREFIX + model,
            inputName: input.name
        }
    }).then((result) => {
        if(result.error) {
            console.log(result.error);
            dispatch({
                type: EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES,
                loading: false,
                model: model,
                input: input.name,
                values: null
            });
        }
        else {
            let values : any[] = [];
            result.data.model_parameter.forEach((param) => {
                if(param.fixed_value != null)
                    values.push(convertType(param.fixed_value, input.datatype));
                param.execution_parameter_bindings.forEach((binding) => {
                    values.push(convertType(binding.parameter_value, input.datatype));
                })
            })
            values = values.filter((item: any, pos: number) => 
                item && (values.indexOf(item) == pos));
            if(input.datatype == "int" || input.datatype == "float") {
                values = values.sort((a, b) => a - b);
            }
            else {
                values = values.sort();
            }
            dispatch({
                type: EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES,
                loading: false,
                model: model,
                input: input.name,
                values: values
            });
        }
    });

    dispatch({
        type: EMULATORS_LIST_MODEL_INPUT_PARAM_VALUES,
        loading: true,
        model: model,
        input: input.name,
        values: null
    });
}

type ListModelInputDataValuesThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListModelInputDataValues>;
export const listModelTypeInputDataValues: ActionCreator<ListModelInputDataValuesThunkAction> = 
        (model: string, input: EmulatorModelIO, regionid: string) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
    APOLLO_CLIENT.query({
        query: modelTypeInputValuesQuery,
        variables: {
            regionId: regionid,
            modelType: MODEL_PREFIX + model,
            inputName: input.name
        }
    }).then((result) => {
        if(result.error) {
            console.log(result.error);
            dispatch({
                type: EMULATORS_LIST_MODEL_INPUT_DATA_VALUES,
                loading: false,
                model: model,
                input: input.name,
                values: null
            });
        }
        else {
            let valueMap : Map<string, DataResource> = {} as Map<string, DataResource>;
            result.data.model_io.forEach((io) => {
                if(io.fixed_bindings != null) {
                    io.fixed_bindings.forEach((binding) => {
                        valueMap[binding.resource.id] = resourceFromGQL(binding.resource);
                    });
                }
                io.execution_data_bindings.forEach((binding) => {
                    if(binding.resource != null)
                        valueMap[binding.resource.id] = resourceFromGQL(binding.resource);
                });
            })
            let values = Object.values(valueMap);
            values = values.sort((a, b)=>{return a.name < b.name ? -1 : 1});  
            dispatch({
                type: EMULATORS_LIST_MODEL_INPUT_DATA_VALUES,
                loading: false,
                model: model,
                input: input.name,
                values: values
            });
        }
    });

    dispatch({
        type: EMULATORS_LIST_MODEL_INPUT_DATA_VALUES,
        loading: true,
        model: model,
        input: input.name,
        values: null
    });
}