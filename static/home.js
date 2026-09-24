document.addEventListener('DOMContentLoaded', () => {

  // 1. Navigation Scroll Effect
  const nav = document.querySelector('.nav-wrapper');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 2. Intersection Observer for Reveals
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Activate pipeline if it's the engine section
        if (entry.target.classList.contains('pipeline-container')) {
          entry.target.classList.add('active');
        }
        obs.unobserve(entry.target); // Run once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .pipeline-container').forEach(el => {
    observer.observe(el);
  });

  // 3. Mouse Parallax (Hero)
  const heroSection = document.querySelector('.hero-section');
  const aiCore = document.querySelector('.ai-core');
  const nodes = document.querySelectorAll('.node');

  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      
      // Core moves slightly opposite to mouse
      if (aiCore) {
        aiCore.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
      }

      // Nodes move with mouse, different depths
      nodes.forEach((node, index) => {
        const factor = (index + 1) * 5;
        node.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });

    heroSection.addEventListener('mouseleave', () => {
      if (aiCore) aiCore.style.transform = `translate(0, 0)`;
      nodes.forEach(node => {
        node.style.transform = `translate(0, 0)`;
      });
    });
  }

  // 4. Premium Card Effect (3D Tilt)
  const cards = document.querySelectorAll('.dim-card, .preview-dashboard');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Max rotation: 2-3 degrees (as requested)
      const rotateX = ((y - centerY) / centerY) * -2;
      const rotateY = ((x - centerX) / centerX) * 2;
      
      // We apply standard transform. 
      // If it's the dashboard, preserve its base 3D rotation from CSS
      if (card.classList.contains('preview-dashboard')) {
        card.style.transform = `rotateX(${rotateX + 5}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      } else {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (card.classList.contains('preview-dashboard')) {
        card.style.transform = `rotateX(5deg) rotateY(0deg) scale3d(1, 1, 1)`;
      } else {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      }
    });
  });

});
