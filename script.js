// ✅ Backend URL (Updated to new backend service)
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

// 📌 Fetch Agency Data from Backend
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

// 📌 Fetch Word Count for a Single Title (when "Generate" button is clicked)
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    try {
        console.log(`📥 Fetching word count for Title ${titleNumber}...`);
        buttonElement.textContent = "Fetching...";
        buttonElement.disabled = true;

        const response = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(`✅ Word Count for Title ${titleNumber}:`, data.wordCount);

        // ✅ Update UI with fetched word count
        buttonElement.parentElement.innerHTML = data.wordCount.toLocaleString();
    } catch (error) {
        console.error(`🚨 Error fetching word count for Title ${titleNumber}:`, error);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

// 📌 Update Scoreboard (includes most recently amended title logic)
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

    document.getElementById("recentAmendedDate").textContent = mostRecentDate ? `(${mostRecentDate})` : "(N/A)";
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    console.log("📥 Starting data fetch...");
    
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    try {
        // 📌 Fetch Titles & Agencies Only (No Auto Word Count)
        const [titles, agencies] = await Promise.all([
            fetchTitles(),
            fetchAgencies()
        ]);

        if (!titles.length) {
            console.error("🚨 No Titles Data Received!");
            return;
        }

        let mostRecentTitle = null;
        let mostRecentTitleName = null;
        let mostRecentDate = null;

        // 📌 Populate Table and find the most recently amended title
        titles.forEach(title => {
            console.log(`🔍 Processing Title: ${title.number} - ${title.name}`);

            const titleUrl = `https://www.ecfr.gov/current/title-${title.number}`;

            // ✅ Keep track of most recently amended title
            if (!mostRecentDate || (title.latest_amended_on && title.latest_amended_on > mostRecentDate)) {
                mostRecentDate = title.latest_amended_on;
                mostRecentTitle = `Title ${title.number}`;
                mostRecentTitleName = title.name;
            }

            // ✅ Always show "Generate" button instead of checking wordCounts
            let wordCountDisplay = `<button onclick="fetchSingleTitleWordCount(${title.number}, this)">Generate</button>`;

            // ✅ Create Correctly Structured Table Row (Now Shows "Title X - Proper Name")
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><a href="${titleUrl}" target="_blank">Title ${title.number} - ${title.name}</a></td>
                <td>${title.up_to_date_as_of || "N/A"}</td>
                <td>${title.latest_amended_on || "N/A"}</td>
                <td>${wordCountDisplay}</td>
            `;

            tableBody.appendChild(row);
        });

        updateScoreboard(
            titles.length,
            agencies.length,
            mostRecentTitle,
            mostRecentDate,
            mostRecentTitleName
        );

        console.log("✅ Table populated successfully.");
    } catch (error) {
        console.error("🚨 Error in fetchData():", error);
    }
}

// 📌 Start Fetching Data on Load
fetchData();

// ✅ eCFR SEARCH FUNCTION
async function performSearch() {
    const query = document.getElementById("searchQuery").value.trim();
    const resultsContainer = document.getElementById("searchResults");
    const cipherImage = document.querySelector(".cipher-image");
    const searchContainer = document.querySelector(".search-container");

    if (!query) {
        resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    console.log(`🔍 Searching for: ${query}`);
    
    // ✅ Move search bar to the top & fade Cipher Doge
    document.body.classList.add("search-results-visible");
    searchContainer.style.marginTop = "10px";

    resultsContainer.innerHTML = "<p>Loading results...</p>";

    try {
        const response = await fetch(`https://www.ecfr.gov/api/search/v1/results?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Search Results:", data);

        // ✅ Clear Results & Show New Ones
        resultsContainer.innerHTML = "";
        if (!data.results || data.results.length === 0) {
            resultsContainer.innerHTML = "<p>No results found.</p>";
        } else {
            data.results.forEach((result, index) => {
                const resultDiv = document.createElement("div");
                resultDiv.classList.add("search-result");
                resultDiv.innerHTML = `
                    <p><strong>${index + 1}.</strong> <a href="https://www.ecfr.gov/${result.link}" target="_blank">${result.title || "No Title"}</a></p>
                    <p>${result.description || "No description available."}</p>
                `;
                resultsContainer.appendChild(resultDiv);
            });
        }

    } catch (error) {
        console.error("🚨 Error performing search:", error);
        resultsContainer.innerHTML = "<p>Error retrieving search results.</p>";
    }
}

// ✅ Detect ENTER Key Press to Trigger Search
document.getElementById("searchQuery").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }
});
