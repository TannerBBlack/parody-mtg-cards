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
      headers: {
        "Content-Type": "application/json"
      },
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
        <p>${renderManaCost(card.oracle_text || "").replace(/\n/g, "<br>")}</p>
        <button class="add-to-print" data-name="${card.name}">Add to Print List</button>
      </div>
    `).join("<hr>");
  } catch (err) {
    console.error(err);
    display.innerHTML = "Something went wrong fetching cards.";
  }
}

function renderManaCost(cost) {
  if (!cost) return "";

  return cost.replace(/{(.*?)}/g, (match, symbol) => {
    const cleanSymbol = symbol.toLowerCase().replace(/\//g, '');
    return `<img src="card-symbols/${cleanSymbol}.svg" alt="${symbol}" class="mana-icon mana-${cleanSymbol}">`;
  });
}

function addToPrint(name) {
  const container = document.getElementById("selected-cards");

  const printCard = document.createElement("div");
  printCard.className = "minimal-card";

  fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
    .then(res => res.json())
    .then(card => {
      const manaCostHTML = renderManaCost(card.mana_cost);
      const hasPT = card.power !== null && card.toughness !== null;
      const renderedOracleText = renderManaCost(card.oracle_text || "").replace(/\n/g, "<br>");
    
      printCard.innerHTML = `
        <div class="card-outline">
          <div class="card-header">
            <span class="card-name">${card.name}</span>
            <span class="card-cost">${manaCostHTML}</span>
          </div>
          <div class="card-art-block">[  ART BLOCK  ]</div>
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
  window.print();
}
