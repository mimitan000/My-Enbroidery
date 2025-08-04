
const threads = {
    dmc: [{ number: '310', color: '#000000' }, { number: '321', color: '#c00000' }],
    cosmo: [{ number: '500', color: '#ffcc00' }, { number: '600', color: '#ff9999' }],
    olympus: [{ number: '101', color: '#009999' }],
    anchor: [{ number: '20', color: '#9933cc' }],
    other: [{ number: 'X01', color: '#cccccc' }]
};

let wishlist = new Set();
let inventory = {};

function switchTab(manufacturer) {
    const list = document.getElementById('thread-list');
    list.innerHTML = '';
    threads[manufacturer].forEach(thread => {
        const item = document.createElement('div');
        item.className = 'thread-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'thread-color';
        colorBox.style.backgroundColor = thread.color;

        const label = document.createElement('div');
        label.textContent = thread.number;

        const counter = document.createElement('div');
        counter.className = 'counter';
        const minus = document.createElement('button');
        minus.textContent = '－';
        const plus = document.createElement('button');
        plus.textContent = '＋';
        const count = document.createElement('span');
        count.textContent = inventory[thread.number] || 0;

        minus.onclick = () => {
            inventory[thread.number] = Math.max((inventory[thread.number] || 0) - 1, 0);
            count.textContent = inventory[thread.number];
        };
        plus.onclick = () => {
            inventory[thread.number] = (inventory[thread.number] || 0) + 1;
            count.textContent = inventory[thread.number];
        };

        counter.appendChild(minus);
        counter.appendChild(count);
        counter.appendChild(plus);

        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.innerHTML = '♥';
        if (wishlist.has(thread.number)) heart.classList.add('active');
        heart.onclick = () => {
            if (wishlist.has(thread.number)) {
                wishlist.delete(thread.number);
                heart.classList.remove('active');
            } else {
                wishlist.add(thread.number);
                heart.classList.add('active');
            }
        };

        item.appendChild(colorBox);
        item.appendChild(label);
        item.appendChild(counter);
        item.appendChild(heart);

        list.appendChild(item);
    });
}

window.onload = () => switchTab('dmc');
