const API_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries/";
export const RESOURCE_PREFIX = "https://w3id.org/okn/i/mint/";

export const VERSIONS_FOR_MODEL = "VERSIONS_FOR_MODEL";
export const MODELS = "MODELS";
export const IO_AND_VARS_SN_FOR_CONFIG = "IO_AND_VARS_SN_FOR_CONFIG";
export const VARS_SN_AND_UNITS_FOR_IO = 'VARS_SN_AND_UNITS_FOR_IO';
export const DIAGRAMS_FOR_MODEL_CONFIG = 'DIAGRAMS_FOR_MODEL_CONFIG';
export const INPUT_COMPATIBLE_FOR_CONFIG = 'INPUT_COMPATIBLE_FOR_CONFIG';
export const OUTPUT_COMPATIBLE_FOR_CONFIG = 'OUTPUT_COMPATIBLE_FOR_CONFIG';
export const METADATA_FOR_MODEL_CONFIG = 'METADATA_FOR_MODEL_CONFIG';
export const PARAMETERS_FOR_CONFIG = 'PARAMETERS_FOR_CONFIG';
export const SEARCH_MODEL_BY_VAR_SN = 'SEARCH_MODEL_BY_VAR_SN';
// Added by Varun
export const METADATA_NOIO_FOR_MODEL_CONFIG = 'METADATA_NOIO_FOR_MODEL_CONFIG';
export const CONFIGS_FOR_VAR_SN = 'CONFIGS_FOR_VAR_SN';
export const CALIBRATIONS_FOR_VAR_SN = 'CALIBRATIONS_FOR_VAR_SN';

interface ApiRule {
    newKey?: string; //maybe should be a function
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
interface ApiVersionParams extends ApiModelParam<'VERSIONS_FOR_MODEL'> {};
interface ApiIOParams extends ApiConfigParam<'IO_AND_VARS_SN_FOR_CONFIG'> {};
interface IOVarUnitsParams extends ApiIOParam<'VARS_SN_AND_UNITS_FOR_IO'> {};
interface ConfExplDiagParams extends ApiBaseParam<'DIAGRAMS_FOR_MODEL_CONFIG'> {v: string};
interface CompInputParams extends ApiConfigParam<'INPUT_COMPATIBLE_FOR_CONFIG'> {};
interface CompOutputParams extends ApiConfigParam<'OUTPUT_COMPATIBLE_FOR_CONFIG'> {};
interface ModelMetadataParams extends ApiBaseParam<'METADATA_FOR_MODEL_CONFIG'> {modelConfig: string};
interface ConfigParametersParams extends ApiConfigParam<'PARAMETERS_FOR_CONFIG'> {};
interface SearchByVariableName extends ApiBaseParam<'SEARCH_MODEL_BY_VAR_SN'> {text: string};
// Added by Varun
interface ModelMetadataNOIOParams extends ApiBaseParam<'METADATA_NOIO_FOR_MODEL_CONFIG'> {modelConfig: string};
interface ConfigsForVariable extends ApiBaseParam<'CONFIGS_FOR_VAR_SN'> {std: string};
interface CalibrationsForVariable extends ApiBaseParam<'CALIBRATIONS_FOR_VAR_SN'> {std: string};

type ApiParams = ApiVersionParams | ApiModelsParams | ApiIOParams | ConfigParametersParams |
                 IOVarUnitsParams | ConfExplDiagParams | CompInputParams | CompOutputParams | ModelMetadataParams |
                 ModelMetadataNOIOParams | CalibrationsForVariable | ConfigsForVariable | 
                 SearchByVariableName;

interface ConfigEntry {
    path: string,
    mandatory: string[],
};

const config = {
    MODELS: {path: 'getModels', mandatory: []},
    VERSIONS_FOR_MODEL: {path: 'getModelVersionAndConfigsForModel', mandatory: ['model']},
    IO_AND_VARS_SN_FOR_CONFIG: {path: 'getConfigI_OVariablesAndStandardNames', mandatory: ['config']},
    VARS_SN_AND_UNITS_FOR_IO: {path: 'getI_OVariablesAndUnits', mandatory: ['io']},
    DIAGRAMS_FOR_MODEL_CONFIG: {path: 'getExplanationDiagramsForResource', mandatory: ['v']},
    OUTPUT_COMPATIBLE_FOR_CONFIG: {path: 'getOutputCompatibleConfig', mandatory: ['config']},
    INPUT_COMPATIBLE_FOR_CONFIG: {path: 'getInputCompatibleConfig', mandatory: ['config']},
    METADATA_FOR_MODEL_CONFIG: {path: 'getModelConfigurationMetadata', mandatory: ['modelConfig']},
    PARAMETERS_FOR_CONFIG: {path: 'getConfigIParameters', mandatory: ['config']},
    SEARCH_MODEL_BY_VAR_SN : {path: 'searchVariablesAndReturnModel', mandatory: ['text']},
    // Added by Varun
    METADATA_NOIO_FOR_MODEL_CONFIG: {path: 'getModelConfigurationMetadata_NoIO', mandatory: ['modelConfig']},
    CALIBRATIONS_FOR_VAR_SN: {path: 'getCalibratedModelConfigurationsForVariable', mandatory: ['std']},
    CONFIGS_FOR_VAR_SN: {path: 'getModelConfigurationsForVariable', mandatory: ['std']}
}

const createUrl = (params: ApiParams) : string => {
    let cfg : ConfigEntry = config[params.type]
    let url : URL = new URL(API_URI + cfg.path);
    
    cfg.mandatory.forEach( key => {
        url.searchParams.append(key, params[key]);
    });

    return String(url);
}

let cache = {}

export const apiFetch = (params: ApiParams) : Promise<any> => {
    let url = createUrl(params);

    if (!cache[url]) {
        console.log('fetching', url);
        cache[url] = new Promise( (resolve, reject) => {
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
    }
    return cache[url];
};
