const focusableSelector = "button, a, input, textarea, select";
let modal = null,
  focusables = [],
  previouslyFocusedElement = null;

const openModal = function (e) {
  e.preventDefault();
  const href = (e.currentTarget || e.target).getAttribute("href");
  modal =
    href && href.startsWith("#")
      ? document.querySelector(href)
      : document.querySelector("#modal-gallery");
  if (modal === null) return;
  previouslyFocusedElement = document.querySelector(":focus");
  modal.style.display = "flex";
  switchToGalleryView();
  populateModalGallery(allWorks);
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");
  focusables = Array.from(modal.querySelectorAll(focusableSelector)).filter(
    (element) => element.offsetParent !== null,
  );
  focusables[0]?.focus();
  modal.addEventListener("click", closeModal);
  modal.querySelector(".js-modal-close").addEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation);
};

const closeModal = function (e) {
  if (modal === null) return;
  if (previouslyFocusedElement !== null) previouslyFocusedElement.focus();
  e.preventDefault();
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");
  modal.removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-close")
    .removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);
  modal.style.display = "none";
  modal = null;
};

const stopPropagation = function (e) {
  e.stopPropagation();
};

const focusInModal = function (e) {
  e.preventDefault();
  focusables = Array.from(modal.querySelectorAll(focusableSelector)).filter(
    (element) => element.offsetParent !== null,
  );
  let idx = focusables.findIndex((el) => el === modal.querySelector(":focus"));
  e.shiftKey ? idx-- : idx++;
  if (idx >= focusables.length) idx = 0;
  if (idx < 0) idx = focusables.length - 1;
  focusables[idx].focus();
};

const loadModal = async function (url) {
  const hash = "#" + url.split("#")[1];
  const existing = document.querySelector(hash);
  if (existing !== null) return existing;
  const html = await fetch(url).then((r) => r.text());
  const fragment = document
    .createRange()
    .createContextualFragment(html)
    .querySelector(hash);
  if (fragment === null)
    throw `L'élément ${hash} n'a pas été trouvé dans la page ${url}`;
  document.body.append(fragment);
  return fragment;
};

// ---- Construction du DOM de la modale ----

function buildModal() {
  const overlay = document.createElement("div");
  overlay.id = "modal-gallery";
  overlay.className = "modal";
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");

  const inner = document.createElement("div");
  inner.className = "modal-inner js-modal-stop";

  // Bouton fermer unique, accessible depuis les deux vues
  const closeBtn = document.createElement("button");
  closeBtn.className = "js-modal-close modal-close-btn";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Fermer la modale");
  closeBtn.textContent = "✕";
  inner.appendChild(closeBtn);

  // ---- Vue 1 : Galerie ----
  const viewGallery = document.createElement("div");
  viewGallery.id = "modal-view-gallery";

  const titleGallery = document.createElement("h3");
  titleGallery.className = "modal-title";
  titleGallery.textContent = "Galerie photo";

  const grid = document.createElement("div");
  grid.className = "modal-works-grid";

  const separator = document.createElement("hr");
  separator.className = "modal-separator";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "modal-add-btn";
  addBtn.textContent = "Ajouter une photo";
  addBtn.addEventListener("click", switchToAddView);

  viewGallery.appendChild(titleGallery);
  viewGallery.appendChild(grid);
  viewGallery.appendChild(separator);
  viewGallery.appendChild(addBtn);

  // ---- Vue 2 : Formulaire d'ajout ----
  const viewAdd = document.createElement("div");
  viewAdd.id = "modal-view-add";
  viewAdd.style.display = "none";

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "modal-back-btn";
  backBtn.setAttribute("aria-label", "Retour à la galerie");
  backBtn.textContent = "←";
  backBtn.addEventListener("click", switchToGalleryView);

  const titleAdd = document.createElement("h3");
  titleAdd.className = "modal-title";
  titleAdd.textContent = "Ajout photo";

  const form = document.createElement("form");
  form.id = "modal-add-form";
  form.className = "modal-add-form";

  const uploadZone = document.createElement("div");
  uploadZone.className = "modal-upload-zone";

  const placeholder = document.createElement("div");
  placeholder.className = "upload-placeholder";
  placeholder.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#cbd6e2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
    <label for="modal-file-input" class="upload-label">+ Ajouter photo</label>
    <small>jpg, png : 4mo max</small>`;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "modal-file-input";
  fileInput.accept = "image/jpeg, image/png";
  fileInput.className = "modal-file-input";

  uploadZone.appendChild(placeholder);
  uploadZone.appendChild(fileInput);

  const labelTitle = document.createElement("label");
  labelTitle.htmlFor = "modal-title-input";
  labelTitle.textContent = "Titre";
  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.id = "modal-title-input";
  inputTitle.name = "title";
  inputTitle.required = true;

  const labelCategory = document.createElement("label");
  labelCategory.htmlFor = "modal-category-select";
  labelCategory.textContent = "Catégorie";
  const selectCategory = document.createElement("select");
  selectCategory.id = "modal-category-select";
  selectCategory.name = "category";
  selectCategory.required = true;
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "";
  selectCategory.appendChild(defaultOpt);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "modal-submit-btn";
  submitBtn.textContent = "Valider";

  form.appendChild(uploadZone);
  form.appendChild(labelTitle);
  form.appendChild(inputTitle);
  form.appendChild(labelCategory);
  form.appendChild(selectCategory);
  form.appendChild(submitBtn);
  form.addEventListener("submit", (e) => e.preventDefault());

  viewAdd.appendChild(backBtn);
  viewAdd.appendChild(titleAdd);
  viewAdd.appendChild(form);

  inner.appendChild(viewGallery);
  inner.appendChild(viewAdd);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

// ---- Peuplement de la galerie de la modale ----

function populateModalGallery(works) {
  const grid = document.querySelector(".modal-works-grid");
  if (!grid) return;
  grid.innerHTML = "";
  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.className = "modal-figure";

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "modal-delete-btn";
    deleteBtn.setAttribute("aria-label", `Supprimer ${work.title}`);

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "./assets/icons/trash-can-solid.svg";
    deleteIcon.alt = "";
    deleteIcon.width = 9;
    deleteIcon.height = 11;
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.addEventListener("click", () => deleteWork(work, deleteBtn));

    figure.appendChild(img);
    figure.appendChild(deleteBtn);
    grid.appendChild(figure);
  });
}

async function deleteWork(work, deleteBtn) {
  const token = localStorage.getItem("token");

  deleteBtn.disabled = true;
  try {
    const response = await fetch(`${worksUrl}/${work.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    allWorks = allWorks.filter((project) => project.id !== work.id);
    renderWorks(allWorks);
    populateModalGallery(allWorks);
    if (modal !== null) modal.querySelector(".js-modal-close").focus();
  } catch (error) {
    window.alert("Impossible de supprimer le projet. Veuillez réessayer.");
  } finally {
    deleteBtn.disabled = false;
  }
}

// ---- Navigation entre les deux vues ----

function switchToAddView() {
  document.getElementById("modal-view-gallery").style.display = "none";
  document.getElementById("modal-view-add").style.display = "";
}

function switchToGalleryView() {
  document.getElementById("modal-view-add").style.display = "none";
  document.getElementById("modal-view-gallery").style.display = "";
}

// ---- Initialisation ----

buildModal();

document.querySelectorAll(".js-modal").forEach((el) => {
  el.addEventListener("click", openModal);
});

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.key === "Esc") closeModal(e);
  if (e.key === "Tab" && modal !== null) focusInModal(e);
});
