const pricing = {
  MultiFinish: 12.50,
  Bonding: 10.80,
  Hardwall: 11.20
}; // FIXED: Added missing brace here

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

document.getElementById("todayDate").innerText = new Date().toDateString();

// FIXED: Navigation logic to ensure buttons work even if you tap the icon inside
function navigate(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const target = document.getElementById(`${screen}-screen`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  
  // Highlight the button that matches the screen
  const buttons = document.querySelectorAll(".bottom-nav button");
  buttons.forEach(btn => {
    if(btn.getAttribute('onclick')?.includes(screen)) btn.classList.add("active");
  });

  if (screen === "dashboard") renderDashboard();
  if (screen === "jobs") renderJobs();
  if (screen === "quotes") renderQuotes();
  if (screen === "invoices") renderInvoices();
  if (screen === "settings") renderSettings();
}

// Automatically load the app (Removed Password logic)
navigate("dashboard");

function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = state.jobs.filter(j => j.quote).length + 1;
  return `Q-${year}-${String(count).padStart(3,"0")}`;
}

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
    <button onclick="openAddJob()">Add Job</button>
    <button onclick="openCreateQuote()">Create Quote</button>
    <button onclick="openEstimator()">Estimate Materials</button>
  </div>

  <div class="card">
    <h3>Finance Snapshot</h3>
    <p>Outstanding: £${state.invoices.filter(i=>!i.paid).reduce((a,b)=>a+b.total,0).toFixed(2)}</p>
  </div>
  `;
}

function renderJobs() {
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
  <div class="card">
    <h3>Jobs</h3>
    <button class="link-btn" onclick="openBrandSettings()">Brand Settings</button>
    <button class="primary" onclick="openAddJob()">+ Add Job</button>
    <div id="jobList"></div>
  </div>
  `;

  const list = document.getElementById("jobList");
  if (!state.jobs.length) {
    list.innerHTML = "<p>No jobs yet.</p>";
    return;
  }

  list.innerHTML = state.jobs.map((j,i)=>`
  <div class="job-item">
    <strong>${j.client}</strong><br>
    ${j.address}<br>
    <span class="status ${j.status}">${j.status}</span><br>

    <button class="link-btn" onclick="editJob(${i})">Edit</button>
    <button class="link-btn" onclick="openMaps('${j.address}')">Maps</button>
    <button class="link-btn" onclick="exportCalendar(${i})">Add to Calendar</button>
    <button class="link-btn" onclick="openEstimator(${i})">Estimate</button>
    <button class="link-btn" onclick="openQuoteEngine(${i})">Quote</button>

    ${j.quote ? `<button class="link-btn" onclick="convertToInvoice(${i})">Convert to Invoice</button>` : ""}
    ${j.quote ? `<button class="link-btn" onclick="downloadQuotePDF(${i})">Download Quote PDF</button>` : ""}
    ${j.invoice && j.invoice.status === "Unpaid" ? `<button class="link-btn" onclick="markInvoicePaid(${i})">Mark as Paid</button>` : ""}
    ${j.invoice ? `<button class="link-btn" onclick="downloadInvoicePDF(${i})">Download Invoice PDF</button>` : ""}
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
    <textarea id="notes" placeholder="Job Notes"></textarea>
    <button class="primary" onclick="saveJob()">Save Job</button>
  </div>
  `;
}

function saveJob() {
  const client = document.getElementById("clientName").value;
  const address = document.getElementById("address").value;
  const date = document.getElementById("jobDate").value;
  const status = document.getElementById("jobStatus").value;
  const notes = document.getElementById("notes").value;
  state.jobs.push({client, address, date, status, notes});
  save();
  renderJobs();
}

function editJob(index) {
  const job = state.jobs[index];
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
  <div class="card">
    <h3>Edit Job</h3>
    <input id="clientName" value="${job.client}">
    <input id="address" value="${job.address}">
    <input type="date" id="jobDate" value="${job.date}">
    <select id="jobStatus">
      <option ${job.status==="Scheduled"?"selected":""}>Scheduled</option>
      <option ${job.status==="In Progress"?"selected":""}>In Progress</option>
      <option ${job.status==="Complete"?"selected":""}>Complete</option>
    </select>
    <textarea id="notes">${job.notes || ""}</textarea>
    <button class="primary" onclick="updateJob(${index})">Update Job</button>
    <button onclick="deleteJob(${index})">Delete</button>
  </div>
  `;
}

function updateJob(index) {
  state.jobs[index] = {
    client: document.getElementById("clientName").value,
    address: document.getElementById("address").value,
    date: document.getElementById("jobDate").value,
    status: document.getElementById("jobStatus").value,
    notes: document.getElementById("notes").value
  };
  save();
  renderJobs();
}

function deleteJob(index) {
  if (!confirm("Delete this job?")) return;
  state.jobs.splice(index,1);
  save();
  renderJobs();
}

function openEstimator(jobIndex = null) {
  navigate("jobs");
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
  <div class="card">
    <h3>Materials Estimator</h3>
    <label>Room Length (m)</label><input type="number" id="length" step="0.01">
    <label>Room Width (m)</label><input type="number" id="width" step="0.01">
    <label>Room Height (m)</label><input type="number" id="height" step="0.01">
    <label>Include Ceiling?</label>
    <select id="ceiling"><option value="yes">Yes</option><option value="no">No</option></select>
    <label>Material Type</label>
    <select id="material"><option>MultiFinish</option><option>Bonding</option><option>Hardwall</option></select>
    <button class="primary" onclick="calculateEstimate(${jobIndex})">Calculate</button>
    <div id="estimateResults"></div>
  </div>
  `;
}

