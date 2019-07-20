const API_URI = "https://query.mint.isi.edu/api/dgarijo/MINT-ModelCatalogQueries/";
export const MODEL_PREFIX = "https://w3id.org/okn/i/mint/";

export const VER_AND_CONF = "VER_AND_CONF";
export const MODELS = "MODELS";
export const GET_IO = "GET_IO";

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

interface ApiModelsParams extends ApiBaseParam<'MODELS'> {};
interface ApiVersionParams extends ApiModelParam<'VER_AND_CONF'> {};
interface ApiIOParams extends ApiConfigParam<'GET_IO'> {};

type ApiParams = ApiVersionParams | ApiModelsParams | ApiIOParams;

interface ConfigEntry {
    path: string,
    mandatory: string[],
};

const config = {
    MODELS: {path: 'getModels', mandatory: []},
    VER_AND_CONF: {path: 'getModelVersionAndConfigsForModel', mandatory: ['model']},
    GET_IO: {path: 'getConfigI_OVariables', mandatory: ['config']},
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
