const URL = `https://pokeapi.co/api/v2/pokemon/`;

const listaPokemon = document.querySelector("#listaPokemon");
const botonesHeader = document.querySelectorAll(".btn-header");

async function cargarPokemons(filtro = "ver-todos") {
  listaPokemon.innerHTML = "";

  for (let i = 1; i <= 151; i++) {
    const response = await fetch(URL + i);
    const data = await response.json();

    const tipos = data.types.map((type) => type.type.name);

    if (filtro === "ver-todos" || tipos.includes(filtro)) {
      mostrarPokemon(data);
    }
  }
}

function mostrarPokemon(data) {
  let tipos = data.types.map(
    (type) => `<p class="${type.type.name} tipo">${type.type.name}</p>`,
  );
  tipos = tipos.join("");

  let pokeId = data.id.toString();

  if (pokeId.length === 1) {
    pokeId = "00" + pokeId;
  } else if (pokeId.length === 2) {
    pokeId = "0" + pokeId;
  }

  const div = document.createElement("div");
  div.classList.add("pokemon");

  div.innerHTML = `
    <p class="pokemon-id-back">#${pokeId}</p>

    <div class="pokemon-imagen">
      <img src="${data.sprites.other.showdown.front_default}" alt="Imagen del Pokemon">
    </div>

    <div class="pokemon-info">
      <div class="nombre-contenedor">
        <p class="pokemon-id">#${pokeId}</p>
        <h2 class="pokemon-nombre">${data.name}</h2>
      </div>

      <div class="pokemon-tipos">
        ${tipos}
      </div>

      <div class="pokemon-stats">
        <p class="stat">${data.height}</p>
        <p class="stat">${data.weight}</p>
      </div>
    </div>
  `;

  listaPokemon.append(div);
}

botonesHeader.forEach((boton) => {
  boton.addEventListener("click", (e) => {
    const botonId = e.currentTarget.id;
    cargarPokemons(botonId);
  });
});

cargarPokemons();
