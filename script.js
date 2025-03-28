
//============= eCFR Analyzer - Frontend Script =============
// 🔗 Backend Base URL
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// 🧠 Cache Store (used for filter dropdowns and internal lookups)
let cachedTitles = [];
let cachedAgencies = [];
let agencyTitleMap = {};


//============= Fetch Title Metadata =============
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


//============= Fetch Agency Metadata =============
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


//  ============= Fetch Agency ↔ Title Mapping =============
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


// ============= Bind Agency → Title relational filter logic =============
function bindRelationalFilter() {
  const agencySelect = document.getElementById("agencyFilter");
  const titleSelect = document.getElementById("titleFilter");

  agencySelect.addEventListener("change", () => {
    const selectedAgency = agencySelect.value;

    // 🧹 Reset Title dropdown (clear all but first option)
    while (titleSelect.options.length > 1) {
      titleSelect.remove(1);
    }

    // Show all titles if no agency selected or no mapping
    if (!selectedAgency || !agencyTitleMap[selectedAgency]) {
      cachedTitles.forEach(title => {
        const option = document.createElement("option");
        option.value = title.number;
        option.textContent = `Title ${title.number} — ${title.name}`;
        titleSelect.appendChild(option);
      });
      return;
    }

    // Filter titles based on agency mapping
    const filteredTitles = agencyTitleMap[selectedAgency];
    const matchingTitles = cachedTitles.filter(t =>
      filteredTitles.includes(parseInt(t.number))
    );

    matchingTitles.forEach(title => {
      const option = document.createElement("option");
      option.value = title.number;
      option.textContent = `Title ${title.number} — ${title.name}`;
      titleSelect.appendChild(option);
    });
  });
}


//============= Fetch Word Count for Individual Title (Index Page) =============
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
  try {
    buttonElement.textContent = "🐇 Following the white rabbit ...";
    buttonElement.disabled = true;
    buttonElement.style.opacity = "1";
    buttonElement.style.backgroundColor = "#eee";
    buttonElement.style.color = "#222";
    buttonElement.style.fontWeight = "bold";
    buttonElement.style.cursor = "not-allowed";
    buttonElement.style.border = "1px solid #888";
    const response = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
    const data = await response.json();
    buttonElement.parentElement.innerHTML = data.wordCount.toLocaleString();
  } catch (err) {
    console.error("🚨 Word Count Error:", err);
    buttonElement.textContent = "Retry";
    buttonElement.disabled = false;
  }
}


//============= Update Scoreboard Section (Top of Index Page) =============
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


