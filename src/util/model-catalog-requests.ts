const API_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries/";
export const RESOURCE_PREFIX = "https://w3id.org/okn/i/mint/";

export const MODELS                          = "MODELS";
export const VERSIONS_AND_CONFIGS            = "VERSIONS_AND_CONFIGS";
export const CATEGORIES                      = "CATEGORIES";
export const CONFIGS                         = "CONFIGS";
export const CONFIGS_AND_IOS                 = "CONFIGS_AND_IOS";
export const INPUTS_AND_VARS_SN              = "INPUTS_AND_VARS_SN";
export const OUTPUTS_AND_VARS_SN             = "OUTPUTS_AND_VARS_SN";
export const VARS_AND_SN                     = "VARS_AND_SN";
export const METADATA_FOR_ANY                = "METADATA_FOR_ANY";
export const VERSIONS_FOR_MODEL              = "VERSIONS_FOR_MODEL";
export const VARS_FOR_MODEL                  = "VARS_FOR_MODEL";
export const AUTHORS_FOR_MODEL_CONFIG        = "AUTHORS_FOR_MODEL_CONFIG";
export const GRID_FOR_MODEL_CONFIG           = "GRID_FOR_MODEL_CONFIG";
export const SCREENSHOTS_FOR_MODEL_CONFIG    = "SCREENSHOTS_FOR_MODEL_CONFIG";
export const DIAGRAMS_FOR_MODEL_CONFIG       = "DIAGRAMS_FOR_MODEL_CONFIG";
export const METADATA_FOR_MODEL_CONFIG       = "METADATA_FOR_MODEL_CONFIG";
export const METADATA_NOIO_FOR_MODEL_CONFIG  = "METADATA_NOIO_FOR_MODEL_CONFIG";
export const PARAMETERS_FOR_CONFIG           = "PARAMETERS_FOR_CONFIG";
export const INPUT_COMPATIBLE_FOR_CONFIG     = "INPUT_COMPATIBLE_FOR_CONFIG";
export const OUTPUT_COMPATIBLE_FOR_CONFIG    = "OUTPUT_COMPATIBLE_FOR_CONFIG";
export const IO_FOR_CONFIG                   = "IO_FOR_CONFIG";
export const IO_AND_VARS_SN_FOR_CONFIG       = "IO_AND_VARS_SN_FOR_CONFIG";
export const VARS_SN_AND_UNITS_FOR_IO        = "VARS_SN_AND_UNITS_FOR_IO";
export const CONFIGS_FOR_VAR                 = "CONFIGS_FOR_VAR";
export const CONFIGS_FOR_VAR_SN              = "CONFIGS_FOR_VAR_SN";
export const CALIBRATIONS_FOR_VAR_SN         = "CALIBRATIONS_FOR_VAR_SN";
export const IO_FOR_VAR_SN                   = "IO_FOR_VAR_SN";
export const METADATA_FOR_VAR_SN             = "METADATA_FOR_VAR_SN";
export const PROCESS_FOR_CAG                 = "PROCESS_FOR_CAG";
export const SEARCH_MODEL_BY_NAME            = "SEARCH_MODEL_BY_NAME";
export const SEARCH_MODEL_BY_CATEGORY        = "SEARCH_MODEL_BY_CATEGORY";
export const SEARCH_ANY                      = "SEARCH_ANY";
export const SEARCH_IO                       = "SEARCH_IO";
export const SEARCH_MODEL                    = "SEARCH_MODEL";
export const SEARCH_VAR                      = "SEARCH_VAR";
export const SEARCH_MODEL_BY_VAR_SN          = "SEARCH_MODEL_BY_VAR_SN";

interface ApiRule {
    newKey?: string; //maybe should be a function
    newValue? (value:string): any
}

interface BaseParams<T> {
    type: T,
    rules?: {[key:string]: ApiRule}
};

interface VParams<T> extends BaseParam<T> { v: string }
interface STDParams<T> extends BaseParam<T> { std: string }
interface TextParams<T> extends BaseParam<T> { text: string }
interface ModelParams<T> extends BaseParam<T> { model: string }
interface ConfigParams<T> extends BaseParam<T> { config: string }
interface ModelConfigParams<T> extends BaseParam<T> { modelConfig: string }

