// Function to create the navigation bar
function createNavbar() {
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (isHome) {
        // Insert the animated title above the SVG spaceship
        const svgContainer = document.querySelector('.svg-container');
        if (svgContainer) {
            const title = document.createElement('h1');
            title.className = 'site-title';
            title.textContent = 'Sad Alien';
            svgContainer.parentNode.insertBefore(title, svgContainer);
        }
    }
    const navbar = `
    <nav class="navbar">
      ${!isHome ? '<h1 class="site-title">Sad Alien</h1>' : ''}
      <ul class="nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li class="tool-dropdown">
          <a href="imagetohex.html" class="tool-link">Tools </a>
          <div class="tool-dropdown-content">
            <a href="colormatcher.html">Color Matcher</a>
            <a href="imagetohex.html">Image to Hex</a>
          </div>
        </li>
        <li><a href="music.html">Music</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>`;

    // Insert the navbar at the beginning of the body
    document.body.insertAdjacentHTML('afterbegin', navbar);
}

// Function to create stars
function createStars() {
    const navbar = document.querySelector('.navbar');
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

// Initialize when the page loads
window.addEventListener('load', () => {
    createNavbar();
    createStars();
}); 