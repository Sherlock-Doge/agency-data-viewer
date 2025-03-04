async function fetchData() {
    try {
        const [agencyResponse, correctionsResponse] = await Promise.all([
            fetch('/api/admin/v1/agencies.json'),
            fetch('/api/admin/v1/corrections.json')
        ]);

        const agenciesData = await agencyResponse.json();
        const correctionsData = await correctionsResponse.json();

        displayData(agenciesData.agencies, correctionsData.ecfr_corrections);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayData(agencies, corrections) {
    const tableBody = document.getElementById("agencyTableBody");
    tableBody.innerHTML = "";

    agencies.sort((a, b) => a.name.localeCompare(b.name));

    agencies.forEach(agency => {
        const row = document.createElement("tr");
        const childrenNames = agency.children.map(child => child.name).join(", ") || "N/A";

        const latestCorrection = corrections
            .filter(corr => corr.cfr_references.some(ref => agency.cfr_references.some(agRef => agRef.title == ref.hierarchy.title)))
            .sort((a, b) => new Date(b.error_corrected) - new Date(a.error_corrected))[0];

        const currentAsOf = latestCorrection?.error_corrected || "Unknown";
        const lastAmended = latestCorrection?.error_occurred || "Unknown";
        const wordCount = latestCorrection?.corrective_action?.split(" ").length || "Unknown";

        row.innerHTML = `
            <td>${agency.name}</td>
            <td>${childrenNames}</td>
            <td>${currentAsOf}</td>
            <td>${lastAmended}</td>
            <td>${wordCount}</td>
        `;

        tableBody.appendChild(row);
    });
}

window.onload = fetchData;
