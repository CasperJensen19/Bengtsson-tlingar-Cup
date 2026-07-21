/* ==========================================================================
   stats.js — Statistikberäkningar
   --------------------------------------------------------------------------
   Bangolf: LÄGST antal slag vinner. Alla beräkningar utgår från det.
   ========================================================================== */
(function () {
  "use strict";
  const App = (window.App = window.App || {});

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  // Summa slag för en spelare i en tävling (hoppar över tomma hål).
  function playerTotal(comp, playerId) {
    let sum = 0;
    let played = 0;
    for (let h = 1; h <= comp.holeCount; h++) {
      const v = comp.scores?.[h]?.[playerId];
      if (typeof v === "number" && v > 0) {
        sum += v;
        played++;
      }
    }
    return { sum, played };
  }

  // Rankad resultattavla för en tävling (lägst först).
  function leaderboard(comp) {
    const rows = (comp.players || []).map((p) => {
      const { sum, played } = playerTotal(comp, p.id);
      return { player: p, total: sum, played };
    });
    rows.sort((a, b) => a.total - b.total);
    // Placering med delad plats vid lika.
    let place = 0;
    let prev = null;
    rows.forEach((r, i) => {
      if (prev === null || r.total !== prev) place = i + 1;
      r.place = place;
      prev = r.total;
    });
    return rows;
  }

  function winner(comp) {
    const lb = leaderboard(comp);
    return lb.length ? lb[0] : null;
  }

  // Antal hole-in-one (1 slag) för en spelare i en tävling.
  function aces(comp, playerId) {
    let n = 0;
    for (let h = 1; h <= comp.holeCount; h++) {
      if (comp.scores?.[h]?.[playerId] === 1) n++;
    }
    return n;
  }

  const stats = {
    round1,
    playerTotal,
    leaderboard,
    winner,
    aces,

    // -------- Bana: snitt-slag per hål över alla tävlingar på banan --------
    courseStats(courseId) {
      const comps = App.store
        .getCompetitions()
        .filter((c) => c.courseId === courseId);
      if (!comps.length) return null;

      const holeCount = Math.max(...comps.map((c) => c.holeCount || 0));
      const holeSum = new Array(holeCount + 1).fill(0);
      const holeN = new Array(holeCount + 1).fill(0);
      let bestRound = null; // lägsta totalrunda på banan
      let totalAces = 0;
      let roundsPlayed = 0;

      comps.forEach((comp) => {
        (comp.players || []).forEach((p) => {
          const { sum, played } = playerTotal(comp, p.id);
          if (played > 0) {
            roundsPlayed++;
            if (played === comp.holeCount && (bestRound === null || sum < bestRound.total)) {
              bestRound = { total: sum, player: p, comp };
            }
          }
          totalAces += aces(comp, p.id);
          for (let h = 1; h <= comp.holeCount; h++) {
            const v = comp.scores?.[h]?.[p.id];
            if (typeof v === "number" && v > 0) {
              holeSum[h] += v;
              holeN[h] += 1;
            }
          }
        });
      });

      const holes = [];
      for (let h = 1; h <= holeCount; h++) {
        holes.push({
          hole: h,
          avg: holeN[h] ? round1(holeSum[h] / holeN[h]) : null,
          n: holeN[h],
        });
      }
      const rated = holes.filter((h) => h.avg !== null);
      const hardest = rated.length
        ? rated.reduce((a, b) => (b.avg > a.avg ? b : a))
        : null;
      const easiest = rated.length
        ? rated.reduce((a, b) => (b.avg < a.avg ? b : a))
        : null;
      const courseAvg = rated.length
        ? round1(rated.reduce((s, h) => s + h.avg, 0) / rated.length)
        : null;

      return {
        courseId,
        competitions: comps,
        holes,
        hardest,
        easiest,
        courseAvg,
        bestRound,
        totalAces,
        roundsPlayed,
      };
    },

    // -------- Spelare: sammanställning över alla tävlingar -----------------
    playerStats(playerName) {
      const comps = App.store.getCompetitions();
      let played = 0;
      let wins = 0;
      let podiums = 0;
      let totalStrokes = 0;
      let totalHoles = 0;
      let acesTotal = 0;
      let best = null; // { total, comp }
      const placements = [];
      const perCompetition = [];

      comps.forEach((comp) => {
        const p = (comp.players || []).find((x) => x.name === playerName);
        if (!p) return;
        const { sum, played: hp } = playerTotal(comp, p.id);
        if (hp === 0) return;
        played++;
        totalStrokes += sum;
        totalHoles += hp;
        acesTotal += aces(comp, p.id);
        const lb = leaderboard(comp);
        const me = lb.find((r) => r.player.id === p.id);
        if (me) {
          placements.push(me.place);
          if (me.place === 1) wins++;
          if (me.place <= 3) podiums++;
        }
        if (hp === comp.holeCount && (best === null || sum < best.total)) {
          best = { total: sum, comp };
        }
        perCompetition.push({ comp, total: sum, place: me ? me.place : null, holes: hp });
      });

      if (played === 0) return null;
      return {
        name: playerName,
        played,
        wins,
        podiums,
        acesTotal,
        best,
        avgTotal: round1(totalStrokes / played),
        avgPerHole: round1(totalStrokes / totalHoles),
        avgPlace: placements.length
          ? round1(placements.reduce((a, b) => a + b, 0) / placements.length)
          : null,
        perCompetition: perCompetition.sort((a, b) =>
          (b.comp.date || "").localeCompare(a.comp.date || "")
        ),
      };
    },

    // -------- Alla unika spelarnamn i arkivet -----------------------------
    allPlayerNames() {
      const set = new Set();
      App.store.getCompetitions().forEach((c) =>
        (c.players || []).forEach((p) => set.add(p.name))
      );
      return [...set].sort((a, b) => a.localeCompare(b, "sv"));
    },

    // -------- Topplista: flest vinster -----------------------------------
    winLeaders() {
      const names = stats.allPlayerNames();
      return names
        .map((name) => {
          const s = stats.playerStats(name);
          return { name, wins: s ? s.wins : 0, played: s ? s.played : 0 };
        })
        .filter((x) => x.played > 0)
        .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name, "sv"));
    },

    // -------- Övergripande siffror för startsidan -------------------------
    overview() {
      const comps = App.store.getCompetitions();
      const courses = App.store.getCourses();
      const names = stats.allPlayerNames();
      let acesTotal = 0;
      comps.forEach((c) =>
        (c.players || []).forEach((p) => (acesTotal += aces(c, p.id)))
      );
      return {
        competitions: comps.length,
        courses: courses.length,
        players: names.length,
        aces: acesTotal,
        latest: comps[0] || null,
      };
    },
  };

  App.stats = stats;
})();
