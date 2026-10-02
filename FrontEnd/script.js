const worksUrl = "http://localhost:5678/api/works";
const gallery = document.querySelector("#portfolio .gallery");
const galleryStatus = document.querySelector("#gallery-status");

function renderWorks(works) {
  gallery.replaceChildren();
  galleryStatus.textContent = "";
  galleryStatus.hidden = true;

  if (works.length === 0) {
    galleryStatus.textContent = "Aucun projet disponible.";
    galleryStatus.hidden = false;
  }

  for (const work of works) {
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

async function loadWorks() {
  try {
    const response = await fetch(worksUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const works = await response.json();
    if (!Array.isArray(works)) {
      throw new Error("Invalid works response");
    }

    renderWorks(works);
  } catch (error) {
    galleryStatus.textContent =
      "Impossible de charger les projets pour le moment.";
    galleryStatus.hidden = false;
    console.error("Chargement des projets impossible :", error);
  }
}

loadWorks();
