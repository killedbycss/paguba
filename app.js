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
const siteIcon = document.querySelector("#siteIcon");
let currentBookChapter = 0;
let currentMediaIndex = -1;
let seekTimer;
let seekStartedAt = 0;
let chapterIntroTimer;
let chapterLoadToken = 0;
let thirdTransitionStarted = false;

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
  return `<article class="document is-active" data-doc="${docIndex}" ${label ? `data-label="${label}"` : ""} aria-label="Документ ${docIndex + 1}">${paragraphs}</article>`;
}

function thumbMarkup(canvas, docIndex, label) {
  const text = documentText(+canvas.dataset.case, docIndex);
  const preview = escapeHTML(text);
  return `<button class="paper-thumb" type="button" data-doc="${docIndex}" ${label ? `data-label="${label}"` : ""} aria-label="Открыть документ ${docIndex + 1}">${preview}</button>`;
}

function captureSheets(canvas) {
  return new Map([...canvas.querySelectorAll("[data-doc]")].map(element => [
    element.dataset.doc,
    { element, rect: element.getBoundingClientRect(), style: getComputedStyle(element) },
  ]));
}

function animateReflow(canvas, mutate) {
  if (isAnimating) return;
  isAnimating = true;
  const before = captureSheets(canvas);
  mutate();
  renderCanvas(canvas);
  const after = captureSheets(canvas);
  const clones = [];

  before.forEach((start, key) => {
    const finish = after.get(key);
    if (!finish) return;
    const clone = start.element.cloneNode(true);
    clone.className = "flying-sheet";
    Object.assign(clone.style, {
      left: `${start.rect.left}px`, top: `${start.rect.top}px`, width: `${start.rect.width}px`, height: `${start.rect.height}px`,
      padding: start.style.padding, fontSize: start.style.fontSize, lineHeight: start.style.lineHeight,
      backgroundColor: start.style.backgroundColor, color: start.style.color,
    });
    document.body.append(clone);
    finish.element.style.visibility = "hidden";
    clones.push({ clone, finish });
  });

  requestAnimationFrame(() => requestAnimationFrame(() => clones.forEach(({ clone, finish }) => {
    const end = finish.rect;
    Object.assign(clone.style, {
      left: `${end.left}px`, top: `${end.top}px`, width: `${end.width}px`, height: `${end.height}px`,
      padding: finish.style.padding, fontSize: finish.style.fontSize, lineHeight: finish.style.lineHeight,
      backgroundColor: finish.style.backgroundColor, color: finish.style.color,
    });
  })));

  window.setTimeout(() => {
    clones.forEach(({ clone, finish }) => { clone.remove(); finish.element.style.visibility = ""; });
    isAnimating = false;
  }, 760);
}

function renderCanvas(canvas) {
  const state = getState(canvas);
  const count = CASES[+canvas.dataset.case].documents.length;
  const all = Array.from({ length: count }, (_, index) => index);
  const pending = all.filter(index => index !== state.active && !state.labels[index]);
  const sorted = all.filter(index => index !== state.active && state.labels[index]);
  const stage = canvas.querySelector(".document-stage");

  stage.innerHTML = state.active === null ? `<p class="all-sorted">Все материалы отсортированы.<br>Выберите лист справа, чтобы вернуться к нему.</p>` : documentMarkup(canvas, state.active);
  canvas.querySelector(".pending-thumbs").innerHTML = pending.map(index => thumbMarkup(canvas, index)).join("");
  canvas.querySelector(".sorted-thumbs").innerHTML = sorted.map(index => thumbMarkup(canvas, index, state.labels[index])).join("");
  canvas.querySelectorAll(".label-button").forEach(button => {
    button.disabled = state.active === null;
    button.classList.toggle("is-selected", state.active !== null && button.dataset.label === state.labels[state.active]);
  });
}

function exchangeDocument(canvas, targetIndex) {
  const state = getState(canvas);
  if (targetIndex === state.active) return;
  playPaperSound();
  animateReflow(canvas, () => {
    state.active = targetIndex;
  });
}

function sortActive(canvas, label) {
  const state = getState(canvas);
  if (state.active === null) return;
  playPaperSound();
  animateReflow(canvas, () => {
    state.labels[state.active] = label;
    const nextPending = CASES[+canvas.dataset.case].documents.findIndex((_, index) => index !== state.active && !state.labels[index]);
    state.active = nextPending === -1 ? null : nextPending;
  });
  window.setTimeout(() => setCase(activeCase), 780);
}

track.querySelectorAll(".case-canvas").forEach(canvas => {
  renderCanvas(canvas);
  canvas.addEventListener("click", event => {
    const label = event.target.closest(".label-button");
    const thumb = event.target.closest(".paper-thumb");
    if (label) sortActive(canvas, label.dataset.label);
    else if (thumb) exchangeDocument(canvas, +thumb.dataset.doc);
  });
});

