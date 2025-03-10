// ✅ Backend URL
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// ✅ Cache for Dynamic Filtering
let cachedTitles = [];
let cachedAgencies = [];

// 📌 Fetch Titles
async function fetchTitles() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/titles`);
        const data = await response.json();
        cachedTitles = data.titles || [];
        return cachedTitles;
    } catch (err) {
        console.error("🚨 Error fetching titles:", err);
        return [];
    }
}

// 📌 Fetch Agencies
async function fetchAgencies() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/agencies`);
        const data = await response.json();
        cachedAgencies = data.agencies || [];
        return cachedAgencies;
    } catch (err) {
        console.error("🚨 Error fetching agencies:", err);
        return [];
    }
}

// 📌 Fetch Word Count
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    try {
        buttonElement.textContent = "Fetching...";
        buttonElement.disabled = true;
        const response = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
        const data = await response.json();
        buttonElement.parentElement.innerHTML = data.wordCount.toLocaleString();
    } catch (err) {
        console.error("🚨 Word Count Error:", err);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

// 📌 Update Scoreboard
function updateScoreboard(totalTitles, totalAgencies, mostRecentTitle, mostRecentDate, mostRecentTitleName) {
    const tTitles = document.getElementById("totalTitles");
    const tAgencies = document.getElementById("totalAgencies");
    const amendedTitle = document.getElementById("recentAmendedTitle");
    const amendedDate = document.getElementById("recentAmendedDate");

    if (tTitles) tTitles.textContent = totalTitles;
    if (tAgencies) tAgencies.textContent = totalAgencies;
    if (amendedTitle && amendedDate) {
        if (mostRecentTitle && mostRecentTitleName) {
            amendedTitle.href = `https://www.ecfr.gov/current/title-${mostRecentTitle.replace("Title ", "")}`;
            amendedTitle.textContent = `${mostRecentTitle} - ${mostRecentTitleName}`;
        } else {
            amendedTitle.textContent = "N/A";
            amendedTitle.removeAttribute("href");
        }
        amendedDate.textContent = mostRecentDate ? `(${mostRecentDate})` : "(N/A)";
    }
}

// 📌 Populate Titles Table
async function fetchData() {
    const tbody = document.querySelector("#titlesTable tbody");
    if (tbody) tbody.innerHTML = "";
    const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);

    let mostRecentTitle = null, mostRecentDate = null, mostRecentTitleName = null;
    titles.forEach(title => {
        const row = document.createElement("tr");
        const titleUrl = `https://www.ecfr.gov/current/title-${title.number}`;
        if (!mostRecentDate || (title.latest_amended_on && title.latest_amended_on > mostRecentDate)) {
            mostRecentDate = title.latest_amended_on;
            mostRecentTitle = `Title ${title.number}`;
            mostRecentTitleName = title.name;
        }
        row.innerHTML = `
            <td><a href="${titleUrl}" target="_blank">Title ${title.number} - ${title.name}</a></td>
            <td>${title.up_to_date_as_of || "N/A"}</td>
            <td>${title.latest_amended_on || "N/A"}</td>
            <td><button onclick="fetchSingleTitleWordCount(${title.number}, this)">Generate</button></td>
        `;
        tbody.appendChild(row);
    });

    updateScoreboard(titles.length, agencies.length, mostRecentTitle, mostRecentDate, mostRecentTitleName);
}

// 📌 Start
fetchData();

// ✅ Perform Search
async function performSearch() {
    const query = document.getElementById("searchQuery").value.trim();
    const agency = document.getElementById("agencyFilter").value;
    const title = document.getElementById("titleFilter").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const resultsBox = document.getElementById("searchResults");

    const hasFilters = agency || title || startDate || endDate;
    if (!query && !hasFilters) {
        resultsBox.innerHTML = "<p>Please enter a search term or select filters.</p>";
        resultsBox.style.display = "block";
        return;
    }

    console.log(`🔍 Searching via BACKEND: ${query || "[Filters only]"}`);
    document.body.classList.add("search-results-visible");
    resultsBox.innerHTML = "<p>Loading results...</p>";
    resultsBox.style.display = "block";

    const url = new URL(`${BACKEND_URL}/api/search`);
    if (query) url.searchParams.append("query", query);
    if (agency) url.searchParams.append("agency_slugs[]", agency);
    if (title) url.searchParams.append("title", title);
    if (startDate) url.searchParams.append("last_modified_on_or_after", startDate);
    if (endDate) url.searchParams.append("last_modified_on_or_before", endDate);

    try {
        const res = await fetch(url.toString());
        const data = await res.json();
        resultsBox.innerHTML = "";

        if (!data.results || data.results.length === 0) {
            resultsBox.innerHTML = "<p>No results found.</p>";
        } else {
            data.results.forEach((r, i) => {
                const div = document.createElement("div");
                div.classList.add("search-result");
                div.innerHTML = `
                    <p><strong>${i + 1}.</strong> <a href="https://www.ecfr.gov/${r.link}" target="_blank">${r.title || "No title"}</a></p>
                    <p>${r.description || "No description available."}</p>
                `;
                resultsBox.appendChild(div);
            });
        }
    } catch (err) {
        console.error("🚨 Backend Search Error:", err);
        resultsBox.innerHTML = "<p>Error retrieving search results.</p>";
    }
}

