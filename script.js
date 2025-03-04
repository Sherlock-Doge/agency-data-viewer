async function fetchData() {
    try {
        console.log("✅ Fetching data from backend...");

        const BACKEND_URL = "https://ecfr-backend-sk8g.onrender.com";
        const TITLES_API = `${BACKEND_URL}/api/titles`;

        console.log(`🔍 Fetching: ${TITLES_API}`);

        const titlesResponse = await fetch(TITLES_API);
        if (!titlesResponse.ok) throw new Error("🚨 API Error: Failed to fetch titles.");

        const titlesData = await titlesResponse.json();
        console.log("✅ Successfully fetched titles data.");
        console.log("📌 Titles Data:", titlesData);

        // Render the structured data in the table
        displayData(titlesData.titles);
    } catch (error) {
        console.error("🚨 Error fetching data:", error);
    }
}

async function fetchWordCount(title, part) {
    try {
        const BACKEND_URL = "https://ecfr-backend-sk8g.onrender.com";
        const WORDCOUNT_API = `${BACKEND_URL}/api/wordcount/${title}/${part}`;
        
        const response = await fetch(WORDCOUNT_API);
        if (!response.ok) throw new Error("Failed to fetch word count.");

        const data = await response.json();
        return data.wordCount;
    } catch (error) {
        console.error(`🚨 Error fetching word count for Title ${title}, Part ${part}:`, error);
        return "N/A";
    }
}

async function displayData(titles) {
    console.log("✅ Organizing and displaying data...");

    const tableBody = document.getElementById("agencyTableBody");
    tableBody.innerHTML = ""; // Clear the table before adding new data

    for (const title of titles) {
        const titleName = `Title ${title.number} - ${title.name}`;
        let firstRow = true;

        for (const chapter of title.children || []) {
            const chapterName = chapter.label || "N/A";

            for (const subchapter of chapter.children || []) {
                const subchapterName = subchapter.label || "N/A";

                for (const part of subchapter.children || []) {
                    const partName = part.label || "N/A";
                    const partNumber = part.identifier || "N/A";

                    // Fetch the word count for this part
                    const wordCount = await fetchWordCount(title.number, partNumber);

                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${firstRow ? titleName : ""}</td>
                        <td>${firstRow || chapterName !== "N/A" ? chapterName : ""}</td>
                        <td>${firstRow || subchapterName !== "N/A" ? subchapterName : ""}</td>
                        <td>${partName}</td>
                        <td>${title.latest_issue_date || "N/A"}</td>
                        <td>${title.latest_amended_on || "N/A"}</td>
                        <td>${wordCount}</td>
                    `;

                    tableBody.appendChild(row);
                    firstRow = false;
                }
            }
        }
    }

    console.log("✅ Data displayed successfully.");
}

window.onload = fetchData;
