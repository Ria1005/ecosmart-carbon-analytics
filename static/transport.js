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

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// Main Data Rendering
document.addEventListener('ecosmart-data-ready', () => {
  const data = window.CarbonInsight.data;
  if (!data || !data.transport_avg) return;

  const tData = data.transport_avg;
  const valPrivate = tData['private'] || 2980.9;
  const valPublic = tData['public'] || 1965.8;
  const valWalk = tData['walk/bicycle'] || 1879.7;

  const total = valPrivate + valPublic + valWalk;
  const maxVal = Math.max(valPrivate, valPublic, valWalk);

  // Set comparison bars lengths
  const pBar = document.querySelector('.comp-row.private .comp-bar');
  const puBar = document.querySelector('.comp-row.public .comp-bar');
  const wBar = document.querySelector('.comp-row.walk .comp-bar');
  
  if (pBar) setTimeout(() => pBar.style.width = `${(valPrivate / maxVal) * 100}%`, 300);
  if (puBar) setTimeout(() => puBar.style.width = `${(valPublic / maxVal) * 100}%`, 300);
  if (wBar) setTimeout(() => wBar.style.width = `${(valWalk / maxVal) * 100}%`, 300);

  // Number counting animation
  function animateValue(obj, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      obj.innerHTML = (easeProgress * end).toFixed(2);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end.toFixed(2);
      }
    };
    window.requestAnimationFrame(step);
  }

  const numObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseFloat(el.getAttribute('data-value'));
        animateValue(el, val, 1800);
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
  const pctPrivate = (valPrivate / total) * 100;
  const pctPublic = (valPublic / total) * 100;
  const pctWalk = (valWalk / total) * 100;

  const segPrivate = document.querySelector('.seg-private');
  const segPublic = document.querySelector('.seg-public');
  const segWalk = document.querySelector('.seg-walk');
  const gap = 1;

  if (segPrivate) {
    segPrivate.style.strokeDashoffset = `0`;
    segPrivate.style.strokeDasharray = `0 100`;
    setTimeout(() => { segPrivate.style.strokeDasharray = `${pctPrivate - gap} 100`; }, 100);
  }

  if (segPublic) {
    segPublic.style.strokeDashoffset = 100 - pctPrivate;
    segPublic.style.strokeDasharray = `0 100`;
    setTimeout(() => { segPublic.style.strokeDasharray = `${pctPublic - gap} 100`; }, 100);
  }

  if (segWalk) {
    segWalk.style.strokeDashoffset = 100 - (pctPrivate + pctPublic);
    segWalk.style.strokeDasharray = `0 100`;
    setTimeout(() => { segWalk.style.strokeDasharray = `${pctWalk - gap} 100`; }, 100);
  }

  // Radial chart hover details
  const rows = document.querySelectorAll('.comp-row');
  const segments = document.querySelectorAll('.chart-segment');
  const centerTitle = document.getElementById('chartCenterTitle');
  const centerVal = document.getElementById('chartCenterVal');
  const centerDesc = document.getElementById('chartCenterDesc');

  function setHoverState(mode) {
    rows.forEach(r => r.classList.remove('active'));
    segments.forEach(s => s.classList.remove('active'));

    if (!mode) {
      if (centerTitle) centerTitle.textContent = 'Transport';
      if (centerVal) {
        centerVal.textContent = total.toFixed(1);
        centerVal.style.color = 'var(--text-main)';
      }
      if (centerDesc) centerDesc.textContent = 'Combined Averages';
      return;
    }

    const row = document.querySelector(`.comp-row.${mode}`);
    const seg = document.querySelector(`.seg-${mode}`);
    if (row) row.classList.add('active');
    if (seg) seg.classList.add('active');

    if (centerTitle) centerTitle.textContent = mode.toUpperCase();
    if (centerVal) {
      if (mode === 'private') { centerVal.textContent = valPrivate.toFixed(1); centerVal.style.color = 'var(--color-private)'; }
      if (mode === 'public') { centerVal.textContent = valPublic.toFixed(1); centerVal.style.color = 'var(--color-public)'; }
      if (mode === 'walk') { centerVal.textContent = valWalk.toFixed(1); centerVal.style.color = 'var(--color-walk)'; }
    }
    if (centerDesc) {
      if (mode === 'private') centerDesc.textContent = 'Highest in survey (kg CO₂e)';
      else centerDesc.textContent = 'Average Emissions (kg CO₂e)';
    }
  }

  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      if (row.classList.contains('private')) setHoverState('private');
      if (row.classList.contains('public')) setHoverState('public');
      if (row.classList.contains('walk')) setHoverState('walk');
    });
    row.addEventListener('mouseleave', () => setHoverState(null));
  });

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => {
      if (seg.classList.contains('seg-private')) setHoverState('private');
      if (seg.classList.contains('seg-public')) setHoverState('public');
      if (seg.classList.contains('seg-walk')) setHoverState('walk');
    });
    seg.addEventListener('mouseleave', () => setHoverState(null));
  });

  setHoverState(null);

  // ==========================================
  // 3. DRILL-DOWN: Mode -> Vehicle -> Distance
  // ==========================================
  const drillBreadcrumb = document.getElementById('drillBreadcrumb');
  const drillTitle = document.getElementById('drillLevelTitle');
  const drillDesc = document.getElementById('drillLevelDesc');
  const drillGrid = document.getElementById('drillCardsGrid');

  let currentDrillLevel = 'mode';

  function renderDrillDown(level) {
    currentDrillLevel = level;

    // Update active tab styling
    document.querySelectorAll('.breadcrumb-step').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-level') === level);
    });

    if (level === 'mode') {
      drillTitle.textContent = 'Level 1: Transport Mode Overview';
      drillDesc.textContent = 'Click "Private Car" or the tabs above to drill deeper';
      
      const modes = [
        { key: 'private', name: 'Private Car', avg: valPrivate, count: 3279, desc: 'Highest overall category. Leads into vehicle fuel breakdown.', drillable: true },
        { key: 'public', name: 'Public Transit', avg: valPublic, count: 3374, desc: 'Buses, trains, and shared commuting networks.', drillable: false },
        { key: 'walk/bicycle', name: 'Walk / Bicycle', avg: valWalk, count: 3347, desc: 'Zero direct fuel consumption baseline.', drillable: false }
      ];

      const maxModeAvg = Math.max(...modes.map(m => m.avg));

      drillGrid.innerHTML = modes.map(m => `
        <div class="drill-card ${m.drillable ? 'highlight' : ''}" data-goto="${m.drillable ? 'vehicle' : ''}">
          <div class="drill-card-top">
            <span class="drill-card-title">${m.name}</span>
            <span class="drill-card-val">${m.avg.toFixed(1)} <small style="font-size:11px; color:var(--text-muted);">kg</small></span>
          </div>
          <div class="drill-card-sub">${m.desc} &bull; ${m.count.toLocaleString()} drivers</div>
          <div class="drill-bar-wrap">
            <div class="drill-bar-fill" style="width: ${(m.avg / maxModeAvg) * 100}%;"></div>
          </div>
          ${m.drillable ? `<div style="margin-top:12px; font-size:12px; color:var(--accent); font-weight:600;">&darr; Click to drill into Vehicle Powertrain</div>` : ''}
        </div>
      `).join('');
    } else if (level === 'vehicle') {
      drillTitle.textContent = 'Level 2: Private Vehicle Fuel Powertrains';
      drillDesc.textContent = 'Fuel type creates a ~2x difference in emissions. Click any powertrain to see distance bands.';

      const vData = (data.transport_drilldown && data.transport_drilldown.private_by_vehicle) || {
        "petrol": { average: 3749.9, count: 647 },
        "lpg": { average: 3352.1, count: 697 },
        "diesel": { average: 3230.2, count: 622 },
        "hybrid": { average: 2708.5, count: 642 },
        "electric": { average: 1883.3, count: 671 }
      };

      const sortedVehicles = Object.entries(vData).sort((a,b) => b[1].average - a[1].average);
      const maxVehAvg = sortedVehicles[0][1].average;

      drillGrid.innerHTML = sortedVehicles.map(([vType, info]) => `
        <div class="drill-card" data-goto="distance">
          <div class="drill-card-top">
            <span class="drill-card-title">${vType}</span>
            <span class="drill-card-val">${info.average.toFixed(1)} <small style="font-size:11px; color:var(--text-muted);">kg</small></span>
          </div>
          <div class="drill-card-sub">${info.count.toLocaleString()} survey records &bull; ${(info.average - 1883.3 > 0 ? '+' + (info.average - 1883.3).toFixed(0) + ' kg vs EV' : 'Cleanest powertrain')}</div>
          <div class="drill-bar-wrap">
            <div class="drill-bar-fill" style="width: ${(info.average / maxVehAvg) * 100}%; background: ${vType === 'electric' ? '#8FAE86' : (vType === 'petrol' ? '#C97B4A' : 'var(--accent-secondary)')};"></div>
          </div>
          <div style="margin-top:12px; font-size:12px; color:var(--accent);">&rarr; View distance bands</div>
        </div>
      `).join('');
    } else if (level === 'distance') {
      drillTitle.textContent = 'Level 3: Monthly Distance Bands (Private Vehicles)';
      drillDesc.textContent = 'Shows how monthly driving mileage correlates directly with footprint spikes.';

      const distData = (data.transport_drilldown && data.transport_drilldown.private_by_distance) || {
        "0-500 km": { average: 1906.7, count: 156 },
        "501-1500 km": { average: 2155.0, count: 297 },
        "1501-3000 km": { average: 2376.8, count: 497 },
        "3000+ km": { average: 3287.0, count: 2329 }
      };

      const entries = Object.entries(distData);
      const maxDistAvg = Math.max(...entries.map(e => e[1].average));

      drillGrid.innerHTML = entries.map(([band, info]) => `
        <div class="drill-card">
          <div class="drill-card-top">
            <span class="drill-card-title">${band}</span>
            <span class="drill-card-val">${info.average.toFixed(1)} <small style="font-size:11px; color:var(--text-muted);">kg</small></span>
          </div>
          <div class="drill-card-sub">${info.count.toLocaleString()} drivers in survey sample</div>
          <div class="drill-bar-wrap">
            <div class="drill-bar-fill" style="width: ${(info.average / maxDistAvg) * 100}%; background: var(--accent-secondary);"></div>
          </div>
        </div>
      `).join('');
    }

    // Attach click listeners to drill cards
    drillGrid.querySelectorAll('.drill-card[data-goto]').forEach(card => {
      card.addEventListener('click', () => {
        const nextLevel = card.getAttribute('data-goto');
        if (nextLevel) renderDrillDown(nextLevel);
      });
    });
  }

  // Breadcrumb buttons
  if (drillBreadcrumb) {
    drillBreadcrumb.querySelectorAll('.breadcrumb-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.getAttribute('data-level');
        if (level) renderDrillDown(level);
      });
    });
  }

  renderDrillDown('mode');

  // ==========================================
  // 4. AIR TRAVEL ANALYSIS & CHART
  // ==========================================
  const airGrid = document.getElementById('airTravelGrid');
  const airData = data.air_travel_avg || {
    "never": 1716.3,
    "rarely": 1945.9,
    "frequently": 2362.9,
    "very frequently": 3026.5
  };

  const airLabels = ["never", "rarely", "frequently", "very frequently"];
  const baseline = airData['never'] || 1716.3;

  if (airGrid) {
    airGrid.innerHTML = airLabels.map(k => {
      const val = airData[k] || 0;
      const diffPct = Math.round(((val - baseline) / baseline) * 100);
      const badgeText = diffPct === 0 ? 'Baseline' : `+${diffPct}% vs never`;
      return `
        <div class="air-card">
          <div class="air-freq-name">${k}</div>
          <div class="air-val">${val.toFixed(0)} <small style="font-size:13px; color:var(--text-muted);">kg CO₂e</small></div>
          <span class="air-badge">${badgeText}</span>
        </div>
      `;
    }).join('');
  }

  const airCanvas = document.getElementById('airTravelChart');
  if (airCanvas) {
    new Chart(airCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Never', 'Rarely (1-2x/yr)', 'Frequently (monthly)', 'Very Frequently (weekly)'],
        datasets: [{
          label: 'Average Annual Emissions (kg CO₂e)',
          data: airLabels.map(k => airData[k]),
          backgroundColor: ['#8FAE86', '#D9B369', '#C97B4A', '#D9534F'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} kg CO₂e / year`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#9FB0A5' }, grid: { display: false } },
          y: {
            ticks: { color: '#9FB0A5' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'kg CO₂e per year', color: '#9FB0A5' }
          }
        }
      }
    });
  }

  // ==========================================
  // 5. REGION -> COUNTRY -> YEAR EXPLORER
  // ==========================================
  initLocationExplorer();
});

async function initLocationExplorer() {
  const regSel = document.getElementById('regionSelect');
  const countrySel = document.getElementById('countrySelect');
  const metricSel = document.getElementById('metricSelect');
  const locCanvas = document.getElementById('locationChart');
  if (!regSel || !countrySel || !locCanvas) return;

  let locData = window.CarbonInsight.locationData;
  if (!locData) {
    try {
      const res = await fetch('/static/location_data.json');
      if (res.ok) {
        locData = await res.json();
        window.CarbonInsight.locationData = locData;
      }
    } catch (e) {
      console.warn('Could not load location_data.json:', e);
    }
  }

  if (!locData || !locData.regions) {
    regSel.innerHTML = '<option>Data unavailable</option>';
    return;
  }

  const regions = Object.keys(locData.regions).sort();
  regSel.innerHTML = regions.map(r => `<option value="${r}">${r}</option>`).join('');

  // Default region
  const defaultRegion = regions.includes('North America') ? 'North America' : regions[0];
  regSel.value = defaultRegion;

  function updateCountries() {
    const selectedReg = regSel.value;
    const countriesObj = locData.regions[selectedReg] || {};
    const countries = Object.keys(countriesObj).sort();
    
    countrySel.innerHTML = countries.map(c => `<option value="${c}">${c}</option>`).join('');
    
    if (countries.includes('United States')) {
      countrySel.value = 'United States';
    } else if (countries.includes('Germany')) {
      countrySel.value = 'Germany';
    } else if (countries.includes('India')) {
      countrySel.value = 'India';
    } else if (countries.length > 0) {
      countrySel.value = countries[0];
    }
    renderLocationChart();
  }

  let chartInstance = null;

  function renderLocationChart() {
    const selectedReg = regSel.value;
    const selectedCountry = countrySel.value;
    const metric = metricSel.value;

    const countryObj = locData.regions[selectedReg]?.[selectedCountry];
    if (!countryObj) return;

    const years = locData.years;
    const values = countryObj[metric] || [];

    // Filter valid numeric entries for stats
    const validEntries = years.map((y, i) => ({ year: y, val: values[i] })).filter(e => e.val !== null);

    if (validEntries.length > 0) {
      const latest = validEntries[validEntries.length - 1];
      const peak = validEntries.reduce((max, cur) => cur.val > max.val ? cur : max, validEntries[0]);
      const first = validEntries[0];

      document.getElementById('statLatestVal').textContent = `${latest.val.toFixed(2)} t`;
      document.getElementById('statPeakVal').textContent = `${peak.val.toFixed(2)} t`;
      document.getElementById('statPeakYear').textContent = `Peak (${peak.year})`;

      const diff = latest.val - first.val;
      const pct = first.val > 0 ? ((diff / first.val) * 100).toFixed(1) : 0;
      const sign = diff > 0 ? '+' : '';
      document.getElementById('statTrendVal').textContent = `${sign}${pct}%`;
      document.getElementById('statTrendVal').style.color = diff > 0 ? '#C97B4A' : '#8FAE86';
    }

    const metricTitle = metric === 'oil_co2_per_capita' ? 'Oil CO₂ per Capita (tons)' : 'Total CO₂ per Capita (tons)';

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(locCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: `${selectedCountry} — ${metricTitle}`,
          data: values,
          borderColor: metric === 'oil_co2_per_capita' ? '#D9B369' : '#8FAE86',
          backgroundColor: metric === 'oil_co2_per_capita' ? 'rgba(217, 179, 105, 0.1)' : 'rgba(143, 174, 134, 0.1)',
          tension: 0.25,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#EDEAE0', font: { family: 'Inter' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(3) + ' tons / person' : 'N/A'}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9FB0A5', maxTicksLimit: 12 },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: { color: '#9FB0A5' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'Tons per Capita', color: '#9FB0A5' }
          }
        }
      }
    });
  }

  regSel.addEventListener('change', updateCountries);
  countrySel.addEventListener('change', renderLocationChart);
  metricSel.addEventListener('change', renderLocationChart);

  updateCountries();
}
