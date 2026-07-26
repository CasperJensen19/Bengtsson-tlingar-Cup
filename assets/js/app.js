/* ==========================================================================
   app.js — Router, vyer och interaktion
   ========================================================================== */
(function () {
  "use strict";
  const App = (window.App = window.App || {});
  const store = App.store;
  const stats = App.stats;

  // ---- Små hjälpfunktioner ----------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const MONTHS = ["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"];
  function fmtDate(iso) {
    if (!iso) return "Odaterad";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
  }

  function toast(msg) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function medal(place) {
    return place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : "";
  }

  // ---- Router ------------------------------------------------------------
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, query] = raw.split("?");
    const params = {};
    (query || "").split("&").forEach((kv) => {
      if (!kv) return;
      const [k, v] = kv.split("=");
      params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return { path, params };
  }

  const routes = [
    { re: /^\/$/, view: viewHome },
    { re: /^\/tavlingar$/, view: viewCompetitions },
    { re: /^\/tavling\/(.+)$/, view: viewCompetition },
    { re: /^\/ny$/, view: viewBuilderNew },
    { re: /^\/redigera\/(.+)$/, view: viewBuilderEdit },
    { re: /^\/statistik$/, view: viewStats },
    { re: /^\/banor$/, view: viewCourses },
    { re: /^\/arkiv$/, view: viewArchive },
    { re: /^\/om$/, view: viewAbout },
  ];

  function render() {
    const { path, params } = parseHash();
    const root = $("#app");
    let matched = null;
    let args = [];
    for (const r of routes) {
      const m = r.re.exec(path);
      if (m) {
        matched = r;
        args = m.slice(1).map(decodeURIComponent);
        break;
      }
    }
    window.scrollTo(0, 0);
    if (!matched) {
      root.innerHTML = notFound();
    } else {
      matched.view(root, args, params);
    }
    updateNavActive(path);
  }

  function updateNavActive(path) {
    const key = "/" + (path.split("/")[1] || "");
    $$("[data-nav]").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-nav") === key);
    });
  }

  // =======================================================================
  //  VY: Hem / Dashboard
  // =======================================================================
  function viewHome(root) {
    const ov = stats.overview();
    const winLeaders = stats.winLeaders().slice(0, 5);
    const latest = ov.latest;
    let latestBlock = "";
    if (latest) {
      const w = stats.winner(latest);
      latestBlock = `
        <div class="card pad-lg">
          <div class="flex-between">
            <h2 style="margin:0">Senaste tävlingen</h2>
            <a class="btn ghost sm" href="#/tavling/${esc(latest.id)}">Öppna</a>
          </div>
          <p class="help" style="margin:.3em 0 1em">${esc(latest.name)} · ${fmtDate(latest.date)} · ${esc(latest.location || "")}</p>
          ${w ? `<div class="chip"><span class="badge gold">🥇 Vinnare</span> <strong>${esc(w.player.name)}</strong> med ${w.total} slag</div>` : ""}
        </div>`;
    }

    root.innerHTML = `
      <section class="card pad-lg" style="background:linear-gradient(120deg,var(--green-50),var(--card));">
        <div class="flex-between">
          <div>
            <h1 style="margin-bottom:.2em">Släktens minigolf-arkiv ⛳</h1>
            <p class="help" style="max-width:52ch">Här samlar vi alla familjens bangolf-tävlingar. Fyll i resultat per hål, se vem som vann och kolla statistik över åren.</p>
          </div>
        </div>
        <div class="row mt">
          <a class="btn primary" href="#/ny">➕ Ny tävling</a>
          <a class="btn ghost" href="#/statistik">📊 Statistik</a>
          <a class="btn ghost" href="#/tavlingar">🗂️ Alla tävlingar</a>
        </div>
      </section>

      <div class="grid cols-4 mt-lg">
        ${statCard("Tävlingar", ov.competitions)}
        ${statCard("Spelare", ov.players)}
        ${statCard("Banor", ov.courses)}
        ${statCard("Hole-in-one", ov.aces, "1:or totalt")}
      </div>

      <div class="grid cols-2 mt-lg" style="align-items:start">
        ${latestBlock || ""}
        <div class="card pad-lg">
          <h2>Flest vinster</h2>
          ${
            winLeaders.length
              ? `<div class="list mt">${winLeaders
                  .map(
                    (w, i) => `
                <div class="list-row" style="padding:10px 14px">
                  <div style="width:26px;text-align:center;font-size:1.2rem">${medal(i + 1) || i + 1}</div>
                  <div class="grow"><div class="title">${esc(w.name)}</div><div class="meta">${w.played} tävlingar spelade</div></div>
                  <div><span class="badge green">${w.wins} vinster</span></div>
                </div>`
                  )
                  .join("")}</div>`
              : `<p class="help">Inga tävlingar än. <a href="#/ny">Lägg till den första!</a></p>`
          }
        </div>
      </div>

      ${syncBanner()}
    `;
  }

  function statCard(label, value, sub) {
    return `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>`;
  }

  // Banner som visar olagrade lokala ändringar.
  function syncBanner() {
    const ch = store.localChanges();
    if (!ch.count) return "";
    return `
      <div class="notice info mt-lg">
        📱 Du har <strong>${ch.count}</strong> ändring(ar) som bara finns på den här enheten.
        <a href="#/arkiv">Exportera till arkivet</a> för att dela med familjen.
      </div>`;
  }

  // =======================================================================
  //  VY: Alla tävlingar
  // =======================================================================
  function viewCompetitions(root) {
    const comps = store.getCompetitions();
    root.innerHTML = `
      <div class="section-title">
        <h1>Tävlingar</h1>
        <a class="btn primary" href="#/ny">➕ Ny tävling</a>
      </div>
      ${
        comps.length
          ? `<div class="list">${comps.map(compRow).join("")}</div>`
          : emptyState("Inga tävlingar än", "Lägg till er första tävling så börjar arkivet fyllas.", "#/ny", "Skapa tävling")
      }
    `;
  }

  function compRow(c) {
    const w = stats.winner(c);
    const badges =
      (c._local ? `<span class="badge local">Ej sparad i arkivet</span> ` : "") +
      (c.isExample ? `<span class="badge example">Exempel</span> ` : "");
    return `
      <a class="list-row" href="#/tavling/${esc(c.id)}">
        <div style="font-size:1.6rem">⛳</div>
        <div class="grow">
          <div class="title">${esc(c.name)} ${badges}</div>
          <div class="meta">${fmtDate(c.date)} · ${esc(c.location || "")} · ${(c.players || []).length} spelare</div>
        </div>
        ${w ? `<div class="badge gold">🥇 ${esc(w.player.name)}</div>` : ""}
      </a>`;
  }

  // =======================================================================
  //  VY: En tävling (scorekort)
  // =======================================================================
  function viewCompetition(root, [id]) {
    const c = store.getCompetition(id);
    if (!c) {
      root.innerHTML = notFound("Tävlingen hittades inte.");
      return;
    }
    const lb = stats.leaderboard(c);
    const players = c.players || [];
    const useTeam = c.teamResult && Object.keys(c.teamResult).length > 0;

    // Bygg scorekort-tabell
    let head = `<tr><th class="hole">Hål</th>${players
      .map((p) => `<th>${esc(p.name)}</th>`)
      .join("")}${useTeam ? "<th>Lag</th>" : ""}</tr>`;
    let body = "";
    for (let h = 1; h <= c.holeCount; h++) {
      body += `<tr><td class="hole">${h}</td>${players
        .map((p) => {
          const v = c.scores?.[h]?.[p.id];
          const isAce = v === 1;
          return `<td>${v != null ? `<span class="${isAce ? "ace" : ""}">${v}</span>` : "–"}</td>`;
        })
        .join("")}${useTeam ? `<td>${c.teamResult[h] != null ? c.teamResult[h] : "–"}</td>` : ""}</tr>`;
    }
    const winnerTotal = lb.length ? lb[0].total : null;
    let sumRow = `<tr class="sum"><td class="hole">S:a</td>${players
      .map((p) => {
        const t = stats.playerTotal(c, p.id).sum;
        return `<td class="${t === winnerTotal ? "leader-total" : ""}">${t}</td>`;
      })
      .join("")}${useTeam ? "<td></td>" : ""}</tr>`;

    // Pallen
    const podium = lb.slice(0, 3);

    root.innerHTML = `
      <div class="section-title">
        <div>
          <a href="#/tavlingar" class="help">← Alla tävlingar</a>
          <h1 style="margin:.2em 0 0">${esc(c.name)}
            ${c._local ? `<span class="badge local">Ej sparad i arkivet</span>` : ""}
            ${c.isExample ? `<span class="badge example">Exempel</span>` : ""}
          </h1>
          <p class="help">${fmtDate(c.date)} · ${esc(c.location || "")} · ${c.holeCount} hål</p>
        </div>
        <div class="row" style="flex:0 0 auto">
          <a class="btn ghost sm" href="#/redigera/${esc(c.id)}">✏️ Redigera</a>
          <button class="btn danger sm" data-action="delete-comp" data-id="${esc(c.id)}">🗑️ Ta bort</button>
        </div>
      </div>

      ${
        podium.length
          ? `<div class="podium mb">
              ${podium
                .map(
                  (r) => `
                <div class="spot p${r.place}">
                  <div class="medal">${medal(r.place)}</div>
                  <div class="who">${esc(r.player.name)}</div>
                  <div class="score">${r.total} slag</div>
                </div>`
                )
                .join("")}
            </div>`
          : ""
      }

      <div class="scorecard-wrap mb">
        <table class="scorecard">
          <thead>${head}</thead>
          <tbody>${body}${sumRow}</tbody>
        </table>
      </div>

      ${
        c.notes
          ? `<div class="notice mb">📝 ${esc(c.notes)}</div>`
          : ""
      }

      ${
        c.photo
          ? `<div class="card"><h2>Scorekort</h2><div class="photo-frame mt">${imgTag(c.photo, "Foto på scorekortet")}</div></div>`
          : ""
      }
    `;

    // Radera-knapp
    $$("[data-action=delete-comp]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (confirm("Ta bort den här tävlingen? Om den redan finns i det delade arkivet försvinner den efter nästa export.")) {
          store.deleteCompetition(btn.dataset.id);
          toast("Tävlingen togs bort");
          navigate("#/tavlingar");
        }
      })
    );
  }

  function imgTag(src, alt) {
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  }

  // =======================================================================
  //  VY: Bygg/redigera tävling
  // =======================================================================
  function viewBuilderNew(root) {
    App._model = blankModel();
    renderBuilder(root);
  }
  function viewBuilderEdit(root, [id]) {
    const c = store.getCompetition(id);
    if (!c) {
      root.innerHTML = notFound("Tävlingen hittades inte.");
      return;
    }
    App._model = deepClone(c);
    App._model.useTeam = c.teamResult && Object.keys(c.teamResult).length > 0;
    renderBuilder(root, true);
  }

  function blankModel() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: null,
      name: "Släkt-cupen " + new Date().getFullYear(),
      date: today,
      courseId: "",
      location: "",
      holeCount: 18,
      players: [
        { id: "p1", name: "" },
        { id: "p2", name: "" },
      ],
      scores: {},
      teamResult: {},
      useTeam: false,
      photo: "",
      notes: "",
    };
  }

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function renderBuilder(root, isEdit) {
    const m = App._model;
    const courses = store.getCourses();

    root.innerHTML = `
      <div class="section-title">
        <h1>${isEdit ? "Redigera tävling" : "Ny tävling"}</h1>
        <a class="btn ghost sm" href="${isEdit && m.id ? `#/tavling/${esc(m.id)}` : "#/tavlingar"}">Avbryt</a>
      </div>

      <div class="card pad-lg mb">
        <div class="row">
          <label class="field"><span>Tävlingens namn</span>
            <input type="text" id="f-name" value="${esc(m.name)}" placeholder="t.ex. Släkt-cupen 2025"></label>
          <label class="field" style="flex:0 0 170px"><span>Datum</span>
            <input type="date" id="f-date" value="${esc(m.date)}"></label>
        </div>
        <div class="row">
          <label class="field"><span>Bana</span>
            <input type="text" id="f-course" list="courselist" value="${esc(courseName(m.courseId) || "")}" placeholder="t.ex. Skrea Bangolf">
            <datalist id="courselist">${courses.map((c) => `<option value="${esc(c.name)}">`).join("")}</datalist>
          </label>
          <label class="field"><span>Plats (frivilligt)</span>
            <input type="text" id="f-location" value="${esc(m.location)}" placeholder="t.ex. Falkenberg"></label>
          <label class="field" style="flex:0 0 130px"><span>Antal hål</span>
            <select id="f-holecount">
              ${[9, 18, 27].map((n) => `<option value="${n}" ${m.holeCount === n ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>

      <div class="card pad-lg mb">
        <h2>📷 Scorekort</h2>
        <p class="help">Fota kortet så sparas det tillsammans med resultatet. Sen fyller du i siffrorna i rutnätet nedan.</p>
        <div id="photo-area">${photoArea(m)}</div>
      </div>

      <div class="card pad-lg mb">
        <div class="flex-between">
          <h2 style="margin:0">Spelare</h2>
          <button class="btn ghost sm" id="add-player">➕ Lägg till spelare</button>
        </div>
        <div id="players" class="mt"></div>
      </div>

      <div class="card pad-lg mb">
        <div class="flex-between">
          <h2 style="margin:0">Resultat per hål</h2>
          <label class="chip" style="cursor:pointer"><input type="checkbox" id="f-useteam" ${m.useTeam ? "checked" : ""} style="width:auto"> Lag-resultat-kolumn</label>
        </div>
        <p class="help">Skriv antal slag för varje spelare och hål. Summorna räknas ut automatiskt. En etta markeras som hole-in-one ⭐.</p>
        <div id="grid-container" class="mt"></div>
      </div>

      <label class="field card pad-lg mb"><span>Anteckningar (frivilligt)</span>
        <textarea id="f-notes" placeholder="t.ex. Regnigt väder, Sven fick spikrekord!">${esc(m.notes)}</textarea>
      </label>

      <div class="save-bar">
        <button class="btn primary block" id="save-comp">💾 Spara tävling</button>
        <p class="help center" style="margin:.6em 0 0">Sparas först på den här enheten. Dela med familjen via <a href="#/arkiv">Arkiv &amp; synk</a>.</p>
      </div>
    `;

    // ---- Bind meta-fält
    $("#f-name").addEventListener("input", (e) => (m.name = e.target.value));
    $("#f-date").addEventListener("input", (e) => (m.date = e.target.value));
    $("#f-location").addEventListener("input", (e) => (m.location = e.target.value));
    $("#f-course").addEventListener("input", (e) => (m._courseName = e.target.value));
    $("#f-notes").addEventListener("input", (e) => (m.notes = e.target.value));
    $("#f-holecount").addEventListener("change", (e) => {
      m.holeCount = parseInt(e.target.value, 10);
      renderGrid();
    });
    $("#f-useteam").addEventListener("change", (e) => {
      m.useTeam = e.target.checked;
      if (!m.useTeam) m.teamResult = {};
      renderGrid();
    });
    $("#add-player").addEventListener("click", () => {
      const used = new Set(m.players.map((p) => p.id));
      m.players.push({ id: store.makePlayerId("spelare" + (m.players.length + 1), used), name: "" });
      renderPlayers();
      renderGrid();
    });
    $("#save-comp").addEventListener("click", () => saveFromBuilder(isEdit));

    // Foto
    bindPhoto(m);

    renderPlayers();
    renderGrid();

    // ---- inre render-funktioner (delvyer) --------------------------------
    function renderPlayers() {
      const wrap = $("#players");
      wrap.innerHTML = m.players
        .map(
          (p, i) => `
        <div class="player-edit">
          <span style="width:22px;text-align:center;color:var(--muted)">${i + 1}</span>
          <input type="text" data-pid="${esc(p.id)}" class="p-name" value="${esc(p.name)}" placeholder="Spelarens namn">
          <button class="btn danger sm" data-remove="${esc(p.id)}" ${m.players.length <= 1 ? "disabled" : ""}>Ta bort</button>
        </div>`
        )
        .join("");
      $$(".p-name", wrap).forEach((inp) =>
        inp.addEventListener("input", (e) => {
          const p = m.players.find((x) => x.id === e.target.dataset.pid);
          if (p) p.name = e.target.value;
          // uppdatera kolumnrubrik live
          const th = $(`#grid-container th[data-col="${p.id}"]`);
          if (th) th.textContent = p.name || "?";
        })
      );
      $$("[data-remove]", wrap).forEach((btn) =>
        btn.addEventListener("click", () => {
          const pid = btn.dataset.remove;
          m.players = m.players.filter((x) => x.id !== pid);
          for (const h in m.scores) delete m.scores[h][pid];
          renderPlayers();
          renderGrid();
        })
      );
    }

    function renderGrid() {
      const c = $("#grid-container");
      const players = m.players;
      let head = `<tr><th class="hole">Hål</th>${players
        .map((p) => `<th data-col="${esc(p.id)}">${esc(p.name || "?")}</th>`)
        .join("")}${m.useTeam ? "<th>Lag</th>" : ""}</tr>`;
      let body = "";
      for (let h = 1; h <= m.holeCount; h++) {
        body += `<tr><td class="hole">${h}</td>${players
          .map((p) => {
            const v = m.scores?.[h]?.[p.id];
            return `<td><input type="number" inputmode="numeric" min="1" max="20" data-h="${h}" data-p="${esc(p.id)}" value="${v != null ? v : ""}"></td>`;
          })
          .join("")}${m.useTeam ? `<td><input type="number" inputmode="numeric" data-team="${h}" value="${m.teamResult[h] != null ? m.teamResult[h] : ""}"></td>` : ""}</tr>`;
      }
      let sum = `<tr class="sum"><td class="hole">S:a</td>${players
        .map((p) => `<td data-sum="${esc(p.id)}">0</td>`)
        .join("")}${m.useTeam ? "<td></td>" : ""}</tr>`;

      c.innerHTML = `<div class="scorecard-wrap"><table class="scorecard"><thead>${head}</thead><tbody>${body}${sum}</tbody></table></div>`;

      $$("input[data-h]", c).forEach((inp) =>
        inp.addEventListener("input", (e) => {
          const h = e.target.dataset.h;
          const pid = e.target.dataset.p;
          const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
          m.scores[h] = m.scores[h] || {};
          if (val == null) delete m.scores[h][pid];
          else m.scores[h][pid] = val;
          updateSums();
        })
      );
      $$("input[data-team]", c).forEach((inp) =>
        inp.addEventListener("input", (e) => {
          const h = e.target.dataset.team;
          const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
          if (val == null || isNaN(val)) delete m.teamResult[h];
          else m.teamResult[h] = val;
        })
      );
      updateSums();

      function updateSums() {
        let min = Infinity;
        const totals = {};
        players.forEach((p) => {
          const t = stats.playerTotal(m, p.id).sum;
          totals[p.id] = t;
          if (t > 0 && t < min) min = t;
        });
        players.forEach((p) => {
          const cell = $(`#grid-container td[data-sum="${p.id}"]`);
          if (cell) {
            cell.textContent = totals[p.id];
            cell.classList.toggle("leader-total", totals[p.id] === min && min !== Infinity && totals[p.id] > 0);
          }
        });
      }
    }
  }

  function courseName(courseId) {
    const c = store.getCourse(courseId);
    return c ? c.name : "";
  }

  function photoArea(m) {
    if (m.photo) {
      return `
        <div class="photo-frame mt">${imgTag(m.photo, "Scorekort")}</div>
        <div class="row mt"><button class="btn ghost sm" id="remove-photo">Ta bort foto</button>
        <label class="btn ghost sm" style="cursor:pointer">Byt foto<input type="file" id="photo-input" accept="image/*" capture="environment" class="hide"></label></div>`;
    }
    return `
      <label class="photo-drop mt" style="display:block;cursor:pointer">
        <div style="font-size:2rem">📷</div>
        <div><strong>Fota eller välj bild på scorekortet</strong></div>
        <div class="help">Bilden krymps automatiskt och sparas med tävlingen.</div>
        <input type="file" id="photo-input" accept="image/*" capture="environment" class="hide">
      </label>`;
  }

  function bindPhoto(m) {
    const area = $("#photo-area");
    const input = $("#photo-input", area);
    if (input) {
      input.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          m.photo = await resizeImage(file, 1400, 0.72);
          $("#photo-area").innerHTML = photoArea(m);
          bindPhoto(m);
          toast("Foto tillagt");
        } catch (err) {
          alert("Kunde inte läsa bilden.");
        }
      });
    }
    const rm = $("#remove-photo", area);
    if (rm)
      rm.addEventListener("click", () => {
        m.photo = "";
        $("#photo-area").innerHTML = photoArea(m);
        bindPhoto(m);
      });
  }

  // Krymp bild via canvas → JPEG data-URL (håller nere storleken).
  function resizeImage(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function saveFromBuilder(isEdit) {
    const m = App._model;
    if (!m.name.trim()) {
      alert("Ge tävlingen ett namn.");
      return;
    }
    const namedPlayers = m.players.filter((p) => p.name.trim());
    if (!namedPlayers.length) {
      alert("Lägg till minst en spelare med namn.");
      return;
    }

    // Hantera bana: matcha på namn eller skapa ny.
    const courseNameInput = (m._courseName || courseName(m.courseId) || "").trim();
    let courseId = m.courseId;
    if (courseNameInput) {
      const existing = store.getCourses().find(
        (c) => c.name.toLowerCase() === courseNameInput.toLowerCase()
      );
      if (existing) {
        courseId = existing.id;
        // uppdatera hålantal om det ändrats
      } else {
        const newCourse = {
          id: store.slug(courseNameInput) || "bana_" + Date.now(),
          name: courseNameInput,
          location: m.location || "",
          holeCount: m.holeCount,
          par: [],
        };
        store.saveCourse(newCourse);
        courseId = newCourse.id;
      }
    }

    const comp = {
      id: m.id,
      name: m.name.trim(),
      date: m.date,
      courseId,
      location: m.location.trim(),
      holeCount: m.holeCount,
      photo: m.photo || "",
      players: namedPlayers.map((p) => ({ id: p.id, name: p.name.trim() })),
      scores: {},
      teamResult: m.useTeam ? { ...m.teamResult } : {},
      notes: (m.notes || "").trim(),
    };
    // Kopiera bara giltiga poäng för aktuella spelare/hål.
    const validPids = new Set(comp.players.map((p) => p.id));
    for (let h = 1; h <= comp.holeCount; h++) {
      const row = m.scores[h];
      if (!row) continue;
      const clean = {};
      Object.keys(row).forEach((pid) => {
        if (validPids.has(pid) && typeof row[pid] === "number" && row[pid] > 0) clean[pid] = row[pid];
      });
      if (Object.keys(clean).length) comp.scores[h] = clean;
    }

    const saved = store.saveCompetition(comp);
    toast(isEdit ? "Ändringar sparade" : "Tävling sparad");
    navigate(`#/tavling/${saved.id}`);
  }

  // =======================================================================
  //  VY: Statistik
  // =======================================================================
  function viewStats(root, _args, params) {
    const tab = params.flik || "banor";
    root.innerHTML = `
      <div class="section-title"><h1>Statistik</h1></div>
      <div class="row mb" style="flex-wrap:wrap">
        ${statsTab("banor", "🏌️ Banor", tab)}
        ${statsTab("spelare", "🧑 Spelare", tab)}
        ${statsTab("topplista", "🏆 Topplista", tab)}
      </div>
      <div id="stats-body"></div>
    `;
    const body = $("#stats-body");
    if (tab === "banor") renderCourseStats(body, params.bana);
    else if (tab === "spelare") renderPlayerStats(body, params.spelare);
    else renderTopList(body);
  }

  function statsTab(key, label, active) {
    return `<a class="btn ${active === key ? "dark" : "ghost"} sm" href="#/statistik?flik=${key}">${label}</a>`;
  }

  function renderCourseStats(body, courseId) {
    const courses = store.getCourses();
    if (!courses.length) {
      body.innerHTML = emptyState("Inga banor än", "Skapa en tävling så läggs banan till automatiskt.", "#/ny", "Ny tävling");
      return;
    }
    const selected = courseId && courses.some((c) => c.id === courseId) ? courseId : courses[0].id;
    const cs = stats.courseStats(selected);
    const course = store.getCourse(selected);

    let html = `
      <label class="field" style="max-width:340px">
        <span>Välj bana</span>
        <select id="course-select">
          ${courses.map((c) => `<option value="${esc(c.id)}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
        </select>
      </label>`;

    if (!cs) {
      html += emptyState("Inga resultat på banan än", "", "", "");
      body.innerHTML = html;
      $("#course-select").addEventListener("change", (e) => navigate(`#/statistik?flik=banor&bana=${e.target.value}`));
      return;
    }

    const maxAvg = Math.max(...cs.holes.filter((h) => h.avg != null).map((h) => h.avg), 1);

    html += `
      <div class="grid cols-4 mt mb">
        ${statCard("Snitt/hål", cs.courseAvg != null ? cs.courseAvg : "–", "slag i snitt")}
        ${statCard("Svåraste hålet", cs.hardest ? "Hål " + cs.hardest.hole : "–", cs.hardest ? cs.hardest.avg + " slag i snitt" : "")}
        ${statCard("Lättaste hålet", cs.easiest ? "Hål " + cs.easiest.hole : "–", cs.easiest ? cs.easiest.avg + " slag i snitt" : "")}
        ${statCard("Hole-in-one", cs.totalAces, "på banan")}
      </div>

      ${
        cs.bestRound
          ? `<div class="notice mb">🏅 <strong>Banrekord:</strong> ${esc(cs.bestRound.player.name)} med ${cs.bestRound.total} slag (${esc(cs.bestRound.comp.name)}, ${fmtDate(cs.bestRound.comp.date)})</div>`
          : ""
      }

      <div class="card pad-lg mb">
        <h2>Snitt-slag per hål</h2>
        <p class="help">Genomsnittligt antal slag per hål över ${cs.competitions.length} tävling(ar) på ${esc(course.name)}.</p>
        <div class="mt">
          ${cs.holes
            .map((h) =>
              h.avg == null
                ? ""
                : `<div class="bar-row">
                    <div class="bl">Hål ${h.hole}</div>
                    <div class="bar-track"><div class="bar-fill" style="width:${Math.round((h.avg / maxAvg) * 100)}%"></div></div>
                    <div class="bv">${h.avg}</div>
                  </div>`
            )
            .join("")}
        </div>
      </div>

      <div class="card pad-lg">
        <h2>Tävlingar på ${esc(course.name)}</h2>
        <div class="list mt">${cs.competitions.map(compRow).join("")}</div>
      </div>
    `;
    body.innerHTML = html;
    $("#course-select").addEventListener("change", (e) => navigate(`#/statistik?flik=banor&bana=${e.target.value}`));
  }

  function renderPlayerStats(body, playerName) {
    const names = stats.allPlayerNames();
    if (!names.length) {
      body.innerHTML = emptyState("Inga spelare än", "Skapa en tävling med spelare först.", "#/ny", "Ny tävling");
      return;
    }
    const selected = playerName && names.includes(playerName) ? playerName : names[0];
    const ps = stats.playerStats(selected);

    let html = `
      <label class="field" style="max-width:340px">
        <span>Välj spelare</span>
        <select id="player-select">
          ${names.map((n) => `<option value="${esc(n)}" ${n === selected ? "selected" : ""}>${esc(n)}</option>`).join("")}
        </select>
      </label>`;

    if (ps) {
      html += `
        <div class="grid cols-4 mt mb">
          ${statCard("Tävlingar", ps.played)}
          ${statCard("Vinster", ps.wins, ps.podiums + " pallplatser")}
          ${statCard("Snitt/runda", ps.avgTotal, ps.avgPerHole + " per hål")}
          ${statCard("Hole-in-one", ps.acesTotal)}
        </div>
        ${
          ps.best
            ? `<div class="notice mb">🏅 <strong>Bästa runda:</strong> ${ps.best.total} slag (${esc(ps.best.comp.name)}, ${fmtDate(ps.best.comp.date)})</div>`
            : ""
        }
        <div class="card pad-lg">
          <h2>Alla rundor</h2>
          <div class="list mt">
            ${ps.perCompetition
              .map(
                (r) => `
              <a class="list-row" href="#/tavling/${esc(r.comp.id)}">
                <div style="width:30px;text-align:center;font-size:1.2rem">${medal(r.place) || (r.place || "–")}</div>
                <div class="grow"><div class="title">${esc(r.comp.name)}</div><div class="meta">${fmtDate(r.comp.date)} · ${esc(r.comp.location || "")}</div></div>
                <div class="badge green">${r.total} slag</div>
              </a>`
              )
              .join("")}
          </div>
        </div>`;
    }
    body.innerHTML = html;
    $("#player-select").addEventListener("change", (e) => navigate(`#/statistik?flik=spelare&spelare=${encodeURIComponent(e.target.value)}`));
  }

  function renderTopList(body) {
    const leaders = stats.winLeaders();
    if (!leaders.length) {
      body.innerHTML = emptyState("Ingen statistik än", "Spela och registrera tävlingar först.", "#/ny", "Ny tävling");
      return;
    }
    body.innerHTML = `
      <div class="card pad-lg">
        <h2>Flest vinster genom åren</h2>
        <div class="list mt">
          ${leaders
            .map(
              (w, i) => `
            <a class="list-row" href="#/statistik?flik=spelare&spelare=${encodeURIComponent(w.name)}">
              <div style="width:30px;text-align:center;font-size:1.3rem">${medal(i + 1) || i + 1}</div>
              <div class="grow"><div class="title">${esc(w.name)}</div><div class="meta">${w.played} tävlingar</div></div>
              <div class="badge gold">${w.wins} vinster</div>
            </a>`
            )
            .join("")}
        </div>
      </div>`;
  }

  // =======================================================================
  //  VY: Banor
  // =======================================================================
  function viewCourses(root) {
    const courses = store.getCourses();
    root.innerHTML = `
      <div class="section-title"><h1>Banor</h1></div>
      <p class="help mb">Banor läggs till automatiskt när du skapar en tävling. Här ser du snittstatistik per bana.</p>
      ${
        courses.length
          ? `<div class="list">${courses
              .map((c) => {
                const cs = stats.courseStats(c.id);
                return `
              <a class="list-row" href="#/statistik?flik=banor&bana=${esc(c.id)}">
                <div style="font-size:1.6rem">🏌️</div>
                <div class="grow">
                  <div class="title">${esc(c.name)} ${c._local ? '<span class="badge local">Lokal</span>' : ""}</div>
                  <div class="meta">${esc(c.location || "")} · ${c.holeCount} hål · ${cs ? cs.competitions.length : 0} tävling(ar)</div>
                </div>
                ${cs && cs.courseAvg != null ? `<div class="badge green">${cs.courseAvg} snitt/hål</div>` : ""}
              </a>`;
              })
              .join("")}</div>`
          : emptyState("Inga banor än", "Skapa din första tävling.", "#/ny", "Ny tävling")
      }
    `;
  }

  // =======================================================================
  //  VY: Arkiv & synk (export)
  // =======================================================================
  function viewArchive(root) {
    const ch = store.localChanges();
    root.innerHTML = `
      <div class="section-title"><h1>Arkiv &amp; synk</h1></div>

      <div class="card pad-lg mb">
        <h2>Så funkar det delade arkivet</h2>
        <p class="help">Tävlingar du lägger in sparas först <strong>bara på den här enheten</strong>. För att alla i familjen ska se dem behöver de sparas i det gemensamma arkivet (filen <span class="kbd">data/archive.js</span> i repot).</p>
        <ol class="help" style="padding-left:1.2em">
          <li>Klicka <strong>Exportera arkiv</strong> nedan – en fil laddas ner.</li>
          <li>Lägg filen i repot som <span class="kbd">data/archive.js</span> (ersätt den gamla).</li>
          <li>Committa och pusha. Nu ser hela familjen tävlingarna på sidan.</li>
          <li>Kom tillbaka hit och klicka <strong>Markera som sparat</strong> för att rensa de lokala ändringarna.</li>
        </ol>
      </div>

      <div class="card pad-lg mb">
        <div class="flex-between">
          <h2 style="margin:0">Lokala ändringar</h2>
          <span class="badge ${ch.count ? "local" : "green"}">${ch.count} osparade</span>
        </div>
        ${
          ch.count
            ? `<ul class="help mt">
                ${ch.competitions.length ? `<li>${ch.competitions.length} tävling(ar) tillagda/ändrade</li>` : ""}
                ${ch.courses.length ? `<li>${ch.courses.length} bana/banor tillagda</li>` : ""}
                ${ch.deleted.length ? `<li>${ch.deleted.length} borttagna</li>` : ""}
              </ul>`
            : `<p class="help mt">Allt är synkat. 🎉</p>`
        }
        <div class="row mt">
          <button class="btn primary" id="export-archive">⬇️ Exportera arkiv (archive.js)</button>
          <button class="btn ghost" id="export-json">Exportera som JSON</button>
          <button class="btn danger" id="clear-local" ${ch.count ? "" : "disabled"}>Markera som sparat (rensa lokalt)</button>
        </div>
      </div>

      <div class="card pad-lg">
        <h2>Importera backup</h2>
        <p class="help">Har du en tidigare JSON-backup kan du läsa in den här (ersätter lokala ändringar).</p>
        <label class="btn ghost" style="cursor:pointer">Välj JSON-fil<input type="file" id="import-json" accept="application/json,.json" class="hide"></label>
      </div>
    `;

    $("#export-archive").addEventListener("click", () => {
      download("archive.js", store.buildArchiveFile(), "text/javascript");
      toast("archive.js nedladdad");
    });
    $("#export-json").addEventListener("click", () => {
      const data = { version: 1, courses: store.getCourses(), competitions: store.getCompetitions() };
      download("slaktcupen-backup.json", JSON.stringify(data, null, 2), "application/json");
      toast("Backup nedladdad");
    });
    $("#clear-local").addEventListener("click", () => {
      if (confirm("Har du sparat exporten i repot? Detta rensar de lokala ändringarna på den här enheten.")) {
        store.clearLocal();
        toast("Lokala ändringar rensade");
        render();
      }
    });
    $("#import-json").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          (data.courses || []).forEach((c) => store.saveCourse(c));
          (data.competitions || []).forEach((c) => store.saveCompetition(c));
          toast("Backup importerad");
          render();
        } catch (err) {
          alert("Kunde inte läsa filen som JSON.");
        }
      };
      reader.readAsText(file);
    });
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // =======================================================================
  //  VY: Om / Hjälp
  // =======================================================================
  function viewAbout(root) {
    root.innerHTML = `
      <div class="section-title"><h1>Om sidan</h1></div>
      <div class="card pad-lg mb">
        <h2>Vad är det här?</h2>
        <p>Ett arkiv för familjens minigolf-/bangolf-tävlingar. Fyll i resultat per hål, fota scorekortet och följ statistik över åren – snitt per hål på varje bana, flest vinster, banrekord och hole-in-ones.</p>
      </div>
      <div class="card pad-lg mb">
        <h2>Kom igång</h2>
        <ol style="padding-left:1.2em">
          <li><strong>Ny tävling</strong> – fyll i namn, datum, bana och spelare.</li>
          <li>Fota scorekortet och skriv in slagen per hål i rutnätet.</li>
          <li>Spara. Tävlingen syns direkt på den här enheten.</li>
          <li>Gå till <a href="#/arkiv">Arkiv &amp; synk</a> och exportera för att dela med familjen.</li>
        </ol>
      </div>
      <div class="card pad-lg mb">
        <h2>Vill ni att alla ska kunna spara direkt från mobilen?</h2>
        <p class="help">Det går att koppla på en gratis molndatabas (Supabase) så att alla kan lägga in resultat utan att någon behöver committa. Datalagret i appen är förberett för det. Hör av dig så hjälper jag till att sätta upp det.</p>
      </div>
      <p class="help center">Byggd för familjen ⛳ · Inga cookies, ingen spårning.</p>
    `;
  }

  // ---- Gemensamma småvyer ------------------------------------------------
  function emptyState(title, text, href, cta) {
    return `<div class="empty"><div class="big">⛳</div><h2>${esc(title)}</h2>${text ? `<p class="help">${esc(text)}</p>` : ""}${href ? `<a class="btn primary mt" href="${href}">${esc(cta)}</a>` : ""}</div>`;
  }
  function notFound(msg) {
    return `<div class="empty"><div class="big">🧭</div><h2>Hittades inte</h2><p class="help">${esc(msg || "Sidan finns inte.")}</p><a class="btn primary mt" href="#/">Till startsidan</a></div>`;
  }

  // ---- Start -------------------------------------------------------------
  App.init = function () {
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = "#/";
    render();
  };

  document.addEventListener("DOMContentLoaded", App.init);
})();
