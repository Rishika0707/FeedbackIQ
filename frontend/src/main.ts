
import "./style.css";

type Sentiment = "Positive" | "Negative" | "Neutral";

type Feedback = {
  id: number;
  customerName: string;
  message: string;
  sentiment: Sentiment;
  topic: string;
  summary: string;
  suggestedAction: string;
  analysisSource: string;
  createdAt: string;
};

type ApiFeedback = {
  id: number;
  customer_name: string;
  message: string;
  sentiment: Sentiment;
  topic: string;
  summary: string;
  suggested_action: string;
  analysis_source: string;
  created_at: string;
};

const API = "http://localhost:3000/api";

let records: Feedback[] = [];
let activeFilter = "All";
let searchTerm = "";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Could not find the #app element in index.html");
}

app.innerHTML = `
<div class="shell">
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">F</div>
      <div><b>FeedbackIQ</b><small>Customer intelligence</small></div>
    </div>

    <div class="nav-label">WORKSPACE</div>
    <a class="nav-item active" href="#overview"><span>◫</span> Overview</a>
    <a class="nav-item" href="#feedback"><span>▤</span> Feedback analysis</a>
    <a class="nav-item" href="#insights"><span>◉</span> Topic insights</a>

    <div class="sidebar-bottom">
      <div class="engine">
        <span class="pulse"></span>
        <div><b>AI engine</b><small id="engine-status">Connecting…</small></div>
      </div>
      <div class="profile">
        <div class="avatar">RD</div>
        <div><b>Rishika Dubey</b><small>Project workspace</small></div>
      </div>
    </div>
  </aside>

  <main class="main">
    <header class="topbar">
      <div>
        <span class="eyebrow">CUSTOMER EXPERIENCE</span>
        <h1>Overview</h1>
      </div>
      <div class="top-actions">
        <span class="date-chip" id="today"></span>
        <button class="btn btn-primary" id="export-btn">↓ Export CSV</button>
      </div>
    </header>

    <section class="welcome">
      <div>
        <span class="eyebrow light">FEEDBACK INTELLIGENCE</span>
        <h2>Understand every customer voice.</h2>
        <p>Turn raw feedback into clear signals and actionable insights.</p>
      </div>
      <div class="welcome-orb">✳</div>
    </section>

    <section class="stats" id="stats"></section>

    <section class="content-grid">
      <div class="panel chart-panel">
        <div class="panel-head">
          <div>
            <h3>Sentiment overview</h3>
            <p>How customers feel about your experience</p>
          </div>
          <span class="live-tag">● LIVE DATA</span>
        </div>
        <div class="sentiment-chart" id="sentiment-chart"></div>
      </div>

      <div class="panel topic-panel" id="insights">
        <div class="panel-head">
          <div>
            <h3>Customer topics</h3>
            <p>What customers are talking about</p>
          </div>
        </div>
        <div id="topic-list"></div>
      </div>
    </section>

    <section class="panel feedback-panel" id="feedback">
      <div class="panel-head feedback-head">
        <div>
          <h3>Recent feedback</h3>
          <p>Review, search and analyze customer messages</p>
        </div>
        <button class="btn btn-outline" id="add-toggle">＋ Add feedback</button>
      </div>

      <div class="toolbar">
        <input id="search" class="search" placeholder="⌕  Search customer or feedback…" />
        <div class="filters" id="filters">
          <button class="filter active" data-filter="All">All</button>
          <button class="filter" data-filter="Positive">Positive</button>
          <button class="filter" data-filter="Negative">Negative</button>
          <button class="filter" data-filter="Neutral">Neutral</button>
        </div>
      </div>

      <form class="add-form hidden" id="feedback-form">
        <div class="form-title">
          <b>Add customer feedback</b>
          <span>AI will classify the message automatically</span>
        </div>
        <div class="form-row">
          <input id="customer" required maxlength="120" placeholder="Customer name" />
          <textarea id="message" required minlength="5" maxlength="5000" placeholder="Paste or write customer feedback…"></textarea>
        </div>
        <div class="form-footer">
          <span id="form-note">Gemini AI analysis runs securely on the backend.</span>
          <button class="btn btn-primary" id="analyze-btn" type="submit">✦ Analyze with AI</button>
        </div>
      </form>

      <div id="feedback-list" class="feedback-list"></div>
      <div class="empty hidden" id="empty">No feedback found. Add a customer message to get started.</div>
    </section>

    <footer>
      <span>FEEDBACKIQ · CUSTOMER INTELLIGENCE</span>
      <span>NAME: RISHIKA DUBEY <i>·</i> ROLL NO: 361</span>
    </footer>
  </main>
</div>

<div id="toast" class="toast"></div>
`;

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
};

