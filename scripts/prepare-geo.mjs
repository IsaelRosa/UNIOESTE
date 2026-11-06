import fs from "node:fs";

const csv = fs.readFileSync("/tmp/municipios.csv", "utf8").trim().split("\n");
const header = csv[0].split(",");
const idx = (name) => header.indexOf(name);
const rows = csv.slice(1).map((line) => {
  const cells = line.split(",");
  return {
    ibge: cells[idx("codigo_ibge")],
    name: cells[idx("nome")],
    lat: Number(cells[idx("latitude")]),
    lng: Number(cells[idx("longitude")]),
    uf: cells[idx("codigo_uf")],
  };
});

const HUB_REGIONS = [
  { region: "Metropolitana de Curitiba", lat: -25.43, lng: -49.27 },
  { region: "Campos Gerais", lat: -25.09, lng: -50.16 },
  { region: "Centro-Sul", lat: -25.39, lng: -51.46 },
  { region: "Oeste", lat: -24.96, lng: -53.46 },
  { region: "Extremo Oeste", lat: -25.55, lng: -54.58 },
  { region: "Noroeste", lat: -23.77, lng: -53.32 },
  { region: "Centro-Ocidental", lat: -24.04, lng: -52.38 },
  { region: "Norte Central", lat: -23.42, lng: -51.94 },
  { region: "Norte", lat: -23.31, lng: -51.16 },
  { region: "Norte Pioneiro", lat: -23.18, lng: -50.65 },
  { region: "Noroeste Setentrional", lat: -23.07, lng: -52.46 },
  { region: "Centro-Sul Serrano", lat: -25.47, lng: -50.65 },
  { region: "Sudeste", lat: -26.23, lng: -51.08 },
];

const pr = rows
  .filter((r) => r.uf === "41")
  .map((r) => {
    let best = HUB_REGIONS[0];
    let bestDist = Infinity;
    for (const hub of HUB_REGIONS) {
      const d = (r.lat - hub.lat) ** 2 + (r.lng - hub.lng) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = hub;
      }
    }
    return {
      ibge: r.ibge,
      name: r.name,
      lat: Number(r.lat.toFixed(4)),
      lng: Number(r.lng.toFixed(4)),
      region: best.region,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const out = `// Generated from the public "Municípios Brasileiros" dataset (IBGE codes + coordinates).
// Regionalization is an approximate nearest-hub grouping used for the prototype and is
// fully parameterizable by the official Paraná regionalization in production.
export type MunicipalitySeed = {
  ibge: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
};

export const PR_REGIONS = ${JSON.stringify(
  HUB_REGIONS.map((h) => h.region),
  null,
  2,
)} as const;

export const MUNICIPALITIES: MunicipalitySeed[] = ${JSON.stringify(pr)};
`;

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/municipalities.ts", out);

// ---- Paraná outline -------------------------------------------------------
const states = JSON.parse(fs.readFileSync("/tmp/states.geojson", "utf8"));
const feature = states.features.find((f) => {
  const props = f.properties ?? {};
  return Object.values(props).some(
    (v) => typeof v === "string" && v.trim().toLowerCase() === "paraná",
  );
});

const rings = [];
const geom = feature.geometry;
if (geom.type === "Polygon") rings.push(...geom.coordinates);
else if (geom.type === "MultiPolygon") {
  for (const poly of geom.coordinates) rings.push(...poly);
}
const mainRing = rings.sort((a, b) => b.length - a.length)[0];

function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + clamped * dx), p[1] - (a[1] + clamped * dy));
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > tolerance) {
    const left = simplify(points.slice(0, index + 1), tolerance);
    const right = simplify(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

const simplified = simplify(mainRing, 0.012);
let minLng = Infinity;
let maxLng = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;
for (const [lng, lat] of simplified) {
  minLng = Math.min(minLng, lng);
  maxLng = Math.max(maxLng, lng);
  minLat = Math.min(minLat, lat);
  maxLat = Math.max(maxLat, lat);
}

const WIDTH = 700;
const geo = {
  minLng,
  maxLng,
  minLat,
  maxLat,
};
const project = (lng, lat) => {
  const x = ((lng - minLng) / (maxLng - minLng)) * WIDTH;
  const height = WIDTH * ((maxLat - minLat) / (maxLng - minLng));
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * height;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
};

const projected = simplified.map(([lng, lat]) => project(lng, lat));
const path = `M ${projected.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
const ys = projected.map((p) => p[1]);
const height = Math.max(...ys) + 8;

const outline = `// Simplified outline of the State of Paraná (public domain geodata, ~${simplified.length} points)
// projected to a ${WIDTH}x${Math.ceil(height)} SVG viewBox.
export const PARANA_GEO = ${JSON.stringify(geo)};
export const PARANA_VIEWBOX = ${JSON.stringify({ width: WIDTH, height: Math.ceil(height) })};
export const PARANA_PATH = ${JSON.stringify(path)};
export function projectPoint(lng: number, lat: number): [number, number] {
  const x = ((lng - PARANA_GEO.minLng) / (PARANA_GEO.maxLng - PARANA_GEO.minLng)) * PARANA_VIEWBOX.width;
  const y = (1 - (lat - PARANA_GEO.minLat) / (PARANA_GEO.maxLat - PARANA_GEO.minLat)) * PARANA_VIEWBOX.height;
  return [x, y];
}
`;
fs.writeFileSync("src/data/parana.ts", outline);

console.log("municipalities:", pr.length, "regions:", new Set(pr.map((m) => m.region)).size);
console.log("outline points:", simplified.length, "viewbox:", WIDTH, Math.ceil(height));
