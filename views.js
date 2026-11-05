/* Views: each function returns an HTML string. State that survives re-renders lives in ViewState. */
(function (global) {
  "use strict";
  var F = global.Framework, C = global.Calc, St = global.Store, U = global.UI, esc = U.esc;
  var fmt = C.fmt;

  var ViewState = {
    authTab: "login", authError: "",
    dash: { cycle: null, tab: "overview", show: { self: true, others: true, prev: false }, openDims: {}, progDim: "all" },
    assess: { step: 1, openNotes: {} },
    hist: { filter: "all", compare: "" }
  };

  var SERIES = { self: "#0f1d4d", others: "#1aa1ff", prev: "#7e8cad" };

  function pillarColor(id) { return F.pillar(id).color; }
  function lvColor(score) { var l = C.levelFor(score); return l ? l.color : "#c9d3e6"; }

  /* =============================================================== AUTH */
  function viewAuth() {
    var tab = ViewState.authTab;
    var err = ViewState.authError ? '<div class="err" role="alert">' + esc(ViewState.authError) + "</div>" : "";
    var demos = St.users().filter(function (u) { return u.demo; }).map(function (u) {
      return '<button type="button" class="demo-user" data-act="demo-login" data-id="' + u.id + '"><span class="avatar">' + U.initials(u.name) + "</span>" +
        "<span><b>" + esc(u.name) + '</b><br><span class="small muted">' + esc(u.title) + (u.id === "u_alex" ? " · full sample history" : " · empty account") + "</span></span></button>";
    }).join("");
    var pillars = F.pillars.map(function (p) {
      var n = F.dimensions.filter(function (d) { return d.pillar === p.id; }).length;
      return "<div><b>" + esc(p.name) + "</b>" + n + " dimensions</div>";
    }).join("");

    var form = tab === "login"
      ? '<form data-form="login" novalidate>' +
        '<div class="field"><label class="f" for="l-email">Email</label><input class="input" id="l-email" name="email" type="email" autocomplete="username" placeholder="you@company.com"></div>' +
        '<div class="field"><label class="f" for="l-pass">Password</label><input class="input" id="l-pass" name="password" type="password" autocomplete="current-password" placeholder="••••"></div>' +
        '<button class="btn primary" style="width:100%" type="submit">Sign in</button></form>'
      : '<form data-form="register" novalidate>' +
        '<div class="field"><label class="f" for="r-name">Full name</label><input class="input" id="r-name" name="name" autocomplete="name" placeholder="Jane Doe"></div>' +
        '<div class="field"><label class="f" for="r-email">Work email</label><input class="input" id="r-email" name="email" type="email" autocomplete="username" placeholder="you@company.com"></div>' +
        '<div class="field"><label class="f" for="r-title">Job title</label><input class="input" id="r-title" name="title" placeholder="Client Manager"></div>' +
        '<div class="field"><label class="f" for="r-pass">Password</label><input class="input" id="r-pass" name="password" type="password" autocomplete="new-password" placeholder="At least 4 characters"><div class="hint">Demo only: passwords are stored in this browser in plain text. Use a throwaway one.</div></div>' +
        '<button class="btn primary" style="width:100%" type="submit">Create account</button></form>';

    return '<div class="auth"><div class="auth-l"><div>' +
      '<div class="brand">' + U.LOGO + '<div><div class="brand-name">Client Manager HUB</div><div class="brand-sub">Evaluation &amp; development</div></div></div>' +
      '<h1>Know where you stand.<br><span>Grow where it matters.</span></h1>' +
      "<p>One place to self-assess against the Client Manager maturity framework, gather the view of the people you work with, align on where you really are, and focus your development.</p>" +
      '<div class="auth-pillars">' + pillars + "</div></div>" +
      '<div class="small" style="color:#8ea3d4">Interactive mockup · fictional data only</div></div>' +
      '<div class="auth-r"><div class="auth-box"><div class="card">' +
      '<div class="tabs" style="margin-bottom:18px"><button type="button" class="' + (tab === "login" ? "on" : "") + '" data-act="auth-tab" data-tab="login">Sign in</button><button type="button" class="' + (tab === "register" ? "on" : "") + '" data-act="auth-tab" data-tab="register">Create account</button></div>' +
      err + form + "</div>" +
      '<div class="demo-list"><div class="sec-title" style="margin-bottom:8px">Or jump in with a demo account <span style="text-transform:none;letter-spacing:0;font-weight:600">(password: demo)</span></div>' + demos + "</div></div></div></div>";
  }

  /* =============================================================== DASHBOARD */
  function emptyDashboard(user) {
    return '<div class="card empty"><h2>No assessments yet</h2><p>Complete your first self-assessment to see your radar, gaps and focus areas. ' +
      "To explore the dashboard right away, load a sample history (two self-assessments plus evaluations from a manager and a peer).</p>" +
      '<div class="row" style="justify-content:center"><button class="btn primary" data-go="assess">Start self-assessment</button>' +
      '<button class="btn" data-act="load-sample">Load sample history</button></div></div>';
  }

  function dashData(user) {
    var subs = St.submittedAbout(user.id);
    if (!subs.length) return null;
    var cycleLabels = {};
    subs.forEach(function (a) { cycleLabels[a.cycle] = a.cycleLabel; });
    var cycles = Object.keys(cycleLabels).sort().reverse();
    var d = ViewState.dash;
    if (!d.cycle || cycles.indexOf(d.cycle) < 0) {
      d.cycle = cycles.filter(function (c) { return subs.some(function (a) { return a.cycle === c && a.evaluatorId === user.id; }); })[0] || cycles[0];
    }
    var latestFirst = function (a, b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)); };
    var self = subs.filter(function (a) { return a.cycle === d.cycle && a.evaluatorId === user.id; }).sort(latestFirst)[0] || null;
    var others = subs.filter(function (a) { return a.cycle === d.cycle && a.evaluatorId !== user.id; });
    var prev = subs.filter(function (a) { return a.evaluatorId === user.id && a.cycle < d.cycle; }).sort(function (a, b) { return b.cycle.localeCompare(a.cycle) || latestFirst(a, b); })[0] || null;
    return {
      subs: subs, cycles: cycles, cycleLabels: cycleLabels, cycle: d.cycle,
      self: self, others: others, prev: prev,
      S: self ? C.summarize([self]) : null, O: others.length ? C.summarize(others) : null, P: prev ? C.summarize([prev]) : null
    };
  }

  function viewDashboard(user) {
    var D = dashData(user);
    if (!D) return '<div class="page-head"><div><h1>Dashboard</h1></div></div>' + emptyDashboard(user);
    var tab = ViewState.dash.tab;
    var cycOpts = D.cycles.map(function (c) { return '<option value="' + c + '"' + (c === D.cycle ? " selected" : "") + ">" + esc(D.cycleLabels[c]) + "</option>"; }).join("");
    var head = '<div class="page-head"><div><h1>Dashboard</h1><div class="sub">Your competencies by dimension, how others see you, and where to focus next.</div></div><div class="spacer"></div>' +
      '<div class="row"><label class="small muted" for="cyc" style="font-weight:700">Cycle</label><select id="cyc" class="input" style="width:auto" data-bind="dash-cycle">' + cycOpts + "</select>" +
      '<div class="tabs"><button class="' + (tab === "overview" ? "on" : "") + '" data-act="dash-tab" data-tab="overview">Overview</button>' +
      '<button class="' + (tab === "dimensions" ? "on" : "") + '" data-act="dash-tab" data-tab="dimensions">Dimensions</button>' +
      '<button class="' + (tab === "progress" ? "on" : "") + '" data-act="dash-tab" data-tab="progress">Progress</button></div></div></div>';
    var body = tab === "overview" ? dashOverview(user, D) : tab === "dimensions" ? dashDimensions(user, D) : dashProgress(user, D);
    var sampleNote = St.hasSample(user.id) && !user.demo
      ? '<div class="footer">Showing sample data. <button data-act="remove-sample">Remove sample history</button></div>' : "";
    return head + dashKpis(D) + body + sampleNote;
  }

  function dashKpis(D) {
    var main = D.S || D.O, who = D.S ? "Self-rated" : "Others’ view";
    var lv = C.levelFor(main.overall);
    var meanSkill = C.mean(F.skills.map(function (s) { return main.skills[s.id]; }));
    var rels = D.others.map(function (a) { return a.relationship; });
    var delta = D.S && D.P ? D.S.overall - D.P.overall : null;
    var deltaCls = delta == null ? "" : delta >= 0 ? "up-c" : "down-c";
    var deltaTxt = delta == null ? "–" : (delta >= 0 ? "▲ +" : "▼ ") + fmt(delta, 2);
    return '<div class="kpis">' +
      '<div class="kpi"><div class="v" style="color:' + lv.color + '">' + fmt(main.overall, 1) + "<small>" + lv.name + '</small></div><div class="l">Overall level</div><div class="s">' + who + " · " + esc(D.cycleLabels[D.cycle]) + "</div></div>" +
      '<div class="kpi"><div class="v">' + main.atExpert + '<small class="muted">/ ' + main.rated + '</small></div><div class="l">Skills at Expert</div><div class="s">' + who + "</div></div>" +
      '<div class="kpi"><div class="v">' + fmt(4 - meanSkill, 1) + '</div><div class="l">Levels to Expert</div><div class="s">average per skill</div></div>' +
      '<div class="kpi"><div class="v">' + D.others.length + '</div><div class="l">Others’ evaluations</div><div class="s">' + (rels.length ? esc(rels.join(", ")) : "none in this cycle") + "</div></div>" +
      '<div class="kpi"><div class="v ' + deltaCls + '" style="font-size:32px">' + deltaTxt + '</div><div class="l">Change vs previous</div><div class="s">' + (D.P ? "vs " + esc(D.prev.cycleLabel) + " (self)" : "no earlier self-assessment") + "</div></div></div>";
  }

  function seriesFor(D) {
    var sh = ViewState.dash.show, s = [];
    var vals = function (sum) { return F.dimensions.map(function (d) { return sum.dims[d.id]; }); };
    if (sh.self && D.S) s.push({ name: "Self", color: SERIES.self, values: vals(D.S), fillOpacity: 0.14 });
    if (sh.others && D.O) s.push({ name: "Others (avg of " + D.O.count + ")", color: SERIES.others, values: vals(D.O), fillOpacity: 0.1 });
    if (sh.prev && D.P) s.push({ name: "Previous self (" + D.prev.cycleLabel + ")", color: SERIES.prev, values: vals(D.P), dash: true, fillOpacity: 0 });
    return s;
  }

  function legend(D) {
    var sh = ViewState.dash.show;
    function item(key, label, avail) {
      return '<span class="lg ' + (!avail ? "na" : sh[key] ? "" : "off") + '" style="--c:' + SERIES[key] + '"' + (avail ? ' data-act="toggle-series" data-key="' + key + '"' : ' title="No data for this cycle"') + '><i class="' + (key === "prev" ? "dash" : "") + '"></i>' + label + "</span>";
    }
    return '<div class="legend">' + item("self", "Self", !!D.S) + item("others", "Others" + (D.O ? " (" + D.O.count + ")" : ""), !!D.O) + item("prev", "Previous self" + (D.P ? " · " + esc(D.prev.cycleLabel) : ""), !!D.P) + "</div>";
  }

  function skillGapList(main) {
    return F.skills.filter(function (s) { return main.skills[s.id] != null; })
      .sort(function (a, b) { return (main.skills[a.id] - main.skills[b.id]) || (a.id < b.id ? -1 : 1); }).slice(0, 6);
  }

  function dashOverview(user, D) {
    var main = D.S || D.O;
    var axes = F.dimensions.map(function (d) { return { label: d.short }; });
    var dimList = '<div class="dimlist" aria-label="Scores by dimension">' + F.dimensions.map(function (d) {
      var s = D.S ? D.S.dims[d.id] : null, o = D.O ? D.O.dims[d.id] : null;
      return '<div class="dl-i"><span class="dot" style="--c:' + pillarColor(d.pillar) + '"></span><span class="dl-n" title="' + esc(d.name) + '">' + d.n + " · " + esc(d.short) + '</span><span class="dl-v">' + (s != null ? fmt(s, 1) : "–") + (D.O ? ' <span class="muted">/ ' + (o != null ? fmt(o, 1) : "–") + "</span>" : "") + "</span></div>";
    }).join("") + "</div>" + (D.S && D.O ? '<div class="tiny muted" style="margin-top:4px">Values: Self / Others</div>' : "");
    var radarCard = '<div class="card"><h3>Where are my strengths?</h3><div class="sub">Radar of the 11 dimensions · scale 1 (Apprentice) to 4 (Expert)</div>' + legend(D) + U.radar(axes, seriesFor(D)) + dimList + "</div>";

    var focus = skillGapList(main).map(function (s) {
      var sc = main.skills[s.id], lv = C.levelFor(sc), o = D.O && D.S ? D.O.skills[s.id] : null;
      var extra = D.S && D.O && o != null ? " · Others: " + C.levelFor(o).name : "";
      return '<div class="focus-item" data-act="skill-detail" data-skill="' + s.id + '"><div class="row"><span class="ft">' + s.num + " " + esc(s.title) + '</span><span class="spacer"></span>' + U.scorePill(sc) + "</div>" +
        '<div class="tiny muted">' + esc(F.dim(s.dimId).short) + extra + " · " + fmt(4 - sc, 1) + ' levels to Expert</div><div class="bar" style="--c:' + lv.color + '"><i style="width:' + (sc / 4 * 100).toFixed(0) + '%"></i></div></div>';
    }).join("");
    var focusCard = '<div class="card"><h3>What to focus on</h3><div class="sub">Skills furthest from Expert · ' + (D.S ? "self-rated" : "others’ view") + " · click for what the next level looks like</div>" + '<div style="margin-top:8px">' + focus + "</div></div>";

    var pil = F.pillars.map(function (p) {
      var s = D.S ? D.S.pillars[p.id] : null, o = D.O ? D.O.pillars[p.id] : null;
      return '<div class="pbar" style="--c:' + p.color + '"><span class="nm">' + esc(p.name) + '</span><span class="vals">' + (s != null ? "Self " + fmt(s, 1) : "") + (s != null && o != null ? " · " : "") + (o != null ? "Others " + fmt(o, 1) : "") + "</span>" +
        '<div class="tr"><i class="t"></i>' + (s != null ? '<i class="s" style="width:' + (s / 4 * 100).toFixed(0) + '%"></i>' : "") + (o != null ? '<i class="tt"></i><i class="o" style="width:' + (o / 4 * 100).toFixed(0) + '%"></i>' : "") + "</div></div>";
    }).join("");
    var ins = insights(D).map(function (t) { return "<li>" + t + "</li>"; }).join("");
    var rightCol = '<div class="card"><h3>Pillars</h3><div class="sub">Average by pillar · dark = self, light blue = others</div><div style="margin-top:14px">' + pil + "</div></div>";

    var row1 = '<div class="grid g-dash1">' + radarCard + focusCard + '<div class="grid" style="align-content:start">' + rightCol + '<div class="card"><h3>Insights</h3><ul class="insights" style="margin-top:6px">' + ins + "</ul></div></div></div>";

    /* row 2 */
    var gaps = "";
    if (D.S && D.O) {
      var list = F.skills.filter(function (s) { return D.S.skills[s.id] != null && D.O.skills[s.id] != null; })
        .map(function (s) { return { s: s, diff: D.S.skills[s.id] - D.O.skills[s.id] }; })
        .filter(function (x) { return Math.abs(x.diff) >= 1; })
        .sort(function (a, b) { return Math.abs(b.diff) - Math.abs(a.diff); }).slice(0, 6);
      gaps = list.length ? list.map(function (x) {
        return '<div class="focus-item" data-act="skill-detail" data-skill="' + x.s.id + '"><div class="row"><span class="ft">' + x.s.num + " " + esc(x.s.title) + '</span><span class="spacer"></span><span class="tag ' + (x.diff > 0 ? "warn" : "blue") + '">' + (x.diff > 0 ? "Self higher" : "Others higher") + "</span></div>" +
          '<div class="tiny muted">Self: ' + C.levelFor(D.S.skills[x.s.id]).name + " · Others: " + C.levelFor(D.O.skills[x.s.id]).name + " (" + (x.diff > 0 ? "+" : "") + fmt(x.diff, 1) + ")</div></div>";
      }).join("") : '<p class="muted" style="padding:14px 0">No skill differs by a full level between your view and others’. Nicely aligned.</p>';
    } else {
      gaps = '<p class="muted" style="padding:14px 0">Perception gaps appear once someone else has evaluated you in this cycle. Inviting evaluators and aligning on differences arrives in the next build.</p>';
    }
    var gapsCard = '<div class="card"><h3>Perception gaps</h3><div class="sub">Skills where self and others differ by a full level or more</div><div style="margin-top:6px">' + gaps + "</div></div>";

    var distRows = [];
    function dr(label, sum) {
      if (!sum) return;
      var tot = sum.rated || 1;
      distRows.push('<div class="dist-row"><div class="nm"><span>' + label + '</span><span class="muted">' + sum.rated + " skills rated</span></div><div class=\"stack\">" +
        F.levels.map(function (l) { var n = sum.dist[l.id], w = n / tot * 100; return n ? '<i class="lv' + l.id + '" style="width:' + w.toFixed(1) + '%" title="' + l.name + ": " + n + '">' + (w > 7 ? n : "") + "</i>" : ""; }).join("") + "</div></div>");
    }
    dr("Self", D.S); dr("Others", D.O); dr("Previous self" + (D.prev ? " · " + esc(D.prev.cycleLabel) : ""), D.P);
    var leg = '<div class="row wrap" style="margin-top:4px">' + F.levels.map(function (l) { return '<span class="chip lgd" style="--c:' + l.color + '">' + l.name + "</span>"; }).join("") + "</div>";
    var distCard = '<div class="card"><h3>Level distribution</h3><div class="sub">How the 52 skills spread across the four levels</div><div style="margin-top:16px">' + distRows.join("") + leg + "</div></div>";

    var chg = "";
    if (D.S && D.P) {
      var mv = F.skills.filter(function (s) { return D.S.skills[s.id] != null && D.P.skills[s.id] != null; }).map(function (s) { return { s: s, d: D.S.skills[s.id] - D.P.skills[s.id] }; });
      var up = mv.filter(function (x) { return x.d > 0; }).sort(function (a, b) { return b.d - a.d; }).slice(0, 3);
      var dn = mv.filter(function (x) { return x.d < 0; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
      var line = function (x) { return '<div class="focus-item" data-act="skill-detail" data-skill="' + x.s.id + '"><div class="row"><span class="ft">' + x.s.num + " " + esc(x.s.title) + '</span><span class="spacer"></span><span class="tag ' + (x.d > 0 ? "up" : "down") + '">' + (x.d > 0 ? "▲ +" : "▼ ") + fmt(x.d, 0) + "</span></div></div>"; };
      chg = '<div class="sec-title" style="margin-top:2px">Biggest improvements</div>' + (up.length ? up.map(line).join("") : '<p class="muted small">None.</p>') +
        '<div class="sec-title" style="margin-top:14px">Biggest declines</div>' + (dn.length ? dn.map(line).join("") : '<p class="muted small">None.</p>');
    } else {
      chg = '<p class="muted" style="padding:14px 0">Changes appear once you have two self-assessments from different cycles.</p>';
    }
    var chgCard = '<div class="card"><h3>Changes &amp; improvements</h3><div class="sub">Self-assessment vs your previous cycle</div><div style="margin-top:8px">' + chg + "</div></div>";
    return row1 + '<div class="grid g-dash2">' + gapsCard + distCard + chgCard + "</div>";
  }

  function insights(D) {
    var main = D.S || D.O, out = [];
    var ds = F.dimensions.filter(function (d) { return main.dims[d.id] != null; }).sort(function (a, b) { return main.dims[b.id] - main.dims[a.id]; });
    var top = ds[0], low = ds[ds.length - 1];
    out.push("Strongest dimension: <b>" + esc(top.short) + "</b> (" + fmt(main.dims[top.id], 1) + " · " + C.levelFor(main.dims[top.id]).name + ").");
    out.push("Furthest from Expert: <b>" + esc(low.short) + "</b>, " + fmt(4 - main.dims[low.id], 1) + " levels to go.");
    if (D.S && D.O) {
      var df = F.dimensions.filter(function (d) { return D.S.dims[d.id] != null && D.O.dims[d.id] != null; })
        .map(function (d) { return { d: d, x: D.S.dims[d.id] - D.O.dims[d.id] }; }).sort(function (a, b) { return Math.abs(b.x) - Math.abs(a.x); });
      var g = df[0];
      if (g && Math.abs(g.x) >= 0.5) {
        out.push(g.x > 0
          ? "You rate yourself <b>" + fmt(g.x, 1) + "</b> levels above others in <b>" + esc(g.d.short) + "</b>: worth a conversation."
          : "Others rate you <b>" + fmt(-g.x, 1) + "</b> levels above your self-view in <b>" + esc(g.d.short) + "</b>: a possible hidden strength.");
      } else out.push("Your self-view and others’ view are closely aligned across dimensions.");
    }
    if (D.S && D.P) {
      var up = 0, dn = 0;
      F.skills.forEach(function (s) { var a = D.S.skills[s.id], b = D.P.skills[s.id]; if (a != null && b != null) { if (a > b) up++; else if (a < b) dn++; } });
      var best = F.dimensions.map(function (d) { return { d: d, x: (D.S.dims[d.id] || 0) - (D.P.dims[d.id] || 0) }; }).sort(function (a, b) { return b.x - a.x; })[0];
      out.push("Since <b>" + esc(D.prev.cycleLabel) + "</b>: " + up + " skills moved up, " + dn + " moved down; overall " + (D.S.overall - D.P.overall >= 0 ? "+" : "") + fmt(D.S.overall - D.P.overall, 2) + ". Biggest jump: <b>" + esc(best.d.short) + "</b> (+" + fmt(best.x, 1) + ").");
    }
    return out;
  }

  function dashDimensions(user, D) {
    var open = ViewState.dash.openDims;
    var rows = F.dimensions.map(function (d) {
      var main = D.S || D.O, sc = main.dims[d.id];
      var cell = function (sum) { return sum && sum.dims[d.id] != null ? '<span class="num">' + fmt(sum.dims[d.id], 1) + "</span> " + U.scorePill(sum.dims[d.id]) : '<span class="muted">–</span>'; };
      var delta = D.S && D.P && D.S.dims[d.id] != null && D.P.dims[d.id] != null ? D.S.dims[d.id] - D.P.dims[d.id] : null;
      var r = '<tr class="click" data-act="toggle-dim" data-dim="' + d.id + '"><td><span class="dot" style="--c:' + pillarColor(d.pillar) + '"></span><b>' + d.n + " · " + esc(d.name) + '</b></td><td>' + cell(D.S) + "</td><td>" + cell(D.O) + "</td><td>" + cell(D.P) + "</td>" +
        '<td class="num ' + (delta == null ? "" : delta >= 0 ? "up-c" : "down-c") + '">' + (delta == null ? "–" : (delta >= 0 ? "▲ +" : "▼ ") + fmt(delta, 1)) + '</td><td><span class="gapbar"><i style="width:' + (sc / 4 * 100).toFixed(0) + '%"></i></span> <span class="small num">' + fmt(4 - sc, 1) + "</span></td></tr>";
      if (open[d.id]) {
        d.skills.forEach(function (s) {
          var lv = function (sum) { return sum && sum.skills[s.id] != null ? U.scorePill(sum.skills[s.id], { line: true }) : '<span class="muted">–</span>'; };
          r += '<tr class="sub click" data-act="skill-detail" data-skill="' + s.id + '"><td style="padding-left:34px">' + s.num + " " + esc(s.title) + "</td><td>" + lv(D.S) + "</td><td>" + lv(D.O) + "</td><td>" + lv(D.P) + '</td><td></td><td></td></tr>';
        });
      }
      return r;
    }).join("");
    return '<div class="card" style="padding:8px 8px 6px"><table class="t"><thead><tr><th>Dimension</th><th>Self</th><th>Others (avg)</th><th>Previous self</th><th>Δ self</th><th>Levels to Expert</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<p class="muted small" style="margin-top:10px">Click a dimension to expand its skills; click a skill to see what each level looks like.</p>';
  }

  function dashProgress(user, D) {
    var subs = D.subs, d = ViewState.dash;
    var cycles = D.cycles.slice().reverse();
    var dimOpts = '<option value="all"' + (d.progDim === "all" ? " selected" : "") + ">Overall (all dimensions)</option>" + F.dimensions.map(function (x) { return '<option value="' + x.id + '"' + (d.progDim === x.id ? " selected" : "") + ">" + x.n + " · " + esc(x.short) + "</option>"; }).join("");
    function val(sum) { if (!sum) return null; return d.progDim === "all" ? sum.overall : sum.dims[d.progDim]; }
    var selfV = cycles.map(function (c) { var a = subs.filter(function (x) { return x.cycle === c && x.evaluatorId === user.id; }).sort(function (a, b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)); })[0]; return val(a ? C.summarize([a]) : null); });
    var othV = cycles.map(function (c) { var l = subs.filter(function (x) { return x.cycle === c && x.evaluatorId !== user.id; }); return val(l.length ? C.summarize(l) : null); });
    var series = [{ name: "Self", color: SERIES.self, values: selfV }];
    if (othV.some(function (v) { return v != null; })) series.push({ name: "Others", color: SERIES.others, values: othV });
    var labels = cycles.map(function (c) { return D.cycleLabels[c]; });
    var chart = '<div class="card"><div class="row wrap"><div><h3>Progress over time</h3><div class="sub">Average level per cycle · each submission is a dated snapshot</div></div><div class="spacer"></div><select class="input" style="width:auto;max-width:300px" data-bind="prog-dim" aria-label="Dimension">' + dimOpts + "</select></div>" +
      '<div class="legend" style="margin-top:12px">' + series.map(function (s) { return '<span class="lg" style="--c:' + s.color + '"><i></i>' + s.name + "</span>"; }).join("") + "</div>" +
      (cycles.length > 1 || labels.length ? U.lineChart(labels, series) : "") + "</div>";

    var moves = "";
    if (D.S && D.P) {
      var mv = F.skills.filter(function (s) { return D.S.skills[s.id] != null && D.P.skills[s.id] != null && D.S.skills[s.id] !== D.P.skills[s.id]; })
        .map(function (s) { return { s: s, a: D.P.skills[s.id], b: D.S.skills[s.id] }; }).sort(function (x, y) { return (y.b - y.a) - (x.b - x.a); });
      moves = mv.length ? '<table class="t"><thead><tr><th>Skill</th><th>' + esc(D.prev.cycleLabel) + "</th><th>" + esc(D.cycleLabels[D.cycle]) + "</th><th>Change</th></tr></thead><tbody>" + mv.map(function (x) {
        return '<tr class="click" data-act="skill-detail" data-skill="' + x.s.id + '"><td>' + x.s.num + " " + esc(x.s.title) + '<div class="tiny muted">' + esc(F.dim(x.s.dimId).short) + "</div></td><td>" + U.levelPill(x.a) + "</td><td>" + U.levelPill(x.b) + '</td><td><span class="tag ' + (x.b > x.a ? "up" : "down") + '">' + (x.b > x.a ? "▲ +" : "▼ ") + (x.b - x.a) + "</span></td></tr>";
      }).join("") + "</tbody></table>" : '<p class="muted">No skill changed level between these two self-assessments.</p>';
    } else moves = '<p class="muted">Select a cycle that has an earlier self-assessment to see which skills moved.</p>';
    return chart + '<div class="card" style="margin-top:18px"><h3>Skill movements</h3><div class="sub">Self-assessment, ' + (D.P ? esc(D.prev.cycleLabel) + " → " : "") + esc(D.cycleLabels[D.cycle]) + '</div><div style="margin-top:10px">' + moves + "</div></div>";
  }

  /* =============================================================== SKILL DETAIL MODAL */
  function skillModal(user, skillId) {
    var s = F.skill(skillId), d = F.dim(s.dimId), D = dashData(user);
    var self = D && D.S ? D.S.skills[s.id] : null, oth = D && D.O ? D.O.skills[s.id] : null;
    var cur = self != null ? self : oth;
    var curLv = cur != null ? C.levelFor(cur).id : null;
    var next = curLv && curLv < 4 ? curLv + 1 : null;
    var rows = F.levels.map(function (l) {
      var tags = [];
      if (self != null && C.levelFor(self).id === l.id) tags.push('<span class="tag blue">Your self-rating</span>');
      if (oth != null && C.levelFor(oth).id === l.id) tags.push('<span class="tag">Others’ average</span>');
      if (next === l.id) tags.push('<span class="tag up">Next target</span>');
      return '<div class="lv-row lv' + l.id + (curLv === l.id ? " cur" : "") + (next === l.id ? " next" : "") + '"><b>' + l.name + " " + tags.join(" ") + "</b>" + esc(F.text(s, l.id)) + "</div>";
    }).join("");
    return '<div class="row" style="align-items:flex-start"><div><div class="tiny muted" style="font-weight:800;letter-spacing:1px;text-transform:uppercase">' + esc(d.name) + "</div><h2 style=\"margin-top:3px\">" + s.num + " " + esc(s.title) + '</h2></div><div class="spacer"></div><button class="btn ghost sm" data-act="close-modal" aria-label="Close">✕</button></div>' +
      '<div style="margin-top:8px">' + rows + "</div>" +
      '<div class="row" style="margin-top:18px"><button class="btn sm" data-go="framework/' + d.id + '" data-act="close-modal">Open in framework</button><span class="spacer"></span><button class="btn sm disabled" disabled title="Planned for a later build">Add to development plan · coming soon</button></div>';
  }

  /* =============================================================== SELF-ASSESSMENT */
  function viewAssessLanding(user) {
    var draft = St.draftFor(user.id);
    var past = St.submittedAbout(user.id).filter(function (a) { return a.evaluatorId === user.id; }).sort(function (a, b) { return String(b.submittedAt).localeCompare(String(a.submittedAt)); });
    var cta = draft
      ? '<div class="callout" style="margin-bottom:14px">You have a draft in progress: <b>' + C.progress(draft).done + " of 52</b> skills answered (" + esc(draft.cycleLabel) + ").</div>" +
        '<div class="row wrap"><button class="btn primary" data-act="resume-assess">Resume draft</button><button class="btn" data-act="discard-draft" data-id="' + draft.id + '">Discard draft</button></div>'
      : '<div class="row wrap"><button class="btn primary" data-act="start-assess">Start a new self-assessment</button></div>';
    var scale = '<div class="lv-scale" style="margin-top:14px">' + F.levels.map(function (l) { return '<div class="lv' + l.id + '"><b>' + l.name + "</b><span>Score " + l.id + " · “" + l.deckLabel + "” in the source deck</span></div>"; }).join("") + "</div>";
    var pastRows = past.length ? '<table class="t"><thead><tr><th>Submitted</th><th>Cycle</th><th>Overall</th><th></th></tr></thead><tbody>' + past.map(function (a) {
      var sm = C.summarize([a]);
      return "<tr><td>" + U.fmtDate(a.submittedAt) + "</td><td>" + esc(a.cycleLabel) + '</td><td><span class="num">' + fmt(sm.overall, 1) + "</span> " + U.scorePill(sm.overall) + '</td><td class="right"><a href="#/history/' + a.id + '">View</a></td></tr>';
    }).join("") + "</tbody></table>" : '<p class="muted">No submitted self-assessments yet.</p>';
    return '<div class="page-head"><div><h1>Self-assessment</h1><div class="sub">Rate yourself on 52 skills across 11 dimensions. Pick the level whose description fits you best today, add notes if useful, and submit. Every submission is saved as a dated snapshot.</div></div></div>' +
      '<div class="grid g-2"><div class="card"><h3>' + (draft ? "Continue" : "Start") + '</h3><div class="sub">About 20–30 minutes. Your draft autosaves as you go.</div><div style="margin-top:16px">' + cta + "</div>" +
      '<div class="sec-title" style="margin-top:22px">How the levels work</div><p class="small muted">Each skill has four descriptions, from Apprentice to Expert. Choose the one closest to how you really operate, not how you aspire to. If you don’t have enough information to judge a skill, mark it “Not enough information”.</p>' + scale + "</div>" +
      '<div class="card"><h3>Your previous self-assessments</h3><div class="sub">Snapshots you have submitted</div><div style="margin-top:10px">' + pastRows + "</div></div></div>";
  }

  function railHTML(a, cur) {
    var h = "";
    F.pillars.forEach(function (p) {
      h += '<h6 style="--c:' + p.color + '">' + esc(p.name) + "</h6>";
      F.dimensions.filter(function (d) { return d.pillar === p.id; }).forEach(function (d) {
        var pr = C.dimProgress(a, d), done = pr.done === pr.total;
        h += '<a href="#/assess/run/' + d.n + '" class="' + (cur === d.n ? "cur " : "") + (done ? "done" : "") + '"><span class="n">' + (done ? "✓" : d.n) + "</span><span>" + esc(d.short) + '</span><span class="ct">' + pr.done + "/" + pr.total + "</span></a>";
      });
    });
    var all = C.progress(a);
    h += '<h6 style="--c:#1e9bf0">Finish</h6><a href="#/assess/run/review" class="' + (cur === "review" ? "cur" : "") + '"><span class="n">★</span><span>Review &amp; submit</span><span class="ct">' + all.done + "/" + all.total + "</span></a>";
    return h;
  }

  function skillBlock(a, s) {
    var r = a.ratings[s.id] || { level: null, na: false, note: "" };
    var notesOpen = ViewState.assess.openNotes[s.id] || (r.note && r.note.length);
    var cards = F.levels.map(function (l) {
      var sel = r.level === l.id;
      return '<button type="button" class="lvl lv' + l.id + (sel ? " sel" : "") + '" role="radio" aria-checked="' + sel + '" data-act="rate" data-skill="' + s.id + '" data-level="' + l.id + '"><span class="lvl-name"><span>' + l.name + '</span></span><span class="lvl-txt">' + esc(F.text(s, l.id)) + "</span></button>";
    }).join("");
    return '<div class="skill' + (r.na ? " na" : "") + '" data-skill-block="' + s.id + '"><div class="skill-t"><span class="no">' + s.num + "</span><b>" + esc(s.title) + "</b></div>" +
      '<div class="levels" role="radiogroup" aria-label="' + esc(s.title) + '">' + cards + "</div>" +
      '<div class="skill-tools"><label class="toggle"><input type="checkbox" data-act="na" data-skill="' + s.id + '"' + (r.na ? " checked" : "") + "> Not enough information to rate</label>" +
      '<button type="button" class="note-btn" data-act="note-toggle" data-skill="' + s.id + '">' + (notesOpen ? "Hide note" : (r.note ? "Edit note" : "+ Add a note")) + "</button></div>" +
      (notesOpen ? '<textarea class="input" style="margin-top:10px" rows="2" placeholder="Evidence, examples, context (optional)" data-note="' + s.id + '" aria-label="Note for ' + esc(s.title) + '">' + esc(r.note || "") + "</textarea>" : "") + "</div>";
  }

  function footbar(a, dim) {
    var all = C.progress(a), pr = C.dimProgress(a, dim);
    var prev = dim.n > 1 ? '<button class="btn" data-go="assess/run/' + (dim.n - 1) + '">← Back</button>' : "";
    var next = dim.n < 11 ? '<button class="btn primary" data-go="assess/run/' + (dim.n + 1) + '">Next dimension →</button>' : '<button class="btn accent" data-go="assess/run/review">Review &amp; submit →</button>';
    return '<div class="footbar" id="footbar"><div><div class="small" style="font-weight:700">Dimension ' + dim.n + " of 11 · " + pr.done + "/" + pr.total + ' answered</div><div class="row" style="margin-top:5px"><div class="progress"><i style="width:' + (all.done / all.total * 100).toFixed(0) + '%"></i></div><span class="tiny muted">' + all.done + "/" + all.total + ' overall · autosaved</span></div></div><div class="spacer"></div>' + prev + next + "</div>";
  }

  function dimCard(a, dim) {
    return '<div class="dim-head" style="--c:' + pillarColor(dim.pillar) + '"><span class="dim-n">' + dim.n + '</span><div><div class="tiny muted" style="font-weight:800;letter-spacing:1px;text-transform:uppercase">' + esc(F.pillar(dim.pillar).name) + "</div><h2>" + esc(dim.name) + '</h2><div class="muted small" style="margin-top:4px">' + esc(dim.headline) + "</div></div></div>" +
      dim.skills.map(function (s) { return skillBlock(a, s); }).join("") + footbar(a, dim);
  }

  function viewAssessRun(user, step) {
    var a = St.draftFor(user.id);
    if (!a) { location.hash = "#/assess"; return ""; }
    var tools = '<div class="row wrap"><button class="btn sm" data-act="fill-demo" title="Fills every unanswered skill with plausible random levels">Fill with demo answers</button><button class="btn sm" data-act="clear-draft">Clear answers</button><button class="btn sm" data-act="discard-draft" data-id="' + a.id + '">Discard draft</button><button class="btn sm primary" data-go="assess">Save &amp; exit</button></div>';
    var head = '<div class="page-head"><div><h1>Self-assessment · ' + esc(a.cycleLabel) + '</h1><div class="sub">Draft · answers save automatically</div></div><div class="spacer"></div>' + tools + "</div>";
    if (step === "review") return head + viewReview(user, a);
    var n = Math.max(1, Math.min(11, parseInt(step, 10) || 1)), dim = F.dimensions[n - 1];
    ViewState.assess.step = n;
    return head + '<div class="assess"><aside class="card rail" id="rail">' + railHTML(a, n) + '</aside><section class="card" id="dimcard">' + dimCard(a, dim) + "</section></div>";
  }

  function viewReview(user, a) {
    var all = C.progress(a), sm = C.summarize([a]);
    var rows = F.dimensions.map(function (d) {
      var pr = C.dimProgress(a, d), ok = pr.done === pr.total, sc = sm.dims[d.id];
      return '<div class="review-row"><span class="dim-n" style="--c:' + pillarColor(d.pillar) + ';width:30px;height:30px;font-size:13px">' + d.n + "</span><div><b>" + esc(d.name) + "</b>" + (ok ? "" : '<div class="tiny" style="color:var(--warn);font-weight:700">' + (pr.total - pr.done) + ' skill(s) still unanswered</div>') + "</div><div>" + (sc != null ? U.scorePill(sc) : '<span class="pill none">N/A</span>') + '</div><div class="right"><a href="#/assess/run/' + d.n + '">' + (ok ? "Edit" : "Finish") + " →</a></div></div>";
    }).join("");
    var ready = all.done === all.total;
    var axes = F.dimensions.map(function (d) { return { label: d.short }; });
    return '<div class="grid g-2"><div class="card"><h3>Review your answers</h3><div class="sub">' + all.done + " of " + all.total + " skills answered</div><div style=\"margin-top:10px\">" + rows + "</div>" +
      '<div style="margin-top:18px">' + (ready ? '<div class="callout" style="margin-bottom:14px">Everything is answered. Submitting locks this assessment as a dated snapshot; you can always take a new one later.</div><button class="btn accent" data-act="submit-assess">Submit self-assessment</button>' : '<div class="callout warn" style="margin-bottom:14px">Answer every skill (or mark “Not enough information”) before submitting.</div><button class="btn disabled" disabled>Submit self-assessment</button>') + "</div></div>" +
      '<div class="card"><h3>Preview</h3><div class="sub">Your answers so far</div>' + U.radar(axes, [{ name: "Self", color: SERIES.self, values: F.dimensions.map(function (d) { return sm.dims[d.id]; }), fillOpacity: 0.14 }]) + "</div></div>";
  }

  /* =============================================================== HISTORY */
  function who(a, user) {
    var ev = St.user(a.evaluatorId), sub = St.user(a.subjectId);
    return { ev: ev ? ev.name : "Unknown", sub: sub ? sub.name : "Unknown", isSelf: a.evaluatorId === a.subjectId };
  }

  function viewHistory(user) {
    var f = ViewState.hist.filter;
    var all = St.historyFor(user.id).slice().sort(function (a, b) { return String(b.submittedAt || b.updatedAt).localeCompare(String(a.submittedAt || a.updatedAt)); });
    var list = all.filter(function (a) {
      if (f === "self") return a.evaluatorId === a.subjectId;
      if (f === "others") return a.subjectId === user.id && a.evaluatorId !== user.id;
      if (f === "written") return a.evaluatorId === user.id && a.subjectId !== user.id;
      return true;
    });
    var seg = [["all", "All"], ["self", "My self-assessments"], ["others", "About me by others"], ["written", "Written by me"]].map(function (x) { return '<button class="' + (f === x[0] ? "on" : "") + '" data-act="hist-filter" data-f="' + x[0] + '">' + x[1] + "</button>"; }).join("");
    var rows = list.map(function (a) {
      var w = who(a, user), sm = C.summarize([a]);
      var type = w.isSelf ? '<span class="tag blue">Self</span>' : '<span class="tag">' + esc(a.relationship) + "</span>";
      var by = w.isSelf ? "You" : esc(w.ev) + (a.evaluatorId === user.id ? " (you)" : "");
      var about = a.subjectId === user.id ? "You" : esc(w.sub);
      var action = a.status === "draft" ? '<a href="#/assess/run/1" data-act="resume-assess">Continue</a>' : '<a href="#/history/' + a.id + '">Open</a>';
      return '<tr><td class="nowrap">' + U.fmtDate(a.submittedAt || a.updatedAt) + "</td><td>" + esc(a.cycleLabel) + "</td><td>" + type + "</td><td>" + by + "</td><td>" + about + "</td><td>" + (a.status === "draft" ? '<span class="pill none">Draft · ' + C.progress(a).done + "/52</span>" : '<span class="num">' + fmt(sm.overall, 1) + "</span> " + U.scorePill(sm.overall)) + '</td><td class="right">' + action + "</td></tr>";
    }).join("");
    var table = list.length ? '<table class="t"><thead><tr><th>Date</th><th>Cycle</th><th>Type</th><th>Evaluator</th><th>About</th><th>Overall</th><th></th></tr></thead><tbody>' + rows + "</tbody></table>" : '<div class="empty" style="padding:36px"><p>Nothing here yet.</p></div>';
    return '<div class="page-head"><div><h1>History</h1><div class="sub">Every submitted evaluation about you (with evaluator and relationship), plus the ones you wrote. You only see what you have permission to see.</div></div></div>' +
      '<div class="card"><div class="hist-filter"><div class="seg">' + seg + '</div></div>' + table + "</div>";
  }

  function viewHistoryDetail(user, id) {
    var a = St.assessment(id);
    var allowed = a && ((a.status === "submitted" && (a.subjectId === user.id || a.evaluatorId === user.id)) || (a.status === "draft" && a.evaluatorId === user.id));
    if (!allowed) return '<div class="card empty"><h2>No access</h2><p>This evaluation doesn’t exist or you don’t have permission to view it.</p><button class="btn" data-go="history">Back to history</button></div>';
    if (a.status === "draft") { location.hash = "#/assess/run/1"; return ""; }
    var w = who(a, user), sm = C.summarize([a]);
    var cands = St.historyFor(user.id).filter(function (x) { return x.subjectId === a.subjectId && x.status === "submitted" && x.id !== a.id; })
      .sort(function (x, y) { return String(y.submittedAt).localeCompare(String(x.submittedAt)); });
    var cmpId = ViewState.hist.compare, cmp = cands.filter(function (x) { return x.id === cmpId; })[0] || null;
    if (!cmp) ViewState.hist.compare = "";
    var cs = cmp ? C.summarize([cmp]) : null;
    var label = function (x) { var ww = who(x, user); return (ww.isSelf ? "Self" : x.relationship + " · " + ww.ev) + " · " + x.cycleLabel; };
    var cmpOpts = '<option value="">No comparison</option>' + cands.map(function (x) { return '<option value="' + x.id + '"' + (x.id === cmpId ? " selected" : "") + ">" + esc(label(x)) + "</option>"; }).join("");
    var axes = F.dimensions.map(function (d) { return { label: d.short }; });
    var series = [{ name: "This evaluation", color: SERIES.self, values: F.dimensions.map(function (d) { return sm.dims[d.id]; }), fillOpacity: 0.14 }];
    if (cs) series.push({ name: "Compared", color: SERIES.others, values: F.dimensions.map(function (d) { return cs.dims[d.id]; }), dash: true, fillOpacity: 0.05 });
    var dimRows = F.dimensions.map(function (d) {
      var x = sm.dims[d.id], y = cs ? cs.dims[d.id] : null, dl = x != null && y != null ? x - y : null;
      return '<tr><td><span class="dot" style="--c:' + pillarColor(d.pillar) + '"></span>' + d.n + " · " + esc(d.short) + '</td><td class="num">' + fmt(x, 1) + (x != null ? " " + U.scorePill(x) : "") + "</td>" + (cs ? '<td class="num">' + fmt(y, 1) + '</td><td class="num ' + (dl == null ? "" : dl > 0 ? "up-c" : dl < 0 ? "down-c" : "") + '">' + (dl == null ? "–" : (dl > 0 ? "+" : "") + fmt(dl, 1)) + "</td>" : "") + "</tr>";
    }).join("");
    var skills = F.dimensions.map(function (d) {
      var body = d.skills.map(function (s) {
        var r = a.ratings[s.id] || {}, r2 = cmp ? (cmp.ratings[s.id] || {}) : null;
        var l1 = r.na ? null : r.level, l2 = r2 && !r2.na ? r2.level : null, dl = l1 && l2 ? l1 - l2 : null;
        return '<div class="sk-row"><span class="muted" style="font-weight:800">' + s.num + "</span><span>" + esc(s.title) + "</span><span>" + (r.na ? '<span class="pill none">N/A</span>' : U.levelPill(l1)) + "</span><span>" + (cmp ? (r2.na ? '<span class="pill none">N/A</span>' : U.levelPill(l2)) : "") + '</span><span class="num ' + (dl > 0 ? "up-c" : dl < 0 ? "down-c" : "") + '">' + (dl == null ? "" : (dl > 0 ? "+" : "") + dl) + "</span></div>" + (r.note ? '<div class="note-q">' + esc(r.note) + "</div>" : "");
      }).join("");
      return '<details class="card" style="padding:0;margin-bottom:10px;overflow:hidden"><summary style="cursor:pointer;padding:14px 18px;font-weight:700;display:flex;gap:10px;align-items:center"><span class="dot" style="--c:' + pillarColor(d.pillar) + '"></span>' + d.n + " · " + esc(d.name) + '<span class="spacer"></span>' + U.scorePill(sm.dims[d.id], { showNum: true }) + '</summary><div style="padding:0 18px 12px"><div class="sk-row head"><span>#</span><span>Skill</span><span>This</span><span>' + (cmp ? "Compared" : "") + "</span><span>" + (cmp ? "Δ" : "") + "</span></div>" + body + "</div></details>";
    }).join("");
    var title = w.isSelf ? "Self-assessment" : a.relationship + " evaluation";
    return '<div class="page-head"><div><a href="#/history" class="small">← History</a><h1 style="margin-top:4px">' + esc(title) + " · " + esc(a.cycleLabel) + '</h1><div class="sub">Evaluator: <b>' + (w.isSelf ? "You" : esc(w.ev)) + "</b>" + (w.isSelf ? "" : " (" + esc(a.relationship) + ")") + " · About: <b>" + (a.subjectId === user.id ? "You" : esc(w.sub)) + "</b> · Submitted " + U.fmtDate(a.submittedAt) + " · " + sm.rated + "/52 skills rated · Overall <b>" + fmt(sm.overall, 2) + "</b> " + U.scorePill(sm.overall) + "</div></div></div>" +
      '<div class="grid g-2"><div class="card"><div class="row wrap"><h3>Dimensions</h3><div class="spacer"></div><label class="small muted" style="font-weight:700" for="cmp">Compare with</label><select id="cmp" class="input" style="width:auto;max-width:320px" data-bind="hist-compare">' + cmpOpts + "</select></div>" + U.radar(axes, series) + "</div>" +
      '<div class="card"><h3>Scores by dimension</h3><table class="t" style="margin-top:8px"><thead><tr><th>Dimension</th><th>This</th>' + (cs ? "<th>Compared</th><th>Δ</th>" : "") + "</tr></thead><tbody>" + dimRows + "</tbody></table></div></div>" +
      '<h2 style="margin:26px 0 12px">Skill detail</h2>' + skills;
  }

  /* =============================================================== PROFILE */
  var SECTORS = ["Banking", "Insurance", "Capital Markets", "Retail & Consumer", "Telecom", "Energy & Utilities", "Manufacturing", "Public Sector", "Healthcare", "Technology & Media", "Transportation & Logistics"];
  var PORTFOLIOS = ["", "< $5M", "$5–10M", "$10–25M", "$25–50M", "> $50M"];

  function tagInput(field, values, datalistId, placeholder) {
    return '<div class="taginput" data-tags="' + field + '">' + (values || []).map(function (v) { return '<span class="chip" data-v="' + esc(v) + '">' + esc(v) + '<button type="button" data-act="tag-remove" aria-label="Remove ' + esc(v) + '">×</button></span>'; }).join("") +
      '<input data-taginput="' + field + '"' + (datalistId ? ' list="' + datalistId + '"' : "") + ' placeholder="' + esc(placeholder || "Type and press Enter") + '" aria-label="' + esc(field) + '"></div>';
  }

  function profileCompleteness(u) {
    var p = u.profile || {};
    var has = function (x) { return x !== "" && x != null; };           // numbers (including 0) and strings
    var list = function (x) { return (x || []).length > 0; };
    var checks = [has(u.name), has(u.title), has(p.office), has(p.yearsExperience), has(p.yearsCompany), has(p.yearsCM), list(p.sectors),
      has(p.accounts), has(p.portfolio), has(p.teamSize), list(p.partners), list(p.languages), has(p.aspiration), has(p.bio)];
    var filled = checks.filter(Boolean).length;
    return Math.round(filled / checks.length * 100);
  }

  function viewProfile(user) {
    var p = user.profile || {};
    var num = function (name, label, val, hint) { return '<div class="field"><label class="f" for="p-' + name + '">' + label + '</label><input class="input" id="p-' + name + '" name="' + name + '" type="number" min="0" max="60" step="0.5" value="' + esc(val == null ? "" : val) + '">' + (hint ? '<div class="hint">' + hint + "</div>" : "") + "</div>"; };
    var txt = function (name, label, val, ph) { return '<div class="field"><label class="f" for="p-' + name + '">' + label + '</label><input class="input" id="p-' + name + '" name="' + name + '" value="' + esc(val || "") + '" placeholder="' + esc(ph || "") + '"></div>'; };
    var pc = profileCompleteness(user);
    return '<div class="page-head"><div><h1>Profile</h1><div class="sub">General data about you and your role. It gives context to your evaluations and, later, to your development plan.</div></div></div>' +
      '<div class="card" style="margin-bottom:18px"><div class="profile-top"><span class="avatar lg">' + U.initials(user.name) + '</span><div><h2>' + esc(user.name) + '</h2><div class="muted">' + esc(user.title) + " · " + esc(user.email) + '</div></div><div class="spacer"></div><div><div class="small" style="font-weight:700;margin-bottom:6px">Profile completeness · ' + pc + '%</div><div class="meter"><i style="width:' + pc + '%"></i></div></div></div></div>' +
      '<form data-form="profile" class="card" novalidate>' +
      '<div class="sec-title">Basics</div><div class="form-grid">' + txt("name", "Full name", user.name) + txt("title", "Job title", user.title, "Client Manager") + txt("office", "Office / location", p.office, "City or office") + txt("reportsTo", "Reports to", p.reportsTo, "Name of your manager") + "</div>" +
      '<div class="sec-title">Experience</div><div class="form-grid">' + num("yearsExperience", "Total years of professional experience", p.yearsExperience) + num("yearsCompany", "Years at the company", p.yearsCompany) + num("yearsCM", "Years in a Client Manager role", p.yearsCM, "Include equivalent roles") + "</div>" +
      '<div class="sec-title">Role context</div><div class="form-grid"><div class="field full"><label class="f">Sectors you serve</label>' + tagInput("sectors", p.sectors, "dl-sectors", "Add a sector…") + '<div class="hint">Maps to “Industry Knowledge”.</div></div>' +
      num("accounts", "Number of accounts you manage", p.accounts) + '<div class="field"><label class="f" for="p-portfolio">Annual revenue managed</label><select class="input" id="p-portfolio" name="portfolio">' + PORTFOLIOS.map(function (x) { return '<option value="' + esc(x) + '"' + (p.portfolio === x ? " selected" : "") + ">" + (x || "Select a range") + "</option>"; }).join("") + '</select><div class="hint">Context for “Financial Performance”.</div></div>' +
      num("teamSize", "Account team size", p.teamSize, "People you lead or coordinate; context for “Delivery & Talent”.") + '<div class="field"><label class="f">Strategic partners you work with</label>' + tagInput("partners", p.partners, "", "e.g. Cloud hyperscaler") + '<div class="hint">Context for “Alliances”.</div></div></div>' +
      '<div class="sec-title">About you</div><div class="form-grid"><div class="field"><label class="f">Languages</label>' + tagInput("languages", p.languages, "dl-lang", "Add a language…") + '</div><div class="field"><label class="f">Certifications</label>' + tagInput("certifications", p.certifications, "", "e.g. PMP") + "</div>" +
      '<div class="field full"><label class="f" for="p-aspiration">Next role you aspire to</label><input class="input" id="p-aspiration" name="aspiration" list="dl-asp" value="' + esc(p.aspiration || "") + '" placeholder="e.g. Client Partner / Account Director"></div>' +
      '<div class="field full"><label class="f" for="p-bio">Short bio</label><textarea class="input" id="p-bio" name="bio" rows="3" placeholder="A few lines about your background and focus">' + esc(p.bio || "") + "</textarea></div></div>" +
      '<datalist id="dl-sectors">' + SECTORS.map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + '</datalist><datalist id="dl-lang"><option value="English"><option value="Spanish"><option value="Portuguese"><option value="French"><option value="German"><option value="Mandarin"></datalist><datalist id="dl-asp"><option value="Senior Client Manager"><option value="Client Partner / Account Director"><option value="Sector Lead"><option value="Managing Director"></datalist>' +
      '<div class="row" style="margin-top:8px"><button class="btn primary" type="submit">Save profile</button><span class="muted small">Profile changes apply immediately.</span></div></form>';
  }

  /* =============================================================== FRAMEWORK */
  var fwFilter = "all";
  function viewFramework(user, openDim) {
    var seg = '<button class="' + (fwFilter === "all" ? "on" : "") + '" data-act="fw-filter" data-p="all">All pillars</button>' + F.pillars.map(function (p) { return '<button class="' + (fwFilter === p.id ? "on" : "") + '" data-act="fw-filter" data-p="' + p.id + '">' + esc(p.name) + "</button>"; }).join("");
    var dims = F.dimensions.filter(function (d) { return fwFilter === "all" || d.pillar === fwFilter; }).map(function (d, i) {
      var open = openDim ? openDim === d.id : false;
      return '<details class="card fw-dim" id="fw-' + d.id + '" style="--c:' + pillarColor(d.pillar) + '"' + (open ? " open" : "") + '><summary><span class="fw-n">' + d.n + '</span><div><h3>' + esc(d.name) + '</h3><div class="h">' + esc(F.pillar(d.pillar).name) + " · " + d.skills.length + " skills — " + esc(d.headline) + '</div></div><span class="chev">⌄</span></summary>' +
        '<table class="fw-table"><thead><tr><th class="sk">Skill</th>' + F.levels.map(function (l) { return '<th class="lv' + l.id + '">' + l.name + "</th>"; }).join("") + "</tr></thead><tbody>" +
        d.skills.map(function (s) { return '<tr><td class="sk">' + s.num + " " + esc(s.title) + "</td>" + F.levels.map(function (l) { return "<td>" + esc(F.text(s, l.id)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></details>";
    }).join("");
    return '<div class="page-head"><div><h1>Framework</h1><div class="sub">The Client Manager maturity model: 4 pillars, 11 dimensions, 52 skills and 4 levels. The goal is to move every skill toward Expert.</div></div></div>' +
      '<div class="card" style="margin-bottom:18px"><div class="sec-title" style="margin-top:0">The four levels</div><div class="lv-scale">' + F.levels.map(function (l) { return '<div class="lv' + l.id + '"><b>' + l.name + "</b><span>Score " + l.id + " in this app · “" + l.deckLabel + "” in the source deck</span></div>"; }).join("") + '</div><p class="small muted" style="margin-top:10px">The source deck numbers Expert as Level 1. This app uses a 1–4 score where 4 is Expert so that a higher number always means a higher level.</p></div>' +
      '<div class="row wrap" style="margin-bottom:14px"><div class="seg" style="flex-wrap:wrap">' + seg + '</div><div class="spacer"></div><button class="btn sm" data-act="fw-expand">Expand all</button><button class="btn sm" data-act="fw-collapse">Collapse all</button></div>' + dims;
  }
  function setFwFilter(v) { fwFilter = v; }

  global.Views = {
    state: ViewState, auth: viewAuth, dashboard: viewDashboard, skillModal: skillModal,
    assessLanding: viewAssessLanding, assessRun: viewAssessRun, railHTML: railHTML, skillBlock: skillBlock, footbar: footbar,
    history: viewHistory, historyDetail: viewHistoryDetail, profile: viewProfile, framework: viewFramework, setFwFilter: setFwFilter
  };
})(window);
