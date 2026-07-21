/*
 * archive.js — Det gemensamma arkivet (källan alla ser).
 * -------------------------------------------------------
 * Detta är den "incheckade" datan som visas för alla som besöker sidan.
 * Nya tävlingar du lägger in i appen sparas först lokalt i din webbläsare.
 * När du vill spara dem i det delade arkivet: gå till "Arkiv & synk",
 * klicka "Exportera arkiv", lägg den nedladdade filen här (data/archive.js)
 * och committa till repot. Då ser hela familjen den.
 *
 * Du behöver aldrig redigera den här filen för hand — appen skapar den åt dig.
 * (Men strukturen nedan visar hur allt hänger ihop om du är nyfiken.)
 */
window.ARCHIVE_DATA = {
  // Version på dataformatet – används för framtida uppgraderingar.
  version: 1,

  // Banor som familjen spelat på. holeCount = antal hål (9/18/27).
  courses: [
    {
      id: "skrea",
      name: "Skrea Bangolf",
      location: "Falkenberg",
      holeCount: 18,
      // par är valfritt – lämnas tomt om ni inte spelar med par.
      par: [],
    },
  ],

  // Alla tävlingar. scores[hålnummer][spelarId] = antal slag.
  competitions: [
    {
      id: "2025-07-28-skrea",
      name: "Släkt-cupen 2025",
      date: "2025-07-28",
      courseId: "skrea",
      location: "Skrea Bangolf, Falkenberg",
      holeCount: 18,
      // Bild på scorekortet (data-URL). Tom här – lägg in via appen.
      photo: "",
      // OBS: EXEMPELDATA. Byt ut mot era riktiga siffror i appen
      // (Ny tävling → redigera) och ta bort den här noteringen.
      isExample: true,
      players: [
        { id: "p_s", name: "Sven" },
        { id: "p_h", name: "Hanna" },
        { id: "p_m", name: "Magnus" },
        { id: "p_u", name: "Ulla" },
        { id: "p_t", name: "Tomas" },
      ],
      // Slag per hål. Rad = hål (1–18), kolumn = spelare.
      scores: {
        1:  { p_s: 3, p_h: 2, p_m: 3, p_u: 4, p_t: 2 },
        2:  { p_s: 2, p_h: 2, p_m: 1, p_u: 2, p_t: 3 },
        3:  { p_s: 2, p_h: 1, p_m: 2, p_u: 3, p_t: 2 },
        4:  { p_s: 2, p_h: 2, p_m: 2, p_u: 2, p_t: 3 },
        5:  { p_s: 1, p_h: 3, p_m: 3, p_u: 3, p_t: 1 },
        6:  { p_s: 4, p_h: 2, p_m: 4, p_u: 3, p_t: 2 },
        7:  { p_s: 3, p_h: 3, p_m: 2, p_u: 3, p_t: 2 },
        8:  { p_s: 3, p_h: 2, p_m: 3, p_u: 2, p_t: 3 },
        9:  { p_s: 1, p_h: 2, p_m: 1, p_u: 2, p_t: 2 },
        10: { p_s: 2, p_h: 2, p_m: 3, p_u: 2, p_t: 3 },
        11: { p_s: 3, p_h: 2, p_m: 2, p_u: 4, p_t: 2 },
        12: { p_s: 2, p_h: 4, p_m: 3, p_u: 2, p_t: 5 },
        13: { p_s: 3, p_h: 3, p_m: 1, p_u: 3, p_t: 2 },
        14: { p_s: 1, p_h: 2, p_m: 2, p_u: 4, p_t: 3 },
        15: { p_s: 2, p_h: 2, p_m: 4, p_u: 3, p_t: 3 },
        16: { p_s: 4, p_h: 4, p_m: 4, p_u: 6, p_t: 3 },
        17: { p_s: 3, p_h: 2, p_m: 3, p_u: 1, p_t: 2 },
        18: { p_s: 2, p_h: 1, p_m: 3, p_u: 2, p_t: 1 },
      },
      // Frivillig "Lag-resultat"-kolumn från kortet (summa per hål e.d.).
      // Lämnas tom om ni inte använder den.
      teamResult: {},
      notes: "Exempeltävling – byt ut mot era riktiga siffror.",
    },
  ],
};
