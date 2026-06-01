const URL = "https://pokeapi.co/api/v2/pokemon/";

const listaPokemon = document.querySelector("#listaPokemon");
const botonesHeader = document.querySelectorAll(".btn-header");
const botonesGeneracion = document.querySelectorAll(".btn-generation");
const pokemonSearch = document.querySelector("#pokemonSearch");
const filterToggle = document.querySelector(".filter-toggle");
const navFilters = document.querySelector("#navFilters");
const modal = document.querySelector("#pokemonModal");
const modalContent = document.querySelector("#modalContent");
const pokemonModal = bootstrap.Modal.getOrCreateInstance(modal);

// Rangos oficiales de la Pokédex nacional por generación.
const GENERATIONS = {
  1: { name: "Gen I", start: 1, end: 151 },
  2: { name: "Gen II", start: 152, end: 251 },
  3: { name: "Gen III", start: 252, end: 386 },
  4: { name: "Gen IV", start: 387, end: 493 },
  5: { name: "Gen V", start: 494, end: 649 },
  6: { name: "Gen VI", start: 650, end: 721 },
  7: { name: "Gen VII", start: 722, end: 809 },
  8: { name: "Gen VIII", start: 810, end: 905 },
  9: { name: "Gen IX", start: 906, end: 1025 },
};

// Cache local en memoria para no pedir el mismo recurso más de una vez.
const pokemonCache = new Map();
const speciesCache = new Map();
const evolutionCache = new Map();
let currentFilter = "ver-todos";
let currentGeneration = "1";
let currentSearch = "";
let searchTimeout;

function closeMobileFilters() {
  navFilters.classList.remove("filters-open");
  filterToggle.setAttribute("aria-expanded", "false");
}

function formatPokemonId(id) {
  return id.toString().padStart(3, "0");
}

function formatName(name) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSprite(data) {
  // Algunos sprites animados no existen; se usa artwork o sprite básico como respaldo.
  return (
    data.sprites.other.showdown.front_default ||
    data.sprites.other["official-artwork"].front_default ||
    data.sprites.front_default
  );
}

