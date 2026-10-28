const LABELS = [
  { id: "fact", src: "content/VectorPart1/MarkFact.svg", name: "Показания" },
  { id: "opinion", src: "content/VectorPart1/Mark50.svg", name: "Мнения" },
  { id: "none", src: "content/VectorPart1/MarkNo.svg", name: "Не существует" },
];

const CASE_NAMES = ["Первое", "Второе", "Третье", "Четвёртое", "Пятое", "Шестое"];
const CASE_DESCRIPTIONS = [
  "Первый случай заражения",
  "Массовое заражение в Калитниково",
  "Распространение на другие сёла",
  "Областной уровень угрозы",
  "Случаи помешательства",
  "Нестабильность ситуации в приграничье",
];
const CASE_NUMBERS = ["01", "02", "03", "04", "5 Д3Л0", "6 Д3Л0"];
const CORRUPTED_CASE_TITLES = ["Первое", "Второе", "Третье", "Четвёртое", "П5ят0е", "Ш3ст0е"];
const CASES = window.CASE_DATA;
const track = document.querySelector("#caseTrack");
const title = document.querySelector("#caseTitle");
const prev = document.querySelector("#prevCase");
const next = document.querySelector("#nextCase");
const story = document.querySelector(".story");
const notFound = document.querySelector("#notFound");
const returnHome = document.querySelector("#returnHome");
const instruction = document.querySelector("#instruction");
const instructionStart = document.querySelector("#instructionStart");
const officeMusic = document.querySelector("#officeMusic");
const exitRoute = document.querySelector("#exitRoute");
const corruptionBars = document.querySelector("#corruptionBars");
const audiobook = document.querySelector("#audiobook");
const narration = document.querySelector("#narration");
const bookText = document.querySelector("#bookText");
const bookMedia = document.querySelector("#bookMedia");
const chapterIntro = document.querySelector("#chapterIntro");
const bookSoundtrack = document.querySelector("#bookSoundtrack");
const shellTransition = document.querySelector("#shellTransition");
const descriptionMeta = document.querySelector('meta[name="description"]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
const siteIcon = document.querySelector("#siteIcon");
let currentBookChapter = 0;
let currentMediaIndex = -1;
let seekTimer;
let seekStartedAt = 0;
let chapterIntroTimer;
let chapterLoadToken = 0;
let thirdTransitionStarted = false;
const EXPERIENCE_KEY = "paguba-experience-v1";
const audioFadeTokens = new WeakMap();

const CHAPTER_MEDIA = [
  [{ at: 0, src: "content/VideosPart2/Start.mp4", intro: true }, { at: 10, src: "content/ImagesPart2/CH1_Start.JPG" }, { at: .62, src: "content/VideosPart2/CH1.MP4", loop: true }],
  [{ at: 0, src: "content/VideosPart2/CH2-CH3.MP4", intro: true }, { at: 10, src: "content/ImagesPart2/CH2_House.JPG" }],
  [{ at: 0, src: "content/VideosPart2/CH2-CH3.MP4", intro: true }, { at: 10, src: "content/ImagesPart2/CH3_Illness.png" }, { at: .7, src: "content/ImagesPart2/CH3_Semen.JPG" }],
  [{ at: 0, src: "content/VideosPart2/CH4-CH5.MP4", intro: true }, { at: 10, src: "content/ImagesPart2/CH4_Soldiers.JPG" }, { at: 254, src: "content/ImagesPart2/CH4_Seek.JPG" }],
  [{ at: 0, src: "content/VideosPart2/CH4-CH5.MP4", intro: true }, { at: 10, src: "content/ImagesPart2/CH5_Doctor.PNG" }, { at: .4, src: "content/ImagesPart2/CH5_House.PNG" }],
  [{ at: 0, src: "content/VideosPart2/CH6-CH8.MP4", intro: true }, { at: 10, src: "content/ImagesPart2/CH6_Walk.JPG" }, { at: .2, src: "content/ImagesPart2/CH6_Mountain.JPG" }, { at: .38, src: "content/ImagesPart2/CH6_Club.JPG" }, { at: .55, src: "content/ImagesPart2/CH6_Problem.JPG" }, { at: .74, src: "content/ImagesPart2/CH6_Bird.JPG" }],
  [{ at: 0, src: "content/VideosPart2/CH6-CH8.MP4", intro: true }],
  [{ at: 0, src: "content/ImagesPart2/CH8_Cataclism.png" }, { at: .72, src: "content/VideosPart2/Final.mp4" }],
];
const CHAPTER_SOUNDTRACKS = ["Начало", "В лесу", "Деревня", "Незнакомец", "Дом", "Побег", "Лаборатория", "Главная тема"];
const OFFICE_THEME_COLORS = ["#f3d58f", "#f3d58f", "#f2bd72", "#fa4d76", "#3c0b1e", "#080808"];
const BOOK_SOUNDTRACK_VOLUME = .018;
let activeCase = 0;
let audioContext;
let isAnimating = false;
let hasReturned = false;

const escapeHTML = value => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[char]));

