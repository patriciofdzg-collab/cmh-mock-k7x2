/* App shell: routing, header, event handling. */
(function (global) {
  "use strict";
  var F = global.Framework, C = global.Calc, St = global.Store, U = global.UI, V = global.Views, esc = U.esc;
  var app = document.getElementById("app");
  var lastRouteKey = "";

  function parseHash() {
    var p = location.hash.replace(/^#\/?/, "").split("/");
    return { name: p[0] || "dashboard", a: p[1], b: p[2] };
  }
  function go(path) { location.hash = "#/" + path; }

  /* ------------------------------------------------------------ shell */
  var NAV = [
    ["dashboard", "Dashboard"], ["assess", "Self-assessment"], ["history", "History"], ["profile", "Profile"], ["framework", "Framework"]
  ];

  function shell(user, route, inner) {
    var nav = NAV.map(function (n) {
      return '<a href="#/' + n[0] + '" class="' + (route.name === n[0] ? "active" : "") + '">' + n[1] + "</a>";
    }).join("") +
      '<span class="soon" title="Planned for the next build">Access &amp; invites <span class="badge-soon">Next</span></span>' +
      '<span class="soon" title="Planned for the next build">Reconcile <span class="badge-soon">Next</span></span>';
    var users = St.users().map(function (u) {
      return '<button type="button" class="' + (u.id === user.id ? "cur" : "") + '" data-act="switch-user" data-id="' + u.id + '"><span class="avatar">' + U.initials(u.name) + '</span><span><b>' + esc(u.name) + '</b><br><span class="tiny" style="color:#5b6785">' + esc(u.title) + "</span></span></button>";
    }).join("");
    var storageWarn = St.persistent ? "" : " · ⚠ Your browser is blocking storage, so changes won’t survive a reload";
    return '<div class="demo-bar">Demo mode · all data lives only in this browser · fictional information only' + storageWarn + "</div>" +
      '<header class="top"><div class="top-in"><a class="brand" href="#/dashboard">' + U.LOGO + '<div><div class="brand-name">Client Manager HUB</div><div class="brand-sub">Evaluation &amp; development</div></div></a>' +
      '<nav class="nav" aria-label="Main">' + nav + "</nav>" +
      '<div class="usermenu"><button type="button" data-act="menu-toggle" aria-haspopup="true"><span class="avatar">' + U.initials(user.name) + '</span><span class="small" style="font-weight:700">' + esc(user.name.split(" ")[0]) + '</span><span aria-hidden="true">▾</span></button>' +
      '<div class="menu" id="menu"><h5>Signed in as</h5><div style="padding:2px 10px 8px"><b>' + esc(user.name) + '</b><div class="tiny muted">' + esc(user.email) + '</div></div><hr><h5>Demo: switch user</h5>' + users +
      '<hr><button type="button" data-act="reset-demo">↺ Reset demo data</button><button type="button" data-act="logout">Sign out</button></div></div></div></header>' +
      '<main class="page" id="main">' + inner + '</main><div class="footer">Client Manager HUB · interactive mockup · <button data-act="reset-demo">Reset demo data</button></div>';
  }

  /* ------------------------------------------------------------ render */
  function render() {
    var user = St.current();
    if (!user) { app.innerHTML = V.auth(); lastRouteKey = "auth"; return; }
    var r = parseHash(), inner = "";
    switch (r.name) {
      case "dashboard": inner = V.dashboard(user); break;
      case "assess":
        inner = r.a === "run" ? V.assessRun(user, r.b || V.state.assess.step) : V.assessLanding(user); break;
      case "history": inner = r.a ? V.historyDetail(user, r.a) : V.history(user); break;
      case "profile": inner = V.profile(user); break;
      case "framework": inner = V.framework(user, r.a); break;
      default: go("dashboard"); return;
    }
    app.innerHTML = shell(user, r, inner);
    var key = location.hash;
    if (key !== lastRouteKey) {
      lastRouteKey = key;
      if (r.name === "framework" && r.a) { var el = document.getElementById("fw-" + r.a); if (el) el.scrollIntoView({ block: "start" }); else global.scrollTo(0, 0); }
      else global.scrollTo(0, 0);
    }
  }
  // Re-render while keeping scroll position (used for in-page state changes)
  function rerender() { var y = global.scrollY; render(); global.scrollTo(0, y); }

  /* ------------------------------------------------------------ assessment partial updates */
  function refreshAssess(skillId) {
    var user = St.current(), a = St.draftFor(user.id);
    if (!a) return;
    var s = F.skill(skillId), dim = F.dim(s.dimId);
    var block = document.querySelector('[data-skill-block="' + skillId + '"]');
    if (block) { var tmp = document.createElement("div"); tmp.innerHTML = V.skillBlock(a, s); block.replaceWith(tmp.firstChild); }
    var rail = document.getElementById("rail"); if (rail) rail.innerHTML = V.railHTML(a, dim.n);
    var fb = document.getElementById("footbar"); if (fb) { var t2 = document.createElement("div"); t2.innerHTML = V.footbar(a, dim); fb.replaceWith(t2.firstChild); }
  }

  /* ------------------------------------------------------------ tag inputs (profile) */
  function addTag(container, value) {
    value = String(value || "").trim();
    if (!value) return;
    var exists = Array.prototype.some.call(container.querySelectorAll(".chip"), function (c) { return c.getAttribute("data-v").toLowerCase() === value.toLowerCase(); });
    if (exists) return;
    var chip = document.createElement("span");
    chip.className = "chip"; chip.setAttribute("data-v", value);
    chip.innerHTML = esc(value) + '<button type="button" data-act="tag-remove" aria-label="Remove ' + esc(value) + '">×</button>';
    container.insertBefore(chip, container.querySelector("input"));
  }
  function readTags(form, field) {
    var box = form.querySelector('[data-tags="' + field + '"]');
    var vals = Array.prototype.map.call(box.querySelectorAll(".chip"), function (c) { return c.getAttribute("data-v"); });
    var pending = box.querySelector("input").value.trim();
    if (pending && vals.map(function (v) { return v.toLowerCase(); }).indexOf(pending.toLowerCase()) < 0) vals.push(pending);
    return vals;
  }

  /* ------------------------------------------------------------ events */
  app.addEventListener("click", function (e) {
    var go_ = e.target.closest("[data-go]");
    var el = e.target.closest("[data-act]");
    var user = St.current();
    if (el) {
      var act = el.getAttribute("data-act");
      switch (act) {
        case "auth-tab": V.state.authTab = el.getAttribute("data-tab"); V.state.authError = ""; render(); return;
        case "demo-login": St.switchUser(el.getAttribute("data-id")); V.state.authError = ""; location.hash = "#/dashboard"; V.state.dash.cycle = null; render(); return;
        case "menu-toggle": document.getElementById("menu").classList.toggle("open"); e.stopPropagation(); return;
        case "switch-user": St.switchUser(el.getAttribute("data-id")); V.state.dash.cycle = null; V.state.hist.compare = ""; V.state.dash.openDims = {}; if (parseHash().name === "history" && parseHash().a || parseHash().name === "assess" && parseHash().a) location.hash = "#/dashboard"; render(); U.toast("Switched to " + St.current().name); return;
        case "reset-demo":
          if (global.confirm("Reset all demo data? Accounts you created and assessments you submitted will be removed.")) { St.resetDemo(); V.state.dash.cycle = null; location.hash = "#/"; render(); U.toast("Demo data reset"); }
          return;
        case "logout": St.logout(); location.hash = "#/"; render(); return;
        case "dash-tab": V.state.dash.tab = el.getAttribute("data-tab"); rerender(); return;
        case "toggle-series": var k = el.getAttribute("data-key"); V.state.dash.show[k] = !V.state.dash.show[k]; rerender(); return;
        case "toggle-dim": var d = el.getAttribute("data-dim"); V.state.dash.openDims[d] = !V.state.dash.openDims[d]; rerender(); return;
        case "skill-detail": U.openModal(V.skillModal(user, el.getAttribute("data-skill"))); return;
        case "close-modal": U.closeModal(); if (!go_) return; break;
        case "load-sample": St.loadSample(user.id); V.state.dash.cycle = null; render(); U.toast("Sample history loaded"); return;
        case "remove-sample": St.removeSample(user.id); V.state.dash.cycle = null; render(); U.toast("Sample history removed"); return;
        case "start-assess": St.startSelf(user.id); go("assess/run/1"); return;
        case "resume-assess": go("assess/run/" + (V.state.assess.step || 1)); e.preventDefault(); return;
        case "discard-draft":
          if (global.confirm("Discard this draft and all its answers?")) { St.discardDraft(el.getAttribute("data-id")); go("assess"); render(); U.toast("Draft discarded"); }
          return;
        case "rate": {
          var a = St.draftFor(user.id), sid = el.getAttribute("data-skill");
          St.setRating(a.id, sid, { level: parseInt(el.getAttribute("data-level"), 10), na: false });
          refreshAssess(sid); return;
        }
        case "note-toggle": {
          var sid2 = el.getAttribute("data-skill"); V.state.assess.openNotes[sid2] = !V.state.assess.openNotes[sid2];
          if (!V.state.assess.openNotes[sid2]) { var a2 = St.draftFor(user.id); if (a2 && a2.ratings[sid2] && a2.ratings[sid2].note) V.state.assess.openNotes[sid2] = false; }
          refreshAssess(sid2); return;
        }
        case "fill-demo": St.fillDemo(St.draftFor(user.id).id); rerender(); U.toast("Filled unanswered skills with demo answers"); return;
        case "clear-draft": if (global.confirm("Clear every answer in this draft?")) { St.clearDraft(St.draftFor(user.id).id); V.state.assess.openNotes = {}; rerender(); } return;
        case "submit-assess": {
          var draft = St.draftFor(user.id);
          if (!global.confirm("Submit this self-assessment? It will be locked as a dated snapshot.")) return;
          var res = St.submit(draft.id);
          if (res.error) { U.toast(res.error); return; }
          V.state.dash.cycle = draft.cycle; V.state.dash.tab = "overview"; V.state.assess = { step: 1, openNotes: {} };
          go("dashboard"); U.toast("Self-assessment submitted"); return;
        }
        case "hist-filter": V.state.hist.filter = el.getAttribute("data-f"); rerender(); return;
        case "fw-filter": V.setFwFilter(el.getAttribute("data-p")); rerender(); return;
        case "fw-expand": Array.prototype.forEach.call(document.querySelectorAll("details.fw-dim"), function (x) { x.open = true; }); return;
        case "fw-collapse": Array.prototype.forEach.call(document.querySelectorAll("details.fw-dim"), function (x) { x.open = false; }); return;
        case "tag-remove": el.closest(".chip").remove(); return;
        default: break;
      }
    }
    if (go_) { e.preventDefault(); go(go_.getAttribute("data-go")); }
  });

  document.addEventListener("click", function (e) {
    var m = document.getElementById("menu");
    if (m && m.classList.contains("open") && !e.target.closest(".usermenu")) m.classList.remove("open");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { U.closeModal(); var m = document.getElementById("menu"); if (m) m.classList.remove("open"); } });

  app.addEventListener("change", function (e) {
    var t = e.target, user = St.current();
    if (t.matches('[data-act="na"]')) {
      var a = St.draftFor(user.id), sid = t.getAttribute("data-skill");
      St.setRating(a.id, sid, { na: t.checked, level: t.checked ? null : (a.ratings[sid] && a.ratings[sid].level) });
      refreshAssess(sid); return;
    }
    var bind = t.getAttribute("data-bind");
    if (bind === "dash-cycle") { V.state.dash.cycle = t.value; rerender(); }
    else if (bind === "prog-dim") { V.state.dash.progDim = t.value; rerender(); }
    else if (bind === "hist-compare") { V.state.hist.compare = t.value; rerender(); }
  });

  app.addEventListener("input", function (e) {
    var t = e.target;
    if (t.hasAttribute("data-note")) {
      var user = St.current(), a = St.draftFor(user.id);
      if (a) St.setRating(a.id, t.getAttribute("data-note"), { note: t.value });
    }
  });

  app.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-taginput") && (e.key === "Enter" || e.key === ",")) {
      e.preventDefault();
      addTag(t.closest(".taginput"), t.value); t.value = "";
    }
    if (t.hasAttribute && t.hasAttribute("data-taginput") && e.key === "Backspace" && !t.value) {
      var chips = t.closest(".taginput").querySelectorAll(".chip"); if (chips.length) chips[chips.length - 1].remove();
    }
  });

  app.addEventListener("submit", function (e) {
    var form = e.target, type = form.getAttribute("data-form");
    if (!type) return;
    e.preventDefault();
    var fd = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) fd[el.name] = el.value; });
    if (type === "login") {
      var r = St.login(fd.email, fd.password);
      if (r.error) { V.state.authError = r.error; render(); return; }
      V.state.authError = ""; V.state.dash.cycle = null; location.hash = "#/dashboard"; render();
    } else if (type === "register") {
      var r2 = St.register(fd);
      if (r2.error) { V.state.authError = r2.error; V.state.authTab = "register"; render(); return; }
      V.state.authError = ""; V.state.dash.cycle = null; location.hash = "#/dashboard"; render(); U.toast("Welcome, " + r2.user.name.split(" ")[0] + "!");
    } else if (type === "profile") {
      var user = St.current();
      var num = function (v) { return v === "" || v == null ? "" : Number(v); };
      St.saveUser(user.id, { name: (fd.name || "").trim() || user.name, title: (fd.title || "").trim() || user.title }, {
        office: fd.office.trim(), reportsTo: fd.reportsTo.trim(), yearsExperience: num(fd.yearsExperience), yearsCompany: num(fd.yearsCompany), yearsCM: num(fd.yearsCM),
        sectors: readTags(form, "sectors"), accounts: num(fd.accounts), portfolio: fd.portfolio, teamSize: num(fd.teamSize), partners: readTags(form, "partners"),
        languages: readTags(form, "languages"), certifications: readTags(form, "certifications"), aspiration: fd.aspiration.trim(), bio: fd.bio.trim()
      });
      rerender(); U.toast("Profile saved");
    }
  });

  global.addEventListener("hashchange", render);

  St.init();
  render();
})(window);
