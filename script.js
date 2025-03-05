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
        return { titles: [] }; // Prevent crashes
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
        console.log("✅ Word Count Data:", wordData);

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

        const data = await response.json();
        console.log(`✅ Full Ancestry Response for Title ${titleNumber}:`, JSON.stringify(data, null, 2));

        // ✅ Extract the hierarchical structure properly
        if (data && data.children) {
            return extractAncestryHierarchy(data.children, data.label);
        }
        
        return []; // Return an empty array if no valid data
    } catch (error) {
        console.error(`🚨 Error fetching ancestry for Title ${titleNumber}:`, error);
        return []; // Prevent crashes
    }
}

// 📌 Extract Hierarchical Structure (Now Includes Sections)
function extractAncestryHierarchy(children, parentLabel = "N/A") {
    let hierarchy = [];
    
    children.forEach(node => {
        const currentNode = {
            identifier: node.identifier,
            label: node.label || "N/A",
            type: node.type || "N/A",
            parent_label: parentLabel,
        };

        hierarchy.push(currentNode);

        // 🔍 Recursively process children if they exist
        if (node.children && node.children.length > 0) {
            hierarchy = hierarchy.concat(extractAncestryHierarchy(node.children, node.label));
        }
    });

    console.log("📊 Extracted Hierarchy:", hierarchy);
    return hierarchy;
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    // 📌 Fetch Required Data
    const { titles } = await fetchTitles();
    const agenciesData = await fetchAgencies();
    const wordCounts = await fetchWordCounts();

    if (!titles || titles.length === 0) {
        console.error("🚨 No Titles Data Received!");
        return;
    }

    // 📌 Populate Table
    for (let title of titles) {
        console.log(`🔍 Processing Title: ${title.number} - ${title.name}`);

        // 🔍 Find the agency associated with this title (if any)
        const agency = agenciesData.agencies.find(a => 
            a.cfr_references.some(ref => ref.title == title.number)
        );
        console.log(`🔍 Associated Agency for Title ${title.number}:`, agency);

        const agencyName = agency ? agency.display_name : "Unknown";

        // 📌 Add a header row for the title
        const titleRow = document.createElement("tr");
        titleRow.classList.add("title-header");
        titleRow.innerHTML = `<td colspan="7"><strong>Title ${title.number} - ${title.name} (${agencyName})</strong></td>`;
        tableBody.appendChild(titleRow);

        // 📌 Fetch hierarchy (chapters, subchapters, parts, sections) for this title
        const ancestry = await fetchAncestry(title.number);

        if (ancestry.length > 0) {
            ancestry.forEach(node => {
                if (["part", "chapter", "subchapter", "section"].includes(node.type)) {
                    // 📌 Create a new row for each section in the title
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
            console.warn(`⚠️ No Ancestry Data Found for Title ${title.number}`);

            // 📌 If no ancestry found, just display the title with empty data
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="4"></td>
                <td>${title.up_to_date_as_of || "N/A"}</td>
                <td>${title.latest_amended_on || "N/A"}</td>
                <td>N/A</td>
            `;
            tableBody.appendChild(row);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("✅ Table populated successfully.");
}

// 📌 Start Fetching Data
fetchData();