function typographText(value) {
  return value
    .replace(/(^|[\s(«„])([А-Яа-яA-Za-z]{1,2}) /g, "$1$2\u00a0")
    .replace(/ (без|вне|для|до|из|из-за|кроме|между|на|над|не|ни|об|от|перед|по|под|при|про|через) /gi, " $1\u00a0")
    .replace(/ — /g, " — ");
}

function caseMarkup(caseIndex) {
  const data = CASES[caseIndex];
  return `
    <section class="case-canvas" data-case="${caseIndex}" aria-label="${CASE_NAMES[caseIndex]} дело">
      <header class="case-meta">
        <span class="case-number">${CASE_NUMBERS[caseIndex]}</span>
        <span class="case-number-label">${caseIndex > 3 ? "н0м3р д3ла" : "номер дела"}</span>
        <div class="case-name">${CASE_DESCRIPTIONS[caseIndex]}</div>
        <span class="case-description-label">${caseIndex > 3 ? "0писани3" : "описание"}</span>
      </header>
      <aside class="labels" aria-label="Ярлыки">
        <span class="section-label">${caseIndex > 3 ? "ярл4ки" : "ярлыки"}</span>
        ${LABELS.map(label => `<button class="label-button" type="button" data-label="${label.id}" aria-label="Назначить ярлык: ${label.name}"><img src="${label.src}" alt="${label.name}"></button>`).join("")}
      </aside>
      <div class="document-stage" aria-live="polite"></div>
      <section class="tray tray-pending">
        <span class="section-label">${caseIndex > 3 ? "прил0женные<br>мат3риалы" : "приложенные<br>материалы"}</span>
        <div class="thumbs pending-thumbs"></div>
      </section>
      <section class="tray tray-sorted">
        <span class="section-label">${caseIndex > 3 ? "0тс0ртир0ванные<br>мат3риалы" : "отсортированные<br>материалы"}</span>
        <div class="thumbs sorted-thumbs"></div>
      </section>
    </section>`;
}

track.innerHTML = CASES.map((_, index) => caseMarkup(index)).join("");

function getState(canvas) {
  if (!canvas._state) canvas._state = { active: 0, labels: {} };
  return canvas._state;
}

function readExperience() {
  try {
    return JSON.parse(localStorage.getItem(EXPERIENCE_KEY) || "{}") || {};
  } catch (_) {
    return {};
  }
}

function storageValue(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function setStorageValue(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* Optional persistence. */ }
}

function writeExperience(patch) {
  try {
    localStorage.setItem(EXPERIENCE_KEY, JSON.stringify({ ...readExperience(), ...patch }));
  } catch (_) { /* The experience still works when storage is unavailable. */ }
}

function restoreOfficeDocuments() {
  const storedCases = readExperience().cases;
  if (!Array.isArray(storedCases)) return;
  track.querySelectorAll(".case-canvas").forEach((canvas, caseIndex) => {
    const saved = storedCases[caseIndex];
    if (!saved || typeof saved !== "object") return;
    const count = CASES[caseIndex].documents.length;
    const labels = Object.fromEntries(Object.entries(saved.labels || {}).filter(([key, value]) => {
      const documentIndex = Number(key);
      return Number.isInteger(documentIndex) && documentIndex >= 0 && documentIndex < count && LABELS.some(label => label.id === value);
    }));
    let active = saved.active === null ? null : Number(saved.active);
    if (!Number.isInteger(active) || active < 0 || active >= count) active = 0;
    if (active === null && Object.keys(labels).length < count) {
      active = Array.from({ length: count }, (_, index) => index).find(index => !labels[index]) ?? 0;
    }
    canvas._state = { active, labels };
  });
}

function persistOfficeState() {
  const cases = [...track.querySelectorAll(".case-canvas")].map(canvas => {
    const state = getState(canvas);
    return { active: state.active, labels: { ...state.labels } };
  });
  writeExperience({ shell: "office", activeCase, cases });
}

function persistBookLocation() {
  writeExperience({ shell: "book", activeCase, bookChapter: currentBookChapter });
}

function playPaperSound() {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const duration = .18;
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1250, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(320, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(.032, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(audioContext.destination);
    source.start();
  } catch (_) { /* Sound is an enhancement. */ }
}

function documentText(caseIndex, docIndex) {
  return typographText(CASES[caseIndex].documents[docIndex]);
}

function documentMarkup(canvas, docIndex) {
  const caseIndex = +canvas.dataset.case;
  const label = getState(canvas).labels[docIndex];
  const paragraphs = escapeHTML(documentText(caseIndex, docIndex)).replaceAll("\n", "<br>");
  return `<article class="document is-active" data-doc="${docIndex}" ${label ? `data-label="${label}"` : ""} aria-label="Документ ${docIndex + 1}"><div class="sheet-content">${paragraphs}</div></article>`;
}

function thumbMarkup(canvas, docIndex, label) {
  const text = documentText(+canvas.dataset.case, docIndex);
  const preview = escapeHTML(text).replaceAll("\n", "<br>");
  return `<button class="paper-thumb" type="button" data-doc="${docIndex}" ${label ? `data-label="${label}"` : ""} aria-label="Открыть документ ${docIndex + 1}"><span class="sheet-content">${preview}</span></button>`;
}

function captureSheets(canvas) {
  return new Map([...canvas.querySelectorAll("[data-doc]")].map(element => [
    element.dataset.doc,
    { element, rect: element.getBoundingClientRect(), style: getComputedStyle(element) },
  ]));
}

function fitSheetText(element, minimum) {
  if (!element || element.scrollHeight <= element.clientHeight) return;
  const maximum = parseFloat(getComputedStyle(element).fontSize) || 16;
  let low = minimum;
  let high = maximum;
  for (let step = 0; step < 8; step++) {
    const middle = (low + high) / 2;
    element.style.fontSize = `${middle}px`;
    if (element.scrollHeight <= element.clientHeight) low = middle;
    else high = middle;
  }
  element.style.fontSize = `${Math.max(minimum, low - .06).toFixed(2)}px`;
}

function sizeDocument(element) {
  if (!element) return;
  const stage = element.parentElement;
  const viewportWidth = window.innerWidth;
  const preferredWidth = viewportWidth <= 760
    ? Math.min(viewportWidth * .82, 500)
    : viewportWidth <= 1100
      ? Math.min(viewportWidth * .54, 470)
      : Math.min(viewportWidth * .31, 580);
  const width = Math.max(1, Math.min(preferredWidth, stage.clientWidth, stage.clientHeight * .72));
  element.style.width = `${width}px`;
  element.style.height = `${width / .72}px`;
  element.style.setProperty("--sheet-scale", width / 500);
}

function sizeThumbnail(element) {
  if (!element) return;
  element.style.setProperty("--sheet-scale", element.clientWidth / 500);
}

function sheetMotion(caseIndex) {
  if (caseIndex === 3) return { duration: 560, easing: "cubic-bezier(.4,0,.2,1)", mode: "interface" };
  if (caseIndex >= 4) return { duration: 820, easing: "cubic-bezier(.58,-.08,.2,1.08)", mode: "uneasy" };
  return { duration: 920, easing: "cubic-bezier(.22,.72,.16,1)", mode: "physical" };
}

function makeFlyingSheet(start, finish) {
  const clone = document.createElement("div");
  const flipper = document.createElement("div");
  const front = document.createElement("div");
  const back = document.createElement("div");
  clone.className = "flying-sheet";
  flipper.className = "flying-sheet__flipper";
  front.className = "flying-sheet__face flying-sheet__front";
  back.className = "flying-sheet__face flying-sheet__back";
  const sourceContent = start.element.querySelector(".sheet-content");
  const movingContent = sourceContent.cloneNode(true);
  movingContent.className = "flying-sheet__content";
  front.replaceChildren(movingContent);
  const finishStyle = getComputedStyle(finish.element);
  const background = finishStyle.backgroundColor === "rgba(0, 0, 0, 0)" ? start.style.backgroundColor : finishStyle.backgroundColor;
  Object.assign(clone.style, {
    left: `${start.rect.left}px`, top: `${start.rect.top}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px`,
  });
  clone.style.setProperty("--sheet-background", background);
  clone.style.setProperty("--sheet-color", finishStyle.color);
  const sourceContentStyle = getComputedStyle(sourceContent);
  movingContent.style.fontSize = sourceContentStyle.fontSize;
  flipper.append(front, back);
  clone.append(flipper);
  document.body.append(clone);
  return { clone, flipper };
}

function animateReflow(canvas, mutate) {
  if (isAnimating) return 0;
  isAnimating = true;
  const before = captureSheets(canvas);
  mutate();
  renderCanvas(canvas);
  const after = captureSheets(canvas);
  const flights = [];
  const motion = sheetMotion(+canvas.dataset.case);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 1 : motion.duration;

  before.forEach((start, key) => {
    const finish = after.get(key);
    if (!finish) return;
    const dx = finish.rect.left - start.rect.left;
    const dy = finish.rect.top - start.rect.top;
    const sx = finish.rect.width / Math.max(1, start.rect.width);
    const sy = finish.rect.height / Math.max(1, start.rect.height);
    const changesRole = start.element.classList.contains("document") || finish.element.classList.contains("document");
    const visiblyMoved = Math.abs(dx) > 2 || Math.abs(dy) > 2 || Math.abs(sx - 1) > .015 || Math.abs(sy - 1) > .015;
    if (!changesRole && !visiblyMoved) return;
    const { clone, flipper } = makeFlyingSheet(start, finish);
    finish.element.style.visibility = "hidden";
    const outerFrames = motion.mode === "uneasy"
      ? [
          { left: `${start.rect.left}px`, top: `${start.rect.top}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px`, transform: "rotateZ(0deg)" },
          { left: `${start.rect.left + dx * .44}px`, top: `${start.rect.top + dy * .4 - 8}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px`, transform: "rotateZ(-1deg)", offset: .44 },
          { left: `${start.rect.left + dx * .56}px`, top: `${start.rect.top + dy * .6 + 5}px`, width: `${finish.rect.width}px`, height: `${finish.rect.height}px`, transform: "rotateZ(.6deg)", offset: .56 },
          { left: `${finish.rect.left}px`, top: `${finish.rect.top}px`, width: `${finish.rect.width}px`, height: `${finish.rect.height}px`, transform: "rotateZ(0deg)" },
        ]
      : [
          { left: `${start.rect.left}px`, top: `${start.rect.top}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px` },
          { left: `${start.rect.left + dx * .44}px`, top: `${start.rect.top + dy * .44 - (motion.mode === "physical" ? 8 : 0)}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px`, offset: .44 },
          { left: `${start.rect.left + dx * .56}px`, top: `${start.rect.top + dy * .56 - (motion.mode === "physical" ? 8 : 0)}px`, width: `${finish.rect.width}px`, height: `${finish.rect.height}px`, offset: .56 },
          { left: `${finish.rect.left}px`, top: `${finish.rect.top}px`, width: `${finish.rect.width}px`, height: `${finish.rect.height}px` },
        ];
    clone.animate(outerFrames, { duration, easing: motion.easing, fill: "forwards" });
    const movingContent = clone.querySelector(".flying-sheet__content");
    const startScale = start.rect.width / 500;
    const finishScale = finish.rect.width / 500;
    movingContent.animate([
      { transform: `scale(${startScale})` },
      { transform: `scale(${startScale})`, offset: .44 },
      { transform: `scale(${finishScale})`, offset: .56 },
      { transform: `scale(${finishScale})` },
    ], { duration, easing: motion.easing, fill: "forwards" });
    if (changesRole) {
      flipper.animate(
        motion.mode === "uneasy"
          ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(168deg)", offset: .46 }, { transform: "rotateY(194deg)", offset: .55 }, { transform: "rotateY(360deg)" }]
          : [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)", offset: .5 }, { transform: "rotateY(360deg)" }],
        { duration, easing: motion.mode === "uneasy" ? "cubic-bezier(.4,0,.3,1)" : "cubic-bezier(.45,0,.55,1)", fill: "forwards" },
      );
    }
    flights.push({ clone, finish });
  });

  window.setTimeout(() => {
    flights.forEach(({ clone, finish }) => { clone.remove(); finish.element.style.visibility = ""; });
    isAnimating = false;
  }, duration + 30);
  return duration;
}

function renderCanvas(canvas) {
  const state = getState(canvas);
  const count = CASES[+canvas.dataset.case].documents.length;
  const all = Array.from({ length: count }, (_, index) => index);
  const pending = all.filter(index => index !== state.active && !state.labels[index]);
  const sorted = all.filter(index => index !== state.active && state.labels[index]);
  const stage = canvas.querySelector(".document-stage");

  stage.innerHTML = state.active === null ? `<p class="all-sorted">Все материалы отсортированы.<br>Выберите лист справа, чтобы вернуться к нему.</p>` : documentMarkup(canvas, state.active);
  canvas.querySelector(".pending-thumbs").innerHTML = pending.map(index => thumbMarkup(canvas, index)).join("");
  canvas.querySelector(".sorted-thumbs").innerHTML = sorted.map(index => thumbMarkup(canvas, index, state.labels[index])).join("");
  canvas.querySelectorAll(".label-button").forEach(button => {
    button.disabled = state.active === null;
    button.classList.toggle("is-selected", state.active !== null && button.dataset.label === state.labels[state.active]);
  });
  const documentElement = stage.querySelector(".document");
  sizeDocument(documentElement);
  fitSheetText(documentElement?.querySelector(".sheet-content"), 7.5);
  canvas.querySelectorAll(".paper-thumb").forEach(thumb => {
    sizeThumbnail(thumb);
    fitSheetText(thumb.querySelector(".sheet-content"), 7.5);
  });
}

function exchangeDocument(canvas, targetIndex) {
  const state = getState(canvas);
  if (targetIndex === state.active) return;
  playPaperSound();
  animateReflow(canvas, () => {
    state.active = targetIndex;
  });
  persistOfficeState();
}

function sortActive(canvas, label) {
  const state = getState(canvas);
  if (state.active === null) return;
  playPaperSound();
  const duration = animateReflow(canvas, () => {
    state.labels[state.active] = label;
    const nextPending = CASES[+canvas.dataset.case].documents.findIndex((_, index) => index !== state.active && !state.labels[index]);
    state.active = nextPending === -1 ? null : nextPending;
  });
  persistOfficeState();
  window.setTimeout(() => setCase(activeCase), duration + 40);
}

restoreOfficeDocuments();
track.querySelectorAll(".case-canvas").forEach(canvas => {
  renderCanvas(canvas);
  canvas.addEventListener("click", event => {
    const label = event.target.closest(".label-button");
    const thumb = event.target.closest(".paper-thumb");
    if (label) sortActive(canvas, label.dataset.label);
    else if (thumb) exchangeDocument(canvas, +thumb.dataset.doc);
  });
});
document.fonts?.ready.then(() => {
  if (!isAnimating) track.querySelectorAll(".case-canvas").forEach(renderCanvas);
});

function setCase(index, shouldPersist = true) {
  if (index >= CASES.length) {
    show404();
    return;
  }
  activeCase = Math.max(0, Math.min(CASES.length - 1, index));
  story.dataset.activeCase = activeCase;
  const first = track.querySelector(".case-canvas");
  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  track.style.transform = `translateX(${-activeCase * (first.getBoundingClientRect().width + gap)}px)`;
  title.textContent = `${CORRUPTED_CASE_TITLES[activeCase]} дело`;
  prev.disabled = activeCase === 0;
  next.disabled = Object.keys(getState(track.children[activeCase]).labels).length === 0;
  if (audiobook.hidden) setThemeColor(OFFICE_THEME_COLORS[activeCase]);
  if (!officeMusic.paused) fadeMusic([.16, .15, .13, .11, .08, .055][activeCase], 1100);
  if (shouldPersist) persistOfficeState();
}

function fadeMusic(target, duration = 1400) {
  const token = Symbol("office-fade");
  audioFadeTokens.set(officeMusic, token);
  const start = officeMusic.volume;
  const started = performance.now();
  const tick = now => {
    if (audioFadeTokens.get(officeMusic) !== token) return;
    const progress = Math.max(0, Math.min(1, (now - started) / duration));
    officeMusic.volume = start + (target - start) * progress;
    if (progress < 1) requestAnimationFrame(tick);
    else if (target === 0) officeMusic.pause();
  };
  requestAnimationFrame(tick);
}

function fadeAudio(audio, target, duration = 900) {
  const token = Symbol("audio-fade");
  audioFadeTokens.set(audio, token);
  const start = audio.volume;
  const started = performance.now();
  const tick = now => {
    if (audioFadeTokens.get(audio) !== token) return;
    const progress = Math.max(0, Math.min(1, (now - started) / duration));
    audio.volume = start + (target - start) * progress;
    if (progress < 1) requestAnimationFrame(tick);
    else if (target === 0) audio.pause();
  };
  requestAnimationFrame(tick);
}

function enterThirdPage() {
  if (thirdTransitionStarted) return;
  thirdTransitionStarted = true;
  saveChapterProgress();
  narration.pause();
  fadeAudio(bookSoundtrack, 0, 900);
  shellTransition.classList.add("is-active");
  window.setTimeout(() => {
    window.location.href = "third.html";
  }, 1250);
}

function setThemeColor(color) {
  if (themeColorMeta) themeColorMeta.content = color;
  if (statusBarMeta) statusBarMeta.content = color === "#000000" || color === "#080808" ? "black" : "default";
}

function setShellMetadata(shell) {
  const isBook = shell === "book";
  const isThird = shell === "third";
  document.title = isThird ? "?" : isBook ? "Доктор. Дневник" : "Офиис";
  descriptionMeta.content = isThird ? "Много вопросов" : isBook ? "Может пора начать вести дневник?" : "Разбирайте документы с удовольствием!";
  siteIcon.href = `content/Icons/ico${isThird ? 3 : isBook ? 2 : 1}.ico`;
  setThemeColor(isThird ? "#ffffff" : isBook ? "#000000" : OFFICE_THEME_COLORS[activeCase]);
}

function playChapterSoundtrack(index, shouldPlay = true) {
  bookSoundtrack.src = `content/Soundtrack/${CHAPTER_SOUNDTRACKS[index]}.mp3`;
  bookSoundtrack.volume = 0;
  if (!shouldPlay) bookSoundtrack.pause();
}

function updateMediaSession() {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  const chapter = BOOK_DATA[currentBookChapter];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `Глава ${currentBookChapter + 1}. ${chapter.title}`,
    artist: "Доктор. Дневник",
    album: "Пагуба",
  });
  navigator.mediaSession.playbackState = narration.paused ? "paused" : "playing";
  updateMediaPosition();
}

