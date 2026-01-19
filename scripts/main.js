// --- 1. Efekt Pisania (Typing Effect) ---
function setupTypingEffect() {
    const roleElement = document.querySelector('.typing-effect');
    if (!roleElement) return;

    const roles = JSON.parse(roleElement.dataset.roles);
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // Szybkość pisania
    let deleteSpeed = 50;  // Szybkość usuwania
    let delayBetweenRoles = 1500; // Opóźnienie przed rozpoczęciem usuwania/nowej roli

    function type() {
        // Obecna rola
        const currentRole = roles[roleIndex % roles.length];
        
        // Tekst do wyświetlenia
        let currentText = isDeleting 
            ? currentRole.substring(0, charIndex - 1)
            : currentRole.substring(0, charIndex + 1);

        roleElement.textContent = currentText;

        // Logika pisania
        if (!isDeleting && charIndex < currentRole.length) {
            charIndex++;
            typingSpeed = 100; // Normalna szybkość
        } else if (isDeleting && charIndex > 0) {
            charIndex--;
            typingSpeed = 50; // Szybkość usuwania
        } else if (!isDeleting && charIndex === currentRole.length) {
            // Skończono pisać, zacznij usuwać po opóźnieniu
            isDeleting = true;
            typingSpeed = delayBetweenRoles;
        } else if (isDeleting && charIndex === 0) {
            // Skończono usuwać, przejdź do następnej roli
            isDeleting = false;
            roleIndex++;
            typingSpeed = 150; // Krótki czas opóźnienia przed nową rolą
        }

        const nextTimeout = isDeleting && charIndex === 0 ? delayBetweenRoles : typingSpeed;
        setTimeout(type, nextTimeout);
    }

    type();
}

// --- 2. Nawigacja Mobilna (Hamburger Menu) ---
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navUl = document.querySelector('#main-header nav ul');

    if (!menuToggle || !navUl) return;

    menuToggle.addEventListener('click', () => {
        navUl.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        
        // Zmiana ikony na 'X' po otwarciu
        if (navUl.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    // Zamknięcie menu po kliknięciu linku (tylko w widoku mobilnym)
    navUl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navUl.classList.remove('active');
                menuToggle.querySelector('i').classList.remove('fa-xmark');
                menuToggle.querySelector('i').classList.add('fa-bars');
            }
        });
    });
}

// --- 3. Przycisk "Powrót na górę" ---
function setupBackToTop() {
    const button = document.querySelector('#back-to-top');
    if (!button) return;

    const showAfterPx = 400;

    function updateVisibility() {
        if (window.scrollY > showAfterPx) button.classList.add('is-visible');
        else button.classList.remove('is-visible');
    }

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
}

// --- 4. Scrollspy (podświetlanie aktywnej sekcji w menu) ---
function setupScrollSpy() {
    const header = document.querySelector('#main-header');
    const navLinks = Array.from(document.querySelectorAll('#main-header nav a[href^="#"]'));
    if (!header || navLinks.length === 0) return;

    const linkById = new Map(
        navLinks
            .map(a => {
                const id = (a.getAttribute('href') || '').slice(1);
                return [id, a];
            })
            .filter(([id]) => id)
    );

    const sections = Array.from(linkById.keys())
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (sections.length === 0) return;

    function setActive(id) {
        navLinks.forEach(a => a.classList.remove('active'));
        const link = linkById.get(id);
        if (link) link.classList.add('active');
    }

    // Fallback gdyby IntersectionObserver był niedostępny
    if (!('IntersectionObserver' in window)) {
        const onScroll = () => {
            const headerH = header.getBoundingClientRect().height;
            const y = window.scrollY + headerH + 24;

            let current = sections[0].id;
            for (const section of sections) {
                if (section.offsetTop <= y) current = section.id;
            }
            setActive(current);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            // bierzemy te sekcje, które są widoczne i wybieramy najbardziej "u góry"
            const visible = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

            if (visible.length > 0) setActive(visible[0].target.id);
        },
        {
            root: null,
            // kompensacja sticky header (góra) + lekkie opóźnienie (dół)
            rootMargin: `-${Math.ceil(header.getBoundingClientRect().height + 10)}px 0px -60% 0px`,
            threshold: [0.01, 0.1, 0.25]
        }
    );

    sections.forEach(section => observer.observe(section));
}

// --- 5. Aktualności (render z JSON) ---
function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDateYYYYMMDD(dateStr) {
    // dateStr: "YYYY-MM-DD"
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        if (!y || !m || !d) return dateStr;
        const dt = new Date(Date.UTC(y, m - 1, d));
        return new Intl.DateTimeFormat('pl-PL', { year: 'numeric', month: 'long', day: '2-digit' }).format(dt);
    } catch {
        return dateStr;
    }
}

