document.addEventListener("DOMContentLoaded", () => {

async function loadChart() {
    try {
        const res = await fetch(
            "/risks/statistics"
        );

        const data =
            await res.json();

        if (!res.ok) {
            console.error(
                "Failed to load risk statistics:",
                data
            );

            return;
        }

        const low =
            Number(data.low) || 0;

        const medium =
            Number(data.medium) || 0;

        const high =
            Number(data.high) || 0;

        const canvas =
            document.getElementById(
                "riskChart"
            );

        if (!canvas) {
            console.error(
                "riskChart not found"
            );

            return;
        }

        const chart =
            new Chart(
                canvas,
                {
                    type: "bar",
                    data: {

                        labels: [
                            "Zems",
                            "Vidējs",
                            "Augsts"
                        ],

                        datasets: [{

                            label:
                                "Riski",

                            data: [
                                low,
                                medium,
                                high
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#f59e0b",
                                "#ef4444"
                            ],

                            borderColor: [
                                "#16a34a",
                                "#d97706",
                                "#dc2626"
                            ],

                            borderWidth: 1,

                            borderRadius: 6,

                            borderSkipped: false,

                            barPercentage: 0.55,

                            categoryPercentage: 0.7
                        }]
                    },
                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        animation: false,


                        plugins: {

                            legend: {
                                display: false
                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function(context) {

                                            return (
                                                ` Riski: ${context.raw}`
                                            );
                                        }
                                }
                            }
                        },
                        scales: {

                            x: {

                                grid: {
                                    display: false
                                },


                                ticks: {

                                    color:
                                        "#94a3b8",

                                    font: {
                                        size: 13
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,

                                ticks: {
                                    precision: 0,

                                    maxTicksLimit: 8,

                                    color:
                                        "#94a3b8"
                                },
                                grid: {
                                    color:
                                        "rgba(148, 163, 184, 0.08)"
                                }
                            }
                        }
                    }
                }
            );

        requestAnimationFrame(() => {

            chart.resize();

        });

    } catch (error) {
        console.error(
            "Error loading risk chart:",
            error
        );
    }
}

function openDescriptionModal(title, description) {
    const modal = document.getElementById("descriptionModal");
    const titleElement = document.getElementById("descriptionModalTitle");
    const textElement = document.getElementById("descriptionModalText");

    if (!modal || !titleElement || !textElement) {
        return;
    }

    titleElement.textContent = title || "";
    textElement.textContent = description || "Apraksts nav pieejams.";

    modal.style.display = "flex";
}

function closeDescriptionModal() {
    const modal = document.getElementById("descriptionModal");

    if (!modal) {
        return;
    }

    modal.style.display = "none";
}

loadChart();

});