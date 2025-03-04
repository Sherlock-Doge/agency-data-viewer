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
        const date = "2025-02-28"; // Latest available date
        const response = await fetch(`https://www.ecfr.gov/api/versioner/v1/ancestry/${date}/title-${titleNumber}.json`);
        
        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch ancestry for Title ${titleNumber}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return null;
    }
}

async function fetchWordCounts() {
    try {
        console.log("📥 Fetching word counts...");
        const response = await fetch("https://www.ecfr.gov/api/search/v1/counts/hierarchy");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching word counts:", error);
        return {};
    }
}

async function fetchAgencies() {
    try {
        console.log("📥 Fetching agency data...");
        const response = await fetch("https://www.ecfr.gov/api/admin/v1/agencies.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("🚨 Error fetching agencies:", error);
        return { agencies: [] };
    }
}

async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = ""; // Clear table before adding rows

    const { titles } = await fetchTitles();
    const wordCounts = await fetchWordCounts();
    const agenciesData = await fetchAgencies();

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];

        // Find associated agency name
        const agency = agenciesData.agencies.find(a => a.cfr_references.some(ref => ref.title == title.number));
        const agencyName = agency ? agency.display_name : "Unknown";

        // Add Title Header
        const titleRow = document.createElement("tr");
        titleRow.classList.add("title-header");
        titleRow.innerHTML = `<td colspan="7"><strong>Title ${title.number} - ${title.name} (${agencyName})</strong></td>`;
        tableBody.appendChild(titleRow);

        // Fetch the ancestry for this title
        const ancestry = await fetchAncestry(title.number);
        if (ancestry && ancestry.length > 0) {
            const titleHierarchy = ancestry.filter(a => a.type === "title")[0] || {};
            
            ancestry.forEach(node => {
                if (node.type === "part") {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td></td> <!-- Empty for title -->
                        <td>${titleHierarchy.label || "N/A"}</td>
                        <td>${node.parent_label || "N/A"}</td>
                        <td>${node.label || "N/A"}</td>
                        <td>${title.up_to_date_as_of || "N/A"}</td> <!-- ✅ Correct "Current as of" -->
                        <td>${title.latest_amended_on || "N/A"}</td> <!-- ✅ Correct "Last Amended" -->
                        <td>${wordCounts[node.identifier] ? wordCounts[node.identifier].toLocaleString() : "N/A"}</td>
                    `;
                    tableBody.appendChild(row);
                }
            });
        } else {
            // No hierarchy available
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="4"></td>
                <td>${title.up_to_date_as_of || "N/A"}</td>
                <td>${title.latest_amended_on || "N/A"}</td>
                <td>N/A</td>
            `;
            tableBody.appendChild(row);
        }

        // Wait 1 second before fetching the next title to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✅ Table populated successfully.");
}

fetchData();