//============= Populate Titles Table (Index Page Table Body) =============
async function fetchData() {
  const tbody = document.querySelector("#titlesTable tbody");
  if (tbody) tbody.innerHTML = "";

  const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);

  let mostRecentTitle = null,
    mostRecentDate = null,
    mostRecentTitleName = null;

  titles.forEach((title) => {
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


//============= Populate Agency Table (Agencies Page) =============
// 📌 Subtitle Patch Overrides (for special-case agencies with broken/blank chapters)
const subtitleUrlOverrides = {
    "federal-procurement-regulations-system": {
      title: 41,
      subtitle: "A",
      url: "https://www.ecfr.gov/current/title-41/subtitle-A",
      label: "Title 41, Subtitle A"
    },
    "federal-property-management-regulations-system": {
      title: 41,
      subtitle: "C",
      url: "https://www.ecfr.gov/current/title-41/subtitle-C",
      label: "Title 41, Subtitle C"
    },
    "federal-travel-regulation-system": {
      title: 41,
      subtitle: "F",
      url: "https://www.ecfr.gov/current/title-41/subtitle-F",
      label: "Title 41, Subtitle F"
    },
    "department-of-defense": {
      title: 32,
      subtitle: "A",
      url: "https://www.ecfr.gov/current/title-32/subtitle-A",
      label: "Title 32, Subtitle A"
    },
    "department-of-health-and-human-services": {
      title: 45,
      subtitle: "A",
      url: "https://www.ecfr.gov/current/title-45/subtitle-A",
      label: "Title 45, Subtitle A"
    },
    "office-of-management-and-budget": {
      title: 2,
      subtitle: "A",
      url: "https://www.ecfr.gov/current/title-2/subtitle-A",
      label: "Title 2, Subtitle A"
    }
  };
  
  // 📋 Fetch and Render Agencies Table
  async function fetchAgenciesTableAndRender() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/agencies`);
      const data = await response.json();
      const tableBody = document.querySelector("#agenciesTable tbody");
      tableBody.innerHTML = "";
  
      if (!data.agencies || data.agencies.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4'>No agency data available.</td></tr>";
        return;
      }
  
      // 🔡 Alphabetize agencies by name
      data.agencies.sort((a, b) => a.name.localeCompare(b.name));
  
      data.agencies.forEach((agency) => {
        const row = document.createElement("tr");
  
        // Column 1: Agency Name
        const agencyCell = document.createElement("td");
        agencyCell.textContent = agency.name;
  
        // Column 2: CFR References or Subtitle Patch
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
  
        // Column 3: Standard Word Count Button
        const wordCountCell = document.createElement("td");
        if (agency.slug === "federal-procurement-regulations-system") {
          wordCountCell.innerHTML = `<span>Content blank (0)</span>`;
        } else {
          const button = document.createElement("button");
          button.textContent = "Generate";
          button.style.opacity = "1";
          button.addEventListener("click", () =>
            fetchAgencyWordCount(agency, wordCountCell, button)
          );
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
        "<tr><td colspan='4'>Error loading agencies.</td></tr>";
    }
  }
  
   
//============= 🐿️ Cyber Squirrel Search Engine – Down the Tree, Capture the Spoils =============
let abortController = null;

//  Loader Show/Hide Handlers
function showMatrixLoader() {
  const loader = document.querySelector('.matrix-loader-container');
  if (loader) loader.style.opacity = "1";
}

function hideMatrixLoader() {
  const loader = document.querySelector('.matrix-loader-container');
  if (loader) loader.style.opacity = "0";
}

//  Perform Internal Search (keyword, filters, version)
async function performSearch() {
  const query = document.getElementById("searchQuery").value.trim();
  const agency = document.getElementById("agencyFilter").value;
  const title = document.getElementById("titleFilter").value;
  const version = document.getElementById("versionHistory")?.value || null;
  const resultsBox = document.getElementById("searchResults");
  const matrixAlert = document.getElementById("matrixAlert");

  const hasFilters = agency || title || version;

  // ⚠ Empty query + filters = show matrix warning box
  if (!query && !hasFilters) {
    if (matrixAlert) matrixAlert.style.display = "block";
    if (resultsBox) resultsBox.style.display = "none";
    return;
  } else {
    if (matrixAlert) matrixAlert.style.display = "none"; // Auto-hide matrix alert on valid search
  }

  // 💡 Tip: Inform about better historical version search scope
  const alertBox = document.getElementById("searchValidationAlert");
  if (version && !agency && !title && alertBox) {
    alertBox.textContent = "💡 Tip: Selecting a Title or Agency improves search accuracy when using Historical Versions.";
    alertBox.style.display = "block";
  }

  // 🔍 Search Initiation Log + UI setup
  console.log(`🛫 Cyber Squirrel Internal Search → ${query || "[Filters only]"}`);
  document.body.classList.add("search-results-visible");
  showMatrixLoader();

  // ✅ Show results box
  if (resultsBox) resultsBox.style.display = "block";

  // 🧹 Clear old suggestions
  const suggestionBox = document.getElementById("searchSuggestions");
  if (suggestionBox) {
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none";
  }

  // 🟥 Show Abort Button
  const abortBtn = document.getElementById("stopSearchBtn");
  if (abortBtn) abortBtn.style.display = "inline-block";

  // ⛔ Abort previous search if active
  if (abortController) abortController.abort();
  abortController = new AbortController();

  // 🔗 Build Backend Search URL
  const url = new URL(`${BACKEND_URL}/api/search/cyber-squirrel`);
  if (query) url.searchParams.append("q", query);
  if (agency) url.searchParams.append("agency_slugs[]", agency);
  if (title) url.searchParams.append("title", title);
  if (version) url.searchParams.append("issueDate", version);

  try {
    const res = await fetch(url.toString(), { signal: abortController.signal });
    const data = await res.json();

    // 🧼 Clear previous results
    resultsBox.style.display = "block";
    resultsBox.innerHTML = "";

    // 📭 Show "no results" fallback
    if (!data.results || data.results.length === 0) {
      resultsBox.innerHTML = "<p>No results found.</p>";
    } else {
      // 📦 Render matched results
      resultsBox.innerHTML = `<p><em>${data.results.length} matches found.</em></p>`;
      data.results.forEach((r, i) => {
        const div = document.createElement("div");
        div.classList.add("search-result");

        const section = r.section || r.title || "Section";
        const heading = r.heading || "";
        const matchType = r.matchType || "";
        const issueDate = r.issueDate || "";

        let excerpt = r.excerpt || "No description available.";
        if (query) {
          const regex = new RegExp(`(${query})`, "gi");
          excerpt = excerpt.replace(regex, "<mark>$1</mark>");
        }

        const link = r.link || "#";
        div.innerHTML = `
          <p><strong>${i + 1}. <a href="${link}" target="_blank">${section}</a></strong></p>
          ${heading ? `<p><strong>${heading}</strong></p>` : ""}
          ${matchType ? `<p><em>Match Type: ${matchType}</em></p>` : ""}
          ${issueDate ? `<p><em>Version: ${issueDate}</em></p>` : ""}
          <p>${excerpt}</p>
        `;
        resultsBox.appendChild(div);
      });
    }

  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("🛑 Search aborted by user.");
      resultsBox.innerHTML = "<p><em>Search was stopped.</em></p>";
    } else {
      console.error("🚨 Cyber Squirrel Search Error:", err);
      resultsBox.innerHTML = "<p>Error retrieving search results.</p>";
    }
  } finally {
    // ✅ Always cleanup UI
    hideMatrixLoader();
    if (abortBtn) abortBtn.style.display = "none";
  }
}


//  Abort Button Handler
function stopSearch() {
  if (abortController) abortController.abort();
  const abortBtn = document.getElementById("stopSearchBtn");
  if (abortBtn) abortBtn.style.display = "none";
}


//  Load Version History Dropdown
async function loadVersionHistory() {
  try {
    if (!cachedTitles || cachedTitles.length === 0) return;
    const uniqueDates = [...new Set(
      cachedTitles.map(t => t.latest_issue_date || t.up_to_date_as_of).filter(Boolean)
    )];
    uniqueDates.sort((a, b) => b.localeCompare(a)); // Newest first
    const dropdown = document.getElementById("versionHistory");
    if (!dropdown) return;

    dropdown.innerHTML = `<option value="">-- Latest Version --</option>`;
    uniqueDates.forEach(date => {
      const opt = document.createElement("option");
      opt.value = date;
      opt.textContent = `Version from ${date}`;
      dropdown.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load version history:", err);
  }
}

//  Alphabetize Agency Dropdown
function alphabetizeAgenciesDropdown() {
  const agencySelect = document.getElementById("agencyFilter");
  const options = Array.from(agencySelect.options).filter(o => o.value);
  options.sort((a, b) => a.text.localeCompare(b.text));
  agencySelect.innerHTML = `<option value="">Select Agency</option>`;
  options.forEach(o => agencySelect.appendChild(o));
}


//  Advanced Search Banner Message
function showSearchBanner() {
  const banner = document.getElementById("searchBanner");
  if (banner) {
    banner.innerHTML = `<p><em>Search by keyword, title, agency, or dig into Historical Versions.</em></p>`;
  }
}


//  Toggle Advanced Filters
function toggleAdvancedFilters() {
  const wrapper = document.querySelector(".advanced-filters-wrapper");
  if (wrapper) {
    wrapper.classList.toggle("visible");
  }
}


//  Search Page Initialization
document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;
  const isSearchPage = path.includes("search.html");
  const isAgenciesPage = path.includes("agencies.html");
  const isIndexPage = path.endsWith("/") || path.includes("index.html");

  if (isSearchPage) {
    await fetchTitles();
    await fetchAgencies();
    await fetchAgencyTitleMap(); //recent add
    
    populateDropdowns();
    alphabetizeAgenciesDropdown();
    bindRelationalFilter(); //recent add
    loadVersionHistory();
    showSearchBanner();

    // Bind control buttons
    document.getElementById("searchButton")?.addEventListener("click", performSearch);
    document.getElementById("resetButton")?.addEventListener("click", resetSearch);
    document.getElementById("stopSearchBtn")?.addEventListener("click", stopSearch);
    document.getElementById("toggleFiltersButton")?.addEventListener("click", toggleAdvancedFilters);

    // Version Tip Message Behavior
    const versionDropdown = document.getElementById("versionHistory");
    const versionTipBox = document.getElementById("versionGuidanceTip");

    const evaluateVersionTipVisibility = () => {
      if (!versionDropdown || !versionTipBox) return;
      const selectedVersion = versionDropdown.value;
      const selectedTitle = document.getElementById("titleFilter")?.value;
      const selectedAgency = document.getElementById("agencyFilter")?.value;
      versionTipBox.style.display = (selectedVersion && !selectedTitle && !selectedAgency) ? "block" : "none";
    };

    // Bind version tip listeners
    versionDropdown?.addEventListener("change", evaluateVersionTipVisibility);
    document.getElementById("titleFilter")?.addEventListener("change", evaluateVersionTipVisibility);
    document.getElementById("agencyFilter")?.addEventListener("change", evaluateVersionTipVisibility);
  }

  if (isAgenciesPage) {
    fetchAgenciesTableAndRender();
  }

  if (isIndexPage) {
    console.log("📢 Index page detected – initializing metadata and table...");
    const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);
    cachedTitles = titles;
    cachedAgencies = agencies;
    fetchData();
  }
});


//  Reset Button Action
function resetSearch() {
    document.getElementById("searchQuery").value = "";

    const startDate = document.getElementById("startDate");
    if (startDate) startDate.value = "";

    const endDate = document.getElementById("endDate");
    if (endDate) endDate.value = "";

    const versionDropdown = document.getElementById("versionHistory");
    if (versionDropdown) versionDropdown.selectedIndex = 0;

    const agencyFilter = document.getElementById("agencyFilter");
    if (agencyFilter) agencyFilter.selectedIndex = 0;

    const titleFilter = document.getElementById("titleFilter");
    if (titleFilter) titleFilter.selectedIndex = 0;

    const resultsBox = document.getElementById("searchResults");
    if (resultsBox) {
        resultsBox.innerHTML = "";
        resultsBox.style.display = "none";
    }

    const suggestionBox = document.getElementById("searchSuggestions");
    if (suggestionBox) {
        suggestionBox.innerHTML = "";
        suggestionBox.style.display = "none";
    }

  // Hide matrix alert
    const matrixAlert = document.getElementById("matrixAlert");
    if (matrixAlert) matrixAlert.style.display = "none";

  // Hide version guidance tip
    const versionTipBox = document.getElementById("versionGuidanceTip");
    if (versionTipBox) versionTipBox.style.display = "none";

    document.body.classList.remove("search-results-visible");

  // Re-populate dropdowns (if applicable)
    populateDropdowns();
  
    }

      
  //  Live Search Suggestions from Backend
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
  
            // 🏷️ Labeling suggestions
            let label = s;
            if (s.match(/^Title \d+/)) label = `📘 ${s}`;
            else if (s.match(/^§ \d/)) label = `🔖 Section: ${s}`;
            else if (cachedAgencies.some(a => a.name === s)) label = `🏛 Agency: ${s}`;
            else label = `🔍 ${s}`;
  
            div.textContent = label;
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
  
    // ⌨️ Enter Key triggers search
    searchQueryInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });
  }
  
  
  //  Populate Filter Dropdowns (Titles + Agencies)
  function populateDropdowns() {
    const agencyFilter = document.getElementById("agencyFilter");
    const titleFilter = document.getElementById("titleFilter");
  
    if (!agencyFilter || !titleFilter) return;
  
    agencyFilter.innerHTML = `<option value="">-- All Agencies --</option>`;
    [...cachedAgencies]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.slug || a.name.toLowerCase().replace(/\s+/g, "-");
        opt.textContent = a.name;
        agencyFilter.appendChild(opt);
      });
  
   titleFilter.innerHTML = `<option value="">-- All Titles --</option>`;
    [...cachedTitles]
      .sort((a, b) => a.number - b.number) 
      .forEach(t => {
          const opt = document.createElement("option");
          opt.value = t.number;
          opt.textContent = `Title ${t.number}: ${t.name}`;
          titleFilter.appendChild(opt);
      });
  }


  //============= Fetch Word Count by Agency =============
  async function fetchAgencyWordCount(agency, cellElement, buttonElement) {
    try {
      console.log("📥 Fetching word count for agency:", agency.name);
      buttonElement.textContent = "🐇 Following the white rabbit...";
      buttonElement.disabled = true;
      buttonElement.style.opacity = "1";
      buttonElement.style.backgroundColor = "#eee";
      buttonElement.style.color = "#222";
      buttonElement.style.fontWeight = "bold";
      buttonElement.style.cursor = "not-allowed";
      buttonElement.style.border = "1px solid #888";
  
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
  
//============= Lock Search Results Height to Cipher =============
function lockSearchResultsHeightToCipher() {
  const cipherImage = document.getElementById("cipherImage");
  const searchResults = document.getElementById("searchResults");
  if (cipherImage && searchResults) {
    const cipherHeight = cipherImage.offsetHeight + "px";
    searchResults.style.height = cipherHeight;
    searchResults.style.maxHeight = cipherHeight;
  }
}

// 🚨 Run once on load AND on resize
window.addEventListener("load", lockSearchResultsHeightToCipher);
window.addEventListener("resize", lockSearchResultsHeightToCipher);

