// Force scroll to top on load (Prevents scroll-restoration jumping to bottom)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ==========================================
// CATEGORIES DATA
// ==========================================
const categories = [
    { name: 'Bienestar Sexual', icon: '❤️', key: 'Bienestar Sexual' },
    { name: 'Cuidado & Prevención', icon: '🛡️', key: 'Cuidado & Prevención' },
    { name: 'Bebés', icon: '🍼', key: 'Bebés' },
    { name: 'Dermocosméticos', icon: '✨', key: 'Dermocosméticos' },
    { name: 'Cuidado Personal', icon: '🪥', key: 'Cuidado Personal' },
    { name: 'Alimentos y Hogar', icon: '🧹', key: 'Alimentos y Hogar' }
];

// ==========================================
// STATE
// ==========================================
let products = [];
let filteredProducts = [];
let activeCategory = null;
let searchQuery = '';

const categoryStrip = document.getElementById('categoryStrip');
const recomGrid = document.getElementById('recomGrid');

// ==========================================
// RENDER CATEGORIES (with filter support)
// ==========================================
function renderCategories() {
    categoryStrip.innerHTML = categories.map(cat => `
        <div class="fahorro-cat-card" data-category="${cat.key}">
            <div class="fahorro-cat-img">${cat.icon}</div>
            <div class="fahorro-cat-label">${cat.name}</div>
        </div>
    `).join('');

    // Attach filter click events
    categoryStrip.querySelectorAll('.fahorro-cat-card').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.dataset.category;
            if (activeCategory === key) {
                activeCategory = null;
                card.classList.remove('active');
            } else {
                categoryStrip.querySelectorAll('.fahorro-cat-card').forEach(c => c.classList.remove('active'));
                activeCategory = key;
                card.classList.add('active');
            }
            applyFilters();
        });
    });
}

// ==========================================
// RENDER PRODUCTS
// ==========================================
// ==========================================
// RENDER PRODUCTS (with Skeleton support)
// ==========================================
function renderProducts(list, isInitial = false) {
    if (isInitial) {
        recomGrid.innerHTML = Array(4).fill(0).map(() => `
            <div class="skeleton-card"></div>
        `).join('');
        return;
    }

    if (!list) list = filteredProducts.length > 0 ? filteredProducts : products;
    if (list.length === 0) {
        recomGrid.innerHTML = `<div style="padding:2rem;color:var(--text-muted);font-weight:700;">Sin resultados para tu búsqueda.</div>`;
        return;
    }
    recomGrid.innerHTML = list.map((p, idx) => `
        <div class="premium-card animate-on-scroll" data-product-idx="${idx}" style="cursor:pointer;">
            ${p.badge ? `<div class="card-badge">${p.badge}</div>` : ''}
            <div class="card-img">${p.icon}</div>
            <div class="card-brand">${p.brand}</div>
            <div class="card-title">${p.name}</div>
            ${p.meta ? `<div class="card-meta">${p.meta}</div>` : ''}
            <div class="card-price-row">
                ${p.oldPrice ? `<div class="price-old">$${p.oldPrice.toFixed(2)} MXN</div>` : ''}
                <div class="price-now">$${p.price.toFixed(2)}</div>
            </div>
            <a href="https://wa.me/5218332996555?text=Hola,%20quisiera%20consultar%20disponibilidad%20de%20${encodeURIComponent(p.brand)}%20${encodeURIComponent(p.name)}" 
               target="_blank" class="btn-premium" onclick="event.stopPropagation()">Pedir por WhatsApp</a>
        </div>
    `).join('');

    // Attach click-to-modal events
    recomGrid.querySelectorAll('.premium-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-premium')) return; // don't open modal when clicking WA button
            const idx = parseInt(card.dataset.productIdx);
            openProductModal(list[idx]);
        });
    });

    // Trigger intersection observer for new cards
    observeScrollElements();
}

// ==========================================
// APPLY FILTERS (search + category)
// ==========================================
function applyFilters() {
    let result = [...products];
    if (activeCategory) {
        result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.badge && p.badge.toLowerCase().includes(q)) ||
            (p.meta && p.meta.toLowerCase().includes(q))
        );
    }
    filteredProducts = result;
    renderProducts(filteredProducts);
}

