/* Student cabinet — shown at the top of every student site (index.html).
   Usage: <script src="https://villevian.github.io/bp-admin/cabinet.js" data-code="STUDENT_CODE" defer></script>
   Data: Supabase project "Business Partner", RPC get_my_cabinet + get_my_progress (by the student's personal code). */
(function () {
  const me = document.currentScript || document.querySelector('script[src*="cabinet.js"]');
  const CODE = me && me.dataset.code;
  if (!CODE) return;
  const SB = "https://zuegojpfhgigsvyrnymt.supabase.co", KEY = "sb_publishable__Xn8xRhne9Hp2ckaXu6xCQ_MOe52bng";
  const rpc = (f, b) => fetch(SB + "/rest/v1/rpc/" + f, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(b) })
    .then(r => r.ok ? r.json() : Promise.reject(r.status));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const css = `
  .cab{max-width:1100px;margin:18px auto 6px;padding:0 20px;font-family:inherit}
  .cab h2{margin:0 0 12px;font-weight:600;font-size:24px;color:#1f2a44}.cab h2 span{font-size:13px;font-weight:600;background:#eef3ff;color:#3b5bdb;border-radius:8px;padding:3px 9px;margin-left:8px;vertical-align:middle}
  .cab .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .cab .c{background:#fff;border:1px solid #e6e9f0;border-radius:16px;padding:14px 16px;box-shadow:0 2px 10px rgba(31,42,68,.05);display:flex;flex-direction:column;gap:6px;min-height:150px}
  .cab .c h3{margin:0;font-size:12.5px;text-transform:uppercase;letter-spacing:.5px;color:#8a92a6;font-weight:600}
  .cab .big{font-size:22px;font-weight:600;color:#1f2a44;line-height:1.25}.cab .sub{font-size:14px;color:#5b6478}
  .cab .pill{display:inline-block;font-size:12.5px;font-weight:600;border-radius:8px;padding:2px 8px}
  .cab .ok{background:#e7f6ec;color:#23824a}.cab .wip{background:#fff4e0;color:#b26b00}.cab .no{background:#fdecec;color:#c0392b}.cab .info{background:#eef3ff;color:#3b5bdb}
  .cab a.btn{margin-top:auto;align-self:flex-start;background:#ff6b3d;color:#fff;text-decoration:none;border-radius:10px;padding:7px 14px;font-size:14px;font-weight:600}
  .cab a.btn.l{background:#fff;color:#ff6b3d;border:1.5px solid #ff6b3d}
  .cab .num{font-size:44px;font-weight:700;line-height:1}.cab .bar{height:8px;border-radius:6px;background:#eef0f4;overflow:hidden}.cab .bar i{display:block;height:100%;border-radius:6px}
  .cab .note{grid-column:1/-1;background:#fffaf0;border:1px solid #f6dfb5;border-radius:14px;padding:10px 16px;font-size:15px;color:#5b4a2a}
  @media(max-width:900px){.cab .grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.cab .grid{grid-template-columns:1fr}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement("section"); box.className = "cab"; box.innerHTML = '<p style="color:#8a92a6;font-size:14px">Loading your cabinet…</p>';
  const header = document.querySelector("header");
  if (header && header.parentNode) header.parentNode.insertBefore(box, header.nextSibling); else document.body.prepend(box);

  const fmtDate = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const fmtTime = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  function inWords(d) {
    const ms = d - new Date(), h = Math.round(ms / 36e5);
    if (ms < -2 * 36e5) return "";
    if (ms < 0) return "now";
    if (h < 1) return "in " + Math.max(1, Math.round(ms / 6e4)) + " min";
    if (h < 24) return "in " + h + " h";
    const days = Math.round(ms / 864e5); return days === 1 ? "tomorrow" : "in " + days + " days";
  }
  const lessonNo = s => { const m = String(s || "").match(/\b(\d+\.\d+|\d+[A-C]|W\d+)\b/); return m ? m[1] : null; };

  Promise.all([rpc("get_my_cabinet", { p_code: CODE }), rpc("get_my_progress", { p_code: CODE }).catch(() => [])]).then(([rows, prog]) => {
    const c = rows && rows[0];
    if (!c) { box.remove(); return; }
    const cards = [];
    // next lesson
    if (c.next_lesson) {
      const d = new Date(c.next_lesson), w = inWords(d);
      cards.push(`<div class="c"><h3>📅 Next lesson</h3><div class="big">${esc(fmtDate(d))}</div><div class="sub">${esc(fmtTime(d))}${w ? ' · <span class="pill info">' + esc(w) + "</span>" : ""}</div>
        ${c.schedule ? `<div class="sub">Usually: ${esc(c.schedule)}</div>` : ""}${c.meet_url ? `<a class="btn" href="${esc(c.meet_url)}" target="_blank">Join the call</a>` : ""}</div>`);
    } else if (c.schedule) cards.push(`<div class="c"><h3>📅 Lessons</h3><div class="big">${esc(c.schedule)}</div>${c.meet_url ? `<a class="btn" href="${esc(c.meet_url)}" target="_blank">Join the call</a>` : ""}</div>`);
    // current topic
    if (c.current_lesson) cards.push(`<div class="c"><h3>📘 Now studying</h3><div class="big">${esc(c.current_lesson)}</div>${c.current_url ? `<a class="btn l" href="${esc(c.current_url)}">Open the lesson</a>` : ""}</div>`);
    // homework
    if (c.homework || c.homework_url) {
      const no = lessonNo(c.homework_url && c.homework_url.match(/lessons\/([^/]+)\//) ? c.homework_url.match(/lessons\/([^/]+)\//)[1].replace("-", ".") : (c.homework || c.current_lesson));
      let status = '<span class="pill no">Not started</span>';
      if (no) {
        const r = (prog || []).filter(p => String(p.lesson).includes(no) && /homework|· hw/i.test(p.lesson));
        if (r.some(p => p.submitted)) status = '<span class="pill ok">✓ Sent to your teacher</span>'; else if (r.length) status = '<span class="pill wip">In progress</span>';
      }
      let due = "";
      if (c.homework_due) { const dd = new Date(c.homework_due + "T23:59:00"); due = `<div class="sub">Due: ${esc(dd.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }))}</div>`; }
      cards.push(`<div class="c"><h3>📝 Homework</h3><div class="sub" style="font-size:15px;color:#1f2a44">${esc(c.homework || "Homework")}</div>${due}<div>${status}</div>${c.homework_url ? `<a class="btn" href="${esc(c.homework_url)}">Open homework</a>` : ""}</div>`);
    }
    // lessons left (private only)
    if ((c.payment || "private") === "private" && c.lessons_left != null) {
      const n = c.lessons_left, col = n <= 0 ? "#c0392b" : n <= 2 ? "#e08a00" : "#23824a", pct = Math.max(4, Math.min(100, n * 10));
      const msg = n <= 0 ? "Time to top up your lessons." : n <= 2 ? "Only a few lessons left." : "Lessons in your package.";
      cards.push(`<div class="c"><h3>🎟 Lessons left</h3><div class="num" style="color:${col}">${n}</div><div class="bar"><i style="width:${pct}%;background:${col}"></i></div><div class="sub">${msg}</div>
        ${c.last_done ? `<div class="sub">Last lesson: ${esc(new Date(c.last_done).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}</div>` : ""}</div>`);
    }
    const note = c.note ? `<div class="note">💬 <b>From your teacher:</b> ${esc(c.note)}</div>` : "";
    if (!cards.length && !note) { box.remove(); return; }
    box.innerHTML = `<h2>Hi, ${esc((c.name || "").split(" ")[0])}! 👋</h2><div class="grid">${cards.join("")}${note}</div>`;
  }).catch(() => { box.remove(); });
})();
