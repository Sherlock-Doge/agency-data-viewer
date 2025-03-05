// 📌 Fetch all eCFR Titles from the backend
async function fetchTitles() {
    try {
        console.log("📥 Fetching eCFR Titles...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/titles");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching titles:", error);
        return { titles: [] }; // Prevent crashes with empty response
    }
}

// 📌 Fetch all agency data from the backend
async function fetchAgencies() {
    try {
        console.log("📥 Fetching agency data...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/agencies");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching agencies:", error);
        return { agencies: [] }; // Prevent crashes with empty response
    }
}

// 📌 Fetch word counts for parts and sections
async function fetchWordCounts() {
    try {
        console.log("📥 Fetching word counts...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/wordcounts");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const wordData = await response.json();
        let wordCountMap = {};

        // ✅ Ensure the response is an array before processing
        if (!Array.isArray(wordData)) {
            console.error("🚨 Unexpected word count format", wordData);
            return {};
        }

        // 📌 Convert the API response into a key-value map for easier lookup
        wordData.forEach(item => {
            if (item.identifier) {
                wordCountMap[item.identifier] = item.count || 0;
            }
        });

        return wordCountMap;
    } catch (error) {
        console.error("🚨 Error fetching word counts:", error);
        return {}; // Prevent crashes with empty response
    }
}

// 📌 Fetch ancestry data for a specific title (chapters, subchapters, parts)
async function fetchAncestry(titleNumber) {
    try {
        console.log(`🔍 Fetching ancestry for Title ${titleNumber}...`);
        const response = await fetch(`https://ecfr-backend-sk8g.onrender.com/api/ancestry/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const ancestryData = await response.json();

        // ✅ Ensure the response is an array before processing
        if (!Array.isArray(ancestryData)) throw new Error("Invalid ancestry format");

        // 📌 Extract relevant ancestry data (type, label, parent label)
        return ancestryData.map(node => ({
            type: node.type,
            label: node.label || "N/A",
            parent_label: node.parent_label || "N/A"
        }));
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return []; // Prevent crashes with empty response
    }
}

// 📌 Main function to fetch and populate the table with eCFR data
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = ""; // Clear existing table content before loading new data

    // 📌 Fetch all required data (titles, agencies, word counts)
    const { titles } = await fetchTitles();
    const agenciesData = await fetchAgencies();
    const wordCounts = await fetchWordCounts();

    // 📌 Iterate through each title and populate the table
    for (let title of titles) {
        // 🔍 Find the agency associated with this title (if any)
        const agency = agenciesData.agencies.find(a => a.cfr_references.some(ref => ref.title == title.number));
        const agencyName = agency ? agency.display_name : "Unknown";

        // 📌 Add a header row for the title
        const titleRow = document.createElement("tr");
        titleRow.classList.add("title-header");
        titleRow.innerHTML = `<td colspan="7"><strong>Title ${title.number} - ${title.name} (${agencyName})</strong></td>`;
        tableBody.appendChild(titleRow);

        // 📌 Fetch hierarchy (chapters, subchapters, parts) for this title
        const ancestry = await fetchAncestry(title.number);
        if (ancestry.length > 0) {
            ancestry.forEach(node => {
                if (node.type === "part") {
                    // 📌 Create a new row for each part in the title
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td></td> <!-- Empty cell to align with title -->
                        <td>${node.parent_label || "N/A"}</td>
                        <td>${node.label || "N/A"}</td>
                        <td>${title.up_to_date_as_of || "N/A"}</td> <!-- ✅ "Current as of" date -->
                        <td>${title.latest_amended_on || "N/A"}</td> <!-- ✅ "Last Amended" date -->
                        <td>${wordCounts[node.identifier] ? wordCounts[node.identifier].toLocaleString() : "N/A"}</td> <!-- ✅ Word count lookup -->
                    `;
                    tableBody.appendChild(row);
                }
            });
        } else {
            // 📌 If no ancestry found, just display the title with empty data
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="4"></td> <!-- Empty columns -->
                <td>${title.up_to_date_as_of || "N/A"}</td>
                <td>${title.latest_amended_on || "N/A"}</td>
                <td>N/A</td>
            `;
            tableBody.appendChild(row);
        }

        // ⏳ Prevent API rate limits by adding a delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✅ Table populated successfully.");
}

// 📌 Start the data fetching process when the script loads
fetchData();
