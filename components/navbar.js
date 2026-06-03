/**
 * Agrosence — Navbar Loader & Controller
 * ========================================
 * Usage: Add ONE line to every HTML page inside <head> or end of <body>:
 *   <script src="/components/navbar.js"></script>
 *
 * Then add this div wherever you want the navbar rendered:
 *   <div id="navbar-container"></div>
 *
 * That's it. This script handles everything else automatically:
 * - Loads /components/navbar.html into #navbar-container
 * - Detects role (agriculteur / expertt) from URL
 * - Injects correct dropdown menu items for each role
 * - Sets the active .nav-link based on current page
 * - Populates user name/avatar from localStorage
 * - Handles scroll effect on top-bar
 * - Handles dropdown open/close
 * - Handles logout
 */

(function () {
    'use strict';
    // تطبيق الوضع المظلم فوراً عند فتح أي صفحة
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if (document.body) {
            document.body.classList.add('dark-mode');
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                document.body.classList.add('dark-mode');
            });
        }
    }

    // ── 0. INJECT NAVBAR DEPENDENCIES & STYLES ───────────────────────
    /**
     * Injects a <link> or <style> into <head> only once (idempotent).
     * Uses a data-navbar-injected attribute as a guard.
     */
    function injectDependencies() {
        // ── Google Fonts (Inter) ──────────────────────────────────────
        if (!document.querySelector('link[data-navbar="fonts"]')) {
            var fonts = document.createElement('link');
            fonts.rel = 'stylesheet';
            fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
            fonts.setAttribute('data-navbar', 'fonts');
            document.head.appendChild(fonts);
        }

        // ── Navbar CSS ────────────────────────────────────────────────
        if (!document.querySelector('style[data-navbar="styles"]')) {
            var style = document.createElement('style');
            style.setAttribute('data-navbar', 'styles');
            style.textContent = [
                '/* ===== Agrosence Universal Navbar Styles ===== */',
                '* { box-sizing: border-box; }',
                'body { padding-top: clamp(60px, 8vh, 80px); }',

                /* Top bar */
                '.top-bar {',
                '  position: fixed; top: 0; left: 0; width: 100%;',
                '  padding: 1px clamp(10px, 4vw, 50px);',
                '  display: flex; align-items: center; justify-content: space-between;',
                '  z-index: 1000;',
                '  background: rgba(10, 31, 14, 0.7);',
                '  backdrop-filter: blur(20px);',
                '  -webkit-backdrop-filter: blur(20px);',
                '  border-bottom: 1px solid rgba(130, 233, 164, 0.1);',
                '  transition: all 0.3s ease;',
                '  font-family: "Inter", sans-serif;',
                '}',
                '.top-bar.scrolled {',
                '  padding: 12px clamp(10px, 4vw, 50px);',
                '  background: rgba(10, 31, 14, 0.92);',
                '  box-shadow: 0 4px 30px rgba(0,0,0,0.4);',
                '}',

                /* Brand */
                '.brand {',
                '  display: flex; align-items: center; gap: 12px;',
                '  text-decoration: none;',
                '}',
                '.brand-icon {',
                '  width: clamp(35px, 6vw, 100px); height: clamp(35px, 6vw, 100px);', // Responsive size up to original
                '  background: transparent;',
                '  border-radius: 50%;',
                '  display: flex; align-items: center; justify-content: center;',
                '  overflow: hidden;',
                '  border: none', // Contour chbab
                '  box-shadow: none',
                '}',


                '.brand-name {',
                '  font-size: clamp(0.85rem, 1.5vw, 1.7rem); font-weight: 800;', // Responsive text size up to original
                '  background: linear-gradient(135deg, #fff, #81f3ba);',
                '  -webkit-background-clip: text;',
                '  -webkit-text-fill-color: transparent;',
                '  background-clip: text;',
                '}',


                /* Nav links */
                '.nav-right { display: flex; align-items: center; gap: clamp(2px, 0.5vw, 5px); }',
                '.nav-links  { display: flex; align-items: center; gap: clamp(2px, 0.5vw, 4px); position: absolute; left: 50%; transform: translateX(-50%); }',

                '.nav-link {',
                '  padding: clamp(5px, 0.7vw, 9px) clamp(8px, 1.5vw, 20px); border-radius: 50px;',
                '  font-size: clamp(0.9rem, 1.2vw, 1.1rem); font-weight: 600;',
                '  color: rgba(255,255,255,0.75);',
                '  text-decoration: none;',
                '  transition: all 0.3s ease;',
                '  border: 1px solid transparent;',
                '  display: flex; align-items: center; gap: clamp(4px, 0.8vw, 8px);', '  flex-direction: row;',
                '  position: relative;', '  white-space: nowrap;',
                '}',
                '.nav-link:hover {',
                '  color: #fff;',
                '  background: rgba(130,233,164,0.12);',
                '  border-color: rgba(130,233,164,0.25);',
                '}',
                '.nav-link.active {',
                '  color: #81f3ba;',
                '  background: rgba(130,233,164,0.15);',
                '  border-color: rgba(130,233,164,0.3);',
                '}',

                /* User pill */
                '.user-pill {',
                '  display: flex; align-items: center; gap: clamp(2px, 0.5vw, 5px);',
                '  padding: clamp(3px, 0.4vw, 6px) clamp(6px, 1vw, 12px) clamp(3px, 0.4vw, 6px) clamp(3px, 0.4vw, 6px);',
                '  background: rgba(130,233,164,0.08);',
                '  border: 1px solid rgba(130,233,164,0.2);',
                '  border-radius: 50px;',
                '  cursor: pointer; transition: all 0.3s ease;',
                '}',
                '.user-pill:hover {',
                '  background: rgba(130,233,164,0.15);',
                '  border-color: rgba(130,233,164,0.4);',
                '}',
                '.user-pill .avatar {',
                '  width: clamp(26px, 3vw, 34px); height: clamp(26px, 3vw, 34px);',
                '  background: linear-gradient(135deg, #81f3ba, #2c5a36);',
                '  border-radius: 50%;',
                '  display: flex; align-items: center; justify-content: center;',
                '  font-weight: 700; font-size: clamp(10px, 1vw, 14px); color: #1a2e1a;',
                '}',
                '.user-pill .uname {',
                '  font-size: clamp(0.75rem, 1vw, 0.9rem); font-weight: 500;',
                '  color: rgba(255,255,255,0.9);',
                '}',
                '.user-pill .dropdown-caret {',
                '  margin-left: 4px;',
                '  transition: transform 0.3s ease;',
                '  opacity: 0.8;',
                '  color: #81f3ba;',
                '  flex-shrink: 0;',
                '}',
                '.user-pill.active .dropdown-caret {',
                '  transform: rotate(180deg);',
                '}',

                /* Hamburger toggle */
                '.menu-toggle {',
                '  display: none;',
                '  width: 44px; height: 44px; border-radius: 12px;',
                '  background: rgba(130,233,164,0.08);',
                '  border: 1px solid rgba(130,233,164,0.2);',
                '  flex-direction: column;',
                '  align-items: center; justify-content: center; gap: 5px;',
                '  cursor: pointer; transition: all 0.3s ease;',
                '}',
                '.menu-toggle:hover { background: rgba(130,233,164,0.15); border-color: rgba(130,233,164,0.4); }',
                '.menu-toggle.active { background: rgba(130,233,164,0.2); }',
                '.menu-line { width: 20px; height: 2px; background: #81f3ba; border-radius: 2px; transition: all 0.35s ease; }',
                '.menu-toggle.active .menu-line:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }',
                '.menu-toggle.active .menu-line:nth-child(2) { opacity: 0; }',
                '.menu-toggle.active .menu-line:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }',

                /* Dashboard App Icons */
                '.dash-app-icons { display: flex; align-items: center; gap: clamp(1px, 0.2vw, 4px); margin-right: 0; margin-left: 0; }',

                '.dash-icon-btn {',
                '  padding: clamp(3px, 0.4vw, 8px) clamp(5px, 0.8vw, 12px); border-radius: 50px;',
                '  font-size: clamp(0.5rem, 0.7vw, 0.8rem); font-weight: 600;',
                '  color: rgba(255,255,255,0.75);',
                '  background: rgba(130,233,164,0.08); border: 1px solid rgba(130,233,164,0.2);',
                '  display: flex; align-items: center; gap: clamp(2px, 0.4vw, 6px);',
                '  cursor: pointer; transition: all 0.3s ease; position: relative;',
                '}',
                '.dash-icon-btn:hover { background: rgba(130,233,164,0.15); border-color: rgba(130,233,164,0.4); color: #fff; }',
                '.dash-icon-btn .badge {',
                '  position: absolute; top: -4px; right: 4px;',
                '  padding: 3px 6px; font-size: 0.6rem; font-weight: 700;',
                '  border-radius: 50px; background: #ff4757; color: #fff;',
                '  border: 1px solid #0a1f0e;',
                '}',

                /* Dropdown menu */
                '.dropdown-menu {',
                '  position: fixed; top: 80px; right: 50px; width: 280px;',
                '  background: rgba(10,45,20,0.95);',
                '  backdrop-filter: blur(30px);',
                '  border: 1px solid rgba(130,233,164,0.2);',
                '  border-radius: 18px; padding: 12px;',
                '  opacity: 0; visibility: hidden;',
                '  transform: translateY(-15px) scale(0.95);',
                '  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);',
                '  z-index: 1001;',
                '  box-shadow: 0 20px 60px rgba(0,0,0,0.6);',
                '  color: white;',
                '}',
                '.dropdown-menu.show {',
                '  opacity: 1; visibility: visible;',
                '  transform: translateY(0) scale(1);',
                '}',
                '.dropdown-header {',
                '  padding: 16px 16px 12px;',
                '  border-bottom: 1px solid rgba(130,233,164,0.1);',
                '  margin-bottom: 8px;',
                '}',
                '.dropdown-header .user-avatar {',
                '  width: 45px; height: 45px;',
                '  background: linear-gradient(135deg, #81f3ba, #2c5a36);',
                '  border-radius: 12px;',
                '  display: inline-flex; align-items: center; justify-content: center;',
                '  font-size: 20px; font-weight: 700; margin-bottom: 10px;',
                '  box-shadow: 0 4px 12px rgba(129,243,186,0.3);',
                '  color: #1a2e1a;',
                '}',
                '.dropdown-header .user-info-name { font-size: 1rem; font-weight: 600; color: #fff; }',
                '.dropdown-header .user-info-type { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 2px; }',

                /* Menu items */
                '.menu-item {',
                '  display: flex; align-items: center; gap: 14px;',
                '  padding: 14px 16px; border-radius: 12px;',
                '  text-decoration: none;',
                '  color: rgba(255,255,255,0.85);',
                '  font-size: 0.95rem; font-weight: 500;',
                '  transition: all 0.25s ease;',
                '  cursor: pointer; border: none; background: none;',
                '  width: 100%; font-family: inherit; text-align: left;',
                '}',
                '.menu-item:hover { background: rgba(130,233,164,0.12); color: #81f3ba; transform: translateX(4px); }',
                '.menu-item .item-icon {',
                '  width: 38px; height: 38px;',
                '  display: flex; align-items: center; justify-content: center;',
                '  background: rgba(130,233,164,0.08);',
                '  border-radius: 10px; font-size: 1.15rem; flex-shrink: 0;',
                '  transition: all 0.25s ease;',
                '}',
                '.menu-item:hover .item-icon { background: rgba(130,233,164,0.2); transform: scale(1.05); }',
                '.menu-item .item-text { display: flex; flex-direction: column; }',
                '.menu-item .item-label { font-weight: 600; font-size: 0.9rem; }',
                '.menu-item .item-desc  { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 2px; }',
                '.menu-divider { height: 1px; background: rgba(130,233,164,0.1); margin: 6px 12px; }',
                '.menu-item.logout-item:hover { background: rgba(239,68,68,0.12); color: #ff6b6b; }',
                '.menu-item.logout-item:hover .item-icon { background: rgba(239,68,68,0.15); }',

                /* Overlay */
                '.menu-overlay { position: fixed; top:0; left:0; width:100%; height:100%; z-index:999; display:none; }',
                '.menu-overlay.show { display: block; }',

                /* Notification badge */
                '.notification-badge {',
                '  position: absolute; top: -2px; right: -2px;',
                '  width: 10px; height: 10px;',
                '  background: #ef4444; border: 2px solid #0a1f0e;',
                '  border-radius: 50%; display: none;',
                '  animation: navBadgePulse 2s infinite;',
                '}',
                '@keyframes navBadgePulse {',
                '  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }',
                '  70%  { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239,68,68,0); }',
                '  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0); }',
                '}',

                /* Responsive and shrinking navbar to prevent overlapping */
                '@media (max-width: 1250px) {',
                '  .nav-link { font-size: 0.82rem; padding: 4px clamp(5px, 1vw, 12px); gap: 4px; }',
                '  .brand-name { font-size: 1.15rem; }',
                '  .brand-icon { width: 35px; height: 35px; }',
                '  .nav-links { gap: 3px; }',
                '}',
                '@media (max-width: 1080px) {',
                '  .nav-links { display: none !important; }',
                '  .menu-toggle { display: flex !important; }',
                '}',
                '@media (max-width: 768px) {',
                '  .top-bar { padding: 10px 15px; }',
                '  .top-bar.scrolled { padding: 8px 15px; }',
                '  .brand-icon { width: 32px !important; height: 32px !important; }',
                '  .brand-name { font-size: 1rem !important; }',
                '  .dropdown-menu { right: 15px; top: 60px; width: 230px !important; padding: 8px !important; border-radius: 12px !important; }',
                '  .user-pill .uname { display: none; }',
                '  .dropdown-header { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; padding: 8px 8px 6px !important; border-bottom: 1px solid rgba(130, 233, 164, 0.15) !important; margin-bottom: 4px !important; }',
                '  .dropdown-header .user-avatar { width: 36px !important; height: 36px !important; font-size: 16px !important; margin-bottom: 6px !important; border-radius: 8px !important; }',
                '  .dropdown-header .user-info-name { font-size: 0.85rem !important; color: #ffffff !important; }',
                '  .dropdown-header .user-info-type { font-size: 0.72rem !important; color: #81f3ba !important; font-weight: 600 !important; margin-top: 1px !important; }',
                '  .menu-item { padding: 8px 10px !important; gap: 8px !important; border-radius: 8px !important; font-size: 0.8rem !important; }',
                '  .menu-item .item-icon { width: 28px !important; height: 28px !important; font-size: 0.95rem !important; border-radius: 6px !important; }',
                '  .menu-item .item-label { font-size: 0.8rem !important; }',
                '  .menu-item .item-desc { font-size: 0.65rem !important; margin-top: 1px !important; }',
                '  .menu-divider { margin: 4px 6px !important; }',
                '}',
                /* Mobile Drawer */
                '.mobile-drawer {',
                '  position: fixed; top: 80px; right: 50px; width: 260px;',
                '  background: rgba(10, 45, 20, 0.95);',
                '  backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);',
                '  border: 1px solid rgba(130, 233, 164, 0.2);',
                '  border-radius: 18px; padding: 12px;',
                '  display: flex; flex-direction: column; gap: 4px; z-index: 1001;',
                '  opacity: 0; visibility: hidden;',
                '  transform: translateY(-15px) scale(0.95);',
                '  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);',
                '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);',
                '}',
                '.mobile-drawer.show {',
                '  opacity: 1; visibility: visible;',
                '  transform: translateY(0) scale(1);',
                '}',
                '.mobile-drawer-link {',
                '  display: flex; align-items: center; gap: 12px;',
                '  color: rgba(255, 255, 255, 0.85); text-decoration: none;',
                '  font-size: 0.95rem; font-weight: 500; padding: 12px 16px;',
                '  border-radius: 12px; transition: all 0.25s ease;',
                '  border: none; background: none; width: 100%; text-align: left; font-family: inherit;',
                '}',
                '.mobile-drawer-link:hover {',
                '  background: rgba(130, 233, 164, 0.12); color: #81f3ba;',
                '  transform: translateX(4px);',
                '}',
                '.mobile-drawer-link.active {',
                '  background: rgba(130, 233, 164, 0.18); color: #81f3ba;',
                '}',
                '@media (max-width: 768px) {',
                '  .mobile-drawer { top: 70px; right: 15px; width: 240px; }',
                '}',
                'body.dark-mode { background: #06130b !important; color: #ffffff !important; }',
                'body.dark-mode .neural-background { background: radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(129, 243, 186, 0.08) 0%, transparent 50%), radial-gradient(circle at 85% 15%, rgba(130, 233, 164, 0.15) 0%, transparent 50%), linear-gradient(to bottom, #06130b 0%, #020604 100%) !important; }',
                'body.dark-mode .hero-tagline .highlight { color: #81f3ba !important; }',
                '.dark-mode .glass-card, .dark-mode .settings-section { background: rgba(30, 41, 59, 0.95) !important; border-color: rgba(0, 255, 150, 0.2) !important; }',
                '.dark-mode h2, .dark-mode h3, .dark-mode label, .dark-mode .section-title { color: #81f3ba !important; }',
                '.dark-mode input, .dark-mode select { background: rgba(255, 255, 255, 0.05) !important; color: #fff !important; border-color: rgba(255, 255, 255, 0.1) !important; }',
            ].join('\n');
            document.head.appendChild(style);
        }

        // ── Socket.io Client ──────────────────────────────────────────
        if (!document.querySelector('script[data-navbar="socket"]')) {
            var socketScript = document.createElement('script');
            socketScript.src = '/socket.io/socket.io.js';
            socketScript.setAttribute('data-navbar', 'socket');
            document.head.appendChild(socketScript);
        }
    }

    // ── 0b. INJECT SIDE PANEL SHELL + LOGIC ──────────────────────────
    /**
     * Single source of truth for the Agrosence side panel.
     * - Injects HTML shell + transparent overlay once
     * - Injects !important green-theme CSS to beat any legacy blue
     * - Always defines closeSidePanel / openSidePanel / renderSidePanelItems
     *   on window, unconditionally, so every page uses the same logic.
     */
    function injectSidePanel() {

        // ── 1. HTML shell (idempotent) ─────────────────────────────────
        if (!document.getElementById('sidePanelConfig')) {

            // Green-theme CSS — must be injected BEFORE the element
            // so styles are ready the moment the element appears.
            var css = document.createElement('style');
            css.id = 'sidePanelCSS';
            css.textContent = [
                '#sidePanelConfig {',
                '  position:fixed !important;',
                '  top:0 !important;',
                '  right:-420px !important;',
                '  width:360px !important;',
                '  height:100vh !important;',
                '  background:rgba(8,24,12,0.98) !important;',
                '  backdrop-filter:blur(20px) !important;',
                '  -webkit-backdrop-filter:blur(20px) !important;',
                '  border-left:1px solid rgba(0,220,130,0.3) !important;',
                '  border-top:none !important;',
                '  border-bottom:none !important;',
                '  border-right:none !important;',
                '  padding:24px 20px !important;',
                '  box-sizing:border-box !important;',
                '  overflow-y:auto !important;',
                '  box-shadow:-8px 0 40px rgba(0,0,0,0.65) !important;',
                '  z-index:9000 !important;',
                '  transition:right 0.35s cubic-bezier(0.16,1,0.3,1) !important;',
                '  color:#e2fff0 !important;',
                '  font-family:"Inter","Almarai",sans-serif !important;',
                '}',
                '#sidePanelTitle {',
                '  color:#00ffcc !important;',
                '  font-size:1.15rem !important;',
                '  font-weight:700 !important;',
                '  margin:0 0 16px !important;',
                '  padding-top:4px !important;',
                '  letter-spacing:-0.3px !important;',
                '}',
                '#sidePanelSearch {',
                '  width:100% !important;',
                '  padding:10px 14px !important;',
                '  margin-bottom:18px !important;',
                '  border-radius:10px !important;',
                '  border:1px solid rgba(0,220,130,0.35) !important;',
                '  background:rgba(255,255,255,0.07) !important;',
                '  color:#fff !important;',
                '  box-sizing:border-box !important;',
                '  font-size:0.9rem !important;',
                '  outline:none !important;',
                '}',
                '#sidePanelSearch::placeholder { color:rgba(255,255,255,0.38) !important; }',
                '#closeSidePanel {',
                '  background:none !important;',
                '  border:none !important;',
                '  color:rgba(255,255,255,0.55) !important;',
                '  font-size:26px !important;',
                '  position:absolute !important;',
                '  right:16px !important;',
                '  top:14px !important;',
                '  cursor:pointer !important;',
                '  line-height:1 !important;',
                '  transition:color 0.2s !important;',
                '  z-index:2 !important;',
                '}',
                '#closeSidePanel:hover { color:#fff !important; }',
                '#sidePanelList {',
                '  display:flex !important;',
                '  flex-direction:column !important;',
                '  gap:12px !important;',
                '}',
            ].join('\n');
            document.head.appendChild(css);

            // Panel element
            var panel = document.createElement('div');
            panel.id = 'sidePanelConfig';
            panel.innerHTML =
                '<button id="closeSidePanel" onclick="closeSidePanel()">✕</button>' +
                '<h3 id="sidePanelTitle">Liste</h3>' +
                '<input type="text" id="sidePanelSearch" placeholder="Rechercher par nom ou ville...">' +
                '<div id="sidePanelList"></div>';
            document.body.appendChild(panel);

            // Transparent overlay — clicking outside closes the panel
            var overlay = document.createElement('div');
            overlay.id = 'sidePanelOverlay';
            overlay.style.cssText = [
                'display:none', 'position:fixed', 'inset:0',
                'z-index:8999', 'background:transparent', 'cursor:default',
            ].join(';');
            overlay.addEventListener('click', function () { window.closeSidePanel(); });
            document.body.appendChild(overlay);

            // Search filter (references window.renderSidePanelItems defined below)
            document.getElementById('sidePanelSearch').addEventListener('input', function (e) {
                var q = e.target.value.toLowerCase();
                window.renderSidePanelItems(
                    (window._navbarPanelItems || []).filter(function (it) {
                        return (it.nom && it.nom.toLowerCase().includes(q)) ||
                            (it.localisation && it.localisation.toLowerCase().includes(q));
                    })
                );
            });
        }

        // ── 2. closeSidePanel — always on window ──────────────────────
        window.closeSidePanel = function () {
            var p = document.getElementById('sidePanelConfig');
            var o = document.getElementById('sidePanelOverlay');
            if (p) p.style.setProperty('right', '-420px', 'important');
            if (o) o.style.display = 'none';
        };

        // ── 3. openSidePanel — always on window ───────────────────────
        window.openSidePanel = async function (title, type) {
            var token = localStorage.getItem('token');
            var hideActions = !token;
            window._sidePanelHideActions = hideActions;
            var p = document.getElementById('sidePanelConfig');
            var o = document.getElementById('sidePanelOverlay');
            if (!p) return;

            document.getElementById('sidePanelTitle').textContent = title;
            document.getElementById('sidePanelSearch').value = '';
            p.style.setProperty('right', '0', 'important');
            if (o) o.style.display = 'block';

            var container = document.getElementById('sidePanelList');
            container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px;">Chargement...</p>';

            try {
                var endpoint = '';
                if (!token) {
                    endpoint = '/api/user/public/experts';
                } else {
                    if (type === 'expert' || type === 'agriculteur') {
                        endpoint = '/api/user/all/' + type;
                    } else if (type === 'notifications') {
                        // Render from our live notification buffer instead of fetching invitations
                        window._navbarPanelType = 'notifications';
                        window._renderNotificationPanel();
                        return;
                    }
                }

                var res = await fetch(endpoint, {
                    headers: { 'x-auth-token': token || '' }
                });
                if (res.ok) {
                    var data = await res.json();
                    window._navbarPanelItems = data;
                    window._navbarPanelType = type;
                    window.renderSidePanelItems(data);
                } else {
                    container.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:20px;">Erreur de chargement</p>';
                }
            } catch (err) {
                console.error('[navbar.js] openSidePanel:', err);
                container.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:20px;">Erreur réseau</p>';
            }
        };

        // ── 3b. Notification Panel Renderer ────────────────────────────
        window._notificationBuffer = window._notificationBuffer || [];

        window._renderNotificationPanel = function () {
            var container = document.getElementById('sidePanelList');
            if (!container) return;
            container.innerHTML = '';

            var buffer = window._notificationBuffer || [];

            if (!buffer || buffer.length === 0) {
                container.innerHTML =
                    '<div style="text-align:center;padding:50px 20px;">' +
                    '<div style="font-size:3rem;margin-bottom:12px;opacity:0.3;">👥</div>' +
                    '<p style="color:rgba(255,255,255,0.4);font-size:0.95rem;font-weight:500;">Aucune demande de connexion</p>' +
                    '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem;margin-top:4px;">Les nouvelles demandes apparaîtront ici</p>' +
                    '</div>';
                return;
            }

            // Icon map for notification types
            var iconMap = {
                'new_order': 'fa-cart-plus',
                'order_accepted': 'fa-check-circle',
                'farmer_received': 'fa-box-open',
                'order_completed': 'fa-truck',
                'pending': 'fa-clock',
                'message': 'fa-comment-dots',
                'default': 'fa-bell'
            };

            buffer.forEach(function (notif, idx) {
                var icon = iconMap[notif.type] || iconMap['default'];
                var accentColor = notif.color || '#81f3ba';
                var link = notif.link || '#';
                var isNew = idx < 3; // First 3 are visually highlighted

                var a = document.createElement('a');
                a.href = link;
                a.style.cssText = [
                    'display:flex',
                    'align-items:center',
                    'gap:14px',
                    'padding:14px 16px',
                    'border-radius:14px',
                    'text-decoration:none',
                    'transition:all 0.25s ease',
                    'margin-bottom:6px',
                    'border:1px solid ' + (isNew ? accentColor + '44' : 'rgba(255,255,255,0.06)'),
                    'background:' + (isNew ? accentColor + '12' : 'rgba(255,255,255,0.03)'),
                    'cursor:pointer',
                    'position:relative',
                    'overflow:hidden',
                ].join(';');

                a.onmouseover = function () {
                    this.style.background = accentColor + '22';
                    this.style.borderColor = accentColor + '66';
                    this.style.transform = 'translateX(4px)';
                };
                a.onmouseout = function () {
                    this.style.background = isNew ? accentColor + '12' : 'rgba(255,255,255,0.03)';
                    this.style.borderColor = isNew ? accentColor + '44' : 'rgba(255,255,255,0.06)';
                    this.style.transform = 'translateX(0)';
                };

                var actionButtons = '';
                if (notif.type === 'new_invitation' && notif.meta && notif.meta.targetId) {
                    var tid = notif.meta.targetId;
                    actionButtons =
                        '<div style="display:flex;gap:8px;margin-top:10px;">' +
                        '<button onclick="event.stopPropagation(); window.acceptInvite(\'' + tid + '\', this)" style="flex:1;background:linear-gradient(135deg,#81f3ba,#2c5a36);color:#0d1f12;border:none;padding:6px;border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;">Accepter</button>' +
                        '<button onclick="event.stopPropagation(); window.rejectInvite(\'' + tid + '\', this)" style="flex:1;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:6px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">Refuser</button>' +
                        '</div>';
                }

                a.innerHTML =
                    // Icon Circle
                    '<div style="width:42px;height:42px;background:' + accentColor + ';border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px ' + accentColor + '40;">' +
                    '<i class="fas ' + icon + '" style="color:#0a1f0e;font-size:1rem;"></i>' +
                    '</div>' +
                    // Text Content
                    '<div style="flex:1;min-width:0;">' +
                    '<div style="font-weight:700;color:#fff;font-size:0.88rem;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + notif.message + '</div>' +
                    (notif.subtitle ? '<div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + notif.subtitle + '</div>' : '') +
                    '<div style="font-size:0.7rem;color:rgba(255,255,255,0.35);margin-top:4px;display:flex;align-items:center;gap:5px;">' +
                    '<i class="far fa-clock"></i> ' + (notif.time || 'Récemment') +
                    '</div>' +
                    actionButtons +
                    '</div>' +
                    // Arrow
                    (link !== '#' ? '<i class="fas fa-chevron-right" style="color:rgba(255,255,255,0.2);font-size:0.7rem;flex-shrink:0;"></i>' : '') +
                    // New dot indicator
                    (isNew ? '<div style="position:absolute;top:8px;right:8px;width:7px;height:7px;background:' + accentColor + ';border-radius:50%;box-shadow:0 0 8px ' + accentColor + ';"></div>' : '');

                container.appendChild(a);
            });
        };

        // ── 4. renderSidePanelItems — always on window ────────────────
        window.renderSidePanelItems = function (items) {
            var container = document.getElementById('sidePanelList');
            if (!container) return;
            container.innerHTML = '';

            if (!items || items.length === 0) {
                container.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:40px;font-size:0.9rem;">Aucun résultat</p>';
                return;
            }

            var isNotif = (window._navbarPanelType === 'notifications');
            var hideActions = window._sidePanelHideActions;

            items.forEach(function (item) {
                var div = document.createElement('div');
                div.style.cssText = [
                    'background:rgba(255,255,255,0.03)',
                    'padding:16px',
                    'border-radius:14px',
                    'display:flex',
                    'flex-direction:column',
                    'border:1px solid rgba(255,255,255,0.05)',
                    'margin-bottom:12px',
                    'transition:all 0.3s ease',
                ].join(';');

                div.onmouseover = function () {
                    this.style.background = 'rgba(255,255,255,0.07)';
                    this.style.borderColor = 'rgba(0,255,200,0.2)';
                };
                div.onmouseout = function () {
                    this.style.background = 'rgba(255,255,255,0.03)';
                    this.style.borderColor = 'rgba(255,255,255,0.05)';
                };

                var topRow = document.createElement('div');
                topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;';

                var info = document.createElement('div');
                info.innerHTML =
                    '<div style="font-weight:700;color:#fff;font-size:1rem;margin-bottom:2px;">' + (item.nom || 'Inconnu') + '</div>' +
                    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:5px;">' +
                    '📍 ' + (item.localisation || 'Non spécifiée') +
                    '</div>';
                topRow.appendChild(info);

                if (!hideActions) {
                    // Action Button Container
                    var actions = document.createElement('div');
                    actions.style.cssText = 'display:flex; gap:8px;';

                    if (isNotif) {
                        var acceptBtn = document.createElement('button');
                        acceptBtn.style.cssText = 'background:linear-gradient(135deg,#81f3ba,#2c5a36);color:#0d1f12;border:none;padding:8px 16px;border-radius:50px;cursor:pointer;font-size:0.85rem;font-weight:700;transition:0.3s;box-shadow:0 4px 15px rgba(129,243,186,0.2);';
                        acceptBtn.textContent = 'Accepter';
                        acceptBtn.onclick = function (e) {
                            e.stopPropagation();
                            window.acceptInvite(item._id, acceptBtn);
                        };
                        actions.appendChild(acceptBtn);
                    } else if (item.isPending) {
                        var pendingLabel = document.createElement('div');
                        pendingLabel.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.8rem;align-self:center;margin-right:6px;font-style:italic;';
                        pendingLabel.innerHTML = '⏳ En attente...';

                        var cancelBtn = document.createElement('button');
                        cancelBtn.style.cssText = 'background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:8px 16px;border-radius:50px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:0.3s;';
                        cancelBtn.textContent = 'Annuler';
                        cancelBtn.onclick = function (e) {
                            e.stopPropagation();
                            window.cancelInvite(item._id, cancelBtn);
                        };
                        actions.appendChild(pendingLabel);
                        actions.appendChild(cancelBtn);
                    } else {
                        var inviteBtn = document.createElement('button');
                        inviteBtn.style.cssText = 'background:rgba(255,255,255,0.05);color:#81f3ba;border:1px solid rgba(129,243,186,0.3);padding:8px 16px;border-radius:50px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:0.3s;';
                        inviteBtn.textContent = 'Inviter';
                        inviteBtn.onclick = function (e) {
                            e.stopPropagation();
                            window.sendInvite(item._id, inviteBtn);
                        };
                        actions.appendChild(inviteBtn);
                    }

                    topRow.appendChild(actions);
                }

                div.appendChild(topRow);
                container.appendChild(div);
            });
        };

        // ── 5. GLOBAL SYNC ACTIONS (Universal Invite logic) ───────────
        window.sendInvite = async function (targetId, btn) {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Visual loading state
            const originalText = btn.textContent;
            btn.textContent = '...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/user/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ targetId })
                });

                if (res.ok) {
                    btn.textContent = 'Envoyé ✓';
                    btn.style.background = 'rgba(129,243,186,0.2)';
                    btn.style.borderColor = '#81f3ba';
                    btn.style.color = '#fff';
                    if (typeof window.loadExpertsDiscovery === 'function') window.loadExpertsDiscovery();
                    if (typeof window.loadFarmersDiscovery === 'function') window.loadFarmersDiscovery();
                } else {
                    const data = await res.json().catch(() => ({}));
                    btn.textContent = data.message || 'Erreur';
                    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
                }
            } catch (err) {
                console.error('[navbar.js] sendInvite error:', err);
                btn.textContent = 'Erreur';
                setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
            }
        };

        window.acceptInvite = async function (targetId, btn) {
            const token = localStorage.getItem('token');
            if (!token) return;

            btn.textContent = '...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/user/accept-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ targetId })
                });

                if (res.ok) {
                    btn.textContent = 'Connecté🤝';
                    btn.style.background = '#81f3ba';
                    btn.style.color = '#064e3b';
                    if (typeof window.loadInvitations === 'function') window.loadInvitations();
                    if (typeof window.loadFriends === 'function') window.loadFriends();
                } else {
                    btn.textContent = 'Erreur';
                    setTimeout(() => { btn.textContent = 'Accepter'; btn.disabled = false; }, 2000);
                }
            } catch (err) {
                console.error('[navbar.js] acceptInvite error:', err);
                btn.textContent = 'Erreur';
                setTimeout(() => { btn.textContent = 'Accepter'; btn.disabled = false; }, 2000);
            }
        };

        window.rejectInvite = async function (targetId, btn) {
            const token = localStorage.getItem('token');
            if (!token) return;
            btn.textContent = '...'; btn.disabled = true;
            try {
                const res = await fetch('/api/user/reject-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ targetId })
                });
                if (res.ok) {
                    btn.textContent = 'Refusée';
                    btn.style.background = '#ef4444';
                    btn.style.color = '#fff';
                    if (typeof window.loadInvitations === 'function') window.loadInvitations();
                } else {
                    btn.textContent = 'Erreur';
                    setTimeout(() => { btn.textContent = 'Refuser'; btn.disabled = false; }, 2000);
                }
            } catch (err) {
                btn.textContent = 'Erreur';
                setTimeout(() => { btn.textContent = 'Refuser'; btn.disabled = false; }, 2000);
            }
        };

        window.cancelInvite = async function (targetId, btn) {
            const token = localStorage.getItem('token');
            if (!token) return;
            const originalText = btn.textContent;
            btn.textContent = '...'; btn.disabled = true;
            try {
                const res = await fetch('/api/user/cancel-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ targetId })
                });
                if (res.ok) {
                    btn.textContent = 'Annulée';
                    btn.style.background = 'rgba(255,255,255,0.05)';
                    btn.style.color = '#fff';
                    btn.style.borderColor = 'transparent';
                    if (typeof window.loadExpertsDiscovery === 'function') window.loadExpertsDiscovery();
                    if (typeof window.loadFarmersDiscovery === 'function') window.loadFarmersDiscovery();
                } else {
                    btn.textContent = 'Erreur';
                    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
                }
            } catch (err) {
                btn.textContent = 'Erreur';
                setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
            }
        };
    }


    // ── 1. DETECT ROLE & CURRENT PATH ────────────────────────────────
    const path = window.location.pathname;

    /**
     * Role detection priority:
     *   1. localStorage 'userRole'  (set on login — most reliable)
     *   2. URL pathname             (works on deep dashboard pages)
     *   3. Default → 'agriculteur' (safe fallback for root / and public pages)
     */
    var storedRole = (localStorage.getItem('userRole') || '').toLowerCase().trim();

    var isExpert;

    var isExpert;
    var ROLE; // هادي هي اللي كانت ناقصة باش الكود ما يحبسش

    if (storedRole === 'admin') {
        ROLE = 'admin';
        isExpert = false;
    } else if (storedRole === 'expert') {
        isExpert = true;
        ROLE = 'expert';
    } else if (storedRole === 'agriculteur' || storedRole === 'farmer') {
        isExpert = false;
        ROLE = 'agriculteur';
    } else {
        // إذا ما لقاش الـ Role في الكاش، يشوف الرابط (URL)
        if (path.includes('/admin/')) {
            ROLE = 'admin';
            isExpert = false;
        } else if (path.includes('/expertt/')) {
            ROLE = 'expert';
            isExpert = true;
        } else {
            ROLE = 'agriculteur';
            isExpert = false;
        }
    }
    var isAgriculteur = (ROLE === 'agriculteur');

    // Absolute dashboard URLs for each role
    const DASHBOARD = {
        agriculteur: '/apres-inscription/agriculteur/index.html',
        expert: '/apres-inscription/expertt/index.html',
        admin: '/apres-inscription/admin/index.html',
    };

    const PROFILE_PAGE = {
        agriculteur: '/apres-inscription/agriculteur/profil/index.html',
        expert: '/apres-inscription/expertt/profil/index.html',
        admin: '/apres-inscription/admin/profil/index.html',
    };

    const PARAMETRE_PAGE = {
        agriculteur: '/apres-inscription/agriculteur/parametre/index.html',
        expert: '/apres-inscription/expertt/parametre/index.html',
        admin: '/apres-inscription/admin/parametre/index.html',
    };


    // ── 2. DROPDOWN MENU DEFINITIONS PER CONTEXT ─────────────────────
    var isOnDashboard = path.includes('/apres-inscription/');

    // Public page menu (when on localhost:3000/ or marketing pages)
    var PUBLIC_MENU = [
        {
            href: DASHBOARD[ROLE],
            icon: '👤',
            label: 'Mon profil',
            desc: 'Voir mon tableau de bord',
        },
        {
            href: PARAMETRE_PAGE[ROLE],
            icon: '⚙️',
            label: 'Paramètres',
            desc: 'Modifier mes informations',
        },
        {
            href: (ROLE === 'expert' ? PROFILE_PAGE.expert : PROFILE_PAGE.agriculteur) + '#paiements',
            icon: '💳',
            label: 'Paiements',
            desc: 'Historique des paiements',
        },
        { divider: true },
        {
            href: '#',
            icon: '🚪',
            label: 'Déconnexion',
            desc: 'Se déconnecter du compte',
            logout: true,
        },
    ];

    // Dashboard menus (when inside /apres-inscription/...)
    var DASHBOARD_MENU = {
        agriculteur: [
            {
                href: '/apres-inscription/agriculteur/discussion/index.html',
                icon: '👨‍🔬',
                label: 'Mes experts',
                desc: 'Discuter avec des experts',
            },
            {
                href: '/apres-inscription/agriculteur/boutique/index.html',
                icon: '🛍️',
                label: 'Les boutiques',
                desc: 'Visiter les boutiques des experts',
            },
            {
                href: '/apres-inscription/agriculteur/boutique/index.html?open=orders',
                icon: '📦',
                label: 'Mes commandes',
                desc: 'Suivre mes commandes en cours',
            },
            {
                href: '/apres-inscription/agriculteur/rendement/rendement.html',
                icon: '📊',
                label: 'Intelligence Agronomique',
                desc: 'Prévision de récolte, engrais et rendement',
            },
            {
                icon: '🔍',
                label: 'Tous les experts',
                desc: 'Rechercher et contacter des experts',
                sidePanel: { title: 'Tout les experts', type: 'expert' },
            },
            { divider: true },
            {
                href: DASHBOARD.agriculteur,
                icon: '👤',
                label: 'Mon profil',
                desc: 'Voir mon tableau de bord',
            },
            {
                href: PARAMETRE_PAGE.agriculteur,
                icon: '⚙️',
                label: 'Paramètres',
                desc: 'Modifier mes informations',
            },
            {
                href: PROFILE_PAGE.agriculteur + '#paiements',
                icon: '💳',
                label: 'Paiements',
                desc: 'Historique des paiements',
            },
            { divider: true },
            {
                href: '#',
                icon: '🚪',
                label: 'Déconnexion',
                desc: 'Se déconnecter du compte',
                logout: true,
            },
        ],
        expert: [
            {
                href: '/apres-inscription/expertt/discussion/index.html',
                icon: '💬',
                label: 'Mes clients',
                desc: 'Discuter with les agriculteurs',
            },
            {
                href: '/apres-inscription/expertt/boutique/index.html',
                icon: '🛍️',
                label: 'Ma boutique',
                desc: 'Configurer ma boutique et produits',
            },
            {
                href: '/apres-inscription/expertt/les-commande/index.html',
                icon: '📦',
                label: 'Les commandes',
                desc: 'Voir les commandes des agriculteurs',
            },
            {
                href: '/apres-inscription/expertt/statistique/index.html',
                icon: '📊',
                label: 'Les statistiques',
                desc: 'Voir mes performances et gains',
            },
            {
                icon: '🔍',
                label: 'Tous les agriculteurs',
                desc: 'Rechercher et contacter des agriculteurs',
                sidePanel: { title: 'Tout les agriculteurs', type: 'agriculteur' },
            },
            { divider: true },
            {
                href: DASHBOARD.expert,
                icon: '👤',
                label: 'Mon profil',
                desc: 'Voir mon tableau de bord',
            },
            {
                href: PARAMETRE_PAGE.expert,
                icon: '⚙️',
                label: 'Paramètres',
                desc: 'Modifier mes informations',
            },
            {
                href: PROFILE_PAGE.expert + '#paiements',
                icon: '💳',
                label: 'Paiements',
                desc: 'Historique des paiements',
            },
            { divider: true },
            {
                href: '#',
                icon: '🚪',
                label: 'Déconnexion',
                desc: 'Se déconnecter du compte',
                logout: true,
            },
        ],
        admin: [
            {
                href: '/apres-inscription/admin/index.html?view=dashboard',
                icon: '📊',
                label: 'Tableau de bord',
                desc: 'Statistiques globales du site',
            },
            { divider: true },
            {
                href: '/apres-inscription/admin/utilisateurs.html',
                icon: '👥',
                label: 'Utilisateurs',
                desc: 'Gérer les agriculteurs et experts',
            },
            {
                href: '/apres-inscription/admin/boutiques.html',
                icon: '🏪',
                label: 'Boutiques',
                desc: 'Surveiller les boutiques et produits',
            },
            {
                href: '/apres-inscription/admin/commandes.html',
                icon: '📦',
                label: 'Commandes',
                desc: 'Voir toutes les transactions',
            },
            { divider: true },
            {
                href: DASHBOARD.admin,
                icon: '👤',
                label: 'Mon profil',
                desc: 'Voir mon tableau de bord',
            },
            {
                href: PARAMETRE_PAGE.admin,
                icon: '⚙️',
                label: 'Paramètres',
                desc: 'Modifier les paramètres',
            },
            { divider: true },
            {
                href: '#',
                icon: '🚪',
                label: 'Déconnexion',
                desc: 'Se déconnecter du compte',
                logout: true,
            },
        ],

    };

    // Select the right menu based on context
    var ACTIVE_MENU = isOnDashboard ? (DASHBOARD_MENU[ROLE] || []) : PUBLIC_MENU;

    // ── 3. LOAD NAVBAR HTML ───────────────────────────────────────────
    function loadNavbar() {
        const container = document.getElementById('navbar-container');
        if (!container) {
            console.warn('[navbar.js] No #navbar-container found on this page.');
            return;
        }

        fetch('/components/navbar.html?v=' + Date.now())
            .then(function (res) {
                if (!res.ok) throw new Error('navbar.html not found (' + res.status + ')');
                return res.text();
            })
            .then(function (html) {
                container.innerHTML = html;
                initNavbar();
                // Trigger translation after navbar is loaded
                if (typeof window.translatePage === 'function') {
                    window.translatePage();
                }
            })
            .catch(function (err) {
                console.error('[navbar.js] Failed to load navbar:', err);
            });
    }

    // ── 4. INIT AFTER HTML IS INJECTED ───────────────────────────────
    function initNavbar() {
        setMessagesLink();
        injectDropdownItems();
        setUserInfo();
        setupDashboardContext(); // Handle dashboard icons vs marketing links
        setActiveLink();
        populateMobileDrawer();
        initScrollEffect();
        initUserPillClick();
        initMobileMenuClick();
    }

    // ── 4a. Set nav-links hrefs dynamically ─────────────────────────

    function setMessagesLink() {
        var msgLink = document.getElementById('nav-messages');
        if (msgLink) {
            var chatUrl = (ROLE === 'expert') ? '/apres-inscription/expertt/discussion/index.html' : '/apres-inscription/agriculteur/discussion/index.html';
            msgLink.href = chatUrl;

            // Afficher seulement si connecté
            var isOnDashboard = window.location.pathname.includes('/apres-inscription/');
            if (!isOnDashboard) {
                msgLink.style.setProperty('display', 'none', 'important');
            } else {
                msgLink.style.setProperty('display', 'flex', 'important');
            }
        }
    }



    /**
     * Dashboard Context Handler
     * - If on dashboard: injects App Icons (Msg/Notif), loads shared sections, 
     *   and rewires nav-links from absolute (/#section) to local (#section) anchors
     */
    function setupDashboardContext() {
        var isOnDashboard = path.includes('/apres-inscription/');
        if (!isOnDashboard) return;

        // Detect if we are exactly on the MAIN dashboard (not a subpage like boutique or commandes)
        var isMainDashboard =
            path.endsWith('/expertt/index.html') || path.endsWith('/expertt/') ||
            path.endsWith('/agriculteur/index.html') || path.endsWith('/agriculteur/') ||
            path.endsWith('/admin/index.html') || path.endsWith('/admin/');

        // 1. Rewrite nav-links to use dash-root anchors
        var linkMap = {
            'nav-services': '#showcase',
            'nav-publication': '#timeline',
            'nav-propos': '#features',
            'nav-nous': '#footer'
        };

        var dashRoot = DASHBOARD[ROLE] || '/';

        Object.keys(linkMap).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                if (isMainDashboard) {
                    el.href = linkMap[id];
                    el.addEventListener('click', function (e) {
                        var target = document.querySelector(linkMap[id]);
                        if (target) {
                            e.preventDefault();
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                } else {
                    el.href = dashRoot + linkMap[id];
                }
            }
        });

        // Shared sections HTML injection has been intentionally removed from the dashboard 
        // per user request. Sections (services, timeline, etc.) stay only on the public homepage.

        // 4. Inject App Icons (Messages & Notifications) to the left of User Pill
        const navRight = document.querySelector('.nav-right');
        const userPill = document.getElementById('userPill');
        if (navRight && userPill && !document.getElementById('dash-app-icons') && ROLE !== 'admin') {

            const iconGroup = document.createElement('div');
            iconGroup.id = 'dash-app-icons';
            iconGroup.className = 'dash-app-icons';

            // Messages / Discussions Button
            const msgBtn = document.createElement('div');
            msgBtn.className = 'dash-icon-btn';
            msgBtn.innerHTML = '💬 <span></span><span id="nav-msg-badge" class="badge" style="display:none;"></span>';
            msgBtn.title = 'Accéder à mes discussions';
            msgBtn.onclick = function () {
                const discussionPath = '/apres-inscription/' + (isExpert ? 'expertt' : 'agriculteur') + '/discussion/index.html';
                window.location.href = discussionPath;
            };

            // Réseau / Invitations Button
            const networkBtn = document.createElement('div');
            networkBtn.className = 'dash-icon-btn';
            networkBtn.innerHTML = ' 🔔 <span>    </span><span id="nav-network-badge" class="badge" style="display:none;"></span>';
            networkBtn.title = 'Demandes de connexion';
            networkBtn.onclick = function () {
                if (typeof window.openSidePanel === 'function') {
                    window.openSidePanel('Réseau & Invitations', 'notifications');
                }
            };

            // Commandes / Boutique Button
            const ordersBtn = document.createElement('div');
            ordersBtn.className = 'dash-icon-btn';
            ordersBtn.innerHTML = '📦 <span>  </span><span id="nav-orders-badge" class="badge" style="display:none;"></span>';
            ordersBtn.title = 'Mes commandes commerciales';
            ordersBtn.onclick = function () {
                const discussionPath = '/apres-inscription/' + (isExpert ? 'expertt/les-commande/index.html' : 'agriculteur/boutique/index.html?open=orders');
                window.location.href = discussionPath;
            };

            iconGroup.appendChild(msgBtn);
            iconGroup.appendChild(networkBtn);
            iconGroup.appendChild(ordersBtn);

            // Insert before user pill
            navRight.insertBefore(iconGroup, userPill);
        }
    }

    // ── 4b. Inject role-specific dropdown items ───────────────────────
    function injectDropdownItems() {
        var container = document.getElementById('dropdown-items');
        if (!container) return;

        // Wipe any existing content (defensive guard against stale HTML)
        container.innerHTML = '';

        var items = ACTIVE_MENU;

        // No mobile-specific overrides

        container.innerHTML = items.map(function (item) {
            // ── Divider ──
            if (item.divider) {
                return '<div class="menu-divider"></div>';
            }

            // ── Logout button (special styling) ──
            if (item.logout) {
                return (
                    '<button class="menu-item logout-item" onclick="handleNavLogout()">' +
                    '<span class="item-icon">' + item.icon + '</span>' +
                    '<span class="item-text">' +
                    '<span class="item-label" data-i18n="' + item.label + '">' + item.label + '</span>' +
                    '<span class="item-desc" data-i18n="' + item.desc + '">' + item.desc + '</span>' +
                    '</span>' +
                    '</button>'
                );
            }

            // ── Side Panel trigger (calls openSidePanel from scripts.js) ──
            if (item.sidePanel) {
                var sp = item.sidePanel;
                return (
                    '<button class="menu-item" onclick="' +
                    'if(typeof openSidePanel===\'function\'){' +
                    'openSidePanel(\'' + sp.title + '\',\'' + sp.type + '\')' +
                    '}else{' +
                    'console.warn(\'[navbar.js] openSidePanel not found — scripts.js may not be loaded on this page\')' +
                    '};closeNavMenu();">' +
                    '<span class="item-icon">' + item.icon + '</span>' +
                    '<span class="item-text">' +
                    '<span class="item-label" data-i18n="' + item.label + '">' + item.label + '</span>' +
                    '<span class="item-desc" data-i18n="' + item.desc + '">' + item.desc + '</span>' +
                    '</span>' +
                    '</button>'
                );
            }

            // ── Regular link ──
            return (
                '<a href="' + item.href + '" class="menu-item">' +
                '<span class="item-icon">' + item.icon + '</span>' +
                '<span class="item-text">' +
                '<span class="item-label" data-i18n="' + item.label + '">' + item.label + '</span>' +
                '<span class="item-desc" data-i18n="' + item.desc + '">' + item.desc + '</span>' +
                '</span>' +
                '</a>'
            );
        }).join('');

        // Role label under user name in dropdown header
        var roleEl = document.getElementById('menuUserRole');
        if (roleEl) {
            if (ROLE === 'admin') {
                roleEl.textContent = 'Administrateur 🔐';
            } else if (ROLE === 'expert') {
                roleEl.textContent = 'Expert Agricole 👨‍🔬';
            } else {
                roleEl.innerHTML = '<span data-i18n="Agriculteur">Agriculteur</span> 🚜';
            }
    }
}

    // ── 4c. Auth-aware rendering: Guest or Logged-in ──────────────────
    function setUserInfo() {
    var token = localStorage.getItem('token');
    var userName = localStorage.getItem('userName');
    var isLoggedIn = !!(token && userName && userName.trim().length > 0);

    var userPill = document.getElementById('userPill');
    var menuToggle = document.getElementById('menuToggle');
    var dropdownMenu = document.getElementById('dropdownMenu');
    var navRight = document.querySelector('.nav-right');

    if (isLoggedIn) {
        // ── AUTHENTICATED: show user pill with real name ──────────
        var name = userName.trim();
        var initial = name.charAt(0).toUpperCase();

        if (userPill) { userPill.style.display = ''; }
        if (menuToggle) { menuToggle.style.display = ''; }

        var navAvatar = document.getElementById('navAvatar');
        var navUserName = document.getElementById('navUserName');
        var menuInitial = document.getElementById('menuUserInitial');
        var menuUserName = document.getElementById('menuUserName');

        if (navAvatar) navAvatar.textContent = initial;
        if (navUserName) navUserName.textContent = name;
        if (menuInitial) menuInitial.textContent = initial;
        if (menuUserName) menuUserName.textContent = name;

        // Add role badge to user pill if it doesn't exist
        if (userPill && !userPill.querySelector('.role-badge')) {
            if (ROLE === 'admin' || ROLE === 'expert') {
                var roleBadge = document.createElement('span');
                roleBadge.className = 'role-badge';
                roleBadge.style.cssText = 'padding:2px 8px; background:rgba(129,243,186,0.2); border-radius:20px; font-size:0.7rem; color:#81f3ba; font-weight:600; margin-left:8px;';

                if (ROLE === 'admin') roleBadge.textContent = 'Admin';
                else if (ROLE === 'expert') roleBadge.textContent = 'Expert';

                userPill.appendChild(roleBadge);
            }
        }

        // Remove guest buttons if they exist (e.g. from a previous render)
        var guestBtns = document.getElementById('navbar-guest-actions');
        if (guestBtns) guestBtns.remove();

        // No mobile profile/settings updates

    } else {
        // ── GUEST: hide pill + dropdown, inject Connexion/Inscription ──
        if (userPill) { userPill.style.display = 'none'; }
        if (menuToggle) { menuToggle.style.display = ''; }
        if (dropdownMenu) { dropdownMenu.style.display = 'none'; }

        // No mobile profile/settings updates

        // Only inject once
        if (!document.getElementById('navbar-guest-actions') && navRight) {
            var guestDiv = document.createElement('div');
            guestDiv.id = 'navbar-guest-actions';
            
            // Shrink buttons dynamically on mobile to prevent overflow
            var isMobile = (window.innerWidth <= 768);
            var paddingVal = isMobile ? '5px 12px' : '8px 20px';
            var fontSizeVal = isMobile ? '0.74rem' : '0.9rem';
            var gapVal = isMobile ? '6px' : '10px';
            
            guestDiv.style.cssText = 'display:flex;align-items:center;gap:' + gapVal + ';';

            // ── Connexion button ── opens authModal (login view)
            var btnLogin = document.createElement('button');
            btnLogin.textContent = 'Connexion';
            btnLogin.style.cssText = [
                'padding:' + paddingVal,
                'border-radius:50px',
                'border:1px solid rgba(129,243,186,0.5)',
                'background:transparent',
                'color:#81f3ba',
                'font-size:' + fontSizeVal,
                'font-weight:600',
                'cursor:pointer',
                'transition:all 0.25s ease',
                'font-family:inherit',
            ].join(';');
            btnLogin.onmouseover = function () {
                this.style.background = 'rgba(129,243,186,0.12)';
                this.style.borderColor = '#81f3ba';
            };
            btnLogin.onmouseout = function () {
                this.style.background = 'transparent';
                this.style.borderColor = 'rgba(129,243,186,0.5)';
            };
            // Trigger the existing authModal — login view
            btnLogin.onclick = function () {
                var modal = document.getElementById('authModal');
                if (modal) {
                    // Ensure login view is active
                    var loginView = document.getElementById('modalLoginView');
                    var regView = document.getElementById('modalRegisterView');
                    if (loginView) loginView.style.display = '';
                    if (regView) regView.style.display = 'none';
                    modal.style.display = 'flex';
                } else {
                    // Fallback: navigate to login page if modal absent (subpages)
                    window.location.href = '/index.html?login=true';
                }
            };

            // ── Inscription button ── opens authModal (register view)
            var btnReg = document.createElement('button');
            btnReg.textContent = 'Inscription';
            btnReg.style.cssText = [
                'padding:' + paddingVal,
                'border-radius:50px',
                'border:none',
                'background:linear-gradient(135deg,#81f3ba,#2c5a36)',
                'color:#0d1f12',
                'font-size:' + fontSizeVal,
                'font-weight:700',
                'cursor:pointer',
                'transition:all 0.25s ease',
                'box-shadow:0 4px 14px rgba(129,243,186,0.3)',
                'font-family:inherit',
            ].join(';');
            btnReg.onmouseover = function () {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 6px 20px rgba(129,243,186,0.45)';
            };
            btnReg.onmouseout = function () {
                this.style.transform = '';
                this.style.boxShadow = '0 4px 14px rgba(129,243,186,0.3)';
            };
            // Trigger the existing authModal — register view
            btnReg.onclick = function () {
                var modal = document.getElementById('authModal');
                if (modal) {
                    // Switch to register view
                    var loginView = document.getElementById('modalLoginView');
                    var regView = document.getElementById('modalRegisterView');
                    if (loginView) loginView.style.display = 'none';
                    if (regView) regView.style.display = '';
                    modal.style.display = 'flex';
                } else {
                    window.location.href = '/index.html?register=true';
                }
            };

            guestDiv.appendChild(btnLogin);
            guestDiv.appendChild(btnReg);

            // Insert before the menu-toggle (last child of nav-right)
            navRight.insertBefore(guestDiv, menuToggle || null);
        }
    }
}

