import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # save charts as PNG files, no pop-up windows to close
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# ==========================================
# 1. LOAD DATA
# ==========================================
# Always work from the folder this script is in (fixes "file not found"
# when the terminal is opened in a different folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

XLSX = "carbon_footprints_cleaned.xlsx"
if not os.path.exists(XLSX):
    print(f"\nERROR: '{XLSX}' not found in {BASE_DIR}")
    print("Files in this folder:", os.listdir(BASE_DIR))
    print("Put the Excel file next to this script, or change the XLSX name above.")
    raise SystemExit(1)

df = pd.read_excel(XLSX, keep_default_na=False)
df["Recycling Count"] = df["Recycling"].apply(lambda x: len(x.split(", ")) if x != "" else 0)
print("Dataset loaded:", df.shape)

# Where the website reads its JSON files from
OUT_DIR = "static" if os.path.isdir("static") else "."

# ==========================================
# 2. EDA CHARTS (saved as PNG)
# ==========================================
def save_bar(x, title, fname, xlabel):
    plt.figure(figsize=(8, 5))
    sns.barplot(data=df, x=x, y="CarbonEmission", estimator="mean")
    plt.title(title); plt.xlabel(xlabel); plt.ylabel("Average Carbon Emission")
    plt.savefig(fname, bbox_inches="tight"); plt.close()

save_bar("Transport", "Average Carbon Emission by Transport Type", "chart_transport.png", "Transport Type")
save_bar("Recycling Count", "Average Carbon Emission by Materials Recycled", "chart_recycling.png", "Materials Recycled")
save_bar("Frequency of Traveling by Air", "Average Carbon Emission by Air Travel", "chart_air_travel.png", "Air travel frequency")

