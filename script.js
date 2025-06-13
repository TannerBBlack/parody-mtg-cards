document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-button").addEventListener("click", searchCards);
  document.getElementById("print-button").addEventListener("click", printCards);

  document.getElementById("card-display").addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-print")) {
      const name = e.target.getAttribute("data-name");
      if (name) addToPrint(name);
    }
  });
});

async function searchCards() {
  const input = document.getElementById("card-search").value;
  const display = document.getElementById("card-display");
  display.innerHTML = "Loading...";

  const names = input
    .split("1")
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (names.length === 0) {
    display.innerHTML = "No valid card names entered.";
    return;
  }

  const identifiers = names.map(name => ({ name }));

  try {
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers })
    });

    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      display.innerHTML = "No cards found.";
      return;
    }

    display.innerHTML = data.data.map(card => `
      <div class="card-result">
        <h2>${card.name}</h2>
        <img src="${card.image_uris?.normal}" alt="${card.name}" width="250">
        <p>${card.type_line} | ${renderManaCost(card.mana_cost)}</p>
        <p>${formatOracleText(card.oracle_text || "")}</p>
        <button class="add-to-print" data-name="${card.name}">Add to Print List</button>
      </div>
    `).join("<hr>");
  } catch (err) {
    console.error(err);
    display.innerHTML = "Something went wrong fetching cards.";
  }
}

function renderManaCost(text) {
  if (!text) return "";

  return text.replace(/{(.*?)}/g, (match, symbol) => {
    const cleanSymbol = symbol.toLowerCase().replace(/\//g, '');
    return `<img src="card-symbols/${cleanSymbol}.svg" alt="${symbol}" class="mana-icon mana-${cleanSymbol}">`;
  });
}

function formatOracleText(text) {
  return renderManaCost(text)
    .replace(/\n/g, "<br>")
    .replace(/\(([^)]+)\)/g, '<span class="card-reminder">($1)</span>');
}

function addToPrint(name) {
  const container = document.getElementById("selected-cards");

  const printCard = document.createElement("div");
  printCard.className = "minimal-card";

  fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
    .then(res => res.json())
    .then(card => {
      const manaCostHTML = renderManaCost(card.mana_cost);
      const hasPT = typeof card.power === "string" && typeof card.toughness === "string";
      const renderedOracleText = formatOracleText(card.oracle_text || "");

      printCard.innerHTML = `
        <div class="card-outline">
          <div class="card-header">
            <span class="card-name">${card.name}</span>
            <span class="card-cost">${manaCostHTML}</span>
          </div>
          <div class="card-art-block"></div>
          <div class="card-type">${card.type_line}</div>
          <div class="card-text">${renderedOracleText}</div>
          ${hasPT ? `<div class="card-pt">${card.power}/${card.toughness}</div>` : ""}
        </div>
      `;
      container.appendChild(printCard);
    })
    .catch(err => {
      console.error("Failed to fetch card:", err);
    });
}

function printCards() {
  const cardsContainer = document.getElementById("selected-cards");
  if (!cardsContainer || cardsContainer.children.length === 0) {
    alert("No cards in print list.");
    return;
  }

  const cardsHTML = cardsContainer.innerHTML;
  const printWindow = window.open("", "_blank");

  const styles = `
    <style>
      @page {
        size: auto;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: white;
      }

      .print-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 0;
      }

      .minimal-card {
        width: 2.5in;
        height: 3.5in;
        box-sizing: border-box;
        border: 1px solid #000;
        padding: 0.15in;
        font-family: 'Georgia', serif;
        overflow: hidden;
        page-break-inside: avoid;
      }

      .card-outline {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7em;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-type {
        font-style: italic;
        font-size: 0.7em;
        margin-bottom: 0.05in;
      }

      .card-art-block {
        flex-shrink: 0;
        height: 1.45in;
        border: 1px dashed #999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #777;
        font-size: 0.75em;
        margin-bottom: 0.05in;
      }

      .card-text {
        font-size: 0.55em;
        white-space: pre-wrap;
        margin-top: 0.05in;
        margin-bottom: 0.025in;
        flex-grow: 1;
        overflow-y: auto;
      }

      .card-pt {
        font-weight: bold;
        font-size: 0.5em;
        background-color: white;
        border: 1px solid black;
        padding: 0.05in 0.15in;
        border-radius: 3px;
        align-self: flex-end;
      }

      .mana-icon {
        height: 1em;
        vertical-align: middle;
        margin: 0 1px;
        filter: grayscale(0%) brightness(1.2);
      }

      .mana-w { filter: sepia(1) hue-rotate(40deg) saturate(4) brightness(1.1); }
      .mana-u { filter: sepia(1) hue-rotate(190deg) saturate(4) brightness(1.2); }
      .mana-r { filter: sepia(1) hue-rotate(0deg) saturate(6) brightness(1.1); }
      .mana-g { filter: sepia(1) hue-rotate(100deg) saturate(4) brightness(1.2); }
      .mana-x { filter: grayscale(0%) brightness(0.8); }

      .mana-1, .mana-2, .mana-3, .mana-4,
      .mana-5, .mana-6, .mana-7, .mana-8,
      .mana-9, .mana-10, .mana-11, .mana-12,
      .mana-13, .mana-14, .mana-15, .mana-16 {
        filter: grayscale(0%) brightness(1);
      }

      .card-reminder {
        font-style: italic;
        font-size: 0.8em;
        color: #555;
      }
    </style>
  `;

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Cards</title>
        ${styles}
      </head>
      <body>
        <div class="print-grid">
          ${cardsHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
