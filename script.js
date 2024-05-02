let db;
const request = indexedDB.open('plantDatabase', 1);

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
    loadCards();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const store = db.createObjectStore('plants', { keyPath: 'id', autoIncrement: true });
};

function saveCard(id) {
    const transaction = db.transaction(['plants'], 'readwrite');
    const store = transaction.objectStore('plants');
    const name = document.getElementById(`nameInput-${id}`).value;
    const description = document.getElementById(`descriptionInput-${id}`).value;
    const card = { id, name, description };
    store.put(card);
    loadCards();  // Refresh the card list after saving
}

function deleteCard(id) {
    const transaction = db.transaction(['plants'], 'readwrite');
    const store = transaction.objectStore('plants');
    store.delete(id);
    loadCards();  // Refresh the card list after deletion
}

function loadCards() {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';
    const transaction = db.transaction(['plants']);
    const store = transaction.objectStore('plants');
    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            const id = cursor.value.id;
            const name = cursor.value.name;
            const description = cursor.value.description;
            
            // 创建显示卡片信息的元素
            const nameElement = document.createElement('div');
            nameElement.textContent = `名称：${name}`;
            
            const descriptionElement = document.createElement('div');
            descriptionElement.textContent = `描述：${description}`;
            
            // 创建编辑按钮
            const editButton = document.createElement('button');
            editButton.textContent = '编辑';
            editButton.onclick = function() {
                editCard(id);
            };

            cardElement.appendChild(nameElement);
            cardElement.appendChild(descriptionElement);
            cardElement.appendChild(editButton);
            container.appendChild(cardElement);
            cursor.continue();
        }
    };
}

function editCard(id) {
    const nameElement = document.getElementById(`nameInput-${id}`);
    const descriptionElement = document.getElementById(`descriptionInput-${id}`);
    
    // 将文本内容转换为可编辑的文本框
    nameElement.outerHTML = `<input id="nameInput-${id}" value="${nameElement.textContent.replace('名称：', '')}" />`;
    descriptionElement.outerHTML = `<textarea id="descriptionInput-${id}">${descriptionElement.textContent.replace('描述：', '')}</textarea>`;
}


document.getElementById('newCardBtn').addEventListener('click', function() {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.innerHTML = `
        <div>名称：<input id="nameInput-new" placeholder="输入名称" /></div>
        <div>描述：<textarea id="descriptionInput-new" placeholder="输入描述"></textarea></div>
        <button onclick="addCard()">添加</button>
    `;
    document.getElementById('cardContainer').appendChild(cardElement);
});

function addCard() {
    const name = document.getElementById('nameInput-new').value;
    const description = document.getElementById('descriptionInput-new').value;
    const transaction = db.transaction(['plants'], 'readwrite');
    const store = transaction.objectStore('plants');
    const request = store.add({ name, description });
    request.onsuccess = () => {
        loadCards();  // Refresh the card list after adding a new card
    };
}
