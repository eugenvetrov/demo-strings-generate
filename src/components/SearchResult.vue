<script lang="ts" setup>
import { ref, computed, watch } from "vue";
const props = defineProps<{ results: string[]; searchResultSize: number }>();
const results = computed(() => props.results);
const searchResultSize = computed(() => props.searchResultSize);
const pageNumber = ref(0);
const nextPage = () => {
  pageNumber.value++;
};
const prevPage = () => {
  pageNumber.value--;
};
const pageCount = computed(() => {
  return Math.ceil(results.value.length / searchResultSize.value);
});
const paginatedData = computed(() => {
  const start = pageNumber.value * searchResultSize.value;
  const end = start + searchResultSize.value;
  return results.value.slice(start, end);
});
watch(results, () => (pageNumber.value = 0));
</script>

<template>
  <div class="search-result">
    <p class="search-result__title">Результаты поиска</p>
    <div class="search-result__page-control">
      <button
        class="search-result__button"
        @click="prevPage"
        :disabled="pageNumber == 0"
      >
        След.
      </button>
      <span class="search-result__page-number"
        >{{ pageNumber }}/{{ pageCount > 0 ? pageCount - 1 : 0 }}</span
      >
      <button
        @click="nextPage"
        :disabled="pageNumber >= pageCount - 1"
        class="search-result__button"
      >
        Пред.
      </button>
      <input
        class="search-result__page-choose"
        v-model="pageNumber"
        type="text"
      />
    </div>
    <div class="search-result__list-container">
      <ul class="search-result__list">
        <li
          :key="index"
          v-for="(page, index) in paginatedData"
          class="search-result__list-item"
        >
          {{ page }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "@/assets/styles/variables/_colors.scss";
.search-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &__page-control {
    display: flex;
    width: 100%;
    max-width: 1280px;
    margin: auto;
    flex-wrap: wrap;
    align-items: center;
  }

  &__title {
    width: 100%;
    text-align: center;
    margin: 20px auto;
    font-size: 22px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    word-break: break-all;
    width: 100%;
    padding-inline-start: 0;
    list-style-type: none;

    &-item {
      display: flex;
      border-bottom: 1px solid #ccc;
      padding: 20px 10px;
    }
  }

  &__button {
    max-width: 100px;
    max-height: 40px;
    margin: 20px auto;
    width: 100%;
    height: 100%;
    padding: 10px;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 400;
    background-color: $button-primary-background-color;
    border: none;
    color: $button-primary-text-color;

    &:disabled {
      opacity: 0.7;
    }
  }

  &__page-number {
    margin: 0 20px;
    font-size: 18px;
  }

  &__page-choose {
    width: 100%;
    margin: auto;
    max-width: 200px;
    padding: 10px;
    border-radius: 10px;
    font-size: 18px;
    text-align: center;
  }
}
</style>
