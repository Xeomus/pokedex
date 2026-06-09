<template>
  <section id="todos" class="pokemon-results">
    <div class="results-heading">
      <span><i class="bi bi-grid-3x3-gap" aria-hidden="true"></i> Results</span>
      <strong>National Pokedex</strong>
    </div>

    <p v-if="loading" class="loading">Loading Pokemon from {{ selectedGeneration.label }}...</p>
    <p v-else-if="error" class="loading">{{ error }}</p>
    <p v-else-if="!pokemon.length" class="loading">No Pokemon match in {{ selectedGeneration.label }}.</p>

    <div v-else class="pokemon-todos">
      <PokemonCard
        v-for="item in pokemon"
        :key="item.id"
        :pokemon="item"
        @open-pokemon="$emit('open-pokemon', $event)"
      />
    </div>
  </section>
</template>

<script src="./js/PokemonResults.js"></script>
<style src="./css/PokemonResults.css"></style>
