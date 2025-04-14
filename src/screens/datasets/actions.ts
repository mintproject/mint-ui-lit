import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState } from "../../app/store";
import {
  Dataset,
  DatasetDetail,
  DatasetQueryParameters,
  DataResource,
} from "./reducers";
import { OFFLINE_DEMO_MODE } from "../../app/actions";
import { IdMap, MintPreferences } from "app/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { MINT_PREFERENCES } from "config";
import { DataCatalogAdapter } from "util/datacatalog/data-catalog-adapter";

export const DATASETS_VARIABLES_QUERY = "DATASETS_VARIABLES_QUERY";
export const DATASETS_GENERAL_QUERY = "DATASETS_GENERAL_QUERY";
export const DATASETS_REGION_QUERY = "DATASETS_REGION_QUERY";
export const DATASETS_RESOURCE_QUERY = "DATASETS_RESOURCE_QUERY";
export const DATASET_ADD = "DATASET_ADD";
export const DATASETS_LIST = "DATASETS_LIST";

const data_catalog_api_url = MINT_PREFERENCES.data_catalog_api;

export interface DatasetsActionVariablesQuery
  extends Action<"DATASETS_VARIABLES_QUERY"> {
  modelid: string;
  inputid: string;
  datasets: Dataset[] | null;
  loading: boolean;
}
export interface DatasetsActionGeneralQuery
  extends Action<"DATASETS_GENERAL_QUERY"> {
  query: DatasetQueryParameters;
  datasets: Dataset[] | null;
  loading: boolean;
}
export interface DatasetsActionRegionQuery
  extends Action<"DATASETS_REGION_QUERY"> {
  region: Region;
  datasets: Dataset[] | null;
  loading: boolean;
}
export interface DatasetsActionDatasetResourceQuery
  extends Action<"DATASETS_RESOURCE_QUERY"> {
  dsid: string;
  dataset: Dataset;
  loading: boolean;
}
export interface DatasetsActionDatasetAdd extends Action<"DATASET_ADD"> {
  dsid: string;
  dataset: Dataset;
}
export interface DatasetsActionDetail extends Action<"DATASETS_DETAIL"> {
  dataset: DatasetDetail;
}

export type DatasetsAction =
  | DatasetsActionVariablesQuery
  | DatasetsActionGeneralQuery
  | DatasetsActionRegionQuery
  | DatasetsActionDatasetResourceQuery
  | DatasetsActionDatasetAdd;


export const getDatasetsFromDCResponse = (
  obj: any,
  queryParameters: DatasetQueryParameters
): Dataset[] => {
  let datasets = obj.datasets.map((ds) => {
    let dmeta = ds["dataset_metadata"];
    return {
      id: ds["dataset_id"],
      name: ds["dataset_name"] || "",
      region: "",
      variables: queryParameters.variables,
      time_period: dmeta["temporal_coverage"]
        ? {
            start_date: dmeta["temporal_coverage"]["start_time"]
              ? new Date(dmeta["temporal_coverage"]["start_time"])
              : null,
            end_date: dmeta["temporal_coverage"]["end_time"]
              ? new Date(dmeta["temporal_coverage"]["end_time"])
              : null,
          }
        : null,
      description: dmeta["dataset_description"] || "",
      version: dmeta["version"] || "",
      limitations: dmeta["limitations"] || "",
      source: {
        name: dmeta["source"] || "",
        url: dmeta["source_url"] || "",
        type: dmeta["source_type"] || "",
      },
      is_cached: dmeta["is_cached"] || false,
      resource_repr: dmeta["resource_repr"] || null,
      dataset_repr: dmeta["dataset_repr"] || null,
      resource_count: dmeta["resource_count"] || 0,
      spatial_coverage: dmeta["dataset_spatial_coverage"] || null,
      datatype: dmeta["datatype"] || dmeta["data_type"] || "",
      categories: dmeta["category_tags"] || [],
      resources: [],
    } as Dataset;
  });
  return datasets;
};

