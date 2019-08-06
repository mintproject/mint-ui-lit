const API_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries/";
export const RESOURCE_PREFIX = "https://w3id.org/okn/i/mint/";

export const VER_AND_CONF = "VER_AND_CONF";
export const MODELS = "MODELS";
export const GET_IO = "GET_IO"; //change name?
export const CONFIG_PARAMETERS = "CONFIG_PARAMETERS";
export const IO_VARS_AND_UNITS = 'IO_VARS_AND_UNITS';
export const EXPLANATION_DIAGRAMS = 'EXPLANATION_DIAGRAMS';
export const COMPATIBLE_INPUT = 'COMPATIBLE_INPUT';
export const COMPATIBLE_OUTPUT = 'COMPATIBLE_OUTPUT';
export const MODEL_METADATA = 'MODEL_METADATA';
export const GET_PARAMETERS = 'GET_PARAMETERS';
// Added by Varun
export const GET_CALIBRATIONS_FOR_VARIABLE = 'GET_CALIBRATIONS_FOR_VARIABLE';
export const CONFIG_IO_VARS_STDNAMES = 'CONFIG_IO_VARS_STDNAMES';

interface ApiRule {
    newKey?: string; //could be a function
    newValue? (value:string): any
}

interface ApiBaseParam<T> {
    type: T,
    rules?: {[key:string]: ApiRule}
};
interface ApiModelParam<T> extends ApiBaseParam<T> { model: string }
interface ApiConfigParam<T> extends ApiBaseParam<T> { config: string }
interface ApiIOParam<T> extends ApiBaseParam<T> {io: string};

interface ApiModelsParams extends ApiBaseParam<'MODELS'> {};
interface ApiVersionParams extends ApiModelParam<'VER_AND_CONF'> {};
interface ApiIOParams extends ApiConfigParam<'GET_IO'> {};
interface ModelParametersParams extends ApiConfigParam<'CONFIG_PARAMETERS'> {};
interface IOVarUnitsParams extends ApiIOParam<'IO_VARS_AND_UNITS'> {};
interface ConfExplDiagParams extends ApiBaseParam<'EXPLANATION_DIAGRAMS'> {v: string};
interface CompInputParams extends ApiConfigParam<'COMPATIBLE_INPUT'> {};
interface CompOutputParams extends ApiConfigParam<'COMPATIBLE_OUTPUT'> {};
interface ModelMetadataParams extends ApiBaseParam<'MODEL_METADATA'> {modelConfig: string};
interface ConfigParametersParams extends ApiConfigParam<'GET_PARAMETERS'> {};
// Added by Varun
interface CalibrationsForVariable extends ApiBaseParam<'GET_CALIBRATIONS_FOR_VARIABLE'> {std: string};
interface ConfigIOVarsStandardNames extends ApiConfigParam<'CONFIG_IO_VARS_STDNAMES'> {};

type ApiParams = ApiVersionParams | ApiModelsParams | ApiIOParams | ModelParametersParams | ConfigParametersParams |
                 IOVarUnitsParams | ConfExplDiagParams | CompInputParams | CompOutputParams | ModelMetadataParams |
                 CalibrationsForVariable | ConfigIOVarsStandardNames;

interface ConfigEntry {
    path: string,
    mandatory: string[],
};

const config = {
    MODELS: {path: 'getModels', mandatory: []},
    VER_AND_CONF: {path: 'getModelVersionAndConfigsForModel', mandatory: ['model']},
    GET_IO: {path: 'getConfigI_OVariables', mandatory: ['config']},
    CONFIG_PARAMETERS: {path: 'getConfigIParameters', mandatory: ['config']},
    IO_VARS_AND_UNITS: {path: 'getI_OVariablesAndUnits', mandatory: ['io']},
    EXPLANATION_DIAGRAMS: {path: 'getExplanationDiagramsForResource', mandatory: ['v']},
    COMPATIBLE_OUTPUT: {path: 'getOutputCompatibleConfig', mandatory: ['config']},
    COMPATIBLE_INPUT: {path: 'getInputCompatibleConfig', mandatory: ['config']},
    MODEL_METADATA: {path: 'getModelConfigurationMetadata', mandatory: ['modelConfig']},
    GET_PARAMETERS: {path: 'getConfigIParameters', mandatory: ['config']},
    // Added by Varun
    CONFIG_IO_VARS_STDNAMES: {path: 'getConfigI_OVariablesAndStandardNames', mandatory: ['config']},
    GET_CALIBRATIONS_FOR_VARIABLE: {path: 'getCalibratedModelConfigurationsForVariable', mandatory: ['std']}
}

const createUrl = (params: ApiParams) : string => {
    let cfg : ConfigEntry = config[params.type]
    let url : URL = new URL(API_URI + cfg.path);
    
    cfg.mandatory.forEach( key => {
        url.searchParams.append(key, params[key]);
    });

    return String(url);
}

export const apiFetch = (params: ApiParams) : Promise<any> => {
    let url = createUrl(params);

    return new Promise( (resolve, reject) => {
        fetch(url).then((response:any) => {
            response.json().then((jr:any) => {
                let bindings = jr["results"]["bindings"];
                let data = bindings.map((obj:any) => {
                    return Object.keys(obj).reduce((acc, key) => {
                        if (params.rules && params.rules[key]) {
                            let f = params.rules[key].newValue;
                            acc[params.rules[key].newKey || key] = f ? f(obj[key].value) : obj[key].value;
                        } else {
                            acc[key] = obj[key].value;
                        }
                        return acc;
                    }, {});
                });
                resolve(data);
            })
        }).catch( (e:any) => {
            reject(e);
        });

    });
};
