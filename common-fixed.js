// Function to create the navigation bar
function createNavbar() {
  const isHome =
    window.location.href.includes('index.html') ||
    window.location.pathname === '/';
  console.log('isHome?', isHome);

  const navbar = `
<nav class="navbar">
  <div class="navbar-inner">
    <h1 class="site-title">Sad Alien</h1>
    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li class="tool-dropdown">
        <a class="tool-link">Tools</a>
        <div class="tool-dropdown-content">
          <a href="colormatcher.html">Color Matcher</a>
          <a href="imagetohex.html">Image to Hex</a>
        </div>
      </li>
      <li><a href="music.html">Music</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </div>
</nav>`;

  document.body.insertAdjacentHTML('afterbegin', navbar);

  if (isHome) {
    const navbarElem = document.querySelector('.navbar');
    const svgContainer = document.getElementById('svg-container');
    if (navbarElem && svgContainer) {
      navbarElem.appendChild(svgContainer);
    }
  }
}

// Function to create stars in the navbar
function createStars() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return; // If for some reason .navbar isn't on the page, don't crash

  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    const size = 0.5 + Math.random() * 1.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty('--twinkle-duration', `${2 + Math.random() * 4}s`);
    star.style.animationDelay = `${Math.random() * 4}s`;
    navbar.appendChild(star);
  }
}

// Screenshot modal functionality
function initializeScreenshotModal() {
  const screenshots = document.querySelectorAll('.screenshot-gallery img');
  const modal = document.querySelector('.modal');
  const modalBackdrop = document.querySelector('.modal-backdrop');
  const modalImg = modal.querySelector('img');
  const closeBtn = modal.querySelector('.modal-close');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');
  
  let currentIndex = 0;
  const screenshotArray = Array.from(screenshots);

  function openModal(index) {
    currentIndex = index;
    modalImg.src = screenshotArray[index].src;
    modalImg.alt = screenshotArray[index].alt;
    
    modalBackdrop.style.display = 'block';
    modal.style.display = 'block';
    
    // Trigger animation
    setTimeout(() => {
      modalBackdrop.classList.add('active');
      modal.classList.add('active');
    }, 10);
  }

  function closeModal() {
    modalBackdrop.classList.remove('active');
    modal.classList.remove('active');
    
    setTimeout(() => {
      modalBackdrop.style.display = 'none';
      modal.style.display = 'none';
    }, 300);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + screenshotArray.length) % screenshotArray.length;
    modalImg.src = screenshotArray[currentIndex].src;
    modalImg.alt = screenshotArray[currentIndex].alt;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % screenshotArray.length;
    modalImg.src = screenshotArray[currentIndex].src;
    modalImg.alt = screenshotArray[currentIndex].alt;
  }

  // Add click event listeners to screenshots
  screenshots.forEach((screenshot, index) => {
    screenshot.addEventListener('click', () => openModal(index));
  });

  // Add event listeners to modal controls
  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);
  
  // Close modal when clicking on backdrop
  modalBackdrop.addEventListener('click', closeModal);
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'block') {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      } else if (e.key === 'ArrowRight') {
        showNext();
      }
    }
  });
}

// Initialize everything when the page has fully loaded
window.addEventListener('load', () => {
  createNavbar();
  createStars();
  initializeScreenshotModal();
});  //<— This "});" is the critical closing brace/paren for the listener