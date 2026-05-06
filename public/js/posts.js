(function () {
  function postAuthor(post) {
    return post.author || {
      id: post.user_id,
      full_name: 'Vyntra User',
      username: 'unknown',
      profile_image_url: window.Vyntra.defaultAvatar
    };
  }

  function followButton(author, post) {
    if (!author?.id || post.viewer?.isOwner) return '';
    const following = Boolean(post.viewer?.followingAuthor);
    return `
      <button class="btn btn-sm ${following ? 'btn-outline-vyntra' : 'btn-vyntra'}"
        type="button"
        data-follow-button
        data-user-id="${author.id}"
        data-following="${following ? 'true' : 'false'}"
        onclick="toggleFollow('${author.id}')">
        <i data-lucide="${following ? 'user-minus' : 'user-plus'}"></i>
        <span>${following ? 'Unfollow' : 'Follow'}</span>
      </button>`;
  }

  function mediaMarkup(post, options) {
    const image = post.image_url
      ? `<img class="post-image" src="${post.image_url}" alt="${window.Vyntra.escapeHtml(post.title)}" loading="lazy">`
      : '';

    if (!post.pdf_url) return image;

    const pdf = options?.embedPdf
      ? `<iframe class="pdf-frame" src="${post.pdf_url}" title="PDF preview for ${window.Vyntra.escapeHtml(post.title)}"></iframe>`
      : `<a class="pdf-link" href="${post.pdf_url}" target="_blank" rel="noopener">
          <i data-lucide="file-text"></i><span>View PDF</span>
        </a>`;

    return `${image}${pdf}`;
  }

  function actionButton({ post, type, icon, activeIcon, label, count, active, handler }) {
    return `
      <button class="btn btn-ghost ${active ? 'active' : ''}"
        type="button"
        data-${type}-button
        data-post-id="${post.id}"
        data-${type === 'like' ? 'liked' : type === 'repost' ? 'reposted' : 'active'}="${active ? 'true' : 'false'}"
        onclick="${handler}('${post.id}')"
        aria-label="${label}">
        <i data-lucide="${active && activeIcon ? activeIcon : icon}"></i>
        <span data-${type}-count>${count || 0}</span>
        <span class="action-label">${label}</span>
      </button>`;
  }

  window.renderPostCard = function renderPostCard(post, options = {}) {
    const author = postAuthor(post);
    const commentsId = `comments-${post.id}`;

    return `
      <article class="post-card" data-post-card="${post.id}">
        <header class="post-author">
          <a href="/profile?id=${encodeURIComponent(author.id)}" aria-label="View ${window.Vyntra.escapeHtml(author.full_name)} profile">
            <img class="avatar" src="${author.profile_image_url || window.Vyntra.defaultAvatar}" alt="${window.Vyntra.escapeHtml(author.full_name)}">
          </a>
          <div class="author-meta flex-grow-1">
            <a class="author-name" href="/profile?id=${encodeURIComponent(author.id)}">${window.Vyntra.escapeHtml(author.full_name)}</a>
            <span class="author-username">@${window.Vyntra.escapeHtml(author.username)} &middot; ${window.Vyntra.formatDate(post.created_at)}</span>
          </div>
          ${followButton(author, post)}
        </header>
        <h2 class="post-title">${window.Vyntra.escapeHtml(post.title)}</h2>
        <p class="post-description">${window.Vyntra.escapeHtml(post.description)}</p>
        ${mediaMarkup(post, options)}
        <div class="post-actions" aria-label="Post actions">
          ${actionButton({
            post,
            type: 'like',
            icon: 'heart',
            activeIcon: 'heart',
            label: post.viewer?.liked ? 'Unlike' : 'Like',
            count: post.counts?.likes,
            active: post.viewer?.liked,
            handler: 'toggleLike'
          })}
          ${actionButton({
            post,
            type: 'comment',
            icon: 'message-circle',
            label: 'Comment',
            count: post.counts?.comments,
            active: false,
            handler: 'toggleComments'
          })}
          ${actionButton({
            post,
            type: 'share',
            icon: 'send',
            label: 'Share',
            count: post.counts?.shares,
            active: false,
            handler: 'sharePost'
          })}
          ${actionButton({
            post,
            type: 'repost',
            icon: 'repeat-2',
            activeIcon: 'repeat-2',
            label: post.viewer?.reposted ? 'Remove' : 'Repost',
            count: post.counts?.reposts,
            active: post.viewer?.reposted,
            handler: 'toggleRepost'
          })}
        </div>
        <section class="comments-panel d-none" id="${commentsId}" data-comments-panel="${post.id}">
          <div data-comments-list="${post.id}" class="mb-3"></div>
          <form data-comment-form="${post.id}" onsubmit="addComment(event, '${post.id}')">
            <label class="form-label" for="comment-input-${post.id}">Add a comment</label>
            <div class="d-flex gap-2">
              <input class="form-control" id="comment-input-${post.id}" name="comment_text" placeholder="Write your comment" autocomplete="off" required>
              <button class="btn btn-vyntra px-3" type="submit" aria-label="Post comment"><i data-lucide="send"></i></button>
            </div>
          </form>
        </section>
      </article>`;
  };

  function loadingPostMarkup() {
    return `
      <div class="post-card">
        <div class="d-flex gap-3 mb-3">
          <div class="avatar"></div>
          <div class="flex-grow-1 pt-1">
            <div class="loader-line w-50 mb-2"></div>
            <div class="loader-line w-25"></div>
          </div>
        </div>
        <div class="loader-line mb-3"></div>
        <div class="loader-line w-75 mb-3"></div>
        <div class="loader-line" style="height:180px"></div>
      </div>`;
  }

  function emptyPostsMarkup(message) {
    const canCreate = Boolean(window.Vyntra.currentUser);
    const defaultMessage = canCreate
      ? 'No posts yet. Be the first to share something on Vyntra.'
      : 'No posts yet. Login to create the first post.';

    return `
      <div class="empty-state">
        <i data-lucide="messages-square" width="34" height="34"></i>
        <h2 class="h4 mt-3">No posts yet</h2>
        <p class="muted-text mb-0">${window.Vyntra.escapeHtml(message || defaultMessage)}</p>
      </div>`;
  }

  function searchQuery() {
    return (new URLSearchParams(window.location.search).get('q') || '').trim().toLowerCase();
  }

  function matchesSearch(post, query) {
    if (!query) return true;
    const author = postAuthor(post);
    return [post.title, post.description, author.full_name, author.username]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  }

  function profileSearchMarkup(profiles, query) {
    if (!query) return '';

    return `
      <section class="post-card search-results-card">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h2 class="section-title">Profiles</h2>
          <span class="caption">${profiles.length} found</span>
        </div>
        ${
          profiles.length
            ? profiles
                .map(
                  (profile) => `
                    <a class="suggested-user" href="/profile?id=${encodeURIComponent(profile.id)}">
                      <img class="avatar avatar-sm" src="${profile.profile_image_url || window.Vyntra.defaultAvatar}" alt="${window.Vyntra.escapeHtml(profile.full_name)}">
                      <span class="min-w-0">
                        <strong class="d-block text-truncate">${window.Vyntra.escapeHtml(profile.full_name)}</strong>
                        <span class="caption">@${window.Vyntra.escapeHtml(profile.username)}</span>
                      </span>
                    </a>`
                )
                .join('')
            : '<p class="muted-text mb-0">No profiles matched this search.</p>'
        }
      </section>`;
  }

  window.loadFeedPosts = async function loadFeedPosts() {
    const mount = document.getElementById('feedList');
    if (!mount) return;

    mount.innerHTML = loadingPostMarkup();
    try {
      const query = searchQuery();
      const [payload, profilePayload] = await Promise.all([
        window.Vyntra.apiFetch('/api/posts'),
        query
          ? window.Vyntra.apiFetch(`/api/profiles?limit=8&search=${encodeURIComponent(query)}`)
          : Promise.resolve({ profiles: [] })
      ]);
      const posts = (payload.posts || []).filter((post) => matchesSearch(post, query));
      const profileResults = profileSearchMarkup(profilePayload.profiles || [], query);
      const postResults = posts.length
        ? posts.map((post) => window.renderPostCard(post)).join('')
        : emptyPostsMarkup(query ? `No posts found for "${query}".` : undefined);
      mount.innerHTML = `${profileResults}${postResults}`;
    } catch (error) {
      mount.innerHTML = `<div class="empty-state"><i data-lucide="wifi-off"></i><h2 class="h4 mt-3">Feed unavailable</h2><p class="muted-text mb-0">${window.Vyntra.escapeHtml(error.message)}</p></div>`;
    }
    window.Vyntra.renderIcons();
  };

  window.loadUserPosts = async function loadUserPosts(userId, mountId = 'userPosts') {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    mount.innerHTML = loadingPostMarkup();
    try {
      const payload = await window.Vyntra.apiFetch(`/api/users/${encodeURIComponent(userId)}/posts`);
      const posts = payload.posts || [];
      mount.innerHTML = posts.length
        ? posts.map((post) => window.renderPostCard(post)).join('')
        : emptyPostsMarkup('This user has not posted yet.');
    } catch (error) {
      mount.innerHTML = `<div class="empty-state"><p class="muted-text mb-0">${window.Vyntra.escapeHtml(error.message)}</p></div>`;
    }
    window.Vyntra.renderIcons();
  };

  window.loadSinglePost = async function loadSinglePost(postId) {
    const mount = document.getElementById('singlePost');
    if (!mount) return;

    mount.innerHTML = loadingPostMarkup();
    try {
      const payload = await window.Vyntra.apiFetch(`/api/posts/${encodeURIComponent(postId)}`);
      mount.innerHTML = window.renderPostCard(payload.post, { embedPdf: true });
    } catch (error) {
      mount.innerHTML = `<div class="empty-state"><i data-lucide="file-question"></i><h1 class="h4 mt-3">Post not found</h1><p class="muted-text mb-0">${window.Vyntra.escapeHtml(error.message)}</p></div>`;
    }
    window.Vyntra.renderIcons();
  };

  function validateCreatePostFiles(imageFile, pdfFile) {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (imageFile) {
      if (!imageTypes.includes(imageFile.type)) throw new Error('Image must be JPG, PNG, or WEBP.');
      if (imageFile.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
    }
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') throw new Error('PDF file must be PDF format only.');
      if (pdfFile.size > 10 * 1024 * 1024) throw new Error('PDF must be 10 MB or smaller.');
    }
  }

  function validateImageUrl(value) {
    const cleaned = value.trim();
    if (!cleaned) return '';

    let url;
    try {
      url = new URL(cleaned);
    } catch (error) {
      throw new Error('Image URL must be a valid URL.');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Image URL must start with http or https.');
    }

    return url.toString();
  }

  function clearImagePreview() {
    const mount = document.getElementById('imagePreview');
    if (!mount) return;

    if (mount.dataset.objectUrl) {
      URL.revokeObjectURL(mount.dataset.objectUrl);
      delete mount.dataset.objectUrl;
    }
    mount.innerHTML = '';
  }

  window.previewImage = function previewImage(file) {
    const mount = document.getElementById('imagePreview');
    if (!mount) return;

    if (!file) {
      clearImagePreview();
      return;
    }

    clearImagePreview();
    const url = URL.createObjectURL(file);
    mount.dataset.objectUrl = url;
    mount.innerHTML = `
      <img class="image-preview" src="${url}" alt="Selected post image preview">
      <div class="preview-toolbar">
        <span class="caption">${window.Vyntra.escapeHtml(file.name)} &middot; ${window.Vyntra.fileSize(file.size)}</span>
        <button class="btn btn-sm btn-outline-vyntra" type="button" data-remove-image><i data-lucide="x"></i>Remove</button>
      </div>`;

    mount.querySelector('[data-remove-image]').addEventListener('click', () => {
      document.getElementById('postImage').value = '';
      clearImagePreview();
    });
    window.Vyntra.renderIcons();
  };

  window.previewImageUrl = function previewImageUrl(value) {
    const mount = document.getElementById('imagePreview');
    if (!mount) return;

    clearImagePreview();
    const cleaned = value.trim();
    if (!cleaned) return;

    let imageUrl;
    try {
      imageUrl = validateImageUrl(cleaned);
    } catch (error) {
      mount.innerHTML = `<p class="caption mt-2 mb-0">${window.Vyntra.escapeHtml(error.message)}</p>`;
      return;
    }

    mount.innerHTML = `
      <img class="image-preview" src="${imageUrl}" alt="Pasted post image preview">
      <div class="preview-toolbar">
        <span class="caption text-truncate">${window.Vyntra.escapeHtml(imageUrl)}</span>
        <button class="btn btn-sm btn-outline-vyntra" type="button" data-remove-image-url><i data-lucide="x"></i>Remove</button>
      </div>`;

    mount.querySelector('[data-remove-image-url]').addEventListener('click', () => {
      document.getElementById('postImageUrl').value = '';
      clearImagePreview();
    });
    window.Vyntra.renderIcons();
  };

  window.previewPdf = function previewPdf(file) {
    const mount = document.getElementById('pdfPreview');
    if (!mount) return;

    if (!file) {
      mount.innerHTML = '';
      return;
    }

    const url = URL.createObjectURL(file);
    mount.innerHTML = `
      <div class="preview-toolbar">
        <span class="caption"><i data-lucide="file-text"></i> ${window.Vyntra.escapeHtml(file.name)} &middot; ${window.Vyntra.fileSize(file.size)}</span>
        <button class="btn btn-sm btn-outline-vyntra" type="button" data-remove-pdf><i data-lucide="x"></i>Remove</button>
      </div>
      <div class="pdf-preview"><iframe src="${url}" title="Selected PDF preview"></iframe></div>`;

    mount.querySelector('[data-remove-pdf]').addEventListener('click', () => {
      document.getElementById('postPdf').value = '';
      URL.revokeObjectURL(url);
      mount.innerHTML = '';
    });
    window.Vyntra.renderIcons();
  };

  async function createPost(event) {
    event.preventDefault();
    if (!(await window.Vyntra.requireAuth('create', '/create'))) return;

    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const imageFile = form.image.files[0];
    const pdfFile = form.pdf.files[0];

    try {
      const imageUrl = validateImageUrl(form.elements.image_url?.value || '');
      if (imageFile && imageUrl) throw new Error('Choose either an uploaded image or an image URL, not both.');
      validateCreatePostFiles(imageFile, pdfFile);
      const formData = new FormData();
      formData.append('title', form.title.value.trim());
      formData.append('description', form.description.value.trim());
      if (imageFile) formData.append('image', imageFile);
      if (imageUrl) formData.append('image_url', imageUrl);
      if (pdfFile) formData.append('pdf', pdfFile);

      window.Vyntra.setButtonLoading(button, true, 'Publishing');
      await window.Vyntra.apiFetch('/api/posts', {
        method: 'POST',
        body: formData
      });

      window.Vyntra.showToast('Post created successfully');
      window.location.href = '/';
    } catch (error) {
      window.Vyntra.showToast(error.message || 'Invalid form input', 'danger');
    } finally {
      window.Vyntra.setButtonLoading(button, false);
    }
  }

  async function initPostsPage() {
    await window.Vyntra.ready;

    const loadAfterShell = (callback) => {
      if (window.Vyntra.shellReady) callback();
      else document.addEventListener('vyntra:auth-ready', callback, { once: true });
    };

    if (document.body.dataset.page === 'home' || document.body.dataset.page === 'explore') {
      loadAfterShell(loadFeedPosts);
    }

    if (document.body.dataset.page === 'post') {
      const postId = new URLSearchParams(window.location.search).get('id');
      if (postId) loadAfterShell(() => loadSinglePost(postId));
      else document.getElementById('singlePost').innerHTML = emptyPostsMarkup('Choose a post from the feed to view details.');
    }

    const createForm = document.getElementById('createPostForm');
    if (createForm) {
      createForm.addEventListener('submit', createPost);
      createForm.image.addEventListener('change', (event) => previewImage(event.target.files[0]));
      createForm.elements.image_url?.addEventListener('input', (event) => previewImageUrl(event.target.value));
      createForm.pdf.addEventListener('change', (event) => previewPdf(event.target.files[0]));

      document.querySelectorAll('[data-image-source]').forEach((button) => {
        button.addEventListener('click', () => {
          const source = button.dataset.imageSource;

          document.querySelectorAll('[data-image-source]').forEach((node) => {
            const active = node.dataset.imageSource === source;
            node.classList.toggle('active', active);
            node.setAttribute('aria-pressed', active ? 'true' : 'false');
          });

          document.querySelectorAll('[data-image-source-panel]').forEach((panel) => {
            panel.classList.toggle('d-none', panel.dataset.imageSourcePanel !== source);
          });

          if (source === 'upload') {
            createForm.elements.image_url.value = '';
          } else {
            createForm.image.value = '';
          }
          clearImagePreview();
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initPostsPage);
})();
