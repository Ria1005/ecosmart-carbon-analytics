document.addEventListener('DOMContentLoaded', () => {

  // Tilt effect for premium chart container
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -2;
      const rotateY = ((x - centerX) / centerX) * 2;
      
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  }); // Close cards.forEach

  // Override to exact prompt values to prevent precision loss from recent data updates
  const labels = ["0", "1", "2", "3", "4"];
  const values = [2544.61, 2376.54, 2271.30, 2139.11, 2066.59];

  // 1. Build Circular Visualization
  const circContainer = document.getElementById('circ-nodes-container');
  const radius = 180; // Distance from center
  const centerX = 200;
  const centerY = 200;
  
  labels.forEach((label, i) => {
    // Start at top (-90deg), spread evenly over 360deg
    const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    const node = document.createElement('div');
    node.className = 'circ-node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    
    const labelTxt = label === "1" ? "1 MATERIAL" : `${label} MATERIALS`;
    
    const displayVal = values[i].toFixed(2);
    node.innerHTML = `
      <div class="circ-label">${labelTxt}</div>
      <div class="circ-val">${displayVal}</div>
    `;
    
    circContainer.appendChild(node);
  });

  // 2. Build HTML Bar Chart and Table
  const barChart = document.getElementById('barChart');
  const tbody = document.querySelector('#recycleTable tbody');
  const tooltip = document.getElementById('chartTooltip');
  const ttLabel = document.getElementById('ttLabel');
  const ttVal = document.getElementById('ttVal');
  const container = document.getElementById('mainChartContainer');

  const maxVal = Math.max(...values);
  
  labels.forEach((label, i) => {
    const val = values[i];
    const displayVal = val.toFixed(2);
    const labelTxt = label === "1" ? "1 MATERIAL" : `${label} MATERIALS`;
    const shortLabelTxt = label === "1" ? "1 Material" : `${label} Materials`;
    const heightPct = (val / maxVal) * 100;

    // --- Create Table Row ---
    const tr = document.createElement('tr');
    tr.dataset.index = i;
    tr.innerHTML = `
      <td>${label}</td>
      <td>${displayVal}</td>
    `;
    tbody.appendChild(tr);

    // --- Create Bar Chart Column ---
    const col = document.createElement('div');
    col.className = 'bar-col';
    
    // Bar Value Label (always visible above the bar)
    const valLbl = document.createElement('div');
    valLbl.className = 'bar-val-label';
    valLbl.innerHTML = `<span>${shortLabelTxt}</span><br>${displayVal}`;
    
    // The Bar Track & Fill
    const track = document.createElement('div');
    track.className = 'bar-track';
    
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.dataset.height = `${heightPct}%`;
    
    track.appendChild(fill);
    
    col.appendChild(valLbl);
    col.appendChild(track);
    barChart.appendChild(col);

    // Hover interactions
    const handleEnter = () => {
      tr.classList.add('active');
      col.classList.add('active');
      fill.classList.add('active');
      
      // Tooltip positioning
      const contRect = container.getBoundingClientRect();
      const fillRect = fill.getBoundingClientRect();
      
      const left = fillRect.left - contRect.left + (fillRect.width / 2); 
      const top = fillRect.top - contRect.top - 10;
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      ttLabel.textContent = labelTxt;
      ttVal.textContent = displayVal;
      tooltip.classList.add('show');
    };
    
    const handleLeave = () => {
      tr.classList.remove('active');
      col.classList.remove('active');
      fill.classList.remove('active');
      tooltip.classList.remove('show');
    };

    tr.addEventListener('mouseenter', handleEnter);
    tr.addEventListener('mouseleave', handleLeave);
    col.addEventListener('mouseenter', handleEnter);
    col.addEventListener('mouseleave', handleLeave);
  });

  // Intersection observer to animate bars when scrolled into view
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.bar-fill').forEach((fill, i) => {
          setTimeout(() => {
            fill.style.height = fill.dataset.height;
          }, 100 + (i * 100)); // Staggered animation
        });
        document.querySelectorAll('.bar-val-label').forEach((lbl, i) => {
          setTimeout(() => {
            lbl.style.opacity = '1';
            lbl.style.transform = 'translateY(0)';
          }, 400 + (i * 100));
        });
        chartObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  chartObserver.observe(container); // Close labels.forEach

}); // Close DOMContentLoaded
