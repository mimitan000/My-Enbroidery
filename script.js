
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  console.log(`Switched to tab: ${tabId}`);
}

function loadFlossData() {
  fetch('floss_data.json')
    .then(response => response.json())
    .then(data => {
      for (let brand in data) {
        const section = document.getElementById(brand);
        const table = document.createElement('table');
        const header = document.createElement('tr');
        header.innerHTML = '<th>番号</th><th>色名</th><th>所持数</th><th>欲しい</th>';
        table.appendChild(header);

        data[brand].forEach(floss => {
          const tr = document.createElement('tr');
          const key = `${brand}_${floss.number}`;
          const storedCount = localStorage.getItem(key + "_count") || "";
          const storedWant = localStorage.getItem(key + "_want") === "true";

          tr.innerHTML = `
            <td>${floss.number}</td>
            <td>${floss.name}</td>
            <td><input type="number" value="${storedCount}" min="0" onchange="saveCount('${key}', this.value)"></td>
            <td><input type="checkbox" ${storedWant ? "checked" : ""} onchange="saveWish('${key}', this.checked)"></td>
          `;
          table.appendChild(tr);
        });

        section.appendChild(table);
      }
    });
}

function saveCount(key, value) {
  localStorage.setItem(key + "_count", value);
}

function saveWish(key, checked) {
  localStorage.setItem(key + "_want", checked);
}

window.onload = loadFlossData;
