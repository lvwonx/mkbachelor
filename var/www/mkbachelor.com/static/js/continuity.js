let editingId = null;
window.continuityCurrentPage = 1;
window.continuityPerPage = 5;

document.addEventListener("DOMContentLoaded", async () => {

    await loadCurrentUser();

    if (!currentUser) {
        return;
    }

    if (!hasPermission("view_system")) {
        window.location.href = "/no-access";
        return;
    }
	
	const searchInput =
	document.getElementById(
		"continuitySearch"
	);

    const perPageSelect =
        document.getElementById(
            "continuityPerPage"
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

                            window.continuityCurrentPage =
                                1;

                            loadPlans();

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

                window.continuityPerPage =
                    Number(
                        perPageSelect.value
                    );


                window.continuityCurrentPage =
                    1;


                loadPlans();
            }
        );
    }

    const form = document.getElementById("continuityForm");

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }

    await loadSystems();
    await loadPlans();
});

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


async function loadSystems() {
    try {

        const res =
            await fetch("/systems");

        const data =
            await res.json();

        if (!res.ok) {

            console.error(
                "Failed to load systems:",
                data
            );

            return;
        }

        const systems =
            data.items || data;

        const select =
            document.getElementById(
                "system_id"
            );

        if (!select) {
            return;
        }

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
                    ${escapeHtml(s.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "LOAD SYSTEMS ERROR:",
            error
        );

    }
}

async function loadPlans() {
    try {
        const page =
            window.continuityCurrentPage || 1;

        const perPage =
            window.continuityPerPage || 5;

        const searchInput =
            document.getElementById(
                "continuitySearch"
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
            `/continuity?${params.toString()}`
        );

        const result =
            await res.json();

        console.log(
            "CONTINUITY RESPONSE:",
            result
        );

        if (!res.ok) {

            alert(
                result.error ||
                "Neizdevās ielādēt plānus."
            );

            return;
        }

        window.continuityData =
            result.items || [];

        window.continuityCurrentPage =
            result.page;

        window.continuityPerPage =
            result.per_page;

        const table =
            document.getElementById(
                "continuityTable"
            );

        if (!table) {
            return;
        }

        table.innerHTML = "";

        result.items.forEach(plan => {
            let actions = "";

            if (
                hasPermission(
                    "edit_system"
                )
            ) {
                actions += `
                    <button
                        class="btn-edit"
                        onclick="editPlan(${plan.id})"
                        title="Rediģēt"
                    >
                        ✏️
                    </button>
                `;
            }

            if (
                hasPermission(
                    "delete_system"
                )
            ) {
                actions += `
                    <button
                        class="btn-delete"
                        onclick="deletePlan(${plan.id})"
                        title="Dzēst"
                    >
                        🗑
                    </button>
                `;
            }

            table.innerHTML += `
                <tr>

                    <td>
                        ${plan.id}
                    </td>


                    <td
                        class="description-link"
                        onclick="showPlanDescription(${plan.id})"
                        title="Skatīt aprakstu"
                    >
                        ${escapeHtml(
                            plan.name
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            plan.system_name || "-"
                        )}
                    </td>


                    <td>
                        ${plan.rto ?? "-"} h
                    </td>


                    <td>
                        ${plan.rpo ?? "-"} h
                    </td>


                    <td>
                        ${plan.mtd ?? "-"} h
                    </td>


                    <td>
                        ${escapeHtml(
                            plan.created_by || "-"
                        )}
                    </td>


                    <td>
                        ${formatDate(
                            plan.created_at
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

        renderContinuityPagination(
            result.page,
            result.pages,
            result.total,
            result.per_page
        );

    } catch (error) {
        console.error(
            "LOAD CONTINUITY ERROR:",
            error
        );

        alert(
            "Neizdevās ielādēt plānus."
        );
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById("name").value.trim(),
        description:
            document.getElementById("description").value.trim(),
        system_id:
            parseInt(document.getElementById("system_id").value),
        rto:
            parseInt(document.getElementById("rto").value),
        rpo:
            parseInt(document.getElementById("rpo").value),
        mtd:
            parseInt(document.getElementById("mtd").value)
    };

    if (!data.name) {
        alert("Ievadiet plāna nosaukumu.");
        return;
    }

    if (!Number.isInteger(data.system_id)) {
        alert("Izvēlieties sistēmu.");
        return;
    }

    if (!Number.isInteger(data.rto) || data.rto < 0) {
        alert("RTO jābūt 0 vai lielākam.");
        return;
    }

    if (!Number.isInteger(data.rpo) || data.rpo < 0) {
        alert("RPO jābūt 0 vai lielākam.");
        return;
    }

    if (!Number.isInteger(data.mtd) || data.mtd < 0) {
        alert("MTD jābūt 0 vai lielākam.");
        return;
    }

    let res;

    if (editingId !== null) {
        if (!hasPermission("edit_system")) {
            alert("No permission");
            return;
        }

        res = await fetch(`/continuity/${editingId}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });
    } else {
        if (!hasPermission("create_system")) {
            alert("No permission");
            return;
        }

        res = await fetch("/continuity", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });
    }

    const result = await res.json();

    if (!res.ok) {

        alert(
            result.error ||
            "Neizdevās saglabāt plānu."
        );

        return;

    }

    cancelEdit();

    await loadPlans();
}

async function editPlan(id) {
    if (!hasPermission("edit_system")) {
        alert("No permission");
        return;
    }

    const res = await fetch(`/continuity/${id}`);

    const data = await res.json();

    if (!res.ok) {
        alert(
            data.error ||
            "Neizdevās ielādēt plānu."
        );

        return;
    }

    editingId = id;

    document.getElementById("name").value =
        data.name || "";

    document.getElementById("description").value =
        data.description || "";

    document.getElementById("system_id").value =
        data.system_id;

    document.getElementById("rto").value =
        data.rto ?? "";

    document.getElementById("rpo").value =
        data.rpo ?? "";

    document.getElementById("mtd").value =
        data.mtd ?? "";

    document.getElementById("submitBtn").innerText =
        "Saglabāt";

    document.getElementById("cancelBtn").style.display =
        "inline-block";

    document.getElementById("continuityForm")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}


function cancelEdit() {
    editingId = null;
    const form =
        document.getElementById("continuityForm");

    if (form) {
        form.reset();
    }

    document.getElementById("submitBtn").innerText =
        "Pievienot";

    document.getElementById("cancelBtn").style.display =
        "none";
}


async function deletePlan(id) {
    if (!hasPermission("delete_system")) {
        alert("No permission");
        return;
    }

    if (!confirm("Dzēst plānu?")) {
        return;
    }

    const res = await fetch(`/continuity/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {

        alert(
            data.error ||
            "Neizdevās dzēst plānu."
        );

        return;
    }

    if (editingId === id) {
        cancelEdit();
    }

    await loadPlans();
}

function showPlanDescription(id) {
    const plan =
        window.continuityData?.find(
            p => p.id === id
        );

    if (!plan) {
        return;
    }

    openDescriptionModal(
        plan.name,
        plan.description
    );
}

function renderContinuityPagination(
    page,
    pages,
    total,
    perPage
) {
    const info =
        document.getElementById(
            "continuityPaginationInfo"
        );

    const pagination =
        document.getElementById(
            "continuityPagination"
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

            window.continuityCurrentPage =
                page - 1;

            loadPlans();
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
            window.continuityCurrentPage =
                i;

            loadPlans();
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
            window.continuityCurrentPage =
                page + 1;

            loadPlans();
        }
    };

    pagination.appendChild(
        next
    );
}