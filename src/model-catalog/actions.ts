import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, DefaultApi, ModelApi, SoftwareVersionApi, ModelConfigurationApi, ParameterApi } from '@mintproject/modelcatalog_client';

function debug () {
    console.log('OBA:', ...arguments);
}

const idReducer = (dic, elem) => {
    dic[elem.id] = elem;
    return dic;
}

const fixLabel = (resource:any) => {
    // for some reason labels are returned in a stringify array
    if (resource.label) {
        return {...resource, label: resource.label.slice(2, resource.label.length - 2)}
    } else {
        return resource;
    }
}

export const MODELS_GET = "MODELS_GET";
interface MCAModelsGet extends Action<'MODELS_GET'> { payload: any };
export const modelsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching models');
    let state: any = store.getState();
    let status = state.app.prefs.modelCatalog.status;
    let token = state.app.prefs.modelCatalog.accessToken;

    if (status === 'DONE') {
        let MApi = new ModelApi();
        MApi.modelsGet({username: 'mint@isi.edu'})
        .then((data) => {
            data = data.map(fixLabel);
            dispatch({
                type: MODELS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getModels', err)})
    } else if (status === 'LOADING') {
        console.log('waiting...')
        dispatch({
            type: 'WAIT_UNTIL',
            predicate: action => (action.type === 'FETCH_MODEL_CATALOG_ACCESS_TOKEN'),
            run: (dispatch, getState, action) => {
                dispatch(modelsGet());
                console.log('dispaching async')
            }
        })
    }
}

export const VERSIONS_GET = "VERSIONS_GET";
interface MCAVersionsGet extends Action<'VERSIONS_GET'> { payload: any };
export const versionsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching versions');
    let api = new SoftwareVersionApi();
    api.softwareversionsGet({username: 'mint@isi.edu'})
        .then((data) => {
            data = data.map(fixLabel);
            dispatch({
                type: VERSIONS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getVersions', err)})
}

export const CONFIGURATIONS_GET = "CONFIGURATIONS_GET";
interface MCAConfigurationsGet extends Action<'CONFIGURATIONS_GET'> { payload: any };
export const configurationsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching configurations');
    let api = new ModelConfigurationApi();
    api.modelconfigurationsGet({username: 'mint@isi.edu'})
        .then((data) => {
            data = data.map(fixLabel);
            dispatch({
                type: CONFIGURATIONS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getConfigs', err)})
}

export const PARAMETER_GET = "PARAMETER_GET";
interface MCAParameterGet extends Action<'PARAMETER_GET'> { payload: any };
export const parameterGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching parameter', uri);
    let id = uri.split('/').pop();
    let api = new ParameterApi();
    api.parametersIdGet({username: 'mint@isi.edu', id: id})
        .then((resp) => {
            let data = {};
            data[uri] = fixLabel(resp);
            dispatch({
                type: PARAMETER_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getParameter', err)})
}

export type ModelCatalogAction = MCAModelsGet | MCAVersionsGet | MCAConfigurationsGet | MCAParameterGet ;
type ModelCatalogThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogAction>;
