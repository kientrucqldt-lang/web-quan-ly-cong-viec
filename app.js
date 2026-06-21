/* ============================================================
   Quản lý công việc - Phòng Kinh tế, Hạ tầng và Đô thị
   Phường Thống Nhất
   Dữ liệu lưu cục bộ trên trình duyệt (localStorage).
   ============================================================ */

const STORE_KEY = "ktht_thongnhat_data_v1";

const FIELDS = [
  "Trật tự xây dựng & cấp phép",
  "Quản lý đất đai",
  "Dự án đầu tư",
  "Quy hoạch & đô thị",
  "Hành chính công",
  "Chương trình MTQG",
  "Phát triển nhà ở",
  "Kinh tế - ngân sách",
  "Môi trường",
  "Giao thông - hạ tầng",
  "Công tác Đảng - nội bộ phòng",
  "Khác",
];

let state = load();

/* ---------- Lưu / nạp dữ liệu ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn(e); }
  return { tasks: [], staff: [] };
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- Tiện ích ngày ---------- */
function today0() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function parseDate(s) { if (!s) return null; const d = new Date(s + "T00:00:00"); return isNaN(d) ? null : d; }
function fmtDate(s) {
  const d = parseDate(s); if (!d) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function daysLeft(s) {
  const d = parseDate(s); if (!d) return null;
  return Math.round((d - today0()) / 86400000);
}
function isOverdue(t) {
  if (t.status === "Hoàn thành") return false;
  const dl = daysLeft(t.due);
  return dl !== null && dl < 0;
}

/* ---------- Trạng thái hiển thị ---------- */
function effStatus(t) { return isOverdue(t) ? "Quá hạn" : t.status; }
function statusClass(s) {
  return { "Hoàn thành":"done", "Đang thực hiện":"doing", "Chờ xử lý":"wait",
           "Chưa bắt đầu":"new", "Quá hạn":"over" }[s] || "new";
}

/* ============================================================
   ĐIỀU HƯỚNG TAB
   ============================================================ */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    renderAll();
  });
});

/* ============================================================
   ĐẦU VIỆC
   ============================================================ */
const taskModal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");

function openTaskModal(task) {
  document.getElementById("task-modal-title").textContent = task ? "Sửa đầu việc" : "Thêm đầu việc";
  document.getElementById("task-id").value = task ? task.id : "";
  document.getElementById("task-title").value = task ? task.title : "";
  document.getElementById("task-field").value = task ? task.field : FIELDS[0];
  document.getElementById("task-assignee").value = task ? (task.assignee || "") : "";
  document.getElementById("task-priority").value = task ? task.priority : "Trung bình";
  document.getElementById("task-status").value = task ? task.status : "Chưa bắt đầu";
  document.getElementById("task-start").value = task ? (task.start || "") : "";
  document.getElementById("task-due").value = task ? (task.due || "") : "";
  document.getElementById("task-progress").value = task ? task.progress : 0;
  document.getElementById("progress-val").textContent = task ? task.progress : 0;
  document.getElementById("task-notes").value = task ? (task.notes || "") : "";
  taskModal.hidden = false;
}
function closeTaskModal() { taskModal.hidden = true; }

document.getElementById("btn-add-task").addEventListener("click", () => openTaskModal(null));
document.getElementById("task-progress").addEventListener("input", e => {
  document.getElementById("progress-val").textContent = e.target.value;
});

taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("task-id").value;
  const data = {
    title: document.getElementById("task-title").value.trim(),
    field: document.getElementById("task-field").value,
    assignee: document.getElementById("task-assignee").value,
    priority: document.getElementById("task-priority").value,
    status: document.getElementById("task-status").value,
    start: document.getElementById("task-start").value,
    due: document.getElementById("task-due").value,
    progress: +document.getElementById("task-progress").value,
    notes: document.getElementById("task-notes").value.trim(),
  };
  if (data.status === "Hoàn thành" && data.progress < 100) data.progress = 100;
  if (id) {
    const t = state.tasks.find(x => x.id === id);
    Object.assign(t, data);
  } else {
    state.tasks.push({ id: uid(), createdAt: new Date().toISOString(), ...data });
  }
  save(); closeTaskModal(); renderAll();
});

function deleteTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (confirm(`Xóa công việc “${t.title}”?`)) {
    state.tasks = state.tasks.filter(x => x.id !== id);
    save(); renderAll();
  }
}

function filteredTasks() {
  const q = document.getElementById("search-task").value.toLowerCase();
  const ff = document.getElementById("filter-field").value;
  const fs = document.getElementById("filter-status").value;
  const fa = document.getElementById("filter-assignee").value;
  return state.tasks.filter(t => {
    if (q && !t.title.toLowerCase().includes(q)) return false;
    if (ff && t.field !== ff) return false;
    if (fs && t.status !== fs) return false;
    if (fa && t.assignee !== fa) return false;
    return true;
  });
}

function renderTasks() {
  const tbody = document.getElementById("task-tbody");
  const list = filteredTasks().slice().sort((a, b) => {
    const da = daysLeft(a.due), db = daysLeft(b.due);
    if (da === null) return 1; if (db === null) return -1;
    return da - db;
  });
  tbody.innerHTML = "";
  document.getElementById("task-empty").style.display = list.length ? "none" : "block";

  for (const t of list) {
    const es = effStatus(t);
    const dl = daysLeft(t.due);
    let dueExtra = "";
    if (dl !== null && t.status !== "Hoàn thành") {
      if (dl < 0) dueExtra = `<span class="days-left over">quá ${Math.abs(dl)} ngày</span>`;
      else if (dl <= 7) dueExtra = `<span class="days-left soon">còn ${dl} ngày</span>`;
    }
    const priCls = t.priority === "Khẩn" ? "pri-khan" : (t.priority === "Cao" ? "pri-cao" : "");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="task-title">${esc(t.title)}</div>
        ${t.notes ? `<div class="task-notes-sm">${esc(t.notes).slice(0,80)}</div>` : ""}
      </td>
      <td><span class="badge b-field">${esc(t.field)}</span></td>
      <td>${esc(t.assignee || "—")}</td>
      <td><span class="${priCls}">${esc(t.priority)}</span></td>
      <td>${fmtDate(t.due)} ${dueExtra}</td>
      <td>
        <div class="prog-mini">
          <div class="track"><div class="fill" style="width:${t.progress}%"></div></div>
          <span>${t.progress}%</span>
        </div>
      </td>
      <td><span class="badge b-st-${statusClass(es)}">${es}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-edit="${t.id}" title="Sửa">✏️</button>
          <button class="icon-btn del" data-del="${t.id}" title="Xóa">🗑️</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("[data-edit]").forEach(b =>
    b.addEventListener("click", () => openTaskModal(state.tasks.find(x => x.id === b.dataset.edit))));
  tbody.querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => deleteTask(b.dataset.del)));
}

["search-task","filter-field","filter-status","filter-assignee"].forEach(id =>
  document.getElementById(id).addEventListener("input", renderTasks));

/* ============================================================
   TỔNG QUAN
   ============================================================ */