// ==========================================
// REAL-TIME SEARCH + SUGGESTIONS
// ==========================================
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

if (searchInput && searchSuggestions) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        applyFilters();
        renderSuggestions();
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.remove('active');
        }
    });
}

function renderSuggestions() {
    if (searchQuery.length < 2) {
        searchSuggestions.classList.remove('active');
        return;
    }

    const matches = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    if (matches.length > 0) {
        searchSuggestions.innerHTML = matches.map(p => `
            <div class="suggestion-item" data-id="${p.id || p.name}">
                <div class="sugg-img">${p.icon}</div>
                <div class="sugg-info">
                    <div class="sugg-name">${p.name}</div>
                    <div class="sugg-brand">${p.brand}</div>
                    <div class="sugg-price">$${p.price.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
        searchSuggestions.classList.add('active');

        searchSuggestions.querySelectorAll('.suggestion-item').forEach((item, idx) => {
            item.addEventListener('click', () => {
                openProductModal(matches[idx]);
                searchSuggestions.classList.remove('active');
                searchInput.value = '';
                searchQuery = '';
                applyFilters();
            });
        });
    } else {
        searchSuggestions.classList.remove('active');
    }
}

// ==========================================
// PRODUCT MODAL (Enhanced)
// ==========================================
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const qtyInput = document.getElementById('qtyInput');
const qtyPlus = document.getElementById('qtyPlus');
const qtyMinus = document.getElementById('qtyMinus');

let currentModalProduct = null;

function openProductModal(p) {
    currentModalProduct = p;
    
    // Set Image or Icon
    const imgContainer = document.getElementById('modalImageContainer');
    const iconEl = document.getElementById('modalIcon');
    if (p.image) {
        imgContainer.style.backgroundImage = `url('${p.image}')`;
        imgContainer.style.display = 'block';
        iconEl.style.display = 'none';
    } else {
        imgContainer.style.display = 'none';
        iconEl.style.display = 'block';
        iconEl.textContent = p.icon;
    }

    document.getElementById('modalBrand').textContent = p.brand;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalMeta').textContent = p.meta || '';
    
    const badgeEl = document.getElementById('modalBadge');
    badgeEl.textContent = p.badge || '';
    badgeEl.style.display = p.badge ? 'inline-block' : 'none';
    
    document.getElementById('modalPrice').textContent = `$${p.price.toFixed(2)} MXN`;
    
    const oldPriceEl = document.getElementById('modalOldPrice');
    if (p.oldPrice) {
        oldPriceEl.textContent = `$${p.oldPrice.toFixed(2)} MXN`;
        oldPriceEl.style.display = 'inline';
    } else {
        oldPriceEl.style.display = 'none';
    }

    qtyInput.value = 1;
    updateModalWaBtn();
    productModal.classList.add('active');
}

function updateModalWaBtn() {
    if (!currentModalProduct) return;
    const qty = qtyInput.value;
    const waUrl = `https://wa.me/5218332996555?text=Hola,%20quisiera%20consultar%20disponibilidad%20de%20${qty}%20pza(s)%20de%20${encodeURIComponent(currentModalProduct.brand)}%20${encodeURIComponent(currentModalProduct.name)}`;
    document.getElementById('modalWaBtn').href = waUrl;
}

if (qtyPlus) qtyPlus.addEventListener('click', () => { qtyInput.value = parseInt(qtyInput.value) + 1; updateModalWaBtn(); });
if (qtyMinus) qtyMinus.addEventListener('click', () => { if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1; updateModalWaBtn(); });
if (qtyInput) qtyInput.addEventListener('change', updateModalWaBtn);

if (closeProductModal) {
    closeProductModal.addEventListener('click', () => productModal.classList.remove('active'));
}
if (productModal) {
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) productModal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') productModal.classList.remove('active');
    });
}

// ==========================================
// TOAST SYSTEM
// ==========================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<div class="toast-icon">✓</div> <span>${message}</span>`;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