function renderTipos(data) {
  return data.types
    .map((type) => `<p class="${type.type.name} tipo">${type.type.name}</p>`)
    .join("");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar: ${url}`);
  }

  return response.json();
}

async function getPokemon(idOrName) {
  const key = idOrName.toString().toLowerCase();

  if (pokemonCache.has(key)) {
    return pokemonCache.get(key);
  }

  const data = await fetchJson(URL + key);

  pokemonCache.set(key, data);
  pokemonCache.set(data.id.toString(), data);
  pokemonCache.set(data.name, data);

  return data;
}

async function getSpecies(url) {
  if (speciesCache.has(url)) {
    return speciesCache.get(url);
  }

  const data = await fetchJson(url);
  speciesCache.set(url, data);

  return data;
}

async function getEvolutionChain(url) {
  if (evolutionCache.has(url)) {
    return evolutionCache.get(url);
  }

  const data = await fetchJson(url);
  evolutionCache.set(url, data);

  return data;
}

function getEvolutionNames(chain) {
  const names = [];

  function walk(node) {
    names.push(node.species.name);
    node.evolves_to.forEach(walk);
  }

  walk(chain);
  return names;
}

// Carga la generación activa y aplica filtros por tipo y búsqueda.
async function cargarPokemons(filtro = "ver-todos") {
  currentFilter = filtro;
  const generation = GENERATIONS[currentGeneration];
  listaPokemon.innerHTML = `<p class="loading">Cargando Pokemon de ${generation.name}...</p>`;

  try {
    const pokemons = await Promise.all(
      Array.from(
        { length: generation.end - generation.start + 1 },
        (_, index) => getPokemon(generation.start + index),
      ),
    );

    listaPokemon.innerHTML = "";

    pokemons.forEach((pokemon) => {
      const tipos = pokemon.types.map((type) => type.type.name);
      const matchesType = filtro === "ver-todos" || tipos.includes(filtro);
      const matchesSearch = pokemon.name.includes(currentSearch);

      if (matchesType && matchesSearch) {
        mostrarPokemon(pokemon);
      }
    });

    if (!listaPokemon.children.length) {
      listaPokemon.innerHTML = `<p class="loading">No hay Pokemon que coincidan en ${generation.name}.</p>`;
    }
  } catch (error) {
    listaPokemon.innerHTML = '<p class="loading">No se pudieron cargar los Pokemon. Intenta de nuevo.</p>';
    console.error(error);
  }
}

function mostrarPokemon(data) {
  const pokeId = formatPokemonId(data.id);
  const div = document.createElement("article");
  div.classList.add("pokemon", "card", "h-100");
  div.dataset.pokemon = data.name;
  div.tabIndex = 0;
  div.setAttribute("role", "button");
  div.setAttribute("aria-label", `Ver detalles de ${formatName(data.name)}`);

  div.innerHTML = `
    <p class="pokemon-id-back">#${pokeId}</p>

    <div class="pokemon-card-body card-body">
      <div class="pokemon-imagen">
        <img src="${getSprite(data)}" alt="Imagen de ${formatName(data.name)}">
      </div>

      <div class="pokemon-info">
        <div class="nombre-contenedor">
          <p class="pokemon-id">#${pokeId}</p>
          <h2 class="pokemon-nombre card-title">${formatName(data.name)}</h2>
        </div>

        <div class="pokemon-tipos">
          ${renderTipos(data)}
        </div>

        <div class="pokemon-stats">
          <p class="stat"><span>Altura</span>${data.height / 10} m</p>
          <p class="stat"><span>Peso</span>${data.weight / 10} kg</p>
        </div>
      </div>
    </div>
  `;

  div.addEventListener("click", () => abrirModal(data.name));
  div.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrirModal(data.name);
    }
  });

  listaPokemon.append(div);
}

// El modal usa species y evolution-chain porque esos datos no vienen en /pokemon.
async function abrirModal(pokemonName) {
  pokemonModal.show();
  modalContent.innerHTML = '<p class="modal-loading">Cargando detalles...</p>';

  try {
    const pokemon = await getPokemon(pokemonName);
    const species = await getSpecies(pokemon.species.url);
    const evolutionData = await getEvolutionChain(species.evolution_chain.url);
    const evolutionNames = getEvolutionNames(evolutionData.chain);
    const evolutions = await Promise.all(evolutionNames.map((name) => getPokemon(name)));

    const description =
      species.flavor_text_entries.find((entry) => entry.language.name === "es") ||
      species.flavor_text_entries.find((entry) => entry.language.name === "en");

    modalContent.innerHTML = `
      <div class="modal-hero">
        <p class="pokemon-id modal-id">#${formatPokemonId(pokemon.id)}</p>
        <img src="${getSprite(pokemon)}" alt="Imagen de ${formatName(pokemon.name)}">
      </div>

      <div class="modal-info">
        <div>
          <h2>${formatName(pokemon.name)}</h2>
          <div class="pokemon-tipos">${renderTipos(pokemon)}</div>
        </div>

        <p class="modal-description">
          ${description ? description.flavor_text.replace(/\f|\n/g, " ") : "Sin descripcion disponible."}
        </p>

        <div class="modal-stats">
          <p><span>Altura</span>${pokemon.height / 10} m</p>
          <p><span>Peso</span>${pokemon.weight / 10} kg</p>
          <p><span>Experiencia</span>${pokemon.base_experience}</p>
          <p><span>Habilidad</span>${formatName(pokemon.abilities[0].ability.name)}</p>
        </div>

        <div>
          <h3>Evoluciones</h3>
          <div class="evolution-list">
            ${evolutions
              .map(
                (evolution) => `
                  <button class="evolution-card btn" type="button" data-evolution="${evolution.name}">
                    <img src="${getSprite(evolution)}" alt="${formatName(evolution.name)}">
                    <span>#${formatPokemonId(evolution.id)}</span>
                    <strong>${formatName(evolution.name)}</strong>
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    modalContent.querySelectorAll(".evolution-card").forEach((button) => {
      button.addEventListener("click", () => abrirModal(button.dataset.evolution));
    });
  } catch (error) {
    modalContent.innerHTML = '<p class="modal-loading">No se pudieron cargar los detalles.</p>';
    console.error(error);
  }
}

function cerrarModal() {
  pokemonModal.hide();
}

botonesHeader.forEach((boton) => {
  boton.addEventListener("click", (e) => {
    botonesHeader.forEach((item) => item.classList.remove("active"));
    e.currentTarget.classList.add("active");
    cargarPokemons(e.currentTarget.id);
    closeMobileFilters();
  });
});

botonesGeneracion.forEach((boton) => {
  boton.addEventListener("click", (e) => {
    botonesGeneracion.forEach((item) => item.classList.remove("active-generation"));
    e.currentTarget.classList.add("active-generation");
    currentGeneration = e.currentTarget.dataset.generation;
    cargarPokemons(currentFilter);
    closeMobileFilters();
  });
});

filterToggle.addEventListener("click", () => {
  const isOpen = navFilters.classList.toggle("filters-open");
  filterToggle.setAttribute("aria-expanded", isOpen.toString());
});

pokemonSearch.addEventListener("input", (e) => {
  currentSearch = e.target.value.trim().toLowerCase();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => cargarPokemons(currentFilter), 250);
});

document.querySelector("#ver-todos").classList.add("active");

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) {
    cerrarModal();
  }
});

cargarPokemons(currentFilter);
