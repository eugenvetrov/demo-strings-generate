<script setup>
import SearchResult from "@/components/SearchResult.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { ref, watch } from "vue";

const stringArraySize = 1e7;
const progress = ref(0);
const searchResult = ref([]);
const searchResultSize = ref(10);
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

    stringDBOpenRequest.onupgradeneeded = function (event) {
      console.log("upgrade entry");
      const db = event.target.result;
      if (!db.objectStoreNames.contains("strings")) {
        db.createObjectStore("strings", { autoIncrement: true });
        console.log("db", db);
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
  const strings = await getStringsRequest();
  const result = strings.filter((item) => item.includes(newSearchQuery));
  searchResult.value = result;
  if (!newSearchQuery) searchResult.value = [];
});

const showProgress = () => {
  return progress.value > 0 && progress.value < 100;
};
</script>

<template>
  <main>
    <button class="home__button" @click="handleGenerateClick">сгенерировать</button>
    <input
      v-model="inputText"
      type="textarea"
      placeholder="для поиска начните ввод"
      class="home__search-input"
    />
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
