import { MINT_PREFERENCES } from "config";
import { DataResource, Dataset, DatasetQueryParameters } from "screens/datasets/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { DatasetQuery, IDataCatalog } from "./data-catalog-adapter";

export class DefaultDataCatalog implements IDataCatalog {

  private static async request(url: string, query: any): Promise<any> {
    let res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (res && res.json) {
      return await res.json();
    }
  }

  public async findDatasetsByRegion(region: Region): Promise<Dataset[]> {
    throw new Error("Not implemented");
  }

  public async findDataset(id: string): Promise<Dataset | null> {
    let obj = await DefaultDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/find`,
      { id: id }
    );
    return DefaultDataCatalog.convertDatasetFromDCResponse(obj, {});
  }

  public async findDatasetByDateRange(query: DatasetQuery): Promise<Dataset[]> {
    if (query.start_time) {
      query.start_time__gte = query.start_time.toISOString().replace(/\.\d{3}Z$/, "");
      delete query.start_time;
    }
    if (query.end_time) {
      query.end_time__lte = query.end_time.toISOString().replace(/\.\d{3}Z$/, "");
      delete query.end_time;
    }

    query.limit = 100;

    let obj = await DefaultDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/find`,
      query
    );
    return DefaultDataCatalog.getDatasetsFromDCResponse(obj, {});
  }

  public async findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]> {
    if (!region.geometries) return;

    let dsQueryData: any = {
      standard_variable_names__in: driving_variables,
      spatial_coverage__intersects: region.geometries[0],
      limit: 1000,
    };
    if (dates) {
      dsQueryData.end_time__gte = dates?.start_date?.toISOString()?.replace(/\.\d{3}Z$/, "");
      dsQueryData.start_time__lte = dates?.end_date?.toISOString()?.replace(/\.\d{3}Z$/, "");
    }
    let res: any = await DefaultDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/find`,
      dsQueryData
    );
    if (!!res && res.result === "success") {
      const datasets = DefaultDataCatalog.getDatasetsFromDCResponse(res, {
        variables: driving_variables,
      } as DatasetQueryParameters);
      datasets.map((ds) => {
        delete ds["spatial_coverage"];
        ds.resources_loaded = false;
      });
      return datasets;
    }
    return [];
  }

  public async queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange
  ): Promise<DataResource[]> {
    let filters: any = {};
    if (region.geometries)
      filters.spatial_coverage__intersects = region.geometries[0];
    else return null;
    if (dates) {
      filters.end_time__gte = dates?.start_date?.toISOString()?.replace(/\.\d{3}Z$/, "");
      filters.start_time__lte = dates?.end_date?.toISOString()?.replace(/\.\d{3}Z$/, "");
    }

    let resQueryData = {
      dataset_id: datasetid,
      filter: filters,
      limit: 5000,
    };

    let obj: any = await DefaultDataCatalog.request(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/dataset_resources`,
      resQueryData
    );
    return obj && obj.resources ? DefaultDataCatalog.getDatasetResourceListFromDCResponse(obj) : [];
  }

  private static convertDatasetFromDCResponse = (
    obj: any,
    queryParameters: DatasetQueryParameters
  ): Dataset => {
    let dmeta = obj["dataset_metadata"];
    return {
      id: obj["dataset_id"],
      name: obj["dataset_name"] || "",
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

  }

  private static getDatasetsFromDCResponse = (
    obj: any,
    queryParameters: DatasetQueryParameters
  ): Dataset[] => {
    let datasets = obj.datasets.map((ds) => {
      return DefaultDataCatalog.convertDatasetFromDCResponse(ds, queryParameters);
    });
    return datasets;
  };

}