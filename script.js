// ===============================
// POTATO DATABASE
// ===============================

const defaultDatabase = {
    "POT-1001": {
        name: "Russet Burbank",
        status: "Verified Genuine",
        origin: "Idaho, USA",
        quality: "Grade A"
    },

    "POT-1002": {
        name: "Yukon Gold",
        status: "Verified Genuine",
        origin: "Ontario, Canada",
        quality: "Grade A"
    },

    "POT-1003": {
        name: "Red Pontiac",
        status: "Verified Genuine",
        origin: "North Dakota, USA",
        quality: "Grade B"
    },

    "POT-9999": {
        name: "Counterfeit Spud",
        status: "FLAGGED / REJECTED",
        origin: "Unknown",
        quality: "Invalid"
    }
};

let currentVerifiedPotato = null;


// ===============================
// GET DATABASE
// ===============================

function getDatabase() {
    const stored = localStorage.getItem("potatoDb");

    if (!stored) {
        localStorage.setItem(
            "potatoDb",
            JSON.stringify(defaultDatabase)
        );

        return { ...defaultDatabase };
    }

    return JSON.parse(stored);
}


// ===============================
// SAVE DATABASE
// ===============================

function saveDatabase(database) {
    localStorage.setItem(
        "potatoDb",
        JSON.stringify(database)
    );
}


// ===============================
// DISPLAY REGISTRY TABLE
// ===============================

function renderTable() {
    const database = getDatabase();
    const tableBody = document.getElementById("registryTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    Object.keys(database).forEach(id => {

        const item = database[id];

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${id}</strong></td>
            <td>${item.name}</td>
            <td>${item.origin}</td>
            <td>
                <button
                    onclick="deletePotato('${id}')"
                    style="
                        background-color: #c65911;
                        padding: 4px 8px;
                        font-size: 11px;
                    "
                >
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ===============================
// DELETE POTATO
// ===============================

function deletePotato(id) {

    const database = getDatabase();

    if (confirm(`Are you sure you want to delete ${id}?`)) {

        delete database[id];

        saveDatabase(database);

        renderTable();
    }
}


// ===============================
// VERIFY POTATO
// ===============================

function verifyPotato() {

    const input = document.getElementById("potatoIdInput");
    const resultDiv = document.getElementById("result");
    const statusText = document.getElementById("resultStatus");
    const detailsText = document.getElementById("resultDetails");
    const certBtn = document.getElementById("certBtn");

    const idInput = input.value.trim().toUpperCase();

    if (!idInput) {
        alert("Please enter a Potato ID!");
        return;
    }

    const database = getDatabase();

    resultDiv.classList.remove("hidden");

    if (!database[idInput]) {

        resultDiv.className = "result-box error";

        statusText.innerText = "❌ ID Not Found!";

        detailsText.innerText =
            `The ID "${idInput}" does not exist in the official registry.`;

        certBtn.classList.add("hidden");

        currentVerifiedPotato = null;

        return;
    }

    const item = database[idInput];

    // Counterfeit / invalid potato
    if (item.quality === "Invalid") {

        resultDiv.className = "result-box error";

        statusText.innerText = "❌ Verification Failed!";

        detailsText.innerText =
            `ID: ${idInput} | Name: ${item.name} | Status: ${item.status}`;

        certBtn.classList.add("hidden");

        currentVerifiedPotato = null;

        return;
    }

    // Genuine potato
    resultDiv.className = "result-box success";

    statusText.innerText =
        "✅ Authentic Potato Verified!";

    detailsText.innerText =
        `ID: ${idInput} | Variety: ${item.name} | Origin: ${item.origin} | Grade: ${item.quality}`;

    certBtn.classList.remove("hidden");

    currentVerifiedPotato = {
        id: idInput,
        ...item
    };
}


// ===============================
// REGISTER NEW POTATO
// ===============================

function registerPotato() {

    const nameInput = document.getElementById("regName");
    const originInput = document.getElementById("regOrigin");

    const name = nameInput.value.trim();
    const origin = originInput.value.trim();

    if (!name || !origin) {
        alert("Please fill in both Variety Name and Origin!");
        return;
    }

    const database = getDatabase();

    let newId;

    do {
        newId =
            "POT-" +
            Math.floor(1000 + Math.random() * 9000);
    } while (database[newId]);

    database[newId] = {
        name: name,
        status: "Verified Genuine",
        origin: origin,
        quality: "Grade A"
    };

    saveDatabase(database);

    alert(
        `Success! Created new Potato ID: ${newId}`
    );

    nameInput.value = "";
    originInput.value = "";

    document.getElementById("potatoIdInput").value =
        newId;

    renderTable();

    verifyPotato();
}


// ===============================
// SEARCH REGISTRY TABLE
// ===============================

function filterRegistryTable() {

    const input =
        document.getElementById("tableSearchInput");

    const filter =
        input.value.toUpperCase();

    const table =
        document.querySelector(".registry-table");

    if (!table) return;

    const rows =
        table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {

        const rowText =
            rows[i].innerText.toUpperCase();

        if (rowText.includes(filter)) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}


// ===============================
// EXPORT CSV
// ===============================

function exportToCSV() {

    const database = getDatabase();

    let csvContent =
        "ID,Variety,Origin,Quality,Status\n";

    Object.keys(database).forEach(id => {

        const item = database[id];

        csvContent +=
            `"${id}","${item.name}","${item.origin}","${item.quality}","${item.status}"\n`;
    });

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "potato_registry.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ===============================
// IMPORT CSV
// ===============================

function importCSV(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const text = e.target.result;

        const lines =
            text.split(/\r?\n/);

        const database = getDatabase();

        let importedCount = 0;

        // Skip header
        for (let i = 1; i < lines.length; i++) {

            const line = lines[i].trim();

            if (!line) continue;

            const columns =
                line.split(",").map(
                    column =>
                        column
                            .replace(/^"(.*)"$/, "$1")
                            .trim()
                );

            const [
                id,
                name,
                origin,
                quality,
                status
            ] = columns;

            if (id && name) {

                database[id] = {
                    name: name,
                    origin: origin || "Unknown",
                    quality: quality || "Grade A",
                    status: status || "Verified Genuine"
                };

                importedCount++;
            }
        }

        saveDatabase(database);

        renderTable();

        alert(
            `Successfully imported ${importedCount} potato records!`
        );

        event.target.value = "";
    };

    reader.readAsText(file);
}


// ===============================
// DARK MODE
// ===============================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "potatoDarkMode",
        isDark
    );
}


// ===============================
// GRAYSCALE MODE
// ===============================

function toggleGrayscale() {

    document.body.classList.toggle(
        "grayscale-mode"
    );

    const isGrayscale =
        document.body.classList.contains(
            "grayscale-mode"
        );

    localStorage.setItem(
        "potatoGrayscale",
        isGrayscale
    );
}


// ===============================
// LOAD SAVED SETTINGS
// ===============================

function loadSettings() {

    if (
        localStorage.getItem(
            "potatoDarkMode"
        ) === "true"
    ) {
        document.body.classList.add(
            "dark-mode"
        );
    }

    if (
        localStorage.getItem(
            "potatoGrayscale"
        ) === "true"
    ) {
        document.body.classList.add(
            "grayscale-mode"
        );
    }
}


// ===============================
// POTATO SOUND
// ===============================

function playFahhhSound() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) return;

    const audioCtx =
        new AudioContext();

    const oscillator =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    oscillator.type = "sawtooth";

    oscillator.frequency.setValueAtTime(
        320,
        audioCtx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        180,
        audioCtx.currentTime + 0.6
    );

    gain.gain.setValueAtTime(
        0,
        audioCtx.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        0.4,
        audioCtx.currentTime + 0.1
    );

    gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.6
    );

    oscillator.connect(gain);

    gain.connect(
        audioCtx.destination
    );

    oscillator.start();

    oscillator.stop(
        audioCtx.currentTime + 0.6
    );
}