interface Models                        extends BaseParams<'MODELS'> {};
interface VersionsAndConfigs            extends BaseParams<'VERSIONS_AND_CONFIGS'> {};
interface Categories                    extends BaseParams<'CATEGORIES'> {};
interface Configs                       extends BaseParams<'CONFIGS'> {};
interface ConfigsAndIOs                 extends BaseParams<'CONFIGS_AND_IOS'> {};
interface InputsAndVarsSN               extends BaseParams<'INPUTS_AND_VARS_SN'> {};
interface OutputsAndVarsSN              extends BaseParams<'OUTPUTS_AND_VARS_SN'> {};
interface VarsAndSN                     extends BaseParams<'VARS_AND_SN'> {};
interface MetadataForAny                extends BaseParams<'METADATA_FOR_ANY'> {mv: string};
interface VersionsForModel              extends ModelParams<'VERSIONS_FOR_MODEL'> {};
interface VarsForModel                  extends ModelParams<'VARS_FOR_MODEL'> {};
interface AuthorsForModelConfig         extends VParams<'AUTHORS_FOR_MODEL_CONFIG'> {};
interface GridForModelConfig            extends VParams<'GRID_FOR_MODEL_CONFIG'> {};
interface ScreenshotsForModelConfig     extends VParams<'SCREENSHOTS_FOR_MODEL_CONFIG'> {};
interface DiagramsForModelConfig        extends VParams<'DIAGRAMS_FOR_MODEL_CONFIG'> {};
interface MetadataForModelConfig        extends ModelConfigParams<'METADATA_FOR_MODEL_CONFIG'> {};
interface MetadataNoioForModelConfig    extends ModelConfigParams<'METADATA_NOIO_FOR_MODEL_CONFIG'> {};
interface ParametersForConfig           extends ConfigParams<'PARAMETERS_FOR_CONFIG'> {};
interface InputCompatibleForConfig      extends ConfigParams<'INPUT_COMPATIBLE_FOR_CONFIG'> {};
interface OutputCompatibleForConfig     extends ConfigParams<'OUTPUT_COMPATIBLE_FOR_CONFIG'> {};
interface IOForConfig                   extends ConfigParams<'IO_FOR_CONFIG'> {};
interface IOAndVarsSNForConfig          extends ConfigParams<'IO_AND_VARS_SN_FOR_CONFIG'> {};
interface VarsSNAndUnitsForIO           extends BaseParams<'VARS_SN_AND_UNITS_FOR_IO'> {io: string};
interface ConfigsForVar                 extends BaseParams<'CONFIGS_FOR_VAR'> {var: string};
interface ConfigsForVarSN               extends STDParams<'CONFIGS_FOR_VAR_SN'> {};
interface CalibrationsForVarSN          extends STDParams<'CALIBRATIONS_FOR_VAR_SN'> {};
interface IOForVarSN                    extends STDParams<'IO_FOR_VAR_SN'> {};
interface MetadataForVarSN              extends STDParams<'METADATA_FOR_VAR_SN'> {};
interface ProcessForCag                 extends BaseParams<'PROCESS_FOR_CAG'> {cag: string};
interface SearchModelByName             extends BaseParams<'SEARCH_MODEL_BY_NAME'> {label: string};
interface SearchModelByCategory         extends BaseParams<'SEARCH_MODEL_BY_CATEGORY'> {cat: string};
interface SearchAny                     extends TextParams<'SEARCH_ANY'> {};
interface SearchIO                      extends TextParams<'SEARCH_IO'> {};
interface SearchModel                   extends TextParams<'SEARCH_MODEL'> {};
interface SearchVar                     extends TextParams<'SEARCH_VAR'> {};
interface SearchModelByVarSN            extends TextParams<'SEARCH_MODEL_BY_VAR_SN'> {};          

