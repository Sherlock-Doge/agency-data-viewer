// 📌 Fetch eCFR Titles from Backend
async function fetchTitles() {
    try {
        console.log("📥 Fetching eCFR Titles...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/titles");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Titles Data:", data);
        return data;
    } catch (error) {
        console.error("🚨 Error fetching titles:", error);
        return { titles: [] };
    }
}

// 📌 Fetch Agency Data from Backend
async function fetchAgencies() {
    try {
        console.log("📥 Fetching agency data...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/agencies");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Agencies Data:", data);
        return data;
    } catch (error) {
        console.error("🚨 Error fetching agencies:", error);
        return { agencies: [] };
    }
}

// 📌 Fetch Word Counts from Backend
async function fetchWordCounts() {
    try {
        console.log("📥 Fetching word counts...");
        const response = await fetch("https://ecfr-backend-sk8g.onrender.com/api/wordcounts");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const wordData = await response.json();
        console.log("✅ Word Count Data:", wordData);

        let wordCountMap = {};
        Object.keys(wordData).forEach(identifier => {
            wordCountMap[identifier] = wordData[identifier] || 0;
        });

        return wordCountMap;
    } catch (error) {
        console.error("🚨 Error fetching word counts:", error);
        return {};
    }
}

// 📌 Fetch Ancestry Data for a Title
async function fetchAncestry(titleNumber) {
    try {
        console.log(`🔍 Fetching ancestry for Title ${titleNumber}...`);
        const response = await fetch(`https://ecfr-backend-sk8g.onrender.com/api/ancestry/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(`✅ Full Ancestry Response for Title ${titleNumber}:`, data);

        return data.children ? extractAncestryHierarchy(data.children, data.identifier) : [];
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return [];
    }
}

// 📌 Extract Hierarchical Structure
function extractAncestryHierarchy(children, parentIdentifier) {
    let hierarchy = [];

    children.forEach(node => {
        const currentNode = {
            identifier: node.identifier,
            label: node.label || "N/A",
            type: node.type || "N/A",
            parent_identifier: parentIdentifier
        };

        hierarchy.push(currentNode);

        if (node.children && node.children.length > 0) {
            hierarchy = hierarchy.concat(extractAncestryHierarchy(node.children, node.identifier));
        }
    });

    return hierarchy;
}

// 📌 Update Scoreboard
function updateScoreboard(totalTitles, totalAgencies, mostRecentTitle, mostRecentDate) {
    document.getElementById("totalTitles").textContent = totalTitles;
    document.getElementById("totalAgencies").textContent = totalAgencies;
    document.getElementById("recentAmendedTitle").innerHTML = mostRecentTitle 
        ? `<a href="#">${mostRecentTitle} (${mostRecentDate})</a>` 
        : "Loading...";
}

// 📌 Toggle Expand/Collapse Rows (Fixed)
function toggleRow(event) {
    event.stopPropagation();
    const row = event.target.closest("tr");
    const identifier = row.dataset.identifier;
    const toggleBtn = row.querySelector(".toggle-btn");

    // Collapse any other expanded titles first
    document.querySelectorAll(".expanded").forEach(expandedRow => {
        if (expandedRow !== row) {
            expandedRow.classList.remove("expanded");
            expandedRow.querySelector(".toggle-btn").textContent = "+";
            collapseChildren(expandedRow.dataset.identifier);
        }
    });

    // Toggle the clicked row
    const isExpanded = row.classList.toggle("expanded");
    toggleBtn.textContent = isExpanded ? "−" : "+";

    // Show/hide child elements
    document.querySelectorAll(`tr[data-parent="${identifier}"]`).forEach(childRow => {
        childRow.classList.toggle("hidden", !isExpanded);
    });
}

// 📌 Collapse all child elements when a parent is collapsed
function collapseChildren(parentIdentifier) {
    document.querySelectorAll(`tr[data-parent="${parentIdentifier}"]`).forEach(childRow => {
        childRow.classList.add("hidden");
        collapseChildren(childRow.dataset.identifier);
    });
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    // 📌 Step 1: Fetch metadata (Scoreboard updates immediately)
    const [titlesData, agenciesData] = await Promise.all([fetchTitles(), fetchAgencies()]);
    const { titles } = titlesData;

    // 📌 Step 2: Set quick scoreboard data
    updateScoreboard(titles.length, agenciesData.agencies.length, "Loading...", "Loading...");

    if (!titles || titles.length === 0) {
        console.error("🚨 No Titles Data Received!");
        return;
    }

    let mostRecentTitle = null;
    let mostRecentDate = null;

    // 📌 Step 3: Fetch word counts (After scoreboard loads)
    const wordCounts = await fetchWordCounts();

    for (let title of titles) {
        console.log(`🔍 Processing Title: ${title.number} - ${title.name}`);

        const agency = agenciesData.agencies.find(a =>
            a.cfr_references.some(ref => ref.title == title.number)
        );

        const agencyName = agency ? agency.display_name : "Unknown";

        // 📌 Title Row (Main Level)
        const titleRow = document.createElement("tr");
        titleRow.classList.add("title-header");
        titleRow.dataset.identifier = title.number;
        titleRow.dataset.type = "title";
        titleRow.innerHTML = `
            <td colspan="7"><button class="toggle-btn">+</button> <strong>Title ${title.number} - ${title.name} (${agencyName})</strong></td>
        `;
        titleRow.querySelector(".toggle-btn").addEventListener("click", toggleRow);
        tableBody.appendChild(titleRow);

        // 📌 Step 4: Fetch hierarchy (chapters, subchapters, parts, sections)
        const ancestry = await fetchAncestry(title.number);

        if (ancestry.length > 0) {
            ancestry.forEach(node => {
                const row = document.createElement("tr");
                row.dataset.parent = node.parent_identifier;
                row.dataset.identifier = node.identifier;
                row.dataset.type = node.type;
                row.classList.add("hidden");

                row.innerHTML = `
                    <td style="padding-left: ${10 * (node.type === "chapter" ? 1 : node.type === "subchapter" ? 2 : node.type === "part" ? 3 : 4)}px;">
                        <button class="toggle-btn">+</button> ${node.label || "N/A"}
                    </td>
                    <td>${node.parent_identifier || "N/A"}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>${wordCounts[node.identifier] ? wordCounts[node.identifier].toLocaleString() : "N/A"}</td>
                `;
                row.querySelector(".toggle-btn").addEventListener("click", toggleRow);
                tableBody.appendChild(row);
            });
        }
    }

    console.log("✅ Table populated successfully.");
}

// 📌 Start Fetching Data
fetchData();