function updateMediaPosition() {
  if (!("mediaSession" in navigator) || typeof navigator.mediaSession.setPositionState !== "function") return;
  if (!Number.isFinite(narration.duration) || narration.duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: narration.duration,
      playbackRate: narration.playbackRate || 1,
      position: Math.min(narration.currentTime, narration.duration),
    });
  } catch (_) { /* Metadata remains available when position state is unsupported. */ }
}

function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = "none";
  navigator.mediaSession.metadata = null;
}

function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const bind = (action, handler) => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) { /* Browser does not expose this action. */ }
  };
  bind("play", () => narration.play().catch(() => {}));
  bind("pause", () => narration.pause());
  bind("stop", () => narration.pause());
  bind("previoustrack", () => {
    if (currentBookChapter > 0) loadBookChapter(currentBookChapter - 1, true);
    else { narration.currentTime = 0; updateBookProgress(); }
  });
  bind("nexttrack", () => {
    if (currentBookChapter < BOOK_DATA.length - 1) loadBookChapter(currentBookChapter + 1, true);
    else enterThirdPage();
  });
  bind("seekbackward", details => seekNarration(-1, details?.seekOffset >= 15 ? 4300 : 1000));
  bind("seekforward", details => seekNarration(1, details?.seekOffset >= 15 ? 4300 : 1000));
  bind("seekto", details => {
    if (!Number.isFinite(details.seekTime) || !Number.isFinite(narration.duration)) return;
    narration.currentTime = Math.max(0, Math.min(narration.duration, details.seekTime));
    updateBookProgress();
    updateMediaPosition();
  });
}