function renderDashboard() {
  const ts = state.tasks;
  const total = ts.length;
  const done = ts.filter(t => t.status === "Hoàn thành").length;
  const doing = ts.filter(t => t.status === "Đang thực hiện").length;
  const over = ts.filter(isOverdue).length;

  document.getElementById("stat-grid").innerHTML = `
    <div class="stat total"><div class="num">${total}</div><div class="lbl">Tổng đầu việc</div></div>
    <div class="stat doing"><div class="num">${doing}</div><div class="lbl">Đang thực hiện</div></div>
    <div class="stat done"><div class="num">${done}</div><div class="lbl">Đã hoàn thành</div></div>
    <div class="stat over"><div class="num">${over}</div><div class="lbl">Quá hạn</div></div>`;

  // Chart theo lĩnh vực (số việc)
  const byField = {};
  ts.forEach(t => byField[t.field] = (byField[t.field] || 0) + 1);
  const maxF = Math.max(1, ...Object.values(byField));
  document.getElementById("chart-field").innerHTML = Object.keys(byField).length
    ? Object.entries(byField).sort((a,b)=>b[1]-a[1]).map(([f,n]) => `
      <div class="bar-row">
        <div class="bar-label">${esc(f)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${n/maxF*100}%;background:#3b82f6"></div></div>
        <div class="bar-val">${n}</div>
      </div>`).join("")
    : `<p class="empty">Chưa có dữ liệu.</p>`;

  // Chart theo trạng thái
  const stOrder = ["Chưa bắt đầu","Đang thực hiện","Chờ xử lý","Hoàn thành","Quá hạn"];
  const stColor = {"Chưa bắt đầu":"#9ca3af","Đang thực hiện":"#d97706","Chờ xử lý":"#7c3aed","Hoàn thành":"#16a34a","Quá hạn":"#dc2626"};
  const byStatus = {};
  ts.forEach(t => { const s = effStatus(t); byStatus[s] = (byStatus[s]||0)+1; });
  const maxS = Math.max(1, ...Object.values(byStatus));
  document.getElementById("chart-status").innerHTML = total
    ? stOrder.filter(s=>byStatus[s]).map(s => `
      <div class="bar-row">
        <div class="bar-label">${s}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${byStatus[s]/maxS*100}%;background:${stColor[s]}"></div></div>
        <div class="bar-val">${byStatus[s]}</div>
      </div>`).join("")
    : `<p class="empty">Chưa có dữ liệu.</p>`;

  // Việc sắp đến hạn & quá hạn
  const due = ts.filter(t => t.status !== "Hoàn thành" && daysLeft(t.due) !== null && daysLeft(t.due) <= 7)
    .sort((a,b)=>daysLeft(a.due)-daysLeft(b.due));
  document.getElementById("dash-due").innerHTML = due.length
    ? due.map(t => {
        const dl = daysLeft(t.due);
        const cls = dl < 0 ? "over" : "soon";
        const txt = dl < 0 ? `Quá hạn ${Math.abs(dl)} ngày` : (dl === 0 ? "Đến hạn hôm nay" : `Còn ${dl} ngày`);
        return `<div class="cal-item"><div class="t">${esc(t.title)}</div>
          <div class="m"><span>${esc(t.field)}</span><span>${esc(t.assignee||"Chưa giao")}</span>
          <span class="days-left ${cls}">${txt} (${fmtDate(t.due)})</span></div></div>`;
      }).join("")
    : `<p class="empty">✅ Không có việc nào sắp đến hạn trong 7 ngày.</p>`;
}

/* ============================================================
   LỊCH & HẠN
   ============================================================ */
function renderCalendar() {
  const buckets = { over: [], soon: [], later: [], none: [] };
  state.tasks.filter(t => t.status !== "Hoàn thành").forEach(t => {
    const dl = daysLeft(t.due);
    if (dl === null) buckets.none.push(t);
    else if (dl < 0) buckets.over.push(t);
    else if (dl <= 7) buckets.soon.push(t);
    else buckets.later.push(t);
  });
  const item = t => {
    const dl = daysLeft(t.due);
    let badge = "";
    if (dl !== null) {
      const cls = dl < 0 ? "over" : (dl <= 7 ? "soon" : "");
      const txt = dl < 0 ? `quá ${Math.abs(dl)}ng` : (dl === 0 ? "hôm nay" : `còn ${dl}ng`);
      badge = `<span class="days-left ${cls}">${txt}</span>`;
    }
    return `<div class="cal-item"><div class="t">${esc(t.title)}</div>
      <div class="m"><span>${esc(t.field)}</span><span>${esc(t.assignee||"Chưa giao")}</span>
      <span>${fmtDate(t.due)}</span>${badge}</div></div>`;
  };
  const fill = (elId, arr) => {
    const el = document.getElementById(elId);
    arr.sort((a,b)=>{ const x=daysLeft(a.due),y=daysLeft(b.due); if(x===null)return 1; if(y===null)return -1; return x-y; });
    el.innerHTML = arr.length ? arr.map(item).join("") : `<p class="empty" style="padding:14px">— Không có —</p>`;
  };
  fill("cal-overdue", buckets.over);
  fill("cal-soon", buckets.soon);
  fill("cal-later", buckets.later);
  fill("cal-none", buckets.none);
}

/* ============================================================
   CÁN BỘ
   ============================================================ */
const staffModal = document.getElementById("staff-modal");
const staffForm = document.getElementById("staff-form");

