const ADMIN_PASSWORD = "2137";

const STORAGE_KEY = "base_control_registered_systems";

const loginScreen = document.getElementById("loginScreen");
const bootScreen = document.getElementById("bootScreen");
const mainScreen = document.getElementById("mainScreen");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

const bootLog = document.getElementById("bootLog");
const bootProgress = document.getElementById("bootProgress");
const bootPercent = document.getElementById("bootPercent");

const registerBtn = document.getElementById("registerBtn");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const systemForm = document.getElementById("systemForm");
const systemName = document.getElementById("systemName");
const systemType = document.getElementById("systemType");
const formError = document.getElementById("formError");

const systemGrid = document.getElementById("systemGrid");
const systemCount = document.getElementById("systemCount");
const emptyHint = document.getElementById("emptyHint");
const clock = document.getElementById("clock");
const logoutBtn = document.getElementById("logoutBtn");

const typeLabels = {
  aircraft: "Aircraft",
  car: "Car",
  military: "Military Vehicle",
  machine: "Machine",
  utility: "Utility Vehicle",
  other: "Other",
};

const typeIcons = {
  aircraft: "✈",
  car: "▣",
  military: "◆",
  machine: "⚙",
  utility: "▰",
  other: "◇",
};

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username.toLowerCase() !== "admin") {
    loginError.textContent = "ACCESS DENIED // INVALID USER";
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    loginError.textContent = "ACCESS DENIED // INVALID PASSWORD";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  loginError.textContent = "";
  startBootSequence();
});

function startBootSequence() {
  loginScreen.classList.remove("active");
  bootScreen.classList.add("active");

  bootLog.innerHTML = "";
  bootProgress.style.width = "0%";
  bootPercent.textContent = "0%";

  const lines = [
    "INITIALIZING BASE CONTROL OS...",
    "VERIFYING USER CREDENTIALS... <span class='ok'>OK</span>",
    "CONNECTING TO CENTRAL NETWORK... <span class='ok'>OK</span>",
    "CHECKING REDSTONE LINK INTERFACE... <span class='ok'>OK</span>",
    "LOADING FACILITY DATABASE... <span class='ok'>OK</span>",
    "LOADING AIRCRAFT CONTROL MODULE... <span class='ok'>OK</span>",
    "LOADING VEHICLE CONTROL MODULE... <span class='ok'>OK</span>",
    "LOADING MACHINE CONTROL MODULE... <span class='ok'>OK</span>",
    "INITIALIZING SECURITY SYSTEMS... <span class='ok'>OK</span>",
    "VERIFYING SYSTEM INTEGRITY... <span class='ok'>100%</span>",
    "CENTRAL CONTROL ONLINE.",
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < lines.length) {
      const line = document.createElement("div");
      line.className = "boot-line";
      line.innerHTML = "> " + lines[i];
      bootLog.appendChild(line);

      const percent = Math.min(100, Math.round(((i + 1) / lines.length) * 100));
      bootProgress.style.width = percent + "%";
      bootPercent.textContent = percent + "%";

      i++;
    } else {
      clearInterval(interval);

      setTimeout(() => {
        bootScreen.classList.remove("active");
        mainScreen.classList.add("active");
        renderSystems();
      }, 650);
    }
  }, 230);
}

function getSystems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSystems(systems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
}

function renderSystems() {
  const systems = getSystems();

  systemGrid.innerHTML = "";
  systemCount.textContent = systems.length;
  emptyHint.textContent = systems.length
    ? `${systems.length} SYSTEM${systems.length === 1 ? "" : "S"} REGISTERED`
    : "NO SYSTEMS REGISTERED";

  systems.forEach((system, index) => {
    const card = document.createElement("article");
    card.className = "system-card";
    card.style.animationDelay = `${index * 50}ms`;

    const icon = typeIcons[system.type] || typeIcons.other;
    const label = typeLabels[system.type] || "Other";

    card.innerHTML = ` <button class="delete-system" title="Delete system" aria-label="Delete ${escapeHTML( system.name )}">×</button> <div class="system-icon">${icon}</div> <div class="system-name">${escapeHTML(system.name)}</div> <div class="system-type">${escapeHTML(label)}</div> <div class="system-online">SYSTEM REGISTERED</div> `;

    card.querySelector(".delete-system").addEventListener("click", () => {
      deleteSystem(system.id);
    });

    systemGrid.appendChild(card);
  });
}

registerBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

function openModal() {
  modalOverlay.classList.add("open");
  formError.textContent = "";
  setTimeout(() => systemName.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove("open");
  systemForm.reset();
  formError.textContent = "";
}

systemForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = systemName.value.trim();
  const type = systemType.value;

  if (!name || !type) {
    formError.textContent = "ERROR // ALL FIELDS ARE REQUIRED";
    return;
  }

  const systems = getSystems();

  const duplicate = systems.some(
    (system) => system.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    formError.textContent = "ERROR // SYSTEM NAME ALREADY EXISTS";
    return;
  }

  systems.push({
    id: Date.now().toString(),
    name,
    type,
    registeredAt: new Date().toISOString(),
  });

  saveSystems(systems);
  closeModal();
  renderSystems();
});

function deleteSystem(id) {
  const systems = getSystems().filter((system) => system.id !== id);
  saveSystems(systems);
  renderSystems();
}

function updateClock() {
  const now = new Date();

  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

updateClock();
setInterval(updateClock, 1000);

logoutBtn.addEventListener("click", () => {
  mainScreen.classList.remove("active");
  loginScreen.classList.add("active");

  passwordInput.value = "";
  loginError.textContent = "";
  passwordInput.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalOverlay.classList.contains("open")) {
    closeModal();
  }
});

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
