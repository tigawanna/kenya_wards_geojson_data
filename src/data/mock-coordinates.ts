export const knownLocations = [
  {
    name: "Nairobi CBD",
    coordinates: [-1.286389, 36.817223],
    expected: {
      id: 1297,
      wardCode: '1439',
      ward: 'Nairobi Central',
      county: 'Nairobi',
      countyCode: 47,
      subCounty: null,
      constituency: 'Starehe',
      constituencyCode: 289
    },
  },
  {
    name: "Kiambu Town",
    coordinates: [-1.16972893282049, 36.82946781044468],
    expected: {
      id: 519,
      wardCode: '584',
      ward: 'Riabai',
      county: 'Kiambu',
      countyCode: 22,
      subCounty: null,
      constituency: 'Kiambu',
      constituencyCode: 117
    },
  },
  {
    name: "Kalama Area",
    coordinates: [-1.6725405427262028, 37.25285675999058],
    expected: {
      id: 1231,
      wardCode: '419',
      ward: 'Kiima Kiu/Kalanzoni',
      county: 'Makueni',
      countyCode: 17,
      subCounty: null,
      constituency: 'Kilome',
      constituencyCode: 84
    },
  },
  {
    name: "Machakos Town",
    coordinates: [-0.8540481379611513, 37.69510191590412],
    expected: {
      id: 174,
      wardCode: '371',
      ward: 'Kivaa',
      county: 'Machakos',
      countyCode: 16,
      subCounty: null,
      constituency: 'Masinga',
      constituencyCode: 75
    },
  },
] as const;