plt.figure(figsize=(10, 7))
sns.heatmap(df.select_dtypes(include=["int64", "float64"]).corr(), annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Correlation of Numeric Features")
plt.savefig("chart_correlation.png", bbox_inches="tight"); plt.close()

# ==========================================
# 3. MONGODB (optional - script still runs if MongoDB is off)
# ==========================================
db = None
try:
    import pymongo
    client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    client.admin.command("ping")
    db = client["CarbonFootprintDB"]
    db["historical_data"].delete_many({})
    db["historical_data"].insert_many(df.to_dict("records"))
    print("[MongoDB] Data stored in CarbonFootprintDB.historical_data")
    df = pd.DataFrame(list(db["historical_data"].find({}, {"_id": 0})))   # train from MongoDB
except Exception as e:
    print("[MongoDB] Skipped (not running):", type(e).__name__)

# ==========================================
# 4. TRAIN THE MODEL  (diet removed, more real columns added)
# ==========================================
features = [
    "Transport", "Vehicle Type", "Vehicle Monthly Distance Km",
    "Frequency of Traveling by Air", "Heating Energy Source",
    "Monthly Grocery Bill", "Waste Bag Weekly Count",
    "How Many New Clothes Monthly", "Energy efficiency", "Recycling Count",
]
target = "CarbonEmission"

X_encoded = pd.get_dummies(df[features], drop_first=True)
y = df[target]
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

import joblib
joblib.dump({"model": model, "columns": list(X_encoded.columns), "features": features}, "carbon_model.pkl")
print("[Model] Saved trained model to carbon_model.pkl")

r2 = r2_score(y_test, y_pred)
rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
mae = mean_absolute_error(y_test, y_pred)
print(f"[Model] R2={r2:.3f}  RMSE={rmse:.1f}  MAE={mae:.1f}")

# Importance per ORIGINAL column (adds up the dummy columns of each feature)
raw_imp = pd.Series(model.feature_importances_, index=X_encoded.columns)
def group_of(col):
    for f in features:
        if col == f or col.startswith(f + "_"):
            return f
    return col
importance = raw_imp.groupby(group_of).sum().sort_values(ascending=False)
print("\n[Feature importance]\n", importance.round(3))

plt.figure(figsize=(9, 6))
importance.plot(kind="barh"); plt.gca().invert_yaxis()
plt.title("Feature Importance (Random Forest)"); plt.tight_layout()
plt.savefig("chart_feature_importance.png", bbox_inches="tight"); plt.close()

# SHAP (optional)
try:
    import shap
    shap_values = shap.TreeExplainer(model).shap_values(X_test.iloc[:1000])
    plt.figure()
    shap.summary_plot(shap_values, X_test.iloc[:1000], show=False)
    plt.tight_layout(); plt.savefig("chart_shap_summary.png", bbox_inches="tight"); plt.close()
    print("[SHAP] chart_shap_summary.png saved")
except ImportError:
    print("[SHAP] Skipped - pip install shap")

# ==========================================
# 5. PREDICTION FUNCTION
# ==========================================
def predict_emission(user_input):
    row = pd.get_dummies(pd.DataFrame([user_input])).reindex(columns=X_encoded.columns, fill_value=0)
    value = round(float(model.predict(row)[0]), 2)
    record = {**user_input, "Predicted_CarbonEmission": value}
    if db is not None:
        db["predictions_log"].insert_one(dict(record))
    return record

print("\n[Test prediction]", predict_emission({
    "Transport": "private", "Vehicle Type": "petrol", "Vehicle Monthly Distance Km": 500,
    "Frequency of Traveling by Air": "rarely", "Heating Energy Source": "natural gas",
    "Monthly Grocery Bill": 200, "Waste Bag Weekly Count": 3,
    "How Many New Clothes Monthly": 10, "Energy efficiency": "Sometimes", "Recycling Count": 1,
}))

# ==========================================
# 6. EXPORT FOR THE WEBSITE
# ==========================================
private = df[df["Transport"] == "private"].copy()
bands = pd.cut(private["Vehicle Monthly Distance Km"], [-1, 500, 1500, 3000, 10**7],
               labels=["0-500 km", "501-1500 km", "1501-3000 km", "3000+ km"])
def avg_count(g):
    return {str(k): {"average": round(float(v["mean"]), 1), "count": int(v["count"])}
            for k, v in g["CarbonEmission"].agg(["mean", "count"]).iterrows()}

air_order = ["never", "rarely", "frequently", "very frequently"]
air = df.groupby("Frequency of Traveling by Air")["CarbonEmission"].mean().round(1)

dashboard_data = {
    "model_metrics": {"r2": round(float(r2), 3), "rmse": round(rmse, 1), "mae": round(float(mae), 1)},
    "feature_importance": {k: round(float(v), 4) for k, v in importance.items()},
    "transport_avg": df.groupby("Transport")["CarbonEmission"].mean().round(1).to_dict(),
    "recycling_avg": df.groupby("Recycling Count")["CarbonEmission"].mean().round(1).to_dict(),
    "air_travel_avg": {k: float(air[k]) for k in air_order if k in air.index},
    "transport_drilldown": {
        "private_by_vehicle": avg_count(private.groupby("Vehicle Type")),
        "private_by_distance": avg_count(private.groupby(bands, observed=True)),
    },
}
with open(os.path.join(OUT_DIR, "dashboard_data.json"), "w") as f:
    json.dump(dashboard_data, f, indent=2)
print(f"\n[Export] {OUT_DIR}/dashboard_data.json written")

# Region -> Country -> Year data (from location_data.csv, a separate public dataset)
if os.path.exists("location_data.csv"):
    loc = pd.read_csv("location_data.csv")
    years = sorted(loc["year"].unique().tolist())
    out = {"years": years, "regions": {}}
    for (region, country), g in loc.groupby(["region", "country"]):
        g = g.set_index("year").reindex(years)
        out["regions"].setdefault(region, {})[country] = {
            "co2_per_capita": [None if pd.isna(v) else round(float(v), 3) for v in g["co2_per_capita"]],
            "oil_co2_per_capita": [None if pd.isna(v) else round(float(v), 3) for v in g["oil_co2_per_capita"]],
        }
    with open(os.path.join(OUT_DIR, "location_data.json"), "w") as f:
        json.dump(out, f)
    print(f"[Export] {OUT_DIR}/location_data.json written ({loc['country'].nunique()} countries)")
else:
    print("[Export] location_data.csv not found - skipping location export")