// ── 4d. Add `.active` to the matching nav-link ────────────────────
function setActiveLink() {
    var links = document.querySelectorAll('#mainNavLinks .nav-link');
    links.forEach(function (link) {
        link.classList.remove('active');
    });

    // If we are anywhere inside the dashboard pages, do not activate any horizontal marketing links
    if (path.includes('/apres-inscription/')) {
        return;
    }

    // Match other static links by their href on public pages
    links.forEach(function (link) {
        var href = link.getAttribute('href') || '';
        // Extract path part from href
        var hrefPath = href.split('#')[0]; // ignore fragment
        if (hrefPath && path.includes(hrefPath) && hrefPath !== '/') {
            link.classList.add('active');
        }
    });
}

// ── 4e. Scroll effect: shrink top-bar on scroll ───────────────────
function initScrollEffect() {
    var topBar = document.getElementById('topBar');
    if (!topBar) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 30) {
            topBar.classList.add('scrolled');
        } else {
            topBar.classList.remove('scrolled');
        }
    });
}

// ── 4f. Open dropdown on user-pill click ─────────────────────────
function initUserPillClick() {
    var pill = document.getElementById('userPill');
    if (pill) {
        pill.removeAttribute('onclick');
        pill.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleUserMenu();
        });
    }
}

// ── 4g. Populate mobile drawer links dynamically ──────────────────
function populateMobileDrawer() {
    var drawerContainer = document.getElementById('mobileDrawerLinks');
    var mainLinks = document.querySelectorAll('#mainNavLinks .nav-link');
    if (!drawerContainer || mainLinks.length === 0) return;

    drawerContainer.innerHTML = '';

    mainLinks.forEach(function (link) {
        if (link.style.display === 'none') return;

        var copy = document.createElement('a');
        copy.className = 'mobile-drawer-link';
        copy.href = link.href;
        copy.innerHTML = link.innerHTML;

        var pathAttr = link.getAttribute('data-path');
        if (pathAttr) copy.setAttribute('data-path', pathAttr);

        if (link.classList.contains('active')) {
            copy.classList.add('active');
        }

        copy.addEventListener('click', function () {
            closeMobileMenu();
        });

        drawerContainer.appendChild(copy);
    });
}