function escapeHTML(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] || char);
}

function toFeedback(item: ApiFeedback): Feedback {
  return {
    id: Number(item.id),
    customerName: item.customer_name || "Unknown customer",
    message: item.message || "",
    sentiment: item.sentiment,
    topic: item.topic || "General",
    summary: item.summary || "",
    suggestedAction: item.suggested_action || "",
    analysisSource: item.analysis_source || "unknown",
    createdAt: item.created_at || new Date().toISOString()
  };
}

function toast(message: string) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");

  window.setTimeout(() => {
    node.classList.remove("show");
  }, 3200);
}

function dateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function filteredRecords() {
  return records.filter(item =>
    (activeFilter === "All" || item.sentiment === activeFilter) &&
    `${item.customerName} ${item.message} ${item.topic}`
      .toLowerCase()
      .includes(searchTerm)
  );
}

function render() {
  const total = records.length;

  const count = (sentiment: Sentiment) =>
    records.filter(item => item.sentiment === sentiment).length;

  const positive = count("Positive");
  const negative = count("Negative");
  const neutral = count("Neutral");

  const pct = (number: number) =>
    total ? Math.round((number / total) * 100) : 0;

  $("#stats").innerHTML = `
    <article class="stat-card">
      <div class="stat-top"><span>Total feedback</span><span class="stat-icon violet">▤</span></div>
      <strong>${total}</strong>
      <small>Messages analyzed</small>
    </article>

    <article class="stat-card">
      <div class="stat-top"><span>Positive</span><span class="stat-icon green">↗</span></div>
      <strong>${positive}</strong>
      <small class="good">${pct(positive)}% of all feedback</small>
    </article>

    <article class="stat-card">
      <div class="stat-top"><span>Negative</span><span class="stat-icon red">↘</span></div>
      <strong>${negative}</strong>
      <small class="bad">${pct(negative)}% of all feedback</small>
    </article>

    <article class="stat-card">
      <div class="stat-top"><span>Neutral</span><span class="stat-icon blue">−</span></div>
      <strong>${neutral}</strong>
      <small>${pct(neutral)}% of all feedback</small>
    </article>
  `;

  const posPct = pct(positive);
  const negPct = pct(negative);
  const neuPct = pct(neutral);

  const deg1 = posPct * 3.6;
  const deg2 = deg1 + negPct * 3.6;

  $("#sentiment-chart").innerHTML = total
    ? `
      <div class="donut" style="background:conic-gradient(#55d6a4 0 ${deg1}deg,#fa7185 ${deg1}deg ${deg2}deg,#6d9eff ${deg2}deg 360deg)">
        <div class="donut-center"><b>${total}</b><span>responses</span></div>
      </div>
      <div class="legend">
        <div><i class="dot green-bg"></i><span>Positive</span><b>${posPct}%</b></div>
        <div><i class="dot red-bg"></i><span>Negative</span><b>${negPct}%</b></div>
        <div><i class="dot blue-bg"></i><span>Neutral</span><b>${neuPct}%</b></div>
      </div>
    `
    : `<div class="chart-empty">Your sentiment chart will appear after the first analysis.</div>`;

  const topicCounts = new Map<string, number>();

  records.forEach(item => {
    topicCounts.set(
      item.topic,
      (topicCounts.get(item.topic) || 0) + 1
    );
  });

  const topics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  $("#topic-list").innerHTML = topics.length
    ? topics.map(([name, value]) => `
        <div class="topic-row">
          <div><span>${escapeHTML(name)}</span><b>${value}</b></div>
          <div class="bar"><i style="width:${Math.max(8, value / total * 100)}%"></i></div>
        </div>
      `).join("")
    : `<div class="chart-empty">Topics will appear here as feedback is analyzed.</div>`;

  const shown = filteredRecords();

  $("#feedback-list").innerHTML = shown.map(item => `
    <article class="feedback-item">
      <div class="feedback-avatar">${escapeHTML(item.customerName.slice(0, 1).toUpperCase())}</div>

      <div class="feedback-body">
        <div class="feedback-meta">
          <b>${escapeHTML(item.customerName)}</b>
          <span>${dateLabel(item.createdAt)}</span>
        </div>

        <p>${escapeHTML(item.message)}</p>

        <div class="feedback-tags">
          <span class="sentiment ${item.sentiment.toLowerCase()}">${escapeHTML(item.sentiment)}</span>
          <span class="topic-tag">${escapeHTML(item.topic)}</span>
          <span class="source-tag">${item.analysisSource === "gemini" ? "✦ Gemini AI" : "Demo analysis"}</span>
        </div>

        <div class="ai-insight">
          <b>AI insight</b>
          <span>${escapeHTML(item.summary)}</span>
          <small>Suggested action: ${escapeHTML(item.suggestedAction)}</small>
        </div>
      </div>

      <button class="delete-btn" data-delete="${item.id}" title="Delete feedback" aria-label="Delete feedback">×</button>
    </article>
  `).join("");

  $("#empty").classList.toggle("hidden", shown.length > 0);
}

