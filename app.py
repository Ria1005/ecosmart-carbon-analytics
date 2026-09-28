import os
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Load trained model bundle
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'carbon_model.pkl')
model_bundle = None
if os.path.exists(MODEL_PATH):
    try:
        model_bundle = joblib.load(MODEL_PATH)
        print(f"[App] Loaded carbon_model.pkl successfully ({len(model_bundle.get('columns', []))} features)")
    except Exception as e:
        print("[App] Warning: Failed to load carbon_model.pkl:", e)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/transport')
def transport():
    return render_template('transport.html')


@app.route('/recycling')
def recycling():
    return render_template('recycling.html')


@app.route('/insights')
def insights():
    return render_template('insights.html')


@app.route('/predict')
def predict():
    return render_template('predict.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"error": "No input provided"}), 400

    try:
        transport_val = str(data.get("Transport", "private")).strip().lower()
        vehicle_type = str(data.get("Vehicle Type", "petrol")).strip().lower()
        vehicle_dist = float(data.get("Vehicle Monthly Distance Km", 500))
        air_travel = str(data.get("Frequency of Traveling by Air", "rarely")).strip().lower()
        heating = str(data.get("Heating Energy Source", "natural gas")).strip().lower()
        grocery = float(data.get("Monthly Grocery Bill", 200))
        waste_bags = float(data.get("Waste Bag Weekly Count", 3))
        clothes = float(data.get("How Many New Clothes Monthly", 5))
        energy_eff = str(data.get("Energy efficiency", "Sometimes")).strip()
        recycling = float(data.get("Recycling Count", 1))

        user_input = {
            "Transport": transport_val,
            "Vehicle Type": vehicle_type,
            "Vehicle Monthly Distance Km": vehicle_dist,
            "Frequency of Traveling by Air": air_travel,
            "Heating Energy Source": heating,
            "Monthly Grocery Bill": grocery,
            "Waste Bag Weekly Count": waste_bags,
            "How Many New Clothes Monthly": clothes,
            "Energy efficiency": energy_eff,
            "Recycling Count": recycling,
        }

        if model_bundle and "model" in model_bundle:
            rf = model_bundle["model"]
            cols = model_bundle["columns"]
            row = pd.get_dummies(pd.DataFrame([user_input])).reindex(columns=cols, fill_value=0)
            prediction = round(float(rf.predict(row)[0]), 2)
        else:
            prediction = round(2000.0 + vehicle_dist * 0.35 + (5 - recycling) * 100.0, 2)

        return jsonify({
            "success": True,
            "prediction": prediction,
            "input": user_input
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)