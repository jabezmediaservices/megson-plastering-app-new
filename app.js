const pricing = {
  MultiFinish: 12.50,
  Bonding: 10.80,
  Hardwall: 11.20
let extras = [];
};

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

document.getElementById("todayDate").innerText =
  new Date().toDateString();

function login() {
  // Bypassing password logic
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  navigate("dashboard");
}

function navigate(screen) {

  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(`${screen}-screen`).classList.remove("hidden");

  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
  event?.target?.classList?.add("active");

  if (screen === "dashboard") renderDashboard();
  if (screen === "jobs") renderJobs();
  if (screen === "quotes") renderQuotes();
  if (screen === "invoices") renderInvoices();
  if (screen === "settings") renderSettings();
}

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
    <p>Outstanding: £${state.invoices.filter(i=>!i.paid).reduce((a,b)=>a+b.total,0)}</p>
  </div>
  `;
}

function renderJobs() {
  const el = document.getElementById("jobs-screen");

  el.innerHTML = `
  <div class="card">
    <h3>Jobs</h3>
    <button class="link-btn" onclick="openBrandSettings()">
      Brand Settings
    </button>
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
    <span class="status ${j.status}">${j.status}</span>
    <br>

    <button class="link-btn" onclick="editJob(${i})">Edit</button>
    <button class="link-btn" onclick="openMaps('${j.address}')">Maps</button>
    <button class="link-btn" onclick="exportCalendar(${i})">Add to Calendar</button>
    <button class="link-btn" onclick="openEstimator(${i})">Estimate</button>
    <button class="link-btn" onclick="openQuoteEngine(${i})">Quote</button>

    ${j.estimate ? `
      <div class="mini-info">
        <small>
          Estimate: £${j.estimate.totalCost.toFixed(2)}
        </small>
      </div>
    ` : ""}

    ${j.quote ? `
      <div class="mini-info">
        <small>
          Quote: £${j.quote.total.toFixed(2)}
        </small>
      </div>
    ` : ""}

    ${j.quote ? `
      <button class="link-btn" onclick="convertToInvoice(${i})">
        Convert to Invoice
      </button>
     ` : ""}

    ${j.quote ? `
      <button class="link-btn" onclick="downloadQuotePDF(${i})">
        Download Quote PDF
      </button>
     ` : ""}

    ${j.invoice && j.invoice.status === "Unpaid" ? `
      <button class="link-btn" onclick="markInvoicePaid(${i})">
        Mark as Paid
      </button>
     ` : ""}

    ${j.invoice ? `
      <button class="link-btn" onclick="downloadInvoicePDF(${i})">
        Download Invoice PDF
      </button>
     ` : ""}


  </div>
