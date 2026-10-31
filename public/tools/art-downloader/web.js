/*
 * Art Downloader in the browser: the Mac app's search, records and citations,
 * ported to run with no server. It talks to the page through the same messages
 * the server sends over its socket (step, meta, complete, search_progress…),
 * so the page doesn't care which one it's talking to.
 *
 * What the browser can't do: most museums don't let another site download
 * their image files (no CORS), so images are linked, not kept, until you
 * export — then every file a museum allows goes into the ZIP, and the rest
 * stay as links in its gallery page. The collection lives in IndexedDB, on
 * this device only.
 */
(() => {
  "use strict";

  /* ---------- storage ---------- */

  const DB_NAME = "art-downloader", DB_VERSION = 1;
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore("entries", { keyPath: "source_url" });
        d.createObjectStore("files");   // blobs from imported ZIPs, keyed by source_url
        d.createObjectStore("meta");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store);
      const out = fn(s);
      t.oncomplete = () => res(out && "result" in out ? out.result : out);
      t.onerror = () => rej(t.error);
    });
  }
  const all = () => tx("entries", "readonly", s => s.getAll());
  const put = e => tx("entries", "readwrite", s => s.put(e));
  const del = key => tx("entries", "readwrite", s => s.delete(key));
  const getFile = key => tx("files", "readonly", s => s.get(key));
  const putFile = (key, blob) => tx("files", "readwrite", s => s.put(blob, key));
  const delFile = key => tx("files", "readwrite", s => s.delete(key));
  const getMeta = key => tx("meta", "readonly", s => s.get(key));
  const putMeta = (key, v) => tx("meta", "readwrite", s => s.put(v, key));

  /* ---------- the record, as the app settles it ---------- */

  const INSTITUTIONS = [
    ["metmuseum.org", "The Metropolitan Museum of Art"], ["rijksmuseum.nl", "Rijksmuseum"],
    ["clevelandart.org", "Cleveland Museum of Art"], ["artic.edu", "Art Institute of Chicago"],
    ["commons.wikimedia.org", "Wikimedia Commons"], ["wikipedia.org", "Wikipedia"],
    ["pdimagearchive.org", "Public Domain Image Archive"], ["collections.mfa.org", "Museum of Fine Arts, Boston"],
    ["si.edu", "Smithsonian Institution"],
  ];
  const institutionFor = host => {
    const h = String(host || "").replace(/^www\./, "");
    const hit = INSTITUTIONS.find(([d]) => h === d || h.endsWith("." + d));
    return hit ? hit[1] : "";
  };
  const stripTags = s => String(s || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
  const clean = v => (v == null ? "" : stripTags(String(v)));

  function citeName(raw) {
    const name = String(raw || "").replace(/\s*\(.*$/, "").trim();
    if (!name || /^unknown/i.test(name)) return null;
    const parts = name.split(/\s+/);
    const plain = parts.length >= 2 && parts.length <= 4 && !name.includes(",") &&
      !/\b(of|the|de|van|von|da|del|der|workshop|school|after|circle|master|attributed)\b/i.test(name) &&
      parts.every(p => /^\p{Lu}/u.test(p));
    if (!plain) return { apa: name, inverted: name };
    const last = parts.pop();
    return { apa: `${last}, ${parts.map(p => p[0] + ".").join(" ")}`, inverted: `${last}, ${parts.join(" ")}` };
  }

  function citations(m) {
    const who = citeName(m.artist);
    const title = String(m.title || "Untitled").replace(/\.$/, "");
    const year = /^unknown/i.test(m.date_created || "") ? "" : String(m.date_created || "").trim();
    const medium = String(m.medium || "").trim();
    const house = m.museum_or_source || m.source_host || "";
    const url = m.source_url || "";
    const d = new Date((m.download_date || today()) + "T12:00:00Z");
    const mon = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][d.getUTCMonth()];
    const longMon = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getUTCMonth()];
    const join = (...xs) => xs.filter(Boolean).join(" ");
    const dot = s => (s && !/[.?!]$/.test(s) ? s + "." : s);
    const apaWork = `*${title}*${medium ? ` [${medium}]` : ""}.`, apaYear = `(${year || "n.d."}).`;
    return {
      APA_7: who ? join(dot(who.apa), apaYear, apaWork, dot(house), url) : join(apaWork, apaYear, dot(house), url),
      MLA_9: join(who && dot(who.inverted), `*${title}*.`, dot([year, house, url].filter(Boolean).join(", ")),
        `Accessed ${d.getUTCDate()} ${mon} ${d.getUTCFullYear()}.`),
      Chicago_17: join(who && dot(who.inverted), `*${title}*.`, dot(year), dot(medium && medium[0].toUpperCase() + medium.slice(1)),
        dot(house), `Accessed ${longMon} ${d.getUTCDate()}, ${d.getUTCFullYear()}.`, dot(url)),
    };
  }

  const today = () => new Date().toISOString().slice(0, 10);
  function finish(m) {
    const inst = institutionFor(m.source_host);
    if (inst && m.museum_or_source && m.museum_or_source !== inst && !m.credit_line) m.credit_line = m.museum_or_source;
    if (inst) m.museum_or_source = inst;
    m.title = clean(m.title).replace(/^File:/i, "").replace(/\.(jpe?g|png|tiff?|gif|webp|svg)$/i, "") || "Untitled";
    for (const k of ["artist", "date_created", "medium", "dimensions", "license", "description", "credit_line"]) m[k] = clean(m[k]);
    m.artist ||= "Unknown Artist"; m.date_created ||= "Unknown Date";
    m.download_date = today(); m.download_timestamp = new Date().toISOString();
    m.citations = citations(m);
    return m;
  }

  /* ---------- relevance, as in the app ---------- */

  const fold = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function matches(text, query) {
    const t = fold(text), words = fold(query).split(/\s+/).filter(w => w.length > 2);
    return !words.length || words.some(w => t.includes(w));
  }
  const personish = t => /\bportrait of\b/i.test(t || "") ||
    /\b(mr|mrs|ms|miss|dr|sir|lord|lady|prof|rev|senator|president|governor|capt|col|gen|dame|baron|count|duke|duchess)\b\.?\s/i.test(t || "") ||
    /\b(perspective|elevation|floor plan|section drawing|architectural drawing|site plan)\b/i.test(t || "");
  const WM_EXCLUDE = /wrestl|athlete|musician|band\b|logo|album cover|politician|actor|stable diffusion|midjourney|dall.e|ai.generat|ai art|fan art|deviantart|cosplay|video game|photographs of people|people by name/i;
  const WM_INCLUDE = /mytholog|folklore|legend|demon|creature|monster|deity|god|beast|dragon|painting|woodcut|etching|lithograph|illustration|artwork|engraving|drawing|fresco|tapestry|manuscript|miniature|ukiyo|scroll|century|in art\b|medieval|renaissance|baroque|illuminat|ancient|religious art|biblical/i;

  /* ---------- the sources ---------- */

  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${new URL(url).hostname} answered ${r.status}`);
    return r.json();
  }

  // The Met
  async function met(id) {
    const d = await getJSON(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
    if (!d.primaryImage && !d.primaryImageSmall) return null;
    return {
      title: d.title, artist: d.artistDisplayName, date_created: d.objectDate, medium: d.medium, dimensions: d.dimensions,
      museum_or_source: "The Metropolitan Museum of Art", credit_line: d.creditLine,
      license: d.isPublicDomain ? "Public Domain (CC0)" : d.rightsAndReproduction,
      source_url: d.objectURL || `https://www.metmuseum.org/art/collection/search/${id}`, source_host: "metmuseum.org",
      image_url: d.primaryImage || d.primaryImageSmall, display_url: d.primaryImageSmall || d.primaryImage,
      _signal: `${d.title} ${d.objectName || ""} ${(d.tags || []).map(t => t.term).join(" ")}`,
      _skip: /photograph/i.test(d.medium || "") || d.objectName === "Photograph",
    };
  }
  async function metSearch(q, n) {
    const d = await getJSON(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=${encodeURIComponent(q)}&hasImages=true&limit=${Math.min(n * 2, 400)}`);
    return (d.objectIDs || []).map(id => () => met(id));
  }

  // Cleveland: the search already returns whole records
  function cleveland(d) {
    const im = d.images || {};
    const img = im.print?.url || im.web?.url || im.full?.url;
    if (!img) return null;
    return {
      title: d.title, artist: d.creators?.[0]?.description, date_created: d.creation_date, medium: d.technique,
      dimensions: d.dimensions?.unframed?.text || "", museum_or_source: "Cleveland Museum of Art", credit_line: d.creditline,
      license: d.share_license_status === "CC0" ? "CC0" : d.rights, description: d.description,
      source_url: d.url || `https://www.clevelandart.org/art/${d.accession_number}`, source_host: "clevelandart.org",
      image_url: img, display_url: im.web?.url || img,
      image_width: +(im.print?.width || im.web?.width || 0) || undefined, image_height: +(im.print?.height || im.web?.height || 0) || undefined,
      _signal: `${d.title} ${d.description || ""} ${d.type || ""}`, _skip: /photograph/i.test(d.type || ""),
    };
  }
  async function clevelandSearch(q, n) {
    const d = await getJSON(`https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(q)}&has_image=1&cc0=1&limit=${Math.min(n * 2, 200)}`);
    return (d.data || []).map(x => async () => cleveland(x));
  }
  async function clevelandOne(acc) {
    const d = await getJSON(`https://openaccess-api.clevelandart.org/api/artworks/${encodeURIComponent(acc)}`);
    return d.data ? cleveland(d.data) : null;
  }

  // Art Institute of Chicago (its API sometimes refuses browsers; then it just sits out)
  const AIC_FIELDS = "id,title,artist_display,date_display,medium_display,dimensions,credit_line,image_id,is_public_domain,description,thumbnail";
  function aic(d, iiif) {
    if (!d.image_id) return null;
    return {
      title: d.title, artist: (d.artist_display || "").split("\n")[0], date_created: d.date_display, medium: d.medium_display,
      dimensions: d.dimensions, museum_or_source: "Art Institute of Chicago", credit_line: d.credit_line,
      license: d.is_public_domain ? "Public Domain (CC0)" : "", description: d.description,
      source_url: `https://www.artic.edu/artworks/${d.id}`, source_host: "artic.edu",
      image_url: `${iiif}/${d.image_id}/full/max/0/default.jpg`, display_url: `${iiif}/${d.image_id}/full/843,/0/default.jpg`,
      _signal: d.title, _skip: false,
    };
  }
  async function aicSearch(q, n) {
    const d = await getJSON(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&query[term][is_public_domain]=true&limit=${Math.min(n, 100)}&fields=${AIC_FIELDS}`);
    return (d.data || []).map(x => async () => aic(x, d.config.iiif_url));
  }
  async function aicOne(id) {
    const d = await getJSON(`https://api.artic.edu/api/v1/artworks/${id}?fields=${AIC_FIELDS}`);
    return aic(d.data, d.config.iiif_url);
  }

  // Wikimedia Commons: one call returns the files with their metadata
  function wikimedia(p, q) {
    const ii = p.imageinfo?.[0];
    if (!ii?.url || !/^image\/(jpeg|png|webp|tiff|gif)/.test(ii.mime || "")) return null;
    if ((ii.width || 0) < 400 || (ii.height || 0) < 400) return null;
    const x = ii.extmetadata || {}, v = k => stripTags(x[k]?.value || "");
    const name = p.title.replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
    const cats = (p.categories || []).map(c => c.title).join(" ");
    const signal = `${cats} ${v("ImageDescription")} ${v("LicenseShortName")}`;
    if (q != null) {
      if (personish(name) || WM_EXCLUDE.test(signal)) return null;
      // a file name alone isn't enough (a restaurant called Griffin); it needs art categories or an old-work licence
      if (!WM_INCLUDE.test(signal) && !/public domain|PD-old|PD-art|PD-US|PD-1923/i.test(v("LicenseShortName"))) return null;
      const year = +(v("DateTimeOriginal") || v("Date")).match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1];
      if (year >= 1950 && !/painting|engraving|woodcut|etching|manuscript|sculpture|museum/i.test(cats)) return null;
    }
    return {
      title: v("ObjectName") || name, artist: v("Artist"), date_created: v("DateTimeOriginal") || v("Date"),
      medium: v("medium"), museum_or_source: "Wikimedia Commons", credit_line: v("Credit"),
      license: v("LicenseShortName") || v("UsageTerms"), description: v("ImageDescription"),
      source_url: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`, source_host: "commons.wikimedia.org",
      image_url: ii.url, display_url: ii.thumburl || ii.url, image_width: ii.width, image_height: ii.height,
      file_size_kb: ii.size ? Math.round(ii.size / 1024) : undefined,
      _signal: `${name} ${v("ImageDescription")}`, _skip: false, _wm: true,
    };
  }
  const WM = "https://commons.wikimedia.org/w/api.php?format=json&origin=*&action=query&prop=imageinfo|categories&iiprop=url|size|mime|extmetadata&iiurlwidth=900&cllimit=max";
  async function wikimediaSearch(q, n) {
    const d = await getJSON(`${WM}&generator=search&gsrnamespace=6&gsrlimit=${Math.min(n, 50)}&gsrsearch=${encodeURIComponent(q)}`);
    return Object.values(d.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).map(p => async () => wikimedia(p, q));
  }
  async function wikimediaOne(title) {
    const d = await getJSON(`${WM}&titles=${encodeURIComponent(title)}`);
    const p = Object.values(d.query?.pages || {})[0];
    return p ? wikimedia(p, null) : null;
  }

  /* ---------- one page ---------- */

  function route(raw) {
    let u; try { u = new URL(raw); } catch { return null; }
    const h = u.hostname.replace(/^www\./, ""), p = decodeURIComponent(u.pathname + u.hash);
    let m;
    if (h.endsWith("metmuseum.org") && (m = p.match(/\/(?:search|objects?)\/(\d+)/))) return ["The Met", () => met(m[1])];
    if (h.endsWith("clevelandart.org") && (m = p.match(/\/art\/([\w.\-]+)/))) return ["Cleveland Museum of Art", () => clevelandOne(m[1])];
    if (h.endsWith("artic.edu") && (m = p.match(/\/artworks\/(\d+)/))) return ["Art Institute of Chicago", () => aicOne(m[1])];
    if ((h.endsWith("wikimedia.org") || h.endsWith("wikipedia.org")) && (m = p.match(/(File:[^?#]+)$/i) || p.match(/#\/media\/(File:.+)$/i)))
      return ["Wikimedia Commons", () => wikimediaOne(m[1].replace(/_/g, " "))];
    return null;
  }

  /* ---------- the engine the page talks to ---------- */

  const slug = s => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const strip = e => { const o = { ...e }; for (const k of Object.keys(o)) if (k[0] === "_") delete o[k]; return o; };

  async function add(url, emit) {
    const r = route(url);
    if (!r) throw new Error("On the web it reads the Met, Cleveland, the Art Institute of Chicago and Wikimedia. This page isn't one of them.");
    emit({ event: "step", msg: `${r[0]}: reading the record…`, status: "info" });
    const raw = await r[1]();
    if (!raw) throw new Error("That page has no image the museum shares.");
    const e = strip(finish(raw));
    emit({ event: "meta", title: e.title, artist: e.artist, date_created: e.date_created, medium: e.medium });
    emit({ event: "step", msg: "Record read, citations written", status: "ok" });
    const known = await tx("entries", "readonly", s => s.get(e.source_url));
    if (known) throw new Error("Already in the collection.");
    await put(e);
    emit({ event: "complete", entry: e });
  }

  async function search(query, limit, minimum, emit) {
    const folder = slug(query);
    emit({ event: "step", msg: `Searching the Met, Cleveland, Chicago and Wikimedia for “${query}”…`, status: "info" });
    const names = ["Met", "Cleveland", "Chicago", "Wikimedia"];
    const lists = await Promise.all([metSearch, clevelandSearch, aicSearch, wikimediaSearch].map(f => f(query, limit).catch(() => null)));
    emit({ event: "step", msg: lists.map((l, i) => `${names[i]}: ${l ? l.length : "unavailable"}`).join(" · "), status: "ok" });
    emit({ event: "search_total", total: limit });

    const have = new Set((await all()).map(e => e.image_url));
    // take from each source in turn, so one museum doesn't fill the shelf
    const queues = lists.map(l => (l || []).slice());
    let found = 0, tried = 0;
    const next = () => { for (let k = 0; k < queues.length; k++) { const q = queues[(tried + k) % queues.length]; if (q.length) { tried++; return q.shift(); } } return null; };
    const worker = async () => {
      for (let job; found < limit && (job = next());) {
        let raw; try { raw = await job(); } catch { continue; }
        if (!raw || raw._skip || personish(raw.title) || have.has(raw.image_url)) continue;
        if (!raw._wm && !matches(raw._signal, query)) continue;
        if (found >= limit) break;
        have.add(raw.image_url);
        const e = strip(finish(raw)); e.folder = folder;
        await put(e); found++;
        emit({ event: "search_progress", current: found, total: limit, entry: e });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (minimum > 0 && found < minimum) emit({ event: "search_below_min", found, minimum, query });
    emit({ event: "step", msg: `Done: ${found} relevant ${found === 1 ? "work" : "works"}`, status: "ok" });
    emit({ event: "search_complete", total: found, query, folder });
  }

  async function star(e) { e.starred = !e.starred; await put(strip(e)); return e.starred; }
  async function remove(e) { await del(e.source_url); await delFile(e.source_url).catch(() => {}); }

  // The sample collection seeds an empty register once
  async function seed(sampleUrl) {
    if (await getMeta("seeded")) return;
    const list = await (await fetch(sampleUrl)).json();
    for (const e of list) {
      const rel = e.image_rel_path || "", i = rel.indexOf("/");
      await put({ ...e, folder: i > 0 ? rel.slice(0, i) : "", sample: rel });
    }
    await putMeta("seeded", true);
  }

  /* ---------- files ---------- */

  // the image as a blob, if this browser may have it: kept, sample, or a museum that allows it
  async function blobOf(e, base) {
    const kept = await getFile(e.source_url);
    if (kept) return kept;
    for (const u of [e.sample && base + e.sample.split("/").map(encodeURIComponent).join("/"), e.image_url, e.display_url].filter(Boolean)) {
      try { const r = await fetch(u); if (r.ok) return await r.blob(); } catch { /* not shared with other sites */ }
    }
    return null;
  }

  const fileBase = e => {
    const who = /^unknown/i.test(e.artist || "") ? "" : String(e.artist).replace(/\s*\(.*$/, "") + " - ";
    return (who + (e.title || "untitled")).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-").slice(0, 90) || "untitled";
  };
  const extOf = (blob, url) => ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/tiff": ".tif" }[blob?.type]
    || (String(url).match(/\.(jpe?g|png|webp|gif|tiff?)(?:$|\?)/i) || [, "jpg"])[1].replace(/^/, "."));

  let jszip = null;
  function JSZipLib() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return jszip ||= new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = () => res(window.JSZip); s.onerror = () => rej(new Error("Couldn't load the ZIP library"));
      document.head.append(s);
    });
  }

  async function exportZip(base, gallery, progress) {
    const JSZip = await JSZipLib(), zip = new JSZip(), entries = (await all()).sort(byTime);
    const used = new Set(), log = [];
    let kept = 0;
    for (const [i, e] of entries.entries()) {
      progress(i, entries.length);
      const blob = await blobOf(e, base);
      let rel = "";
      if (blob) {
        const name = fileBase(e), ext = extOf(blob, e.image_url);
        let f = (e.folder ? e.folder + "/" : "") + name + ext;
        for (let n = 1; used.has(f); n++) f = (e.folder ? e.folder + "/" : "") + `${name}_${n}${ext}`;
        used.add(f); zip.file("downloads/" + f, blob); rel = f; kept++;
      }
      const { sample, ...rest } = e;
      log.push({ ...rest, local_file: rel ? "downloads/" + rel : "", image_rel_path: rel });
    }
    progress(entries.length, entries.length);
    zip.file("art_log.json", JSON.stringify(log, null, 2));
    zip.file("downloads/gallery.html", gallery(log));
    const out = await zip.generateAsync({ type: "blob" });
    return { blob: out, name: `art-collection-${today()}.zip`, kept, total: entries.length };
  }

  async function importZip(file) {
    const JSZip = await JSZipLib(), zip = await JSZip.loadAsync(file);
    const logFile = zip.file("art_log.json");
    if (!logFile) throw new Error("No art_log.json in that ZIP");
    const list = JSON.parse(await logFile.async("string"));
    const have = new Set((await all()).map(e => e.source_url));
    let added = 0;
    for (const e of list) {
      if (!e.source_url || have.has(e.source_url)) continue;
      const path = (e.local_file || "").replace(/\\/g, "/").replace(/^.*?downloads\//, "downloads/");
      const f = path && (zip.file(path) || zip.file(path.replace(/^downloads\//, "")));
      if (f) await putFile(e.source_url, new Blob([await f.async("arraybuffer")], { type: /\.png$/i.test(path) ? "image/png" : /\.webp$/i.test(path) ? "image/webp" : "image/jpeg" }));
      const rel = path.replace(/^downloads\//, ""), i = rel.indexOf("/");
      const { local_file, image_rel_path, ...rest } = e;
      await put({ ...rest, folder: e.folder || (i > 0 ? rel.slice(0, i) : ""), kept: !!f });
      added++;
    }
    return { added, total: list.length };
  }

  const byTime = (a, b) => String(a.download_timestamp || "").localeCompare(String(b.download_timestamp || ""));

  window.ArtWeb = {
    list: async () => (await all()).sort(byTime), add, search, star, remove, seed, blobOf, exportZip, importZip,
    keptFile: getFile,
  };
})();
