import { CKANDataCatalog } from "../ckan-data-catalog";
import { Region } from "screens/regions/reducers";
import { DateRange } from "screens/modeling/reducers";
import { Dataset, DataResource } from "screens/datasets/reducers";
import { MINT_PREFERENCES } from "config";

// Mock fetch
(global as any).fetch = jest.fn();

// Mock MINT_PREFERENCES
jest.mock("config", () => ({
  MINT_PREFERENCES: {
    data_catalog_api: "http://test-api",
    data_catalog_type: "CKAN"
  }
}));

describe("CKANDataCatalog", () => {
  let catalog: CKANDataCatalog;
  const mockRegion: Region = {
    id: "test-region",
    name: "Test Region",
    category_id: "test-category",
    geometries: [],
    bounding_box: {
      xmin: -180,
      ymin: -90,
      xmax: 180,
      ymax: 90
    }
  };

  const mockDateRange: DateRange = {
    start_date: new Date("2020-01-01"),
    end_date: new Date("2020-12-31")
  };

  beforeEach(() => {
    catalog = new CKANDataCatalog();
    (global as any).fetch.mockClear();
  });

  describe("getDataset", () => {
    it("should return a dataset when found", async () => {
      const mockDataset = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0",
          resources: [],
          temporal_coverage_start: "2020-01-01",
          temporal_coverage_end: "2020-12-31"
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDataset)
      });

      const result = await catalog.getDataset("test-dataset");
      expect(result).toBeDefined();
      expect(result?.id).toBe("test-dataset");
      expect(result?.name).toBe("Test Dataset");
    });

    it("should return null when dataset not found", async () => {
      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ result: null })
      });

      const result = await catalog.getDataset("non-existent-dataset");
      expect(result).toBeNull();
    });
  });

  describe("listDatasetsByRegion", () => {
    it("should return datasets for a given region", async () => {
      const mockResponse = {
        result: {
          results: [
            {
              id: "test-dataset-1",
              title: "Test Dataset 1",
              notes: "Test Description 1",
              version: "1.0",
              resources: [],
              temporal_coverage_start: "2020-01-01",
              temporal_coverage_end: "2020-12-31"
            }
          ]
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await catalog.listDatasetsByRegion(mockRegion);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("test-dataset-1");
    });
  });

  describe("listDatasetsByVariableNameRegionDates", () => {
    it("should return datasets filtered by variables and date range", async () => {
      const mockResponse = {
        result: {
          results: [
            {
              id: "test-dataset-1",
              title: "Test Dataset 1",
              notes: "Test Description 1",
              version: "1.0",
              resources: [
                {
                  id: "resource-1",
                  name: "Resource 1",
                  mint_standard_variables: ["temperature"]
                }
              ],
              temporal_coverage_start: "2020-01-01",
              temporal_coverage_end: "2020-12-31"
            }
          ]
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await catalog.listDatasetsByVariableNameRegionDates(
        ["temperature"],
        mockRegion,
        mockDateRange
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("test-dataset-1");
    });
  });

  describe("listResourcesByDataset", () => {
    it("should return resources for a dataset", async () => {
      const mockResponse = {
        result: {
          id: "test-dataset",
          title: "Test Dataset",
          notes: "Test Description",
          version: "1.0",
          resources: [
            {
              id: "resource-1",
              name: "Resource 1",
              mint_standard_variables: ["temperature"]
            }
          ],
          temporal_coverage_start: "2020-01-01",
          temporal_coverage_end: "2020-12-31"
        }
      };

      (global as any).fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await catalog.listResourcesByDataset(
        "test-dataset",
        mockRegion,
        mockDateRange,
        ["temperature"]
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("resource-1");
    });
  });
});