// ✅ Reset Search
function resetSearch() {
    document.getElementById("searchQuery").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

    const resultsBox = document.getElementById("searchResults");
    resultsBox.innerHTML = "";
    resultsBox.style.display = "none";

    const suggestionBox = document.getElementById("searchSuggestions");
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none";

    document.body.classList.remove("search-results-visible");

    populateDropdowns(); // FULL RESET of filters using cache
}

// ✅ Suggestions via Backend
document.getElementById("searchQuery").addEventListener("input", async function () {
    const query = this.value.trim();
    const suggestionBox = document.getElementById("searchSuggestions");
    if (!query) {
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
        return;
    }

    console.log(`💬 Calling Backend Suggestions API: ${BACKEND_URL}/api/search/suggestions`);

    try {
        const res = await fetch(`${BACKEND_URL}/api/search/suggestions?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        suggestionBox.innerHTML = "";

        if (data.suggestions && data.suggestions.length > 0) {
            suggestionBox.style.display = "block";
            data.suggestions.forEach(s => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = s;
                div.onclick = () => {
                    document.getElementById("searchQuery").value = s;
                    suggestionBox.innerHTML = "";
                    suggestionBox.style.display = "none";
                    performSearch();
                };
                suggestionBox.appendChild(div);
            });
        } else {
            suggestionBox.style.display = "none";
        }
    } catch (err) {
        console.error("🚨 Suggestion Fetch Error:", err);
        suggestionBox.style.display = "none";
    }
});

// ✅ Enter Key = Search
document.getElementById("searchQuery").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
    }
});

// ✅ Populate Filter Dropdowns
function populateDropdowns() {
    const agencyFilter = document.getElementById("agencyFilter");
    const titleFilter = document.getElementById("titleFilter");

    agencyFilter.innerHTML = `<option value="">-- All Agencies --</option>`;
    cachedAgencies.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.slug || a.name.toLowerCase().replace(/\s+/g, "-");
        opt.textContent = a.name;
        agencyFilter.appendChild(opt);
    });

    titleFilter.innerHTML = `<option value="">-- All Titles --</option>`;
    cachedTitles.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.number;
        opt.textContent = `Title ${t.number}: ${t.name}`;
        titleFilter.appendChild(opt);
    });
}

// ✅ Relational Filtering
document.addEventListener("DOMContentLoaded", async () => {
    await fetchTitles();
    await fetchAgencies();
    populateDropdowns();

    const titleFilter = document.getElementById("titleFilter");
    const agencyFilter = document.getElementById("agencyFilter");

    titleFilter.addEventListener("change", () => {
        const selectedTitle = parseInt(titleFilter.value);
        agencyFilter.innerHTML = `<option value="">-- All Agencies --</option>`;
        cachedAgencies
            .filter(a => a.titles && a.titles.includes(selectedTitle))
            .forEach(a => {
                const opt = document.createElement("option");
                opt.value = a.slug || a.name.toLowerCase().replace(/\s+/g, "-");
                opt.textContent = a.name;
                agencyFilter.appendChild(opt);
            });
    });

    agencyFilter.addEventListener("change", () => {
        const selected = agencyFilter.value;
        const selectedAgency = cachedAgencies.find(a =>
            a.slug === selected || a.name.toLowerCase().replace(/\s+/g, "-") === selected
        );
        titleFilter.innerHTML = `<option value="">-- All Titles --</option>`;
        if (selectedAgency && selectedAgency.titles) {
            cachedTitles
                .filter(t => selectedAgency.titles.includes(t.number))
                .forEach(t => {
                    const opt = document.createElement("option");
                    opt.value = t.number;
                    opt.textContent = `Title ${t.number}: ${t.name}`;
                    titleFilter.appendChild(opt);
                });
        } else {
            cachedTitles.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.number;
                opt.textContent = `Title ${t.number}: ${t.name}`;
                titleFilter.appendChild(opt);
            });
        }
    });
});