export const getDatasetDetailFromDCResponse = (ds: any) => {
  let dmeta = ds["metadata"];
  return {
    id: ds["dataset_id"],
    name: ds["name"] || "",
    description: ds["description"] || "",
    region: "",
    variables: [],
    datatype: dmeta["datatype"] || "",
    time_period: dmeta["temporal_coverage"]
      ? {
          start_date: dmeta["temporal_coverage"]["start_time"]
            ? new Date(dmeta["temporal_coverage"]["start_time"])
            : null,
          end_date: dmeta["temporal_coverage"]["end_time"]
            ? new Date(dmeta["temporal_coverage"]["end_time"])
            : null,
        }
      : null,
    version: dmeta["version"] || "",
    limitations: dmeta["limitations"] || "",
    source: {
      name: dmeta["source"] || "",
      url: dmeta["source_url"] || dmeta["source"] || "",
      type: dmeta["source_type"] || "",
    },
    categories: ds["categories"] || [],
    is_cached: dmeta["is_cached"] || false,
    resource_repr: dmeta["resource_repr"] || null,
    dataset_repr: dmeta["dataset_repr"] || null,
    resource_count: dmeta["resource_count"] || 0,
    spatial_coverage: dmeta["dataset_spatial_coverage"] || null,
    resources: [],
    config: dmeta["config"] || null,
  };
};

const getResourcesFromDCResponse = (obj: any) => {
  return obj.dataset.resources.map((row) => {
    let dmeta = row["resource_metadata"];
    return {
      id: row["resource_id"],
      name: row["resource_name"],
      url: row["resource_data_url"],
      time_period: dmeta["temporal_coverage"]
        ? {
            start_date: dmeta["temporal_coverage"]["start_time"]
              ? new Date(
                  row["resource_metadata"]["temporal_coverage"]["start_time"]
                )
              : null,
            end_date: dmeta["temporal_coverage"]["end_time"]
              ? new Date(
                  row["resource_metadata"]["temporal_coverage"]["end_time"]
                )
              : null,
          }
        : null,
      spatial_coverage: row["resource_metadata"]["spatial_coverage"],
      selected: true,
    };
  });
};

export const getDatasetResourceListFromDCResponse = (obj: any) => {
  let resources = [];
  obj.resources.map((row: any) => {
    let rmeta = row["resource_metadata"];
    let tcover = rmeta["temporal_coverage"];
    let scover = rmeta["spatial_coverage"];
    let tcoverstart = tcover ? new Date(tcover["start_time"]) : null;
    let tcoverend = tcover ? new Date(tcover["end_time"]) : null;

    resources.push({
      id: row["resource_id"],
      name: row["resource_name"],
      url: row["resource_data_url"],
      time_period: {
        start_date: tcoverstart,
        end_date: tcoverend,
      },
      spatial_coverage: scover,
      selected: true,
    });
  });
  return resources;
};

const getDatasetObjectsFromDCResponse = (
  obj: any,
  queryParameters: DatasetQueryParameters
) => {
  let datasets: Dataset[] = [];

  obj.datasets.map((row: any) => {
    let dmeta = row["dataset_metadata"];
    let tcover = dmeta["temporal_coverage"];
    let dsid = row["dataset_id"];
    let ds: Dataset = {
      id: dsid,
      name: row["dataset_name"],
      region: "",
      variables: queryParameters.variables,
      time_period: {
        start_date: tcover ? tcover["start_time"].replace(/T.+$/, "") : null,
        end_date: tcover ? tcover["end_time"].replace(/T.+$/, "") : null,
      } as DateRange,
      description: row["dataset_description"] || "",
      version: dmeta["version"] || "",
      limitations: dmeta["limitations"] || "",
      is_cached: dmeta["is_cached"] || false,
      resource_repr: dmeta["resource_repr"] || null,
      dataset_repr: dmeta["dataset_repr"] || null,
      source: {
        name: dmeta["source"] || "",
        url: dmeta["source_url"] || "",
        type: dmeta["source_type"] || "",
      },
      datatype: dmeta["datatype"] || "",
      categories: dmeta["category_tags"] || [],
      resources: [],
    };
    datasets.push(ds);
  });
  return datasets;
};

// Query Data Catalog by Variables
export function loadResourcesForDataset(
  datasetid: string,
  dates: DateRange,
  region: Region,
  prefs: MintPreferences
): Promise<DataResource[]> {
  return new Promise((resolve, reject) => {
    let resQueryData = {
      dataset_id: datasetid,
      filter: {
        spatial_coverage__intersects: region.geometries[0],
        end_time__gte: dates?.start_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, ""),
        start_time__lte: dates?.end_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, ""),
      },
      limit: 5000,
    };

    let req = fetch(prefs.data_catalog_api + "/datasets/dataset_resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resQueryData),
    });
    req.then((r) => {
      r.json().then((resp) => {
        let resources = getDatasetResourceListFromDCResponse(resp);
        resolve(resources);
      });
    });
    req.catch(reject);
  });
}

type QueryDatasetsThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  DatasetsActionVariablesQuery
>;
export const queryDatasetsByVariables: ActionCreator<
  QueryDatasetsThunkResult
