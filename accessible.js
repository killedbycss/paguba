(() => {
  const audioSources = [
    "content/AudioPart2/Record1-trimmed.m4a",
    "content/AudioPart2/Record2-trimmed.m4a",
    "content/AudioPart2/Record3-trimmed.m4a",
    "content/AudioPart2/Record4-trimmed.m4a",
    "content/AudioPart2/Record5-trimmed.m4a",
    "content/AudioPart2/Record6-corrected.m4a",
    "content/AudioPart2/Record7-trimmed.m4a",
    "content/AudioPart2/Record8.m4a",
  ];
  const select = document.querySelector("#chapterSelect");
  const previous = document.querySelector("#previousChapter");
  const next = document.querySelector("#nextChapter");
  const title = document.querySelector("#chapterTitle");
  const text = document.querySelector("#chapterText");
  const narration = document.querySelector("#accessibleNarration");
  const status = document.querySelector("#chapterStatus");
  let icon = document.querySelector("#accessibleIcon");
  let chapterIndex = Math.max(0, Math.min(BOOK_DATA.length - 1, Number(location.hash.match(/chapter-(\d+)/)?.[1] || 1) - 1));
  let readingSize = 1.2;

  select.innerHTML = BOOK_DATA.map((chapter, index) => `<option value="${index}">Глава ${index + 1}. ${chapter.title}</option>`).join("");

  function updateIcon() {
    const replacement = icon.cloneNode();
    replacement.href = `content/Icons/chapters/chapter-${chapterIndex + 1}.png`;
    icon.replaceWith(replacement);
    icon = replacement;
  }

  function renderChapter(announce = false) {
    const chapter = BOOK_DATA[chapterIndex];
    const heading = `Глава ${chapterIndex + 1}. ${chapter.title}`;
    narration.pause();
    narration.src = audioSources[chapterIndex];
    narration.load();
    select.value = String(chapterIndex);
    title.textContent = heading;
    text.replaceChildren(...chapter.text.split(/\n+/).map(paragraph => {
      const element = document.createElement("p");
      element.textContent = paragraph.trim();
      return element;
    }).filter(paragraph => paragraph.textContent));
    previous.disabled = chapterIndex === 0;
    next.disabled = chapterIndex === BOOK_DATA.length - 1;
    history.replaceState(null, "", `#chapter-${chapterIndex + 1}`);
    document.title = `${heading} — доступная версия`;
    updateIcon();
    if (announce) status.textContent = `Открыта ${heading}`;
  }

  function changeChapter(nextIndex) {
    chapterIndex = Math.max(0, Math.min(BOOK_DATA.length - 1, nextIndex));
    renderChapter(true);
    title.focus({ preventScroll: true });
    title.scrollIntoView({ block: "start" });
  }

  previous.addEventListener("click", () => changeChapter(chapterIndex - 1));
  next.addEventListener("click", () => changeChapter(chapterIndex + 1));
  select.addEventListener("change", () => changeChapter(Number(select.value)));
  document.querySelector("#increaseText").addEventListener("click", () => {
    readingSize = Math.min(2.2, readingSize + .15);
    document.documentElement.style.setProperty("--reading-size", `${readingSize}rem`);
    status.textContent = `Размер текста увеличен до ${Math.round(readingSize * 100)} процентов`;
  });
  document.querySelector("#decreaseText").addEventListener("click", () => {
    readingSize = Math.max(.9, readingSize - .15);
    document.documentElement.style.setProperty("--reading-size", `${readingSize}rem`);
    status.textContent = `Размер текста уменьшен до ${Math.round(readingSize * 100)} процентов`;
  });
  document.querySelector("#toggleContrast").addEventListener("click", event => {
    const enabled = document.body.classList.toggle("high-contrast");
    event.currentTarget.setAttribute("aria-pressed", String(enabled));
    event.currentTarget.textContent = enabled ? "Обычная контрастность" : "Высокая контрастность";
    status.textContent = enabled ? "Высокая контрастность включена" : "Высокая контрастность выключена";
  });
  window.addEventListener("hashchange", () => {
    const requested = Number(location.hash.match(/chapter-(\d+)/)?.[1]);
    if (requested && requested - 1 !== chapterIndex) changeChapter(requested - 1);
  });

  renderChapter();
})();
