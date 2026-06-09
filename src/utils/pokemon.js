export function formatPokemonId(id) {
  return id.toString().padStart(3, "0");
}

export function formatName(name = "") {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getSprite(data) {
  return data.sprites.other.showdown.front_default || data.sprites.other["official-artwork"].front_default || data.sprites.front_default;
}

export function getPrimaryType(data) {
  return data.types[0]?.type.name || "normal";
}

export function pokemonAccent(data) {
  return { "--pokemon-accent": `var(--type-${getPrimaryType(data)})` };
}

export function cleanText(text) {
  return text ? text.replace(/\f|\n|\r/g, " ") : "";
}

export function getLocalizedName(names, fallback) {
  return names?.find((item) => item.language.name === "en")?.name || formatName(fallback || "");
}

export function uniqueByName(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function slugify(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export function evolutionNames(chain) {
  const names = [];
  const walk = (node) => {
    names.push(node.species.name);
    node.evolves_to.forEach(walk);
  };

  walk(chain);
  return names;
}
