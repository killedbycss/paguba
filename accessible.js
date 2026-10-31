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
  const selectionTools = document.querySelector("#selectionTools");
  const copySelectionLink = document.querySelector("#copySelectionLink");
  let icon = document.querySelector("#accessibleIcon");
  const initialParams = new URLSearchParams(location.search);
  const requestedChapter = Number(initialParams.get("chapter") || location.hash.match(/chapter-(\d+)/)?.[1] || 1);
  let chapterIndex = Math.max(0, Math.min(BOOK_DATA.length - 1, requestedChapter - 1));
  let readingSize = 1.2;
  let selectedText = "";

  select.innerHTML = BOOK_DATA.map((chapter, index) => `<option value="${index}">Глава ${index + 1}. ${chapter.title}</option>`).join("");

  function updateIcon() {
    const replacement = icon.cloneNode();
    replacement.href = `content/Icons/chapters/chapter-${chapterIndex + 1}.png`;
    icon.replaceWith(replacement);
    icon = replacement;
  }

  function revealQuotedText(quote) {
    if (!quote) return;
    const normalizedQuote = quote.replace(/\s+/g, " ").trim();
    for (const paragraph of text.querySelectorAll("p")) {
      const normalizedParagraph = paragraph.textContent.replace(/\s+/g, " ");
      const start = normalizedParagraph.indexOf(normalizedQuote);
      if (start < 0) continue;
      const before = paragraph.textContent.slice(0, start);
      const match = paragraph.textContent.slice(start, start + normalizedQuote.length);
      const after = paragraph.textContent.slice(start + normalizedQuote.length);
      const mark = document.createElement("mark");
      mark.id = "quote";
      mark.textContent = match;
      paragraph.replaceChildren(before, mark, after);
      requestAnimationFrame(() => mark.scrollIntoView({ block: "center" }));
      return;
    }
  }

  function renderChapter(announce = false, preserveQuote = false) {
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
    if (preserveQuote) revealQuotedText(initialParams.get("quote"));
    else history.replaceState(null, "", `${location.pathname}#chapter-${chapterIndex + 1}`);
    document.title = `${heading} — Пагуба`;
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
  document.querySelectorAll("[data-vision]").forEach(button => button.addEventListener("click", () => {
    const mode = button.dataset.vision;
    document.body.dataset.vision = mode;
    localStorage.setItem("paguba-vision-mode", mode);
    document.querySelectorAll("[data-vision]").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    status.textContent = `Включён режим зрения: ${button.textContent}`;
  }));

  document.addEventListener("selectionchange", () => {
    const selection = getSelection();
    const anchor = selection?.anchorNode;
    const focus = selection?.focusNode;
    const insideText = anchor && focus && text.contains(anchor) && text.contains(focus);
    selectedText = insideText ? selection.toString().replace(/\s+/g, " ").trim().slice(0, 600) : "";
    selectionTools.hidden = selectedText.length < 2;
  });

  copySelectionLink.addEventListener("click", async () => {
    const url = new URL(location.pathname, location.href);
    url.searchParams.set("chapter", String(chapterIndex + 1));
    url.searchParams.set("quote", selectedText);
    url.hash = "quote";
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = "Ссылка на выбранный фрагмент скопирована";
      copySelectionLink.textContent = "Ссылка скопирована";
      setTimeout(() => { copySelectionLink.textContent = "Скопировать ссылку на фрагмент"; }, 1800);
    } catch {
      status.textContent = "Не удалось скопировать ссылку";
    }
  });
  window.addEventListener("hashchange", () => {
    const requested = Number(location.hash.match(/chapter-(\d+)/)?.[1]);
    if (requested && requested - 1 !== chapterIndex) changeChapter(requested - 1);
  });

  const savedVision = localStorage.getItem("paguba-vision-mode") || "light";
  const visionButton = document.querySelector(`[data-vision="${savedVision}"]`) || document.querySelector('[data-vision="light"]');
  visionButton.click();
  renderChapter(false, Boolean(initialParams.get("quote")));
})();
