let currentRole = null
let allPermissions = []

async function loadRoles() {
    try {
        const res = await fetch("/api/roles")
        const data = await res.json()

        const select = document.getElementById("roleSelect")
        select.innerHTML = ""

        data.roles.forEach(role => {
            const option = document.createElement("option")
            option.value = role.id
            option.textContent = role.name
            select.appendChild(option)
        })

        allPermissions = data.permissions

        select.onchange = () => {
            loadRolePermissions(select.value)
        }

        if (data.roles.length > 0) {
            loadRolePermissions(data.roles[0].id)
        }

    } catch (err) {
        console.error("Role loading error:", err)
    }
}

async function loadRolePermissions(roleId) {
    try {
        currentRole = roleId

        const res = await fetch(`/api/roles/${roleId}`)
        const data = await res.json()

        renderPermissions(data.permissions)

    } catch (err) {
        console.error("Permission loading error:", err)
    }
}

function renderPermissions(activePermissions) {
    const container = document.getElementById("permissions")
    container.innerHTML = ""

    allPermissions.forEach(permission => {
        const wrapper = document.createElement("label")
		wrapper.className = "perm-item"

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.value = permission
		checkbox.className = "perm-checkbox"

        if (activePermissions.includes(permission)) {
            checkbox.checked = true
        }

        const label = document.createElement("label")
        label.textContent = permission
		label.className = "perm-label"

        wrapper.appendChild(checkbox)
        wrapper.appendChild(label)

        container.appendChild(wrapper)
    })
}

async function save() {
    try {
        const checked = document.querySelectorAll("#permissions input:checked")

        const selectedPermissions = Array.from(checked).map(cb => cb.value)

        const res = await fetch(`/api/roles/${currentRole}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                permissions: selectedPermissions
            })
        })

        const data = await res.json()

        if (res.ok) {
            alert("Saved")
        } else {
            alert(data.error || "Ошибка")
        }

    } catch (err) {
        console.error("Save error:", err)
    }
}

loadRoles();