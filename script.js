// ✅ Backend URL
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// ✅ Cache for Dynamic Filtering
let cachedTitles = [];
let cachedAgencies = [];
let agencyTitleMap = {};
let masterTitles = [];
let masterAgencies = [];

// 📌 Fetch Titles
async function fetchTitles() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/titles`);
        const data = await res.json();
        cachedTitles = data.titles || [];
        masterTitles = [...cachedTitles];
        return cachedTitles;
    } catch (e) {
        console.error("🚨 Error fetching titles:", e);
        return [];
    }
}

// 📌 Fetch Agencies
async function fetchAgencies() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/agencies`);
        const data = await res.json();
        cachedAgencies = data.agencies || [];
        masterAgencies = [...cachedAgencies];
        return cachedAgencies;
    } catch (e) {
        console.error("🚨 Error fetching agencies:", e);
        return [];
    }
}

// 📌 Fetch Agency-Title Mapping
async function fetchAgencyTitleMap() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/agency-title-map`);
        const data = await res.json();
        agencyTitleMap = data.map || {};
    } catch (e) {
        console.error("🚨 Error fetching agency-title map:", e);
    }
}

// 📌 Fetch Word Count
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    try {
        buttonElement.textContent = "Fetching...";
        buttonElement.disabled = true;
        const res = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
        const data = await res.json();
        buttonElement.parentElement.innerHTML = data.wordCount.toLocaleString();
    } catch (e) {
        console.error("🚨 Word Count Error:", e);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

// 📌 Scoreboard
function updateScoreboard(totalTitles, totalAgencies, recentTitle, recentDate, recentName) {
    document.getElementById("totalTitles").textContent = totalTitles;
    document.getElementById("totalAgencies").textContent = totalAgencies;
    const aTitle = document.getElementById("recentAmendedTitle");
    const aDate = document.getElementById("recentAmendedDate");
    if (aTitle && aDate) {
        aTitle.href = recentTitle ? `https://www.ecfr.gov/current/title-${recentTitle.replace("Title ", "")}` : "#";
        aTitle.textContent = recentTitle ? `${recentTitle} - ${recentName}` : "N/A";
        aDate.textContent = recentDate ? `(${recentDate})` : "(N/A)";
    }
}

// 📌 Populate Table
async function fetchData() {
    const tbody = document.querySelector("#titlesTable tbody");
    if (tbody) tbody.innerHTML = "";
    const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);

    let mostRecentTitle = null, mostRecentDate = null, mostRecentTitleName = null;
    titles.forEach(title => {
        const row = document.createElement("tr");
        const titleUrl = `https://www.ecfr.gov/current/title-${title.number}`;
        if (!mostRecentDate || (title.latest_amended_on > mostRecentDate)) {
            mostRecentDate = title.latest_amended_on;
            mostRecentTitle = `Title ${title.number}`;
            mostRecentTitleName = title.name;
        }
        row.innerHTML = `
            <td><a href="${titleUrl}" target="_blank">Title ${title.number} - ${title.name}</a></td>
            <td>${title.up_to_date_as_of || "N/A"}</td>
            <td>${title.latest_amended_on || "N/A"}</td>
            <td><button onclick="fetchSingleTitleWordCount(${title.number}, this)">Generate</button></td>`;
        tbody.appendChild(row);
    });

    updateScoreboard(titles.length, agencies.length, mostRecentTitle, mostRecentDate, mostRecentTitleName);
}

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
                const section = r.headings?.section || "No title";
                const excerpt = r.full_text_excerpt || "No description available.";
                const safeLink = r.link ? `https://www.ecfr.gov/${r.link}` : "#";
                div.innerHTML = `
                    <p><strong>${i + 1}.</strong> <a href="${safeLink}" target="_blank">${section}</a></p>
                    <p>${excerpt}</p>`;
                resultsBox.appendChild(div);
            });
        }
    } catch (e) {
        console.error("🚨 Search Error:", e);
        resultsBox.innerHTML = "<p>Error retrieving search results.</p>";
    }
}

// ✅ Reset
function resetSearch() {
    document.getElementById("searchQuery").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";

    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchResults").style.display = "none";
    document.getElementById("searchSuggestions").innerHTML = "";
    document.getElementById("searchSuggestions").style.display = "none";
    document.body.classList.remove("search-results-visible");

    cachedTitles = [...masterTitles];
    cachedAgencies = [...masterAgencies];
    populateDropdowns();
}

// ✅ Suggestions
document.getElementById("searchQuery").addEventListener("input", async function () {
    const query = this.value.trim();
    const suggestionBox = document.getElementById("searchSuggestions");
    if (!query) {
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
        return;
    }
    try {
        const res = await fetch(`${BACKEND_URL}/api/search/suggestions?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        suggestionBox.innerHTML = "";
        if (data.suggestions?.length > 0) {
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
    } catch (e) {
        console.error("🚨 Suggestion error:", e);
        suggestionBox.style.display = "none";
    }
});

// ✅ Enter Key to Search
document.getElementById("searchQuery").addEventListener("keypress", e => {
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

// ✅ Relational Filter Sync
document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([fetchTitles(), fetchAgencies(), fetchAgencyTitleMap()]);
    populateDropdowns();

    const titleFilter = document.getElementById("titleFilter");
    const agencyFilter = document.getElementById("agencyFilter");

    titleFilter.addEventListener("change", () => {
        const selected = parseInt(titleFilter.value);
        agencyFilter.innerHTML = `<option value="">-- All Agencies --</option>`;
        for (const [agencyName, titles] of Object.entries(agencyTitleMap)) {
            if (titles.includes(selected)) {
                const opt = document.createElement("option");
                const slug = agencyName.toLowerCase().replace(/\s+/g, "-");
                opt.value = slug;
                opt.textContent = agencyName;
                agencyFilter.appendChild(opt);
            }
        }
    });

    agencyFilter.addEventListener("change", () => {
        const selectedSlug = agencyFilter.value;
        const agencyObj = cachedAgencies.find(
            a => a.slug === selectedSlug || a.name.toLowerCase().replace(/\s+/g, "-") === selectedSlug
        );
        const agencyName = agencyObj?.name;
        const relTitles = agencyTitleMap[agencyName] || [];
        titleFilter.innerHTML = `<option value="">-- All Titles --</option>`;
        cachedTitles.forEach(t => {
            if (relTitles.length === 0 || relTitles.includes(t.number)) {
                const opt = document.createElement("option");
                opt.value = t.number;
                opt.textContent = `Title ${t.number}: ${t.name}`;
                titleFilter.appendChild(opt);
            }
        });
    });
});