// ==========================================
// CATEGORIES DROPDOWN TOGGLE
// ==========================================
const navCatTrigger = document.getElementById('navCatTrigger');
if (navCatTrigger) {
    navCatTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        navCatTrigger.classList.toggle('open');
        navCatTrigger.setAttribute('aria-expanded', navCatTrigger.classList.contains('open'));
    });

    // Click on a category item → filter products + close menu
    navCatTrigger.querySelectorAll('.nav-cat-dropdown a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.dataset.cat;
            // Toggle active state
            if (activeCategory === cat) {
                activeCategory = null;
            } else {
                activeCategory = cat;
            }
            navCatTrigger.classList.remove('open');
            navCatTrigger.setAttribute('aria-expanded', 'false');
            // Scroll to products section
            document.getElementById('recomGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            applyFilters();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        navCatTrigger.classList.remove('open');
        navCatTrigger.setAttribute('aria-expanded', 'false');
    });
}


// ==========================================
// SCROLL FADE-IN (IntersectionObserver)
// ==========================================
function observeScrollElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        if (!el.classList.contains('visible')) observer.observe(el);
    });
}
// Initial observe after page load
window.addEventListener('load', observeScrollElements);

// ==========================================
// CONTACT FORM → WHATSAPP + TOAST
// ==========================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name     = document.getElementById('cName').value.trim();
        const phone    = document.getElementById('cPhone').value.trim();
        const category = document.getElementById('cCategory').value;
        const message  = document.getElementById('cMessage').value.trim();
        if (!name || !phone || !message) {
            alert('Por favor completa todos los campos requeridos.');
            return;
        }
        
        showToast('¡Gracias! Abriendo WhatsApp...');
        
        setTimeout(() => {
            const text = `Hola, soy ${name} (${phone}). Categoría: ${category}. Mensaje: ${message}`;
            window.open(`https://wa.me/5218332996555?text=${encodeURIComponent(text)}`, '_blank');
        }, 1500);
    });
}

// ==========================================
// AUTHENTICATION SYSTEM
// ==========================================
const authTrigger = document.getElementById('authTrigger');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const userNameDisplay = document.getElementById('userName');

window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('farmalike_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        userNameDisplay.innerText = `Hola, ${user.name.split(' ')[0]}`;
    }
});

authTrigger.addEventListener('click', () => authModal.classList.add('active'));
closeModal.addEventListener('click', () => authModal.classList.remove('active'));

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value
    };
    localStorage.setItem('farmalike_user', JSON.stringify(newUser));
    alert('¡Usuario creado con éxito! Bienvenido a Farmacias Madero.');
    userNameDisplay.innerText = `Hola, ${newUser.name.split(' ')[0]}`;
    authModal.classList.remove('active');
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Inicio de sesión exitoso.');
    authModal.classList.remove('active');
});

const togglePass = document.getElementById('togglePass');
const regPass = document.getElementById('regPass');

togglePass.addEventListener('click', () => {
    const type = regPass.getAttribute('type') === 'password' ? 'text' : 'password';
    regPass.setAttribute('type', type);
    togglePass.textContent = type === 'password' ? '👁️‍🗨️' : '👁️';
});

regPass.addEventListener('input', () => {
    const val = regPass.value;
    const isLongEnough = val.length >= 6 && val.length <= 15;
    document.getElementById('reqLength').classList.toggle('valid', isLongEnough);
    const hasLetter = /[a-zA-Z]/.test(val);
    document.getElementById('reqLetter').classList.toggle('valid', hasLetter);
    const hasNumber = /\d/.test(val);
    document.getElementById('reqNumber').classList.toggle('valid', hasNumber);
});

// ==========================================
// HERO SLIDER
// ==========================================
const slider = document.getElementById('promoSlider');
const btnPrev = document.getElementById('sliderPrev');
const btnNext = document.getElementById('sliderNext');
const dotsContainer = document.getElementById('sliderDots');

