const worksUrl = "http://localhost:5678/api/works";
const categoriesUrl = "http://localhost:5678/api/categories";
const filters = document.querySelector("#portfolio .filters");
const gallery = document.querySelector("#portfolio .gallery");
const galleryStatus = document.querySelector("#gallery-status");
let allWorks = [];
let selectedCategoryId = null;

function renderWorks(works) {
  const filteredWorks =
    selectedCategoryId === null
      ? works
      : works.filter((work) => work.categoryId === selectedCategoryId);

  gallery.replaceChildren();
  galleryStatus.textContent = "";
  galleryStatus.hidden = true;

  if (filteredWorks.length === 0) {
    galleryStatus.textContent = "Aucun projet disponible.";
    galleryStatus.hidden = false;
  }

  for (const work of filteredWorks) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const caption = document.createElement("figcaption");

    image.src = work.imageUrl;
    image.alt = work.title;
    caption.textContent = work.title;
    figure.append(image, caption);
    gallery.append(figure);
  }
}

function renderFilters(categories) {
  filters.replaceChildren();
  const allCategories = [{ id: null, name: "Tous" }, ...categories];

  for (const category of allCategories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category.name;
    button.setAttribute("aria-pressed", category.id === selectedCategoryId);
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      for (const filterButton of filters.children) {
        filterButton.setAttribute("aria-pressed", filterButton === button);
      }
      renderWorks(allWorks);
    });
    filters.append(button);
  }
}

async function loadWorks() {
  try {
    const categoriesResponse = await fetch(categoriesUrl);
    if (!categoriesResponse.ok) {
      throw new Error(`HTTP ${categoriesResponse.status}`);
    }
    const categories = await categoriesResponse.json();
    if (!Array.isArray(categories)) {
      throw new Error("Invalid categories response");
    }

    const worksResponse = await fetch(worksUrl);
    if (!worksResponse.ok) {
      throw new Error(`HTTP ${worksResponse.status}`);
    }
    allWorks = await worksResponse.json();
    if (!Array.isArray(allWorks)) {
      throw new Error("Invalid works response");
    }

    renderFilters(categories);
    renderWorks(allWorks);
  } catch (error) {
    galleryStatus.textContent =
      "Impossible de charger les projets et leurs filtres pour le moment.";
    galleryStatus.hidden = false;
    console.error(
      "Chargement des projets ou des catégories impossible :",
      error,
    );
  }
}

loadWorks();
