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
