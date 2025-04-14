import { MintPreferences } from "app/reducers";
import {
  getDatasetResourceListFromDCResponse,
  getDatasetsFromCKANResponse,
  getDatasetsFromDCResponse,
} from "screens/datasets/actions";
import {
  DataResource,
  Dataset,
  DatasetQueryParameters,
} from "screens/datasets/reducers";

import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { MINT_PREFERENCES } from "config";
import { DefaultDataCatalog } from "./default-data-catalog";
import { CKANDataCatalog } from "./ckan-data-catalog";

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

// Base interface for data catalog operations
export interface IDataCatalog {
  findDataset(query: DatasetQuery): Promise<Dataset[]>;
  findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]>;
  queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange
  ): Promise<DataResource[]>;
}

// Base class with common functionality
export abstract class BaseDataCatalog implements IDataCatalog {
  protected static async fetchJson(url: string, query: any): Promise<any> {
    let res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (res && res.json) {
      return await res.json();
    }
  }

  abstract findDataset(query: DatasetQuery): Promise<Dataset[]>;
  abstract findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]>;
  abstract queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange
  ): Promise<DataResource[]>;
}

// Factory class to create the appropriate catalog adapter
export class DataCatalogAdapter {
  private static instance: IDataCatalog;

  public static getInstance(): IDataCatalog {
    if (!this.instance) {
      const catalogType = MINT_PREFERENCES.data_catalog_type || "default";
      this.instance = catalogType === "CKAN"
        ? new CKANDataCatalog()
        : new DefaultDataCatalog();
    }
    return this.instance;
  }
}