// ===============================
// PRINT CERTIFICATE
// ===============================

function printCertificate() {

    if (!currentVerifiedPotato) return;

    playFahhhSound();

    const certWindow =
        window.open("", "_blank");

    if (!certWindow) {
        alert("Please allow pop-ups to print the certificate.");
        return;
    }

    certWindow.document.write(`
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <title>
                Certificate - ${currentVerifiedPotato.id}
            </title>

            <style>

                body {
                    font-family: Georgia, serif;
                    text-align: center;
                    padding: 50px;
                    background: #fdfbf7;
                }

                .cert-border {
                    border: 10px double #8b5a2b;
                    padding: 40px;
                    background: white;
                }

                h1 {
                    color: #8b5a2b;
                    font-size: 32px;
                }

                p {
                    font-size: 18px;
                    color: #333;
                }

                .badge {
                    font-size: 50px;
                    margin: 20px 0;
                }

                .details {
                    font-weight: bold;
                    margin: 20px 0;
                }

            </style>

        </head>

        <body>

            <div class="cert-border">

                <div class="badge">
                    🥔
                </div>

                <h1>
                    Certificate of Potato Authenticity
                </h1>

                <p>
                    This certifies that the item bearing ID
                    <strong>
                        ${currentVerifiedPotato.id}
                    </strong>
                    has been officially verified.
                </p>

                <div class="details">

                    <p>
                        Variety:
                        ${currentVerifiedPotato.name}
                    </p>

                    <p>
                        Origin:
                        ${currentVerifiedPotato.origin}
                    </p>

                    <p>
                        Grade:
                        ${currentVerifiedPotato.quality}
                    </p>

                    <p>
                        Status:
                        ${currentVerifiedPotato.status}
                    </p>

                </div>

                <p>
                    <em>
                        Official Registry Seal of Authenticity
                    </em>
                </p>

            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>

        </body>

        </html>
    `);

    certWindow.document.close();
}


// ===============================
// START WEBSITE
// ===============================

window.onload = function() {

    loadSettings();

    renderTable();

};