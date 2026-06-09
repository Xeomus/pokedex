const API_URL = "https://pokeapi.co/api/v2/pokemon/";

const pokemonCache = new Map();
const speciesCache = new Map();
const evolutionCache = new Map();
const encountersCache = new Map();
const locationAreaCache = new Map();
const locationCache = new Map();

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load: ${url}`);
  }

  return response.json();
}

export async function getPokemon(idOrName) {
  const key = idOrName.toString().toLowerCase();

  if (pokemonCache.has(key)) {
    return pokemonCache.get(key);
  }

  const data = await fetchJson(API_URL + key);
  pokemonCache.set(key, data);
  pokemonCache.set(data.id.toString(), data);
  pokemonCache.set(data.name, data);

  return data;
}

async function getCachedJson(cache, url) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const data = await fetchJson(url);
  cache.set(url, data);
  return data;
}

export function getSpecies(url) {
  return getCachedJson(speciesCache, url);
}

export function getEvolutionChain(url) {
  return getCachedJson(evolutionCache, url);
}

export function getEncounters(url) {
  return getCachedJson(encountersCache, url);
}

export function getLocationArea(url) {
  return getCachedJson(locationAreaCache, url);
}

export function getLocation(url) {
  return getCachedJson(locationCache, url);
}
