function displayData(agencies, corrections, titles) {
    console.log("✅ Displaying data...");

    const tableBody = document.getElementById("agencyTableBody");
    tableBody.innerHTML = ""; // Clear the table before adding new data

    // Sort agencies alphabetically
    agencies.sort((a, b) => a.name.localeCompare(b.name));

    agencies.forEach(agency => {
        const row = document.createElement("tr");
        const childrenNames = agency.children.map(child => child.name).join(", ") || "N/A";

        // Find the latest correction related to this agency
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

    console.log("✅ Data displayed successfully.");
}

async function fetchData() {
    try {
        console.log("✅ Fetching data from backend...");

        // ✅ Use your Render backend URL
        const BACKEND_URL = "https://ecfr-backend-sk8g.onrender.com";
        const AGENCY_API = BACKEND_URL + "/api/agencies";
        const CORRECTIONS_API = BACKEND_URL + "/api/corrections";
        const TITLES_API = BACKEND_URL + "/api/titles";

        console.log(`🔍 Fetching: ${AGENCY_API}`);
        console.log(`🔍 Fetching: ${CORRECTIONS_API}`);
        console.log(`🔍 Fetching: ${TITLES_API}`);

        // Fetch all APIs in parallel
        const [agencyResponse, correctionsResponse, titlesResponse] = await Promise.all([
            fetch(AGENCY_API),
            fetch(CORRECTIONS_API),
            fetch(TITLES_API)
        ]);

        console.log("📌 API responses received.");

        if (!agencyResponse.ok || !correctionsResponse.ok || !titlesResponse.ok) {
            throw new Error(`🚨 API Error: One or more requests failed.`);
        }

        // Convert responses to JSON
        const agenciesData = await agencyResponse.json();
        const correctionsData = await correctionsResponse.json();
        const titlesData = await titlesResponse.json();

        console.log("✅ Successfully fetched data.");
        console.log("📌 Agencies Data:", agenciesData);
        console.log("📌 Corrections Data:", correctionsData);
        console.log("📌 Titles Data:", titlesData);

        // Display the data
        displayData(agenciesData.agencies, correctionsData.ecfr_corrections, titlesData.titles);
    } catch (error) {
        console.error("🚨 Error fetching data:", error);
    }
}

window.onload = fetchData;
