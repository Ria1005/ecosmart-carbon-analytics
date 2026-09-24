function renderSidebar(active){
  const items = [
    { grp: 'Overview', links: [
      { href:'/', key:'home', label:'Home & Problem' },
    ]},
    { grp: 'Explore the data', links: [
      { href:'/transport', key:'transport', label:'🚗 Transport' },
      { href:'/diet', key:'diet', label:'🥗 Diet' },
      { href:'/recycling', key:'recycling', label:'♻️ Recycling' },
    ]},
    { grp: 'Model', links: [
      { href:'/insights', key:'insights', label:'🤖 AI Insights' },
      { href:'/predict', key:'predict', label:'🔮 Predict Yours' },
    ]},
    { grp: '', links: [
      { href:'/about', key:'about', label:'About EcoSmart' },
    ]},
  ];

  let html = `
    <div class="brand">Eco<span>Smart</span></div>
    <div class="brand-sub">carbon field notes /26</div>
    <nav class="side-nav">
  `;
  items.forEach(section => {
    if (section.grp) html += `<div class="grp-label">${section.grp}</div>`;
    section.links.forEach(l => {
      html += `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`;
    });
  });
  html += `</nav>
    <div class="sidebar-foot">
      Built from survey data on transport, diet, recycling &amp; energy habits.
    </div>
  `;

  document.getElementById('sidebar-slot').innerHTML = html;
}
