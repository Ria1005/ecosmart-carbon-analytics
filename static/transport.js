document.addEventListener('DOMContentLoaded', () => {

  // 1. Navigation Scroll Effect
  const nav = document.querySelector('.nav-wrapper');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  // 2. Intersection Observer for Reveals
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .path-node:not(.locked)').forEach(el => observer.observe(el));
});

// Data rendering logic
document.addEventListener('ecosmart-data-ready', () => {
  const data = window.EcoSmart.data;
  if (!data || !data.transport_avg) return;

  const tData = data.transport_avg;
  // Fallback keys in data.js might be "Private Car", but dashboard_data uses "private", "public", "walk/bicycle".
  // Handle both nicely.
  const valPrivate = tData['private'] || tData['Private Car'] || 0;
  const valPublic = tData['public'] || tData['Public Transport'] || 0;
  const valWalk = tData['walk/bicycle'] || tData['Walk/Cycle'] || 0;

  const total = valPrivate + valPublic + valWalk;
  const maxVal = Math.max(valPrivate, valPublic, valWalk);

  // Set comparison bars lengths
  const pBar = document.querySelector('.comp-row.private .comp-bar');
  const puBar = document.querySelector('.comp-row.public .comp-bar');
  const wBar = document.querySelector('.comp-row.walk .comp-bar');
  
  if(pBar) setTimeout(() => pBar.style.width = `${(valPrivate / maxVal) * 100}%`, 500);
  if(puBar) setTimeout(() => puBar.style.width = `${(valPublic / maxVal) * 100}%`, 500);
  if(wBar) setTimeout(() => wBar.style.width = `${(valWalk / maxVal) * 100}%`, 500);

  // Number counting animation
  function animateValue(obj, end, duration) {
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      obj.innerHTML = (easeProgress * end).toFixed(2);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end.toFixed(2); // exact final value
      }
    };
    window.requestAnimationFrame(step);
  }

  // Animate values when they enter viewport
  const numObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseFloat(el.getAttribute('data-value'));
        animateValue(el, val, 2000);
        obs.unobserve(el);
      }
    });
  });

  const vPriv = document.querySelector('.comp-row.private .comp-value');
  const vPub = document.querySelector('.comp-row.public .comp-value');
  const vWalk = document.querySelector('.comp-row.walk .comp-value');
  
  if (vPriv) { vPriv.setAttribute('data-value', valPrivate); numObserver.observe(vPriv); }
  if (vPub) { vPub.setAttribute('data-value', valPublic); numObserver.observe(vPub); }
  if (vWalk) { vWalk.setAttribute('data-value', valWalk); numObserver.observe(vWalk); }

  // Draw Radial Chart
  // Circumference = 100 with r=15.9155
  const pctPrivate = (valPrivate / total) * 100;
  const pctPublic = (valPublic / total) * 100;
  const pctWalk = (valWalk / total) * 100;

  const segPrivate = document.querySelector('.seg-private');
  const segPublic = document.querySelector('.seg-public');
  const segWalk = document.querySelector('.seg-walk');

  // SVG dasharray: [dash_length, gap_length]
  // We leave a small 1% gap between segments for aesthetics
  const gap = 1;

  if (segPrivate) {
    segPrivate.style.strokeDasharray = `${pctPrivate - gap} 100`;
    segPrivate.style.strokeDashoffset = `0`;
    // initial state for animation
    segPrivate.style.strokeDasharray = `0 100`;
    setTimeout(() => {
      segPrivate.style.strokeDasharray = `${pctPrivate - gap} 100`;
    }, 100);
  }

  if (segPublic) {
    const offsetPublic = 100 - pctPrivate;
    segPublic.style.strokeDashoffset = offsetPublic;
    segPublic.style.strokeDasharray = `0 100`;
    setTimeout(() => {
      segPublic.style.strokeDasharray = `${pctPublic - gap} 100`;
    }, 300);
  }

  if (segWalk) {
    const offsetWalk = 100 - (pctPrivate + pctPublic);
    segWalk.style.strokeDashoffset = offsetWalk;
    segWalk.style.strokeDasharray = `0 100`;
    setTimeout(() => {
      segWalk.style.strokeDasharray = `${pctWalk - gap} 100`;
    }, 500);
  }

  // Interactive Hover logic (Bidirectional)
  const rows = document.querySelectorAll('.comp-row');
  const segments = document.querySelectorAll('.chart-segment');
  
  const centerTitle = document.getElementById('chartCenterTitle');
  const centerVal = document.getElementById('chartCenterVal');
  const centerDesc = document.getElementById('chartCenterDesc');

  function setHoverState(mode) {
    // Reset all
    rows.forEach(r => r.classList.remove('active'));
    segments.forEach(s => s.classList.remove('active'));

    if (!mode) {
      // Default center state
      if (centerTitle) centerTitle.textContent = 'Transport';
      if (centerVal) {
        centerVal.textContent = total.toFixed(2);
        centerVal.style.color = 'var(--text-main)';
      }
      if (centerDesc) centerDesc.textContent = 'Total Emissions';
      return;
    }

    const row = document.querySelector(`.comp-row.${mode}`);
    const seg = document.querySelector(`.seg-${mode}`);
    
    if (row) row.classList.add('active');
    if (seg) seg.classList.add('active');

    // Update center
    if (centerTitle) centerTitle.textContent = mode;
    if (centerVal) {
      if(mode==='private') { centerVal.textContent = valPrivate.toFixed(2); centerVal.style.color = 'var(--color-private)'; }
      if(mode==='public') { centerVal.textContent = valPublic.toFixed(2); centerVal.style.color = 'var(--color-public)'; }
      if(mode==='walk') { centerVal.textContent = valWalk.toFixed(2); centerVal.style.color = 'var(--color-walk)'; }
    }
    if (centerDesc) {
      if(mode==='private') centerDesc.textContent = 'Highest in dataset';
      else centerDesc.textContent = 'Average Emissions';
    }
  }

  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      if(row.classList.contains('private')) setHoverState('private');
      if(row.classList.contains('public')) setHoverState('public');
      if(row.classList.contains('walk')) setHoverState('walk');
    });
    row.addEventListener('mouseleave', () => setHoverState(null));
  });

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => {
      if(seg.classList.contains('seg-private')) setHoverState('private');
      if(seg.classList.contains('seg-public')) setHoverState('public');
      if(seg.classList.contains('seg-walk')) setHoverState('walk');
    });
    seg.addEventListener('mouseleave', () => setHoverState(null));
  });
  
  // Initialize default center text
  setHoverState(null);

  // 3D Mouse Parallax for Comparison Rows
  rows.forEach(row => {
    row.addEventListener('mousemove', (e) => {
      const rect = row.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Cursor light follow
      row.style.setProperty('--x', `${x}px`);
      row.style.setProperty('--y', `${y}px`);

      // 3D tilt
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;
      
      row.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

});