`).join("");

}

function openAddJob() {
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
      <option>Invoiced</option>
      <option>Paid</option>
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

  state.jobs.push({client,address,date,status,notes});
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
      <option ${job.status==="Invoiced"?"selected":""}>Invoiced</option>
      <option ${job.status==="Paid"?"selected":""}>Paid</option>
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

function exportCalendar(index) {
  const job = state.jobs[index];
  const date = job.date.replace(/-/g,"");

  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Plastering - ${job.client}
DTSTART:${date}
DTEND:${date}
DESCRIPTION:${job.notes || ""}
LOCATION:${job.address}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], {type:'text/calendar'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = "job.ics";
  link.click();
}


function renderQuotes() {
  document.getElementById("quotes-screen").innerHTML =
  `<div class="card"><h3>Quotes Coming Next Step</h3></div>`;
}

function renderInvoices() {
  document.getElementById("invoices-screen").innerHTML =
  `<div class="card"><h3>Invoices Coming Next Step</h3></div>`;
}

function renderSettings() {
  document.getElementById("settings-screen").innerHTML =
  `<div class="card"><button onclick="localStorage.clear(); location.reload()">Reset App</button></div>`;
}

function openCreateQuote() {
  alert("Quote builder upgrading next step.");
}

function openEstimator(jobIndex = null) {
  navigate("jobs");
  const el = document.getElementById("jobs-screen");

  el.innerHTML = `
  <div class="card">
    <h3>Materials Estimator</h3>

    <label>Room Length (m)</label>
    <input type="number" id="length" step="0.01">

    <label>Room Width (m)</label>
    <input type="number" id="width" step="0.01">

    <label>Room Height (m)</label>
    <input type="number" id="height" step="0.01">

    <label>Include Ceiling?</label>
    <select id="ceiling">
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>

    <label>Total Openings Area (m²)</label>
    <input type="number" id="openings" step="0.01" value="0">

    <label>Waste %</label>
    <input type="number" id="waste" value="10">

    <label>Material Type</label>
    <select id="material">
      <option>MultiFinish</option>
      <option>Bonding</option>
      <option>Hardwall</option>
    </select>

    <button class="primary" onclick="calculateEstimate(${jobIndex})">
      Calculate
    </button>

    <div id="estimateResults"></div>

  </div>
  `;
}
function calculateEstimate(jobIndex) {

  const length = parseFloat(document.getElementById("length").value) || 0;
  const width = parseFloat(document.getElementById("width").value) || 0;
  const height = parseFloat(document.getElementById("height").value) || 0;
  const includeCeiling = document.getElementById("ceiling").value === "yes";
  const openings = parseFloat(document.getElementById("openings").value) || 0;
  const waste = parseFloat(document.getElementById("waste").value) || 0;
  const material = document.getElementById("material").value;

  let wallArea = 2*(length*height) + 2*(width*height);
  let ceilingArea = includeCeiling ? (length*width) : 0;

  let totalArea = wallArea + ceilingArea - openings;

  totalArea = totalArea * (1 + waste/100);

  let coverage;

  if (material === "MultiFinish") coverage = 10;
  if (material === "Bonding") coverage = 2.5;
  if (material === "Hardwall") coverage = 3;

  const bags = Math.ceil(totalArea / coverage);
  const costPerBag = pricing[material];
  const totalCost = bags * costPerBag;

  document.getElementById("estimateResults").innerHTML = `
    <hr>
    <p><strong>Total Area:</strong> ${totalArea.toFixed(2)} m²</p>
    <p><strong>Bags Required:</strong> ${bags}</p>
    <p><strong>Cost per Bag:</strong> £${costPerBag}</p>
    <p><strong>Total Material Cost:</strong> £${totalCost.toFixed(2)}</p>
    <button onclick="saveEstimate(${jobIndex}, ${bags}, '${material}', ${totalCost})">
      Save to Job
    </button>
  `;
}
function saveEstimate(jobIndex, bags, material, totalCost) {

  if (jobIndex === null) {
    alert("Estimate saved (not attached to job).");
    return;
  }

  state.jobs[jobIndex].estimate = {
    bags,
    material,
    totalCost
  };

  save();
  alert("Estimate saved to job.");
  renderJobs();
}
function openQuoteEngine(jobIndex) {

  extras = []; // reset extras each time

  navigate("jobs");
  const job = state.jobs[jobIndex];
  const el = document.getElementById("jobs-screen");

  el.innerHTML = `
  <div class="card">
    <h3>Create Quote - ${job.client}</h3>

    <label>Labour Cost (£)</label>
    <input type="number" id="labour" step="0.01">

    <label>Markup %</label>
    <input type="number" id="markup" value="10">

    <label>Deposit %</label>
    <input type="number" id="deposit" value="25">

    <label>Include VAT (20%)?</label>
    <select id="vatToggle">
      <option value="yes">Yes</option>
      <option value="no" selected>No</option>
    </select>

    <h4>Extra Items</h4>
    <div id="extrasList"></div>
    <button onclick="addExtra()">+ Add Extra Item</button>

    <br><br>
    <button class="primary" onclick="calculateQuote(${jobIndex})">
      Generate Quote
    </button>

    <div id="quoteResults"></div>
  </div>
  `;
}
function addExtra() {

  const list = document.getElementById("extrasList");
  const index = extras.length;

  list.innerHTML += `
    <div style="margin-bottom:8px;">
      <input placeholder="Item Name" id="extraName${index}">
      <input type="number" placeholder="Cost" id="extraCost${index}">
    </div>
  `;

  extras.push({});
}
function calculateQuote(jobIndex) {

  const job = state.jobs[jobIndex];

  const labour = parseFloat(document.getElementById("labour").value) || 0;
  const markupPercent = parseFloat(document.getElementById("markup").value) || 0;
  const depositPercent = parseFloat(document.getElementById("deposit").value) || 0;

  const materials = job.estimate ? job.estimate.totalCost : 0;

  let extrasTotal = 0;
  let extraItems = [];

  extras.forEach((_, i) => {
    const name = document.getElementById(`extraName${i}`)?.value;
    const cost = parseFloat(document.getElementById(`extraCost${i}`)?.value) || 0;

    if (name) {
      extrasTotal += cost;
      extraItems.push({ name, cost });
    }
  });

  let subtotal = labour + materials + extrasTotal;
let subtotal = labour + materials + extrasTotal;

const markupAmount = subtotal * (markupPercent / 100);
let totalBeforeVAT = subtotal + markupAmount;

const vatEnabled = document.getElementById("vatToggle").value === "yes";
const vatAmount = vatEnabled ? totalBeforeVAT * 0.20 : 0;

const total = totalBeforeVAT + vatAmount;
const deposit = total * (depositPercent / 100);


  document.getElementById("quoteResults").innerHTML = `
  <hr>
  <p><strong>Labour:</strong> £${labour.toFixed(2)}</p>
  <p><strong>Materials:</strong> £${materials.toFixed(2)}</p>
  <p><strong>Extras:</strong> £${extrasTotal.toFixed(2)}</p>
  <p><strong>Markup:</strong> £${markupAmount.toFixed(2)}</p>
  ${vatEnabled ? `<p><strong>VAT (20%):</strong> £${vatAmount.toFixed(2)}</p>` : ""}
  <h3>Total: £${total.toFixed(2)}</h3>
  <p>Deposit Required: £${deposit.toFixed(2)}</p>

  <button onclick="saveQuote(${jobIndex}, ${total}, ${deposit}, ${vatAmount})">
    Save Quote
  </button>