async function startMusic() {
  if (!officeMusic.paused) return;
  officeMusic.volume = 0;
  try { await officeMusic.play(); fadeMusic(.16, 2200); } catch (_) { /* Begins on the next user gesture. */ }
}

function show404() {
  story.classList.add("show-404");
  notFound.setAttribute("aria-hidden", "false");
  fadeMusic(0, 1800);
  setThemeColor("#000000");
}

function buildCorruptionBars() {
  corruptionBars.innerHTML = Array.from({ length: 22 }, (_, index) => {
    const left = (index * 23.71 + 2.7) % 100;
    const width = 2 + ((index * 7) % 10);
    const opacity = .68 + ((index * 7) % 27) / 100;
    const delay = ((index * 83) % 560) / 1000;
    return `<i style="--bar-left:${left}%;--bar-width:${width}px;--bar-opacity:${opacity};--bar-delay:${delay}s"></i>`;
  }).join("");
}

function showExitStep(step) {
  exitRoute.classList.add("is-open");
  exitRoute.setAttribute("aria-hidden", "false");
  exitRoute.querySelectorAll(".exit-step").forEach(item => { item.hidden = +item.dataset.exitStep !== step; });
}

function closeExitRoute() {
  exitRoute.classList.remove("is-open");
  exitRoute.setAttribute("aria-hidden", "true");
}

