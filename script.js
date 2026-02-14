// ===== State =====
let currentStyle = "borderless";
let currentInk = "#d85c52";
let uploadedFontCount = 0;

const card = document.getElementById("card");
const fontBodySelect = document.getElementById("opt-font-body");
const fontUploadInput = document.getElementById("opt-font-upload");
const imageUploadInput = document.getElementById("opt-image-upload");
const imageClearBtn = document.getElementById("opt-image-clear");
const imageSizeSlider = document.getElementById("opt-image-size");
const imageSizeLabel = document.getElementById("image-size-label");
const imageLayer = document.getElementById("card-image-layer");
const cardImage = document.getElementById("card-image");

const imageState = {
  src: "",
  x: 50,
  y: 50,
  size: 28,
  aspectRatio: 1,
};

const dragState = {
  active: false,
  offsetX: 0,
  offsetY: 0,
};

// ===== Shared helpers =====
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addFontOption(select, value, label) {
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (exists) return;

  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function readableFontName(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyBodyFont(fontFamily) {
  card.style.fontFamily = fontFamily;
  document
    .querySelectorAll(
      ".bubble, .bubble-input, .card-text, .handwritten-input, .side-fields input"
    )
    .forEach((el) => {
      el.style.fontFamily = fontFamily;
    });
}

function updateImageSizeLabel() {
  imageSizeLabel.textContent = `${Math.round(imageState.size)}%`;
}

// ===== Bubble Selection =====
document.querySelectorAll(".bubble").forEach((bubble) => {
  bubble.addEventListener("click", () => {
    const group = bubble.dataset.group;
    document.querySelectorAll(`.bubble[data-group="${group}"]`).forEach((b) => {
      b.classList.remove("selected");
    });
    bubble.classList.toggle("selected");

    const groupParent = bubble.closest(".bubble-group");
    if (groupParent) {
      const customInput = groupParent.querySelector(".bubble-input");
      if (customInput) {
        customInput.value = "";
        customInput.classList.remove("has-value");
      }
    }
  });
});

// ===== Custom bubble input =====
document.querySelectorAll(".bubble-input").forEach((input) => {
  input.addEventListener("input", () => {
    const group = input.dataset.group;
    if (input.value.trim()) {
      input.classList.add("has-value");
      document.querySelectorAll(`.bubble[data-group="${group}"]`).forEach((b) => {
        b.classList.remove("selected");
      });
    } else {
      input.classList.remove("has-value");
    }
  });
});

// ===== Reset =====
document.getElementById("btn-reset").addEventListener("click", () => {
  document.querySelectorAll(".bubble.selected").forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll('input[type="text"]').forEach((i) => {
    i.value = "";
    i.classList.remove("has-value");
  });
  clearCardImage();
  imageSizeSlider.value = "0.28";
  imageState.size = 28;
  updateImageSizeLabel();
  spacingSlider.value = spacingSlider.defaultValue;
  fontSizeSlider.value = fontSizeSlider.defaultValue;
  applySpacingScale(parseFloat(spacingSlider.value));
  applyFontScale(parseFloat(fontSizeSlider.value));
});

// ===== Style Switcher =====
document.querySelectorAll(".style-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".style-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStyle = btn.dataset.style;

    document.body.classList.remove("vintage", "borderless");
    if (currentStyle === "vintage") {
      document.body.classList.add("vintage");
    } else if (currentStyle === "borderless") {
      document.body.classList.add("borderless");
    }
  });
});

// ===== Font pickers =====
fontBodySelect.addEventListener("change", (event) => {
  applyBodyFont(event.target.value);
});

fontUploadInput.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof FontFace === "undefined") {
    window.alert("This browser does not support loading local fonts.");
    return;
  }

  uploadedFontCount += 1;
  const displayName = readableFontName(file.name) || "Custom Font";
  const family = `${displayName} ${uploadedFontCount}`;
  const value = `'${family}'`;
  const sourceUrl = URL.createObjectURL(file);

  try {
    const font = new FontFace(family, `url(${sourceUrl})`);
    await font.load();
    document.fonts.add(font);

    addFontOption(fontBodySelect, value, `${displayName} (uploaded)`);

    fontBodySelect.value = value;
    applyBodyFont(value);
  } catch (error) {
    console.error(error);
    window.alert("Could not load that font file. Try a .otf, .ttf, .woff, or .woff2 file.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
    fontUploadInput.value = "";
  }
});

