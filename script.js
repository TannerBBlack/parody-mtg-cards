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
    .split(",")
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
  const printWindow = window.open("", "_blank");
 const styles = `
  <style>
    @page {
      size: auto;
      margin: 0;
    }

    body {
      margin: 0;
      padding: 0;
    }

    .print-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(2.5in, 1fr));
      justify-items: center;
      gap: 0;
      padding: 0.2in;
    }

    .minimal-card {
      width: 2.5in;
      height: 3.5in;
      border: 1px solid black;
      padding: 0.1in;
      box-sizing: border-box;
      font-family: sans-serif;
      page-break-inside: avoid;
      overflow: hidden;
    }

    .card-outline {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-size: 10pt;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 11pt;
    }

    .card-art-block {
      background: #eee;
      text-align: center;
      flex-grow: 1;
      margin: 4px 0;
      font-size: 9pt;
    }

    .card-cost img {
      height: 12pt;
      vertical-align: middle;
    }

    .card-text {
      font-size: 9pt;
      flex-grow: 1;
      overflow: hidden;
    }

    .card-pt {
      text-align: right;
      font-weight: bold;
      font-size: 10pt;
    }

    .card-reminder {
      font-size: 8pt;
      font-style: italic;
    }
  </style>
`;

  const cardsHTML = document.getElementById("selected-cards").innerHTML;
  printWindow.document.write(`
    <html>
      <head><title>Print Proxy Cards</title>${styles}</head>
      <body><div class="print-grid">${cardsHTML}</div></body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
