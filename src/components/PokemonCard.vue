<template>
  <article
    class="card pokemon-card h-100"
    :style="pokemonAccent(pokemon)"
    tabindex="0"
    role="button"
    :aria-label="`View details for ${formatName(pokemon.name)}`"
    @click="$emit('open-pokemon', pokemon.name)"
    @keydown.enter.prevent="$emit('open-pokemon', pokemon.name)"
    @keydown.space.prevent="$emit('open-pokemon', pokemon.name)"
  >
    <div class="card-body pokemon-card-body">
      <div class="pokemon-image">
        <img class="card-img-top" :src="getSprite(pokemon)" :alt="`${formatName(pokemon.name)} artwork`">
      </div>
      <div class="pokemon-info">
        <div class="pokemon-title-row">
          <h2 class="card-title pokemon-name">
            <i class="bi bi-stars" aria-hidden="true"></i>{{ formatName(pokemon.name) }}
          </h2>
          <span class="pokemon-id">#{{ formatPokemonId(pokemon.id) }}</span>
        </div>
        <div class="pokemon-types">
          <span v-for="type in pokemon.types" :key="type.type.name" class="badge rounded-pill tipo" :class="type.type.name">
            {{ type.type.name }}
          </span>
        </div>
        <div class="pokemon-stats">
          <span class="stat"><small><i class="bi bi-arrows-vertical" aria-hidden="true"></i>Height</small>{{ pokemon.height / 10 }} m</span>
          <span class="stat"><small><i class="bi bi-box-seam" aria-hidden="true"></i>Weight</small>{{ pokemon.weight / 10 }} kg</span>
          <span class="stat"><small><i class="bi bi-star" aria-hidden="true"></i>Exp.</small>{{ pokemon.base_experience || 'n/a' }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script src="./js/PokemonCard.js"></script>
<style src="./css/PokemonCard.css"></style>
