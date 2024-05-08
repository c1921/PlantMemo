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
		cards: [],
		selectedFileName: ''  // 在数据中添加一个用来存储文件名的属性
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
			// 弹出确认对话框
			if (confirm("确定要取消编辑，并放弃所有未保存的更改吗？")) {
				// 如果用户点击"确定"，则取消编辑并重新加载卡片数据
				this.getCards();  // 重新加载卡片，放弃当前的编辑状态和更改
			} else {
				// 如果用户点击"取消"，则不执行任何操作，继续保持编辑状态
				console.log('取消操作已取消，继续编辑');
			}
		},
		deleteCard(card) {
			// 弹出确认对话框
			if (confirm("确定要删除这个植物卡片吗？")) {
				// 如果用户点击"确定"，则执行删除操作
				const transaction = this.db.transaction(['cards'], 'readwrite');
				const objectStore = transaction.objectStore('cards');
				const request = objectStore.delete(card.id);
				request.onsuccess = () => {
					const index = this.cards.findIndex(item => item.id === card.id);
					this.cards.splice(index, 1);
				};
			} else {
				// 如果用户点击"取消"，则不执行任何操作
				console.log('删除操作已取消');
			}
		},

		handleFileUpload(event, card) {
			const file = event.target.files[0];
			if (file) {
				// 更新选中的文件名
				this.selectedFileName = file.name;

				// 创建一个FileReader来读取文件
				const reader = new FileReader();
				reader.onload = (e) => {
					// 文件读取完毕后，将结果赋值给卡片的图片属性，用于显示
					card.image = e.target.result;
				};
				// 以DataURL的形式读取文件内容
				reader.readAsDataURL(file);

				// 更新最后浇水日期为今天，假设文件上传的同时也是植物的维护日期
				card.lastWatered = new Date().toISOString().split('T')[0];

				// 如果有需要，这里可以调用保存或更新植物信息的函数
				// this.saveCard(card);
			} else {
				// 如果没有选择文件，清除之前的文件名显示
				this.selectedFileName = '';
			}
		}
		,
		calculateProgress(card) {
			const today = new Date();
			const lastWateredDate = new Date(card.lastWatered);

			// 计算自上次浇水以来的天数，向下取整以确保不会有小数天数
			const daysSinceLastWatered = Math.floor((today - lastWateredDate) / (1000 * 60 * 60 * 24));

			// 如果上次浇水日期在未来，则进度为 0
			if (daysSinceLastWatered < 0) {
				return 0;
			}

			// 如果上次浇水日期是今天，则进度为 100
			if (daysSinceLastWatered === 0) {
				return 100;
			}

			// 如果上次浇水日期在过去，计算剩余天数
			const interval = card.wateringInterval;
			let progress = 100 - ((daysSinceLastWatered / interval) * 100);

			// 确保进度在 0 到 100 之间
			progress = Math.min(100, Math.max(0, progress));
			return progress;
		},

		waterCard(card) {
			card.lastWatered = new Date().toISOString().split('T')[0];
			this.saveCard(card);
		},
		triggerFileInput() {
			document.getElementById('fileInput').click(); // 触发隐藏的文件输入点击事件
		},
		importData(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const cards = JSON.parse(e.target.result);
					const transaction = this.db.transaction(['cards'], 'readwrite');
					const objectStore = transaction.objectStore('cards');
					cards.forEach(card => {
						objectStore.put(card);
					});
					transaction.oncomplete = () => {
						console.log('所有数据已成功导入');
						this.getCards(); // 重新加载卡片以更新视图
					};
				};
				reader.readAsText(file);
			}
		},
		exportData() {
			const transaction = this.db.transaction(['cards'], 'readonly');
			const objectStore = transaction.objectStore('cards');
			const request = objectStore.getAll();

			request.onsuccess = () => {
				const jsonData = JSON.stringify(request.result);
				const blob = new Blob([jsonData], { type: 'application/json' });

				// 生成包含当前日期的文件名
				const date = new Date();
				const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');  // 格式为 YYYYMMDD
				const filename = `PlantMemo_data_${formattedDate}.json`;

				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				a.click();
				URL.revokeObjectURL(url);
				console.log('数据导出成功');
			};
		},
		importData(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const cards = JSON.parse(e.target.result);
					const transaction = this.db.transaction(['cards'], 'readwrite');
					const objectStore = transaction.objectStore('cards');
					cards.forEach(card => {
						objectStore.put(card);
					});
					transaction.oncomplete = () => {
						console.log('所有数据已成功导入');
						this.getCards(); // 重新加载卡片以更新视图
					};
				};
				reader.readAsText(file);
			}
		},
	}
});

// 检索所选文件名
const fileInput = document.querySelector("#file-name input[type=file]");
fileInput.onchange = () => {
	if (fileInput.files.length > 0) {
		const fileName = document.querySelector("#file-name .file-name");
		fileName.textContent = fileInput.files[0].name;
	}
};