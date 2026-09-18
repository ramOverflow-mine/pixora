const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");

const fileInput = document.getElementById("fileInput");
const uploadPreview = document.getElementById("uploadPreview");
const captionInput = document.getElementById("captionInput");
const publishBtn = document.getElementById("publishBtn");

const authModal = document.getElementById("authModal");
const viewModal = document.getElementById("viewModal");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");
const switchAuth = document.getElementById("switchAuth");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let isRegister = false;
let selectedFile = null;
let currentMediaId = null;

/* =========================
   STORAGE
========================= */

let users = JSON.parse(localStorage.getItem("pixora_users")) || [];

let currentUser =
    JSON.parse(localStorage.getItem("pixora_current_user")) || null;

let media = JSON.parse(localStorage.getItem("pixora_media")) || [];


/* =========================
   DEMO CONTENT
========================= */

if (media.length === 0) {
    media = [
        {
            id: Date.now() + 1,
            type: "image",
            src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
            author: "pixora",
            caption: "Beautiful morning",
            likes: 24,
            likedBy: []
        },
        {
            id: Date.now() + 2,
            type: "image",
            src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
            author: "travel",
            caption: "Somewhere in the mountains",
            likes: 47,
            likedBy: []
        },
        {
            id: Date.now() + 3,
            type: "image",
            src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
            author: "ocean",
            caption: "Ocean vibes 🌊",
            likes: 81,
            likedBy: []
        },
        {
            id: Date.now() + 4,
            type: "image",
            src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80",
            author: "sunset",
            caption: "Golden hour",
            likes: 62,
            likedBy: []
        }
    ];

    saveMedia();
}


/* =========================
   SAVE
========================= */

function saveMedia() {
    localStorage.setItem("pixora_media", JSON.stringify(media));
}

function saveUsers() {
    localStorage.setItem("pixora_users", JSON.stringify(users));
}

function saveCurrentUser() {
    localStorage.setItem(
        "pixora_current_user",
        JSON.stringify(currentUser)
    );
}


/* =========================
   RENDER GALLERY
========================= */

function renderGallery(filter = "all") {

    gallery.innerHTML = "";

    const filtered = media.filter(item => {
        return filter === "all" || item.type === filter;
    });

    emptyState.style.display =
        filtered.length === 0 ? "block" : "none";

    filtered.forEach(item => {

        const card = document.createElement("div");
        card.className = "media-card";

        let mediaElement = "";

        if (item.type === "video") {
            mediaElement = `
                <video src="${item.src}" muted></video>
            `;
        } else {
            mediaElement = `
                <img src="${item.src}" alt="">
            `;
        }

        const isLiked =
            currentUser &&
            item.likedBy &&
            item.likedBy.includes(currentUser.username);

        card.innerHTML = `
            ${mediaElement}

            <div class="media-overlay">

                <div class="media-bottom">

                    <div>
                        <div class="author">
                            @${escapeHtml(item.author)}
                        </div>

                        <div class="caption">
                            ${escapeHtml(item.caption || "")}
                        </div>
                    </div>

                    <button
                        class="like-btn ${isLiked ? "liked" : ""}"
                        data-like="${item.id}">
                        ${isLiked ? "♥" : "♡"} ${item.likes}
                    </button>

                </div>

            </div>
        `;

        card.addEventListener("click", event => {

            if (event.target.closest(".like-btn")) {
                return;
            }

            openViewer(item);
        });

        const likeButton =
            card.querySelector(".like-btn");

        likeButton.addEventListener("click", event => {
            event.stopPropagation();
            toggleLike(item.id);
        });

        gallery.appendChild(card);
    });
}


/* =========================
   LIKE
========================= */

