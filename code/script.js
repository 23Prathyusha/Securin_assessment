let currentPage = 1;
let limit = 15;
let totalRecipes = 0;
let debounceTimer;
let allCuisines = [];

const elements = {
    tableBody: document.getElementById("recipeTable"),
    pagination: document.getElementById("pagination"),
    fallback: document.getElementById("fallback"),
    resultsCount: document.getElementById("resultsCount"),
    titleFilter: document.getElementById("titleFilter"),
    cuisineFilter: document.getElementById("cuisineFilter"),
    ratingFilter: document.getElementById("ratingFilter"),
    caloriesFilter: document.getElementById("caloriesFilter"),
    sortBy: document.getElementById("sortBy"),
    perPageSelect: document.getElementById("perPageSelect"),
    searchBtn: document.getElementById("searchBtn"),
    resetBtn: document.getElementById("resetBtn"),
    searchText: document.getElementById("searchText"),
    searchSpinner: document.getElementById("searchSpinner")
};

// Initialize the application
async function init() {
    await fetchCuisines();
    setupEventListeners();
    fetchRecipes(currentPage, limit);
}

async function fetchCuisines() {
    try {
        const res = await fetch('http://localhost:8000/api/recipes/search?limit=1000');
        const data = await res.json();
        
        const cuisines = new Set();
        data.data.forEach(recipe => {
            if (recipe.cuisine) cuisines.add(recipe.cuisine);
        });
        
        allCuisines = Array.from(cuisines).sort();
        populateCuisineFilter();
    } catch (error) {
        console.error("Error fetching cuisines:", error);
    }
}

function populateCuisineFilter() {
    const select = elements.cuisineFilter;
    allCuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Pagination controls
    elements.perPageSelect.addEventListener("change", (e) => {
        limit = parseInt(e.target.value);
        currentPage = 1;
        fetchRecipes(currentPage, limit);
    });

    // Search/filter controls
    elements.searchBtn.addEventListener("click", performSearch);
    elements.resetBtn.addEventListener("click", resetFilters);
    
    
    elements.titleFilter.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 500);
    });
    
    
    elements.cuisineFilter.addEventListener("change", performSearch);
    elements.ratingFilter.addEventListener("change", performSearch);
    elements.caloriesFilter.addEventListener("change", performSearch);
    elements.sortBy.addEventListener("change", performSearch);
}

async function performSearch() {
    elements.searchText.classList.add("d-none");
    elements.searchSpinner.classList.remove("d-none");
    
    const title = elements.titleFilter.value;
    const cuisine = elements.cuisineFilter.value;
    const rating = elements.ratingFilter.value;
    const calories = elements.caloriesFilter.value;
    const sort = elements.sortBy.value;
    
    let url = `http://localhost:8000/api/recipes/search?limit=${limit}`;
    if (title) url += `&title=${encodeURIComponent(title)}`;
    if (cuisine) url += `&cuisine=${encodeURIComponent(cuisine)}`;
    if (rating) url += `&rating=>=${rating}`;
    if (calories) url += `&calories=<=${calories}`;
    if (sort) url += `&sort=${sort}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        renderTable(data.data);
        renderResultsCount(data.count);
        
        elements.pagination.innerHTML = "";
    } catch (error) {
        console.error("Search error:", error);
        showError("Failed to perform search");
    } finally {
        elements.searchText.classList.remove("d-none");
        elements.searchSpinner.classList.add("d-none");
    }
}

function resetFilters() {
    elements.titleFilter.value = "";
    elements.cuisineFilter.value = "";
    elements.ratingFilter.value = "";
    elements.caloriesFilter.value = "";
    elements.sortBy.value = "";
    elements.perPageSelect.value = "15";
    limit = 15;
    currentPage = 1;
    fetchRecipes(currentPage, limit);
}

async function fetchRecipes(page = 1, limit = 15) {
    try {
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="loading"></div>
                    <p>Loading recipes...</p>
                </td>
            </tr>`;
        
        elements.fallback.classList.add("d-none");
        
        const sort = elements.sortBy.value;
        let url = `http://localhost:8000/api/recipes?page=${page}&limit=${limit}`;
        if (sort) url += `&sort=${sort}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        renderTable(data.data);
        renderPagination(data.total, page, limit);
        renderResultsCount(data.total);
    } catch (error) {
        console.error("Error fetching recipes:", error);
        showError("Failed to load recipes");
    }
}

function renderTable(data) {
    const tbody = elements.tableBody;
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        elements.fallback.classList.remove("d-none");
        return;
    }

    // Deduplicate recipes by ID
    const uniqueRecipes = [];
    const seenIds = new Set();
    
    data.forEach(recipe => {
        if (!seenIds.has(recipe.id)) {
            seenIds.add(recipe.id);
            uniqueRecipes.push(recipe);
        }
    });

    uniqueRecipes.forEach(recipe => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="truncate" title="${recipe.title || ''}">${recipe.title || "--"}</td>
            <td>${recipe.cuisine || "--"}</td>
            <td>${renderStars(recipe.rating)}</td>
            <td>${recipe.total_time || "--"}</td>
            <td>${recipe.serves || "--"}</td>
        `;
        row.addEventListener("click", () => openDrawer(recipe));
        tbody.appendChild(row);
    });
}