function chapterProgressKey(index) {
  return `audiobook-progress-${index + 1}`;
}

function saveChapterProgress() {
  if (!narration.getAttribute("src") || !Number.isFinite(narration.currentTime)) return;
  try { localStorage.setItem(chapterProgressKey(currentBookChapter), String(narration.currentTime)); } catch (_) { /* Optional persistence. */ }
}

function chapterWords(index) {
  return BOOK_DATA[index].text.match(/\S+/g) || [];
}

function timingForChapter(index) {
  const exact = window.WORD_TIMINGS?.[index];
  if (exact?.length) return exact;
  const words = chapterWords(index);
  const duration = narration.duration || 1;
  return words.map((word, wordIndex) => ({ word, start: duration * wordIndex / words.length, end: duration * (wordIndex + 1) / words.length }));
}

function renderBookText(index) {
  let wordIndex = 0;
  let blockIndex = 0;
  const blockSize = window.matchMedia("(max-width: 760px)").matches ? 58 : 105;
  const paragraphs = BOOK_DATA[index].text.split(/\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
  bookText.innerHTML = paragraphs.flatMap((paragraph, paragraphIndex) => {
    const tokens = paragraph.split(/\s+/).filter(Boolean);
    const blocks = [];
    for (let offset = 0; offset < tokens.length; offset += blockSize) {
      const slice = tokens.slice(offset, offset + blockSize);
      const start = wordIndex;
      const words = slice.map((token, tokenIndex) => {
        const clean = token.toLocaleLowerCase("ru").replace(/[^а-яёa-z-]/gi, "");
        const noBreakAfter = /^(а|без|в|во|для|до|за|и|из|к|ко|на|над|не|ни|о|об|от|по|под|при|про|с|со|у|через)$/i.test(clean);
        const separator = tokenIndex < slice.length - 1 ? (noBreakAfter ? "&nbsp;" : " ") : "";
        return `<span class="book-word" data-word-index="${wordIndex++}">${escapeHTML(token)}</span>${separator}`;
      }).join("");
      const paragraphEnd = offset + blockSize >= tokens.length ? " is-paragraph-end" : "";
      blocks.push(`<p class="book-paragraph${paragraphEnd}" data-paragraph="${paragraphIndex}" data-block="${blockIndex++}" data-start="${start}" data-end="${wordIndex - 1}">${words}</p>`);
    }
    return blocks;
  }).join("");
}

function updateBookProgress() {
  const timings = timingForChapter(currentBookChapter);
  if (!timings.length) return;
  let low = 0;
  let high = timings.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (timings[middle].start <= narration.currentTime) low = middle;
    else high = middle - 1;
  }
  const current = low;
  const paragraphs = [...bookText.querySelectorAll(".book-paragraph")];
  const matchedParagraph = paragraphs.findLastIndex(paragraph => +paragraph.dataset.start <= current);
  const currentParagraph = Math.max(0, matchedParagraph);
  const paragraphStart = +paragraphs[currentParagraph]?.dataset.start || 0;
  const previousExpiresAt = (timings[paragraphStart]?.start || 0) + 2;
  paragraphs.forEach((paragraph, index) => {
    paragraph.classList.toggle("is-current", index === currentParagraph);
    paragraph.classList.toggle("is-previous", index === currentParagraph - 1 && narration.currentTime < previousExpiresAt);
    paragraph.classList.toggle("is-gone", index < currentParagraph - 1 || (index === currentParagraph - 1 && narration.currentTime >= previousExpiresAt));
    paragraph.classList.toggle("is-upcoming", index > currentParagraph);
  });

  bookText.querySelectorAll(".book-word").forEach((element, index) => {
    element.classList.remove("is-old");
    element.classList.toggle("is-spoken", index < current);
    element.classList.toggle("is-current", index === current);
  });

  const media = CHAPTER_MEDIA[currentBookChapter];
  const duration = narration.duration || timings.at(-1)?.end || 1;
  let nextMediaIndex = 0;
  media.forEach((cue, index) => {
    const cueTime = cue.at <= 1 ? cue.at * duration : cue.at;
    if (narration.currentTime >= cueTime) nextMediaIndex = index;
  });
  if (nextMediaIndex !== currentMediaIndex) showChapterMedia(nextMediaIndex);

  const introVideo = bookMedia.querySelector("video[data-intro]");
  if (introVideo) {
    const firstWordFinished = current > 0 || narration.currentTime >= (timings[0]?.end || Infinity);
    bookMedia.classList.toggle("is-live", firstWordFinished);
  }
  if (introVideo && narration.currentTime < 10 && Math.abs(introVideo.currentTime - narration.currentTime) > .55) {
    introVideo.currentTime = narration.currentTime;
  }
}

