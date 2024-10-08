export const mapStyles: google.maps.MapTypeStyle[] = [
  {
    stylers: [
      { hue: "#00aaff" },
      { saturation: -100 },
      { lightness: 12 },
      { gamma: 2.15 },
    ],
  },
  {
    featureType: "landscape",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 57 }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ lightness: 24 }, { visibility: "on" }],
  },
  {
    featureType: "road.highway",
    stylers: [{ weight: 1 }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    stylers: [
      { color: "#206fff" },
      { saturation: -35 },
      { lightness: 50 },
      { visibility: "on" },
      { weight: 1.5 },
    ],
  },
];
