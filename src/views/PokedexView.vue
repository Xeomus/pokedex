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
          :active-mobile-panel="activeMobileFilter"
          @close-mobile-panel="closeMobileFilter"
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

    <button
      v-if="activeMobileFilter"
      class="mobile-filter-backdrop"
      type="button"
      aria-label="Close filters"
      @click="closeMobileFilter"
    ></button>

    <nav class="mobile-action-nav" aria-label="Mobile navigation">
      <button
        class="mobile-action-button"
        :class="{ active: activeMobileFilter === 'generation' }"
        type="button"
        @click="openMobileFilter('generation')"
      >
        <i class="bi bi-calendar3" aria-hidden="true"></i>
        <span>Gen</span>
      </button>
      <button
        class="mobile-action-button"
        :class="{ active: activeMobileFilter === 'type' }"
        type="button"
        @click="openMobileFilter('type')"
      >
        <i class="bi bi-tags" aria-hidden="true"></i>
        <span>Tipos</span>
      </button>
      <button class="mobile-action-button" type="button" @click="toggleTheme" :aria-label="themeLabel">
        <i :class="['bi', theme === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill']" aria-hidden="true"></i>
        <span>{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
      </button>
    </nav>

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
