document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadReportSummary();
        loadRiskDynamics();
        loadAssessmentDynamics();
		loadAssessmentFocus();

    }
);

document.getElementById("generateReportButton").addEventListener(
	"click",
	generateReport
);

document.getElementById("exportReportPdf").addEventListener(
	"click",
	() => exportReport("pdf")
);

document.getElementById("exportReportExcel").addEventListener(
	"click",
	() => exportReport("excel")
);

async function loadReportSummary() {
    try {
        const res =
            await fetch(
                "/reports/summary"
            );

        const data =
            await res.json();

        if (!res.ok) {
            console.error(
                "REPORT SUMMARY ERROR:",
                data
            );
            return;
        }

        document.getElementById(
            "reportSystemsCount"
        ).textContent =
            data.systems.total;

        document.getElementById(
            "reportRisksCount"
        ).textContent =
            data.risks.total;

        document.getElementById(
            "reportRisksActive"
        ).textContent =
            `Aktīvi: ${data.risks.active}`;

        document.getElementById(
            "reportIncidentsCount"
        ).textContent =
            data.incidents.total;

        document.getElementById(
            "reportIncidentsUnresolved"
        ).textContent =
            `Neatrisināti: ${data.incidents.unresolved}`;

        document.getElementById(
            "reportContinuityCount"
        ).textContent =
            data.continuity_plans.total;

        if (data.latest_assessment) {
            document.getElementById(
                "reportAssessmentScore"
            ).textContent =
                data.latest_assessment.overall_score;

            document.getElementById(
                "reportAssessmentLevel"
            ).textContent =
                data.latest_assessment.security_level;
        } else {
            document.getElementById(
                "reportAssessmentScore"
            ).textContent =
                "Nav datu";

            document.getElementById(
                "reportAssessmentLevel"
            ).textContent =
                "Pašnovērtējums nav veikts";
        }

		loadReportCharts(data);
    } catch (error) {
        console.error(
            "LOAD REPORT SUMMARY ERROR:",
            error
        );
    }
}

let reportRisksChart = null;
let reportIncidentsChart = null;
let reportRiskDynamicsChart = null;
let reportAssessmentDynamicsChart = null;
let generatedReportType = null;

