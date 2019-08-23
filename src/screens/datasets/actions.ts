import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import { Dataset, DatasetDetail } from "./reducers";
import { EXAMPLE_DATASETS_QUERY } from "../../offline_data/sample_datasets";
import { OFFLINE_DEMO_MODE } from "../../app/actions";
import { IdMap } from "app/reducers";
import { DateRange } from "screens/modeling/reducers";
import { toTimeStamp, fromTimeStampToString } from "util/date-utils";

export const DATASETS_VARIABLES_QUERY = 'DATASETS_VARIABLES_QUERY';
export const DATASETS_LIST = 'DATASETS_LIST';
export const DATASETS_DETAIL = 'DATASETS_DETAIL';

export interface DatasetsActionList extends Action<'DATASETS_LIST'> { datasets: Dataset[] };
export interface DatasetsActionVariablesQuery extends Action<'DATASETS_VARIABLES_QUERY'> { 
    modelid: string, 
    inputid: string, 
    datasets: Dataset[] | null,
    loading: boolean
};
export interface DatasetsActionDetail extends Action<'DATASETS_DETAIL'> { dataset: DatasetDetail };

export type DatasetsAction = DatasetsActionVariablesQuery | DatasetsActionDetail | DatasetsActionList;

const DATA_CATALOG_URI = "https://api.mint-data-catalog.org";

// List all Datasets
type ListDatasetsThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionList>;
export const listAllDatasets: ActionCreator<ListDatasetsThunkResult> = () => (dispatch) => {

    // Offline mode example query
    if(OFFLINE_DEMO_MODE) {
        dispatch({
            type: DATASETS_LIST,
            datasets: EXAMPLE_DATASETS_QUERY as Dataset[]
        });
        return;
    }
    /*
    fetch(DATA_CATALOG_URI + "/datasets/find").then((response) => {
        response.json().then((obj) => {
            let models = [] as Model[];
            let bindings = obj["results"]["bindings"];
            bindings.map((binding: Object) => {
                models.push({
                    name: binding["label"]["value"],
                    description: binding["desc"]["value"],
                    original_model: binding["model"]["value"]
                } as Model);
            });
            dispatch({
                type: MODELS_LIST,
                models
            });            
        })
    });
    */
};

// Query Data Catalog by Variables
type QueryDatasetsThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionVariablesQuery>;
export const queryDatasetsByVariables: ActionCreator<QueryDatasetsThunkResult> = 
        (modelid: string, inputid: string, driving_variables: string[], dates: DateRange ) => (dispatch) => {
    
    if(OFFLINE_DEMO_MODE) {
        let datasets = [] as Dataset[];
        //console.log(driving_variables);
        EXAMPLE_DATASETS_QUERY.map((ds) => {
            let i=0;
            for(;i<driving_variables.length; i++) {
                if(ds.variables.indexOf(driving_variables[i]) >= 0) {
                    datasets.push(ds);
                    break;
                }
            }
        });
        if(driving_variables.length > 0) {
            dispatch({
                type: DATASETS_VARIABLES_QUERY,
                modelid: modelid,
                inputid: inputid,
                datasets: datasets,
                loading: false
            });        
        }
    }
    else {
        //console.log(driving_variables);
        
        dispatch({
            type: DATASETS_VARIABLES_QUERY,
            modelid: modelid,
            inputid: inputid,
            datasets: null,
            loading: true
        });

        fetch(DATA_CATALOG_URI + "/datasets/find", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                standard_variable_names__in: driving_variables,
                start_time__gte: fromTimeStampToString(dates.start_date).replace(/\.\d{3}Z$/,''),
                end_time__lte: fromTimeStampToString(dates.end_date).replace(/\.\d{3}Z$/,''),
                limit: 5000
            })
        }).then((response) => {
            response.json().then((obj) => {
                let dsmap: IdMap<Dataset> = {};
                let datasets: Dataset[] = [];
                obj.resources.map((row: any) => {
                    let dmeta = row["dataset_metadata"];
                    let rmeta = row["resource_metadata"];
                    let tcover = rmeta["temporal_coverage"];
                    //let scover = rmeta["spatial_coverage"];
                    let dsid = row["dataset_id"];
                    let ds : Dataset = dsmap[dsid];
                    if(ds == null) {
                        ds = {
                            id: dsid,
                            name: row["dataset_name"],
                            region: "",
                            variables: driving_variables,
                            time_period: {
                                start_date: null, //tcover["start_time"].replace(/T.+$/, ''),
                                end_date: null
                            } as DateRange,
                            description: row["description"] || "",
                            version: dmeta["version"] || "",
                            limitations: dmeta["limitataions"] || "",
                            source: {
                                name: dmeta["source"] || "",
                                url: dmeta["source_url"] || "",
                                type: dmeta["source_type"] || ""
                            },
                            categories: dmeta["category_tags"] || [],
                            resources: []
                        };
                        datasets.push(ds);
                        dsmap[ds.id] = ds;
                    }
                    let tcoverstart = toTimeStamp(tcover["start_time"]);
                    let tcoverend = toTimeStamp(tcover["end_time"]);
                    if(!ds.time_period.start_date || ds.time_period.start_date > tcoverstart) {
                        ds.time_period.start_date = tcoverstart;
                    }
                    if(!ds.time_period.end_date || ds.time_period.end_date < tcoverend) {
                        ds.time_period.end_date = tcoverstart;
                    }
                    
                    ds.resources.push({
                        id: row["resource_id"],
                        name: row["resource_name"],
                        url: row["resource_data_url"],
                        time_period: {
                            start_date: tcoverstart,
                            end_date: tcoverend
                        }
                    });
                });
                dispatch({
                    type: DATASETS_VARIABLES_QUERY,
                    modelid: modelid,
                    inputid: inputid,
                    datasets: datasets,
                    loading: false
                });
                console.log(datasets);
            })
        });
    }

};

// Query Dataset Details
type QueryDataDetailThunkResult = ThunkAction<void, RootState, undefined, DatasetsActionDetail>;
export const queryDatasetDetail: ActionCreator<QueryDataDetailThunkResult> = (datasetid: string) => (dispatch) => {
    if(datasetid) {
        let dataset = {
            id: datasetid,
            name: datasetid
        } as DatasetDetail;
        dispatch({
            type: DATASETS_DETAIL,
            dataset: dataset
        });        
    }
};