type ApiParams = Models | VersionsAndConfigs | Categories | Configs | ConfigsAndIOs | InputsAndVarsSN | 
        OutputsAndVarsSN | VarsAndSN | MetadataForAny | VersionsForModel | VarsForModel | AuthorsForModelConfig |
        GridForModelConfig | ScreenshotsForModelConfig | DiagramsForModelConfig | MetadataForModelConfig |
        MetadataNoioForModelConfig | ParametersForConfig | InputCompatibleForConfig | OutputCompatibleForConfig |
        IOForConfig | IOAndVarsSNForConfig | VarsSNAndUnitsForIO | ConfigsForVar | ConfigsForVarSN |
        CalibrationsForVarSN | IOForVarSN | MetadataForVarSN | ProcessForCag | SearchModelByName | 
        SearchModelByCategory | SearchAny | SearchIO | SearchModel | SearchVar | SearchModelByVarSN;

const path = {
    MODELS:                         'getModels',
    VERSIONS_AND_CONFIGS:           'getAllModelVersionAndConfigs',
    CATEGORIES:                     'getModelCategories',
    CONFIGS:                        'getModelConfigurations',
    CONFIGS_AND_IOS:                'getModelConfigurationsI_O',
    INPUTS_AND_VARS_SN:             'getInputStandardNamesAndDescriptions',
    OUTPUTS_AND_VARS_SN:            'getOutputStandardNamesAndDescriptions',
    VARS_AND_SN:                    'getVariables',
    METADATA_FOR_ANY:               'getResourceMetadata',
    VERSIONS_FOR_MODEL:             'getModelVersionAndConfigsForModel',
    VARS_FOR_MODEL:                 'getVariablePresentationsForModel',
    AUTHORS_FOR_MODEL_CONFIG:       'getAuthorsForResource',
    GRID_FOR_MODEL_CONFIG:          'getGridForResource',
    SCREENSHOTS_FOR_MODEL_CONFIG:   'getScreenshotsForResource',
    DIAGRAMS_FOR_MODEL_CONFIG:      'getExplanationDiagramsForResource',
    METADATA_FOR_MODEL_CONFIG:      'getModelConfigurationMetadata',
    METADATA_NOIO_FOR_MODEL_CONFIG: 'getModelConfigurationMetadata_NoIO',
    PARAMETERS_FOR_CONFIG:          'getConfigIParameters',
    INPUT_COMPATIBLE_FOR_CONFIG:    'getInputCompatibleConfig',
    OUTPUT_COMPATIBLE_FOR_CONFIG:   'getOutputCompatibleConfig',
    IO_FOR_CONFIG:                  'getConfigI_OVariables',
    IO_AND_VARS_SN_FOR_CONFIG:      'getConfigI_OVariablesAndStandardNames',
    VARS_SN_AND_UNITS_FOR_IO:       'getI_OVariablesAndUnits',
    CONFIGS_FOR_VAR:                'getModelConfigurationsForVariablePresentation',
    CONFIGS_FOR_VAR_SN:             'getModelConfigurationsForVariable',
    CALIBRATIONS_FOR_VAR_SN:        'getCalibratedModelConfigurationsForVariable',
    IO_FOR_VAR_SN:                  'getI_OForStandardVariable',
    METADATA_FOR_VAR_SN:            'getStandardVariableMetadata',
    PROCESS_FOR_CAG:                'getProcessForCAG',
    SEARCH_MODEL_BY_NAME:           'getModel',
    SEARCH_MODEL_BY_CATEGORY:       'getModelsForCategory',
    SEARCH_ANY:                     'searchAll',
    SEARCH_IO:                      'searchIO',
    SEARCH_MODEL:                   'searchModels',
    SEARCH_VAR:                     'searchVariables',
    SEARCH_MODEL_BY_VAR_SN:         'searchVariablesAndReturnModel'
}

const createUrl = (params: ApiParams) : string => {
    let url : URL = new URL(API_URI + path[params.type]);

    Object.keys(params).forEach(key => {
        if (key != 'type' && key != 'rules') {
            url.searchParams.append(key, params[key]);
        }
    })

    return String(url);
}

//Store already resolved promises
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
