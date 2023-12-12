<script setup>
const stringArraySize = 1e4;

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
      if (event.data === "added") {
        const string = await getStringsRequest();
        console.log((string.length / stringArraySize) * 100);
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

if (window.PerformanceNavigationTiming) {
  console.info("window.performance works fine on this browser");
  const entries = performance.getEntriesByType("navigation");
  for (const entry of entries) {
    if (entry.type === "reload") {
      console.log(`${entry.name} was reloaded!`);
      const strings = async () => await getStringsRequest();
      if (strings.length < stringArraySize && strings.length !== 0)
        generateStrings({ stringArraySize });
    }
  }
}

const getStringsRequest = async () => {
  const db = await createStringDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    const getStringsRequest = strings.getAll();
    getStringsRequest.onsuccess = function (event) {
      resolve(event.target.result);
    };
    getStringsRequest.onerror = function (event) {
      event.preventDefault();
      console.log(event);
      reject(event.target.result);
    };
  });
};

const handleGenerateClick = () => {
  createStringDB();
  generateStrings({ stringArraySize });
};

const handleSearch = async (event) => {
  const searchQuery = event.target.value;
  const string = await getStringsRequest();
  const result = string.filter((item) => item.includes(searchQuery));
  console.log(result);
};
</script>

<template>
  <main>
    <button @click="handleGenerateClick">Generate</button>
    <input type="text" @change="handleSearch" />
  </main>
</template>