> =
  (
    modelid: string,
    inputid: string,
    driving_variables: string[],
    dates: DateRange,
    region: Region,
    prefs: MintPreferences
  ) =>
  (dispatch) => {
    if (!region) return;

    //START
    if (driving_variables.length == 0) {
      dispatch({
        type: DATASETS_VARIABLES_QUERY,
        modelid: modelid,
        inputid: inputid,
        datasets: [],
        loading: false,
      });
      return;
    }
    dispatch({
      type: DATASETS_VARIABLES_QUERY,
      modelid: modelid,
      inputid: inputid,
      datasets: null,
      loading: true,
    });

    let dsQueryData = {
      standard_variable_names__in: driving_variables,
      spatial_coverage__intersects: region.geometries[0],
      end_time__gte: dates?.start_date?.toISOString()?.replace(/\.\d{3}Z$/, ""),
      start_time__lte: dates?.end_date?.toISOString()?.replace(/\.\d{3}Z$/, ""),
      limit: 1000,
    };

    fetch(data_catalog_api_url + "/datasets/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dsQueryData),
    }).then((response) => {
      response.json().then((obj) => {
        let datasets: Dataset[] = getDatasetsFromDCResponse(obj, {
          variables: driving_variables,
        } as DatasetQueryParameters);

        datasets.map((ds) => {
          delete ds["spatial_coverage"];
          ds.resources_loaded = false;
        });

        dispatch({
          type: DATASETS_VARIABLES_QUERY,
          modelid: modelid,
          inputid: inputid,
          datasets: datasets,
          loading: false,
        });
      });
    });
  };

const _createDatasetQueryData = (queryConfig: DatasetQueryParameters) => {
  var data = {};
  if (queryConfig.name) {
    data["dataset_names__in"] = [queryConfig.name];
  }
  if (queryConfig.variables) {
    data["standard_variable_names__in"] = queryConfig.variables;
  }
  data["limit"] = 5000;
  return data;
};

// Query Data Catalog Query for datasets
type QueryDatasetsGeneralThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  DatasetsActionGeneralQuery
>;
export const queryGeneralDatasets: ActionCreator<
  QueryDatasetsGeneralThunkResult
> =
  (queryParameters: DatasetQueryParameters, prefs: MintPreferences) =>
  (dispatch) => {
    dispatch({
      type: DATASETS_GENERAL_QUERY,
      query: queryParameters,
      datasets: null,
      loading: true,
    });
    let queryBody = _createDatasetQueryData(queryParameters);

    fetch(data_catalog_api_url + "/find_datasets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //mode: "no-cors",
      body: JSON.stringify(queryBody),
    }).then((response) => {
      response.json().then((obj) => {
        let datasets: Dataset[] = getDatasetObjectsFromDCResponse(
          obj,
          queryParameters
        );
        dispatch({
          type: DATASETS_GENERAL_QUERY,
          query: queryParameters,
          datasets: datasets,
          loading: false,
        });
      });
    });
  };

// Query Data Catalog for resources of a particular dataset
type QueryDatasetResourcesThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  DatasetsActionDatasetResourceQuery
>;
export const queryDatasetResources: ActionCreator<
  QueryDatasetResourcesThunkResult
> = (dsid: string, region: Region, prefs: MintPreferences) => async (dispatch) => {
  dispatch({
    type: DATASETS_RESOURCE_QUERY,
    dsid: dsid,
    dataset: null,
    loading: true,
  });
  const dataCatalog = DataCatalogAdapter.getInstance();
  const dataset = await dataCatalog.getDataset(dsid);
  dispatch({
    type: DATASETS_RESOURCE_QUERY,
    dsid: dsid,
    dataset: dataset,
    loading: false,
  });

  if (prefs.data_catalog_type == "default") {
    let prom1 = new Promise<void>((resolve, reject) => {
      let req = fetch(prefs.data_catalog_api + "/datasets/get_dataset_info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //mode: "no-cors",
        body: JSON.stringify({ dataset_id: dsid }),
      });
      req.then((response) => {
        response.json().then((obj) => {
          dataset = getDatasetDetailFromDCResponse(obj);
          resolve();
        });
      });
      req.catch(reject);
    });

    let resources;
    let prom2 = new Promise<void>((resolve, reject) => {
      let req = fetch(prefs.data_catalog_api + "/datasets/dataset_resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //mode: "no-cors",
        body: JSON.stringify({
          dataset_id: dsid,
        }),
      });
      req.then((response) => {
        response.json().then((obj) => {
          resources = getResourcesFromDCResponse(obj);
          resolve();
        });
      });
      req.catch(reject);
    });

    Promise.all([prom1, prom2]).then((values: any) => {
      if (dataset) dataset.resources = resources;
      dispatch({
        type: DATASETS_RESOURCE_QUERY,
        dsid: dsid,
        dataset: dataset,
        loading: false,
      });
    });
  }
};

