// JavaScript Document

/*

TemplateMo 597 Neural Glass

https://templatemo.com/tm-597-neural-glass

*/

// Mobile menu functionality
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });

    // Close mobile menu when clicking on links
    document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            mobileNav.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            mobileNav.classList.remove('active');
        }
    });
}

// Enhanced smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');

        // Skip if href is just "#"
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enhanced header functionality
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        const scrolled = window.pageYOffset;
        if (scrolled > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Active menu item highlighting
function updateActiveMenuItem() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');

    let currentSection = '';
    const scrollPos = window.pageYOffset + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveMenuItem);
window.addEventListener('load', updateActiveMenuItem);

// Parallax effect for geometric shapes
window.addEventListener('scroll', () => {
    const shapes = document.querySelectorAll('.shape');
    const scrolled = window.pageYOffset;

    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.3;
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
    });
});

// Neural lines pulse effect
const neuralLines = document.querySelectorAll('.neural-line');
setInterval(() => {
    neuralLines.forEach((line, index) => {
        setTimeout(() => {
            line.style.opacity = '1';
            line.style.transform = 'scaleX(1.2)';
            setTimeout(() => {
                line.style.opacity = '0.2';
                line.style.transform = 'scaleX(0.5)';
            }, 200);
        }, index * 300);
    });
}, 2000);

// Enhanced particle generation
function createQuantumParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = Math.random() * 4 + 1 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = ['#00ffff', '#ff0080', '#8000ff'][Math.floor(Math.random() * 3)];
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '100vh';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '-1';
    particle.style.boxShadow = `0 0 10px ${particle.style.background}`;

    document.body.appendChild(particle);

    const duration = Math.random() * 3000 + 2000;
    const drift = (Math.random() - 0.5) * 200;

    particle.animate([
        { transform: 'translateY(0px) translateX(0px)', opacity: 0 },
        { transform: `translateY(-100vh) translateX(${drift}px)`, opacity: 1 }
    ], {
        duration: duration,
        easing: 'ease-out'
    }).onfinish = () => particle.remove();
}

// Generate quantum particles
setInterval(createQuantumParticle, 1500);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe timeline items and hexagons
document.querySelectorAll('.timeline-content, .hexagon').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// Form submission effect
const submitBtn = document.querySelector('.submit-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        this.innerHTML = 'TRANSMITTING...';
        this.style.background = 'linear-gradient(45deg, #8000ff, #00ffff)';

        setTimeout(() => {
            this.innerHTML = 'TRANSMISSION COMPLETE';
            this.style.background = 'linear-gradient(45deg, #00ff00, #00ffff)';

            setTimeout(() => {
                this.innerHTML = 'TRANSMIT TO MATRIX';
                this.style.background = 'linear-gradient(45deg, #00ffff, #ff0080)';
            }, 2000);
        }, 1500);
    });
}

// ==========================================
// Authentication & UI Logic for Home Page
// ==========================================

let currentUserRole = localStorage.getItem('userRole') || 'agriculteur';
let currentUserName = localStorage.getItem('userName') || 'Agriculteur';
let currentUsersArray = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (token) {
        // --- EAGER UI UPDATE (Immediate Display from Local Storage) ---
        var authLink = document.getElementById('authLinkContainer');
        var menuCont = document.getElementById('userMenuContainer');
        var userNameDisp = document.getElementById('userNameDisplay');
        var initialEl = document.getElementById('userInitialCard');

        if (authLink) authLink.style.display = 'none';
        if (menuCont) {
            menuCont.style.display = 'flex';
            menuCont.style.alignItems = 'center';
        }
        if (userNameDisp) userNameDisp.textContent = currentUserName;
        if (initialEl) initialEl.textContent = currentUserName.charAt(0).toUpperCase();

        // --- VERIFY WITH BACKEND (Optional sync) ---
        try {
            const res = await fetch('/api/user/profile', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const user = await res.json();
                currentUserRole = user.role || currentUserRole;
                currentUserName = user.nom || user.name || currentUserName;

                // Update UI again if data changed
                if (userNameDisp) userNameDisp.textContent = currentUserName;
                if (initialEl) initialEl.textContent = currentUserName.charAt(0).toUpperCase();
            } else if (res.status === 401) {
                // Only log out if specifically unauthorized
                localStorage.removeItem('token');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                window.location.reload();
            }
        } catch (error) {
            console.log('Erreur profil (Mode Local activé hors ligne):', error);
        }
    }

    // Close Dropdown when clicking outside (now managed by navbar.js via closeNavMenu)
    document.addEventListener('click', (e) => {
        const menuContainer = document.getElementById('userMenuContainer');
        const menu = document.getElementById('userDropdownMenu');
        if (menuContainer && !menuContainer.contains(e.target)) {
            if (menu) menu.style.display = 'none';
        }
    });
});

