async function fetchData() {
    try {
        console.log("Fetching data from backend...");

        // ✅ Use your Render backend URL
        const BACKEND_URL = "https://ecfr-backend-sk8g.onrender.com";
        const AGENCY_API = BACKEND_URL + "/api/agencies";
        const CORRECTIONS_API = BACKEND_URL + "/api/corrections";
        const TITLES_API = BACKEND_URL + "/api/titles";

        // Fetch all APIs in parallel
        const [agencyResponse, correctionsResponse, titlesResponse] = await Promise.all([
            fetch(AGENCY_API),
            fetch(CORRECTIONS_API),
            fetch(TITLES_API)
        ]);

        if (!agencyResponse.ok || !correctionsResponse.ok || !titlesResponse.ok) {
            throw new Error("One or more API requests failed.");
        }

        // Convert responses to JSON
        const agenciesData = await agencyResponse.json();
        const correctionsData = await correctionsResponse.json();
        const titlesData = await titlesResponse.json();

        console.log("✅ Successfully fetched data.");
        displayData(agenciesData.agencies, correctionsData.ecfr_corrections, titlesData.titles);
    } catch (error) {
        console.error("🚨 Error fetching data:", error);
    }
}

window.onload = fetchData;
