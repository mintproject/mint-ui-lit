import { Action, ActionCreator } from "redux";
import { GraphQL } from "config/graphql";
import { ThunkAction } from "redux-thunk";
import { RootState } from "app/store";
import { Emulator } from "@mintproject/modelcatalog_client";

import modelTypesQuery from "../../queries/emulator/model-types.graphql";
import modelExecutionsQuery from "../../queries/emulator/model-executions.graphql";
import threadExecutionsQuery from "../../queries/emulator/thread-executions.graphql";
import { auth } from "config/firebase";

export const EMULATORS_LIST = 'EMULATORS_LIST_MODELS';
export const EMULATORS_SELECT_MODEL = 'EMULATORS_SELECT_MODEL';
export const EMULATORS_LIST_EMULATORS_FOR_MODEL = 'EMULATORS_LIST_EMULATORS_FOR_MODEL';
export const EMULATORS_LIST_THREAD_EXECUTIONS_JSON = 'EMULATORS_LIST_THREAD_EXECUTIONS_JSON';

export interface EmulatorsActionListModels extends Action<'EMULATORS_LIST_MODELS'> {
    loading: boolean,
    models?: string[]
};
export interface EmulatorsActionSelectModel extends Action<'EMULATORS_SELECT_MODEL'> {
    selected_model: string
};
export interface EmulatorsActionListEmulatorsForModel extends Action<'EMULATORS_LIST_EMULATORS_FOR_MODEL'> {
    model: string,
    loading: boolean,
    emulators?: Emulator[]
};
export interface EmulatorsActionListThreadExecutionsJson extends Action<'EMULATORS_LIST_THREAD_EXECUTIONS_JSON'> {
    threadid: string,
    loading: boolean,
    json: string
};

export type EmulatorsAction = EmulatorsActionListModels | EmulatorsActionListEmulatorsForModel | EmulatorsActionSelectModel | EmulatorsActionListThreadExecutionsJson;

const MODEL_PREFIX = "https://w3id.org/okn/i/mint/";

type ListModelsThunkAction = ThunkAction<void, RootState, undefined, EmulatorsActionListModels>;
export const listEmulatorModelTypes: ActionCreator<ListModelsThunkAction> = (regionid) => (dispatch) => {
    let APOLLO_CLIENT = GraphQL.instance(auth);
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
    });
    dispatch({
        type: EMULATORS_LIST,
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
                type: EMULATORS_LIST_EMULATORS_FOR_MODEL,
                emulators: null,
                model: model,
                loading: false
            });
        }
        let executions = result.data.model.filter((item: any) => 
            item.thread_models.length > 0)
        dispatch({
            type: EMULATORS_LIST_EMULATORS_FOR_MODEL,
            model: model,
            emulators: executions,
            loading: false
        });
    });
    dispatch({
        type: EMULATORS_LIST_EMULATORS_FOR_MODEL,
        loading: true,
        model: model,
        emulators: null
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
        let json = JSON.stringify(result);
        dispatch({
            type: EMULATORS_LIST_THREAD_EXECUTIONS_JSON,
            threadid: threadid,
            json: json,
            loading: false
        });
    });
    dispatch({
        type: EMULATORS_LIST_THREAD_EXECUTIONS_JSON,
        threadid: threadid,
        loading: true,
        json: null
    });
}