if (slider) {
    const slides = slider.querySelectorAll('.promo-slide');
    const totalSlides = slides.length;
    let currentSlide = 0;

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => { currentSlide = i; updateSlider(); });
            dotsContainer.appendChild(dot);
        }
    }

    function updateSlider() {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        if (dotsContainer) {
            dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
    }

    if (btnNext && btnPrev) {
        btnNext.addEventListener('click', () => { currentSlide = (currentSlide + 1) % totalSlides; updateSlider(); });
        btnPrev.addEventListener('click', () => { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSlider(); });
        setInterval(() => { currentSlide = (currentSlide + 1) % totalSlides; updateSlider(); }, 5000);
    }
}

// ==========================================
// PRODUCT CAROUSEL NAVIGATION
// ==========================================
const recomCarousel = document.getElementById('recomGrid');
const recomPrevArrow = document.getElementById('recomPrev');
const recomNextArrow = document.getElementById('recomNext');

if (recomCarousel && recomPrevArrow && recomNextArrow) {
    recomNextArrow.addEventListener('click', () => recomCarousel.scrollBy({ left: recomCarousel.clientWidth, behavior: 'smooth' }));
    recomPrevArrow.addEventListener('click', () => recomCarousel.scrollBy({ left: -recomCarousel.clientWidth, behavior: 'smooth' }));
}

// ==========================================
// HAMBURGER MENU TOGGLE
// ==========================================
const hamburgerBtn = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.header-bottom');
if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', () => {
        const expanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
        hamburgerBtn.setAttribute('aria-expanded', String(!expanded));
        mobileNav.classList.toggle('open');
    });
}

// ==========================================
// INITIALIZE: Fetch products → render
// ==========================================
renderCategories();
renderProducts(null, true); // Show skeletons

fetch('assets/products.json')
    .then(r => r.json())
    .then(data => {
        // Subtle delay to show skeleton polish
        setTimeout(() => {
            products = data;
            filteredProducts = data;

            // Check if user came from another page with a category selected
            const startCat = localStorage.getItem('farma_start_cat');
            if (startCat) {
                activeCategory = startCat;
                applyFilters();
                localStorage.removeItem('farma_start_cat');
                // Scroll to products
                document.getElementById('productos').scrollIntoView({behavior:'smooth'});
            } else {
                renderProducts(data);
            }
            renderCategories();
        }, 800);
    })
    .catch(err => console.error('Error cargando productos:', err));

// ==========================================
// MOBILE OVERLAY MENU LOGIC (Fahorro Style)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtns = document.querySelectorAll('.hamburger');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const tabMenu = document.getElementById('tabMenu');
    const tabCuenta = document.getElementById('tabCuenta');
    const contentMenu = document.getElementById('contentMenu');
    const contentCuenta = document.getElementById('contentCuenta');

    if (mobileMenuOverlay) {
        hamburgerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                mobileMenuOverlay.classList.add('open');
                document.body.classList.add('menu-open');
            });
        });

        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('open');
                document.body.classList.remove('menu-open');
            });
        }

        // Tab switching
        if (tabMenu && tabCuenta) {
            tabMenu.addEventListener('click', () => {
                tabMenu.classList.add('active');
                tabCuenta.classList.remove('active');
                contentMenu.style.display = 'flex';
                contentCuenta.style.display = 'none';
                contentMenu.classList.add('active');
                contentCuenta.classList.remove('active');
            });

            tabCuenta.addEventListener('click', () => {
                tabCuenta.classList.add('active');
                tabMenu.classList.remove('active');
                contentCuenta.style.display = 'flex';
                contentMenu.style.display = 'none';
                contentCuenta.classList.add('active');
                contentMenu.classList.remove('active');
            });
        }

        // Mobile "Iniciar Sesion" button in overlay
        const mobileLoginBtnOverlay = document.getElementById('mobileLoginBtnOverlay');
        if (mobileLoginBtnOverlay) {
            mobileLoginBtnOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                mobileMenuOverlay.classList.remove('open');
                document.body.classList.remove('menu-open');
                const modal = document.getElementById('authModal');
                if (modal) {
                    modal.classList.add('active');
                    modal.style.display = 'flex';
                }
            });
        }
    }
});