function openStaffModal(s) {
  document.getElementById("staff-modal-title").textContent = s ? "Sửa thông tin cán bộ" : "Thêm cán bộ";
  document.getElementById("staff-id").value = s ? s.id : "";
  document.getElementById("staff-name").value = s ? s.name : "";
  document.getElementById("staff-role").value = s ? (s.role||"") : "";
  document.getElementById("staff-area").value = s ? (s.area||"") : "";
  staffModal.hidden = false;
}
document.getElementById("btn-add-staff").addEventListener("click", () => openStaffModal(null));

staffForm.addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("staff-id").value;
  const data = {
    name: document.getElementById("staff-name").value.trim(),
    role: document.getElementById("staff-role").value.trim(),
    area: document.getElementById("staff-area").value.trim(),
  };
  if (id) Object.assign(state.staff.find(x=>x.id===id), data);
  else state.staff.push({ id: uid(), ...data });
  save(); staffModal.hidden = true; renderAll();
});

function deleteStaff(id) {
  const s = state.staff.find(x=>x.id===id);
  if (confirm(`Xóa cán bộ “${s.name}”? (Các việc đã giao sẽ chuyển về “Chưa giao”.)`)) {
    state.tasks.forEach(t => { if (t.assignee === s.name) t.assignee = ""; });
    state.staff = state.staff.filter(x=>x.id!==id);
    save(); renderAll();
  }
}

function renderStaff() {
  const grid = document.getElementById("staff-grid");
  if (!state.staff.length) {
    grid.innerHTML = `<p class="empty">Chưa có cán bộ nào. Bấm “＋ Thêm cán bộ”.</p>`;
    return;
  }
  grid.innerHTML = state.staff.map(s => {
    const mine = state.tasks.filter(t => t.assignee === s.name);
    const open = mine.filter(t => t.status !== "Hoàn thành").length;
    const over = mine.filter(isOverdue).length;
    const initial = (s.name.trim().split(/\s+/).pop()[0] || "?").toUpperCase();
    return `<div class="staff-card">
      <div class="sactions">
        <button class="icon-btn" data-edit-s="${s.id}" title="Sửa">✏️</button>
        <button class="icon-btn del" data-del-s="${s.id}" title="Xóa">🗑️</button>
      </div>
      <div class="avatar">${esc(initial)}</div>
      <div class="sname">${esc(s.name)}</div>
      <div class="srole">${esc(s.role || "—")}</div>
      ${s.area ? `<div class="sarea">📌 ${esc(s.area)}</div>` : ""}
      <div class="scount">Đang đảm nhận: <b>${open}</b> việc${over ? ` · <span style="color:#dc2626">${over} quá hạn</span>` : ""}</div>
    </div>`;
  }).join("");
  grid.querySelectorAll("[data-edit-s]").forEach(b =>
    b.addEventListener("click", () => openStaffModal(state.staff.find(x=>x.id===b.dataset.editS))));
  grid.querySelectorAll("[data-del-s]").forEach(b =>
    b.addEventListener("click", () => deleteStaff(b.dataset.delS)));
}

/* ============================================================
   DROPDOWN ĐỘNG (lĩnh vực, cán bộ)
   ============================================================ */
function refreshSelects() {
  // Lĩnh vực
  const fieldOpts = FIELDS.map(f => `<option>${esc(f)}</option>`).join("");
  document.getElementById("task-field").innerHTML = fieldOpts;
  document.getElementById("filter-field").innerHTML =
    `<option value="">Tất cả lĩnh vực</option>` + fieldOpts;
  const impDef = document.getElementById("imp-default-field");
  if (impDef) impDef.innerHTML = fieldOpts;

  // Cán bộ
  const staffOpts = state.staff.map(s => `<option>${esc(s.name)}</option>`).join("");
  document.getElementById("task-assignee").innerHTML =
    `<option value="">— Chưa giao —</option>` + staffOpts;
  document.getElementById("filter-assignee").innerHTML =
    `<option value="">Tất cả cán bộ</option>` + staffOpts;
}

/* ============================================================
   XUẤT / NHẬP FILE SAO LƯU
   ============================================================ */
document.getElementById("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sao-luu-cong-viec-ktht-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById("btn-import").addEventListener("click", () =>
  document.getElementById("file-input").click());
