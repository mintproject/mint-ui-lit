export const geometriesToGeoJson = (geometries: any[]) => {
  return {
    type: "FeatureCollection",
    features: geometries.map((geometry) => {
      return {
        type: "Feature",
        geometry: geometry,
      };
    }),
  };
};

export const geoJsonToGeometries = (geoJson: any) => {
  let geometries = [];
  if (geoJson["type"] == "FeatureCollection") {
    geoJson["features"].forEach((feature) => {
      geometries.push(feature["geometry"]);
    });
  }
  return geometries;
};
