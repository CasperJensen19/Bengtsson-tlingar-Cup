/* ==========================================================================
   store.js — Datalager
   --------------------------------------------------------------------------
   Kombinerar det gemensamma arkivet (data/archive.js) med lokala ändringar
   som ligger i webbläsarens localStorage tills de committas till repot.

   All åtkomst till data går genom App.store, så att vi längre fram kan byta
   ut localStorage mot t.ex. Supabase utan att röra resten av appen.
   ========================================================================== */
(function () {
  "use strict";
  const App = (window.App = window.App || {});

  const LS_KEY = "slaktcupen_local_v1";

  // ---- Grunddata (incheckad) --------------------------------------------
  function baseData() {
    const d = window.ARCHIVE_DATA || { version: 1, courses: [], competitions: [] };
    return {
      courses: Array.isArray(d.courses) ? d.courses : [],
      competitions: Array.isArray(d.competitions) ? d.competitions : [],
    };
  }

  // ---- Lokala ändringar (denna webbläsare) ------------------------------
  function readLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { courses: {}, competitions: {}, deleted: [] };
      const p = JSON.parse(raw);
      return {
        courses: p.courses || {},
        competitions: p.competitions || {},
        deleted: p.deleted || [],
      };
    } catch (e) {
      return { courses: {}, competitions: {}, deleted: [] };
    }
  }
  function writeLocal(local) {
    localStorage.setItem(LS_KEY, JSON.stringify(local));
  }

  // ---- Sammanslagning ----------------------------------------------------
  // Lokala poster vinner över grunddata vid samma id. Raderade id:n tas bort.
  function merged() {
    const base = baseData();
    const local = readLocal();

    const courseMap = new Map();
    base.courses.forEach((c) => courseMap.set(c.id, { ...c, _local: false }));
    Object.values(local.courses).forEach((c) => courseMap.set(c.id, { ...c, _local: true }));

    const compMap = new Map();
    base.competitions.forEach((c) => compMap.set(c.id, { ...c, _local: false }));
    Object.values(local.competitions).forEach((c) => compMap.set(c.id, { ...c, _local: true }));

    (local.deleted || []).forEach((id) => compMap.delete(id));

    return {
      courses: [...courseMap.values()],
      competitions: [...compMap.values()].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      ),
    };
  }

  // ---- Publika läsfunktioner --------------------------------------------
  const store = {
    getCourses() {
      return merged().courses;
    },
    getCourse(id) {
      return merged().courses.find((c) => c.id === id) || null;
    },
    getCompetitions() {
      return merged().competitions;
    },
    getCompetition(id) {
      return merged().competitions.find((c) => c.id === id) || null;
    },

    // ---- Skrivfunktioner (går till localStorage) ------------------------
    saveCompetition(comp) {
      const local = readLocal();
      if (!comp.id) comp.id = store.makeCompetitionId(comp);
      comp.updatedAt = new Date().toISOString();
      local.competitions[comp.id] = comp;
      // Om den tidigare var markerad som raderad – ångra det.
      local.deleted = (local.deleted || []).filter((x) => x !== comp.id);
      // Säkerställ att banan finns lokalt om den inte finns i grunddata.
      if (comp.courseId && !baseData().courses.some((c) => c.id === comp.courseId)) {
        if (comp._course) {
          local.courses[comp.courseId] = comp._course;
          delete comp._course;
        }
      }
      writeLocal(local);
      return comp;
    },

    saveCourse(course) {
      const local = readLocal();
      if (!course.id) course.id = store.slug(course.name) || "bana_" + Date.now();
      local.courses[course.id] = course;
      writeLocal(local);
      return course;
    },

    deleteCompetition(id) {
      const local = readLocal();
      delete local.competitions[id];
      // Om posten finns i grunddata måste vi markera den som raderad.
      if (baseData().competitions.some((c) => c.id === id)) {
        local.deleted = Array.from(new Set([...(local.deleted || []), id]));
      }
      writeLocal(local);
    },

    // ---- Synk-status -----------------------------------------------------
    // Hur många lokala ändringar finns som ännu inte är i arkivet?
    localChanges() {
      const local = readLocal();
      const compIds = Object.keys(local.competitions);
      const courseIds = Object.keys(local.courses);
      const deleted = (local.deleted || []).filter((id) =>
        baseData().competitions.some((c) => c.id === id)
      );
      return {
        competitions: compIds,
        courses: courseIds,
        deleted,
        count: compIds.length + courseIds.length + deleted.length,
      };
    },

    hasLocalChanges() {
      return store.localChanges().count > 0;
    },

    // Töm lokala ändringar (används efter att man committat exporten).
    clearLocal() {
      localStorage.removeItem(LS_KEY);
    },

    // ---- Export ----------------------------------------------------------
    // Bygger innehållet till data/archive.js utifrån sammanslagen data.
    buildArchiveFile() {
      const m = merged();
      // Rensa interna fält (_local) innan export.
      const clean = (o) => {
        const c = { ...o };
        delete c._local;
        delete c._course;
        return c;
      };
      const data = {
        version: 1,
        courses: m.courses.map(clean),
        competitions: m.competitions
          .map(clean)
          .sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      };
      const header =
        "/*\n" +
        " * archive.js — Det gemensamma arkivet (skapad av appen).\n" +
        " * Lägg denna fil i data/archive.js och committa för att dela med familjen.\n" +
        " * Skapad: " +
        new Date().toLocaleString("sv-SE") +
        "\n */\n";
      return header + "window.ARCHIVE_DATA = " + JSON.stringify(data, null, 2) + ";\n";
    },

    // ---- Hjälpfunktioner -------------------------------------------------
    slug(s) {
      return (s || "")
        .toString()
        .toLowerCase()
        .replace(/[åä]/g, "a") // å ä -> a
        .replace(/[ö]/g, "o") // ö -> o
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // ta bort övriga diakritiska tecken
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    },

    makeCompetitionId(comp) {
      const base = (comp.date || "odaterad") + "-" + (store.slug(comp.courseId || comp.name) || "cup");
      let id = base;
      let n = 2;
      const existing = new Set(merged().competitions.map((c) => c.id));
      while (existing.has(id)) id = base + "-" + n++;
      return id;
    },

    makePlayerId(name, used) {
      let base = "p_" + (store.slug(name) || "spelare");
      let id = base;
      let n = 2;
      while (used && used.has(id)) id = base + "_" + n++;
      return id;
    },
  };

  App.store = store;
})();
