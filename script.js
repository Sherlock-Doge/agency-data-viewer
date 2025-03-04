async function fetchData() {
    try {
        console.log("Fetching data from APIs...");

        // Use a CORS proxy to bypass CORS restrictions
        const PROXY = "https://corsproxy.io/?";
        const AGENCY_API = PROXY + "https://www.ecfr.gov/api/admin/v1/agencies.json";
        const CORRECTIONS_API = PROXY + "https://www.ecfr.gov/api/admin/v1/corrections.json";
        const TITLES_API = PROXY + "https://www.ecfr.gov/api/versioner/v1/titles.json";

        // Fetch all APIs in parallel
        const [agencyResponse, correctionsResponse, titlesResponse] = await Promise.all([
            fetch(AGENCY_API),
            fetch(CORRECTIONS_API),
            fetch(TITLES_API)
        ]);

        // Validate API responses
        if (!agencyResponse.ok || !correctionsResponse.ok || !titlesResponse.ok) {
            throw new Error(`One or more API requests failed.`);
        }

        // Convert responses to JSON
        const agenciesData = await agencyResponse.json();
        const correctionsData = await correctionsResponse.json();
        const titlesData = await titlesResponse.json();

        console.log("✅ Successfully fetched API data.");
        console.log("📌 Agencies Data:", agenciesData);
        console.log("📌 Corrections Data:", correctionsData);
        console.log("📌 Titles Data:", titlesData);

        // Display the data
        displayData(agenciesData.agencies, correctionsData.ecfr_corrections, titlesData.titles);
    } catch (error) {
        console.error("🚨 Error fetching data:", error);
    }
}

function displayData(agencies, corrections, titles) {
    const tableBody = document.getElementById("agencyTableBody");
    tableBody.innerHTML = "";

    agencies.sort((a, b) => a.name.localeCompare(b.name));

    agencies.forEach(agency => {
        const row = document.createElement("tr");
        const childrenNames = agency.children.map(child => child.name).join(", ") || "N/A";

        // Find latest correction related to this agency
        const latestCorrection = corrections
            .filter(corr => corr.cfr_references.some(ref => 
                agency.cfr_references.some(agRef => agRef.title == ref.hierarchy.title)
            ))
            .sort((a, b) => new Date(b.error_corrected) - new Date(a.error_corrected))[0];

        const currentAsOf = latestCorrection?.error_corrected || "Unknown";
        const lastAmended = latestCorrection?.error_occurred || "Unknown";
        const wordCount = latestCorrection?.corrective_action?.split(" ").length || "Unknown";

        // Find matching title information
        const agencyTitle = agency.cfr_references?.[0]?.title || null;
        const matchingTitle = titles.find(title => title.number == agencyTitle);
        const latestAmended = matchingTitle?.latest_amended_on || "N/A";
        const latestIssueDate = matchingTitle?.latest_issue_date || "N/A";

        row.innerHTML = `
            <td>${agency.name}</td>
            <td>${childrenNames}</td>
            <td>${latestIssueDate}</td>
            <td>${latestAmended}</td>
            <td>${wordCount}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Run fetchData on page load
window.onload = fetchData;
