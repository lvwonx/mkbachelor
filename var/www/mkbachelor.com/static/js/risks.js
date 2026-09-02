let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser();

    if (!currentUser) {
        return;
    }

    if (!hasPermission("view_event")) {
        window.location.href = "/no-access";
        return;
    }

    const form = document.getElementById("riskForm");

    if (form) {
        form.addEventListener("submit", handleRiskSubmit);
    }
	
	const searchInput =
		document.getElementById(
			"riskSearch"
		);

	const perPageSelect =
		document.getElementById(
			"riskPerPage"
		);

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
							window.risksCurrentPage =
								1;

							loadRisks();
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
				window.risksPerPage =
					Number(
						perPageSelect.value
					);

				window.risksCurrentPage =
					1;

				loadRisks();
			}
		);
	}

    await loadSystems();
    await loadRisks();
});

function getClass(level) {
    if (level <= 5) return "low";
    if (level <= 12) return "medium";
    return "high";
}

function statusBadge(status) {
    const labels = {
        active: "Aktīvs",
        mitigated: "Samazināts",
        closed: "Slēgts"
    };

    return `
        <span class="badge status-${status}">
            ${labels[status] || status}
        </span>
    `;
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function handleRiskSubmit(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        probability: parseInt(
            document.getElementById("probability").value
        ),
        impact: parseInt(
            document.getElementById("impact").value
        ),
        system_id: parseInt(
            document.getElementById("system_id").value
        ),
        status: document.getElementById("status").value
    };

    if (!data.name) {
        alert("Ievadiet riska nosaukumu.");
        return;
    }

    if (
        !Number.isInteger(data.probability) ||
        data.probability < 1 ||
        data.probability > 5
    ) {
        alert("Varbūtībai jābūt no 1 līdz 5.");
        return;
    }

    if (
        !Number.isInteger(data.impact) ||
        data.impact < 1 ||
        data.impact > 5
    ) {
        alert("Ietekmei jābūt no 1 līdz 5.");
        return;
    }

    if (!Number.isInteger(data.system_id)) {
        alert("Izvēlieties informācijas sistēmu.");
        return;
    }

    if (!data.status) {
        alert("Izvēlieties statusu.");
        return;
    }

    let res;

    if (editingId !== null) {
        if (!hasPermission("edit_event")) {
            alert("No permission");
            return;
        }

        res = await fetch(`/risks/${editingId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    } else {
        if (!hasPermission("create_event")) {
            alert("No permission");
            return;
        }

        res = await fetch("/add-risk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    }

    const result = await res.json();

    if (!res.ok) {
        alert(result.error || "Kļūda.");
        return;
    }

    if (editingId !== null) {
        alert("Risks atjaunināts.");
    } else {
        alert(`Risks pievienots. Līmenis: ${result.risk_level}`);
    }

    cancelEdit();

    await loadRisks();
}

async function loadRisks() {
    try {
        const page =
            window.risksCurrentPage || 1;

        const perPage =
            window.risksPerPage || 5;

        const searchInput =
            document.getElementById(
                "riskSearch"
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
            `/risks?${params.toString()}`
        );

        const result =
            await res.json();

        console.log(
            "RISKS RESPONSE:",
            result
        );

        if (!res.ok) {

            alert(
                result.error ||
                "Neizdevās ielādēt riskus."
            );

            return;
        }

        window.risksData =
            result.items || [];

        window.risksCurrentPage =
            result.page;

        window.risksPerPage =
            result.per_page;

        const table =
            document.getElementById(
                "riskTable"
            );

        if (!table) {
            return;
        }

        table.innerHTML = "";

        result.items.forEach(r => {
            let actions = "";

            if (
                hasPermission(
                    "edit_event"
                )
            ) {
                actions += `
                    <button
                        class="btn-edit"
                        onclick="editRisk(${r.risk_id})"
                        title="Rediģēt"
                    >
                        ✏️
                    </button>
                `;
            }

            if (
                hasPermission(
                    "delete_event"
                )
            ) {
                actions += `
                    <button
                        class="btn-delete"
                        onclick="deleteRisk(${r.risk_id})"
                        title="Dzēst"
                    >
                        🗑
                    </button>
                `;
            }

            table.innerHTML += `
                <tr>

                    <td>
                        ${r.risk_id}
                    </td>


                    <td
                        class="description-link"
                        onclick="showRiskDescription(${r.risk_id})"
                        title="Skatīt aprakstu"
                    >
                        ${escapeHtml(
                            r.name
                        )}
                    </td>


					<td>${escapeHtml(r.system_name || "—")}</td>
					

                    <td>
                        ${r.probability}
                    </td>


                    <td>
                        ${r.impact}
                    </td>


                    <td
                        class="${getClass(
                            r.risk_level
                        )}"
                    >
                        ${r.risk_level}
                    </td>


                    <td>
                        ${statusBadge(
                            r.status
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            r.created_by || "-"
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            r.created_at
                        )}
                    </td>


                    <td>

                        <div class="actions">
                            ${actions}
                        </div>

                    </td>

                </tr>
            `;
        });

        renderRiskPagination(
            result.page,
            result.pages,
            result.total,
            result.per_page
        );

    } catch (error) {
        console.error(
            "LOAD RISKS ERROR:",
            error
        );

        alert(
            "Neizdevās ielādēt riskus."
        );
    }
}

function renderRiskPagination(
    page,
    pages,
    total,
    perPage
) {
    const info =
        document.getElementById(
            "riskPaginationInfo"
        );

    const pagination =
        document.getElementById(
            "riskPagination"
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
    previous.disabled =
        page <= 1;
    previous.onclick = () => {
        if (page > 1) {
            window.risksCurrentPage =
                page - 1;

            loadRisks();
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
            window.risksCurrentPage =
                i;

            loadRisks();
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
    next.disabled =
        page >= pages;
    next.onclick = () => {
        if (page < pages) {
            window.risksCurrentPage =
                page + 1;

            loadRisks();
        }
    };

    pagination.appendChild(
        next
    );
}

async function loadSystems() {
    try {
        const res = await fetch("/systems");
        const data = await res.json();
		const systems = data.items || data;

        if (!res.ok) {
            alert(data.error || "Neizdevās ielādēt sistēmas.");
            return;
        }

        const select = document.getElementById("system_id");

        if (!select) {
            return;
        }

        select.innerHTML = `
            <option value="" disabled selected hidden>
                Sistēma
            </option>
        `;

        systems.forEach(s => {
            select.innerHTML += `
                <option value="${s.id}">
                    ${escapeHtml(s.name)}
                </option>
            `;
        });
    } catch (error) {
        console.error("LOAD SYSTEMS ERROR:", error);
    }
}

async function editRisk(id) {
    if (!hasPermission("edit_event")) {
        alert("No permission");
        return;
    }

    const res = await fetch(`/risks/${id}`);

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "Neizdevās ielādēt risku.");
        return;
    }

    editingId = id;

    document.getElementById("name").value =
        data.name || "";

    document.getElementById("description").value =
        data.description || "";

    document.getElementById("probability").value =
        data.probability;

    document.getElementById("impact").value =
        data.impact;

    document.getElementById("system_id").value =
        data.system_id;

    document.getElementById("status").value =
        data.status;

    document.getElementById("submitBtn").innerText =
        "Saglabāt";

    document.getElementById("cancelBtn").style.display =
        "inline-block";

    document.getElementById("riskForm")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}

function cancelEdit() {
    editingId = null;

    const form = document.getElementById("riskForm");

    if (form) {
        form.reset();
    }

    document.getElementById("submitBtn").innerText =
        "Pievienot";

    document.getElementById("cancelBtn").style.display =
        "none";
}


async function deleteRisk(id) {
    if (!hasPermission("delete_event")) {
        alert("No permission");
        return;
    }

    if (!confirm("Dzēst risku?")) {
        return;
    }

    const res = await fetch(`/risks/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "Neizdevās dzēst risku.");
        return;
    }

    if (editingId === id) {
        cancelEdit();
    }

    await loadRisks();
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


function showRiskDescription(id) {
    const risk = window.risksData?.find(
        r => r.risk_id === id
    );

    if (!risk) {
        return;
    }

    openDescriptionModal(
        risk.name,
        risk.description
    );
}