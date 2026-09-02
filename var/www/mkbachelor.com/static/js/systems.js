let editingSystemId = null
window.systemsData = []
window.systemsCurrentPage = 1
window.systemsPerPage = 5

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return ""
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

async function loadUsers() {
    const res = await fetch("/api/users/list")
    const users = await res.json()

    const select = document.getElementById("owner")

    select.innerHTML = `<option value="">-- Izvēlēties atbildīgo personu --</option>`

    users.forEach(u => {
        select.innerHTML += `
            <option value="${u.id}">
                ${u.username}
            </option>
        `
    })
}

async function loadSystems() {
    try {
        const page =
            window.systemsCurrentPage || 1

        const perPage =
            window.systemsPerPage || 5

        const searchInput =
            document.getElementById(
                "systemSearch"
            )

        const search =
            searchInput
                ? searchInput.value.trim()
                : ""

        const params =
            new URLSearchParams()

        params.set(
            "page",
            page
        )

        params.set(
            "per_page",
            perPage
        )

        if (search) {
            params.set(
                "search",
                search
            )
        }

        const res = await fetch(
            `/systems?${params.toString()}`
        )

        const result =
            await res.json()

        console.log(
            "SYSTEMS RESPONSE:",
            result
        )

        if (!res.ok) {
            alert(
                result.error ||
                "Neizdevās ielādēt sistēmas."
            )

            return
        }

        window.systemsData =
            result.items || []

        window.systemsCurrentPage =
            result.page

        window.systemsPerPage =
            result.per_page

        const table =
            document.getElementById(
                "systemsTable"
            )

        if (!table) {
            return
        }

        table.innerHTML = ""

        result.items.forEach(s => {
            table.innerHTML += `

                <tr>

                    <td>
                        ${s.id}
                    </td>


                    <td
                        class="description-link"
                        onclick="showSystemDescription(${s.id})"
                        title="Skatīt aprakstu"
                    >
                        ${escapeHtml(
                            s.name || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            s.owner || "-"
                        )}
                    </td>


                    <td>
                        ${s.cia_confidentiality ?? "-"}
                    </td>


                    <td>
                        ${s.cia_integrity ?? "-"}
                    </td>


                    <td>
                        ${s.cia_availability ?? "-"}
                    </td>


                    <td>
                        ${s.classification ?? "-"}
                    </td>


                    <td>

                        <span
                            class="badge ${getSecurityLevelClass(
                                s.security_level
                            )}"
                        >
                            ${escapeHtml(
                                s.security_level || "-"
                            )}
                        </span>

                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="btn-history"
                                onclick="showSystemHistory(${s.id})"
                                title="Klasifikācijas vēsture"
                            >
                                📋
                            </button>


                            ${
                                hasPermission(
                                    "edit_system"
                                )
                                    ? `
                                        <button
                                            class="btn-edit"
                                            onclick="editSystem(${s.id})"
                                            title="Rediģēt"
                                        >
                                            ✏️
                                        </button>
                                    `
                                    : ""
                            }


                            ${
                                hasPermission(
                                    "delete_system"
                                )
                                    ? `
                                        <button
                                            class="btn-delete"
                                            onclick="deleteSystem(${s.id})"
                                            title="Dzēst"
                                        >
                                            🗑
                                        </button>
                                    `
                                    : ""
                            }

                        </div>

                    </td>

                </tr>

            `
        })

        renderSystemPagination(
            result.page,
            result.pages,
            result.total,
            result.per_page
        )

    } catch (error) {
        console.error(
            "LOAD SYSTEMS ERROR:",
            error
        )

        alert(
            "Neizdevās ielādēt sistēmas."
        )
    }
}

function renderSystemPagination(
    page,
    pages,
    total,
    perPage
) {
    const info =
        document.getElementById(
            "systemPaginationInfo"
        );

    const pagination =
        document.getElementById(
            "systemPagination"
        );

    if (!info || !pagination) {
        return;
    }

    pagination.innerHTML = "";

    if (total === 0) {
        info.textContent =
            "Rādīti 0–0 no 0";

        return;
    }

    const start =
        (page - 1) * perPage + 1;

    const end =
        Math.min(
            page * perPage,
            total
        );

    info.textContent =
        `Rādīti ${start}–${end} no ${total}`;

    if (pages <= 1) {
        return;
    }

    const prev =
        document.createElement("button");

    prev.textContent = "‹";

    prev.disabled =
        page <= 1;

    prev.onclick = () => {

        if (page > 1) {

            window.systemsCurrentPage =
                page - 1;

            loadSystems();
        }
    };

    pagination.appendChild(prev);

    for (
        let i = 1;
        i <= pages;
        i++
    ) {
        const button =
            document.createElement("button");

        button.textContent = i;

        if (i === page) {

            button.classList.add(
                "active"
            );
        }

        button.onclick = () => {

            window.systemsCurrentPage =
                i;

            loadSystems();
        };

        pagination.appendChild(button);
    }

    const next =
        document.createElement("button");

    next.textContent = "›";

    next.disabled =
        page >= pages;

    next.onclick = () => {
        if (page < pages) {
            window.systemsCurrentPage =
                page + 1;

            loadSystems();
        }
    };

    pagination.appendChild(next);
}

function getSecurityLevelClass(level) {
    if (level === "Zems") {
        return "severity-low"
    }

    if (level === "Vidējs") {
        return "severity-medium"
    }

    if (level === "Augsts") {
        return "severity-high"
    }

    return ""
}

