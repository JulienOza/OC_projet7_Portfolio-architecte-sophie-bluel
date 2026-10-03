const focusableSelector = "button, a, input, textarea, select";
let modal = null,
  focusables = [],
  previouslyFocusedElement = null;
let isSubmitting = false;

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
    (element) => element.offsetParent !== null && !element.disabled,
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
    (element) => element.offsetParent !== null && !element.disabled,
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
  form.noValidate = true;

  const uploadZone = document.createElement("div");
  uploadZone.className = "modal-upload-zone";

  const preview = document.createElement("img");
  preview.id = "modal-preview";
  preview.className = "modal-preview";
  preview.alt = "Aperçu de la photo sélectionnée";
  preview.hidden = true;

  const placeholder = document.createElement("div");
  placeholder.className = "upload-placeholder";
  placeholder.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#cbd6e2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
    <button type="button" class="upload-label">+ Ajouter photo</button>
    <small>jpg, png : 4mo max</small>`;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "modal-file-input";
  fileInput.accept = "image/jpeg, image/png";
  fileInput.className = "modal-file-input";
  fileInput.hidden = true;
  fileInput.addEventListener("change", handleFilePreview);
  placeholder.querySelector(".upload-label").addEventListener("click", () => {
    fileInput.click();
  });

  uploadZone.appendChild(preview);
  uploadZone.appendChild(placeholder);
  uploadZone.appendChild(fileInput);

  const changePhoto = document.createElement("button");
  changePhoto.id = "modal-change-photo";
  changePhoto.type = "button";
  changePhoto.textContent = "Changer de photo";
  changePhoto.hidden = true;
  changePhoto.addEventListener("click", () => fileInput.click());

  const labelTitle = document.createElement("label");
  labelTitle.htmlFor = "modal-title-input";
  labelTitle.textContent = "Titre";
  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.id = "modal-title-input";
  inputTitle.name = "title";
  inputTitle.required = true;
  inputTitle.addEventListener("input", updateSubmitButton);

  const labelCategory = document.createElement("label");
  labelCategory.htmlFor = "modal-category-select";
  labelCategory.textContent = "Catégorie";
  const selectCategory = document.createElement("select");
  selectCategory.id = "modal-category-select";
  selectCategory.name = "category";
  selectCategory.required = true;
  selectCategory.addEventListener("change", updateSubmitButton);
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "";
  selectCategory.appendChild(defaultOpt);

  const formSeparator = document.createElement("hr");
  formSeparator.className = "modal-separator";

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "modal-submit-btn";
  submitBtn.textContent = "Valider";
  submitBtn.disabled = true;

  const formStatus = document.createElement("p");
  formStatus.id = "modal-form-status";
  formStatus.setAttribute("role", "status");
  formStatus.hidden = true;

  form.appendChild(uploadZone);
  form.appendChild(changePhoto);
  form.appendChild(labelTitle);
  form.appendChild(inputTitle);
  form.appendChild(labelCategory);
  form.appendChild(selectCategory);
  form.appendChild(formSeparator);
  form.appendChild(submitBtn);
  form.appendChild(formStatus);
  form.addEventListener("submit", handleAddWork);

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

function showFormStatus(message, success = false) {
  const status = document.getElementById("modal-form-status");
  status.textContent = message;
  status.dataset.success = success;
  status.hidden = !message;
}

function resetPhotoPreview() {
  const preview = document.getElementById("modal-preview");
  if (preview.getAttribute("src")) URL.revokeObjectURL(preview.src);
  preview.removeAttribute("src");
  preview.hidden = true;
  document.querySelector(".upload-placeholder").hidden = false;
  document.getElementById("modal-change-photo").hidden = true;
  updateSubmitButton();
}

function validatePhoto(file) {
  if (!file) return "Veuillez sélectionner une photo.";
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return "La photo doit être au format JPG ou PNG.";
  }
  if (file.size > 4 * 1024 * 1024) {
    return "La photo ne doit pas dépasser 4 Mo.";
  }
  return "";
}

function updateSubmitButton() {
  const file = document.getElementById("modal-file-input").files[0];
  const title = document.getElementById("modal-title-input").value.trim();
  const category = document.getElementById("modal-category-select");
  document.querySelector(".modal-submit-btn").disabled =
    isSubmitting ||
    Boolean(validatePhoto(file)) ||
    !title ||
    !category.value ||
    category.disabled;
}

function handleFilePreview(event) {
  resetPhotoPreview();
  const file = event.target.files[0];
  const error = validatePhoto(file);
  showFormStatus(error);
  if (error) return;

  const preview = document.getElementById("modal-preview");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  document.querySelector(".upload-placeholder").hidden = true;
  document.getElementById("modal-change-photo").hidden = false;
  updateSubmitButton();
}

async function loadModalCategories() {
  const select = document.getElementById("modal-category-select");
  if (select.disabled) return;
  select.disabled = true;
  updateSubmitButton();
  try {
    const response = await fetch(categoriesUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const categories = await response.json();
    if (!Array.isArray(categories))
      throw new Error("Invalid categories response");
    select.replaceChildren(select.options[0]);
    for (const category of categories) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    }
  } catch (error) {
    showFormStatus("Impossible de charger les catégories. Veuillez réessayer.");
  } finally {
    select.disabled = false;
    updateSubmitButton();
  }
}

async function handleAddWork(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitBtn = form.querySelector(".modal-submit-btn");
  if (submitBtn.disabled) return;
  const file = document.getElementById("modal-file-input").files[0];
  const title = document.getElementById("modal-title-input").value.trim();
  const category = document.getElementById("modal-category-select");
  const photoError = validatePhoto(file);
  if (photoError) {
    showFormStatus(photoError);
    return;
  }
  if (!title || !category.value || category.disabled) {
    showFormStatus(
      "Veuillez renseigner le titre et sélectionner une catégorie.",
    );
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", title);
  formData.append("category", category.value);

  isSubmitting = true;
  updateSubmitButton();
  submitBtn.textContent = "Envoi...";
  showFormStatus("");
  try {
    const response = await fetch(worksUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    if (!response.ok) {
      showFormStatus(
        `Ajout impossible (HTTP ${response.status}). Veuillez réessayer.`,
      );
      return;
    }
    const work = await response.json();
    allWorks.push(work);
    renderWorks(allWorks);
    populateModalGallery(allWorks);
    form.reset();
    resetPhotoPreview();
    showFormStatus("Le projet a été ajouté.", true);
  } catch (error) {
    showFormStatus(
      "Impossible de contacter le serveur ou de lire sa réponse. Veuillez réessayer.",
    );
  } finally {
    isSubmitting = false;
    submitBtn.textContent = "Valider";
    updateSubmitButton();
  }
}

function switchToAddView() {
  document.getElementById("modal-view-gallery").style.display = "none";
  document.getElementById("modal-view-add").style.display = "";
  showFormStatus("");
  loadModalCategories();
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
