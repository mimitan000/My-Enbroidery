const flossData = {
    dmc: [
        { number: "310", name: "Black", image: "floss_310.png" },
        { number: "321", name: "Red", image: "floss_321.png" }
    ],
    cosmo: [
        { number: "500", name: "Light Pink", image: "floss_500.png" },
        { number: "501", name: "Pink", image: "floss_501.png" }
    ]
};

function switchTab(brand) {
    const list = document.getElementById('thread-list');
    const threads = flossData[brand];
    let html = '<table><tr><th>番号</th><th>色名</th><th>画像</th><th>所持数</th><th>欲しい</th></tr>';
    threads.forEach(t => {
        const id = brand + '_' + t.number;
        const count = localStorage.getItem(id + '_count') || '';
        const want = localStorage.getItem(id + '_want') === 'true' ? 'wanted' : '';
        html += `<tr>
            <td>${t.number}</td>
            <td>${t.name}</td>
            <td><img src="${t.image}" class="thread-image" alt="${t.name}"></td>
            <td><input type="number" min="0" value="${count}" onchange="saveCount('${id}', this.value)"></td>
            <td><span class="heart ${want}" onclick="toggleHeart(this, '${id}')">❤️</span></td>
        </tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
}

function saveCount(id, value) {
    localStorage.setItem(id + '_count', value);
}

function toggleHeart(el, id) {
    el.classList.toggle('wanted');
    const wanted = el.classList.contains('wanted');
    localStorage.setItem(id + '_want', wanted);
}

switchTab('dmc');
