// Updated Backend URL:
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// 📌 Fetch eCFR Titles from Backend
async function fetchTitles() {
    try {
        console.log("📥 Fetching eCFR Titles...");
        const response = await fetch(`${BACKEND_URL}/api/titles`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Titles Data:", data);
        return data.titles || [];
    } catch (error) {
        console.error("🚨 Error fetching titles:", error);
        return [];
    }
}

// 📌 Fetch Agency Data from Backend (FIXED AGENCY COUNT)
async function fetchAgencies() {
    try {
        console.log("📥 Fetching agency data...");
        const response = await fetch(`${BACKEND_URL}/api/agencies`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Agencies Data:", data);
        return data.agencies || [];
    } catch (error) {
        console.error("🚨 Error fetching agencies:", error);
        return [];
    }
}

// 📌 Update Scoreboard (FIXED AGENCY COUNT + MOST RECENTLY AMENDED)
function updateScoreboard(totalTitles, totalAgencies, mostRecentTitle, mostRecentDate, mostRecentTitleName) {
    document.getElementById("totalTitles").textContent = totalTitles;
    document.getElementById("totalAgencies").textContent = totalAgencies > 0 ? totalAgencies : "N/A";

    const recentAmendedTitleElement = document.getElementById("recentAmendedTitle");

    if (mostRecentTitle && mostRecentTitleName) {
        recentAmendedTitleElement.href = `https://www.ecfr.gov/current/title-${mostRecentTitle.replace("Title ", "")}`;
        recentAmendedTitleElement.textContent = `${mostRecentTitle} - ${mostRecentTitleName}`;
    } else {
        recentAmendedTitleElement.textContent = "N/A";
        recentAmendedTitleElement.removeAttribute("href");
    }

    document.getElementById("recentAmendedDate").textContent = mostRecentDate || "N/A";
}

// 📌 Fetch Word Count for Single Title (Triggered by button)
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = "Fetching...";

    try {
        const response = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const { wordCount } = await response.json();
        buttonElement.parentElement.textContent = wordCount.toLocaleString();
    } catch (error) {
        console.error(`🚨 Error fetching word count for Title ${titleNumber}:`, error);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    // 📌 Fetch Titles & Agencies (removed bulk word count fetch)
    const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);

    if (!titles.length) {
        console.error("🚨 No Titles Data Received!");
        return;
    }

    let mostRecentTitle = null;
    let mostRecentTitleName = null;
    let mostRecentDate = null;

    // 📌 Populate Table
    titles.forEach(title => {
        console.log(`🔍 Processing Title: ${title.number} - ${title.name}`);

        const titleUrl = `https://www.ecfr.gov/current/title-${title.number}`;

        // ✅ FIXED: Ensure most recently amended title is correct
        if (!mostRecentDate || (title.latest_amended_on && title.latest_amended_on > mostRecentDate)) {
            mostRecentDate = title.latest_amended_on;
            mostRecentTitle = `Title ${title.number}`;
            mostRecentTitleName = title.name;
        }

        // ✅ Create Table Row (with Word Count Button)
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><a href="${titleUrl}" target="_blank">Title ${title.number} - ${title.name}</a></td>
            <td>${title.up_to_date_as_of || "N/A"}</td>
            <td>${title.latest_amended_on || "N/A"}</td>
            <td><button onclick="fetchSingleTitleWordCount(${title.number}, this)">Generate</button></td>
        `;
        tableBody.appendChild(row);
    });

    // ✅ FIXED: Update Scoreboard (Shows Correct Agencies Count & Most Recently Amended)
    updateScoreboard(titles.length, agencies.length, mostRecentTitle, mostRecentDate, mostRecentTitleName);

    console.log("✅ Table populated successfully.");
}

// 📌 Start Fetching Data
fetchData();
