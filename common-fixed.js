function createNavbar() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.body.insertAdjacentHTML('afterbegin', `
    <nav class="navbar" aria-label="Main navigation">
      <div class="navbar-inner">
        <p class="site-title">Sad Alien</p>
        <ul class="nav-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="about.html">About</a></li>
          <li class="tool-dropdown">
            <button type="button" class="tool-link" aria-expanded="false" aria-controls="tool-links">Tools</button>
            <div id="tool-links" class="tool-dropdown-content" hidden>
              <a href="colormatcher.html">Color Matcher</a>
              <a href="imagetohex.html">Image to Hex</a>
            </div>
          </li>
          <li><a href="music.html">Music</a></li>
          <li><a href="browsergames.html">Pinball</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
    </nav>`);

  const navbar = document.querySelector('.navbar');
  navbar.querySelectorAll('a').forEach(link => {
    if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });

  const tools = navbar.querySelector('.tool-dropdown');
  const toggle = tools.querySelector('button');
  const links = tools.querySelector('.tool-dropdown-content');

  function setExpanded(expanded) {
    toggle.setAttribute('aria-expanded', String(expanded));
    links.hidden = !expanded;
  }

  toggle.addEventListener('click', () => setExpanded(links.hidden));
  document.addEventListener('click', event => {
    if (!tools.contains(event.target)) setExpanded(false);
  });
  tools.addEventListener('focusout', event => {
    if (!tools.contains(event.relatedTarget)) setExpanded(false);
  });
  tools.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !links.hidden) {
      setExpanded(false);
      toggle.focus();
    }
  });

  const decoration = document.getElementById('svg-container');
  if (page === 'index.html' && decoration) navbar.appendChild(decoration);

  const stars = document.createDocumentFragment();
  for (let index = 0; index < 200; index++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    const size = `${0.5 + Math.random() * 1.5}px`;
    star.style.width = size;
    star.style.height = size;
    star.style.setProperty('--twinkle-duration', `${2 + Math.random() * 4}s`);
    star.style.animationDelay = `${Math.random() * 4}s`;
    stars.append(star);
  }
  navbar.append(stars);
}

function initializeScreenshotModal() {
  const dialog = document.querySelector('dialog.modal');
  if (!dialog?.showModal) return;

  const screenshots = Array.from(document.querySelectorAll('.screenshot-gallery a'));
  const image = dialog.querySelector('img');
  let currentIndex = 0;
  let opener;

  function showScreenshot(index) {
    currentIndex = (index + screenshots.length) % screenshots.length;
    image.alt = `Gameplay screenshot ${currentIndex + 1} of ${screenshots.length}`;
    image.src = screenshots[currentIndex].href;
  }

  screenshots.forEach((screenshot, index) => {
    screenshot.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = screenshot;
      showScreenshot(index);
      dialog.showModal();
    });
  });

  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.modal-prev').addEventListener('click', () => showScreenshot(currentIndex - 1));
  dialog.querySelector('.modal-next').addEventListener('click', () => showScreenshot(currentIndex + 1));
  dialog.addEventListener('close', () => opener.focus());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showScreenshot(currentIndex - 1);
    if (event.key === 'ArrowRight') showScreenshot(currentIndex + 1);
  });
}

createNavbar();
initializeScreenshotModal();