function showSystemDescription(id) {
    const system = window.systemsData?.find(
        s => s.id === id
    )

    if (!system) {
        return
    }

    openDescriptionModal(
        system.name,
        system.description
    )
}

async function showSystemHistory(id) {
    const system = window.systemsData?.find(
        s => s.id === id
    )

    if (!system) {
        return
    }

    const res = await fetch(`/systems/${id}/history`)
    const data = await res.json()

    if (!res.ok) {
        alert(data.error || "Neizdevās ielādēt klasifikācijas vēsturi.")
        return
    }

    let history = ""

    if (data.length === 0) {
        history = `
            <p class="history-empty">
                Klasifikācijas vēsture nav pieejama.
            </p>
        `
    } else {
        history = `
            <div class="history-table-wrapper">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Datums</th>
                            <th>Konfidencialitāte</th>
                            <th>Integritāte</th>
                            <th>Pieejamība</th>
                            <th>Klasifikācija</th>
                            <th>Drošības prasības</th>
                            <th>Lietotājs</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.map(h => `
                            <tr>
                                <td>${formatDate(h.changed_at)}</td>
                                <td>${h.cia_confidentiality}</td>
                                <td>${h.cia_integrity}</td>
                                <td>${h.cia_availability}</td>
                                <td>${h.classification}</td>
                                <td>
                                    <span class="badge ${getSecurityLevelClass(h.security_level)}">
                                        ${h.security_level || "-"}
                                    </span>
                                </td>
                                <td>${h.changed_by || "-"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `
    }

    openHistoryModal(
        system.name,
        history
    )
}

function formatDate(value) {
    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString("lv-LV", {
        dateStyle: "short",
        timeStyle: "short"
    })
}

function cancelEdit() {
    editingSystemId = null

    document.getElementById("formTitle").textContent =
        "Pievienot sistēmu"

    document.getElementById("systemForm").reset()

    document.getElementById("submitBtn").textContent =
        "Pievienot"

    document.getElementById("cancelBtn").style.display =
        "none"
}

function editSystem(id) {
    if (!window.systemsData) {
        console.error("systemsData not loaded")
        return
    }

    const system = window.systemsData.find(
        s => s.id === id
    )

    if (!system) {
        console.error("System not found", id)
        return
    }

    editingSystemId = id

    document.getElementById("formTitle").textContent =
        "Rediģēt sistēmu"

    document.getElementById("name").value =
        system.name

    document.getElementById("description").value =
        system.description || ""

    setTimeout(() => {
        document.getElementById("owner").value =
            String(system.owner_id || "")
    }, 0)

    document.getElementById("cia_confidentiality").value =
        system.cia_confidentiality

    document.getElementById("cia_integrity").value =
        system.cia_integrity

    document.getElementById("cia_availability").value =
        system.cia_availability

    document.getElementById("submitBtn").textContent =
        "Saglabāt"

    document.getElementById("cancelBtn").style.display =
        "inline-block"
}

async function deleteSystem(id) {
    if (!hasPermission("delete_system")) {
        alert("No permission")
        return
    }

    if (!confirm("Dzēst sistēmu?")) {
        return
    }

    const res = await fetch(`/systems/${id}`, {
        method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok) {
        alert(data.error || "Kļūda")
        return
    }

    loadSystems()
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser()

    if (!currentUser) {
        return
    }

    if (!hasPermission("view_system")) {
        window.location.href = "/no-access"
        return
    }

    await loadUsers()

    const form = document.getElementById("systemForm")

    if (form) {

        form.onsubmit = async (e) => {
            e.preventDefault()

            if (
                !hasPermission("create_system") &&
                !hasPermission("edit_system")
            ) {
                alert("No permission")
                return
            }

            const payload = {
                name:
                    document.getElementById("name").value,

                description:
                    document.getElementById("description").value,

                owner_id:
                    document.getElementById("owner").value || null,

                cia_confidentiality:
                    Number(
                        document.getElementById(
                            "cia_confidentiality"
                        ).value
                    ) || 0,

                cia_integrity:
                    Number(
                        document.getElementById(
                            "cia_integrity"
                        ).value
                    ) || 0,

                cia_availability:
                    Number(
                        document.getElementById(
                            "cia_availability"
                        ).value
                    ) || 0
            }

            let res

            if (editingSystemId) {

                res = await fetch(
                    `/systems/${editingSystemId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                )
            } else {

                res = await fetch(
                    "/systems",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                )
            }

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || "Kļūda")
                return
            }

            editingSystemId = null

            form.reset()

            document.getElementById("formTitle").textContent =
                "Pievienot sistēmu"

            document.getElementById("submitBtn").textContent =
                "Pievienot"

            document.getElementById("cancelBtn").style.display =
                "none"

            loadSystems()
        }
    }

	const searchInput =
    document.getElementById(
        "systemSearch"
    )

	const perPageSelect =
		document.getElementById(
			"systemPerPage"
		)

	if (searchInput) {

		let searchTimeout = null

		searchInput.addEventListener(
			"input",
			() => {
				clearTimeout(
					searchTimeout
				)

				searchTimeout =
					setTimeout(
						() => {
							window.systemsCurrentPage =
								1

							loadSystems()
						},
						300
					)
			}
		)
	}

	if (perPageSelect) {
		perPageSelect.addEventListener(
			"change",
			() => {
				window.systemsPerPage =
					Number(
						perPageSelect.value
					)

				window.systemsCurrentPage =
					1

				loadSystems()
			}
		)
	}

    loadSystems()
})