function showChapterMedia(index) {
  currentMediaIndex = index;
  const cue = CHAPTER_MEDIA[currentBookChapter][index];
  const source = cue?.src;
  if (!source) return;
  bookMedia.classList.toggle("is-live", !cue.intro);
  if (/\.mp4$/i.test(source)) {
    bookMedia.innerHTML = `<video src="${source}" muted ${cue.intro ? "data-intro" : "autoplay"} ${cue.loop ? "loop" : ""} playsinline></video>`;
    if (!cue.intro || !narration.paused) bookMedia.querySelector("video")?.play().catch(() => {});
  } else {
    bookMedia.innerHTML = `<img src="${source}" alt="">`;
  }
}

function showChapterIntro(index) {
  clearTimeout(chapterIntroTimer);
  chapterIntro.querySelector(".chapter-intro-number").textContent = index + 1;
  chapterIntro.querySelector(".chapter-intro-title").textContent = BOOK_DATA[index].title;
  chapterIntro.classList.remove("is-visible");
  void chapterIntro.offsetWidth;
  chapterIntro.classList.add("is-visible");
  chapterIntroTimer = window.setTimeout(() => {
    chapterIntro.classList.remove("is-visible");
    narration.play().catch(() => {});
  }, 2700);
}

function loadBookChapter(index, withIntro = true, autoplay = true) {
  const loadToken = ++chapterLoadToken;
  saveChapterProgress();
  currentBookChapter = Math.max(0, Math.min(BOOK_DATA.length - 1, index));
  persistBookLocation();
  currentMediaIndex = -1;
  narration.pause();
  bookMedia.classList.remove("is-live");
  narration.src = `content/AudioPart2/Record${currentBookChapter + 1}.m4a`;
  updateMediaSession();
  renderBookText(currentBookChapter);
  showChapterMedia(0);
  playChapterSoundtrack(currentBookChapter, autoplay);
  narration.addEventListener("loadedmetadata", () => {
    if (loadToken !== chapterLoadToken) return;
    let saved = 0;
    try { saved = Number(localStorage.getItem(chapterProgressKey(currentBookChapter))) || 0; } catch (_) { /* Start at the beginning. */ }
    narration.currentTime = Math.min(saved, Math.max(0, narration.duration - .1));
    updateBookProgress();
    updateMediaSession();
    if (withIntro) showChapterIntro(currentBookChapter);
    else if (autoplay) narration.play().catch(() => {});
  }, { once: true });
}