document.getElementById("file-input").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.tasks || !Array.isArray(data.tasks)) throw new Error("Sai định dạng");
      if (confirm("Nhập dữ liệu sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?")) {
        state = { tasks: data.tasks || [], staff: data.staff || [] };
        save(); renderAll();
        alert("Đã nhập dữ liệu thành công.");
      }
    } catch (err) { alert("File không hợp lệ: " + err.message); }
    e.target.value = "";
  };
  reader.readAsText(file);
});

/* ---------- Đóng modal ---------- */
document.querySelectorAll("[data-close]").forEach(b =>
  b.addEventListener("click", () => { taskModal.hidden = true; staffModal.hidden = true; }));
document.querySelectorAll(".modal-overlay").forEach(o =>
  o.addEventListener("click", e => { if (e.target === o) o.hidden = true; }));

/* ---------- Escape HTML ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ============================================================
   NHẬP TỪ VĂN BẢN ĐẾN (Excel / CSV)
   ============================================================ */
const importModal = document.getElementById("import-modal");
let impHeaders = [];   // tên cột trong file
let impRows = [];      // dữ liệu (mảng các mảng)

const IMP_TARGETS = [
  ["ignore",   "— Bỏ qua —"],
  ["title",    "★ Tên công việc (Trích yếu)"],
  ["field",    "Lĩnh vực"],
  ["assignee", "Cán bộ phụ trách"],
  ["due",      "Hạn xử lý"],
  ["priority", "Mức ưu tiên / Độ khẩn"],
  ["so_den",   "Số đến"],
  ["ky_hieu",  "Số ký hiệu"],
  ["co_quan",  "Cơ quan ban hành"],
  ["ngay_den", "Ngày đến"],
  ["notes",    "Ghi chú / Nội dung"],
];

