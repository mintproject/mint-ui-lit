import { MINT_PREFERENCES } from "config";
import {
  getDatasetResourceListFromDCResponse,
  getDatasetsFromDCResponse,
} from "screens/datasets/actions";
import { DataResource, Dataset, DatasetQueryParameters } from "screens/datasets/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { BaseDataCatalog, DatasetQuery } from "./data-catalog-adapter";

export class DefaultDataCatalog extends BaseDataCatalog {
  public async findDataset(query: DatasetQuery): Promise<Dataset[]> {
    if (query.start_time) {
      query.start_time__gte = query.start_time.toISOString().replace(/\.\d{3}Z$/, "");
      delete query.start_time;
    }
    if (query.end_time) {
      query.end_time__lte = query.end_time.toISOString().replace(/\.\d{3}Z$/, "");
      delete query.end_time;
    }

    query.limit = 100;

    let obj = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/find`,
      query
    );
    return getDatasetsFromDCResponse(obj, {});
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
    let res: any = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/find`,
      dsQueryData
    );
    if (!!res && res.result === "success") {
      const datasets = getDatasetsFromDCResponse(res, {
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

    let obj: any = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/datasets/dataset_resources`,
      resQueryData
    );
    return obj && obj.resources ? getDatasetResourceListFromDCResponse(obj) : [];
  }
}