function enterAudiobook(chapterIndex = 0, withIntro = true, autoplay = true) {
  setStorageValue("audiobook-visited", "1");
  fadeMusic(0, 700);
  setShellMetadata("book");
  audiobook.hidden = false;
  loadBookChapter(chapterIndex, withIntro, autoplay);
}

function leaveAudiobook() {
  chapterLoadToken += 1;
  clearTimeout(chapterIntroTimer);
  chapterIntro.classList.remove("is-visible");
  saveChapterProgress();
  narration.pause();
  fadeAudio(bookSoundtrack, 0, 700);
  clearMediaSession();
  audiobook.hidden = true;
  setShellMetadata("office");
  if (currentBookChapter <= 5) {
    setCase(currentBookChapter);
    startMusic();
  } else {
    show404();
  }
}

function seekNarration(direction, heldFor = 0) {
  if (!Number.isFinite(narration.duration)) return;
  const amount = heldFor > 4200 ? 18 : heldFor > 2200 ? 9 : heldFor > 900 ? 5 : 2.5;
  const target = narration.currentTime + direction * amount;
  if (target < 0 && currentBookChapter > 0) {
    loadBookChapter(currentBookChapter - 1, true);
    return;
  }
  if (target >= narration.duration && currentBookChapter < BOOK_DATA.length - 1) {
    loadBookChapter(currentBookChapter + 1, true);
    return;
  }
  narration.currentTime = Math.max(0, Math.min(narration.duration || Infinity, target));
  updateBookProgress();
}