async function loadFeedback() {
  try {
    const response = await fetch(`${API}/feedback`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not load feedback");
    }

    records = (data.feedback || []).map((item: ApiFeedback) =>
      toFeedback(item)
    );

    render();
  } catch (error) {
    console.error("Load feedback error:", error);

    $("#feedback-list").innerHTML = `
      <div class="error-note">
        Cannot reach NestJS. Make sure your backend is running on port 3000 and PostgreSQL is connected.
      </div>
    `;
  }
}

async function checkHealth() {
  try {
    const response = await fetch(`${API}/database/test`);
    const data = await response.json();

    $("#engine-status").textContent =
      response.ok && data.success
        ? "NestJS + PostgreSQL connected"
        : "Database unavailable";
  } catch (error) {
    console.error("Backend health check:", error);
    $("#engine-status").textContent = "Backend offline";
  }
}

$("#today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short"
});

$("#add-toggle").addEventListener("click", () => {
  $("#feedback-form").classList.toggle("hidden");
});

$("#feedback-form").addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("#analyze-btn") as HTMLButtonElement;
  const customerInput = $("#customer") as HTMLInputElement;
  const messageInput = $("#message") as HTMLTextAreaElement;

  button.disabled = true;
  button.textContent = "Analyzing…";

  try {
    const response = await fetch(`${API}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerName: customerInput.value.trim(),
        message: messageInput.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.feedback) {
      throw new Error(
        data.message || "Feedback analysis failed. Please try again."
      );
    }

    const savedFeedback = toFeedback(data.feedback);

    records.unshift(savedFeedback);

    ($("#feedback-form") as HTMLFormElement).reset();
    $("#feedback-form").classList.add("hidden");

    render();

    toast(
      savedFeedback.analysisSource === "gemini"
        ? "Feedback analyzed with Gemini and saved."
        : "Feedback analysis complete and saved."
    );
  } catch (error) {
    console.error("Submit feedback error:", error);

    toast(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    button.disabled = false;
    button.textContent = "✦ Analyze with AI";
  }
});

$("#filters").addEventListener("click", event => {
  const target = (event.target as HTMLElement)
    .closest<HTMLButtonElement>("[data-filter]");

  if (!target) return;

  activeFilter = target.dataset.filter || "All";

  document.querySelectorAll(".filter").forEach(element => {
    element.classList.remove("active");
  });

  target.classList.add("active");
  render();
});

$("#search").addEventListener("input", event => {
  searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  render();
});

$("#feedback-list").addEventListener("click", async event => {
  const target = (event.target as HTMLElement)
    .closest<HTMLButtonElement>("[data-delete]");

  if (!target) return;

  if (!confirm("Delete this feedback record?")) return;

  const id = Number(target.dataset.delete);

  try {
    const response = await fetch(`${API}/feedback/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Delete failed");
    }

    records = records.filter(item => item.id !== id);

    render();
    toast("Feedback deleted successfully.");
  } catch (error) {
    console.error("Delete feedback error:", error);

    toast(
      error instanceof Error
        ? error.message
        : "Delete failed. Please try again."
    );
  }
});

$("#export-btn").addEventListener("click", () => {
  if (!records.length) {
    toast("There is no feedback to export yet.");
    return;
  }

  const columns: (keyof Feedback)[] = [
    "id",
    "customerName",
    "message",
    "sentiment",
    "topic",
    "summary",
    "suggestedAction",
    "analysisSource",
    "createdAt"
  ];

  const csvCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    columns.join(","),
    ...records.map(row =>
      columns.map(key => csvCell(row[key])).join(",")
    )
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "feedbackiq-export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  toast("CSV exported. Ready for Power BI.");
});

render();
loadFeedback();
checkHealth();
