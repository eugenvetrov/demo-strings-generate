const getRandomString = (length) => {
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (c) =>
    String.fromCharCode((c % 94) + 33)
  ).join("");
};

const addString = async () => {
  const db = await createStringDB();
  return new Promise((resolve) => {
    const transaction = db.transaction("strings", "readwrite");
    const strings = transaction.objectStore("strings");
    const addStringRequest = strings.add(getRandomString(100));
    addStringRequest.onsuccess = function (event) {
      console.log("added ", event.target.result);
      resolve("added success");
    };
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
      console.log(count);
      for (let i = count; i < stringArraySize; i++) {
        await addString();
        if (i % 10 === 0) self.postMessage("checkProgress");
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
      console.log("success entry");
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
        db.createObjectStore("strings", { autoIncrement: true });
        console.log("db", db);
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
