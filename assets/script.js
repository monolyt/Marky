document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', (event) => {
            if (!event.target.closest('.filter-icon')) {
                sortTable(header.dataset.column);
            }
        });
    });
});

// Define colors for light and dark mode
const tagColorsLight = ["#003f5c", "#2c4875", "#58508d", "#8a508f", "#bc5090", "#de5a79", "#f75454", "#ff8531", "#ffa600", "#6fba57"];
const tagColorsDark = ["rgba(0, 63, 92, 0.8)", "rgba(44, 72, 117, 0.8)", "rgba(88, 80, 141, 0.8)", "rgba(138, 80, 143, 0.8)", "rgba(188, 80, 144, 0.8)", "rgba(222, 90, 121, 0.8)", "rgba(247, 84, 84, 0.8)", "rgba(255, 133, 49, 0.8)", "rgba(255, 166, 0, 0.8)", "rgba(111, 186, 87, 0.8)"];

// Create color maps for consistent tag coloring
const tagColorMapLight = new Map();
const tagColorMapDark = new Map();

function initializeTagColors() {
    const uniqueTags = getUniqueTags(bookmarks);
    uniqueTags.forEach((tag, index) => {
        const colorIndex = index % tagColorsLight.length;
        tagColorMapLight.set(tag, tagColorsLight[colorIndex]);
        tagColorMapDark.set(tag, tagColorsDark[colorIndex]);
    });
}

// Dark mode toggle functionality
const darkModeToggle = document.getElementById("darkModeToggle");

darkModeToggle.addEventListener("click", () => {
    if (document.documentElement.hasAttribute("dark")) {
        document.documentElement.removeAttribute("dark");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("dark", "");
        localStorage.setItem("theme", "dark");
    }
    renderTable(bookmarks, currentSort); // Re-render table to apply theme-specific tag colors and retain sort state
});

// Load saved theme from localStorage
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.setAttribute("dark", "");
    }
});

let bookmarks = [];
let currentSort = { column: 'title', direction: 'desc' };
let activeTagFilters = new Set();

async function loadBookmarks() {
    try {
        const response = await fetch('./bookmarks.json');
        bookmarks = await response.json();
        initializeTagColors(); // Initialize tag colors only once after loading bookmarks
        sortTable('title'); // Initial sort by title
        renderTagFilterOptions();
    } catch (error) {
        console.error("Error loading bookmarks:", error);
    }
}

function renderTable(data, sort = currentSort) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const sortedData = sortData(data, sort);
    sortedData.forEach(bookmark => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="${bookmark.url}" target="_blank">${bookmark.title}</a></td>
            <td>${bookmark.description}</td>
            <td>${renderTags(bookmark.tags)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function sortData(data, sort) {
    return [...data].sort((a, b) => {
        const aVal = a[sort.column].toString().toLowerCase();
        const bVal = b[sort.column].toString().toLowerCase();
        return (aVal > bVal ? 1 : -1) * (sort.direction === 'asc' ? 1 : -1);
    });
}

function renderTags(tags) {
    const isDarkMode = document.documentElement.hasAttribute("dark");
    const colorMap = isDarkMode ? tagColorMapDark : tagColorMapLight;

    return tags.map(tag => `
        <span class="tag" data-tag="${tag}" style="background-color: ${colorMap.get(tag)};" onclick="filterByTag('${tag}')">${tag}</span>
    `).join('');
}

function getUniqueTags(bookmarks) {
    return [...new Set(bookmarks.flatMap(bookmark => bookmark.tags))];
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let filtered = bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.description.toLowerCase().includes(query) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query))
    );

    if (activeTagFilters.size > 0) {
        filtered = filtered.filter(bookmark => bookmark.tags.some(tag => activeTagFilters.has(tag)));
    }

    renderTable(filtered, currentSort);
}

function sortTable(column) {
    const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { column, direction };
    renderTable(bookmarks, currentSort);
    updateSortIndicators();
}

function updateSortIndicators() {
    const ascIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-a-z">
            <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/>
            <path d="M20 8h-5"/>
            <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10"/>
            <path d="M15 14h5l-5 6h5"/>
        </svg>`;
    const descIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-z-a">
            <path d="m3 16 4 4 4-4"/>
            <path d="M7 4v16"/>
            <path d="M15 4h5l-5 6h5"/>
            <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20"/>
            <path d="M20 18h-5"/>
        </svg>`;
    document.querySelectorAll('.sort-indicator').forEach(ind => ind.innerHTML = '');
    const indicator = currentSort.direction === 'asc' ? ascIcon : descIcon;
    document.querySelector(`th[data-column="${currentSort.column}"] .sort-indicator`).innerHTML = indicator;
}

function toggleTagFilterDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('tagFilterDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function renderTagFilterOptions() {
    const dropdown = document.getElementById('tagFilterDropdown');
    const uniqueTags = getUniqueTags(bookmarks);

    dropdown.innerHTML = '';
    uniqueTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.classList.add('tag-filter-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.onchange = () => toggleTagFilter(tag);

        const tagLabel = document.createElement('span');
        tagLabel.classList.add('tag');
        tagLabel.textContent = tag;
        tagLabel.style.backgroundColor = tagColorMapLight.get(tag);

        tagElement.appendChild(checkbox);
        tagElement.appendChild(tagLabel);
        dropdown.appendChild(tagElement);
    });
}

function toggleTagFilter(tag) {
    if (activeTagFilters.has(tag)) {
        activeTagFilters.delete(tag);
    } else {
        activeTagFilters.add(tag);
    }
    filterTable();
}

function filterByTag(tag) {
    activeTagFilters.clear();
    activeTagFilters.add(tag);
    filterTable();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
