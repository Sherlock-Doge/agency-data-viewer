// =========================================================
// ✅ eCFR Analyzer - Frontend Script (Full Final Version)
// =========================================================

// 🔗 Backend Base URL
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// 🧠 Cache Store (used for filter dropdowns and internal lookups)
let cachedTitles = [];
let cachedAgencies = [];
let agencyTitleMap = {};

// =========================================================
// 📦 Fetch Title Metadata
// =========================================================
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

// =========================================================
// 🏢 Fetch Agency Metadata
// =========================================================
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

// =========================================================
// 🗺️ Fetch Agency ↔ Title Mapping (if used in future filters)
// =========================================================
async function fetchAgencyTitleMap() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/agency-title-map`);
        const data = await response.json();
        agencyTitleMap = data.map || {};
        console.log("✅ Agency-Title Map fetched successfully:", agencyTitleMap);
    } catch (err) {
        console.error("🚨 Error fetching agency-title map:", err);
    }
}

// =========================================================
// 🔢 Fetch Word Count for Individual Title (Index Page)
// =========================================================
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    try {
        buttonElement.textContent = "🐇 Following the white rabbit...";
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

// =========================================================
// 📊 Update Scoreboard Section (Top of Index Page)
// =========================================================
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

// =========================================================
// 📋 Populate Titles Table (Index Page Table Body)
// =========================================================
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

// 🚀 Auto-init on page load
fetchData();

// =========================================================
// 🏢 Populate Agency Table (Agencies Page)
// =========================================================

const subtitleUrlOverrides = {
  "federal-procurement-regulations-system": { title: 41, subtitle: "A", url: "https://www.ecfr.gov/current/title-41/subtitle-A", label: "Title 41, Subtitle A" },
  "federal-property-management-regulations-system": { title: 41, subtitle: "C", url: "https://www.ecfr.gov/current/title-41/subtitle-C", label: "Title 41, Subtitle C" },
  "federal-travel-regulation-system": { title: 41, subtitle: "F", url: "https://www.ecfr.gov/current/title-41/subtitle-F", label: "Title 41, Subtitle F" },
  "department-of-defense": { title: 32, subtitle: "A", url: "https://www.ecfr.gov/current/title-32/subtitle-A", label: "Title 32, Subtitle A" },
  "department-of-health-and-human-services": { title: 45, subtitle: "A", url: "https://www.ecfr.gov/current/title-45/subtitle-A", label: "Title 45, Subtitle A" },
  "office-of-management-and-budget": { title: 2, subtitle: "A", url: "https://www.ecfr.gov/current/title-2/subtitle-A", label: "Title 2, Subtitle A" }
};

async function fetchAgenciesTableAndRender() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agencies`);
    const data = await response.json();

    const tableBody = document.querySelector("#agenciesTable tbody");
    tableBody.innerHTML = "";

    if (!data.agencies || data.agencies.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='3'>No agency data available.</td></tr>";
      return;
    }

    data.agencies.sort((a, b) => a.name.localeCompare(b.name));

    data.agencies.forEach((agency) => {
      const row = document.createElement("tr");

      const agencyCell = document.createElement("td");
      agencyCell.textContent = agency.name;

      const titlesCell = document.createElement("td");
      if (subtitleUrlOverrides[agency.slug]) {
        const patch = subtitleUrlOverrides[agency.slug];
        const link = document.createElement("a");
        link.href = patch.url;
        link.textContent = patch.label;
        link.target = "_blank";
        titlesCell.appendChild(link);
      } else if (agency.cfr_references?.length > 0) {
        agency.cfr_references.forEach((ref) => {
          const link = document.createElement("a");
          link.href = `https://www.ecfr.gov/current/title-${ref.title}/chapter-${ref.chapter || ""}`;
          link.textContent = `Title ${ref.title}, Chapter ${ref.chapter || "N/A"}`;
          link.target = "_blank";
          titlesCell.appendChild(link);
          titlesCell.appendChild(document.createElement("br"));
        });
      } else {
        titlesCell.textContent = "No Titles Found";
      }

      const wordCountCell = document.createElement("td");
      if (agency.slug === "federal-procurement-regulations-system") {
        wordCountCell.innerHTML = `<span>Content blank (0)</span>`;
      } else {
        const button = document.createElement("button");
        button.textContent = "Generate";
        button.addEventListener("click", () => fetchAgencyWordCount(agency, wordCountCell, button));
        wordCountCell.appendChild(button);
      }

      row.appendChild(agencyCell);
      row.appendChild(titlesCell);
      row.appendChild(wordCountCell);
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("🚨 Error loading agencies:", err);
    document.querySelector("#agenciesTable tbody").innerHTML =
      "<tr><td colspan='3'>Error loading agencies.</td></tr>";
  }
}

// Auto-run only on agencies.html
if (window.location.pathname.includes("agencies.html")) {
  document.addEventListener("DOMContentLoaded", fetchAgenciesTableAndRender);
}

// =========================================================
// 🔍 Perform Search (Search Page Execution)
// =========================================================
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
                const section = r.headings?.section || "No title";
                const excerpt = r.full_text_excerpt || "No description available.";
                div.innerHTML = `
                    <p><strong>${i + 1}.</strong> <a href="https://www.ecfr.gov/${r.link || ""}" target="_blank">${section}</a></p>
                    <p>${excerpt}</p>
                `;
                resultsBox.appendChild(div);
            });
        }
    } catch (err) {
        console.error("🚨 Backend Search Error:", err);
        resultsBox.innerHTML = "<p>Error retrieving search results.</p>";
    }
}

// =========================================================
// 🔁 Reset Search UI (Reset Button Action)
// =========================================================
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
    populateDropdowns();
}

// =========================================================
// 💬 Live Search Suggestions from Backend
// =========================================================
const searchQueryInput = document.getElementById("searchQuery");
if (searchQueryInput) {
    searchQueryInput.addEventListener("input", async function () {
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

    // 🔍 Enter Key → Trigger Search
    searchQueryInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });
}

// =========================================================
// 📂 Populate Filter Dropdowns
// =========================================================
function populateDropdowns() {
    const agencyFilter = document.getElementById("agencyFilter");
    const titleFilter = document.getElementById("titleFilter");

    if (!agencyFilter || !titleFilter) return;

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

// =========================================================
// ✍️ Fetch Word Count by Agency (New HTML Scrape Method)
// =========================================================
a// ✍️ Fetch Word Count by Agency (Final 3-parameter version)
async function fetchAgencyWordCount(agency, cellElement, buttonElement) {
    try {
        console.log("📥 Fetching word count for agency:", agency);
        buttonElement.textContent = "🐇 Following the white rabbit...";
        buttonElement.disabled = true;

        const slug = agency.slug || agency.name.toLowerCase().replace(/\s+/g, "-");
        const response = await fetch(`${BACKEND_URL}/api/wordcount/agency/${encodeURIComponent(slug)}`);
        const data = await response.json();

        console.log("✅ Word Count Response:", data);

        if (data.breakdowns && Array.isArray(data.breakdowns)) {
            const lines = data.breakdowns.map(item =>
                `Title ${item.title}, Chapter ${item.chapter}: ${item.wordCount.toLocaleString()}`
            );
            lines.push(`<strong>Total:</strong> ${data.total.toLocaleString()}`);
            cellElement.innerHTML = lines.join("<br>");
        } else if (data.total !== undefined) {
            cellElement.innerHTML = data.total.toLocaleString();
        } else {
            throw new Error("No total word count in response");
        }
    } catch (err) {
        console.error("🚨 Agency Word Count Error:", err);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

