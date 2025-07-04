const worksData = [
  { id: '1', title: 'あいうえおの作品', date: '2025-06-01', category: 'Category A', thumbnail: 'img/1.webp', description: '説明文1' },
  { id: '2', title: 'Work 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
  { id: '3', title: 'Aork 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
  { id: '4', title: 'Work 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
  { id: '5', title: 'Cork 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
    { id: '6', title: 'Sork 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
  { id: '7', title: 'Zork 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
  { id: '8', title: 'Work 1', date: '2025-05-15', category: 'Category B', thumbnail: 'img/2.webp', description: '説明文2' },
];

let activeCategory = 'All';
let searchTerm = '';
let sortOption = 'newest';
let visibleCount = 6;
const loadIncrement = 6;

function init() {
  renderTabs();
  attachControlEvents();
  renderWorks();
}

function getCategories() {
  const cats = Array.from(new Set(worksData.map(w => w.category)));
  return ['All', ...cats];
}

function renderTabs() {
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = '';
  getCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'tab-button' + (cat === activeCategory ? ' active' : '');
    btn.addEventListener('click', () => {
      activeCategory = cat;
      visibleCount = 6;
      updateActiveTab();
      renderWorks();
    });
    tabsEl.appendChild(btn);
  });
}

function updateActiveTab() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === activeCategory);
  });
}

function attachControlEvents() {
  document.getElementById('search-input').addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase();
    visibleCount = 6;
    renderWorks();
  });
  document.getElementById('sort-select').addEventListener('change', e => {
    sortOption = e.target.value;
    visibleCount = 6;
    renderWorks();
  });
  document.getElementById('load-more-btn').addEventListener('click', () => {
    visibleCount += loadIncrement;
    renderWorks();
  });
}

function filterWorks() {
  let result = worksData.slice();
  if (activeCategory !== 'All') {
    result = result.filter(w => w.category === activeCategory);
  }
  if (searchTerm) {
    result = result.filter(w => w.title.toLowerCase().includes(searchTerm));
  }
  switch (sortOption) {
    case 'newest':
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'oldest':
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'a-z':
      result.sort((a, b) => a.title.localeCompare(b.title, 'en'));
      break;
    case 'z-a':
      result.sort((a, b) => b.title.localeCompare(a.title, 'en'));
      break;
    case 'kana':
      result.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
      break;
  }
  return result;
}

function renderWorks() {
  const grid = document.getElementById('works-grid');
  grid.innerHTML = '';
  const filtered = filterWorks();
  const toShow = filtered.slice(0, visibleCount);
  toShow.forEach(w => {
    const div = document.createElement('div');
    div.className = 'work-item';
    div.innerHTML = `
      <img src="${w.thumbnail}" alt="${w.title}">
      <div class="work-info">
        <div class="tags"><span class="tag">${w.category}</span></div>
        <h3>${w.title}</h3>
        <p class="date">${w.date}</p>
        <p class="description">${w.description}</p>
      </div>
    `;
    div.addEventListener('click', () => {
      window.location.href = `works/${w.id}.html`;
    });
    grid.appendChild(div);
  });

  const loadBtn = document.getElementById('load-more-btn');
  loadBtn.style.display = visibleCount < filtered.length ? 'inline-block' : 'none';
}

window.addEventListener('DOMContentLoaded', init);