function bindSeekControl(button, direction) {
  const stop = () => { clearInterval(seekTimer); seekTimer = null; };
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    seekStartedAt = performance.now();
    seekNarration(direction);
    stop();
    seekTimer = setInterval(() => seekNarration(direction, performance.now() - seekStartedAt), 240);
  });
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", stop);
}

document.querySelector(".book-back").addEventListener("click", leaveAudiobook);
document.querySelector(".play-control").addEventListener("click", event => {
  if (narration.paused) narration.play().catch(() => {});
  else narration.pause();
  event.currentTarget.textContent = narration.paused ? "▶" : "Ⅱ";
  event.currentTarget.setAttribute("aria-label", narration.paused ? "Воспроизвести" : "Пауза");
});
bindSeekControl(document.querySelector(".seek-back"), -1);
bindSeekControl(document.querySelector(".seek-forward"), 1);
document.querySelector(".chapter-backward").addEventListener("click", () => {
  if (currentBookChapter > 0) loadBookChapter(currentBookChapter - 1, true);
  else {
    narration.currentTime = 0;
    updateBookProgress();
  }
});
document.querySelector(".chapter-forward").addEventListener("click", () => {
  if (currentBookChapter < BOOK_DATA.length - 1) loadBookChapter(currentBookChapter + 1, true);
  else enterThirdPage();
});
narration.addEventListener("timeupdate", () => { updateBookProgress(); saveChapterProgress(); updateMediaPosition(); });
narration.addEventListener("play", () => {
  document.querySelector(".play-control").textContent = "Ⅱ";
  bookMedia.querySelector("video")?.play().catch(() => {});
  updateMediaSession();
  bookSoundtrack.play().then(() => {
    fadeAudio(bookSoundtrack, BOOK_SOUNDTRACK_VOLUME, 2200);
    updateMediaSession();
  }).catch(() => {});
});
narration.addEventListener("pause", () => {
  document.querySelector(".play-control").textContent = "▶";
  bookMedia.querySelector("video")?.pause();
  bookSoundtrack.pause();
  if (audiobook.hidden || thirdTransitionStarted) clearMediaSession();
  else updateMediaSession();
});
narration.addEventListener("ended", () => {
  if (currentBookChapter < BOOK_DATA.length - 1) loadBookChapter(currentBookChapter + 1, true);
  else enterThirdPage();
});
setupMediaSession();

window.addEventListener("pageshow", () => {
  thirdTransitionStarted = false;
  shellTransition.classList.remove("is-active");
});

document.querySelector(".down-arrow").addEventListener("click", () => {
  if (storageValue("audiobook-visited") === "1") enterAudiobook(activeCase);
  else showExitStep(1);
});
exitRoute.querySelectorAll(".exit-return, .last-return").forEach(button => button.addEventListener("click", closeExitRoute));
exitRoute.querySelector('[data-exit-step="1"] .exit-next').addEventListener("click", () => showExitStep(2));
exitRoute.querySelector('[data-exit-step="2"] .exit-next').addEventListener("click", () => showExitStep(3));
exitRoute.querySelector(".go-home").addEventListener("click", () => {
  closeExitRoute();
  enterAudiobook(activeCase);
});

buildCorruptionBars();

returnHome.addEventListener("click", () => {
  hasReturned = true;
  setShellMetadata("office");
  story.classList.remove("show-404");
  notFound.setAttribute("aria-hidden", "true");
  document.querySelector(".down-arrow").innerHTML = `<span>↓</span><span class="return-note">эта стрелочка всегда тут была?</span>`;
  setCase(0);
  startMusic();
});

if (storageValue("office-instruction-seen") === "1") instruction.hidden = true;
instructionStart.addEventListener("click", () => {
  setStorageValue("office-instruction-seen", "1");
  instruction.classList.add("is-closing");
  window.setTimeout(() => { instruction.hidden = true; }, 420);
  startMusic();
});

document.addEventListener("pointerdown", () => {
  if (instruction.hidden && audiobook.hidden && !hasReturned) startMusic();
}, { once: true });

prev.addEventListener("click", () => setCase(activeCase - 1));
next.addEventListener("click", () => setCase(activeCase + 1));
let resizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    setCase(activeCase, audiobook.hidden);
    if (!isAnimating) track.querySelectorAll(".case-canvas").forEach(renderCanvas);
  }, 80);
});
window.addEventListener("keydown", event => {
  if (!audiobook.hidden || !instruction.hidden || exitRoute.classList.contains("is-open") || story.classList.contains("show-404")) return;
  if (event.key === "ArrowLeft") prev.click();
  if (event.key === "ArrowRight") next.click();
});
const restoredExperience = readExperience();
const restoredCase = Number.isInteger(restoredExperience.activeCase) ? restoredExperience.activeCase : 0;
setCase(restoredCase, false);
if (restoredExperience.shell === "book" && storageValue("audiobook-visited") === "1") {
  instruction.hidden = true;
  const restoredChapter = Number.isInteger(restoredExperience.bookChapter) ? restoredExperience.bookChapter : restoredCase;
  enterAudiobook(restoredChapter, false, false);
}
