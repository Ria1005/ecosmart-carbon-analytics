# EcoSmart

EcoSmart is a data analytics project exploring lifestyle factors (transport, home energy, recycling, and consumption habits) and their impact on carbon emissions using empirical survey data. It features a predictive Random Forest machine learning model to estimate personal footprints.

## Features
* Transport analysis
* Recycling analysis
* AI insights
* Carbon footprint prediction

## Requirements
* Python 3.8+
* pip
* Flask
* pandas
* scikit-learn
* joblib
* waitress (for production deployment)

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <project-folder>
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment (Windows):

```bash
venv\Scripts\activate
```

Install requirements:

```bash
pip install -r requirements.txt
```

## Run the Project

For local development, run the Flask application:

```bash
python app.py
```

## Open Website

Development:
```text
http://127.0.0.1:5000/
```
Production (e.g., using Waitress/Gunicorn):
```text
https://carboninsight.example.com
```

## Prediction

1. Open **Predict Yours** in the navigation menu.
2. Enter the required habits (Transport type, Vehicle Distance, Heating Source, etc.).
3. Click **Estimate My Footprint**.
4. View the predicted carbon footprint in kg CO₂e based on the AI model.

## Project Structure

* `app.py` - Flask web server and API routes
* `carbonemisiion.py` - Data pipeline, EDA, and model training script
* `carbon_model.pkl` - Serialized Random Forest model bundle
* `templates/` - HTML views for the web application
* `static/` - CSS, JavaScript, and compiled JSON datasets

## Deployment

To deploy this application in a production environment, use a WSGI server like Waitress (Windows) or Gunicorn (Linux).

Example using Waitress:
```bash
waitress-serve --port=5000 app:app
```
Ensure that `carbon_model.pkl` is in the deployment directory.
