// 📌 Fetch eCFR Titles from Backend
async function fetchTitles() {
    try {
        console.log("📥 Fetching eCFR Titles...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/titles");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching titles:", error);
        return { titles: [] }; // Prevent crashes
    }
}

// 📌 Fetch Agency Data from Backend
async function fetchAgencies() {
    try {
        console.log("📥 Fetching agency data...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/agencies");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching agencies:", error);
        return { agencies: [] }; // Prevent crashes
    }
}

// 📌 Fetch Word Counts from Backend
async function fetchWordCounts() {
    try {
        console.log("📥 Fetching word counts...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/wordcounts");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const wordData = await response.json();
        let wordCountMap = {};

        // ✅ Fix Unexpected Response Format
        if (typeof wordData !== "object") {
            console.error("🚨 Unexpected word count format:", wordData);
            return {};
        }

        // 📌 Convert response to key-value map
        Object.keys(wordData).forEach(identifier => {
            wordCountMap[identifier] = wordData[identifier] || 0;
        });

        return wordCountMap;
    } catch (error) {
        console.error("🚨 Error fetching word counts:", error);
        return {}; // Prevent crashes
    }
}

// 📌 Fetch Ancestry Data for a Title
async function fetchAncestry(titleNumber) {
    try {
        console.log(`🔍 Fetching ancestry for Title ${titleNumber}...`);
        const response = await fetch(`https://ecfr-backend-sk8g.onrender.com/api/ancestry/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return []; // Prevent crashes
    }
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    // 📌 Fetch Required Data
    const { titles } = await fetchTitles();
    const agenciesData = await fetchAgencies();
    const wordCounts = await fetchWordCounts();

    // 📌 Populate Table
    for (let title of titles) {
        const titleRow = document.createElement("tr");
        titleRow.innerHTML = `<td colspan="7"><strong>Title ${title.number} - ${title.name}</strong></td>`;
        tableBody.appendChild(titleRow);

        const ancestry = await fetchAncestry(title.number);
        ancestry.forEach(node => {
            if (node.type === "part") {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td></td>
                    <td>${node.parent_label || "N/A"}</td>
                    <td>${node.label || "N/A"}</td>
                    <td>${title.up_to_date_as_of || "N/A"}</td>
                    <td>${title.latest_amended_on || "N/A"}</td>
                    <td>${wordCounts[node.identifier] ? wordCounts[node.identifier].toLocaleString() : "N/A"}</td>
                `;
                tableBody.appendChild(row);
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✅ Table populated successfully.");
}

// 📌 Start Fetching Data
fetchData();
