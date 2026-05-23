const queueStatusPill = document.querySelector("#queueStatusPill");
const queueStatusText = document.querySelector("#queueStatusText");
const latestRwlMetric = document.querySelector("#latestRwlMetric");
const upcomingQueueList = document.querySelector("#upcomingQueueList");
const rwlGrid = document.querySelector("#rwlGrid");
const rwlCountText = document.querySelector("#rwlCountText");

initOverviewQueueSync();

async function initOverviewQueueSync() {
  try {
    const response = await fetch(`./TASK_QUEUE.md?cache=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Task queue unavailable");
    const text = await response.text();
    const queue = parseTaskQueue(text);
    renderQueueOverview(queue);
  } catch {
    setQueueStatus("Static overview", "Task queue sync is unavailable in this mode; showing the embedded overview snapshot.");
  }
}

function parseTaskQueue(text) {
  const later = sectionLines(text, "Later")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
  const done = sectionLines(text, "Done")
    .filter((line) => line.startsWith("- "))
    .map(parseDoneLine)
    .filter(Boolean);
  return { later, done };
}

function sectionLines(text, heading) {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  if (start < 0) return [];
  const rest = text.slice(start + marker.length);
  const end = rest.search(/\n## /);
  return (end >= 0 ? rest.slice(0, end) : rest)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseDoneLine(line) {
  const match = line.match(/^-\s+(RWL-\d+|UX-\d+):\s+(.+)$/);
  if (!match) return null;
  const [, id, detail] = match;
  const clean = detail.replace(/\.$/, "");
  const [title, description] = splitDetail(clean);
  return { id, title, description };
}

function splitDetail(detail) {
  const lowered = detail.toLowerCase();
  const verbs = ["added ", "refreshed ", "replaced "];
  const verb = verbs.find((item) => lowered.startsWith(item));
  const withoutVerb = verb ? detail.slice(verb.length) : detail;
  const words = withoutVerb.split(" ");
  const title = words.slice(0, Math.min(words.length, 5)).join(" ");
  return [capitalizeTitle(title), withoutVerb];
}

function capitalizeTitle(value) {
  return String(value || "")
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function renderQueueOverview(queue) {
  const latest = queue.done[0];
  if (latestRwlMetric && latest) latestRwlMetric.textContent = latest.id;
  if (rwlCountText) rwlCountText.textContent = `${queue.done.length} completed items tracked from TASK_QUEUE.md`;
  if (upcomingQueueList && queue.later.length) {
    upcomingQueueList.innerHTML = queue.later.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
  if (rwlGrid && queue.done.length) {
    rwlGrid.innerHTML = queue.done
      .slice(0, 6)
      .map(
        (item) => `
          <article>
            <b>${escapeHtml(item.id)}</b>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.description)}</span>
          </article>
        `
      )
      .join("");
  }
  setQueueStatus("Queue synced", `${queue.done.length} completed items and ${queue.later.length} upcoming items loaded from TASK_QUEUE.md.`);
}

function setQueueStatus(label, text) {
  if (queueStatusPill) queueStatusPill.textContent = label;
  if (queueStatusText) queueStatusText.textContent = text;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}