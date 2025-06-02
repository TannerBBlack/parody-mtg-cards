function printSelected() {
  const selected = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
    .map(cb => cb.nextElementSibling.innerHTML);
  const newWindow = window.open();
  newWindow.document.write('<html><body>' + selected.join('<hr>') + '</body></html>');
  newWindow.print();
}

const parodyCards = {
  "lightning bolt": "parody-cards/lightning_bolt_parody.jpg",
  "birds of paradise": "parody-cards/birds_of_paradise_parody.jpg"
};

async function searchCard() {
  const query = document.getElementById("card-search").value;
  const display = document.getElementById("card-display");
  display.innerHTML = "Loading...";

  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`);
    const card = await res.json();

    const cardName = card.name.toLowerCase();
    const parodyImage = parodyCards[cardName];

    display.innerHTML = `
      <h2>${card.name}</h2>
      <img src="${parodyImage || card.image_uris?.normal}" alt="${card.name}" width="250">
      <p>${card.type_line} | ${card.mana_cost || ""}</p>
      <p>${card.oracle_text || ""}</p>
      <button onclick="addToPrint('${card.name}', '${parodyImage || card.image_uris?.normal}')">Add to Print List</button>
    `;
  } catch (err) {
    display.innerHTML = "Card not found.";
  }
}

function addToPrint(name) {
  const container = document.getElementById("selected-cards");

  const printCard = document.createElement("div");
  printCard.className = "minimal-card";

  fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
    .then(res => res.json())
    .then(card => {
      // Strip curly braces from mana cost
      const manaCost = card.mana_cost ? card.mana_cost.replace(/[{}]/g, '') : '';

      // Check if the card has power/toughness
      const hasPT = card.power && card.toughness;

      printCard.innerHTML = `
        <div class="card-outline">
          <div class="card-header">
            <span class="card-name">${card.name}</span>
            <span class="card-cost">${manaCost}</span>
          </div>
          <div class="card-art-block">[  ART BLOCK  ]</div>
          <div class="card-type">${card.type_line}</div>
          <div class="card-text">${(card.oracle_text || "").replace(/\n/g, "<br>")}</div>
          ${hasPT ? `<div class="card-pt">${card.power}/${card.toughness}</div>` : ""}
        </div>
      `;

      container.appendChild(printCard);
    });
}

function printCards() {
  window.print();
}

