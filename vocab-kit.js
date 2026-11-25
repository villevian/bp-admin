/* Vocabulary kit for lesson pages (Lesson / Homework / Extra).
   1) Every chip in the "Vocabulary of this lesson" box opens a word card: translation, meaning, example, 🔊, "+ My vocabulary".
   2) Select any text in the lesson → a "＋" bubble appears → the phrase goes to the student's own vocabulary.
   Usage (end of <body>): <script src="https://villevian.github.io/bp-admin/vocab-kit.js" defer></script>
   Data: <site>/vocab.json ({level, items:[{id,l,g,en,uk,df,ex}]}); student code = global CODE of the page (or data-code).
   Storage: Supabase "Business Partner", save_hw / get_my_hw, lesson key "BP <LEVEL> Vocabulary" (same as vocab.html). */
(function () {
  if (window.__vkit) return; window.__vkit = 1;
  const me = document.currentScript || document.querySelector('script[src*="vocab-kit.js"]');
  const SB = "https://zuegojpfhgigsvyrnymt.supabase.co", KEY = "sb_publishable__Xn8xRhne9Hp2ckaXu6xCQ_MOe52bng";
  let PCODE = (me && me.dataset.code) || ""; try { if (!PCODE && typeof STUDENT_CODE !== "undefined") PCODE = STUDENT_CODE || ""; } catch (e) {} try { if (!PCODE && typeof CODE !== "undefined") PCODE = CODE || ""; } catch (e) {}
  const seg = location.pathname.split("/").filter(Boolean);
  const ROOT = (me && me.dataset.root) || (location.hostname.endsWith("github.io") && seg.length ? "/" + seg[0] + "/" : (location.pathname.replace(/lessons\/.*$/, "")));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = s => String(s || "").toLowerCase().replace(/<[^>]+>/g, "").replace(/[’`‘]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim();
  const stem = s => norm(s).split(" ").map(w => w.replace(/(ies|es|s)$/, "")).join(" ");
  const rpc = (f, b) => fetch(SB + "/rest/v1/rpc/" + f, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(b) })
    .then(async r => { const t = await r.text(); if (!r.ok) throw new Error(t); return t ? JSON.parse(t) : null; });
  function say(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = .9; const v = speechSynthesis.getVoices().find(x => /^en-GB/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^en/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) {} }

  const css = `
  .vk-chip{cursor:pointer;transition:.15s;position:relative}.vk-chip:hover{box-shadow:0 0 0 1.5px #5b5fc7;}
  .vk-chip.vk-in::after{content:"★";font-size:11px;color:#e0a100;margin-left:4px}
  .vk-hint{font-size:13px;color:#6d6e70;padding:0 16px 10px;font-weight:400}
  .vk-ov{position:fixed;inset:0;background:rgba(30,40,60,.28);display:none;align-items:center;justify-content:center;z-index:9999;padding:12px}.vk-ov.on{display:flex}
  .vk-box{background:#fff;border-radius:16px;max-width:470px;width:100%;max-height:92vh;overflow:auto;padding:20px 22px 18px;box-shadow:0 12px 40px rgba(0,0,0,.18);border-top:5px solid #5b5fc7;font-family:inherit;color:#231f20;font-size:16px;line-height:1.45}
  .vk-box .x{float:right;border:0;background:none;font-size:24px;line-height:1;cursor:pointer;color:#8a8b8d}
  .vk-en{font-size:25px;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.vk-uk{font-size:18px;color:#4044a8;margin:2px 0 6px}
  .vk-lb{font-size:11.5px;font-weight:700;color:#8a8b8d;text-transform:uppercase;letter-spacing:.5px;margin-top:12px}.vk-ex{font-style:italic}
  .vk-b{border:1.5px solid #d5d6dd;background:#fff;border-radius:10px;padding:6px 12px;font:inherit;font-size:14.5px;font-weight:500;cursor:pointer;color:#231f20}
  .vk-b.a{background:#5b5fc7;border-color:#5b5fc7;color:#fff}.vk-b.ok{background:#e7f6ec;border-color:#bfe5cc;color:#23824a}
  .vk-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;align-items:center}.vk-nav{margin-left:auto;display:flex;gap:6px}
  .vk-f label{display:block;font-size:12px;font-weight:700;color:#8a8b8d;text-transform:uppercase;margin:10px 0 3px}
  .vk-f input,.vk-f textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;border:1.5px solid #d5d6dd;border-radius:10px;padding:8px 10px}.vk-f textarea{min-height:64px}
  .vk-sug{font-size:13.5px;color:#4044a8;cursor:pointer;margin-top:4px;min-height:18px}
  .vk-plus{position:absolute;z-index:9998;display:none;background:#5b5fc7;color:#fff;border:0;border-radius:20px;padding:7px 13px;font:600 14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;white-space:nowrap}
  .vk-plus.on{display:block}
  .vk-fab{position:fixed;right:16px;bottom:16px;z-index:9997;background:#fff;color:#4044a8;border:1.5px solid #c9cbef;border-radius:24px;padding:8px 14px;font:600 14px system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.08)}
  .vk-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:#23824a;color:#fff;border-radius:12px;padding:9px 16px;font:500 15px system-ui,sans-serif;z-index:10000;display:none}.vk-toast.on{display:block}`;
  document.head.insertAdjacentHTML("beforeend", "<style>" + css + "</style>");

  let DATA = { level: (me && me.dataset.level) || "", items: [] }, IDX = {}, S = null, LKEY = "";
  const TITLE = (document.querySelector("header h1") || {}).textContent || document.title;
  const NUM = ((document.querySelector("header .n") || {}).textContent || "").trim();
  const lsKey = () => "voc:" + LKEY + ":" + (PCODE || "preview");

  async function loadS() {
    if (S) return S; let a = null;
    if (PCODE) { try { const r = await rpc("get_my_hw", { p_code: PCODE, p_lesson: LKEY }); a = r && r[0] && r[0].answers; } catch (e) {} }
    if (!a) { try { a = JSON.parse(localStorage.getItem(lsKey()) || "null"); } catch (e) {} }
    S = Object.assign({ sel: [], lv: {}, due: {}, own: [], del: [], chg: {} }, a || {}); S.chg = S.chg || {}; return S;
  }
  function mergeSel(R, L) { // last change wins per word (add / remove), so a removal is not undone by the other device
    const chg = Object.assign({}, R.chg || {}); for (const k in (L.chg || {})) if (!chg[k] || L.chg[k][1] > chg[k][1]) chg[k] = L.chg[k];
    const set = new Set([...(R.sel || []), ...(L.sel || [])]); for (const k in chg) { if (chg[k][0]) set.add(k); else set.delete(k); } return { sel: [...set], chg };
  }
  async function saveS() {
    try { localStorage.setItem(lsKey(), JSON.stringify(S)); } catch (e) {}
    if (!PCODE) return true;
    try { // merge with what the trainer may have saved meanwhile
      const r = await rpc("get_my_hw", { p_code: PCODE, p_lesson: LKEY }); const R = (r && r[0] && r[0].answers) || {};
      const del = new Set([...(R.del || []), ...(S.del || [])]), own = {};
      [...(R.own || []), ...(S.own || [])].forEach(w => { if (!del.has(w.id)) own[w.id] = w; });
      S = Object.assign({}, R, mergeSel(R, S), { own: Object.values(own), del: [...del], lv: Object.assign({}, S.lv, R.lv), due: Object.assign({}, S.due, R.due) });
      const mastered = Object.values(S.lv || {}).filter(v => v >= 4).length;
      await rpc("save_hw", { p_code: PCODE, p_lesson: LKEY, p_answers: S, p_score: { selected: S.sel.length, own: S.own.length, mastered }, p_submitted: false });
      return true;
    } catch (e) { return false; }
  }
  const toast = t => { const el = document.querySelector(".vk-toast"); el.textContent = t; el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 2200); };
  const inMine = it => S && (it.id && S.sel.includes(it.id) || S.own.some(w => norm(w.en) === norm(it.en)));

  // ---------- word card ----------
  const ov = document.createElement("div"); ov.className = "vk-ov"; ov.innerHTML = '<div class="vk-box" id="vkBox"></div>';
  ov.onclick = e => { if (e.target === ov) close(); };
  const close = () => ov.classList.remove("on");
  let LIST = [], cur = 0;
  function card(i) {
    cur = (i + LIST.length) % LIST.length; const it = LIST[cur]; const mine = inMine(it);
    document.getElementById("vkBox").innerHTML = `<button class="x" title="close">×</button>
      <div class="vk-en">${esc(it.en)} <button class="vk-b" data-say="en">🔊</button></div>${it.uk ? `<div class="vk-uk">${esc(it.uk)}</div>` : ""}
      ${it.df ? `<div class="vk-lb">Meaning</div><div>${esc(it.df)}</div>` : ""}
      ${it.ex ? `<div class="vk-lb">Example</div><div class="vk-ex">${esc(it.ex)} <button class="vk-b" style="padding:1px 8px" data-say="ex">🔊</button></div>` : ""}
      <div class="vk-row"><span><button class="vk-b ${mine ? "ok" : "a"}" id="vkAdd">${mine ? "★ In my vocabulary" : "＋ My vocabulary"}</button>${mine ? ' <button class="vk-b" id="vkDel" title="Remove from My vocabulary">✕ Remove</button>' : ""}</span>
      <div class="vk-nav">${LIST.length > 1 ? '<button class="vk-b" data-go="-1">←</button><button class="vk-b" data-go="1">→</button>' : ""}</div></div>`;
    const box = document.getElementById("vkBox");
    box.querySelector(".x").onclick = close;
    box.querySelectorAll("[data-say]").forEach(b => b.onclick = () => say(it[b.dataset.say]));
    box.querySelectorAll("[data-go]").forEach(b => b.onclick = () => card(cur + +b.dataset.go));
    document.getElementById("vkAdd").onclick = async () => {
      await loadS(); if (inMine(it)) return;
      const now = Date.now();
      if (it.id) { S.sel.push(it.id); S.chg[it.id] = [1, now]; } else { const w = { id: "own|" + now, en: it.en, uk: it.uk || "", ex: it.ex || "", src: (NUM + " " + TITLE).trim(), at: new Date().toISOString() }; S.own.push(w); S.sel.push(w.id); S.chg[w.id] = [1, now]; }
      const ok = await saveS(); toast(ok ? "★ Added to My vocabulary" : "Saved on this device"); markChips(); card(cur);
    };
    const del = document.getElementById("vkDel");
    if (del) del.onclick = async () => {
      await loadS(); const now = Date.now();
      const ids = [it.id, ...S.own.filter(w => norm(w.en) === norm(it.en)).map(w => w.id)].filter(Boolean);
      ids.forEach(id => { S.sel = S.sel.filter(x => x !== id); S.chg[id] = [0, now]; if (/^own\|/.test(id)) { S.own = S.own.filter(w => w.id !== id); S.del = [...new Set([...(S.del || []), id])]; } });
      const ok = await saveS(); toast(ok ? "Removed from My vocabulary" : "Removed on this device"); markChips(); card(cur);
    };
    ov.classList.add("on");
  }
  document.addEventListener("keydown", e => { if (!ov.classList.contains("on")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") card(cur + 1); if (e.key === "ArrowLeft") card(cur - 1); });

  function findItem(text) {
    const n = norm(text), s = stem(text);
    return DATA.items.find(x => norm(x.en) === n) || DATA.items.find(x => stem(x.en) === s) ||
      DATA.items.find(x => String(x.en).split(/ \/ | – | - /).map(norm).includes(n)) || DATA.items.find(x => String(x.en).split(/ \/ | – | - /).map(stem).includes(s)) || null;
  }
  let CHIPS = [];
  function initChips() {
    const box = document.querySelector("details.voc"); if (!box) return;
    if (box.querySelector("a.vw")) return; // page already has its own word cards
    CHIPS = [...box.querySelectorAll(".vg > span")];
    if (!CHIPS.length) return;
    LIST = CHIPS.map(el => {
      const tr = el.querySelector("em.tr, small"); const uk0 = tr ? tr.textContent.replace(/^[\s—-]+/, "").trim() : "";
      const en = (tr ? el.textContent.replace(tr.textContent, "") : el.textContent).trim();
      const f = findItem(en); return f ? Object.assign({}, f, { en: en || f.en, uk: f.uk || uk0 }) : { en, uk: uk0, df: "", ex: "" };
    });
    CHIPS.forEach((el, i) => { el.classList.add("vk-chip"); el.title = "Click: translation, example, 🔊";
      el.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); card(i); }, true); });
    const sm = box.querySelector("summary"); if (sm && !box.querySelector(".vk-hint"))
      sm.insertAdjacentHTML("afterend", '<div class="vk-hint">👆 Click any word to see the translation, an example and to hear it. Select any text in the lesson and press <b>＋</b> to save it.</div>');
    markChips();
  }
  function markChips() { if (!S) return; CHIPS.forEach((el, i) => el.classList.toggle("vk-in", !!inMine(LIST[i]))); }

  // ---------- select text → ＋ ----------
  const plus = document.createElement("button"); plus.className = "vk-plus"; plus.type = "button"; plus.textContent = "＋ My vocabulary";
  let selText = "", selCtx = "";
  function sentenceOf(range) {
    try { const node = range.startContainer, full = (node.parentElement.closest("p,li,div,td,span") || node.parentElement).textContent.replace(/\s+/g, " ");
      const t = range.toString().trim(), i = full.indexOf(t); if (i < 0) return "";
      const a = Math.max(full.lastIndexOf(".", i), full.lastIndexOf("!", i), full.lastIndexOf("?", i)) + 1;
      const ends = [".", "!", "?"].map(c => full.indexOf(c, i + t.length)).filter(x => x > -1), b = ends.length ? Math.min(...ends) + 1 : full.length;
      const s = full.slice(a, b).trim(); return s.length > 220 ? "" : s; } catch (e) { return ""; }
  }
  function onSel() {
    const sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) { plus.classList.remove("on"); return; }
    const r = sel.getRangeAt(0), anc = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
    if (!anc || anc.closest("input,textarea,select,button,.vk-box,.vk-ov,header,nav,footer")) { plus.classList.remove("on"); return; }
    const t = sel.toString().replace(/\s+/g, " ").trim(); const words = t.split(" ").length;
    if (t.length < 2 || words > 9 || !/[a-z]/i.test(t)) { plus.classList.remove("on"); return; }
    selText = t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}?!.…]+$/gu, ""); selCtx = sentenceOf(r);
    const b = r.getBoundingClientRect(); plus.style.left = Math.max(8, Math.min(window.scrollX + b.left + b.width / 2 - 70, window.scrollX + document.documentElement.clientWidth - 170)) + "px";
    plus.style.top = (window.scrollY + b.bottom + 8) + "px"; plus.classList.add("on");
  }
  let st; document.addEventListener("selectionchange", () => { clearTimeout(st); st = setTimeout(onSel, 250); });
  plus.addEventListener("mousedown", e => e.preventDefault());
  plus.onclick = () => { plus.classList.remove("on"); addForm(selText, selCtx); };

  async function translate(t) {
    try { const r = await fetch("https://api.mymemory.translated.net/get?langpair=en|uk&q=" + encodeURIComponent(t)); const j = await r.json();
      const x = j && j.responseData && j.responseData.translatedText; return x && !/MYMEMORY|QUERY LENGTH/i.test(x) ? x : ""; } catch (e) { return ""; }
  }
  function addForm(en, ex) {
    const known = findItem(en);
    document.getElementById("vkBox").innerHTML = `<button class="x">×</button><div class="vk-en" style="font-size:20px">＋ Add to My vocabulary</div>
      ${known ? `<div class="vk-sug" style="cursor:default;color:#23824a">This phrase is in the course vocabulary — it will be added with its card.</div>` : ""}
      <div class="vk-f"><label>English</label><input id="vkEn" value="${esc(known ? known.en : en)}">
      <label>Translation</label><input id="vkUk" value="${esc(known ? known.uk : "")}" placeholder="your translation"><div class="vk-sug" id="vkSug"></div>
      <label>Example</label><textarea id="vkEx">${esc(known ? known.ex : ex)}</textarea></div>
      <div class="vk-row"><button class="vk-b a" id="vkSave">Save</button><button class="vk-b" id="vkSay">🔊</button><button class="vk-b" id="vkCancel">Cancel</button></div>`;
    const box = document.getElementById("vkBox"); box.querySelector(".x").onclick = close; document.getElementById("vkCancel").onclick = close;
    document.getElementById("vkSay").onclick = () => say(document.getElementById("vkEn").value);
    ov.classList.add("on");
    if (!known) translate(en).then(tr => { const s = document.getElementById("vkSug"); if (!s || !tr) return; s.innerHTML = "Suggestion: <b>" + esc(tr) + "</b> — tap to use";
      s.onclick = () => { document.getElementById("vkUk").value = tr; s.textContent = ""; }; if (!document.getElementById("vkUk").value) document.getElementById("vkUk").placeholder = tr; });
    document.getElementById("vkSave").onclick = async () => {
      const w = { en: document.getElementById("vkEn").value.trim(), uk: document.getElementById("vkUk").value.trim() || document.getElementById("vkUk").placeholder.replace("your translation", ""), ex: document.getElementById("vkEx").value.trim() };
      if (!w.en) return; await loadS();
      if (known && norm(w.en) === norm(known.en)) { if (!S.sel.includes(known.id)) S.sel.push(known.id); }
      else if (!S.own.some(o => norm(o.en) === norm(w.en))) { const o = Object.assign({ id: "own|" + Date.now(), src: (NUM + " " + TITLE).trim(), at: new Date().toISOString() }, w); S.own.push(o); S.sel.push(o.id); }
      const ok = await saveS(); close(); toast(ok ? "★ Saved to My vocabulary" : "Saved on this device"); markChips(); window.getSelection().removeAllRanges();
    };
  }

  function boot() {
    document.body.append(ov, plus);
    document.body.insertAdjacentHTML("beforeend", `<a class="vk-fab" href="${ROOT}vocab.html" target="_blank">📚 My vocabulary</a><div class="vk-toast"></div>`);
    fetch(ROOT + "vocab.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null).then(d => {
      if (d) DATA = d; LKEY = "BP " + (DATA.level || "B1") + " Vocabulary"; initChips(); loadS().then(markChips);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
