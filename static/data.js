/* ============================================================
   Shared data loader for all pages.
   Tries to fetch the real dashboard_data.json (produced by the
   updated carbonemisiion.py). Falls back to placeholder numbers
   so every page still works before that file exists.
   ============================================================ */

const FALLBACK_DATA = {
  model_metrics: { r2: 0.71, rmse: 145.2, mae: 98.4 },
  feature_importance: {
    "Transport_Private Car": 0.34,
    "Vehicle Monthly Distance Km": 0.27,
    "Recycling Count": 0.18,
    "Diet_Vegetarian": 0.09,
    "Diet_Vegan": 0.07,
    "Transport_Public Transport": 0.05
  },
  transport_avg: {
    "Private Car": 1420,
    "Public Transport": 910,
    "Walk/Cycle": 640
  },
  diet_breakdown: [
    { Diet: "Omnivore", average_emission: 1180, sample_count: 420, min_emission: 300, max_emission: 2600 },
    { Diet: "Vegetarian", average_emission: 1050, sample_count: 210, min_emission: 250, max_emission: 2200 },
    { Diet: "Vegan", average_emission: 990, sample_count: 90, min_emission: 200, max_emission: 2000 }
  ],
  recycling_avg: { "0": 1350, "1": 1180, "2": 1020, "3": 890, "4": 760 }
};

window.EcoSmart = {
  data: FALLBACK_DATA,
  usingFallback: true,

  async load() {
    try {
      const res = await fetch('/static/dashboard_data.json');
      if (res.ok) {
        this.data = await res.json();
        this.usingFallback = false;
      }
    } catch (e) {
      // stays on fallback — likely opened as a local file, or json not generated yet
    }
    document.dispatchEvent(new Event('ecosmart-data-ready'));
  },

  palette: ['#8FAE86', '#C97B4A', '#D9B369', '#6F97A6', '#B98F6B', '#7C9473'],

  fallbackNote() {
    if (!this.usingFallback) return '';
    return `<div class="callout">Showing placeholder numbers \u2014 place the real <code>dashboard_data.json</code> (from carbonemisiion.py) next to these files to see live data.</div>`;
  }
};

window.EcoSmart.load();