// buildUserDropdown, openSidePanel, renderSidePanelItems are now handled
// exclusively by /components/navbar.js — do NOT re-define them here.

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.reload();
}


async function sendInvite(targetId, btnElement) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/user/invite', {
            method: 'POST',
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetId })
        });

        const data = await res.json();
        if (res.ok) {
            btnElement.textContent = 'Envoyée ✓';
            btnElement.style.background = '#00ff00';
            btnElement.disabled = true;
        } else {
            alert(data.message || "Erreur lors de l'envoi");
            if (data.message === "Vous êtes déjà amis" || data.message === "Invitation déjà envoyée") {
                btnElement.textContent = 'Déjà fait ✓';
                btnElement.disabled = true;
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function acceptInvite(targetId, btnElement) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/user/accept-invite', {
            method: 'POST',
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetId })
        });

        const data = await res.json();
        if (res.ok) {
            btnElement.textContent = 'Accepté ✓';
            btnElement.style.background = '#00ff00';
            btnElement.disabled = true;
            // Optionally remove it after a delay
            setTimeout(() => {
                btnElement.parentElement.remove();
            }, 1000);
        } else {
            alert(data.message || "Erreur lors de l'acceptation");
        }
    } catch (err) {
        console.error(err);
    }
}

// ===== Scroll Reveal & Counter Animation for Stats =====
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, parseInt(delay));

            // Trigger counter animation for stat numbers
            const counter = entry.target.querySelector('[data-count]');
            if (counter && !counter.classList.contains('counted')) {
                counter.classList.add('counted');
                animateCounter(counter);
            }

            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.stats-section [data-animate]').forEach(el => statsObserver.observe(el));

function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            el.textContent = target.toLocaleString() + '+';
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// ===== EXPERT BOUTIQUES FETCH LOGIC =====
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('boutiqueGrid');
    if (!grid) return;

    try {
        let experts = [];
        try {
            const res = await fetch('/api/user/public/experts');
            if (res.ok) {
                experts = await res.json();
            } else {
                throw new Error("API not available");
            }
        } catch (apiErr) {
            // Fallback for offline/no-backend mode
            let savedExperts = localStorage.getItem('allExperts');
            if (savedExperts) {
                try {
                    experts = JSON.parse(savedExperts);
                } catch (e) {
                    console.error("Erreur de lecture des experts:", e);
                }
            }

            if (experts.length === 0) {
                experts = [
                    { id: 1, nom: 'Zahra Benchenni', localisation: 'Alger', specialite: 'Bio' },
                    { id: 2, nom: 'Ahmed Salim', localisation: 'Blida', specialite: 'Agrumes' },
                    { id: 3, nom: 'Karim Yelles', localisation: 'Oran', specialite: 'Céréales' }
                ];
            }

            const lastUserName = localStorage.getItem('userName');
            const lastUserRole = localStorage.getItem('userRole');

            if (lastUserRole === 'expert' && lastUserName) {
                const existingExpertIndex = experts.findIndex(e => e.nom === lastUserName);
                if (existingExpertIndex === -1) {
                    experts.push({ id: Date.now(), nom: lastUserName, localisation: 'Non spécifié', specialite: 'Expertise Générale' });
                }
                localStorage.setItem('allExperts', JSON.stringify(experts));
            }
        }

        if (experts.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #15803d;">Aucune boutique disponible pour le moment.</p>';
            return;
        }

        const isLoggedIn = !!localStorage.getItem('token');
        const role = localStorage.getItem('userRole') || 'agriculteur';
        const baseUrl = role === 'expert' ? 'apres-inscription/expertt/boutique/index.html' : 'apres-inscription/agriculteur/boutique/expert-boutique.html';

        grid.innerHTML = experts.map(expert => {
            const expertName = expert.nom || expert.name || 'Zahra';
            const finalUrl = role === 'expert' ? baseUrl : `${baseUrl}?expert=${encodeURIComponent(expertName)}`;
            return `
            <div class="boutique-card">
                <div class="boutique-photo">👨‍🔬</div>
                <div class="boutique-name">${expertName}</div>
                <div class="boutique-location">📍 ${expert.localisation || 'Non spécifiée'}</div>
                <a href="${isLoggedIn ? finalUrl : 'javascript:void(0)'}" 
                   ${!isLoggedIn ? 'onclick="document.getElementById(\\\'authModal\\\').style.display=\\\'flex\\\'"' : ''}
                   class="boutique-btn ${isLoggedIn ? 'btn-voir' : 'btn-acheter'}">
                    ${isLoggedIn ? 'Voir plus' : 'Acheter'}
                </a>
            </div>
        `}).join('');
    } catch (err) {
        console.error('Erreur globale de chargement des boutiques:', err);
    }
});

