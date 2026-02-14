// ===== State =====
let currentStyle = "modern"; // 'modern' | 'vintage'
let currentInk = "#2c2420";

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
      if (customInput && bubble !== customInput) {
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
      document
        .querySelectorAll(`.bubble[data-group="${group}"]`)
        .forEach((b) => {
          b.classList.remove("selected");
        });
    } else {
      input.classList.remove("has-value");
    }
  });
});

// ===== Reset =====
document.getElementById("btn-reset").addEventListener("click", () => {
  document
    .querySelectorAll(".bubble.selected")
    .forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll('input[type="text"]').forEach((i) => {
    i.value = "";
    i.classList.remove("has-value");
  });
});

// ===== Style Switcher =====
document.querySelectorAll(".style-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".style-btn")
      .forEach((b) => b.classList.remove("active"));
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

// ===== Customizer Toggle =====
const toggleBtn = document.getElementById("customizer-toggle");
const panel = document.getElementById("customizer-panel");

toggleBtn.addEventListener("click", () => {
  const isOpen = panel.classList.toggle("open");
  toggleBtn.classList.toggle("open", isOpen);
  toggleBtn.textContent = isOpen ? "Hide Style Options" : "Customize Style";
});

// ===== Customizer: Font pickers =====
const card = document.getElementById("card");

document.getElementById("opt-font-body").addEventListener("change", (e) => {
  card.style.fontFamily = e.target.value;
  document.querySelectorAll(".bubble").forEach((b) => {
    b.style.fontFamily = e.target.value;
  });
  document.querySelectorAll(".card-text").forEach((t) => {
    t.style.fontFamily = e.target.value;
  });
});

document.getElementById("opt-font-hand").addEventListener("change", (e) => {
  document
    .querySelectorAll(".handwritten-input, .side-fields input")
    .forEach((el) => {
      el.style.fontFamily = e.target.value;
    });
  card.dataset.fontHand = e.target.value;
});

// ===== Ink Color =====
function setInkColor(color) {
  currentInk = color;
  document.documentElement.style.setProperty("--ink-color", color);

  // Update swatch active states
  document
    .querySelectorAll(".ink-swatch")
    .forEach((s) => s.classList.remove("active"));
  const match = document.querySelector(`.ink-swatch[data-color="${color}"]`);
  if (match) match.classList.add("active");
}

document.querySelectorAll(".ink-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    setInkColor(swatch.dataset.color);
    document.getElementById("ink-custom").value = swatch.dataset.color;
  });
});

document.getElementById("ink-custom").addEventListener("input", (e) => {
  document
    .querySelectorAll(".ink-swatch")
    .forEach((s) => s.classList.remove("active"));
  setInkColor(e.target.value);
});

// ===== Customizer: Spacing =====
const spacingSlider = document.getElementById("opt-spacing");
const spacingLabel = document.getElementById("spacing-label");
const spacingLabels = {
  0.5: "Tight",
  0.6: "Tight",
  0.7: "Compact",
  0.8: "Compact",
  0.9: "Snug",
  1: "Normal",
  1.1: "Relaxed",
  1.2: "Relaxed",
  1.3: "Roomy",
  1.4: "Roomy",
  1.5: "Spacious",
};

spacingSlider.addEventListener("input", (e) => {
  const v = parseFloat(e.target.value);
  card.style.gap = 0.85 * v + "rem";
  card.style.padding = 1.5 * v + "rem " + 1.75 * v + "rem";
  spacingLabel.textContent = spacingLabels[e.target.value] || "Normal";
});

// ===== Customizer: Font size =====
const fontSizeSlider = document.getElementById("opt-font-size");
const fontSizeLabel = document.getElementById("font-size-label");
const fontSizeLabels = {
  0.8: "Small",
  0.85: "Small",
  0.9: "Compact",
  0.95: "Compact",
  1: "Normal",
  1.05: "Medium",
  1.1: "Medium",
  1.15: "Large",
  1.2: "Large",
  1.25: "XL",
  1.3: "XL",
};

fontSizeSlider.addEventListener("input", (e) => {
  const v = parseFloat(e.target.value);
  card.style.fontSize = v + "rem";
  fontSizeLabel.textContent = fontSizeLabels[e.target.value] || "Normal";
});

// ===== Print =====
document.getElementById("btn-print").addEventListener("click", () => {
  buildPrintSheet();
  window.print();
});

// ===== Build print-ready layout — 6 blank cards per page =====
function buildPrintSheet() {
  const sheet = document.getElementById("print-sheet");
  sheet.innerHTML = "";

  const fontBody = document.getElementById("opt-font-body").value;
  const fontHand = card.dataset.fontHand || "'Caveat', cursive";
  const isVintage = currentStyle === "vintage";

  for (let i = 0; i < 6; i++) {
    sheet.appendChild(createPrintCard(fontBody, fontHand, isVintage));
  }
}

function createPrintCard(fontBody, fontHand, isVintage) {
  const el = document.createElement("div");
  let cls = "print-card";
  if (isVintage) cls += " pc-vintage";
  else if (currentStyle === "borderless") cls += " pc-borderless";
  el.className = cls;
  el.style.fontFamily = fontBody;
  el.style.color = currentInk;

  const greetings = ["Hi", "Hey", "Hello", "Um"];
  const intros = ["My name is", "My friend's name is"];
  const qualities = [
    "look",
    "wit",
    "outfit",
    "height",
    "laugh",
    "energy",
    "smile",
    "kindness",
    "friend",
    "presence",
  ];
  const adjectives = ["is hard to ignore.", "is intriguing.", "caught my eye."];
  const whens = ["soon.", "one day."];
  const contacts = ["Phone", "@", "Email"];

  const bub = (text) => `<span class="pc-bubble">${text}</span>`;
  const blank = (width) =>
    `<span class="pc-handwritten" style="font-family:${fontHand};min-width:${width}">&nbsp;</span>`;
  const sideLine = (label, width) =>
    `<div class="pc-side">${label} <span class="pc-side-line" style="min-width:${width}">&nbsp;</span></div>`;

  el.innerHTML = `
    <div class="pc-row">
      ${greetings.map((g) => bub(g)).join(" ")}
      ${sideLine("Time", "55px")}
    </div>
    <div class="pc-row">
      ${intros.map((i) => bub(i)).join(" ")}
      ${blank("70px")}
      ${sideLine("Place", "55px")}
    </div>
    <div class="pc-divider"></div>
    <div class="pc-row">
      <span class="pc-text">I just wanted to say that your</span>
    </div>
    <div class="pc-row">
      ${qualities.map((q) => bub(q)).join(" ")}
      ${bub("____")}
    </div>
    <div class="pc-divider"></div>
    <div class="pc-row">
      ${adjectives.map((a) => bub(a)).join(" ")}
    </div>
    <div class="pc-divider"></div>
    <div class="pc-row">
      <span class="pc-text">Hope to hear from you</span>
      ${whens.map((w) => bub(w)).join(" ")}
    </div>
    <div class="pc-row">
      ${contacts.map((c) => bub(c)).join(" ")}
      ${blank("90px")}
    </div>
  `;

  return el;
}
