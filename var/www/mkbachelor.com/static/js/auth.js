document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    if (res.ok) {
        alert("Registered!");
        window.location.href = "/login";
    } else {
        alert("Error");
    }
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    if (res.ok) {
        window.location.href = "/";
    } else {
        alert("Login failed");
    }
});

window.currentUser = null

async function loadCurrentUser() {
    try {
        const res = await fetch("/api/me")

        if (!res.ok) {
            console.log("Not authorized")
            return null
        }

        currentUser = await res.json()

        console.log("CURRENT USER:", currentUser)

        return currentUser

    } catch (err) {
        console.error("Error loading user:", err)
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM loaded")

    await loadCurrentUser()
	
	window.hasPermission = function(permission) {
		if (!currentUser) return false
		return currentUser.permissions.includes(permission)
	}

    console.log("USER:", currentUser)

    if (!currentUser) return

    if (currentUser.permissions.length === 0) {
        document.body.innerHTML = `
            <div class="content">
                <div class="card">
                    <h2>Welcome</h2>
                    <p>You currently have no permissions.</p>
                    <p>Please contact administrator.</p>
					<h3><a href="/logout" class="logout">Iziet</a></h3>
                </div>
            </div>
        `
        return
    }
	
	const usernameEl = document.getElementById("usernameDisplay")

	if (usernameEl && currentUser) {
		usernameEl.textContent = currentUser.username
	} else if (usernameEl) {
		usernameEl.textContent = currentUser?.username || "Guest"
	}

    const adminMenu = document.getElementById("adminMenu")

    console.log("ADMIN MENU:", adminMenu)

    if (adminMenu && !currentUser.permissions.includes("manage_users")) {
        console.log("HIDING ADMIN")
        adminMenu.style.display = "none"
    }
})

function openDescriptionModal(title, description) {

    document.getElementById("descriptionModalTitle").textContent =
        title || "Apraksts";

    document.getElementById("descriptionModalText").textContent =
        description || "Apraksts nav pievienots.";

    document
        .getElementById("descriptionModal")
        .classList.add("show");
}

function closeDescriptionModal() {

    document
        .getElementById("descriptionModal")
        .classList.remove("show");
}

document.addEventListener("click", (event) => {

    const modal = document.getElementById("descriptionModal");

    if (
        modal &&
        event.target === modal
    ) {
        closeDescriptionModal();
    }

});

function openHistoryModal(title, content) {

    const modal = document.getElementById("historyModal")
    const modalTitle = document.getElementById("historyModalTitle")
    const modalBody = document.getElementById("historyModalBody")

    if (!modal || !modalTitle || !modalBody) {
        console.error("History modal elements not found")
        return
    }

    modalTitle.textContent = title
    modalBody.innerHTML = content

    modal.style.display = "flex"
}

function closeHistoryModal() {

    const modal = document.getElementById("historyModal")
    const modalBody = document.getElementById("historyModalBody")

    if (!modal) {
        return
    }

    modal.style.display = "none"

    if (modalBody) {
        modalBody.innerHTML = ""
    }
}