// ── 4h. Mobile Menu click event binding ──────────────────────────
function initMobileMenuClick() {
    var toggleBtn = document.getElementById('menuToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
}

// ── 5. GLOBAL HELPERS ─────────────────────────────────────────────
window.toggleMobileMenu = function () {
    var drawer = document.getElementById('mobileDrawer');
    var toggleBtn = document.getElementById('menuToggle');
    var overlay = document.getElementById('menuOverlay');

    if (drawer) {
        var isOpen = drawer.classList.contains('show');
        if (isOpen) {
            closeMobileMenu();
        } else {
            // Close dropdown menu first
            var userMenu = document.getElementById('dropdownMenu');
            var pill = document.getElementById('userPill');
            if (userMenu) userMenu.classList.remove('show');
            if (pill) pill.classList.remove('active');

            drawer.classList.add('show');
            if (toggleBtn) toggleBtn.classList.add('active');
            if (overlay) overlay.classList.add('show');
        }
    }
};

window.closeMobileMenu = function () {
    var drawer = document.getElementById('mobileDrawer');
    var toggleBtn = document.getElementById('menuToggle');
    var overlay = document.getElementById('menuOverlay');

    if (drawer) drawer.classList.remove('show');
    if (toggleBtn) toggleBtn.classList.remove('active');

    // Only hide overlay if user dropdown is also closed
    var userMenu = document.getElementById('dropdownMenu');
    var userMenuOpen = userMenu && userMenu.classList.contains('show');
    if (overlay && !userMenuOpen) overlay.classList.remove('show');
};

window.toggleUserMenu = function () {
    var userMenu = document.getElementById('dropdownMenu');
    var overlay = document.getElementById('menuOverlay');
    var pill = document.getElementById('userPill');
    
    if (userMenu) {
        var isOpen = userMenu.classList.contains('show');
        if (isOpen) {
            userMenu.classList.remove('show');
            if (pill) pill.classList.remove('active');
            
            // Only hide overlay if mobile menu is also closed
            var drawer = document.getElementById('mobileDrawer');
            var mobileOpen = drawer && drawer.classList.contains('show');
            if (overlay && !mobileOpen) overlay.classList.remove('show');
        } else {
            // Close mobile menu first
            closeMobileMenu();

            userMenu.classList.add('show');
            if (overlay) overlay.classList.add('show');
            if (pill) pill.classList.add('active');
        }
    }
};

window.closeNavMenu = function () {
    var userMenu = document.getElementById('dropdownMenu');
    var overlay = document.getElementById('menuOverlay');
    var pill = document.getElementById('userPill');
    
    if (userMenu) userMenu.classList.remove('show');
    if (pill) pill.classList.remove('active');
    
    closeMobileMenu();
    if (overlay) overlay.classList.remove('show');
};

window.handleNavLogout = function () {
    // 1. Clear user data, but preserve settings and history
    const keysToPreserve = ['theme', 'agro_theme', 'site_lang', 'agro_historique'];
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToPreserve.includes(key)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 2. Redirect to the root home page
    window.location.href = '/';
};

/**
 * Update Navigation Badges Dynamically
 */
window.updateNavBadges = function (msgCount, networkCount, ordersCount) {
    const msgBadge = document.getElementById('nav-msg-badge');
    const networkBadge = document.getElementById('nav-network-badge');
    const ordersBadge = document.getElementById('nav-orders-badge');

    if (msgBadge && msgCount !== undefined) {
        msgBadge.textContent = msgCount;
        msgBadge.style.display = msgCount > 0 ? 'block' : 'none';
    }
    if (networkBadge && networkCount !== undefined) {
        networkBadge.textContent = networkCount;
        networkBadge.style.display = networkCount > 0 ? 'block' : 'none';
    }
    if (ordersBadge && ordersCount !== undefined) {
        ordersBadge.textContent = ordersCount;
        ordersBadge.style.display = ordersCount > 0 ? 'block' : 'none';
    }
};

// ── 7. REAL-TIME SOCKET NOTIFICATIONS ───────────────────────────
let navNetworkCount = 0;
let navOrdersCount = 0;

function extractUserId(token) {
    try {
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("📦 [navbar.js] Decoded JWT Payload:", payload);

        // Check all common MERN ID patterns
        const extractedId = payload._id || payload.id || payload.userId ||
            (payload.user && payload.user.id) ||
            (payload.user && payload.user._id);

        return extractedId;
    } catch (e) {
        console.error("❌ [navbar.js] Failed to parse JWT for ID:", e);
        return null;
    }
}

function initSocketNotifications() {
    console.log("🔍 [navbar.js] Initializing Socket Notifications...");
    if (typeof io === 'undefined') {
        console.error("❌ [navbar.js] io is UNDEFINED! Socket.io script missing?");
        setTimeout(initSocketNotifications, 1000);
        return;
    }

    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : {};

    // Robust ID lookup
    let userId = user.id || user._id || localStorage.getItem('userId');

    // Fallback: Parse JWT if ID is missing but token exists
    if (!userId && token) {
        console.log("🧩 [navbar.js] userId missing from storage, attempting JWT extraction...");
        userId = extractUserId(token);
    }

    console.log("📋 [navbar.js] Auth Check:", { hasToken: !!token, hasUserId: !!userId, userId });

    if (!token || !userId) {
        console.warn("⚠️ [navbar.js] Socket connection skipped (Missing Token or UserID)");
        return;
    }

    console.log("🌐 [navbar.js] Establishing Socket.io connection...");
    const socket = io();

    // Join personal room on connect
    socket.on('connect', () => {
        console.warn(`🟢 [navbar.js] SOCKET CONNECTED: ${socket.id}`);
        socket.emit('join_user_room', userId);
        socket.emit('join', userId); // Backwards compatibility
    });

    socket.on('join_user_room_confirm', () => {
        console.log(`📡 [navbar.js] Room joined successfully: ${userId}`);
    });

    // Notification increment logic
    const incrementNotif = (message, color = '#81f3ba', type = 'default', subtitle = '', link = '#', meta = {}) => {
        console.warn(`🔥 [navbar.js] UI NOTIF TRIGGERED: ${message}`);

        const isNetwork = (type || '').includes('invitation');

        // 1. Update Global Badge
        if (isNetwork) {
            navNetworkCount++;
            const b = document.getElementById('nav-network-badge');
            if (b) { b.textContent = navNetworkCount; b.style.display = 'block'; }
        } else {
            navOrdersCount++;
            const b = document.getElementById('nav-orders-badge');
            if (b) { b.textContent = navOrdersCount; b.style.display = 'block'; }
        }

        // 2. Audio Alert (Web Audio API Beep)
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
        } catch (e) { console.warn("Audio Context blocked by browser"); }

        // 3. Push to persistent buffer (only network events will be visually rendered in panel now)
        if (!window._notificationBuffer) window._notificationBuffer = [];
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        window._notificationBuffer.unshift({ message, color, time: timeStr, type: type || 'default', subtitle: subtitle || '', link: link || '#', meta: meta });
        console.log(`📌 [navbar.js] Buffer size: ${window._notificationBuffer.length}`);

        // 4. If notification panel is currently open, re-render it live
        if (window._navbarPanelType === 'notifications' && isNetwork) {
            window._renderNotificationPanel();
        }
    };

    // ── Route Helpers ──
    const EXPERT_ORDERS_URL = '/apres-inscription/expertt/les-commande/index.html';
    const FARMER_ORDERS_URL = '/apres-inscription/agriculteur/boutique/expert-boutique.html';

    // Listen for Order Lifecycle Events
    socket.on('new_order', (order) => {
        console.warn('🔥 [SOCKET RECEIVED] new_order:', order);
        incrementNotif(
            `Nouvelle commande reçue!`,
            '#ff4757',
            'new_order',
            `De: ${order.farmerName || 'Agriculteur'} — ${order.product || 'Produits'}`,
            EXPERT_ORDERS_URL
        );
    });

    socket.on('order_accepted', (order) => {
        console.warn('🔥 [SOCKET RECEIVED] order_accepted:', order);
        const shortId = order._id ? order._id.substring(order._id.length - 4).toUpperCase() : '????';
        incrementNotif(
            `Commande #${shortId} acceptée!`,
            '#81f3ba',
            'order_accepted',
            `L'expert a validé votre commande`,
            FARMER_ORDERS_URL
        );
    });

    socket.on('farmer_received_order', (order) => {
        console.warn('🔥 [SOCKET RECEIVED] farmer_received_order:', order);
        incrementNotif(
            `Réception confirmée!`,
            '#10b981',
            'farmer_received',
            `${order.farmerName || 'Client'} a reçu son colis`,
            EXPERT_ORDERS_URL
        );
    });

    socket.on('order_completed', (order) => {
        console.warn('🔥 [SOCKET RECEIVED] order_completed:', order);
        incrementNotif(
            `Commande livrée avec succès!`,
            '#10b981',
            'order_completed',
            `La livraison a été finalisée ✨`,
            FARMER_ORDERS_URL
        );
    });

    // ── 7a-bis. INVITATION NOTIFICATIONS ─────────────────────────
    socket.on('new_invitation', (data) => {
        console.warn('🌱 [SOCKET RECEIVED] new_invitation:', data);
        incrementNotif(
            `Nouvelle Invitation!`,
            '#81f3ba',
            'new_invitation',
            `${data.senderName} veut se connecter avec vous`,
            '#', // Side panel handles it
            { targetId: data.senderId }
        );
    });

    socket.on('invitation_accepted', (data) => {
        console.warn('🤝 [SOCKET RECEIVED] invitation_accepted:', data);
        incrementNotif(
            `Invitation Acceptée!`,
            '#10b981',
            'invitation_accepted',
            `${data.accepterName} a accepté votre demande`,
            '#'
        );
    });

    socket.on('disconnect', () => {
        console.error('🔴 [navbar.js] SOCKET DISCONNECTED');
    });

    // ── 7a-bis. MESSAGE NOTIFICATIONS ────────────────────────────
    let navMsgCount = 0;
    const EXPERT_CHAT_URL = '/apres-inscription/expertt/discussion/index.html';
    const FARMER_CHAT_URL = '/apres-inscription/agriculteur/discussion/index.html';
    const isExpertPage = window.location.pathname.includes('/expertt/');
    const chatUrl = isExpertPage ? EXPERT_CHAT_URL : FARMER_CHAT_URL;

    socket.on('receive_message', (msg) => {
        // Don't notify if we're currently on the chat page looking at this conversation
        if (window.location.pathname.includes('/discussion/')) return;

        console.warn('💬 [SOCKET RECEIVED] receive_message:', msg);
        navMsgCount++;
        const b = document.getElementById('nav-msg-badge');
        if (b) { b.textContent = navMsgCount; b.style.display = 'block'; }

        // Audio beep (different tone for messages)
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) { }

        // Push to notification buffer
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const senderName = msg.senderName || 'Quelqu\'un';
        const preview = msg.content ? (msg.content.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content) : 'Nouveau message';

        if (!window._notificationBuffer) window._notificationBuffer = [];
        window._notificationBuffer.unshift({
            message: `Message de ${senderName}`,
            subtitle: preview,
            color: '#3b82f6',
            type: 'message',
            time: timeStr,
            link: chatUrl
        });

        if (window._navbarPanelType === 'notifications') {
            window._renderNotificationPanel();
        }
    });


    // =======> عوض الكود القديم بهذا <=======
    async function fetchInitialMessageCount() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/chat/unread', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const unread = await res.json();
                if (unread && unread.length > 0) {
                    if (!window._notificationBuffer) window._notificationBuffer = [];

                    const isExpertPage = window.location.pathname.includes('/expertt/');
                    const chatUrl = isExpertPage ? '/apres-inscription/expertt/discussion/index.html' : '/apres-inscription/agriculteur/discussion/index.html';

                    unread.forEach(msg => {
                        const senderName = (msg.sender && msg.sender.nom) ? msg.sender.nom : "Quelqu'un";
                        const preview = msg.content ? (msg.content.length > 30 ? msg.content.substring(0, 30) + '...' : msg.content) : 'Nouveau message';

                        window._notificationBuffer.push({
                            message: `Message non lu`,
                            subtitle: `${senderName}: ${preview}`,
                            color: '#3b82f6', // لون أزرق تاع الميساجات
                            type: 'message',
                            time: 'Nouveau',
                            link: chatUrl
                        });
                    });

                    // نطلعو العداد تاع النقطة الزرقاء تاع الميساجات
                    navMsgCount += unread.length;
                    const msgBadge = document.getElementById('nav-msg-badge');
                    if (msgBadge) {
                        msgBadge.textContent = navMsgCount;
                        msgBadge.style.display = 'block';
                    }
                }
            }
        } catch (e) {
            console.warn('[navbar.js] Could not fetch unread messages:', e);
        }
    }
    fetchInitialMessageCount();
    // =======> نهاية الكود <=======






    // ── 7b. INITIAL STATE FETCH (Persistence on Reload) ─────────
    async function fetchInitialNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const isExpertUser = (localStorage.getItem('userRole') || '').toLowerCase() === 'expert' || window.location.pathname.includes('/expertt/');
            const endpoint = isExpertUser ? '/api/orders/expert' : '/api/orders/farmer';

            const res = await fetch(endpoint, {
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                const allOrders = await res.json();
                let pendingCount = 0;

                if (isExpertUser) {
                    const pending = allOrders.filter(o => o.status === 'En attente' || o.status === 'Nouvelle');
                    const received = allOrders.filter(o => o.farmerReceived === true && o.status !== 'Livrée');
                    pendingCount = pending.length + received.length;

                    pending.forEach(o => {
                        const timeStr = new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        window._notificationBuffer.push({
                            message: `Commande en attente`,
                            subtitle: `De: ${o.farmerName || 'Agriculteur'} — ${o.product || 'Produits'}`,
                            color: '#ff4757',
                            type: 'pending',
                            time: timeStr,
                            link: EXPERT_ORDERS_URL
                        });
                    });
                    received.forEach(o => {
                        window._notificationBuffer.push({
                            message: `Réception confirmée`,
                            subtitle: `${o.farmerName || 'Client'} a reçu son colis`,
                            color: '#10b981',
                            type: 'farmer_received',
                            time: 'Récemment',
                            link: EXPERT_ORDERS_URL
                        });
                    });
                } else {
                    const accepted = allOrders.filter(o => o.status === 'Validée');
                    pendingCount = accepted.length;
                    accepted.forEach(o => {
                        window._notificationBuffer.push({
                            message: `Commande acceptée`,
                            subtitle: `Votre commande a été validée par l'expert`,
                            color: '#81f3ba',
                            type: 'order_accepted',
                            time: 'Récemment',
                            link: FARMER_ORDERS_URL
                        });
                    });
                }

                if (pendingCount > 0) {
                    navNotifCount = pendingCount;
                    window.updateNavBadges(0, navNotifCount);
                }
                console.log(`📋 [navbar.js] Initial notifications loaded: ${pendingCount} pending`);
            }
        } catch (e) {
            console.warn('[navbar.js] Could not fetch initial notifications:', e);
        }
    }

    fetchInitialNotifications();

    // =======> ألصق الكود هنايا <=======
    // ── 7c. جلب طلبات الصداقة المعلقة كي يفتح المستعمل الصفحة ─────────
    async function fetchInitialInvitations() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/api/user/invitations', {
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                const invitations = await res.json();

                if (invitations && invitations.length > 0) {
                    if (!window._notificationBuffer) window._notificationBuffer = [];
                    invitations.forEach(inv => {
                        window._notificationBuffer.push({
                            message: `Nouvelle Invitation!`,
                            subtitle: `${inv.nom || "Quelqu'un"} veut se connecter avec vous`,
                            color: '#81f3ba',
                            type: 'new_invitation',
                            time: 'En attente',
                            link: '#',
                            meta: { targetId: inv._id }
                        });
                    });

                    navNetworkCount += invitations.length;
                    const badge = document.getElementById('nav-network-badge');
                    if (badge) {
                        badge.textContent = navNetworkCount;
                        badge.style.display = 'block';
                    }
                }
            }
        } catch (e) {
            console.warn('[navbar.js] Erreur chargement invitations:', e);
        }
    }

    fetchInitialInvitations();
    // =======> نهاية الكود اللي ألصقتو <=======

}

// ── 8. BOOT ───────────────────────────────────────────────────────
// Step 1: Inject CSS + fonts + socket.io
injectDependencies();
// Step 2: Inject side panel shell + register openSidePanel globally
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidePanel);
} else {
    injectSidePanel();
}
// Step 3: Load and render the navbar HTML
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
    // DOM already ready (script loaded at bottom of body)
    loadNavbar();
}

// Initialize badges + Sockets
setTimeout(function () {
    if (window.updateNavBadges) window.updateNavBadges(0, 0);
    initSocketNotifications();
}, 800);

})();
