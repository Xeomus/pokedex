<template>
  <div class="app-shell">
    <AppHeader
      :search="currentSearch"
      :theme="theme"
      :theme-label="themeLabel"
      @toggle-theme="toggleTheme"
      @update:search="currentSearch = $event"
    />

    <main class="container-fluid app-main">
      <div class="pokedex-layout">
        <FilterSidebar
          :generations="generations"
          :types="types"
          :current-generation="currentGeneration"
          :current-filter="currentFilter"
          @select-generation="selectGeneration"
          @select-type="selectType"
        />

        <PokemonResults
          :pokemon="visiblePokemon"
          :selected-generation="selectedGeneration"
          :loading="loading"
          :error="error"
          @open-pokemon="openModal"
        />
      </div>
    </main>

    <PokemonModal
      ref="pokemonModal"
      :selected-pokemon="selectedPokemon"
      :loading="modalLoading"
      :error="modalError"
      @hidden="resetModal"
      @open-pokemon="openModal"
    />
  </div>
</template>

<script src="./js/PokedexView.js"></script>
<style src="./css/PokedexView.css"></style>
