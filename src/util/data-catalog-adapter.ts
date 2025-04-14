import { MintPreferences } from "app/reducers";
import {
  getDatasetResourceListFromDCResponse,
  getDatasetsFromCKANResponse,
  getDatasetsFromDCResponse,
} from "screens/datasets/actions";
import datasets, {
  DataResource,
  Dataset,
  DatasetQueryParameters,
} from "screens/datasets/reducers";

import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { MINT_PREFERENCES } from "config";

export interface DatasetQuery {
  search_operators?: string;
  dataset_names?: string[];
  dataset_ids?: string[];
  standard_variable_ids?: string[];
  standard_variable_names__in?: string[];
  spatial_coverage__intersects?: any;
  start_time?: Date;
  end_time?: Date;
  end_time__lte?: string;
  start_time__gte?: string;
  limit?: number;
}

const data_catalog_api_url = MINT_PREFERENCES.data_catalog_api;
const data_catalog_type = MINT_PREFERENCES.data_catalog_type || "default";
const data_catalog_key = MINT_PREFERENCES.data_catalog_key || "";
//const data_catalog_extra = MINT_PREFERENCES.data_catalog_extra || {};

export class DataCatalogAdapter {
  private static async fetchJson(url: string, query: any): Promise<any> {
    let res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (res && res.json) {
      return await res.json();
    }
  }

  public static async findDataset(query: DatasetQuery): Promise<Dataset[]> {
    if (data_catalog_type === "default") {
      if (query.start_time) {
        query.start_time__gte = query.start_time
          .toISOString()
        .replace(/\.\d{3}Z$/, "");
      delete query.start_time;
    }
    if (query.end_time) {
      query.end_time__lte = query.end_time
        .toISOString()
        .replace(/\.\d{3}Z$/, "");
      delete query.end_time;
    }

    query.limit = 100;

    let obj = await this.fetchJson(
      `${data_catalog_api_url}/datasets/find`,
      query
    );
      return getDatasetsFromDCResponse(obj, {});
    } else if (data_catalog_type === "CKAN") {
      // CKAN Data Catalog
      let dsQueryData: any = {
        // spatial_coverage__intersects: query.spatial_coverage__intersects,
        // limit: 100,
      };
      let res: any = await this.fetchJson(
        `${data_catalog_api_url}/api/action/package_search`,
        dsQueryData
      );
      return getDatasetsFromCKANResponse(res, {});
    }
  }

  public static async findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]> {
    if (!region.geometries) return;

    let datasets: Dataset[] = [];

    if (data_catalog_type === "default") {
      // Default Data Catalog
      let dsQueryData: any = {
        standard_variable_names__in: driving_variables,
        spatial_coverage__intersects: region.geometries[0],
        limit: 1000,
      };
      if (dates) {
        dsQueryData.end_time__gte = dates?.start_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, "");
        dsQueryData.start_time__lte = dates?.end_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, "");
      }
      let res: any = await this.fetchJson(
        `${data_catalog_api_url}/datasets/find`,
        dsQueryData
      );
      if (!!res && res.result === "success") {
        datasets = getDatasetsFromDCResponse(res, {
          variables: driving_variables,
        } as DatasetQueryParameters);
        datasets.map((ds) => {
          delete ds["spatial_coverage"];
          ds.resources_loaded = false; //FIXME?
        });
      }
    } else if (data_catalog_type === "CKAN") {
      // CKAN Data Catalog
      datasets = [];

      if (driving_variables.length === 0) {
        let dsQueryData: any = {
          ext_bbox:
            region.bounding_box.xmin +
            "," +
            region.bounding_box.ymin +
            "," +
            region.bounding_box.xmax +
            "," +
            region.bounding_box.ymax,
        };
        let res: any = await this.fetchJson(
          `${data_catalog_api_url}/api/action/package_search`,
          dsQueryData
        );
        datasets = getDatasetsFromCKANResponse(res, {
          variables: driving_variables,
        } as DatasetQueryParameters);
      }

      for (const variable of driving_variables) {
        let dsQueryData: any = {
          fq: "tags:stdvar." + variable,
          ext_bbox:
            region.bounding_box.xmin +
            "," +
            region.bounding_box.ymin +
            "," +
            region.bounding_box.xmax +
            "," +
            region.bounding_box.ymax,
        };

        let res: any = await this.fetchJson(
          `${data_catalog_api_url}/api/action/package_search`,
          dsQueryData
        );
        if (!!res && res.result && res.result.count > 0) {
          datasets = [
            ...datasets,
            ...getDatasetsFromCKANResponse(res, {
              variables: driving_variables,
            } as DatasetQueryParameters),
          ];
        } else {
          console.warn(
            `${data_catalog_api_url}/datasets/find no result.`,
            dsQueryData
          ),
            res;
        }
      }
    }
    return datasets;
  }

  public static async queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange
  ): Promise<DataResource[]> {
    if (data_catalog_type === "default") {
      // Default Data Catalog
      let filters: any = {};
      if (region.geometries)
        filters.spatial_coverage__intersects = region.geometries[0];
      else return null;
      if (dates) {
        filters.end_time__gte = dates?.start_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, "");
        filters.start_time__lte = dates?.end_date
          ?.toISOString()
          ?.replace(/\.\d{3}Z$/, "");
      }

      let resQueryData = {
        dataset_id: datasetid,
        filter: filters,
        limit: 5000,
      };

      let obj: any = await this.fetchJson(
        `${data_catalog_api_url}/datasets/dataset_resources`,
        resQueryData
      );
      return obj && obj.resources
        ? getDatasetResourceListFromDCResponse(obj)
        : [];
    } else if (data_catalog_type === "CKAN") {
      // CKAN Data Catalog
      let resQueryData = {
        fq: "id:" + datasetid,
      };
      let obj: any = await this.fetchJson(
        `${data_catalog_api_url}/api/action/package_search`,
        resQueryData
      );
      let dses = getDatasetsFromCKANResponse(obj, {});
      return dses.length > 0 ? dses[0].resources : [];
    }
  }
}
