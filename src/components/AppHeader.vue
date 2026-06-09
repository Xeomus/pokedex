<template>
  <header class="app-header">
    <nav class="navbar app-navbar">
      <div class="container-fluid app-nav-container">
        <a class="navbar-brand app-brand" href="#" aria-label="Pokedex">
          <img src="../img/logo.png" alt="Pokedex logo" class="app-logo">
        </a>

        <div class="nav-copy">
          <span><i class="bi bi-compass" aria-hidden="true"></i>Pokedex Explorer</span>
          <strong>Search, filter, and inspect evolutions</strong>
        </div>

        <button class="theme-toggle" type="button" @click="$emit('toggle-theme')" :aria-label="themeLabel">
          <i :class="['bi', theme === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill', 'theme-toggle-icon']" aria-hidden="true"></i>
          <span class="theme-toggle-text">{{ theme === 'light' ? 'Dark' : 'Light' }}</span>
        </button>

        <form class="app-search input-group" role="search" @submit.prevent>
          <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i> Search</span>
          <input
            class="form-control"
            type="search"
            :value="search"
            placeholder="Pokemon name"
            aria-label="Search Pokemon by name"
            @input="$emit('update:search', $event.target.value.trim())"
          >
        </form>
      </div>
    </nav>
  </header>
</template>

<script src="./js/AppHeader.js"></script>
<style src="./css/AppHeader.css"></style>