// Query Data Catalog for resources of a particular dataset and save the results
type QueryDatasetResourcesAndSaveThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  DatasetsActionDatasetAdd
>;
export const queryDatasetResourcesAndSave: ActionCreator<
  QueryDatasetResourcesAndSaveThunkResult
> = (dsid: string, region: Region, prefs: MintPreferences) => (dispatch) => {
  let queryBody = {
    dataset_ids__in: [dsid],
    limit: 2000,
  };
  if (region) {
    queryBody["spatial_coverage__intersects"] = region.geometries[0];
  }

  fetch(data_catalog_api_url + "/datasets/find", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queryBody),
  }).then((response) => {
    response.json().then((obj) => {
      let datasets: Dataset[] = getDatasetsFromDCResponse(obj, {});
      let dataset = datasets.length > 0 ? datasets[0] : null;
      dispatch({
        type: DATASET_ADD,
        dsid: dsid,
        dataset: dataset,
      });
    });
  });
};

const fetchJson = async (url: string, query: any): Promise<any> => {
  let res: Response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (res && res.json) {
    return await res.json();
  }
};

// Query Data Catalog by Region
type QueryDatasetsByRegionThunkResult = ThunkAction<
  void,
  RootState,
  undefined,
  DatasetsActionRegionQuery
>;

export const queryDatasetByRegionCkan: ActionCreator<
  QueryDatasetsByRegionThunkResult
> = (region: Region, prefs: MintPreferences) => async (dispatch) => {
  dispatch({
    type: DATASETS_REGION_QUERY,
    region: region,
    datasets: null,
    loading: true,
  });
  const dataCatalog = DataCatalogAdapter.getInstance();
  const datasets = await dataCatalog.listDatasetsByRegion(region);
  dispatch({
    type: DATASETS_REGION_QUERY,
    region: region,
    datasets: datasets,
    loading: false,
  });
};
export const queryDatasetsByRegion: ActionCreator<
  QueryDatasetsByRegionThunkResult
> = (region: Region, prefs: MintPreferences) => (dispatch) => {
  dispatch({
    type: DATASETS_REGION_QUERY,
    region: region,
    datasets: null,
    loading: true,
  });

  let req1 = fetch(data_catalog_api_url + "/datasets/find", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // FIXME: Querying the region for only datasets *within* the area
      // FIXME: on Dec16 within stoped working, going back to intersects but will 504
      spatial_coverage__intersects: region.geometries[0],
      //spatial_coverage__intersects: geojson.geometry, FIXME: this takes long to load.
      limit: 10,
    }),
  });

  req1.then((res: any) => {
    res.json().then((obj) => {
      let datasets: Dataset[] = getDatasetsFromDCResponse(
        obj,
        {} as DatasetQueryParameters
      );
      let transformation_example: Dataset = {
        id: "adfca6fb-ad82-4be3-87d8-8f60f9193e43",
        name: "Global weather data from GPM in 2011.",
        region: "",
        datatype: "",
        variables: [],
        time_period: {
          start_date: new Date("2011-08-18T00:00:00"),
          end_date: new Date("2011-08-18T23:59:59"),
        },
        description: "Global weather data from GPM in 2011.",
        version: "",
        limitations: "",
        source: {
          name: "",
          url: "",
          type: "",
        },
        categories: [],
        is_cached: true,
        resource_repr: null,
        dataset_repr: null,
        resource_count: 1,
        spatial_coverage: null,
        resources: [],
      } as Dataset;
      datasets.push(transformation_example);
      dispatch({
        type: DATASETS_REGION_QUERY,
        region: region,
        datasets: datasets,
        loading: false,
      });
    });
  });
};

export const queryDatasetResourcesRaw = (
  dsid: string,
  region: Region,
  prefs: MintPreferences
): Promise<Dataset[]> => {
  let queryBody = {
    dataset_ids__in: [dsid],
    limit: 100,
  };
  if (region) {
    queryBody["spatial_coverage__intersects"] = region.geometries[0];
  }

  let prom: Promise<Dataset[]> = new Promise((resolve, reject) => {
    fetch(data_catalog_api_url + "/datasets/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    })
      .then((response) => {
        response
          .json()
          .then((obj) => {
            let datasets: Dataset[] = getDatasetsFromDCResponse(obj, {});
            resolve(datasets);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
  return prom;
};