`;

}
function saveQuote(jobIndex, total, deposit, vatAmount) {

  const job = state.jobs[jobIndex];

  job.quote = {
    quoteNumber: generateQuoteNumber(),
    total,
    deposit,
    vat: vatAmount,
    status: "Quote",
    date: new Date().toISOString()
  };

  save();
  alert("Quote saved.");
  renderJobs();
}
function convertToInvoice(jobIndex) {

  const job = state.jobs[jobIndex];

  if (!job.quote) {
    alert("No quote to convert.");
    return;
  }

  job.invoice = {
    invoiceNumber: job.quote.quoteNumber.replace("Q","INV"),
    total: job.quote.total,
    vat: job.quote.vat,
    status: "Unpaid",
    date: new Date().toISOString()
  };

  job.quote.status = "Converted";

  save();
  alert("Converted to Invoice.");
  renderJobs();
}

async function downloadQuotePDF(jobIndex) {

  const job = state.jobs[jobIndex];

  if (!job.quote) {
    alert("No quote available.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add Logo
  if (state.logo) {
    doc.addImage(state.logo, "PNG", 150, 10, 40, 20);
  }

  doc.setFontSize(18);
  doc.text("QUOTE", 20, 20);

  doc.setFontSize(12);
  doc.text(`Quote No: ${job.quote.quoteNumber}`, 20, 30);
  doc.text(`Date: ${new Date(job.quote.date).toLocaleDateString()}`, 20, 38);

  doc.text("Client Details:", 20, 55);
  doc.text(`Name: ${job.client}`, 20, 63);
  doc.text(`Address: ${job.address}`, 20, 71);

  doc.text("Financial Summary:", 20, 90);
  doc.text(`Total: £${job.quote.total.toFixed(2)}`, 20, 98);
  doc.text(`VAT: £${job.quote.vat.toFixed(2)}`, 20, 106);
  doc.text(`Deposit Required: £${job.quote.deposit.toFixed(2)}`, 20, 114);

  doc.text("Thank you for your business.", 20, 140);

  doc.save(`${job.quote.quoteNumber}.pdf`);
}

function openBrandSettings() {

  navigate("jobs");
  const el = document.getElementById("jobs-screen");

  el.innerHTML = `
    <div class="card">
      <h3>Brand Settings</h3>

      <label>Upload Company Logo</label>
      <input type="file" id="logoUpload" accept="image/*">

      <br><br>
      <button class="primary" onclick="saveLogo()">Save Logo</button>
    </div>
  `;
}

function saveLogo() {

  const fileInput = document.getElementById("logoUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a logo.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    state.logo = e.target.result;
    save();
    alert("Logo saved.");
    renderJobs();
  };

  reader.readAsDataURL(file);
}

function markInvoicePaid(jobIndex) {

  const job = state.jobs[jobIndex];

  if (!job.invoice) {
    alert("No invoice exists.");
    return;
  }

  job.invoice.status = "Paid";
  job.invoice.paidDate = new Date().toISOString();

  save();
  alert("Invoice marked as Paid.");
  renderJobs();
}

async function downloadInvoicePDF(jobIndex) {

  const job = state.jobs[jobIndex];

  if (!job.invoice) {
    alert("No invoice available.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  if (state.logo) {
    doc.addImage(state.logo, "PNG", 150, 10, 40, 20);
  }

  doc.setFontSize(18);
  doc.text("INVOICE", 20, 20);

  doc.setFontSize(12);
  doc.text(`Invoice No: ${job.invoice.invoiceNumber}`, 20, 30);
  doc.text(`Date: ${new Date(job.invoice.date).toLocaleDateString()}`, 20, 38);

  doc.text("Client Details:", 20, 55);
  doc.text(`Name: ${job.client}`, 20, 63);
  doc.text(`Address: ${job.address}`, 20, 71);

  doc.text("Financial Summary:", 20, 90);
  doc.text(`Total: £${job.invoice.total.toFixed(2)}`, 20, 98);
  doc.text(`VAT: £${job.invoice.vat.toFixed(2)}`, 20, 106);
  doc.text(`Status: ${job.invoice.status}`, 20, 114);

  if (job.invoice.paidDate) {
    doc.text(`Paid On: ${new Date(job.invoice.paidDate).toLocaleDateString()}`, 20, 122);
  }

  doc.save(`${job.invoice.invoiceNumber}.pdf`);
}

// Automatically enter the app when the script loads
login();
