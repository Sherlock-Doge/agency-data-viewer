async function fetchData() {
    try {
        console.log("✅ Fetching data from backend...");

        const BACKEND_URL = "https://ecfr-backend-sk8g.onrender.com";
        const AGENCY_API = BACKEND_URL + "/api/agencies";
        const CORRECTIONS_API = BACKEND_URL + "/api/corrections";
        const TITLES_API = BACKEND_URL + "/api/titles";

        console.log(`🔍 Fetching: ${AGENCY_API}`);
        console.log(`🔍 Fetching: ${CORRECTIONS_API}`);
        console.log(`🔍 Fetching: ${TITLES_API}`);

        const [agencyResponse, correctionsResponse, titlesResponse] = await Promise.all([
            fetch(AGENCY_API),
            fetch(CORRECTIONS_API),
            fetch(TITLES_API)
        ]);

        console.log("📌 API responses received.");

        if (!agencyResponse.ok || !correctionsResponse.ok || !titlesResponse.ok) {
            throw new Error(`🚨 API Error: One or more requests failed.`);
        }

        const agenciesData = await agencyResponse.json();
        const correctionsData = await correctionsResponse.json();
        const titlesData = await titlesResponse.json();

        console.log("✅ Successfully fetched data.");
        console.log("📌 Agencies Data:", agenciesData);
        console.log("📌 Corrections Data:", correctionsData);
        console.log("📌 Titles Data:", titlesData);

        // ✅ Check if `displayData()` is even running
        console.log("🚀 Calling displayData now...");
        displayData(agenciesData.agencies, correctionsData.ecfr_corrections, titlesData.titles);
        console.log("✅ displayData has been called!");
    } catch (error) {
        console.error("🚨 Error fetching data:", error);
    }
}

function displayData(agencies, corrections, titles) {
    console.log("✅ Organizing and displaying data...");

    const tableBody = document.getElementById("agencyTableBody");
    tableBody.innerHTML = ""; // Clear the table before adding new data

    // Create a map to store agencies under each Title
    const titleMap = {};

    agencies.forEach(agency => {
        const agencyTitleNumber = agency.cfr_references?.[0]?.title || "Unknown";
        if (!titleMap[agencyTitleNumber]) {
            titleMap[agencyTitleNumber] = {
                name: `Title ${agencyTitleNumber}`,
                agencies: [],
                latestIssueDate: "N/A",
                latestAmended: "N/A",
                wordCount: "Unknown"
            };
        }

        agency.children.forEach(subAgency => {
            titleMap[agencyTitleNumber].agencies.push(subAgency.name);
        });
    });

    // Add title details from API
    titles.forEach(title => {
        if (titleMap[title.number]) {
            titleMap[title.number].name = `Title ${title.number} - ${title.name}`;
            titleMap[title.number].latestIssueDate = title.latest_issue_date || "N/A";
            titleMap[title.number].latestAmended = title.latest_amended_on || "N/A";
        }
    });

    // Display the data in table
    Object.values(titleMap).forEach(title => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${title.name}</td>
            <td>${title.agencies.map(agency => `<div>${agency}</div>`).join("") || "N/A"}</td>
            <td>${title.latestIssueDate}</td>
            <td>${title.latestAmended}</td>
            <td>${title.wordCount}</td>
        `;

        tableBody.appendChild(row);
    });

    console.log("✅ Data displayed successfully.");
}

window.onload = fetchData;
