const pricing = {
  MultiFinish: 12.50,
  Bonding: 10.80,
  Hardwall: 11.20
}; // FIXED: Added missing closing brace

let extras = [];

const state = {
  jobs: JSON.parse(localStorage.getItem("jobs") || "[]"),
  quotes: JSON.parse(localStorage.getItem("quotes") || "[]"),
  invoices: JSON.parse(localStorage.getItem("invoices") || "[]"),
  settings: JSON.parse(localStorage.getItem("settings") || "{}")
};

function save() {
  localStorage.setItem("jobs", JSON.stringify(state.jobs));
  localStorage.setItem("quotes", JSON.stringify(state.quotes));
  localStorage.setItem("invoices", JSON.stringify(state.invoices));
  localStorage.setItem("settings", JSON.stringify(state.settings));
}

// Initial setup
document.getElementById("todayDate").innerText = new Date().toDateString();

// FIXED: Improved navigate function to handle icon clicks and screen rendering
function navigate(screen) {
  // Hide all screens
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  
  // Show target screen
  const target = document.getElementById(`${screen}-screen`);
  if (target) target.classList.remove("hidden");

  // Update nav button active states
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  
  // Render the appropriate screen
  if (screen === "dashboard") renderDashboard();
  if (screen === "jobs") renderJobs();
  if (screen === "quotes") renderQuotes();
  if (screen === "invoices") renderInvoices();
  if (screen === "settings") renderSettings();
}

// Start on dashboard automatically (No password)
navigate("dashboard");

function renderDashboard() {
  const el = document.getElementById("dashboard-screen");
  const today = new Date().toDateString();
  const todayJobs = state.jobs.filter(j => j.date === today);

  el.innerHTML = `
    <div class="card">
      <h3>Today's Jobs</h3>
      ${todayJobs.length ? 
        todayJobs.map(j => `<p><strong>${j.client}</strong><br>${j.address}</p>`).join("")
        : "<p>No jobs scheduled</p>"}
    </div>
    <div class="card">
      <h3>Quick Actions</h3>
      <button class="primary" onclick="openAddJob()">+ Add Job</button>
      <button onclick="navigate('jobs')">View All Jobs</button>
    </div>
  `;
}

function renderJobs() {
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
    <div class="card">
      <h3>Jobs</h3>
      <button class="primary" onclick="openAddJob()">+ Add Job</button>
      <div id="jobList"></div>
    </div>
  `;
  const list = document.getElementById("jobList");
  if (!state.jobs.length) {
    list.innerHTML = "<p>No jobs yet.</p>";
    return;
  }
  list.innerHTML = state.jobs.map((j, i) => `
    <div class="job-item" style="border-bottom:1px solid #eee; padding:10px 0;">
      <strong>${j.client}</strong> - ${j.status}<br>
      <small>${j.address}</small><br>
      <button onclick="editJob(${i})">Edit</button>
    </div>
  `).join("");
}

function openAddJob() {
  navigate("jobs");
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
    <div class="card">
      <h3>Add Job</h3>
      <input id="clientName" placeholder="Client Name">
      <input id="address" placeholder="Address">
      <input type="date" id="jobDate">
      <select id="jobStatus">
        <option>Scheduled</option>
        <option>In Progress</option>
        <option>Complete</option>
      </select>
      <button class="primary" onclick="saveJob()">Save Job</button>
      <button onclick="renderJobs()">Cancel</button>
    </div>
  `;
}

function saveJob() {
  const client = document.getElementById("clientName").value;
  const address = document.getElementById("address").value;
  const date = document.getElementById("jobDate").value;
  const status = document.getElementById("jobStatus").value;

  if(!client) return alert("Please enter a name");

  state.jobs.push({client, address, date, status});
  save();
  renderJobs();
}

function renderQuotes() {
  document.getElementById("quotes-screen").innerHTML = `<div class="card"><h3>Quotes</h3><p>Quotes appear here once created from a job.</p></div>`;
}

function renderInvoices() {
  document.getElementById("invoices-screen").innerHTML = `<div class="card"><h3>Invoices</h3><p>No unpaid invoices.</p></div>`;
}

function renderSettings() {
  document.getElementById("settings-screen").innerHTML = `<div class="card"><h3>Settings</h3><button onclick="localStorage.clear(); location.reload()">Reset All Data</button></div>`;
}