function setCase(index) {
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
  if (!officeMusic.paused) fadeMusic([.16, .15, .13, .11, .08, .055][activeCase], 1100);
}

function fadeMusic(target, duration = 1400) {
  const start = officeMusic.volume;
  const started = performance.now();
  const tick = now => {
    const progress = Math.min(1, (now - started) / duration);
    officeMusic.volume = start + (target - start) * progress;
    if (progress < 1) requestAnimationFrame(tick);
    else if (target === 0) officeMusic.pause();
  };
  requestAnimationFrame(tick);
}

function fadeAudio(audio, target, duration = 900) {
  const start = audio.volume;
  const started = performance.now();
  const tick = now => {
    const progress = Math.min(1, (now - started) / duration);
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

function setShellMetadata(shell) {
  const isBook = shell === "book";
  const isThird = shell === "third";
  document.title = isThird ? "?" : isBook ? "Доктор. Дневник" : "Офиис";
  descriptionMeta.content = isThird ? "Много вопросов" : isBook ? "Может пора начать вести дневник?" : "Разбирайте документы с удовольствием!";
  siteIcon.href = `content/Icons/ico${isThird ? 3 : isBook ? 2 : 1}.ico`;
}

function playChapterSoundtrack(index) {
  bookSoundtrack.src = `content/Soundtrack/${CHAPTER_SOUNDTRACKS[index]}.mp3`;
  bookSoundtrack.volume = 0;
  bookSoundtrack.play().then(() => fadeAudio(bookSoundtrack, .045, 1800)).catch(() => {});
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
  if (!Number.isFinite(narration.currentTime)) return;
  localStorage.setItem(chapterProgressKey(currentBookChapter), String(narration.currentTime));
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

function loadBookChapter(index, withIntro = true) {
  const loadToken = ++chapterLoadToken;
  saveChapterProgress();
  currentBookChapter = Math.max(0, Math.min(BOOK_DATA.length - 1, index));
  currentMediaIndex = -1;
  narration.pause();
  bookMedia.classList.remove("is-live");
  narration.src = `content/AudioPart2/Record${currentBookChapter + 1}.m4a`;
  renderBookText(currentBookChapter);
  showChapterMedia(0);
  playChapterSoundtrack(currentBookChapter);
  narration.addEventListener("loadedmetadata", () => {
    if (loadToken !== chapterLoadToken) return;
    const saved = Number(localStorage.getItem(chapterProgressKey(currentBookChapter))) || 0;
    narration.currentTime = Math.min(saved, Math.max(0, narration.duration - .1));
    updateBookProgress();
    if (withIntro) showChapterIntro(currentBookChapter);
    else narration.play().catch(() => {});
  }, { once: true });
}

function enterAudiobook(chapterIndex = 0) {
  localStorage.setItem("audiobook-visited", "1");
  fadeMusic(0, 700);
  setShellMetadata("book");
  audiobook.hidden = false;
  loadBookChapter(chapterIndex, true);
}

function leaveAudiobook() {
  chapterLoadToken += 1;
  clearTimeout(chapterIntroTimer);
  chapterIntro.classList.remove("is-visible");
  saveChapterProgress();
  narration.pause();
  fadeAudio(bookSoundtrack, 0, 700);
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
narration.addEventListener("timeupdate", () => { updateBookProgress(); saveChapterProgress(); });
narration.addEventListener("play", () => {
  document.querySelector(".play-control").textContent = "Ⅱ";
  bookMedia.querySelector("video")?.play().catch(() => {});
  bookSoundtrack.play().catch(() => {});
});
narration.addEventListener("pause", () => {
  document.querySelector(".play-control").textContent = "▶";
  bookMedia.querySelector("video")?.pause();
  bookSoundtrack.pause();
});
narration.addEventListener("ended", () => {
  if (currentBookChapter < BOOK_DATA.length - 1) loadBookChapter(currentBookChapter + 1, true);
  else enterThirdPage();
});

window.addEventListener("pageshow", () => {
  thirdTransitionStarted = false;
  shellTransition.classList.remove("is-active");
});

document.querySelector(".down-arrow").addEventListener("click", () => {
  if (localStorage.getItem("audiobook-visited") === "1") enterAudiobook(activeCase);
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

if (localStorage.getItem("office-instruction-seen") === "1") instruction.hidden = true;
instructionStart.addEventListener("click", () => {
  localStorage.setItem("office-instruction-seen", "1");
  instruction.classList.add("is-closing");
  window.setTimeout(() => { instruction.hidden = true; }, 420);
  startMusic();
});

document.addEventListener("pointerdown", () => {
  if (instruction.hidden && !hasReturned) startMusic();
}, { once: true });

prev.addEventListener("click", () => setCase(activeCase - 1));
next.addEventListener("click", () => setCase(activeCase + 1));
window.addEventListener("resize", () => setCase(activeCase));
window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") prev.click();
  if (event.key === "ArrowRight") next.click();
});
setCase(0);