function loadReportCharts(data) {
    const risksCanvas =
        document.getElementById(
            "reportRisksChart"
        );

    const incidentsCanvas =
        document.getElementById(
            "reportIncidentsChart"
        );

    if (!risksCanvas || !incidentsCanvas) {
        return;
    }

    if (reportRisksChart) {
        reportRisksChart.destroy();

    }

    if (reportIncidentsChart) {
        reportIncidentsChart.destroy();

    }

    reportRisksChart =
        new Chart(
            risksCanvas,
            {
                type: "bar",
                data: {
                    labels: [
                        "Zems",
                        "Vidējs",
                        "Augsts"
                    ],
                    datasets: [{
                        label: "Riski",
                        data: [
                            data.risks.low,
                            data.risks.medium,
                            data.risks.high
                        ],
                        backgroundColor: [
                            "#22c55e",
                            "#f59e0b",
                            "#ef4444"
                        ],
                        borderWidth: 0,
                        borderRadius: 6,
                        barPercentage: 0.55,
                        categoryPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            }
        );

    reportIncidentsChart =
        new Chart(
            incidentsCanvas,
            {
                type: "bar",
                data: {
                    labels: [
                        "Low",
                        "Medium",
                        "High"
                    ],
                    datasets: [{
                        label: "Incidenti",
                        data: [
                            data.incidents.low,
                            data.incidents.medium,
                            data.incidents.high
                        ],
                        backgroundColor: [
                            "#22c55e",
                            "#f59e0b",
                            "#ef4444"
                        ],
                        borderWidth: 0,
                        borderRadius: 6,
                        barPercentage: 0.55,
                        categoryPercentage: 0.7
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            }
        );
}

async function loadRiskDynamics() {
    try {
        const res =
            await fetch(
                "/reports/risk-dynamics"
            );

        const data =
            await res.json();

        if (!res.ok) {
            console.error(
                "RISK DYNAMICS ERROR:",
                data
            );

            return;
        }

        const canvas =
            document.getElementById(
                "reportRiskDynamicsChart"
            );

        if (!canvas) {
            return;
        }

        if (reportRiskDynamicsChart) {
            reportRiskDynamicsChart.destroy();

        }

        reportRiskDynamicsChart =
            new Chart(
                canvas,
                {
                    type: "line",
                    data: {
                        labels:
							data.items.map(
								item => {
									const [year, month, day] =
										item.date.split("-");

									return `${day}.${month}`;
								}
							),
                        datasets: [{
                            label: "Riski",
                            data:
                                data.items.map(
                                    item => item.count
                                ),
                            tension: 0.3,
                            fill: false,
                            borderWidth: 2,
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                }
            );
    } catch (error) {
        console.error(
            "LOAD RISK DYNAMICS ERROR:",
            error
        );
    }
}

async function loadAssessmentDynamics() {
    try {
        const res =
            await fetch(
                "/reports/assessment-dynamics"
            );

        const data =
            await res.json();

        if (!res.ok) {
            console.error(
                "ASSESSMENT DYNAMICS ERROR:",
                data
            );

            return;
        }

        const canvas =
            document.getElementById(
                "reportAssessmentDynamicsChart"
            );

        if (!canvas) {
            return;
        }

        if (reportAssessmentDynamicsChart) {
            reportAssessmentDynamicsChart.destroy();
        }

        reportAssessmentDynamicsChart =
            new Chart(
                canvas,
                {
                    type: "line",
                    data: {
                        labels:
                            data.items.map(
                                (_, index) =>
                                    `#${index + 1}`
                            ),
                        datasets: [{
                            label:
                                "Pašnovērtējuma rezultāts",
                            data:
                                data.items.map(
                                    item => item.score
                                ),
                            tension: 0.3,
                            fill: false,
                            borderWidth: 2,
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label:
                                        function(context) {
                                            const item =
                                                data.items[
                                                    context.dataIndex
                                                ];

                                            return [
                                                `Rezultāts: ${item.score}`,
                                                `Līmenis: ${item.security_level}`,
                                                `Datums: ${item.date}`
                                            ];
                                        }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: "Pašnovērtējums"
                                },
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,

                                suggestedMax: 5,

                                ticks: {
                                    precision: 1
                                },
                                title: {
                                    display: true,
                                    text: "Rezultāts"
                                }
                            }
                        }
                    }
                }
            );
    } catch (error) {
        console.error(
            "LOAD ASSESSMENT DYNAMICS ERROR:",
            error
        );
    }
}

async function loadAssessmentFocus() {
    const container =
        document.getElementById("assessmentFocus")

    if (!container) {
        return
    }

    try {
        const res =
            await fetch("/reports/assessment-focus")

        const data =
            await res.json()

        if (!res.ok) {

            container.innerHTML =
                "Neizdevās ielādēt datus."

            return
        }

        if (
            !data.items ||
            data.items.length === 0
        ) {
            container.innerHTML =
                "Nav pieejamu pašnovērtējuma datu."

            return
        }

        let html = ""

        data.items.forEach(item => {
            html += `
                <div class="assessment-focus-row">

                    <div>
                        <strong>
                            ${item.name}
                        </strong>

                        <span>
                            ${item.status}
                        </span>
                    </div>

                    <strong>
                        ${item.score}/5
                    </strong>

                </div>
            `
        })

        container.innerHTML = html
    } catch (error) {
        console.error(
            "LOAD ASSESSMENT FOCUS ERROR:",
            error
        )

        container.innerHTML =
            "Neizdevās ielādēt datus."
    }
}

async function generateReport() {
    const type =
        document.getElementById(
            "reportType"
        ).value;

    const button =
        document.getElementById(
            "generateReportButton"
        );

    const container =
        document.getElementById(
            "generatedReport"
        );

    button.disabled = true;

    button.textContent =
        "Ģenerē...";

    try {
        const response =
            await fetch(
                "/reports/generate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        report_type: type
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
			console.error(
				"REPORT GENERATION ERROR:",
				data
			);

			container.hidden = false;

			container.innerHTML = `
				<div class="report-error">
					<strong>Neizdevās izveidot atskaiti.</strong>

					${
						data.details
							? `<div style="margin-top: 8px;">
								${data.details}
							   </div>`
							: ""
					}
				</div>
			`;

			return;
		}

        renderGeneratedReport(data);
		generatedReportType = type;

		document.getElementById(
			"reportExportActions"
		).style.display = "flex";
    } catch (error) {
        console.error(
            "GENERATE REPORT ERROR:",
            error
        );

        container.hidden = false;

        container.innerHTML = `
            <div class="report-error">
                Neizdevās izveidot atskaiti.
            </div>
        `;
    } finally {
        button.disabled = false;

        button.textContent =
            "Ģenerēt atskaiti";
    }

}

function renderGeneratedReport(data) {
    const container =
        document.getElementById(
            "generatedReport"
        );

    let html = `
        <div class="generated-report-header">

            <div>
                <h3>Ģenerētā atskaite</h3>

                <span>
                    Izveidota:
                    ${data.generated_at}
                </span>
            </div>

        </div>
    `;

    if (data.systems) {
        html += `
            <div class="generated-report-row">
                <span>Sistēmas</span>
                <strong>
                    ${data.systems.total}
                </strong>
            </div>
        `;
    }

    if (data.risks) {
        html += `
            <div class="generated-report-section">

                <h4>Riski</h4>

                <div class="generated-report-grid">

                    <div>
                        <span>Kopā</span>
                        <strong>
                            ${data.risks.total}
                        </strong>
                    </div>

                    <div>
                        <span>Aktīvi</span>
                        <strong>
                            ${data.risks.active}
                        </strong>
                    </div>

                    <div>
                        <span>Zems</span>
                        <strong>
                            ${data.risks.low}
                        </strong>
                    </div>

                    <div>
                        <span>Vidējs</span>
                        <strong>
                            ${data.risks.medium}
                        </strong>
                    </div>

                    <div>
                        <span>Augsts</span>
                        <strong>
                            ${data.risks.high}
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }

    if (data.incidents) {
        html += `
            <div class="generated-report-section">

                <h4>Incidenti</h4>

                <div class="generated-report-grid">

                    <div>
                        <span>Kopā</span>
                        <strong>
                            ${data.incidents.total}
                        </strong>
                    </div>

                    <div>
                        <span>Neatrisināti</span>
                        <strong>
                            ${data.incidents.unresolved}
                        </strong>
                    </div>

                    <div>
                        <span>Low</span>
                        <strong>
                            ${data.incidents.low}
                        </strong>
                    </div>

                    <div>
                        <span>Medium</span>
                        <strong>
                            ${data.incidents.medium}
                        </strong>
                    </div>

                    <div>
                        <span>High</span>
                        <strong>
                            ${data.incidents.high}
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }

    if (data.continuity_plans) {
        html += `
            <div class="generated-report-row">
                <span>
                    Nepārtrauktības plāni
                </span>

                <strong>
                    ${data.continuity_plans.total}
                </strong>
            </div>
        `;
    }

    if (data.latest_assessment) {
        html += `
            <div class="generated-report-section">

                <h4>Pēdējais pašnovērtējums</h4>

                <div class="generated-report-grid">

                    <div>
                        <span>Rezultāts</span>
                        <strong>
                            ${data.latest_assessment.overall_score}
                        </strong>
                    </div>

                    <div>
                        <span>Līmenis</span>
                        <strong>
                            ${data.latest_assessment.security_level}
                        </strong>
                    </div>

                    <div>
                        <span>Datums</span>
                        <strong>
                            ${data.latest_assessment.date}
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }

    container.innerHTML = html;
    container.hidden = false;
}

async function exportReport(format) {
    if (!generatedReportType) {
        return;
    }

    if (!hasPermission("view_reports")) {
        alert("No permission");
        return;
    }

    const url =
        format === "pdf"
            ? "/reports/export/pdf"
            : "/reports/export/excel";

    try {
        const response = await fetch(
            url,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    report_type:
                        generatedReportType
                })
            }
        );

        if (!response.ok) {
            const data =
                await response.json();

            alert(
                data.error ||
                "Neizdevās eksportēt atskaiti."
            );

            return;
        }

        const blob =
            await response.blob();

        const downloadUrl =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = downloadUrl;

        link.download =
            format === "pdf"
                ? "kiberdrosibas_atskaite.pdf"
                : "kiberdrosibas_atskaite.xlsx";

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
            downloadUrl
        );
    } catch (error) {
        console.error(
            "REPORT EXPORT ERROR:",
            error
        );

        alert(
            "Neizdevās eksportēt atskaiti."
        );
    }
}