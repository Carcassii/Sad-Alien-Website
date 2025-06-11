// Function to create the navigation bar
function createNavbar() {
  const isHome =
    window.location.href.includes('index.html') ||
    window.location.pathname === '/';
  console.log('isHome?', isHome);

  const navbar = `
<nav class="navbar">
  <div class="navbar-inner">
  
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

// Initialize everything when the page has fully loaded
window.addEventListener('load', () => {
  createNavbar();
  createStars();
});  //<— This "});" is the critical closing brace/paren for the listener