function calculateEstimate(jobIndex) {
  const length = parseFloat(document.getElementById("length").value) || 0;
  const width = parseFloat(document.getElementById("width").value) || 0;
  const height = parseFloat(document.getElementById("height").value) || 0;
  const includeCeiling = document.getElementById("ceiling").value === "yes";
  const material = document.getElementById("material").value;

  let wallArea = 2*(length*height) + 2*(width*height);
  let ceilingArea = includeCeiling ? (length*width) : 0;
  let totalArea = wallArea + ceilingArea;
  
  let coverage = material === "MultiFinish" ? 10 : 3;
  const bags = Math.ceil(totalArea / coverage);
  const totalCost = bags * pricing[material];

  document.getElementById("estimateResults").innerHTML = `
    <hr><p>Total Area: ${totalArea.toFixed(2)} m²</p>
    <p>Bags Required: ${bags}</p>
    <p>Total Material Cost: £${totalCost.toFixed(2)}</p>
    <button onclick="saveEstimate(${jobIndex}, ${bags}, '${material}', ${totalCost})">Save to Job</button>
  `;
}

function saveEstimate(jobIndex, bags, material, totalCost) {
  if (jobIndex !== null) {
    state.jobs[jobIndex].estimate = { bags, material, totalCost };
    save();
    alert("Saved to job.");
  }
  renderJobs();
}

function openQuoteEngine(jobIndex) {
  extras = [];
  navigate("jobs");
  const job = state.jobs[jobIndex];
  const el = document.getElementById("jobs-screen");
  el.innerHTML = `
  <div class="card">
    <h3>Create Quote - ${job.client}</h3>
    <label>Labour Cost (£)</label><input type="number" id="labour">
    <div id="extrasList"></div>
    <button onclick="addExtra()">+ Add Extra Item</button>
    <button class="primary" onclick="calculateQuote(${jobIndex})">Generate Quote</button>
    <div id="quoteResults"></div>
  </div>`;
}

function addExtra() {
  const list = document.getElementById("extrasList");
  const index = extras.length;
  list.innerHTML += `<div style="margin-bottom:8px;"><input placeholder="Item" id="extraName${index}"><input type="number" id="extraCost${index}"></div>`;
  extras.push({});
}

function calculateQuote(jobIndex) {
  const job = state.jobs[jobIndex];
  const labour = parseFloat(document.getElementById("labour").value) || 0;
  const materials = job.estimate ? job.estimate.totalCost : 0;
  
  let extrasTotal = 0;
  extras.forEach((_, i) => {
    const cost = parseFloat(document.getElementById(`extraCost${i}`)?.value) || 0;
    extrasTotal += cost;
  });

  const total = labour + materials + extrasTotal;
  job.quote = {
    quoteNumber: generateQuoteNumber(),
    total,
    date: new Date().toISOString()
  };
  save();
  alert("Quote Saved.");
  renderJobs();
}

async function downloadQuotePDF(jobIndex) {
  const job = state.jobs[jobIndex];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  if (state.logo) doc.addImage(state.logo, "PNG", 150, 10, 40, 20);
  doc.setFontSize(18);
  doc.text("QUOTE", 20, 20);
  doc.setFontSize(12);
  doc.text(`Client: ${job.client}`, 20, 40);
  doc.text(`Total: £${job.quote.total.toFixed(2)}`, 20, 60);
  doc.save(`${job.quote.quoteNumber}.pdf`);
}

function renderQuotes() {
  document.getElementById("quotes-screen").innerHTML = `<div class="card"><h3>Quotes</h3>${state.jobs.filter(j=>j.quote).map(j=>`<p>${j.client}: £${j.quote.total.toFixed(2)}</p>`).join("")}</div>`;
}

function renderInvoices() {
  document.getElementById("invoices-screen").innerHTML = `<div class="card"><h3>Invoices</h3>${state.jobs.filter(j=>j.invoice).map(j=>`<p>${j.client}: £${j.invoice.total.toFixed(2)}</p>`).join("")}</div>`;
}

function renderSettings() {
  document.getElementById("settings-screen").innerHTML = `
  <div class="card">
    <h3>Settings</h3>
    <button onclick="openBrandSettings()">Upload Logo</button>
    <button onclick="localStorage.clear(); location.reload()">Reset All Data</button>
  </div>`;
}

function openBrandSettings() {
  navigate("settings");
  document.getElementById("settings-screen").innerHTML = `
    <div class="card">
      <h3>Brand Settings</h3>
      <input type="file" id="logoUpload" accept="image/*">
      <button class="primary" onclick="saveLogo()">Save Logo</button>
    </div>`;
}

function saveLogo() {
  const file = document.getElementById("logoUpload").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.logo = e.target.result;
    save();
    alert("Logo Saved.");
    renderSettings();
  };
  reader.readAsDataURL(file);
}

// Keeping your other helper functions
function convertToInvoice(jobIndex) {
  const job = state.jobs[jobIndex];
  job.invoice = {
    invoiceNumber: job.quote.quoteNumber.replace("Q","INV"),
    total: job.quote.total,
    status: "Unpaid",
    date: new Date().toISOString()
  };
  save();
  renderJobs();
}

function openMaps(addr) { window.open(`https://www.google.com/maps?q=${encodeURIComponent(addr)}`); }

function exportCalendar(index) {
  const job = state.jobs[index];
  const date = job.date.replace(/-/g,"");
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Plastering: ${job.client}\nDTSTART:${date}\nLOCATION:${job.address}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], {type:'text/calendar'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = "job.ics";
  link.click();
}
