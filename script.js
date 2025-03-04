async function fetchTitles() {
    try {
        console.log("📥 Fetching eCFR Titles...");
        const response = await fetch("https://www.ecfr.gov/api/versioner/v1/titles.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching titles:", error);
        return { titles: [] };
    }
}

async function fetchAncestry(titleNumber) {
    try {
        console.log(`🔍 Fetching ancestry for Title ${titleNumber}...`);
        const date = "2025-02-28"; 
        const response = await fetch(`https://www.ecfr.gov/api/versioner/v1/ancestry/${date}/title-${titleNumber}.json`);

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch ancestry for Title ${titleNumber}`);
            return [];
        }

        const ancestryData = await response.json();

        return ancestryData.map(node => ({
            type: node.type,
            label: node.label || "N/A",
            parent_label: node.parent_label || "N/A"
        }));
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return [];
    }
}

async function fetchWordCounts() {
    try {
        console.log("📥 Fetching word counts...");
        const response = await fetch("https://www.ecfr.gov/api/search/v1/counts/hierarchy");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const wordData = await response.json();
        let wordCountMap = {};

        wordData.forEach(item => {
            if (item.identifier) {
                wordCountMap[item.identifier] = item.count || 0;
            }
        });

        return wordCountMap;
    } catch (error) {
        console.error("🚨 Error fetching word counts:", error);
        return {};
    }
}

async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    const { titles } = await fetchTitles();
    const wordCounts = await fetchWordCounts();

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];

        const titleRow = document.createElement("tr");
        titleRow.classList.add("title-header");
        titleRow.innerHTML = `<td colspan="7"><strong>Title ${title.number} - ${title.name}</strong></td>`;
        tableBody.appendChild(titleRow);

        const ancestry = await fetchAncestry(title.number);
        if (ancestry.length > 0) {
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
        } else {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="4"></td>
                <td>${title.up_to_date_as_of || "N/A"}</td>
                <td>${title.latest_amended_on || "N/A"}</td>
                <td>N/A</td>
            `;
            tableBody.appendChild(row);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✅ Table populated successfully.");
}

fetchData();
