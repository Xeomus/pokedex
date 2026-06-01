const URL = "https://pokeapi.co/api/v2/pokemon/";

const listaPokemon = document.querySelector("#listaPokemon");
const botonesHeader = document.querySelectorAll(".btn-header");
const botonesGeneracion = document.querySelectorAll(".btn-generation");
const pokemonSearch = document.querySelector("#pokemonSearch");
const modal = document.querySelector("#pokemonModal");
const modalTitle = document.querySelector("#modalPokemonTitle");
const modalContent = document.querySelector("#modalContent");

const pokemonModal = bootstrap.Modal.getOrCreateInstance(modal);

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

const pokemonCache = new Map();
const speciesCache = new Map();
const evolutionCache = new Map();

let currentFilter = "ver-todos";
let currentGeneration = "1";
let currentSearch = "";
let searchTimeout;
let loadRequestId = 0;
let modalRequestId = 0;

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
  return (
    data.sprites.other.showdown.front_default ||
    data.sprites.other["official-artwork"].front_default ||
    data.sprites.front_default
  );
}

function renderTipos(data) {
  return data.types
    .map((type) => `<span class="badge rounded-pill tipo ${type.type.name}">${type.type.name}</span>`)
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

function createPokemonCard(data) {
  const pokeId = formatPokemonId(data.id);
  const card = document.createElement("article");
  card.className = "card pokemon-card h-100";
  card.tabIndex = 0;
  card.dataset.pokemon = data.name;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Ver detalles de ${formatName(data.name)}`);

  card.innerHTML = `
    <div class="pokemon-id-back">#${pokeId}</div>
    <div class="card-body pokemon-card-body">
      <div class="pokemon-image">
        <img class="card-img-top" src="${getSprite(data)}" alt="Imagen de ${formatName(data.name)}">
      </div>
      <div class="pokemon-info">
        <div class="pokemon-title-row">
          <span class="pokemon-id">#${pokeId}</span>
          <h2 class="card-title pokemon-name">${formatName(data.name)}</h2>
        </div>
        <div class="pokemon-types">${renderTipos(data)}</div>
        <div class="pokemon-stats">
          <span class="stat"><small>Altura</small>${data.height / 10} m</span>
          <span class="stat"><small>Peso</small>${data.weight / 10} kg</span>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => abrirModal(data.name));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirModal(data.name);
    }
  });

  return card;
}

async function cargarPokemons(filtro = "ver-todos") {
  currentFilter = filtro;
  const requestId = ++loadRequestId;
  const generation = GENERATIONS[currentGeneration];

  listaPokemon.innerHTML = `<p class="loading">Cargando Pokemon de ${generation.name}...</p>`;

  try {
    const pokemons = await Promise.all(
      Array.from(
        { length: generation.end - generation.start + 1 },
        (_, index) => getPokemon(generation.start + index),
      ),
    );

    if (requestId !== loadRequestId) {
      return;
    }

    const fragment = document.createDocumentFragment();

    pokemons.forEach((pokemon) => {
      const tipos = pokemon.types.map((type) => type.type.name);
      const matchesType = filtro === "ver-todos" || tipos.includes(filtro);
      const matchesSearch = pokemon.name.includes(currentSearch);

      if (matchesType && matchesSearch) {
        fragment.append(createPokemonCard(pokemon));
      }
    });

    listaPokemon.innerHTML = "";

    if (!fragment.children.length) {
      listaPokemon.innerHTML = `<p class="loading">No hay Pokemon que coincidan en ${generation.name}.</p>`;
      return;
    }

    listaPokemon.append(fragment);
  } catch (error) {
    if (requestId === loadRequestId) {
      listaPokemon.innerHTML = '<p class="loading">No se pudieron cargar los Pokemon. Intenta de nuevo.</p>';
    }

    console.error(error);
  }
}

async function abrirModal(pokemonName) {
  const requestId = ++modalRequestId;

  modalTitle.textContent = "Cargando...";
  modalContent.innerHTML = '<p class="modal-loading">Cargando detalles...</p>';
  pokemonModal.show();

  try {
    const pokemon = await getPokemon(pokemonName);
    const species = await getSpecies(pokemon.species.url);
    const evolutionData = await getEvolutionChain(species.evolution_chain.url);
    const evolutionNames = getEvolutionNames(evolutionData.chain);
    const evolutions = await Promise.all(evolutionNames.map((name) => getPokemon(name)));

    if (requestId !== modalRequestId) {
      return;
    }

    const description =
      species.flavor_text_entries.find((entry) => entry.language.name === "es") ||
      species.flavor_text_entries.find((entry) => entry.language.name === "en");

    modalTitle.textContent = formatName(pokemon.name);
    modalContent.innerHTML = `
      <div class="modal-hero">
        <span class="pokemon-id modal-id">#${formatPokemonId(pokemon.id)}</span>
        <img src="${getSprite(pokemon)}" alt="Imagen de ${formatName(pokemon.name)}">
      </div>

      <div class="modal-info">
        <div>
          <h3>${formatName(pokemon.name)}</h3>
          <div class="pokemon-types">${renderTipos(pokemon)}</div>
        </div>

        <p class="modal-description">
          ${description ? description.flavor_text.replace(/\f|\n/g, " ") : "Sin descripcion disponible."}
        </p>

        <div class="modal-stats">
          <span><small>Altura</small>${pokemon.height / 10} m</span>
          <span><small>Peso</small>${pokemon.weight / 10} kg</span>
          <span><small>Experiencia</small>${pokemon.base_experience}</span>
          <span><small>Habilidad</small>${formatName(pokemon.abilities[0].ability.name)}</span>
        </div>

        <div>
          <h4>Evoluciones</h4>
          <div class="evolution-list">
            ${evolutions
              .map(
                (evolution) => `
                  <button class="btn evolution-card" type="button" data-evolution="${evolution.name}">
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
    if (requestId === modalRequestId) {
      modalTitle.textContent = "Error";
      modalContent.innerHTML = '<p class="modal-loading">No se pudieron cargar los detalles.</p>';
    }

    console.error(error);
  }
}

botonesHeader.forEach((boton) => {
  boton.addEventListener("click", (event) => {
    botonesHeader.forEach((item) => item.classList.remove("active"));
    event.currentTarget.classList.add("active");
    cargarPokemons(event.currentTarget.id);
  });
});

botonesGeneracion.forEach((boton) => {
  boton.addEventListener("click", (event) => {
    botonesGeneracion.forEach((item) => item.classList.remove("active-generation"));
    event.currentTarget.classList.add("active-generation");
    currentGeneration = event.currentTarget.dataset.generation;
    cargarPokemons(currentFilter);
  });
});

pokemonSearch.addEventListener("input", (event) => {
  currentSearch = event.target.value.trim().toLowerCase();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => cargarPokemons(currentFilter), 250);
});

modal.addEventListener("hidden.bs.modal", () => {
  modalTitle.textContent = "Detalles del Pokemon";
  modalContent.innerHTML = "";
});

document.querySelector("#ver-todos").classList.add("active");
cargarPokemons(currentFilter);
