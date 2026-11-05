/* UI helpers and hand-built SVG charts (no external libraries, works offline / from file://) */
(function (global) {
  "use strict";
  var F = global.Framework, Calc = global.Calc;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function initials(name) {
    var p = String(name || "?").trim().split(/\s+/);
    return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function fmtDate(iso, withYear) {
    if (!iso) return "–";
    var d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: withYear === false ? undefined : "numeric", timeZone: "UTC" });
  }

  // Colored pill for a (possibly fractional) score
  function scorePill(score, opts) {
    opts = opts || {};
    if (score == null) return '<span class="pill none">' + (opts.empty || "No data") + "</span>";
    var lv = Calc.levelFor(score);
    var label = opts.showNum ? Calc.fmt(score, 1) + " · " + lv.name : lv.name;
    return '<span class="pill lv' + lv.id + (opts.line ? " line" : "") + '">' + esc(label) + "</span>";
  }
  function levelPill(level) {
    if (!level) return '<span class="pill none">N/A</span>';
    var lv = F.level(level);
    return '<span class="pill lv' + lv.id + '">' + esc(lv.name) + "</span>";
  }

  /* ---------------------------------------------------------------- toast & modal */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function openModal(html) {
    closeModal();
    var d = document.createElement("div");
    d.className = "modal-back"; d.id = "modal-back";
    d.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
    d.addEventListener("click", function (e) { if (e.target === d) closeModal(); });
    document.body.appendChild(d);
  }
  function closeModal() {
    var d = document.getElementById("modal-back");
    if (d && d.parentNode) d.parentNode.removeChild(d);
  }

  /* ---------------------------------------------------------------- radar chart */
  function wrapLabel(text, max) {
    if (text.length <= max) return [text];
    var words = text.split(" "), l1 = "", l2 = "";
    words.forEach(function (w) {
      if ((l1 + " " + w).trim().length <= max && !l2) l1 = (l1 + " " + w).trim();
      else l2 = (l2 + " " + w).trim();
    });
    return l2 ? [l1, l2] : [l1];
  }

  // axes: [{label}], series: [{name,color,values[],dash,fillOpacity}], values on 0..4 scale (null = missing)
  function radar(axes, series, opts) {
    opts = opts || {};
    var W = 580, H = 500, cx = W / 2, cy = H / 2 + 2, R = 168, n = axes.length, max = 4;
    function pt(i, v) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n;
      var r = R * v / max;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    var out = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.aria || "Radar chart of dimension scores") + '">';
    // rings
    for (var ring = 1; ring <= max; ring++) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(pt(i, ring).map(function (x) { return x.toFixed(1); }).join(","));
      out += '<polygon points="' + pts.join(" ") + '" fill="' + (ring === max ? "#f6f9fd" : "none") + '" stroke="#d3deef" stroke-width="' + (ring === max ? 1.4 : 1) + '"/>';
    }
    // axes + labels
    axes.forEach(function (ax, i) {
      var p = pt(i, max), a = -Math.PI / 2 + 2 * Math.PI * i / n;
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#d3deef"/>';
      var lx = cx + (R + 16) * Math.cos(a), ly = cy + (R + 16) * Math.sin(a);
      var c = Math.cos(a), anchor = c > 0.25 ? "start" : c < -0.25 ? "end" : "middle";
      var lines = wrapLabel(ax.label, 15);
      var dy = Math.sin(a) > 0.6 ? 6 : Math.sin(a) < -0.6 ? -(lines.length - 1) * 15 - 2 : -(lines.length - 1) * 7.5 + 5;
      out += '<text x="' + lx.toFixed(1) + '" y="' + (ly + dy).toFixed(1) + '" text-anchor="' + anchor + '" font-size="14" font-weight="600" fill="#24304f">';
      lines.forEach(function (ln, k) { out += '<tspan x="' + lx.toFixed(1) + '" dy="' + (k === 0 ? 0 : 15) + '">' + esc(ln) + "</tspan>"; });
      out += "</text>";
    });
    // ring labels on the top axis
    F.levels.slice().reverse().forEach(function (lv) {
      var p = pt(0, lv.id);
      out += '<text x="' + (p[0] + 5).toFixed(1) + '" y="' + (p[1] - 3).toFixed(1) + '" font-size="11.5" font-weight="700" fill="#6c7a99" stroke="#fff" stroke-width="3" paint-order="stroke">' + lv.id + " · " + lv.name + "</text>";
    });
    // series
    series.forEach(function (s) {
      var pts2 = [], dots = "";
      s.values.forEach(function (v, i) {
        var val = v == null ? 0 : v, p = pt(i, val);
        pts2.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
        if (v != null) dots += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.2" fill="' + s.color + '" stroke="#fff" stroke-width="1.5"><title>' + esc(axes[i].label + " — " + s.name + ": " + Calc.fmt(v, 1)) + "</title></circle>";
      });
      out += '<polygon points="' + pts2.join(" ") + '" fill="' + s.color + '" fill-opacity="' + (s.fillOpacity != null ? s.fillOpacity : 0.12) + '" stroke="' + s.color + '" stroke-width="2.4" ' + (s.dash ? 'stroke-dasharray="6 5"' : "") + ' stroke-linejoin="round"/>' + dots;
    });
    return out + "</svg>";
  }

  /* ---------------------------------------------------------------- line chart over cycles */
  function lineChart(cats, series, opts) {
    opts = opts || {};
    var W = 640, H = 300, l = 54, r = 20, t = 18, b = 44, min = 1, max = 4;
    var iw = W - l - r, ih = H - t - b;
    function x(i) { return cats.length === 1 ? l + iw / 2 : l + iw * i / (cats.length - 1); }
    function y(v) { return t + ih * (1 - (v - min) / (max - min)); }
    var out = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.aria || "Score over time") + '">';
    [1, 2, 3, 4].forEach(function (v) {
      out += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e3eaf5"/>';
      out += '<text x="' + (l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#6c7a99" font-weight="600">' + F.level(v).name + "</text>";
    });
    cats.forEach(function (c, i) {
      out += '<text x="' + x(i) + '" y="' + (H - 16) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#24304f">' + esc(c) + "</text>";
    });
    series.forEach(function (s) {
      var d = "", dots = "", started = false;
      s.values.forEach(function (v, i) {
        if (v == null) { started = false; return; }
        d += (started ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1) + " "; started = true;
        dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="5" fill="' + s.color + '" stroke="#fff" stroke-width="2"><title>' + esc(s.name + " · " + cats[i] + ": " + Calc.fmt(v, 2)) + "</title></circle>";
        dots += '<text x="' + x(i).toFixed(1) + '" y="' + (y(v) - 11).toFixed(1) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + s.color + '">' + Calc.fmt(v, 1) + "</text>";
      });
      out += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.6" ' + (s.dash ? 'stroke-dasharray="6 5"' : "") + ' stroke-linejoin="round" stroke-linecap="round"/>' + dots;
    });
    return out + "</svg>";
  }

  /* ---------------------------------------------------------------- logo mark */
  var LOGO = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">' +
    '<polygon points="17,3 22,12 12,12" fill="#4f6fd0"/>' +
    '<polygon points="11,13 23,13 17,23" fill="#1aa1ff"/>' +
    '<polygon points="9.8,14 16,25 3.6,25" fill="#0072bc"/>' +
    '<polygon points="24.2,14 30.4,25 18,25" fill="#2b4fb3"/></svg>';

  global.UI = { esc: esc, initials: initials, fmtDate: fmtDate, scorePill: scorePill, levelPill: levelPill, toast: toast, openModal: openModal, closeModal: closeModal, radar: radar, lineChart: lineChart, LOGO: LOGO };
})(window);
