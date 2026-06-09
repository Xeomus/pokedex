<template>
  <div class="modal fade pokemon-modal" ref="pokemonModal" tabindex="-1" aria-labelledby="modalPokemonTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content modal-card">
        <div class="modal-header pokemon-modal-header">
          <h2 class="modal-title" id="modalPokemonTitle">{{ modalTitle }}</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body pokemon-modal-body">
          <p v-if="loading" class="modal-loading">Loading details...</p>
          <p v-else-if="error" class="modal-loading">{{ error }}</p>

          <article v-else-if="selectedPokemon" class="modal-pokedex" :style="pokemonAccent(selectedPokemon.pokemon)">
            <aside class="modal-showcase">
              <div class="showcase-heading">
                <span><i class="bi bi-database" aria-hidden="true"></i> Pokedex</span>
                <strong>{{ formatName(selectedPokemon.pokemon.name) }}</strong>
                <small>#{{ formatPokemonId(selectedPokemon.pokemon.id) }} - {{ selectedPokemon.genus }}</small>
              </div>

              <div class="showcase-art">
                <img :src="getSprite(selectedPokemon.pokemon)" :alt="`${formatName(selectedPokemon.pokemon.name)} artwork`">
              </div>

              <div class="showcase-evolutions">
                <div class="section-heading">
                  <span><i class="bi bi-diagram-3" aria-hidden="true"></i> Evolution line</span>
                  <h3>{{ selectedPokemon.evolutions.length }} {{ selectedPokemon.evolutions.length === 1 ? 'stage' : 'stages' }}</h3>
                </div>
                <div class="evolution-list">
                  <button v-for="evolution in selectedPokemon.evolutions" :key="evolution.id" class="btn evolution-card" type="button" @click="$emit('open-pokemon', evolution.name)">
                    <img :src="getSprite(evolution)" :alt="`${formatName(evolution.name)} artwork`">
                    <span>#{{ formatPokemonId(evolution.id) }}</span>
                    <strong>{{ formatName(evolution.name) }}</strong>
                  </button>
                </div>
              </div>
            </aside>

            <section class="modal-detail-panel">
              <nav class="detail-tabs" aria-label="Pokemon detail sections">
                <button v-for="tab in detailTabs" :key="tab.id" class="detail-tab" :class="{ active: activeDetailTab === tab.id }" type="button" @click="activeDetailTab = tab.id">
                  <i :class="['bi', tab.icon]" aria-hidden="true"></i>{{ tab.label }}
                </button>
              </nav>

              <section class="detail-section" :class="{ active: activeDetailTab === 'about' }">
                <div class="section-heading">
                  <span><i class="bi bi-info-circle" aria-hidden="true"></i> About</span>
                  <h3>Summary</h3>
                </div>
                <div class="about-summary">
                  <p class="modal-description">{{ selectedPokemon.description }}</p>
                  <div class="about-types">
                    <h4>Types</h4>
                    <div class="pokemon-types">
                      <span v-for="type in selectedPokemon.pokemon.types" :key="type.type.name" class="badge rounded-pill tipo" :class="type.type.name">
                        {{ type.type.name }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="detail-grid">
                  <span v-for="item in aboutFields" :key="item.label" class="detail-stat">
                    <span class="field-icon"><i :class="['bi', item.icon]" aria-hidden="true"></i></span>
                    <span><small>{{ item.label }}</small><strong>{{ item.value || 'n/a' }}</strong></span>
                  </span>
                </div>
                <div class="data-block">
                  <h4>Abilities</h4>
                  <div class="chip-list">
                    <span v-for="ability in selectedPokemon.abilities" :key="ability" class="data-chip">{{ ability }}</span>
                  </div>
                </div>
                <div class="data-block">
                  <h4>Held items</h4>
                  <div class="chip-list">
                    <span v-for="item in selectedPokemon.heldItems" :key="item" class="data-chip">{{ item }}</span>
                    <span v-if="!selectedPokemon.heldItems.length" class="data-chip muted">No held items</span>
                  </div>
                </div>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'biology' }">
                <div class="section-heading">
                  <span><i class="bi bi-flower1" aria-hidden="true"></i> Biology</span>
                  <h3>Species and breeding</h3>
                </div>
                <div class="detail-grid">
                  <span v-for="item in biologyFields" :key="item.label" class="detail-stat">
                    <span class="field-icon"><i :class="['bi', item.icon]" aria-hidden="true"></i></span>
                    <span><small>{{ item.label }}</small><strong>{{ item.value || 'n/a' }}</strong></span>
                  </span>
                </div>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'stats' }">
                <div class="section-heading">
                  <span><i class="bi bi-bar-chart" aria-hidden="true"></i> Stats</span>
                  <h3>Combat</h3>
                </div>
                <div class="stat-list">
                  <div v-for="stat in selectedPokemon.pokemon.stats" :key="stat.stat.name" class="stat-row">
                    <span>{{ formatName(stat.stat.name) }}</span>
                    <strong>{{ stat.base_stat }}</strong>
                    <div class="stat-bar"><i :style="{ width: statWidth(stat.base_stat) }"></i></div>
                  </div>
                </div>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'moves' }">
                <div class="section-heading">
                  <span><i class="bi bi-lightning" aria-hidden="true"></i> Moves</span>
                  <h3>{{ selectedPokemon.pokemon.moves.length }} moves</h3>
                </div>
                <div v-if="moveGroups.length" class="move-group-tabs" aria-label="Move groups">
                  <button v-for="group in moveGroups" :key="group.id" class="move-group-tab" :class="{ active: activeMoveTab === group.id }" type="button" @click="activeMoveTab = group.id">
                    <i class="bi bi-lightning-charge" aria-hidden="true"></i>{{ group.label }} <span>{{ group.moves.length }}</span>
                  </button>
                </div>
                <div v-for="group in moveGroups" :key="group.id" class="move-group-panel" :class="{ active: activeMoveTab === group.id }">
                  <div class="move-list">
                    <span v-for="move in group.moves" :key="move.move.name" class="move-chip">
                      <strong>{{ formatName(move.move.name) }}</strong>
                      <small>{{ moveLabel(move) }}</small>
                    </span>
                  </div>
                </div>
                <span v-if="!moveGroups.length" class="data-chip muted">No moves</span>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'games' }">
                <div class="section-heading">
                  <span><i class="bi bi-controller" aria-hidden="true"></i> Games</span>
                  <h3>Versions and forms</h3>
                </div>
                <div class="data-block">
                  <h4>Forms and varieties</h4>
                  <div class="chip-list">
                    <span v-for="form in selectedPokemon.formVarieties" :key="form" class="data-chip">{{ form }}</span>
                  </div>
                </div>
                <div class="data-block">
                  <h4>Game versions</h4>
                  <div class="chip-list">
                    <span v-for="version in selectedPokemon.gameVersions" :key="version" class="data-chip">{{ version }}</span>
                    <span v-if="!selectedPokemon.gameVersions.length" class="data-chip muted">No versions</span>
                  </div>
                </div>
                <div class="detail-grid two-columns">
                  <span v-for="item in gameFields" :key="item.label" class="detail-stat">
                    <span class="field-icon"><i :class="['bi', item.icon]" aria-hidden="true"></i></span>
                    <span><small>{{ item.label }}</small><strong>{{ item.value }}</strong></span>
                  </span>
                </div>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'locations' }">
                <div class="section-heading">
                  <span><i class="bi bi-geo-alt" aria-hidden="true"></i> Locations</span>
                  <h3>Registered encounters</h3>
                </div>
                <template v-if="locationGroups.length">
                  <div class="location-group-tabs" aria-label="Location regions">
                    <button v-for="group in locationGroups" :key="group.id" class="location-group-tab" :class="{ active: activeLocationTab === group.id }" type="button" @click="activeLocationTab = group.id">
                      <i class="bi bi-map" aria-hidden="true"></i>{{ group.region }} <span>{{ group.items.length }}</span>
                    </button>
                  </div>
                  <div v-for="group in locationGroups" :key="group.id" class="location-group-panel" :class="{ active: activeLocationTab === group.id }">
                    <div class="location-list">
                      <article v-for="encounter in group.items" :key="`${encounter.locationName}-${encounter.areaName}`" class="location-card">
                        <div class="location-real"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></div>
                        <div>
                          <strong>{{ encounter.locationName }}</strong>
                          <span>{{ encounter.areaName }}</span>
                        </div>
                      </article>
                    </div>
                  </div>
                </template>
                <span v-else class="location-card empty">No registered locations</span>
              </section>

              <section class="detail-section" :class="{ active: activeDetailTab === 'media' }">
                <div class="section-heading">
                  <span><i class="bi bi-images" aria-hidden="true"></i> Media</span>
                  <h3>Sprites and artwork</h3>
                </div>
                <div class="sprite-grid">
                  <figure v-for="sprite in spriteGallery" :key="sprite.label" class="sprite-tile">
                    <img :src="sprite.src" :alt="sprite.label">
                    <figcaption>{{ sprite.label }}</figcaption>
                  </figure>
                </div>
                <span v-if="!spriteGallery.length" class="data-chip muted">No sprites</span>
              </section>
            </section>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./js/PokemonModal.js"></script>
<style src="./css/PokemonModal.css"></style>