// ===== Ink Color =====
function setInkColor(color) {
  currentInk = color;
  document.documentElement.style.setProperty("--ink-color", color);

  document.querySelectorAll(".ink-swatch").forEach((swatch) => {
    swatch.classList.remove("active");
  });

  const matchingSwatch = document.querySelector(`.ink-swatch[data-color="${color}"]`);
  if (matchingSwatch) matchingSwatch.classList.add("active");
}

document.querySelectorAll(".ink-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    setInkColor(swatch.dataset.color);
    document.getElementById("ink-custom").value = swatch.dataset.color;
  });
});

document.getElementById("ink-custom").addEventListener("input", (event) => {
  document.querySelectorAll(".ink-swatch").forEach((swatch) => {
    swatch.classList.remove("active");
  });
  setInkColor(event.target.value);
});

// ===== Card image =====
function renderCardImage() {
  if (!imageState.src) {
    imageLayer.classList.remove("has-image");
    cardImage.removeAttribute("src");
    return;
  }

  const rect = card.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  let widthPx = (imageState.size / 100) * rect.width;
  let heightPx = widthPx / imageState.aspectRatio;

  const maxHeight = rect.height * 0.9;
  if (heightPx > maxHeight) {
    heightPx = maxHeight;
    widthPx = heightPx * imageState.aspectRatio;
    imageState.size = (widthPx / rect.width) * 100;
  }

  const halfWidthPct = (widthPx / 2 / rect.width) * 100;
  const halfHeightPct = (heightPx / 2 / rect.height) * 100;

  imageState.x = clamp(imageState.x, halfWidthPct, 100 - halfWidthPct);
  imageState.y = clamp(imageState.y, halfHeightPct, 100 - halfHeightPct);

  imageLayer.classList.add("has-image");
  cardImage.style.width = `${imageState.size}%`;
  cardImage.style.left = `${imageState.x}%`;
  cardImage.style.top = `${imageState.y}%`;
  updateImageSizeLabel();
}

function clearCardImage() {
  imageState.src = "";
  imageState.x = 50;
  imageState.y = 50;
  imageState.aspectRatio = 1;
  imageLayer.classList.remove("has-image");
  cardImage.classList.remove("dragging");
  cardImage.removeAttribute("src");
  imageUploadInput.value = "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

imageUploadInput.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    imageState.src = dataUrl;
    imageState.x = 50;
    imageState.y = 50;
    cardImage.src = dataUrl;
  } catch (error) {
    console.error(error);
    window.alert("Could not load that image file.");
  } finally {
    imageUploadInput.value = "";
  }
});

imageClearBtn.addEventListener("click", clearCardImage);

imageSizeSlider.addEventListener("input", (event) => {
  imageState.size = clamp(parseFloat(event.target.value) * 100, 12, 80);
  renderCardImage();
});

cardImage.addEventListener("load", () => {
  if (!cardImage.naturalWidth || !cardImage.naturalHeight) return;
  imageState.aspectRatio = cardImage.naturalWidth / cardImage.naturalHeight;
  renderCardImage();
});

cardImage.addEventListener("pointerdown", (event) => {
  if (!imageState.src) return;

  event.preventDefault();

  const rect = card.getBoundingClientRect();
  const centerX = rect.left + (imageState.x / 100) * rect.width;
  const centerY = rect.top + (imageState.y / 100) * rect.height;

  dragState.active = true;
  dragState.offsetX = event.clientX - centerX;
  dragState.offsetY = event.clientY - centerY;

  cardImage.classList.add("dragging");
  cardImage.setPointerCapture(event.pointerId);
});