// ===== HERO SLIDER LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const dots = document.querySelectorAll('.slider-dot');
    if (slides.length === 0) return;

    let currentSlideIndex = 0;
    let slideInterval;

    const showSlide = (index) => {
        // Handle boundaries
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        // Remove active class
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Add active class
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');

        currentSlideIndex = index;
    };

    const nextSlide = () => showSlide(currentSlideIndex + 1);

    // Auto slide
    const startSlide = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000); // 5 seconds
    };

    // Manual navigation via dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startSlide();
        });
    });

    // Manual navigation via arrows
    const prevSlideBtn = document.getElementById('prevSlide');
    const nextSlideBtn = document.getElementById('nextSlide');

    if (prevSlideBtn) {
        prevSlideBtn.addEventListener('click', () => {
            showSlide(currentSlideIndex - 1);
            startSlide();
        });
    }

    if (nextSlideBtn) {
        nextSlideBtn.addEventListener('click', () => {
            nextSlide();
            startSlide();
        });
    }

    startSlide();
});

// ===== AUTH MODAL LOGIC =====
// ===== STRICT UNOBTRUSIVE AUTH MODAL LOGIC =====

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. LOGIN SUBMISSION ──────────────────────────────────────────
    const modalSignInForm = document.getElementById('modalSignInForm');
    if (modalSignInForm) {
        modalSignInForm.addEventListener('submit', async function(e) {
            // THE LIFESAVER LINE: strictly prevent default HTML GET submission
            e.preventDefault();

            const modalSubmitBtn = document.getElementById('modalSubmitBtn');
            const modalSuccessMsg = document.getElementById('modalSuccessMsg');
            const modalErrorMsg = document.getElementById('modalErrorMsg');

            // Collect form data
            const formData = new FormData(modalSignInForm);
            const data = Object.fromEntries(formData.entries());
            
            if (modalSubmitBtn) modalSubmitBtn.style.opacity = '0.7';
            if (modalErrorMsg) modalErrorMsg.style.display = 'none';
            if (modalSuccessMsg) modalSuccessMsg.style.display = 'none';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    if (modalSuccessMsg) modalSuccessMsg.style.display = 'block';
                    localStorage.setItem('token', result.token || 'auto-login-token');
                    localStorage.setItem('userName', result.userName || data.email.split('@')[0]);
                    localStorage.setItem('userRole', result.role || 'agriculteur');
                    if (result.userId) {
    localStorage.setItem('userId', result.userId);
}
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    if (modalErrorMsg) {
                        modalErrorMsg.textContent = result.message || "Erreur de connexion";
                        modalErrorMsg.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error("Login fetch error:", error);
                localStorage.setItem('token', 'offline-token-fake');
                localStorage.setItem('userName', data.email.split('@')[0] || 'Utilisateur');
                localStorage.setItem('userRole', 'agriculteur');
                
                if (modalSuccessMsg) {
                    modalSuccessMsg.textContent = "Mode Hors Ligne. Transfert...";
                    modalSuccessMsg.style.display = 'block';
                }
                setTimeout(() => window.location.reload(), 1000);
            } finally {
                if (modalSubmitBtn) modalSubmitBtn.style.opacity = '1';
            }
        });
    }

    // ── 2. REGISTER SUBMISSION ───────────────────────────────────────
    const modalSignUpForm = document.getElementById('modalSignUpForm');
    if (modalSignUpForm) {
        modalSignUpForm.addEventListener('submit', async function(e) {
            // THE LIFESAVER LINE
            e.preventDefault();

            const modalRegSubmitBtn = document.getElementById('modalRegSubmitBtn');
            const modalRegSuccessMsg = document.getElementById('modalRegSuccessMsg');
            const modalRegErrorMsg = document.getElementById('modalRegErrorMsg');

            const formData = new FormData(modalSignUpForm);
            const data = Object.fromEntries(formData.entries());
            
            if (modalRegSubmitBtn) modalRegSubmitBtn.style.opacity = '0.7';
            if (modalRegErrorMsg) modalRegErrorMsg.style.display = 'none';
            if (modalRegSuccessMsg) modalRegSuccessMsg.style.display = 'none';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    if (modalRegSuccessMsg) modalRegSuccessMsg.style.display = 'block';
                    localStorage.setItem('token', result.token || 'auto-login-token');
                    localStorage.setItem('userName', data.nom || result.userName || data.email.split('@')[0]);
                    localStorage.setItem('userRole', data.role || 'agriculteur');
                    if (result.userId) {
    localStorage.setItem('userId', result.userId);
}
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    if (modalRegErrorMsg) {
                        modalRegErrorMsg.textContent = result.message || "Erreur d'inscription";
                        modalRegErrorMsg.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error("Register fetch error:", error);
                localStorage.setItem('token', 'offline-token-fake');
                localStorage.setItem('userName', data.nom || data.email.split('@')[0] || 'Utilisateur');
                localStorage.setItem('userRole', data.role || 'agriculteur');
                
                if (modalRegSuccessMsg) {
                    modalRegSuccessMsg.textContent = "Mode Hors Ligne. Création réussie...";
                    modalRegSuccessMsg.style.display = 'block';
                }
                setTimeout(() => window.location.reload(), 1500);
            } finally {
                if (modalRegSubmitBtn) modalRegSubmitBtn.style.opacity = '1';
            }
        });
    }

    // ── 3. MODAL VIEW TOGGLES ────────────────────────────────────────

    const loginView = document.getElementById('modalLoginView');
    const registerView = document.getElementById('modalRegisterView');

    function switchAuthView(view) {
        // Clear forms and errors
        if (modalSignInForm) modalSignInForm.reset();
        if (modalSignUpForm) modalSignUpForm.reset();
        if (document.getElementById('modalErrorMsg')) document.getElementById('modalErrorMsg').style.display = 'none';
        if (document.getElementById('modalRegErrorMsg')) document.getElementById('modalRegErrorMsg').style.display = 'none';
        
        // Reset Role state
        if (document.getElementById('reg_role_hidden')) document.getElementById('reg_role_hidden').value = 'agriculteur';
        if (document.getElementById('code_form_group')) document.getElementById('code_form_group').style.display = 'none';
        if (document.getElementById('reg_code')) {
            document.getElementById('reg_code').required = false;
            document.getElementById('reg_code').value = '';
        }
        if (document.getElementById('roleToggleLink')) document.getElementById('roleToggleLink').innerText = 'vous etes un expert ?';

        if (view === 'register') {
            if (loginView) loginView.style.display = 'none';
            if (registerView) registerView.style.display = 'block';
        } else {
            if (registerView) registerView.style.display = 'none';
            if (loginView) loginView.style.display = 'block';
        }
    }

    const linkToRegister = document.getElementById('linkToRegister');
    if (linkToRegister) {
        linkToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthView('register');
        });
    }

    const linkToLogin = document.getElementById('linkToLogin');
    if (linkToLogin) {
        linkToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthView('login');
        });
    }

    // ── 4. ROLE TOGGLE ("vous etes un expert ?") ─────────────────────
    const roleToggleLink = document.getElementById('roleToggleLink');
    if (roleToggleLink) {
        roleToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const roleInput = document.getElementById('reg_role_hidden');
            const codeGroup = document.getElementById('code_form_group');
            const codeInput = document.getElementById('reg_code');
            
            if (roleInput && roleInput.value === 'agriculteur') {
                roleInput.value = 'expert';
                codeGroup.style.display = 'block';
                codeInput.required = true;
                roleToggleLink.innerText = 'vous etes un agriculteur ?';
            } else if (roleInput) {
                roleInput.value = 'agriculteur';
                codeGroup.style.display = 'none';
                codeInput.required = false;
                codeInput.value = '';
                roleToggleLink.innerText = 'vous etes un expert ?';
            }
        });
       
const nom = document.getElementById("reg_nom");
const phone = document.getElementById("reg_phone");


nom.addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, '');
});


phone.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
});


document.getElementById("modalSignUpForm").addEventListener("submit", function(e) {
    if (phone.value.length !== 10) {
        e.preventDefault();
        alert("Le numéro de téléphone doit contenir 10 chiffres.");
    }
});

    }

});