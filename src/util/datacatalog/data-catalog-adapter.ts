import { MINT_PREFERENCES } from "config";
import { DataResource, Dataset } from "screens/datasets/reducers";

import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { CKANDataCatalog } from "./ckan-data-catalog";
import { DefaultDataCatalog } from "./default-data-catalog";

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
  getDataset(id: string): Promise<Dataset | null>;
  listDatasetsByRegion(region: Region): Promise<Dataset[]>;
  listDatasetsByVariableNameRegionDates(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]>;
  listResourcesByDataset(
    datasetid: string,
    region: Region,
    dates?: DateRange,
    variableNames?: string[]
  ): Promise<DataResource[]>;
}

export class DataCatalogAdapter {
  private static instance: IDataCatalog;

  public static getInstance(): IDataCatalog {
    if (!this.instance) {
      const catalogType = MINT_PREFERENCES.data_catalog_type || "default";
      this.instance =
        catalogType === "CKAN"
          ? new CKANDataCatalog()
          : new DefaultDataCatalog();
    }
    return this.instance;
  }
}
