document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser()

    if (!currentUser) {
        return
    }

    if (!hasPermission("view_reports")) {
        window.location.href = "/no-access"
        return
    }

    const form =
        document.getElementById(
            "assessmentForm"
        )

    if (form) {
        form.addEventListener(
            "submit",
            handleAssessmentSubmit
        )
    }

    const searchInput =
        document.getElementById(
            "assessmentSearch"
        )

    const levelSelect =
        document.getElementById(
            "assessmentSecurityLevel"
        )

    const perPageSelect =
        document.getElementById(
            "assessmentPerPage"
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

                            window.assessmentCurrentPage =
                                1

                            loadAssessments()

                        },
                        300
                    )
            }
        )
    }

    if (levelSelect) {
        levelSelect.addEventListener(
            "change",
            () => {
                window.assessmentCurrentPage =
                    1

                loadAssessments()
            }
        )
    }

    if (perPageSelect) {
        perPageSelect.addEventListener(
            "change",
            () => {

                window.assessmentCurrentPage =
                    1

                loadAssessments()
            }
        )
    }

    window.assessmentCurrentPage = 1

    await loadAssessments()
})

async function handleAssessmentSubmit(e) {
    e.preventDefault()

    const isEditing =
        editingAssessmentId !== null

    if (isEditing) {
        if (!hasPermission("edit_reports")) {
            alert(
                "Nav nepieciešamo tiesību."
            )

            return
        }
    } else {
        if (!hasPermission("create_reports")) {
            alert(
                "Nav nepieciešamo tiesību."
            )

            return
        }
    }

    const data = {
        risk_management:
            document.getElementById(
                "risk_management"
            ).value,

        incident_management:
            document.getElementById(
                "incident_management"
            ).value,

        access_control:
            document.getElementById(
                "access_control"
            ).value,

        system_protection:
            document.getElementById(
                "system_protection"
            ).value,

        continuity:
            document.getElementById(
                "continuity"
            ).value
    }

    try {
        let res

        if (isEditing) {
            res = await fetch(
                `/security-assessments/${editingAssessmentId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            )
        } else {
            res = await fetch(
                "/security-assessments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(data)
                }
            )
        }

        const result =
            await res.json()

        if (!res.ok) {

            alert(
                result.error ||
                "Neizdevās saglabāt pašnovērtējumu."
            )

            return
        }

        if (isEditing) {

            alert(
                "Pašnovērtējums veiksmīgi atjaunināts."
            )

        } else {

            alert(
                `Pašnovērtējums saglabāts. ` +
                `Kopējais vērtējums: ${result.overall_score}`
            )
        }

        const form =
            document.getElementById(
                "assessmentForm"
            )

        if (form) {
            form.reset()
        }

        editingAssessmentId = null

        updateAssessmentFormState()

        window.assessmentCurrentPage = 1

        await loadAssessments()
    } catch (error) {
        console.error(
            "SAVE ASSESSMENT ERROR:",
            error
        )

        alert(
            "Neizdevās saglabāt pašnovērtējumu."
        )
    }
}

async function loadAssessments() {
    try {
        const searchInput =
            document.getElementById(
                "assessmentSearch"
            )

        const levelSelect =
            document.getElementById(
                "assessmentSecurityLevel"
            )

        const perPageSelect =
            document.getElementById(
                "assessmentPerPage"
            )

        const search =
            searchInput
                ? searchInput.value.trim()
                : ""

        const securityLevel =
            levelSelect
                ? levelSelect.value
                : ""

        const perPage =
            perPageSelect
                ? Number(perPageSelect.value)
                : 5

        const page =
            window.assessmentCurrentPage || 1

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

        if (securityLevel) {

            params.set(
                "security_level",
                securityLevel
            )
        }

        const res = await fetch(
            `/security-assessments?${params.toString()}`
        )

        const result =
            await res.json()

        if (!res.ok) {

            alert(
                result.error ||
                "Neizdevās ielādēt pašnovērtējumus."
            )

            return
        }

        window.assessmentCurrentPage =
            result.page

        const table =
            document.getElementById(
                "assessmentTable"
            )

        if (!table) {
            return
        }

        table.innerHTML = ""

        result.items.forEach(a => {
            let actions = ""

            actions += `
                <button
                    type="button"
                    onclick="viewAssessment(${a.id})"
                >
                    Skatīt
                </button>
            `

            actions += `
                <button
                    type="button"
                    onclick="selectAssessmentForComparison(${a.id})"
                >
                    Salīdzināt
                </button>
            `

            actions += `
                <button
                    type="button"
                    onclick="downloadAssessmentPdf(${a.id})"
                >
                    PDF
                </button>
            `

            if (
                hasPermission(
                    "edit_reports"
                )
            ) {
                actions += `
                    <button
                        type="button"
                        onclick="editAssessment(${a.id})"
                        title="Rediģēt"
                    >
                        ✏️
                    </button>
                `
            }

            if (
                hasPermission(
                    "delete_reports"
                )
            ) {
                actions += `
					<button
						type="button"
						class="delete-assessment-btn"
						onclick="deleteAssessment(${a.id})"
						title="Dzēst"
					>
						🗑
					</button>
				`
            }

            table.innerHTML += `
                <tr>

                    <td>
                        ${formatDate(
                            a.assessment_date
                        )}
                    </td>

                    <td>
                        ${a.overall_score}
                    </td>

                    <td>
                        <span
                            class="badge ${getSecurityLevelClass(
                                a.security_level
                            )}"
                        >
                            ${a.security_level}
                        </span>
                    </td>

                    <td>
                        ${a.systems_count}
                    </td>

                    <td>
                        ${a.risks_count}
                    </td>

                    <td>
                        ${a.active_risks_count}
                    </td>

                    <td>
                        ${a.incidents_count}
                    </td>

                    <td>
                        ${a.unresolved_incidents_count}
                    </td>

                    <td>
                        ${a.continuity_plans_count}
                    </td>

                    <td>
                        ${a.username || "-"}
                    </td>

                    <td>
                        <div class="assessment-actions">
                            ${actions}
                        </div>
                    </td>

                </tr>
            `
        })

        renderAssessmentPagination(
            result.page,
            result.pages,
            result.total,
            result.per_page
        )
    } catch (error) {
        console.error(
            "LOAD ASSESSMENTS ERROR:",
            error
        )

        alert(
            "Neizdevās ielādēt pašnovērtējumus."
        )
    }
}

function getSecurityLevelClass(level) {
    if (level === "Zems") {
        return "severity-low"
    }

    if (level === "Vidējs") {
        return "severity-medium"
    }

    if (level === "Labs") {
        return "severity-medium"
    }

    if (level === "Augsts") {
        return "severity-high"
    }

    return ""
}

function formatDate(value) {
    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString(
        "lv-LV",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    )
}

let selectedAssessmentId = null
let editingAssessmentId = null

function selectAssessmentForComparison(id) {
    if (!selectedAssessmentId) {
        selectedAssessmentId = id

        alert(
            "Pirmais pašnovērtējums izvēlēts. " +
            "Tagad izvēlieties otru pašnovērtējumu."
        )

        return
    }

    if (selectedAssessmentId === id) {
        alert(
            "Izvēlieties citu pašnovērtējumu."
        )

        return
    }

    compareAssessments(
        selectedAssessmentId,
        id
    )

    selectedAssessmentId = null
}

async function compareAssessments(
    firstId,
    secondId
) {

    try {
        const res = await fetch(
            "/security-assessments/all"
        )

        const data =
            await res.json()

        if (!res.ok) {
            alert(
                data.error ||
                "Neizdevās ielādēt pašnovērtējumus."
            )

            return
        }

        if (!Array.isArray(data)) {
            alert(
                "Neizdevās ielādēt pašnovērtējumus."
            )

            return
        }

        const first =
            data.find(
                a => a.id === firstId
            )

        const second =
            data.find(
                a => a.id === secondId
            )

        if (!first || !second) {
            alert(
                "Pašnovērtējums nav atrasts."
            )

            return
        }

        const rows = [
            [
                "Risku pārvaldība",
                first.risk_management,
                second.risk_management
            ],
            [
                "Incidentu pārvaldība",
                first.incident_management,
                second.incident_management
            ],
            [
                "Piekļuves kontrole",
                first.access_control,
                second.access_control
            ],
            [
                "Sistēmu aizsardzība",
                first.system_protection,
                second.system_protection
            ],
            [
                "Darbības nepārtrauktība",
                first.continuity,
                second.continuity
            ],
            [
                "Kopējais vērtējums",
                first.overall_score,
                second.overall_score
            ]
        ]

        let content = `
            <table class="history-table">

                <thead>

                    <tr>

                        <th>
                            Rādītājs
                        </th>

                        <th>
                            ${formatDate(
                                first.assessment_date
                            )}
                        </th>

                        <th>
                            ${formatDate(
                                second.assessment_date
                            )}
                        </th>

                        <th>
                            Izmaiņas
                        </th>

                    </tr>

                </thead>

                <tbody>
        `

        rows.forEach(row => {
            const difference =
                Number(row[2]) -
                Number(row[1])

            const differenceText =
                difference > 0
                    ? `+${difference.toFixed(2)}`
                    : difference.toFixed(2)

            content += `
                <tr>

                    <td>
                        ${row[0]}
                    </td>

                    <td>
                        ${row[1]}
                    </td>

                    <td>
                        ${row[2]}
                    </td>

                    <td>
                        ${differenceText}
                    </td>

                </tr>
            `
        })

        content += `
                </tbody>

            </table>
        `

        openHistoryModal(
            "Pašnovērtējumu salīdzinājums",
            content
        )

    } catch (error) {
        console.error(
            "COMPARE ASSESSMENTS ERROR:",
            error
        )
        alert(
            "Neizdevās salīdzināt pašnovērtējumus."
        )
    }
}

async function viewAssessment(id) {
    try {
        const res = await fetch(
            `/security-assessments/${id}`
        )

        const assessment = await res.json()

        if (!res.ok) {
            alert(
                assessment.error ||
                "Neizdevās ielādēt pašnovērtējumu."
            )
            return
        }

        const content = `
            <div class="assessment-report">

                <p>
                    <strong>Datums:</strong>
                    ${formatDate(assessment.assessment_date)}
                </p>

                <p>
                    <strong>Izveidoja:</strong>
                    ${assessment.username || "-"}
                </p>

                <hr>

                <h4>Pašnovērtējuma rezultāti</h4>

                <table class="history-table">

                    <thead>
                        <tr>
                            <th>Joma</th>
                            <th>Vērtējums</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr>
                            <td>Risku pārvaldība</td>
                            <td>${assessment.risk_management}</td>
                        </tr>

                        <tr>
                            <td>Incidentu pārvaldība</td>
                            <td>${assessment.incident_management}</td>
                        </tr>

                        <tr>
                            <td>Piekļuves kontrole</td>
                            <td>${assessment.access_control}</td>
                        </tr>

                        <tr>
                            <td>Sistēmu aizsardzība</td>
                            <td>${assessment.system_protection}</td>
                        </tr>

                        <tr>
                            <td>Darbības nepārtrauktība</td>
                            <td>${assessment.continuity}</td>
                        </tr>

                    </tbody>

                </table>

                <hr>

                <h4>Kopējais rezultāts</h4>

                <p>
                    <strong>Vērtējums:</strong>
                    ${assessment.overall_score}
                </p>

                <p>
                    <strong>Drošības līmenis:</strong>

                    <span class="badge ${getSecurityLevelClass(
                        assessment.security_level
                    )}">
                        ${assessment.security_level}
                    </span>
                </p>

                <hr>

                <h4>Sistēmas stāvokļa kopsavilkums</h4>

                <table class="history-table">

                    <tbody>

                        <tr>
                            <td>Sistēmas</td>
                            <td>${assessment.systems_count}</td>
                        </tr>

                        <tr>
                            <td>Riski</td>
                            <td>${assessment.risks_count}</td>
                        </tr>

                        <tr>
                            <td>Aktīvie riski</td>
                            <td>${assessment.active_risks_count}</td>
                        </tr>

                        <tr>
                            <td>Incidenti</td>
                            <td>${assessment.incidents_count}</td>
                        </tr>

                        <tr>
                            <td>Neatrisinātie incidenti</td>
                            <td>${assessment.unresolved_incidents_count}</td>
                        </tr>

                        <tr>
                            <td>Nepārtrauktības plāni</td>
                            <td>${assessment.continuity_plans_count}</td>
                        </tr>

                    </tbody>

                </table>

            </div>
        `

        openHistoryModal(
            "Pašnovērtējuma pārskats",
            content
        )

    } catch (error) {
        console.error(
            "VIEW ASSESSMENT ERROR:",
            error
        )

        alert(
            "Neizdevās ielādēt pašnovērtējumu."
        )
    }
}

function downloadAssessmentPdf(id) {
    if (!hasPermission("view_reports")) {
        alert("No permission")
        return
    }

    window.open(
        `/security-assessments/${id}/pdf`,
        "_blank"
    )
}

function renderAssessmentPagination(
    page,
    pages,
    total,
    perPage
) {
    const container =
        document.getElementById(
            "assessmentPagination"
        )

    const info =
        document.getElementById(
            "assessmentPaginationInfo"
        )

    if (!container) {
        return
    }

    container.innerHTML = ""

    if (total === 0) {
        if (info) {
            info.textContent =
                "Nav atrastu objektu."
        }

        return
    }

    const start =
        ((page - 1) * perPage) + 1

    const end =
        Math.min(
            page * perPage,
            total
        )

    if (info) {

        info.textContent =
            `Rādīti ${start}–${end} no ${total}`
    }

    const previousButton =
        document.createElement("button")

    previousButton.type = "button"

    previousButton.textContent = "‹"

    previousButton.disabled =
        page <= 1

    previousButton.onclick = () => {
        if (page > 1) {
            window.assessmentCurrentPage =
                page - 1

            loadAssessments()
        }
    }

    container.appendChild(
        previousButton
    )

    for (
        let i = 1;
        i <= pages;
        i++
    ) {
        const pageButton =
            document.createElement("button")

        pageButton.type = "button"

        pageButton.textContent = i

        if (i === page) {
            pageButton.classList.add(
                "active"
            )
        }

        pageButton.onclick = () => {
            window.assessmentCurrentPage =
                i

            loadAssessments()
        }

        container.appendChild(
            pageButton
        )
    }

    const nextButton =
        document.createElement("button")

    nextButton.type = "button"

    nextButton.textContent = "›"

    nextButton.disabled =
        page >= pages

    nextButton.onclick = () => {
        if (page < pages) {
            window.assessmentCurrentPage =
                page + 1

            loadAssessments()
        }
    }

    container.appendChild(
        nextButton
    )
}

async function editAssessment(id) {
    if (!hasPermission("edit_reports")) {
        alert(
            "Nav nepieciešamo tiesību."
        )

        return
    }


    try {
        const res = await fetch(
            `/security-assessments/${id}`
        )

        const assessment =
            await res.json()

        if (!res.ok) {
            alert(
                assessment.error ||
                "Neizdevās ielādēt pašnovērtējumu."
            )

            return
        }

        const form =
            document.getElementById(
                "assessmentForm"
            )

        if (!form) {
            alert(
                "Pašnovērtējuma forma nav atrasta."
            )

            return
        }

        document.getElementById(
            "risk_management"
        ).value =
            assessment.risk_management

        document.getElementById(
            "incident_management"
        ).value =
            assessment.incident_management

        document.getElementById(
            "access_control"
        ).value =
            assessment.access_control

        document.getElementById(
            "system_protection"
        ).value =
            assessment.system_protection

        document.getElementById(
            "continuity"
        ).value =
            assessment.continuity

        editingAssessmentId = id

        updateAssessmentFormState()

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        })

    } catch (error) {
        console.error(
            "EDIT ASSESSMENT ERROR:",
            error
        )

        alert(
            "Neizdevās ielādēt pašnovērtējumu rediģēšanai."
        )
    }
}

function cancelAssessmentEdit() {
    editingAssessmentId = null

    const form =
        document.getElementById(
            "assessmentForm"
        )

    if (form) {
        form.reset()
    }

    updateAssessmentFormState()
}

function updateAssessmentFormState() {
    const form =
        document.getElementById(
            "assessmentForm"
        )

    if (!form) {
        return
    }

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        )

    if (!submitButton) {
        return
    }

    let cancelButton =
        document.getElementById(
            "cancelAssessmentEdit"
        )

    if (!cancelButton) {
        cancelButton =
            document.createElement(
                "button"
            )

        cancelButton.type =
            "button"

        cancelButton.id =
            "cancelAssessmentEdit"

        cancelButton.textContent =
            "Atcelt"

        cancelButton.onclick =
            cancelAssessmentEdit

        submitButton.parentNode.appendChild(
            cancelButton
        )
    }

    if (
        editingAssessmentId !== null
    ) {
        submitButton.textContent =
            "Saglabāt izmaiņas"

        cancelButton.style.display =
            "inline-block"
    } else {
        submitButton.textContent =
            "Pievienot"

        cancelButton.style.display =
            "none"
    }
}

async function deleteAssessment(id) {
    if (!hasPermission("delete_reports")) {
        alert(
            "Nav nepieciešamo tiesību."
        )

        return
    }

    const confirmed =
        confirm(
            "Vai tiešām vēlaties dzēst šo pašnovērtējumu?"
        )

    if (!confirmed) {
        return
    }

    try {
        const res = await fetch(
            `/security-assessments/${id}`,
            {
                method: "DELETE"
            }
        )

        const result =
            await res.json()

        if (!res.ok) {
            alert(
                result.error ||
                "Neizdevās dzēst pašnovērtējumu."
            )

            return
        }

        alert(
			"Pašnovērtējums veiksmīgi dzēsts."
		)

		try {
			await loadAssessments()
			await loadAssessmentChart()
			await loadAssessmentAnalysis()
		} catch (error) {
			console.error(
				"FAILED TO REFRESH ASSESSMENT DATA:",
				error
			)
		}

    } catch (error) {
        console.error(
            "DELETE ASSESSMENT ERROR:",
            error
        )

        alert(
            "Neizdevās dzēst pašnovērtējumu."
        )
    }
}