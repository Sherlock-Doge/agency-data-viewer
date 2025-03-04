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
