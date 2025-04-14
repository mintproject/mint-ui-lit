import { MINT_PREFERENCES } from "config";
import { getDatasetsFromCKANResponse } from "screens/datasets/actions";
import { DataResource, Dataset, DatasetQueryParameters } from "screens/datasets/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Region } from "screens/regions/reducers";
import { BaseDataCatalog, DatasetQuery } from "./data-catalog-adapter";

export class CKANDataCatalog extends BaseDataCatalog {
  public async findDataset(query: DatasetQuery): Promise<Dataset[]> {
    // Implement CKAN-specific dataset search
    throw new Error("Not implemented for CKAN");
  }

  public async findDatasetByVariableName(
    driving_variables: string[],
    region: Region,
    dates?: DateRange
  ): Promise<Dataset[]> {
    let datasets: Dataset[] = [];

    if (driving_variables.length === 0) {
      let dsQueryData: any = {
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      };
      let res: any = await BaseDataCatalog.fetchJson(
        `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
        dsQueryData
      );
      datasets = getDatasetsFromCKANResponse(res, {
        variables: driving_variables,
      } as DatasetQueryParameters);
    }

    for (const variable of driving_variables) {
      let dsQueryData: any = {
        fq: "tags:stdvar." + variable,
        ext_bbox: `${region.bounding_box.xmin},${region.bounding_box.ymin},${region.bounding_box.xmax},${region.bounding_box.ymax}`,
      };

      let res: any = await BaseDataCatalog.fetchJson(
        `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
        dsQueryData
      );
      if (!!res && res.result && res.result.count > 0) {
        datasets = [
          ...datasets,
          ...getDatasetsFromCKANResponse(res, {
            variables: driving_variables,
          } as DatasetQueryParameters),
        ];
      }
    }
    return datasets;
  }

  public async queryDatasetResources(
    datasetid: string,
    region: Region,
    dates?: DateRange
  ): Promise<DataResource[]> {
    let resQueryData = {
      fq: "id:" + datasetid,
    };
    let obj: any = await BaseDataCatalog.fetchJson(
      `${MINT_PREFERENCES.data_catalog_api}/api/action/package_search`,
      resQueryData
    );
    let dses = getDatasetsFromCKANResponse(obj, {});
    return dses.length > 0 ? dses[0].resources : [];
  }
}