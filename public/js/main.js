(function () {
  const routes = {
    home: '/',
    explore: '/explore',
    profile: '/profile',
    create: '/create',
    settings: '/settings',
    login: '/login'
  };

  const publicNavItems = [
    { key: 'home', label: 'Home', href: routes.home, icon: 'home' },
    { key: 'explore', label: 'Explore', href: routes.explore, icon: 'compass' }
  ];

  const appNavItems = [
    ...publicNavItems,
    { key: 'create', label: 'Create', href: routes.create, icon: 'square-pen' },
    { key: 'profile', label: 'Profile', href: routes.profile, icon: 'user-round' },
    { key: 'settings', label: 'Settings', href: routes.settings, icon: 'settings' }
  ];

  function activeClass(itemKey, active) {
    return itemKey === active ? 'active' : '';
  }

  function isLoggedIn() {
    return Boolean(window.Vyntra?.currentUser);
  }

  function activePage() {
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (pathname === '/explore' || new URLSearchParams(window.location.search).get('view') === 'explore') {
      return 'explore';
    }
    return document.body.dataset.page || 'home';
  }

  function profileHref() {
    const id = window.Vyntra?.currentUser?.id;
    return id ? `${routes.profile}?id=${encodeURIComponent(id)}` : window.Vyntra.loginUrl('profile', routes.profile);
  }

  function navLink(item, active, className = 'nav-link-pill') {
    const href = item.key === 'profile' ? profileHref() : item.href;
    return `
      <a class="${className} ${activeClass(item.key, active)}" href="${href}">
        <i data-lucide="${item.icon}"></i><span>${item.label}</span>
      </a>`;
  }

  function renderNavbar(active) {
    const mount = document.getElementById('appNavbar');
    if (!mount) return;

    const loggedIn = isLoggedIn();
    const profile = window.Vyntra?.currentProfile;
    const avatar = profile?.profile_image_url || window.Vyntra.defaultAvatar;
    const searchValue = window.Vyntra.escapeHtml(new URLSearchParams(window.location.search).get('q') || '');

    mount.innerHTML = `
      <nav class="vyntra-navbar">
        <a class="brand-link" href="${routes.home}" aria-label="Vyntra Social home">
          <img src="assets/logo.png" alt="Vyntra Social logo">
          <span>Vyntra Social <small class="brand-subtitle d-block">Connect. Share. Grow.</small></span>
        </a>

        <div class="nav-center" aria-label="Primary navigation">
          ${publicNavItems.map((item) => navLink(item, active)).join('')}
        </div>

        <form class="nav-search" action="${routes.explore}" role="search">
          <i data-lucide="search"></i>
          <input type="search" name="q" value="${searchValue}" placeholder="Search users or posts" aria-label="Search users or posts">
        </form>

        <div class="nav-actions">
          <button class="icon-btn" type="button" onclick="toggleTheme()" aria-label="Toggle dark and light mode" title="Toggle theme">
            <i data-theme-icon data-lucide="moon"></i>
          </button>
          <button class="icon-btn d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu" aria-controls="mobileMenu" aria-label="Open menu">
            <i data-lucide="menu"></i>
          </button>
          ${
            loggedIn
              ? `<a class="btn btn-vyntra btn-navbar-create d-none d-md-inline-flex align-items-center gap-2" href="${routes.create}">
                   <i data-lucide="square-pen"></i><span>Create</span>
                 </a>
                 <a class="profile-btn" href="${profileHref()}" title="Profile" aria-label="Profile">
                   <img class="profile-btn-avatar" src="${avatar}" alt="${window.Vyntra.escapeHtml(profile?.full_name || 'Profile')}">
                 </a>
                 <button class="icon-btn d-none d-sm-inline-flex" type="button" data-logout-button aria-label="Logout" title="Logout">
                   <i data-lucide="log-out"></i>
                 </button>`
              : `<a class="btn btn-outline-vyntra btn-navbar-login" href="${routes.login}">Login</a>`
          }
        </div>
      </nav>
      <div class="offcanvas offcanvas-start" tabindex="-1" id="mobileMenu" aria-labelledby="mobileMenuLabel">
        <div class="offcanvas-header">
          <h2 class="h5 mb-0" id="mobileMenuLabel">Vyntra Social</h2>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <form class="mobile-search mb-3" action="${routes.explore}" role="search">
            <i data-lucide="search"></i>
            <input type="search" name="q" value="${searchValue}" placeholder="Search users or posts" aria-label="Search users or posts">
          </form>
          <div class="sidebar-menu">
            ${(loggedIn ? appNavItems : publicNavItems).map((item) => navLink(item, active, 'sidebar-link')).join('')}
            ${
              loggedIn
                ? '<button class="sidebar-link text-start" type="button" data-logout-button><i data-lucide="log-out"></i><span>Logout</span></button>'
                : `<a class="sidebar-link" href="${routes.login}"><i data-lucide="log-in"></i><span>Login</span></a>`
            }
          </div>
        </div>
      </div>`;

    wireLogoutButtons();
  }

  function renderSidebar(active) {
    document.querySelectorAll('.js-sidebar').forEach((mount) => {
      const showSidebar = isLoggedIn() && ['profile', 'create', 'settings'].includes(active);
      mount.innerHTML = showSidebar
        ? `
          <aside class="sidebar-card">
            <nav class="sidebar-menu" aria-label="Sidebar navigation">
              ${appNavItems.map((item) => navLink(item, active, 'sidebar-link')).join('')}
            </nav>
          </aside>`
        : '';
      mount.classList.toggle('is-hidden', !showSidebar);
    });
  }

  function renderBottomNav(active) {
    const mount = document.getElementById('mobileBottomNav');
    if (!mount) return;

    if (!isLoggedIn()) {
      mount.className = '';
      mount.innerHTML = '';
      return;
    }

    const items = [
      { key: 'home', label: 'Home', href: routes.home, icon: 'home' },
      { key: 'explore', label: 'Explore', href: routes.explore, icon: 'compass' },
      { key: 'create', label: 'Create', href: routes.create, icon: 'plus-square' },
      { key: 'profile', label: 'Profile', href: profileHref(), icon: 'user-round' }
    ];

    mount.className = 'mobile-bottom-nav';
    mount.innerHTML = items.map((item) => navLink(item, active, 'bottom-nav-link')).join('');
  }

  function renderConfigWarning() {
    if (window.Vyntra?.config?.status?.ready !== false) return;
    const mount = document.querySelector('[data-config-warning]');
    if (!mount) return;

    mount.innerHTML = `
      <div class="config-warning mb-4">
        <i data-lucide="key-round" class="mb-3" width="34" height="34"></i>
        <h1 class="h4">Supabase keys are needed</h1>
        <p class="muted-text mb-0">Add your project URL, anon key, and service role key to <code>.env</code>, then restart the server.</p>
      </div>`;
  }

  function updateFeedIntro(active) {
    const title = document.querySelector('[data-feed-title]');
    const subtitle = document.querySelector('[data-feed-subtitle]');
    const eyebrow = document.querySelector('[data-feed-eyebrow]');
    if (!title || !subtitle || !eyebrow) return;

    const query = new URLSearchParams(window.location.search).get('q');
    if (active === 'explore') {
      eyebrow.textContent = 'Explore Vyntra';
      title.textContent = query ? `Search results for "${query}"` : 'Explore';
      subtitle.textContent = query ? 'Public posts matching your search.' : 'Browse public posts and discover people across the community.';
      return;
    }

    eyebrow.textContent = 'Public community feed';
    title.textContent = 'Home Feed';
    subtitle.textContent = 'Newest posts from the Vyntra community.';
  }

  async function renderRightPanel(active) {
    const mount = document.querySelector('.js-right-panel');
    if (!mount) return;

    const shouldShow = isLoggedIn() && ['profile', 'explore'].includes(active) && window.Vyntra?.currentProfile;
    mount.classList.toggle('is-hidden', !shouldShow);
    if (!shouldShow) {
      mount.innerHTML = '';
      return;
    }

    const profile = window.Vyntra.currentProfile;
    mount.innerHTML = `
      <aside class="right-stack">
        <section class="right-card">
          <div class="right-profile">
            <img class="avatar" src="${profile.profile_image_url || window.Vyntra.defaultAvatar}" alt="${window.Vyntra.escapeHtml(profile.full_name)}">
            <div class="min-w-0">
              <strong class="d-block text-truncate">${window.Vyntra.escapeHtml(profile.full_name)}</strong>
              <span class="caption">@${window.Vyntra.escapeHtml(profile.username)}</span>
            </div>
          </div>
          <div class="right-stats">
            <div><span class="stat-number">${profile.counts?.followers || 0}</span><span class="caption">Followers</span></div>
            <div><span class="stat-number">${profile.counts?.following || 0}</span><span class="caption">Following</span></div>
            <div><span class="stat-number">${profile.counts?.posts || 0}</span><span class="caption">Posts</span></div>
          </div>
        </section>
        <section class="right-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h2 class="h6 mb-0">Suggested Users</h2>
            <i data-lucide="sparkles" class="muted-text"></i>
          </div>
          <div data-suggested-users>
            <div class="loader-line mb-2"></div>
            <div class="loader-line w-75"></div>
          </div>
        </section>
      </aside>`;

    try {
      const payload = await window.Vyntra.apiFetch('/api/profiles?limit=6');
      const suggested = (payload.profiles || []).filter((item) => item.id !== profile.id).slice(0, 4);
      const list = mount.querySelector('[data-suggested-users]');
      if (!suggested.length) {
        list.innerHTML = '<p class="caption mb-0">No suggestions yet.</p>';
      } else {
        list.innerHTML = suggested
          .map(
            (item) => `
              <div class="suggested-user">
                <img class="avatar avatar-sm" src="${item.profile_image_url || window.Vyntra.defaultAvatar}" alt="${window.Vyntra.escapeHtml(item.full_name)}">
                <a class="min-w-0 flex-grow-1" href="${routes.profile}?id=${encodeURIComponent(item.id)}">
                  <strong class="d-block text-truncate">${window.Vyntra.escapeHtml(item.full_name)}</strong>
                  <span class="caption">@${window.Vyntra.escapeHtml(item.username)}</span>
                </a>
              </div>`
          )
          .join('');
      }
    } catch (error) {
      mount.querySelector('[data-suggested-users]').innerHTML = '<p class="caption mb-0">Suggestions unavailable.</p>';
    }
  }

  function wireLogoutButtons() {
    document.querySelectorAll('[data-logout-button]').forEach((button) => {
      button.addEventListener('click', () => window.logoutUser?.());
    });
  }

  async function initShell() {
    const active = activePage();

    renderNavbar(active);
    renderSidebar(active);
    renderBottomNav(active);
    updateFeedIntro(active);
    window.loadSavedTheme?.();
    window.Vyntra?.renderIcons?.();

    await window.Vyntra.ready;
    renderConfigWarning();

    const authMode = document.body.dataset.auth;
    const session = await window.Vyntra.getSession();

    if (authMode === 'required' && !session) {
      window.location.href = window.Vyntra.loginUrl(active, window.Vyntra.currentPath());
      return;
    }

    if (authMode === 'guest' && session) {
      const params = new URLSearchParams(window.location.search);
      window.location.href = window.Vyntra.safeRedirect(params.get('redirect'), routes.home);
      return;
    }

    if (session && window.getCurrentUser) {
      try {
        await window.getCurrentUser();
      } catch (error) {
        if (authMode === 'required') {
          window.Vyntra.showToast(error.message, 'danger');
        }
      }
    }

    document.body.classList.toggle('is-authenticated', Boolean(window.Vyntra.currentUser));
    renderNavbar(active);
    renderSidebar(active);
    renderBottomNav(active);
    await renderRightPanel(active);
    window.Vyntra.shellReady = true;
    window.Vyntra.renderIcons();
    document.dispatchEvent(new CustomEvent('vyntra:auth-ready', { detail: { session } }));
  }

  document.addEventListener('DOMContentLoaded', initShell);
})();
