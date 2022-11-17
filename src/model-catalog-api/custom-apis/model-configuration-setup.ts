import { IdMap } from 'app/reducers'
import { MCActionAdd, MCActionDelete, MODEL_CATALOG_ADD, MODEL_CATALOG_DELETE, ActionThunk } from '../actions';
import { ModelCatalogTypes } from '../reducers';
import { Configuration, BaseAPI } from '@mintproject/modelcatalog_client';
import { DefaultReduxApi } from '../default-redux-api';
import { ModelConfigurationSetup, ModelConfigurationSetupApi, ModelConfiguration, Parameter } from '@mintproject/modelcatalog_client';
import { ModelCatalogApi } from 'model-catalog-api/model-catalog-api';

export class CustomModelConfigurationSetupApi extends DefaultReduxApi<ModelConfigurationSetup, ModelConfigurationSetupApi> {
    public constructor (ApiType: new (cfg?:Configuration) => ModelConfigurationSetupApi, user:string, config?:Configuration) {
        super(ModelConfigurationSetupApi, user, config);
    }

    private simplePost : ActionThunk<Promise<ModelConfigurationSetup>, MCActionAdd> = this.post;

    public post : ActionThunk<Promise<ModelConfigurationSetup>, MCActionAdd> = (resource:ModelConfigurationSetup, configid:string) => (dispatch) => {
        return new Promise((resolve,reject) => {
            if (!configid) throw("Error creating setup. Invalid parent configuration ID.");
            // Check adjustable parameters.
            if (resource.hasParameter)
                resource.adjustableParameter = resource.hasParameter
                        .filter((p:Parameter) => (p && (!p.hasFixedValue || p.hasFixedValue.length === 0)));
            let setupPost : Promise<ModelConfigurationSetup> = dispatch(this.simplePost(resource));
            setupPost.catch(reject);
            setupPost.then((newSetup:ModelConfigurationSetup) => {
                let parentModelConfigurationGet : Promise<ModelConfiguration> =
                        dispatch(ModelCatalogApi.myCatalog.modelConfigurationSetup.get(configid));
                parentModelConfigurationGet.catch(reject);
                parentModelConfigurationGet.then((config:ModelConfiguration) => {
                    if (config.hasSetup) {
                        config.hasSetup.push(newSetup);
                    } else {
                        config.hasSetup = [ newSetup ];
                    }
                    let parentModelConfigurationPut : Promise<ModelConfiguration> =
                            dispatch(ModelCatalogApi.myCatalog.modelConfiguration.put(config));
                    parentModelConfigurationPut.catch(reject);
                    parentModelConfigurationPut.then((config:ModelConfiguration) => {
                        console.log('config updated!', config);
                        resolve(newSetup);
                    })
                });
            });
        });
    }

    //CUSTOM QUERY
    public getDetails : ActionThunk<Promise<ModelConfigurationSetup>, MCActionAdd> = (uri:string) => (dispatch) => {
        let req : Promise<ModelConfigurationSetup> = this.getDetailsNoRedux(uri);
        if (this._redux) req.then((resp:ModelConfigurationSetup) => {
            dispatch({
                type: MODEL_CATALOG_ADD,
                kind: this.getName(),
                payload: this._idReducer({}, resp)
            });
        });
        return req;
    }

    public getDetailsNoRedux (uri:string) : Promise<ModelConfigurationSetup> {
        let id : string = this._getIdFromUri(uri);
        return this._api.customModelconfigurationsetupsIdGet({username: this._username, id: id});
    }

    public getSetupsByVariableLabel (variableLabel:string) : Promise<ModelConfigurationSetup[]> {
        return this._api.customModelconfigurationsetupsVariableGet({username: this._username, label: variableLabel});
    }
}
