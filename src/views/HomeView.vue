<script setup>
import SearchResult from "@/components/SearchResult.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { ref, watch } from "vue";

const stringArraySize = 1e5;
const progress = ref(0);
const searchResult = ref([]);
const searchResultSize = ref(10);
const searchResultLoad = ref(false);
const inputText = ref("");

function createStringDB() {
  return new Promise((resolve, reject) => {
    const stringDBOpenRequest = self.indexedDB.open("stringDB", 1);

    stringDBOpenRequest.onerror = (event) => {
      if (event.target) {
        console.log("error ", event.target.errorCode);
        reject(event.target.errorCode);
      }
    };

    stringDBOpenRequest.onsuccess = (event) => {
      if (event.target) {
        const db = event.target.result;
        db.onversionchange = function () {
          db.close();
          console.log("DB has old version. Reload page, please.");
        };
        resolve(db);
      }
    };

    stringDBOpenRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("strings")) {
        const stringStore = db.createObjectStore("strings", {
          autoIncrement: "true",
        });
        stringStore.createIndex("string_idx", "stringValue");
      }
    };
  });
}

const getWorker = () => {
  if (window.Worker) {
    const myWorker = new Worker("/worker.js");
    myWorker.onmessage = async function (event) {
      console.log(event.data);
      if (event.data === "checkProgress") {
        const strings = await getStringsRequest();
        progress.value = Math.round((strings.length / stringArraySize) * 100);
      }
    };
    return myWorker;
  } else {
    console.log("Your browser doesn't support web workers.");
  }
};

const myWorker = getWorker();

const generateStrings = async ({ stringArraySize }) => {
  myWorker.postMessage({ stringArraySize });
};

const getStringsRequest = async () => {
  const db = await createStringDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    const getStringsRequest = strings.getAll();
    getStringsRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
    getStringsRequest.onerror = (event) => {
      event.preventDefault();
      reject(event.target.result);
    };
  });
};

const searchStrings = async (searchString) => {
  const db = await createStringDB();
  return new Promise((resolve, reject) => {
    searchResultLoad.value = true;
    const result = [];
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    const stringIndex = strings.index("string_idx");
    const stringCursor = stringIndex.openCursor();
    stringCursor.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.key.includes(searchString))
          result.push(cursor.value.stringValue);
        console.log(result);
        cursor.continue();
      } else {
        resolve(result);
        searchResultLoad.value = false;
        console.log("Not found more strings");
      }
    };
    stringCursor.onerror = (event) => {
      event.preventDefault();
      searchResultLoad.value = false;
      reject(event.target.result);
    };
    stringCursor.oncomplete = () => {
      searchResultLoad.value = false;
      resolve(result);
    };
  });
};

if (window.PerformanceNavigationTiming) {
  console.info("window.performance works fine on this browser");
  const entries = performance.getEntriesByType("navigation");
  entries.forEach(async (entry) => {
    if (entry.type === "reload") {
      console.log(`${entry.name} was reloaded!`);
      const strings = await getStringsRequest();
      if (strings.length < stringArraySize && strings.length !== 0)
        generateStrings({ stringArraySize });
    }
  });
}

const handleGenerateClick = () => {
  createStringDB();
  generateStrings({ stringArraySize });
};

watch(inputText, async (newSearchQuery) => {
  searchResult.value = await searchStrings(newSearchQuery);
  if (!newSearchQuery) searchResult.value = [];
});

const showProgress = async () => {
  const strings = await getStringsRequest();
  return strings > 0 && strings < stringArraySize;
};
</script>

<template>
  <main>
    <button class="home__button" @click="handleGenerateClick">
      сгенерировать
    </button>
    <input
      v-model="inputText"
      type="textarea"
      placeholder="для поиска начните ввод"
      class="home__search-input"
    />
    <p v-if="searchResultLoad">Подождите результаты поиска</p>
    <progress-bar :progress="progress" v-if="showProgress()" />
    <search-result
      :results="searchResult"
      :searchResultSize="searchResultSize"
    />
  </main>
</template>

<style lang="scss" scoped>
@import "@/assets/styles/variables/_colors.scss";
.home {
  &__button {
    max-width: 290px;
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
  }

  &__search-input {
    width: 100%;
    max-width: 250px;
    height: 100%;
    max-height: 200px;
    margin: auto;
    padding: 20px;
    border-radius: 10px;
    font-size: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
