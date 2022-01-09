// database variable
let db;
// establishing a connection to indexedDB
const request = indexedDB.open("budget_tracker", 1);

// handling database changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore("new_budget", { autoIncrement: true });
};

// handling successful requests to indexedDB
request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.online) {
        uploadBudget();
    };
};

// handling errors
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function to handle if a user wants to use the application without internet
function saveRecord(record) {
    const transaction = db.transaction(["new_budget"], "readwrite");

    const budgetObjectStore = transaction.objectStore("new_budget");

    budgetObjectStore.add(record);
};

// function to handle posting all the new database entries when the user has reconnected to the internet from being offline
function uploadBudget() {
    const transaction = db.transaction(["new_budget"], "readwrite");

    const budgetObjectStore = transaction.objectStore("new_budget");

    const getAllRecords = budgetObjectStore.getAll();

    getAllRecords.onsuccess = function() {
        if (getAllRecords.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAllRecords.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(["new_budget"], "readwrite");

                    const budgetObjectStore = transaction.objectStore("new_budget");

                    budgetObjectStore.clear();

                    alert("All offline budget transactions have been saved and submitted!");
                })
                .catch(err => {
                    console.log(err);
                });
        };
    };
};

// listener to determine when to fire the function when the user returns online
window.addEventListener("online", uploadBudget);


