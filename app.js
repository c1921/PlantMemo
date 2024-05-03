// Open IndexedDB database
const openDB = () => {
    // 打开或者创建一个名为cardDB的数据库，版本号为1
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('cardDB', 1);
      // 打开数据库失败
      request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
        reject(event.target.errorCode);
      };
      // 打开数据库成功
      request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
      };
      // 数据库升级
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore('cards', { keyPath: 'id' });
      };
    });
  };

  new Vue({
    el: '#app',
    data: {
      cards: []
    },
    created() {
      // 打开数据库并获取所有数据
      openDB().then(db => {
        this.db = db;
        this.getCards();
      });
    },
    methods: {
      getCards() {
        // 读取所有数据
        const transaction = this.db.transaction(['cards'], 'readonly');
        const objectStore = transaction.objectStore('cards');
        const request = objectStore.getAll();
        request.onsuccess = () => {
          // 反转卡片数组
          this.cards = request.result.map(card => ({ ...card, editing: false })).reverse();
        };
      },
      newCard() {
        // 添加新卡片
        this.cards.unshift({ id: Date.now(), title: '', subtitle: '', description: '', image: '', sunlight: '', editing: true });
      },
      editCard(card) {
        // 设置卡片为编辑模式
        card.editing = true;
      },
      saveCard(card) {
        // 保存修改
        const transaction = this.db.transaction(['cards'], 'readwrite');
        const objectStore = transaction.objectStore('cards');
        const request = objectStore.put(card);
        request.onsuccess = () => {
          card.editing = false;
          console.log('Saved:', card.title, card.subtitle, card.description, card.image, card.sunlight);
        };
      },
      cancelEdit(card) {
        // 取消编辑
        // Reload the content from the database
        this.getCards();
      },
      deleteCard(card) {
        // 删除卡片
        const transaction = this.db.transaction(['cards'], 'readwrite');
        const objectStore = transaction.objectStore('cards');
        const request = objectStore.delete(card.id);
        request.onsuccess = () => {
          const index = this.cards.findIndex(item => item.id === card.id);
          this.cards.splice(index, 1);
        };
      },
      handleFileUpload(event, card) {
        // 上传文件
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          card.image = reader.result;
        };
        reader.readAsDataURL(file);
      }
    }
  });

  // 检索所选文件名
  const fileInput = document.querySelector("#file-js-example input[type=file]");
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const fileName = document.querySelector("#file-js-example .file-name");
      fileName.textContent = fileInput.files[0].name;
    }
  };