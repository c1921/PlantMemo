document.addEventListener('DOMContentLoaded', function () {
    // 尝试从localStorage中获取主题设置，如果未设置，则使用系统偏好
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
});

function setTheme(theme) {
    const htmlElement = document.documentElement;
    const themeIcon = document.getElementById('theme-icon'); // 获取主题图标的span元素
    const icon = themeIcon.querySelector('i'); // 获取图标元素

    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // 根据主题设置 data-theme 属性和更新图标
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // 将主题保存到localStorage

    if (theme === 'dark') {
        icon.className = 'fas fa-lg fa-moon'; // 改为月亮图标
        icon.parentNode.classList.remove('has-text-warning');
        icon.parentNode.classList.add('has-text-link'); // 改为蓝色
    } else if (theme === 'light') {
        icon.className = 'fas fa-lg fa-sun'; // 改为太阳图标
        icon.parentNode.classList.remove('has-text-link');
        icon.parentNode.classList.add('has-text-warning'); // 改为黄色
    }
}

// 下拉菜单控制逻辑
const dropdown = document.querySelector('.dropdown');
dropdown.querySelector('.dropdown-trigger button').addEventListener('click', function (event) {
    event.stopPropagation();
    dropdown.classList.toggle('is-active');
});

document.addEventListener('click', function (event) {
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('is-active');
    }
});