function toggleLike(id) {

    if (!currentUser) {
        showToast("Сначала войдите в аккаунт");
        openAuth(false);
        return;
    }

    const item = media.find(x => x.id === id);

    if (!item) return;

    if (!item.likedBy) {
        item.likedBy = [];
    }

    const index =
        item.likedBy.indexOf(currentUser.username);

    if (index === -1) {
        item.likedBy.push(currentUser.username);
        item.likes++;
    } else {
        item.likedBy.splice(index, 1);
        item.likes = Math.max(0, item.likes - 1);
    }

    saveMedia();
    renderGallery();

    if (currentMediaId === id) {
        updateModalLike(item);
    }
}


/* =========================
   VIEWER
========================= */

function openViewer(item) {

    currentMediaId = item.id;

    const modalMedia =
        document.getElementById("modalMedia");

    if (item.type === "video") {

        modalMedia.innerHTML = `
            <video
                src="${item.src}"
                controls
                autoplay>
            </video>
        `;

    } else {

        modalMedia.innerHTML = `
            <img src="${item.src}" alt="">
        `;
    }

    document.getElementById("modalAuthor").textContent =
        "@" + item.author;

    document.getElementById("modalCaption").textContent =
        item.caption || "";

    updateModalLike(item);

    viewModal.classList.add("show");
}

function updateModalLike(item) {

    const button =
        document.getElementById("modalLike");

    const liked =
        currentUser &&
        item.likedBy &&
        item.likedBy.includes(currentUser.username);

    button.innerHTML =
        `${liked ? "♥" : "♡"} <span>${item.likes}</span>`;

    button.style.color =
        liked ? "#fb3d72" : "white";
}

document
    .getElementById("modalLike")
    .addEventListener("click", () => {

        if (currentMediaId !== null) {
            toggleLike(currentMediaId);
        }
    });

document
    .getElementById("viewClose")
    .addEventListener("click", () => {
        viewModal.classList.remove("show");
    });


/* =========================
   AUTH
========================= */

function openAuth(register = false) {

    isRegister = register;

    authMessage.textContent = "";

    authForm.reset();

    if (register) {

        authTitle.textContent = "Регистрация";

        authSubtitle.textContent =
            "Создай свой аккаунт Pixora";

        usernameInput.style.display = "block";

        document.querySelector(".auth-submit").textContent =
            "Создать аккаунт";

        switchAuth.textContent =
            "Уже есть аккаунт? Войти";

    } else {

        authTitle.textContent = "Вход";

        authSubtitle.textContent =
            "Войди в свой аккаунт Pixora";

        usernameInput.style.display = "none";

        document.querySelector(".auth-submit").textContent =
            "Войти";

        switchAuth.textContent =
            "Нет аккаунта? Зарегистрироваться";
    }

    authModal.classList.add("show");
}

document
    .getElementById("loginOpen")
    .addEventListener("click", () => openAuth(false));

document
    .getElementById("registerOpen")
    .addEventListener("click", () => openAuth(true));

document
    .getElementById("authClose")
    .addEventListener("click", () => {
        authModal.classList.remove("show");
    });

switchAuth.addEventListener("click", () => {
    openAuth(!isRegister);
});


/* =========================
   LOGIN / REGISTER
========================= */

authForm.addEventListener("submit", event => {

    event.preventDefault();

    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;

    if (isRegister) {

        const username =
            usernameInput.value.trim();

        if (users.some(u => u.email === email)) {
            authMessage.textContent =
                "Пользователь с таким email уже существует.";
            return;
        }

        if (users.some(u => u.username === username)) {
            authMessage.textContent =
                "Это имя пользователя уже занято.";
            return;
        }

        const user = {
            username,
            email,
            password
        };

        users.push(user);
        saveUsers();

        currentUser = {
            username,
            email
        };

        saveCurrentUser();

        authModal.classList.remove("show");

        updateAccount();

        showToast("Аккаунт успешно создан 🎉");

    } else {

        const user =
            users.find(
                u =>
                    u.email === email &&
                    u.password === password
            );

        if (!user) {

            authMessage.textContent =
                "Неверный email или пароль.";

            return;
        }

        currentUser = {
            username: user.username,
            email: user.email
        };

        saveCurrentUser();

        authModal.classList.remove("show");

        updateAccount();

        renderGallery();

        showToast(`Добро пожаловать, ${user.username}!`);
    }
});


