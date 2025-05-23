const cards = [
  { name: "Mana Accountant", text: "Tap: Add two of any color. Taxes 1 life." },
  { name: "Overly Attached Familiar", text: "Can’t be exiled. Haunts forever." },
  { name: "Stack Overflow", text: "Exile all spells on the stack. Chaos ensues." }
];

const gallery = document.getElementById('card-gallery');

cards.forEach((card, i) => {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `<input type="checkbox" id="card${i}" />
                   <label for="card${i}"><strong>${card.name}</strong><br>${card.text}</label>`;
  gallery.appendChild(div);
});

function printSelected() {
  const selected = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
    .map(cb => cb.nextElementSibling.innerHTML);
  const newWindow = window.open();
  newWindow.document.write('<html><body>' + selected.join('<hr>') + '</body></html>');
  newWindow.print();
}