// Bỏ dấu tiếng Việt + chuẩn hóa để dò tên cột
function normVi(s) {
  return String(s).toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/đ/g, "d").replace(/\s+/g, " ").trim();
}
function guessTarget(header) {
  const h = normVi(header);
  if (/(trich yeu|noi dung van ban|tieu de)/.test(h)) return "title";
  if (/linh vuc/.test(h)) return "field";
  if (/(nguoi xu ly|don vi xu ly|xu ly chinh|chuyen vien|phu trach|nguoi nhan)/.test(h)) return "assignee";
  if (/(han xu ly|han giai quyet|ngay het han|han xl|thoi han)/.test(h)) return "due";
  if (/(do khan|muc do khan|^khan$)/.test(h)) return "priority";
  if (/so den|so thu tu den|so vb den/.test(h)) return "so_den";
  if (/(so ky hieu|so\/ky hieu|so kh|so, ky hieu|so va ky hieu)/.test(h)) return "ky_hieu";
  if (/(co quan|noi gui|noi ban hanh|don vi gui|ban hanh)/.test(h)) return "co_quan";
  if (/ngay den/.test(h)) return "ngay_den";
  if (/(ngay van ban|ngay ban hanh|ghi chu|noi dung)/.test(h)) return "notes";
  return "ignore";
}

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function toISODate(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return isoFromDate(v);
  if (typeof v === "number" && window.XLSX && XLSX.SSF) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d && d.y) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) { let [_, d, mo, y] = m; if (y.length === 2) y = "20" + y; return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`; }
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) { let [_, y, mo, d] = m; return `${y}-${mo.padStart(2,"0")}-${d.padStart(2,"0")}`; }
  return "";
}
function mapPriority(v) {
  const h = normVi(v);
  if (/hoa toc/.test(h)) return "Khẩn";
  if (/thuong khan|thuong[\s-]*khan/.test(h)) return "Khẩn";
  if (/khan/.test(h)) return "Khẩn";
  if (/cao/.test(h)) return "Cao";
  return "Trung bình";
}

document.getElementById("btn-import-vb").addEventListener("click", () =>
  document.getElementById("vb-file-input").click());

// Bộ đọc CSV thuần (không cần thư viện) — hỗ trợ dấu , ; tab và ô có dấu ngoặc kép
function parseCSVText(text) {
  text = text.replace(/^﻿/, "");
  const nl = text.indexOf("\n");
  const firstLine = nl >= 0 ? text.slice(0, nl) : text;
  const cnt = ch => (firstLine.match(new RegExp("\\" + ch, "g")) || []).length;
  let delim = ",";
  if (cnt(";") > cnt(",")) delim = ";";
  else if ((firstLine.match(/\t/g) || []).length > cnt(",")) delim = "\t";
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

document.getElementById("vb-file-input").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let aoa = null;
    // 1) Thử đọc bằng SheetJS (xlsx/xls/csv) nếu thư viện sẵn sàng
    if (window.XLSX) {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result), { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
      } catch (err) { aoa = null; }
    }
    // 2) Dự phòng: tự đọc dạng văn bản (CSV) — dùng khi không có thư viện hoặc file là .csv
    if (!aoa || !aoa.length) {
      try {
        const text = new TextDecoder("utf-8").decode(reader.result);
        const csv = parseCSVText(text);
        if (csv.length) aoa = csv;
      } catch (err) { /* bỏ qua */ }
    }
    if (!aoa || !aoa.length) {
      alert("Không đọc được dữ liệu từ file. Hãy thử kết xuất lại ở định dạng .xlsx hoặc .csv rồi nhập lại.");
      e.target.value = ""; return;
    }
    // Tìm dòng tiêu đề: dòng đầu tiên có >=2 ô chữ
    let hi = aoa.findIndex(r => r.filter(c => String(c).trim()).length >= 2);
    if (hi < 0) hi = 0;
    impHeaders = (aoa[hi] || []).map(c => String(c).trim());
    impRows = aoa.slice(hi + 1).filter(r => r.some(c => String(c).trim() !== ""));
    if (!impHeaders.length || !impRows.length) {
      alert(`Đọc được ${aoa.length} dòng nhưng không thấy bảng dữ liệu hợp lệ. Hãy kiểm tra file có hàng tiêu đề cột không.`);
      e.target.value = ""; return;
    }
    openImportModal();
    e.target.value = "";
  };
  reader.readAsArrayBuffer(file);
});

function openImportModal() {
  document.getElementById("imp-count").textContent = impRows.length;
  // Lưới ánh xạ cột
  document.getElementById("imp-map").innerHTML = impHeaders.map((h, i) => {
    const g = guessTarget(h);
    const opts = IMP_TARGETS.map(([v, lbl]) =>
      `<option value="${v}" ${v === g ? "selected" : ""}>${lbl}</option>`).join("");
    const sample = (impRows[0] && impRows[0][i] != null) ? String(impRows[0][i]).slice(0, 28) : "";
    return `<div class="map-row">
      <div class="col-name">${esc(h || "(cột " + (i+1) + ")")} ${sample ? `<small>vd: ${esc(sample)}</small>` : ""}</div>
      <select data-idx="${i}">${opts}</select>
    </div>`;
  }).join("");
  // Bảng xem trước
  const head = impHeaders.map(h => `<th>${esc(h)}</th>`).join("");
  const body = impRows.slice(0, 6).map(r =>
    `<tr>${impHeaders.map((_, i) => `<td>${esc(r[i] != null ? (r[i] instanceof Date ? fmtDate(isoFromDate(r[i])) : r[i]) : "")}</td>`).join("")}</tr>`
  ).join("");
  document.getElementById("imp-preview").innerHTML =
    `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  importModal.hidden = false;
}