cardImage.addEventListener("pointermove", (event) => {
  if (!dragState.active) return;

  const rect = card.getBoundingClientRect();
  const centerX = event.clientX - dragState.offsetX;
  const centerY = event.clientY - dragState.offsetY;

  imageState.x = ((centerX - rect.left) / rect.width) * 100;
  imageState.y = ((centerY - rect.top) / rect.height) * 100;
  renderCardImage();
});

function stopImageDrag(event) {
  if (!dragState.active) return;

  dragState.active = false;
  cardImage.classList.remove("dragging");

  if (event && cardImage.hasPointerCapture(event.pointerId)) {
    cardImage.releasePointerCapture(event.pointerId);
  }
}

cardImage.addEventListener("pointerup", stopImageDrag);
cardImage.addEventListener("pointercancel", stopImageDrag);
cardImage.addEventListener("lostpointercapture", stopImageDrag);

window.addEventListener("resize", renderCardImage);

// ===== Customizer: Spacing =====
const spacingSlider = document.getElementById("opt-spacing");
const spacingLabel = document.getElementById("spacing-label");

function applySpacingScale(value) {
  const min = parseFloat(spacingSlider.min);
  const max = parseFloat(spacingSlider.max);
  const scale = clamp(value, min, max);

  card.style.gap = `${(0.85 * scale).toFixed(3)}rem`;
  card.style.padding = `${(1.5 * scale).toFixed(3)}rem ${(1.75 * scale).toFixed(3)}rem`;
  spacingLabel.textContent = `${Math.round(scale * 100)}%`;
}

spacingSlider.addEventListener("input", (event) => {
  applySpacingScale(parseFloat(event.target.value));
});

// ===== Customizer: Font size =====
const fontSizeSlider = document.getElementById("opt-font-size");
const fontSizeLabel = document.getElementById("font-size-label");

function applyFontScale(value) {
  const min = parseFloat(fontSizeSlider.min);
  const max = parseFloat(fontSizeSlider.max);
  const scale = clamp(value, min, max);

  card.style.fontSize = "";
  card.style.setProperty("--card-font-scale", scale.toFixed(3));
  fontSizeLabel.textContent = `${Math.round(scale * 100)}%`;
}

fontSizeSlider.addEventListener("input", (event) => {
  applyFontScale(parseFloat(event.target.value));
});

// ===== Print =====
document.getElementById("btn-print").addEventListener("click", () => {
  buildPrintSheet();
  window.print();
});

function cloneCardForPrint() {
  const clone = card.cloneNode(true);
  clone.classList.add("print-card");

  clone.querySelectorAll(".bubble.selected").forEach((bubble) => {
    bubble.classList.remove("selected");
  });
  clone.querySelectorAll(".bubble-input.has-value").forEach((input) => {
    input.classList.remove("has-value");
  });

  const sourceTextInputs = card.querySelectorAll('input[type="text"]');
  const cloneTextInputs = clone.querySelectorAll('input[type="text"]');
  sourceTextInputs.forEach((sourceInput, index) => {
    const cloneInput = cloneTextInputs[index];
    if (!cloneInput) return;
    cloneInput.value = sourceInput.value;
    const shouldKeepActiveInputStyle =
      !cloneInput.classList.contains("bubble-input") &&
      sourceInput.classList.contains("has-value");
    cloneInput.classList.toggle("has-value", shouldKeepActiveInputStyle);
  });

  return clone;
}

// ===== Build print-ready layout — 4 cards per page =====
function buildPrintSheet() {
  const sheet = document.getElementById("print-sheet");
  sheet.innerHTML = "";

  for (let i = 0; i < 4; i += 1) {
    const slot = document.createElement("div");
    slot.className = "print-card-slot";
    slot.appendChild(cloneCardForPrint());
    sheet.appendChild(slot);
  }
}

// ===== Initial setup =====
applyBodyFont(fontBodySelect.value);
imageState.size = parseFloat(imageSizeSlider.value) * 100;
updateImageSizeLabel();
applySpacingScale(parseFloat(spacingSlider.value));
applyFontScale(parseFloat(fontSizeSlider.value));
