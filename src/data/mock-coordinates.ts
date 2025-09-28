export const knownLocations = [
  {
    name: "Nairobi CBD",
    coordinates: [-1.286389, 36.817223],
    expected: {
      county: "nairobi",
      ward: "nairobi central",
      constituency: "starehe",
    },
  },
  {
    name: "Kiambu Town",
    coordinates: [-1.16972893282049, 36.82946781044468],
    expected: {
      county: "kiambu",
      ward: "riabai",
      constituency: "kiambu",
    },
  },
  {
    name: "Kalama Area",
    coordinates: [-1.6725405427262028, 37.25285675999058],
    expected: {
      county: "machakos",
      ward: "kalama",
      constituency: "machakos town",
    },
  },
  {
    name: "Machakos Town",
    coordinates: [-0.8540481379611513, 37.69510191590412],
    expected: {
      county: "machakos",
      ward: "machakos central",
      constituency: "machakos town",
    },
  },
  {
    name: "Mombasa Island",
    coordinates: [-4.0435, 39.6682],
    expected: {
      county: "mombasa",
      ward: "mji wa kale/makadara",
      constituency: "mvita",
    },
  },
  {
    name: "Kisumu City",
    coordinates: [-0.0917, 34.768],
    expected: {
      county: "kisumu",
      ward: "market milimani",
      constituency: "kisumu central",
    },
  },
  {
    name: "Nakuru Town",
    coordinates: [-0.3031, 36.08],
    expected: {
      county: "nakuru",
      ward: "nakuru east",
      constituency: "nakuru town east",
    },
  },
  {
    name: "Eldoret Town",
    coordinates: [0.5143, 35.2698],
    expected: {
      county: "uasin gishu",
      ward: "langas",
      constituency: "eldoret east",
    },
  },
] as const;