document.getElementById("imp-confirm").addEventListener("click", () => {
  const sels = [...document.querySelectorAll("#imp-map select")];
  const map = {};                       // target -> column index
  sels.forEach(s => { const t = s.value; if (t !== "ignore" && map[t] === undefined) map[t] = +s.dataset.idx; });
  if (map.title === undefined) {
    alert("Vui lòng chọn một cột làm “Tên công việc (Trích yếu)”.");
    return;
  }
  const defField = document.getElementById("imp-default-field").value;
  const defStatus = document.getElementById("imp-default-status").value;
  const skipDup = document.getElementById("imp-skip-dup").checked;

  const existKeys = new Set(state.tasks.map(t => (t.docNo || "") + "|" + (t.docSymbol || "")).filter(k => k !== "|"));
  const cell = (r, t) => map[t] !== undefined ? r[map[t]] : "";

  let added = 0, skipped = 0;
  impRows.forEach(r => {
    const title = String(cell(r, "title") || "").trim();
    if (!title) { skipped++; return; }
    const docNo = String(cell(r, "so_den") || "").trim();
    const docSym = String(cell(r, "ky_hieu") || "").trim();
    const key = docNo + "|" + docSym;
    if (skipDup && key !== "|" && existKeys.has(key)) { skipped++; return; }

    const agency = String(cell(r, "co_quan") || "").trim();
    const arrive = toISODate(cell(r, "ngay_den"));
    const extraNote = String(cell(r, "notes") || "").trim();
    const noteParts = [];
    if (docNo) noteParts.push("Số đến: " + docNo);
    if (docSym) noteParts.push("Số KH: " + docSym);
    if (agency) noteParts.push("CQ ban hành: " + agency);
    if (arrive) noteParts.push("Ngày đến: " + fmtDate(arrive));
    if (extraNote) noteParts.push(extraNote);

    const fieldVal = String(cell(r, "field") || "").trim() || defField;

    state.tasks.push({
      id: uid(),
      title,
      field: fieldVal,
      assignee: String(cell(r, "assignee") || "").trim(),
      priority: map.priority !== undefined ? mapPriority(cell(r, "priority")) : "Trung bình",
      status: defStatus,
      start: arrive,
      due: toISODate(cell(r, "due")),
      progress: 0,
      notes: noteParts.join(" · "),
      docNo, docSymbol: docSym, docAgency: agency,
      source: "vanban-den",
      createdAt: new Date().toISOString(),
    });
    if (key !== "|") existKeys.add(key);
    added++;
  });

  save();
  importModal.hidden = true;
  renderAll();
  // chuyển sang tab Đầu việc
  document.querySelector('.tab[data-tab="tasks"]').click();
  alert(`Đã nhập ${added} văn bản thành đầu việc.` + (skipped ? `\nBỏ qua ${skipped} dòng (trùng hoặc thiếu trích yếu).` : ""));
});

/* ============================================================
   RENDER TỔNG
   ============================================================ */
function renderAll() {
  refreshSelects();
  renderDashboard();
  renderTasks();
  renderCalendar();
  renderStaff();
}

/* ---------- Dữ liệu mẫu lần đầu ---------- */
function seedIfEmpty() {
  if (state.tasks.length || state.staff.length) return;
  state.staff = [
    { id: uid(), name: "Nguyễn Văn A", role: "Trưởng phòng", area: "Phụ trách chung" },
    { id: uid(), name: "Trần Thị B", role: "Chuyên viên", area: "Trật tự xây dựng & cấp phép" },
    { id: uid(), name: "Lê Văn C", role: "Chuyên viên", area: "Quản lý đất đai, môi trường" },
  ];
  const d = (n) => { const x = new Date(); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };
  state.tasks = [
    { id: uid(), title: "Kiểm tra trật tự xây dựng tổ dân phố 5", field: "Trật tự xây dựng & cấp phép",
      assignee: "Trần Thị B", priority: "Cao", status: "Đang thực hiện", start: d(-5), due: d(3),
      progress: 40, notes: "Phối hợp với địa chính kiểm tra công trình không phép.", createdAt: new Date().toISOString() },
    { id: uid(), title: "Tổng hợp báo cáo đất công trên địa bàn phường", field: "Quản lý đất đai",
      assignee: "Lê Văn C", priority: "Trung bình", status: "Chờ xử lý", start: d(-10), due: d(-2),
      progress: 70, notes: "Đang chờ số liệu từ các tổ dân phố.", createdAt: new Date().toISOString() },
    { id: uid(), title: "Rà soát tiến độ dự án đầu tư công năm 2026", field: "Dự án đầu tư",
      assignee: "Nguyễn Văn A", priority: "Khẩn", status: "Đang thực hiện", start: d(-3), due: d(1),
      progress: 55, notes: "", createdAt: new Date().toISOString() },
    { id: uid(), title: "Cập nhật chương trình mục tiêu quốc gia NTM", field: "Chương trình MTQG",
      assignee: "", priority: "Trung bình", status: "Chưa bắt đầu", start: "", due: d(20),
      progress: 0, notes: "", createdAt: new Date().toISOString() },
  ];
  save();
}

seedIfEmpty();
renderAll();
