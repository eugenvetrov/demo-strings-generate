const getRandomString = (length) => {
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (c) =>
    String.fromCharCode((c % 94) + 33)
  ).join("");
};

const addString = async (string) => {
  const db = await createStringDB();
  return new Promise((resolve) => {
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    const addStringRequest = strings.add(string);
    addStringRequest.onsuccess = function (event) {
      console.log("added ", event.target.result);
      resolve("added success");
    };
  });
};

const addStrings = async (stringstoAdd) => {
  const db = await createStringDB();
  return new Promise((resolve) => {
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    for (const element of stringstoAdd) {
      strings.add(element);
    }
    resolve();
  });
};

const generateStringCountRequest = async (stringArraySize) => {
  const db = await createStringDB();
  return new Promise((resolve) => {
    const stringCountRequest = db
      .transaction("strings", "readwrite")
      .objectStore("strings")
      .count();
    stringCountRequest.onsuccess = async (event) => {
      const count = event.target.result;
      const needToGenerate = stringArraySize - count;
      for (let i = 0; i < 1000; i++) {
        const strings = [];
        for (let i = 0; i < needToGenerate / 1000; i++) {
          const string = getRandomString(100);
          strings.push({ stringValue: string });
        }
        addStrings(strings);
      }
      resolve();
    };
  });
};

const createStringDB = () => {
  return new Promise((resolve, reject) => {
    const stringDBOpenRequest = self.indexedDB.open("stringDB", 1);
    stringDBOpenRequest.onerror = (event) => {
      console.log("error ", event.target.errorCode);
      reject(event.target.errorCode);
    };
    stringDBOpenRequest.onsuccess = (event) => {
      const db = event.target.result;
      db.onversionchange = () => {
        db.close();
        console.log(
          "База данных устарела, пожалуйста, перезагрузите страницу."
        );
      };
      resolve(db);
    };
    stringDBOpenRequest.onupgradeneeded = (event) => {
      console.log("upgrade entry");
      const db = event.target.result;
      if (!db.objectStoreNames.contains("strings")) {
        const stringStore = db.createObjectStore("strings", {
          autoIncrement: "true",
        });
        const stringIndex = stringStore.createIndex(
          "string_idx",
          "stringValue"
        );
        console.log(stringIndex);
      }
    };
  });
};

self.onmessage = (event) => {
  const { stringArraySize } = event.data;
  if (!self.indexedDB) {
    self.alert(
      "Ваш браузер не поддерживает стабильную версию IndexedDB. Такие-то функции будут недоступны"
    );
  }
  generateStringCountRequest(stringArraySize);
};
