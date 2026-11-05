/* Calc (scoring), Seed (demo data) and Store (localStorage-backed "database").
   DEMO ONLY: passwords are stored in plain text in the browser. Do not enter real credentials or data. */
(function (global) {
  "use strict";
  var F = global.Framework;

  /* ------------------------------------------------------------------ Calc */
  var Calc = (function () {
    var L = F.levels;

    function mean(arr) {
      var v = arr.filter(function (x) { return x != null && !isNaN(x); });
      if (!v.length) return null;
      return v.reduce(function (s, x) { return s + x; }, 0) / v.length;
    }

    function levelFor(score) {
      if (score == null) return null;
      var id = score >= 3.5 ? 4 : score >= 2.5 ? 3 : score >= 1.5 ? 2 : 1;
      return F.level(id);
    }

    // Mean level per skill across a list of assessments (N/A and blanks ignored)
    function skillScores(list) {
      var out = {};
      F.skills.forEach(function (s) {
        var vals = [];
        list.forEach(function (a) {
          var r = a.ratings[s.id];
          if (r && !r.na && r.level) vals.push(r.level);
        });
        out[s.id] = vals.length ? mean(vals) : null;
      });
      return out;
    }

    function summarize(list) {
      if (!list || !list.length) return null;
      var skills = skillScores(list);
      var dims = {}, pillars = {};
      F.dimensions.forEach(function (d) {
        dims[d.id] = mean(d.skills.map(function (s) { return skills[s.id]; }));
      });
      F.pillars.forEach(function (p) {
        pillars[p.id] = mean(F.dimensions.filter(function (d) { return d.pillar === p.id; }).map(function (d) { return dims[d.id]; }));
      });
      var rated = F.skills.filter(function (s) { return skills[s.id] != null; }).length;
      var vals = F.dimensions.map(function (d) { return dims[d.id]; });
      var overall = mean(vals);
      var atExpert = F.skills.filter(function (s) { return skills[s.id] != null && skills[s.id] >= 3.5; }).length;
      var dist = { 4: 0, 3: 0, 2: 0, 1: 0 };
      F.skills.forEach(function (s) {
        var v = skills[s.id];
        if (v != null) dist[levelFor(v).id]++;
      });
      return { skills: skills, dims: dims, pillars: pillars, overall: overall, rated: rated, atExpert: atExpert, dist: dist, count: list.length };
    }

    function progress(a) {
      var done = 0;
      F.skills.forEach(function (s) {
        var r = a.ratings[s.id];
        if (r && (r.level || r.na)) done++;
      });
      return { done: done, total: F.skills.length };
    }

    function dimProgress(a, dim) {
      var done = 0;
      dim.skills.forEach(function (s) {
        var r = a.ratings[s.id];
        if (r && (r.level || r.na)) done++;
      });
      return { done: done, total: dim.skills.length };
    }

    function fmt(x, d) {
      return x == null ? "–" : x.toFixed(d == null ? 1 : d);
    }

    return { mean: mean, levelFor: levelFor, skillScores: skillScores, summarize: summarize, progress: progress, dimProgress: dimProgress, fmt: fmt, levels: L };
  })();

  /* ------------------------------------------------------------------ Seed */
  var Seed = (function () {
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function hash(str) {
      var h = 7;
      for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
      return h;
    }
    function clamp(v) { return Math.max(1, Math.min(4, Math.round(v))); }

    // "true" level per dimension for the sample CM, and how much they over/under-rate themselves
    var DIM_BASE = { d1: 2.6, d2: 3.1, d3: 3.2, d4: 2.0, d5: 2.5, d6: 3.0, d7: 2.4, d8: 1.7, d9: 2.9, d10: 2.2, d11: 3.1 };
    var SELF_BIAS = { d1: 0.3, d2: 0.0, d3: 0.2, d4: 0.8, d5: 0.3, d6: 0.0, d7: 0.2, d8: 0.3, d9: -0.7, d10: 0.8, d11: -0.6 };

    var NOTES = {
      self: {
        d1s1: "Strong with the CIO and COO; CFO access is still a gap.",
        d4s4: "I know the main sponsors but have not built relationships with them yet.",
        d8s5: "Took part in one funding request, supported by the alliances team.",
        d10s2: "Pricing mostly follows historical references."
      },
      mgr: {
        d1s1: "Good access at CIO level; needs exposure to the CFO and CEO.",
        d4s2: "Reacts well, but the account strategy rarely anticipates competitor moves.",
        d10s3: "Variances reached me before they reached the account plan.",
        d11s2: "Invests a lot in the team; seen as a natural mentor."
      },
      peer: {
        d9s3: "Often the person others call to unblock cross-unit issues.",
        d6s6: "Great at simplifying a complex deal for the steering committee."
      }
    };

    function makeAssessment(id, subjectId, evaluatorId, relationship, date, rng, base, opts) {
      var ratings = {};
      F.skills.forEach(function (s) {
        var na = opts.naDims && opts.naDims.indexOf(s.dimId) >= 0 && rng() < 0.45;
        if (na) { ratings[s.id] = { level: null, na: true, note: "" }; return; }
        var bias = opts.bias ? (opts.bias[s.dimId] || 0) : 0;
        var v = base[s.id] + (opts.offset || 0) + bias + (rng() - 0.5) * (opts.noise || 0.7);
        ratings[s.id] = { level: clamp(v), na: false, note: (opts.notes && opts.notes[s.id]) || "" };
      });
      var cyc = cycleOf(date);
      return {
        id: id, subjectId: subjectId, evaluatorId: evaluatorId, relationship: relationship,
        cycle: cyc.id, cycleLabel: cyc.label, status: "submitted",
        createdAt: date, updatedAt: date, submittedAt: date, ratings: ratings, sample: true
      };
    }

    function cycleOf(iso) {
      var d = new Date(iso);
      var q = Math.floor(d.getUTCMonth() / 3) + 1;
      return { id: d.getUTCFullYear() + "-Q" + q, label: "Q" + q + " " + d.getUTCFullYear() };
    }

    // Adds sample history for a subject: 2 self assessments + manager (2) + peer (1) evaluations
    function sampleFor(db, subjectId, seedNum, uid) {
      var rng = mulberry32(seedNum);
      var base = {};
      var userShift = (rng() - 0.5) * 0.5;
      F.skills.forEach(function (s) { base[s.id] = DIM_BASE[s.dimId] + userShift + (rng() - 0.5) * 0.9; });

      var pick = function (emails) {
        for (var i = 0; i < emails.length; i++) {
          var u = db.users.filter(function (x) { return x.email === emails[i] && x.id !== subjectId; })[0];
          if (u) return u;
        }
        return null;
      };
      var mgr = pick(["jordan.lee@demo.com", "maya.chen@demo.com"]);
      var peer = pick(["sam.patel@demo.com", "maya.chen@demo.com"]);
      var out = [];

      out.push(makeAssessment(uid("as_"), subjectId, subjectId, "Self", "2026-03-12T15:00:00Z", rng, base,
        { offset: -0.45, bias: SELF_BIAS, noise: 0.8 }));
      out.push(makeAssessment(uid("as_"), subjectId, subjectId, "Self", "2026-09-18T15:00:00Z", rng, base,
        { offset: 0.15, bias: SELF_BIAS, noise: 0.8, notes: NOTES.self }));
      if (mgr) {
        out.push(makeAssessment(uid("as_"), subjectId, mgr.id, "Manager", "2026-03-20T15:00:00Z", rng, base,
          { offset: -0.3, noise: 0.7 }));
        out.push(makeAssessment(uid("as_"), subjectId, mgr.id, "Manager", "2026-09-25T15:00:00Z", rng, base,
          { offset: 0.1, noise: 0.7, notes: NOTES.mgr }));
      }
      if (peer) {
        out.push(makeAssessment(uid("as_"), subjectId, peer.id, "Peer", "2026-09-27T15:00:00Z", rng, base,
          { offset: 0.05, bias: { d9: 0.4 }, noise: 0.7, naDims: ["d8", "d10", "d11"], notes: NOTES.peer }));
      }
      return out;
    }

    function build(uid) {
      var now = "2026-01-05T12:00:00Z";
      var users = [
        {
          id: "u_alex", name: "Alex Rivera", email: "alex.rivera@demo.com", password: "demo", title: "Senior Client Manager", createdAt: now, demo: true,
          profile: {
            office: "Mexico City", reportsTo: "Jordan Lee", yearsExperience: 12, yearsCompany: 6, yearsCM: 4,
            sectors: ["Banking", "Insurance"], accounts: 3, portfolio: "$10–25M", teamSize: 8,
            partners: ["Cloud hyperscaler", "Core banking ISV"], languages: ["Spanish", "English"], certifications: ["PMP"],
            aspiration: "Client Partner / Account Director",
            bio: "Leads three financial-services accounts. Strong on delivery and solution design; building partner and competitive muscle."
          }
        },
        {
          id: "u_jordan", name: "Jordan Lee", email: "jordan.lee@demo.com", password: "demo", title: "VP, Client Partnerships", createdAt: now, demo: true,
          profile: {
            office: "Mexico City", reportsTo: "", yearsExperience: 18, yearsCompany: 11, yearsCM: 9,
            sectors: ["Banking", "Capital Markets"], accounts: 5, portfolio: "> $50M", teamSize: 22,
            partners: ["Cloud hyperscaler"], languages: ["English", "Spanish"], certifications: [], aspiration: "Managing Director",
            bio: "Manages the financial-services client management team."
          }
        },
        {
          id: "u_sam", name: "Sam Patel", email: "sam.patel@demo.com", password: "demo", title: "Client Manager", createdAt: now, demo: true,
          profile: {
            office: "Monterrey", reportsTo: "Jordan Lee", yearsExperience: 8, yearsCompany: 3, yearsCM: 2,
            sectors: ["Manufacturing", "Energy & Utilities"], accounts: 2, portfolio: "$5–10M", teamSize: 5,
            partners: ["ERP vendor"], languages: ["English", "Spanish"], certifications: [], aspiration: "Senior Client Manager",
            bio: ""
          }
        },
        {
          id: "u_maya", name: "Maya Chen", email: "maya.chen@demo.com", password: "demo", title: "Delivery Lead", createdAt: now, demo: true,
          profile: {
            office: "Guadalajara", reportsTo: "", yearsExperience: 14, yearsCompany: 7, yearsCM: 0,
            sectors: ["Technology & Media"], accounts: 0, portfolio: "", teamSize: 30,
            partners: [], languages: ["English", "Mandarin"], certifications: ["ITIL"], aspiration: "",
            bio: ""
          }
        }
      ];
      var db = { schema: 1, users: users, assessments: [], session: null };
      db.assessments = sampleFor(db, "u_alex", 42, uid);
      return db;
    }

    return { build: build, sampleFor: sampleFor, cycleOf: cycleOf, hash: hash };
  })();

  /* ----------------------------------------------------------------- Store */
  var Store = (function () {
    var KEY = "cmhub.v1";
    var db = null;
    var persistent = true;

    function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 10); }

    function read() {
      try {
        var raw = global.localStorage.getItem(KEY);
        if (raw) { var d = JSON.parse(raw); if (d && d.schema === 1) return d; }
      } catch (e) { persistent = false; }
      return null;
    }
    function write() {
      try { global.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { persistent = false; }
    }
    function init() {
      db = read();
      if (!db) { db = Seed.build(uid); write(); }
    }

    function nowISO() { return new Date().toISOString(); }
    function user(id) { return db.users.filter(function (u) { return u.id === id; })[0] || null; }
    function emailOk(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

    var api = {
      init: init,
      get persistent() { return persistent; },
      users: function () { return db.users.slice(); },
      user: user,
      current: function () { return db.session ? user(db.session.userId) : null; },

      login: function (email, password) {
        var e = String(email || "").trim().toLowerCase();
        var u = db.users.filter(function (x) { return x.email.toLowerCase() === e; })[0];
        if (!u || u.password !== password) return { error: "Incorrect email or password." };
        db.session = { userId: u.id }; write();
        return { user: u };
      },
      register: function (f) {
        var name = String(f.name || "").trim(), email = String(f.email || "").trim().toLowerCase();
        if (name.length < 2) return { error: "Please enter your full name." };
        if (!emailOk(email)) return { error: "Please enter a valid email address." };
        if (String(f.password || "").length < 4) return { error: "Password must have at least 4 characters (demo)." };
        if (db.users.some(function (u) { return u.email.toLowerCase() === email; })) return { error: "An account with this email already exists." };
        var u = {
          id: uid("u_"), name: name, email: email, password: f.password, title: String(f.title || "").trim() || "Client Manager",
          createdAt: nowISO(), demo: false,
          profile: { office: "", reportsTo: "", yearsExperience: "", yearsCompany: "", yearsCM: "", sectors: [], accounts: "", portfolio: "", teamSize: "", partners: [], languages: [], certifications: [], aspiration: "", bio: "" }
        };
        db.users.push(u); db.session = { userId: u.id }; write();
        return { user: u };
      },
      logout: function () { db.session = null; write(); },
      switchUser: function (id) { if (user(id)) { db.session = { userId: id }; write(); } },

      saveUser: function (id, patch, profilePatch) {
        var u = user(id); if (!u) return;
        Object.keys(patch || {}).forEach(function (k) { u[k] = patch[k]; });
        u.profile = u.profile || {};
        Object.keys(profilePatch || {}).forEach(function (k) { u.profile[k] = profilePatch[k]; });
        write();
      },

      assessment: function (id) { return db.assessments.filter(function (a) { return a.id === id; })[0] || null; },
      // Submitted assessments about a subject (the subject can always see all of these, with evaluator + relationship)
      submittedAbout: function (subjectId) {
        return db.assessments.filter(function (a) { return a.subjectId === subjectId && a.status === "submitted"; });
      },
      // Everything the user can open in History: about them (submitted) + the ones they wrote about others
      historyFor: function (userId) {
        return db.assessments.filter(function (a) {
          if (a.status === "draft") return a.evaluatorId === userId;
          return a.subjectId === userId || a.evaluatorId === userId;
        });
      },
      draftFor: function (userId) {
        return db.assessments.filter(function (a) { return a.status === "draft" && a.subjectId === userId && a.evaluatorId === userId; })[0] || null;
      },
      startSelf: function (userId) {
        var c = Seed.cycleOf(nowISO());
        var a = {
          id: uid("as_"), subjectId: userId, evaluatorId: userId, relationship: "Self", cycle: c.id, cycleLabel: c.label,
          status: "draft", createdAt: nowISO(), updatedAt: nowISO(), submittedAt: null, ratings: {}
        };
        db.assessments.push(a); write();
        return a;
      },
      setRating: function (aid, skillId, patch) {
        var a = api.assessment(aid); if (!a || a.status !== "draft") return;
        var r = a.ratings[skillId] || { level: null, na: false, note: "" };
        Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
        if (r.na) r.level = null;
        a.ratings[skillId] = r; a.updatedAt = nowISO(); write();
      },
      fillDemo: function (aid) {
        var a = api.assessment(aid); if (!a || a.status !== "draft") return;
        var rng = Math.random;
        F.skills.forEach(function (s) {
          var r = a.ratings[s.id] || { level: null, na: false, note: "" };
          if (r.level || r.na) return;
          var v = 2.6 + (rng() - 0.45) * 2.2;
          r.level = Math.max(1, Math.min(4, Math.round(v))); r.na = false;
          a.ratings[s.id] = r;
        });
        a.updatedAt = nowISO(); write();
      },
      clearDraft: function (aid) {
        var a = api.assessment(aid); if (!a || a.status !== "draft") return;
        a.ratings = {}; a.updatedAt = nowISO(); write();
      },
      discardDraft: function (aid) {
        db.assessments = db.assessments.filter(function (a) { return !(a.id === aid && a.status === "draft"); }); write();
      },
      submit: function (aid) {
        var a = api.assessment(aid); if (!a) return { error: "Not found" };
        var p = Calc.progress(a);
        if (p.done < p.total) return { error: "Every skill needs a level or “Not enough information”." };
        a.status = "submitted"; a.submittedAt = nowISO(); a.updatedAt = a.submittedAt; write();
        return { assessment: a };
      },

      hasSample: function (userId) { return db.assessments.some(function (a) { return a.sample && a.subjectId === userId; }); },
      loadSample: function (userId) {
        if (api.hasSample(userId)) return;
        var added = Seed.sampleFor(db, userId, Seed.hash(userId) + 7, uid);
        db.assessments = db.assessments.concat(added); write();
      },
      removeSample: function (userId) {
        db.assessments = db.assessments.filter(function (a) { return !(a.sample && a.subjectId === userId); }); write();
      },
      resetDemo: function () {
        db = Seed.build(uid); write();
      }
    };
    return api;
  })();

  global.Calc = Calc;
  global.Seed = Seed;
  global.Store = Store;
})(window);
