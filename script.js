// ✅ Backend URL (Updated to new backend service)
const BACKEND_URL = "https://ecfr-backend-service.onrender.com";

// 📌 Fetch Word Count for a Single Title (when "Generate" button is clicked)
async function fetchSingleTitleWordCount(titleNumber, buttonElement) {
    try {
        console.log(`📥 Fetching word count for Title ${titleNumber}...`);
        buttonElement.textContent = "Fetching...";
        buttonElement.disabled = true;

        // Display "This may take a few moments" message
        const statusText = document.createElement("span");
        statusText.textContent = " This may take a few moments...";
        statusText.style.color = "gray";
        buttonElement.parentElement.appendChild(statusText);

        const response = await fetch(`${BACKEND_URL}/api/wordcount/${titleNumber}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log(`✅ Word Count for Title ${titleNumber}:`, data.wordCount);

        // ✅ Update UI with fetched word count
        buttonElement.parentElement.innerHTML = data.wordCount.toLocaleString();
    } catch (error) {
        console.error(`🚨 Error fetching word count for Title ${titleNumber}:`, error);
        buttonElement.textContent = "Retry";
        buttonElement.disabled = false;
    }
}

// 📌 Populate Word Count Button
function generateWordCountButton(titleNumber) {
    return `<button onclick="fetchSingleTitleWordCount(${titleNumber}, this)">Generate</button>`;
}

// 📌 Main Function to Fetch and Populate Table
async function fetchData() {
    const tableBody = document.querySelector("#titlesTable tbody");
    tableBody.innerHTML = "";

    const [titles, agencies] = await Promise.all([fetchTitles(), fetchAgencies()]);

    titles.forEach(title => {
        const titleUrl = `https://www.ecfr.gov/current/title-${title.number}`;
        const wordCountDisplay = generateWordCountButton(title.number);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><a href="${titleUrl}" target="_blank">${title.name}</a></td>
            <td>${title.up_to_date_as_of || "N/A"}</td>
            <td>${title.latest_amended_on || "N/A"}</td>
            <td>${wordCountDisplay}</td>
        `;
        tableBody.appendChild(row);
    });

    console.log("✅ Table populated successfully.");
}

// 📌 Start Fetching Data on Load
fetchData();
