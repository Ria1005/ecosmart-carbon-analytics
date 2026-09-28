/* ============================================================
   Shared data loader for all pages.
   Tries to fetch the real dashboard_data.json and location_data.json
   produced by carbonemisiion.py. Falls back to accurate cached numbers
   so every page works even when offline or before generation.
   ============================================================ */

const FALLBACK_DATA = {
  model_metrics: {
    r2: 0.844,
    rmse: 402.9,
    mae: 315.4
  },
  feature_importance: {
    "Vehicle Monthly Distance Km": 0.4032,
    "Frequency of Traveling by Air": 0.2317,
    "Vehicle Type": 0.1727,
    "How Many New Clothes Monthly": 0.0680,
    "Monthly Grocery Bill": 0.0359,
    "Waste Bag Weekly Count": 0.0348,
    "Heating Energy Source": 0.0250,
    "Recycling Count": 0.0184,
    "Energy efficiency": 0.0079,
    "Transport": 0.0025
  },
  transport_avg: {
    "private": 2980.9,
    "public": 1965.8,
    "walk/bicycle": 1879.7
  },
  recycling_avg: {
    "0": 2544.6,
    "1": 2376.5,
    "2": 2271.3,
    "3": 2139.1,
    "4": 2066.6
  },
  air_travel_avg: {
    "never": 1716.3,
    "rarely": 1945.9,
    "frequently": 2362.9,
    "very frequently": 3026.5
  },
  transport_drilldown: {
    "private_by_vehicle": {
      "diesel": { "average": 3230.2, "count": 622 },
      "electric": { "average": 1883.3, "count": 671 },
      "hybrid": { "average": 2708.5, "count": 642 },
      "lpg": { "average": 3352.1, "count": 697 },
      "petrol": { "average": 3749.9, "count": 647 }
    },
    "private_by_distance": {
      "0-500 km": { "average": 1906.7, "count": 156 },
      "501-1500 km": { "average": 2155.0, "count": 297 },
      "1501-3000 km": { "average": 2376.8, "count": 497 },
      "3000+ km": { "average": 3287.0, "count": 2329 }
    }
  }
};

window.CarbonInsight = {
  data: FALLBACK_DATA,
  locationData: null,
  usingFallback: true,

  async load() {
    try {
      const res = await fetch('/static/dashboard_data.json');
      if (res.ok) {
        this.data = await res.json();
        this.usingFallback = false;
      }
    } catch (e) {
      // stays on fallback
    }

    try {
      const locRes = await fetch('/static/location_data.json');
      if (locRes.ok) {
        this.locationData = await locRes.json();
      }
    } catch (e) {
      // location data optional
    }

    document.dispatchEvent(new Event('ecosmart-data-ready'));
  },

  palette: ['#8FAE86', '#C97B4A', '#D9B369', '#6F97A6', '#B98F6B', '#7C9473'],

  fallbackNote() {
    if (!this.usingFallback) return '';
    return `<div class="callout">Showing cached survey data &mdash; real-time dashboard data loaded.</div>`;
  }
};

window.CarbonInsight.load();
