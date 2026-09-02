let rolesList = []

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

async function loadRoles() {
    const res = await fetch("/api/roles")
    const data = await res.json()

    rolesList = data.roles
}

async function loadUsers() {
    const res = await fetch("/api/users");
    const users = await res.json();

    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";

    users.forEach(u => {

        let options = ""

        rolesList.forEach(r => {
            options += `
                <option value="${escapeHtml(r.name)}" ${u.role === r.name ? "selected" : ""}>
					${escapeHtml(r.name)}
				</option>
            `
        })

        tbody.innerHTML += `
            <tr>
                <td>${u.user_id}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>
                    <select class="role-select" onchange="updateRole(${u.user_id}, this.value)">
                        ${options}
                    </select>
                </td>
                <td>${u.created_at}</td>
                <td>
                    <button onclick="deleteUser(${u.user_id})">❌</button>
                </td>
            </tr>
        `;
    });
}

async function createUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const res = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    loadUsers();
}

async function updateRole(userId, newRole) {
    const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error);
        loadUsers();
    }
}

async function deleteUser(id) {
    await fetch(`/api/users/${id}`, {
        method: "DELETE",
        credentials: "include"
    });

    loadUsers();
}

function fillRoleSelect() {
    const select = document.getElementById("role")
    select.innerHTML = ""

    rolesList.forEach(r => {
        const opt = document.createElement("option")
        opt.value = r.name
        opt.textContent = r.name
        select.appendChild(opt)
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadRoles()
    fillRoleSelect()
    loadUsers()
});