function renderNewsItem(item) {
    const date = item?.date ? formatDateYYYYMMDD(item.date) : '';
    const title = item?.title ? escapeHtml(item.title) : '';
    const text = item?.text ? escapeHtml(item.text) : '';
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const links = Array.isArray(item?.links) ? item.links : [];

    const tagsHtml =
        tags.length > 0
            ? `<div class="news-tags">${tags
                  .slice(0, 8)
                  .map(t => `<span class="news-tag">#${escapeHtml(t)}</span>`)
                  .join('')}</div>`
            : '';

    const linksHtml =
        links.length > 0
            ? `<div class="news-links">${links
                  .slice(0, 4)
                  .map(l => {
                      const href = l?.href ? String(l.href) : '';
                      const label = l?.label ? escapeHtml(l.label) : 'Link';
                      const safeHref = escapeHtml(href);
                      if (!safeHref) return '';
                      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
                  })
                  .join('')}</div>`
            : '';

    return `
        <article class="news-card">
            <div class="news-meta">
                ${date ? `<span class="news-date">${escapeHtml(date)}</span>` : ''}
                ${tagsHtml}
            </div>
            ${title ? `<h3 class="news-title">${title}</h3>` : ''}
            ${text ? `<p class="news-text">${text}</p>` : ''}
            ${linksHtml}
        </article>
    `;
}

async function setupNews() {
    // Main page teaser (3 latest)
    const teaserEl = document.querySelector('#news-list');
    // Full feed page
    const feedEl = document.querySelector('#news-feed');

    const emptyEl = document.querySelector('#news-empty');
    if (!teaserEl && !feedEl) return;

    async function load() {
        const res = await fetch('data/news.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`news.json HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('news.json must be an array');
        return data;
    }

    let items = [];
    try {
        items = await load();
    } catch (e) {
        // fallback: gdy ktoś odpali stronę lokalnie przez file:// (fetch może się wywalić)
        items = [];
        console.warn('Nie udało się wczytać data/news.json:', e);
    }

    if (!items || items.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        if (teaserEl) teaserEl.innerHTML = '';
        if (feedEl) feedEl.innerHTML = '';
        return;
    }

    // najnowsze na górze (date desc) — gdy brak daty, na koniec
    items.sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
    if (teaserEl) teaserEl.innerHTML = items.slice(0, 3).map(renderNewsItem).join('');
    if (feedEl) feedEl.innerHTML = items.map(renderNewsItem).join('');
    if (emptyEl) emptyEl.hidden = true;
}

// --- 6. Projekty (render z JSON) ---
function renderProjectItem(item) {
    const title = item?.title ? escapeHtml(item.title) : '';
    const description = item?.description ? escapeHtml(item.description) : '';
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const codeUrl = item?.codeUrl ? String(item.codeUrl) : '';
    const liveUrl = item?.liveUrl ? String(item.liveUrl) : '';
    const image = item?.image ? String(item.image) : '';

    const tagsText = tags.length > 0 ? tags.map(t => `#${t}`).join(' ') : '';

    const imageHtml = image
        ? `<img src="${escapeHtml(image)}" alt="${title ? escapeHtml(title) : 'Projekt'}" style="width:100%;height:100%;object-fit:cover;">`
        : 'Brak zdjęcia';

    const links = [];
    if (codeUrl) {
        links.push(
            `<a href="${escapeHtml(codeUrl)}" target="_blank" rel="noopener noreferrer">Kod <i class="fa-brands fa-github"></i></a>`
        );
    }
    if (liveUrl) {
        links.push(
            `<a href="${escapeHtml(liveUrl)}" target="_blank" rel="noopener noreferrer" class="live-link">Site <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
        );
    }

    return `
        <article class="project-card">
            <figure class="project-figure">
                ${imageHtml}
            </figure>
            <div class="project-info">
                ${title ? `<h3>${title}</h3>` : ''}
                ${tagsText ? `<p class="tags">${escapeHtml(tagsText)}</p>` : ''}
                ${description ? `<p class="project-desc">${description}</p>` : ''}
                ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
            </div>
        </article>
    `;
}

async function setupProjects() {
    // Main page teaser (3 latest)
    const teaserEl = document.querySelector('#projects-list');
    // Full feed page
    const feedEl = document.querySelector('#projects-feed');

    const emptyEl = document.querySelector('#projects-empty');
    if (!teaserEl && !feedEl) return;

    async function load() {
        const res = await fetch('data/projects.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`projects.json HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('projects.json must be an array');
        return data;
    }

    let items = [];
    try {
        items = await load();
    } catch (e) {
        items = [];
        console.warn('Nie udało się wczytać data/projects.json:', e);
    }

    if (!items || items.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        if (teaserEl) teaserEl.innerHTML = '';
        if (feedEl) feedEl.innerHTML = '';
        return;
    }

    // najnowsze na górze (date desc) — gdy brak daty, na koniec
    items.sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
    if (teaserEl) teaserEl.innerHTML = items.slice(0, 3).map(renderProjectItem).join('');
    if (feedEl) feedEl.innerHTML = items.map(renderProjectItem).join('');
    if (emptyEl) emptyEl.hidden = true;
}

// --- 7. Easter Egg - Artemis 2 Gra ---
function setupArtemisEasterEgg() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    let clickCount = 0;
    let clickTimeout;

    logo.addEventListener('click', (e) => {
        e.preventDefault();
        clickCount++;

        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            if (clickCount === 3) {
                window.location.href = 'artemis.html';
            }
            clickCount = 0;
        }, 500);
    });

    // Visual feedback - zmiana kursora
    logo.style.cursor = 'pointer';
}

// --- 3. Główna Funkcja Uruchamiająca ---
document.addEventListener('DOMContentLoaded', () => {
    setupTypingEffect();
    setupMobileMenu();
    setupBackToTop();
    setupScrollSpy();
    setupNews();
    setupProjects();
    setupArtemisEasterEgg();
});
