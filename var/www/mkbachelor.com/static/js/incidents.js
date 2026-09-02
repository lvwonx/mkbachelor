let editingId = null;
let selectedRiskIds = [];

async function loadIncidentRisks() {
    try {
        const res = await fetch(
            "/risks?page=1&per_page=50"
        );

        const result =
            await res.json();

        if (!res.ok) {
            console.error(
                "Failed to load risks:",
                result
            );

            return;
        }

        const container =
            document.getElementById(
                "riskSelectOptions"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const risks =
            result.items || [];

        risks.forEach(risk => {
            const label =
                document.createElement(
                    "label"
                );

            label.className =
                "multi-select-option";

            const checkbox =
                document.createElement(
                    "input"
                );

            checkbox.type =
                "checkbox";

            checkbox.value =
                risk.risk_id;

            checkbox.checked =
                selectedRiskIds.includes(
                    Number(risk.risk_id)
                );

            checkbox.addEventListener(
                "change",
                () => {
                    const id =
                        Number(
                            checkbox.value
                        );

                    if (
                        checkbox.checked
                    ) {

                        if (
                            !selectedRiskIds.includes(
                                id
                            )
                        ) {

                            selectedRiskIds.push(
                                id
                            );
                        }

                    } else {

                        selectedRiskIds =
                            selectedRiskIds.filter(
                                riskId =>
                                    riskId !== id
                            );
                    }

                    updateRiskSelectText();
                }
            );

            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                risk.name;

            label.appendChild(
                checkbox
            );

            label.appendChild(
                text
            );

            container.appendChild(
                label
            );
        });

        updateRiskSelectText();

    } catch (error) {
        console.error(
            "LOAD INCIDENT RISKS ERROR:",
            error
        );
    }
}

function updateRiskSelectText() {
    const placeholder =
        document.getElementById(
            "riskSelectPlaceholder"
        );

    if (!placeholder) {
        return;
    }

    if (
        selectedRiskIds.length === 0
    ) {

        placeholder.textContent =
            "Izvēlieties riskus";

        return;
    }

    placeholder.textContent =
        `Izvēlēti riski: ${selectedRiskIds.length}`;
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

async function loadIncidents() {
    try {
        const page =
            window.incidentsCurrentPage || 1;
        const perPage =
            window.incidentsPerPage || 5;

        const searchInput =
            document.getElementById(
                "incidentSearch"
            );

        const search =
            searchInput
                ? searchInput.value.trim()
                : "";

        const params =
            new URLSearchParams();

        params.set(
            "page",
            page
        );

        params.set(
            "per_page",
            perPage
        );

        if (search) {

            params.set(
                "search",
                search
            );
        }

        const res = await fetch(
            `/incidents?${params.toString()}`
        );

        const result =
            await res.json();

        console.log(
            "INCIDENTS RESPONSE:",
            result
        );

        if (!res.ok) {
            alert(
                result.error ||
                "Neizdevās ielādēt incidentus."
            );

            return;
        }

        window.incidentsData =
            result.items || [];

        window.incidentsCurrentPage =
            result.page;

        window.incidentsPerPage =
            result.per_page;

        const table =
            document.getElementById(
                "incidentTable"
            );

        if (!table) {
            return;
        }

        table.innerHTML = "";

        result.items.forEach(i => {
            table.innerHTML += `
                <tr>

                    <td>
                        ${i.id}
                    </td>


                    <td
                        class="description-link"
                        onclick="showIncidentDescription(${i.id})"
                        title="Skatīt aprakstu"
                    >
                        ${escapeHtml(
                            i.name
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            i.system_name || "-"
                        )}
                    </td>


                    <td>
						${escapeHtml(
							Array.isArray(i.risks) && i.risks.length
								? i.risks.map(r => r.name).join(", ")
								: "-"
						)}
					</td>


                    <td>
                        ${severityBadge(
                            i.severity
                        )}
                    </td>


                    <td>
                        ${statusBadge(
                            i.status
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            i.created_at
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            i.created_by || "-"
                        )}
                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="btn-edit"
                                onclick="editIncident(${i.id})"
                                title="Rediģēt"
                            >
                                ✏️
                            </button>


                            <button
                                class="btn-delete"
                                onclick="deleteIncident(${i.id})"
                                title="Dzēst"
                            >
                                🗑
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        });

        renderIncidentPagination(
            result.page,
            result.pages,
            result.total,
            result.per_page
        );

    } catch (error) {

        console.error(
            "LOAD INCIDENTS ERROR:",
            error
        );

        alert(
            "Neizdevās ielādēt incidentus."
        );
    }
}

function renderIncidentPagination(
    page,
    pages,
    total,
    perPage
) {
    const info =
        document.getElementById(
            "incidentPaginationInfo"
        );

    const pagination =
        document.getElementById(
            "incidentPagination"
        );

    if (!info || !pagination) {
        return;
    }

    if (total === 0) {
        info.textContent =
            "Rādīti 0–0 no 0";
    } else {
        const first =
            (page - 1) * perPage + 1;

        const last =
            Math.min(
                page * perPage,
                total
            );

        info.textContent =
            `Rādīti ${first}–${last} no ${total}`;
    }

    pagination.innerHTML = "";

    if (pages <= 1) {
        return;
    }

    const previous =
        document.createElement(
            "button"
        );

    previous.type = "button";
    previous.textContent = "‹";
    previous.disabled = page <= 1;
    previous.onclick = () => {

        if (page > 1) {

            window.incidentsCurrentPage =
                page - 1;

            loadIncidents();
        }
    };

    pagination.appendChild(
        previous
    );

    for (
        let i = 1;
        i <= pages;
        i++
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.type = "button";
        button.textContent = i;

        if (i === page) {

            button.classList.add(
                "active"
            );
        }

        button.onclick = () => {

            window.incidentsCurrentPage =
                i;

            loadIncidents();
        };

        pagination.appendChild(
            button
        );
    }

    const next =
        document.createElement(
            "button"
        );

    next.type = "button";
    next.textContent = "›";
    next.disabled = page >= pages;
    next.onclick = () => {

        if (page < pages) {

            window.incidentsCurrentPage =
                page + 1;

            loadIncidents();
        }
    };

    pagination.appendChild(
        next
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("lv-LV", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

async function deleteIncident(id) {
    if (!confirm("Dzēst incidentu?")) {
        return;
    }

    await fetch(`/incidents/${id}`, {
        method: "DELETE"
    });

    loadIncidents();
}


async function editIncident(id) {
    try {
        const res =
            await fetch(
                `/incidents/${id}`
            );

        const i =
            await res.json();

        if (!res.ok) {
            alert(
                i.error ||
                "Neizdevās ielādēt incidentu."
            );

            return;
        }

        editingId = id;

        document.getElementById(
            "name"
        ).value =
            i.name || "";

        document.getElementById(
            "description"
        ).value =
            i.description || "";

        document.getElementById(
            "system_id"
        ).value =
            i.system_id;

        document.getElementById(
            "severity"
        ).value =
            i.severity;

        document.getElementById(
            "status"
        ).value =
            i.status;

        selectedRiskIds =
            Array.isArray(i.risk_ids)
                ? i.risk_ids.map(
                    Number
                )
                : [];

        await loadIncidentRisks();

        document.getElementById(
            "submitBtn"
        ).innerText =
            "Saglabāt";

        document.getElementById(
            "cancelBtn"
        ).style.display =
            "inline-block";
    } catch (error) {
        console.error(
            "EDIT INCIDENT ERROR:",
            error
        );

        alert(
            "Neizdevās ielādēt incidentu."
        );
    }
}

function cancelEdit() {
    editingId = null;
    selectedRiskIds = [];

    document.getElementById(
        "incidentForm"
    ).reset();

    updateRiskSelectText();

    document
        .querySelectorAll(
            "#riskSelectOptions input[type='checkbox']"
        )
        .forEach(
            checkbox => {
                checkbox.checked = false;
            }
        );

    document.getElementById(
        "submitBtn"
    ).innerText =
        "Pievienot";

    document.getElementById(
        "cancelBtn"
    ).style.display =
        "none";
}

async function loadSystems() {
    const res = await fetch("/systems");
    const data = await res.json();
	const systems = data.items || data;

    const select = document.getElementById("system_id");

    select.innerHTML = `
        <option
            value=""
            disabled
            selected
            hidden
        >
            Sistēma
        </option>
    `;

    systems.forEach(s => {

        select.innerHTML += `
            <option value="${s.id}">
                ${s.name}
            </option>
        `;
    });
}

document.getElementById("incidentForm").onsubmit = async (e) => {
    e.preventDefault();

    const data = {
        name:
            document.getElementById("name").value,
        description:
            document.getElementById("description").value,
        system_id:
            parseInt(
                document.getElementById("system_id").value
            ),
        risk_ids:
            selectedRiskIds,
        severity:
            document.getElementById("severity").value,
        status:
            document.getElementById("status").value
    };

    try {
        let res;

        if (editingId) {
            res = await fetch(
                `/incidents/${editingId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );
        } else {
            res = await fetch(
                "/incidents",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            );
        }

        const result =
            await res.json();

        if (!res.ok) {
            console.error(
                "SAVE INCIDENT ERROR:",
                result
            );

            alert(
                result.error ||
                "Neizdevās saglabāt incidentu."
            );

            return;
        }

        cancelEdit();

        await loadIncidents();
    } catch (error) {
        console.error(
            "SAVE INCIDENT ERROR:",
            error
        );

        alert(
            "Neizdevās saglabāt incidentu."
        );
    }
};

function severityBadge(s) {
    return `
        <span class="badge severity-${s}">
            ${s}
        </span>
    `;
}


function statusBadge(s) {
    return `
        <span class="badge status-${s}">
            ${s}
        </span>
    `;
}


async function loadRisks() {
    const res = await fetch("/risks");
    const data = await res.json();

    const select = document.getElementById("risk_id");

    select.innerHTML = `
        <option value="">
            Risks (nav obligāts)
        </option>
    `;

    data.forEach(r => {
        select.innerHTML += `
            <option value="${r.risk_id}">
                ${r.name}
            </option>
        `;
    });
}

function showIncidentDescription(id) {
    const incident = window.incidentsData?.find(
        i => i.id === id
    );

    if (!incident) {
        return;
    }

    openDescriptionModal(
        incident.name,
        incident.description
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById(
                "incidentSearch"
            );

        const perPageSelect =
            document.getElementById(
                "incidentPerPage"
            );

        window.incidentsCurrentPage = 1;
        window.incidentsPerPage = 5;

        if (searchInput) {
            let searchTimeout = null;

            searchInput.addEventListener(
                "input",
                () => {
                    clearTimeout(
                        searchTimeout
                    );

                    searchTimeout =
                        setTimeout(
                            () => {
                                window.incidentsCurrentPage =
                                    1;

                                loadIncidents();
                            },
                            300
                        );
                }
            );
        }

        if (perPageSelect) {
            perPageSelect.addEventListener(
                "change",
                () => {
                    window.incidentsPerPage =
                        Number(
                            perPageSelect.value
                        );

                    window.incidentsCurrentPage =
                        1;

                    loadIncidents();
                }
            );
        }

        loadSystems();
		loadIncidentRisks();
        loadIncidents();
    }
);

document.addEventListener(
    "click",
    event => {
        const select =
            document.getElementById(
                "riskSelect"
            );

        if (!select) {
            return;
        }

        if (
            event.target.closest(
                "#riskSelectPlaceholder"
            )
        ) {
            select.classList.toggle(
                "open"
            );

            return;
        }

        if (
            !event.target.closest(
                "#riskSelect"
            )
        ) {
            select.classList.remove(
                "open"
            );
        }
    }
);