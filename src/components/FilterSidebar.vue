<template>
  <aside
    class="filter-sidebar"
    :class="{
      'mobile-panel-active': activeMobilePanel,
      'mobile-panel-generation': activeMobilePanel === 'generation',
      'mobile-panel-type': activeMobilePanel === 'type',
    }"
  >
    <div class="filter-card">
      <div class="filter-heading">
        <div>
          <span><i class="bi bi-sliders" aria-hidden="true"></i> Filters</span>
          <strong>Generation and type</strong>
        </div>
        <button class="filter-close" type="button" aria-label="Close filters" @click="$emit('close-mobile-panel')">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>

      <section class="filter-section generation-section" aria-labelledby="generation-title">
        <h2 id="generation-title"><i class="bi bi-calendar3" aria-hidden="true"></i> Generation</h2>
        <div class="generation-filter" role="toolbar" aria-label="Filter by generation">
          <button
            v-for="generation in generations"
            :key="generation.id"
            class="btn btn-generation"
            :class="{ 'active-generation': currentGeneration === generation.id }"
            type="button"
            @click="$emit('select-generation', generation.id)"
          >
            {{ generation.label }}
          </button>
        </div>
      </section>

      <section class="filter-section type-section" aria-labelledby="type-title">
        <h2 id="type-title"><i class="bi bi-tags" aria-hidden="true"></i> Type</h2>
        <ul class="nav nav-pills nav-list" aria-label="Filter by type">
          <li v-for="type in types" :key="type.id" class="nav-item">
            <button
              class="btn btn-header"
              :class="[type.className, { active: currentFilter === type.id }]"
              type="button"
              @click="$emit('select-type', type.id)"
            >
              {{ type.label }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>

<script src="./js/FilterSidebar.js"></script>
<style src="./css/FilterSidebar.css"></style>