/* =========================
   ACCOUNT UI
========================= */

function updateAccount() {

    const accountArea =
        document.getElementById("accountArea");

    if (!currentUser) {

        accountArea.innerHTML = `
            <button class="login-btn" id="loginOpen">
                Войти
            </button>

            <button class="register-btn" id="registerOpen">
                Регистрация
            </button>
        `;

    } else {

        accountArea.innerHTML = `
            <button class="login-btn" id="logoutBtn">
                @${escapeHtml(currentUser.username)}
            </button>

            <button class="register-btn" id="logoutBtn2">
                Выйти
            </button>
        `;

        document
            .getElementById("logoutBtn")
            .addEventListener("click", logout);

        document
            .getElementById("logoutBtn2")
            .addEventListener("click", logout);
    }

    if (!currentUser) {

        document
            .getElementById("loginOpen")
            .addEventListener("click", () => openAuth(false));

        document
            .getElementById("registerOpen")
            .addEventListener("click", () => openAuth(true));
    }
}

function logout() {

    currentUser = null;

    localStorage.removeItem("pixora_current_user");

    updateAccount();
    renderGallery();

    showToast("Вы вышли из аккаунта");
}


/* =========================
   FILE UPLOAD
========================= */

fileInput.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    selectedFile = file;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {

        uploadPreview.innerHTML = `
            <img src="${url}" alt="preview">
        `;

    } else if (file.type.startsWith("video/")) {

        uploadPreview.innerHTML = `
            <video src="${url}" controls></video>
        `;
    }
});


publishBtn.addEventListener("click", () => {

    if (!currentUser) {

        showToast("Войдите, чтобы публиковать");

        openAuth(false);

        return;
    }

    if (!selectedFile) {

        showToast("Выберите фото или видео");

        return;
    }

    const reader = new FileReader();

    reader.onload = event => {

        const newMedia = {

            id: Date.now(),

            type: selectedFile.type.startsWith("video/")
                ? "video"
                : "image",

            src: event.target.result,

            author: currentUser.username,

            caption: captionInput.value.trim(),

            likes: 0,

            likedBy: []
        };

        media.unshift(newMedia);

        saveMedia();

        selectedFile = null;

        fileInput.value = "";

        uploadPreview.innerHTML = "";

        captionInput.value = "";

        renderGallery();

        showToast("Публикация добавлена ✨");

        showSection("home");
    };

    reader.readAsDataURL(selectedFile);
});


/* =========================
   NAVIGATION
========================= */

function showSection(section) {

    const uploadSection =
        document.querySelector(".upload-section");

    const homeSection =
        document.querySelector(".hero");

    const gallerySection =
        document.querySelector(".gallery-section");

    if (section === "upload") {

        uploadSection.style.display = "block";
        homeSection.style.display = "none";
        gallerySection.style.display = "none";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } else {

        uploadSection.style.display = "none";
        homeSection.style.display = "flex";
        gallerySection.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}

document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn =>
                btn.classList.remove("active")
            );

        button.classList.add("active");

        showSection(button.dataset.section);
    });
});

document
    .getElementById("heroUpload")
    .addEventListener("click", () => {

        if (!currentUser) {
            openAuth(false);
            return;
        }

        showSection("upload");
    });


/* =========================
   FILTERS
========================= */

document.querySelectorAll(".filter").forEach(button => {

    button.addEventListener("click", () => {

        document
            .querySelectorAll(".filter")
            .forEach(btn =>
                btn.classList.remove("active")
            );

        button.classList.add("active");

        renderGallery(button.dataset.filter);
    });
});


/* =========================
   TOAST
========================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================
   SECURITY / TEXT
========================= */

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   INIT
========================= */

updateAccount();
renderGallery();
