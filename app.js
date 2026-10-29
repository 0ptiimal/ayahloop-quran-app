const API = "https://api.quran.com/api/v4";
const $ = (id) => document.getElementById(id);
const state = { chapters: [], currentChapter: null, verses: [], practiceVerse: null, audioUrl: null, hidden: false, reflectionIndex: 0 };
const audio = $("audioPlayer");

function setApiStatus(message, ok=false) {
  $("apiStatus").textContent = message;
  document.querySelector(".status-dot").classList.toggle("ok", ok);
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function api(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Quran API request failed (${response.status})`);
  return response.json();
}
function showView(name) {
  ["readView","memorizeView","reflectView","chapterView"].forEach(id => $(id).classList.add("hidden"));
  $(name).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name.replace("View","").replace("read","read")));
  const titles = {readView:["YOUR QURAN JOURNEY","A little every day."],memorizeView:["BUILD A STEADY HABIT","Memorize with kindness."],reflectView:["PAUSE & REFLECT","Let an ayah stay with you."],chapterView:["READ & LISTEN","Read at your own pace."]};
  $("todayLabel").textContent = titles[name][0]; $("pageTitle").textContent = titles[name][1];
}
function renderChapters(list) {
  $("surahCount").textContent = `${list.length} surahs`;
  $("surahGrid").innerHTML = list.map(ch => `<button class="surah-card" data-chapter="${ch.id}"><span class="surah-number">${ch.id}</span><span class="surah-detail"><span class="surah-name">${escapeHtml(ch.name_simple)}</span><span class="surah-sub">${ch.translated_name?.name || "Quran"} · ${ch.verses_count} ayat</span></span><span class="surah-arabic" dir="rtl">${escapeHtml(ch.name_arabic)}</span></button>`).join("");
  $("practiceSurah").innerHTML = state.chapters.map(ch => `<option value="${ch.id}">${ch.id}. ${escapeHtml(ch.name_simple)}</option>`).join("");
}
async function loadChapters() {
  try {
    const data = await api("/chapters?language=en");
    state.chapters = data.chapters || [];
    renderChapters(state.chapters);
    setApiStatus("Quran API connected", true);
  } catch (err) {
    setApiStatus("API connection unavailable");
    $("surahGrid").innerHTML = `<div class="loading-card">Could not load chapters from Quran.com. Check your internet connection, then refresh. <br><br><small>${escapeHtml(err.message)}</small></div>`;
  }
}
async function openChapter(id) {
  const chapter = state.chapters.find(c => c.id === Number(id));
  if (!chapter) return;
  state.currentChapter = chapter; showView("chapterView");
  $("chapterName").textContent = chapter.name_simple;
  $("chapterArabicName").textContent = chapter.name_arabic;
  $("chapterType").textContent = chapter.revelation_place === "makkah" ? "MAKKAN SURAH" : "MADINAN SURAH";
  $("chapterInfo").textContent = `${chapter.translated_name?.name || ""} · ${chapter.verses_count} ayat`;
  $("ayahList").innerHTML = '<div class="loading-card">Loading verses…</div>';
  try {
    const data = await api(`/verses/by_chapter/${id}?language=en&words=false&translations=131&audio=7&fields=text_uthmani,verse_key`);
    state.verses = data.verses || [];
    renderVerses();
  } catch (err) {
    $("ayahList").innerHTML = `<div class="loading-card">Unable to load verses. Please try again.<br><br>${escapeHtml(err.message)}</div>`;
  }
}
function renderVerses() {
  $("ayahList").innerHTML = state.verses.map(v => {
    const translation = v.translations?.[0]?.text || "";
    const audioUrl = v.audio?.url ? `https://verses.quran.com/${v.audio.url}` : "";
    return `<article class="ayah-card" data-verse="${escapeHtml(v.verse_key)}"><div class="ayah-card-top"><span class="ayah-badge">${v.verse_number}</span><div class="ayah-actions"><button class="tiny-btn" data-listen="${escapeHtml(audioUrl)}">▶ Listen</button><button class="tiny-btn" data-hide="${escapeHtml(v.verse_key)}">Hide ayah</button></div></div><div class="ayah-arabic arabic" dir="rtl">${v.text_uthmani || ""}</div><div class="ayah-translation">${translation}</div></article>`;
  }).join("");
}
function playUrl(url) {
  if (!url) { alert("Audio is not available for this ayah in the API response."); return; }
  audio.src = url.startsWith("http") ? url : `https://verses.quran.com/${url}`;
  audio.play().catch(() => alert("Audio could not start. Please check your browser's audio permissions."));
}
async function loadPractice() {
  const chapterId = Number($("practiceSurah").value || 1);
  try {
    const data = await api(`/verses/by_chapter/${chapterId}?language=en&words=false&translations=131&audio=7&fields=text_uthmani,verse_key`);
    const verses = data.verses || [];
    if (!verses.length) throw new Error("No ayat returned");
    state.practiceVerse = verses[Math.floor(Math.random() * verses.length)];
    state.hidden = false;
    showPracticeVerse();
  } catch (err) {
    $("recallFeedback").textContent = "Could not load an ayah. Check your connection and try again.";
  }
}
function showPracticeVerse() {
  const v = state.practiceVerse; if (!v) return;
  const ch = state.chapters.find(c => c.id === Number(v.verse_key.split(":")[0]));
  $("practiceMeta").textContent = `${ch?.name_simple || "Surah"} · Ayah ${v.verse_number}`;
  $("practiceArabic").textContent = v.text_uthmani || "";
  $("practiceTranslation").innerHTML = v.translations?.[0]?.text || "";
  $("practiceArabic").classList.remove("hidden");
  $("practiceTranslation").classList.remove("hidden");
  $("recallFeedback").textContent = "Read carefully once, then test your recall.";
  $("selfRating").classList.add("hidden");
  $("hideAyah").classList.remove("hidden");
}
function hidePractice() {
  if (!state.practiceVerse) return;
  $("practiceArabic").classList.add("hidden");
  $("practiceTranslation").classList.add("hidden");
  $("recallFeedback").textContent = "Take a breath. Recite what you remember, then reveal the ayah to check.";
  $("selfRating").classList.remove("hidden");
  state.hidden = true;
}
async function loadReflection() {
  try {
    const candidates = [{chapter:94,verse:5},{chapter:2,verse:286},{chapter:13,verse:28},{chapter:39,verse:53},{chapter:29,verse:69},{chapter:3,verse:139}];
    const chosen = candidates[state.reflectionIndex % candidates.length]; state.reflectionIndex++;
    const data = await api(`/verses/by_key/${chosen.chapter}:${chosen.verse}?language=en&translations=131&fields=text_uthmani,verse_key`);
    const v = data.verse;
    $("reflectionArabic").textContent = v.text_uthmani || "";
    $("reflectionTranslation").innerHTML = v.translations?.[0]?.text || "";
    const ch = state.chapters.find(c => c.id === chosen.chapter);
    $("reflectionReference").textContent = `${ch?.name_simple || "Quran"} ${chosen.chapter}:${chosen.verse}`;
    $("reflectionStatus").textContent = "";
  } catch (err) { $("reflectionStatus").textContent = "Could not load reflection ayah. Please try again."; }
}
document.addEventListener("click", e => {
  const chapterButton = e.target.closest("[data-chapter]");
  if (chapterButton) openChapter(chapterButton.dataset.chapter);
  const listenButton = e.target.closest("[data-listen]");
  if (listenButton) playUrl(listenButton.dataset.listen);
  const hideButton = e.target.closest("[data-hide]");
  if (hideButton) {
    const card = hideButton.closest(".ayah-card");
    card.classList.toggle("hidden-verse");
    hideButton.textContent = card.classList.contains("hidden-verse") ? "Reveal ayah" : "Hide ayah";
    let note = card.querySelector(".reveal-note");
    if (card.classList.contains("hidden-verse") && !note) { note = document.createElement("div"); note.className = "reveal-note"; note.textContent = "Try recalling it before revealing."; card.appendChild(note); }
    if (!card.classList.contains("hidden-verse") && note) note.remove();
  }
  const rating = e.target.closest("[data-rating]");
  if (rating) {
    const messages = {again:"That's okay. Repeat slowly and revisit it later.",good:"Alhamdulillah. Review it again in your next session.",easy:"Great. Try recalling it again tomorrow to strengthen it."};
    $("recallFeedback").textContent = messages[rating.dataset.rating];
    $("selfRating").classList.add("hidden");
  }
});
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  if (btn.dataset.view === "read") showView("readView");
  if (btn.dataset.view === "memorize") { showView("memorizeView"); if (!state.practiceVerse) loadPractice(); }
  if (btn.dataset.view === "reflect") { showView("reflectView"); if (!$("reflectionArabic").dataset.loaded) { loadReflection(); $("reflectionArabic").dataset.loaded = "1"; } }
}));
$("surahSearch").addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  renderChapters(state.chapters.filter(ch => `${ch.name_simple} ${ch.name_arabic} ${ch.translated_name?.name || ""}`.toLowerCase().includes(q)));
});
$("startPractice").addEventListener("click", () => { showView("memorizeView"); loadPractice(); });
$("loadPractice").addEventListener("click", loadPractice);
$("hideAyah").addEventListener("click", hidePractice);
$("revealAyah").addEventListener("click", () => { showPracticeVerse(); $("recallFeedback").textContent = "Check the text gently. Which words were easy, and which need another review?"; });
$("playAyah").addEventListener("click", () => { const url = state.practiceVerse?.audio?.url; playUrl(url); });
$("backToRead").addEventListener("click", () => showView("readView"));
$("playChapter").addEventListener("click", () => { const url = state.verses[0]?.audio?.url; playUrl(url); });
$("fontToggle").addEventListener("click", () => document.body.classList.toggle("large-arabic"));
$("newReflection").addEventListener("click", loadReflection);
$("saveReflection").addEventListener("click", () => {
  const note = $("reflectionNote").value.trim();
  if (!note) { $("reflectionStatus").textContent = "Write a short note first."; return; }
  const key = "ayahloop-reflections";
  const entries = JSON.parse(localStorage.getItem(key) || "[]");
  entries.push({reference:$("reflectionReference").textContent, text:note, date:new Date().toISOString()});
  localStorage.setItem(key, JSON.stringify(entries));
  $("reflectionStatus").textContent = "Reflection saved on this device.";
});
$("todayLabel").textContent = new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date()).toUpperCase();
$("translationSelect").addEventListener("change", async () => {
  if (!state.currentChapter) return;
  try {
    const data = await api(`/verses/by_chapter/${state.currentChapter.id}?language=en&words=false&translations=131&audio=7&fields=text_uthmani,verse_key`);
    state.verses = data.verses || []; renderVerses();
  } catch {}
});
loadChapters();