function renderPagination(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const pagination = elements.pagination;
    pagination.innerHTML = "";

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${page === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<button class="page-link">Previous</button>`;
    prevLi.addEventListener("click", () => {
        if (page > 1) fetchRecipes(page - 1, limit);
    });
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === page ? "active" : ""}`;
        li.innerHTML = `<button class="page-link">${i}</button>`;
        li.addEventListener("click", () => fetchRecipes(i, limit));
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${page === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<button class="page-link">Next</button>`;
    nextLi.addEventListener("click", () => {
        if (page < totalPages) fetchRecipes(page + 1, limit);
    });
    pagination.appendChild(nextLi);
}

function renderResultsCount(total) {
    elements.resultsCount.textContent = total === 0 
        ? "No recipes found" 
        : `Showing ${Math.min(limit, total)} of ${total} recipes`;
}

function openDrawer(recipe) {
    const drawer = new bootstrap.Offcanvas(document.getElementById('recipeDrawer'));
    const drawerContent = document.getElementById("drawerContent");
    const drawerLoading = document.getElementById("drawerLoading");
    
    drawerContent.classList.add("d-none");
    drawerLoading.classList.remove("d-none");
    drawer.show();
    
    //loading delay 
    setTimeout(() => {
        populateDrawer(recipe);
        drawerLoading.classList.add("d-none");
        drawerContent.classList.remove("d-none");
    }, 300);
}

function populateDrawer(recipe) {
    document.getElementById("drawerTitle").textContent = 
        `${recipe.title || "Unknown Recipe"}${recipe.cuisine ? ` (${recipe.cuisine})` : ""}`;
    
    document.getElementById("drawerDesc").textContent = 
        recipe.description || "No description available";
    
    document.getElementById("drawerTime").textContent = 
        recipe.total_time ? `${recipe.total_time} minutes` : "--";
    
    document.getElementById("prepTime").textContent = 
        recipe.prep_time || "--";
    
    document.getElementById("cookTime").textContent = 
        recipe.cook_time || "--";
    
   
    const nutritionTbody = document.getElementById("drawerNutrition");
    nutritionTbody.innerHTML = "";
    
    const nutrients = recipe.nutrients || {};
    const nutrientFields = [
        "calories", "carbohydrateContent", "cholesterolContent", 
        "fiberContent", "proteinContent", "saturatedFatContent",
        "sodiumContent", "sugarContent", "fatContent"
    ];
    
    nutrientFields.forEach(field => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${field}</strong></td>
            <td>${nutrients[field] || "--"}</td>
        `;
        nutritionTbody.appendChild(row);
    });
    
   
    document.getElementById("expandTime").addEventListener("click", (e) => {
        e.preventDefault();
        const details = document.getElementById("timeDetails");
        const isHidden = details.classList.contains("d-none");
        
        details.classList.toggle("d-none", !isHidden);
        e.target.textContent = isHidden ? "(hide details)" : "(show details)";
    });
}

function renderStars(rating) {
    if (!rating) return "--";
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = "";
    
    for (let i = 0; i < fullStars; i++) stars += "★";
    if (hasHalfStar) stars += "½";
    
    return stars;
}

function showError(message) {
    elements.fallback.textContent = message;
    elements.fallback.classList.remove("d-none");
}


document.addEventListener("DOMContentLoaded", init);