# EcoSmart: Carbon Footprint Analytics

A data analysis project exploring lifestyle factors (transport, diet, 
recycling habits, energy efficiency) and their impact on individual 
carbon emissions, using NCRB-style structured survey data.

## Tech Stack
- Python (Pandas, Matplotlib, Seaborn, Scikit-learn)
- Power BI
- MongoDB
- HTML/CSS, Flask

## Key Findings
- Transport choice is the strongest driver of carbon footprint (r = 0.59)
- Private vehicle users emit ~50-60% more than public transport/walking/cycling
- Recycling breadth (number of materials recycled), not just participation, 
  correlates with lower emissions
- Diet type showed minimal impact in this dataset
- Energy efficiency awareness alone did not reduce emissions — behavior 
  change matters more than awareness

## Project Structure
- `carbon_footprints_cleaned.xlsx` — cleaned dataset
- `carbonemisiion.py` — EDA, ML model (Random Forest), MongoDB integration
- `CARBON EMISSION.pbix` — interactive Power BI dashboard
- `index.html` / `app.py` — project landing page

## Live Demo
[Add your GitHub Pages link here once enabled]
