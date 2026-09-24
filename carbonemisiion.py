import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pymongo
import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# ==========================================
# 1. LOAD DATA & CLEANUP
# ==========================================
# Make sure "carbon_footprints_cleaned (2).xlsx" is in the same folder as this script
df = pd.read_excel("carbon_footprints_cleaned.xlsx", keep_default_na=False)

# Preprocessing: Engineer the Recycling Count feature
df['Recycling Count'] = df['Recycling'].apply(lambda x: len(x.split(", ")) if x != "" else 0)

print("Dataset loaded successfully! Preview:")
print(df.head())

# ==========================================
# 2. EXPLORATORY DATA ANALYSIS (EDA)
# ==========================================
# Chart 1: Carbon Emission by Transport Type
plt.figure(figsize=(8, 5))
sns.barplot(data=df, x="Transport", y="CarbonEmission", estimator="mean")
plt.title("Average Carbon Emission by Transport Type")
plt.xlabel("Transport Type")
plt.ylabel("Average Carbon Emission")
plt.savefig("chart_transport.png", bbox_inches="tight")
plt.show()

# Chart 2: Carbon Emission by Diet Type
plt.figure(figsize=(8, 5))
sns.barplot(data=df, x="Diet", y="CarbonEmission", estimator="mean")
plt.title("Average Carbon Emission by Diet Type")
plt.xlabel("Diet Type")
plt.ylabel("Average Carbon Emission")
plt.savefig("chart_diet.png", bbox_inches="tight")
plt.show()

# Chart 3: Correlation Heatmap
plt.figure(figsize=(10, 7))
numeric_df = df.select_dtypes(include=['int64', 'float64'])
correlation = numeric_df.corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Correlation Heatmap of Numeric Features")
plt.savefig("chart_correlation.png", bbox_inches="tight")
plt.show()

# Chart 4: Recycling Count Impact
plt.figure(figsize=(8, 5))
sns.barplot(data=df, x="Recycling Count", y="CarbonEmission", estimator="mean")
plt.title("Average Carbon Emission by Number of Materials Recycled")
plt.xlabel("Number of Materials Recycled")
plt.ylabel("Average Carbon Emission")
plt.savefig("chart_recycling.png", bbox_inches="tight")
plt.show()

# Chart 5: Distribution of Carbon Emission
plt.figure(figsize=(8, 5))
sns.histplot(data=df, x="CarbonEmission", kde=True, bins=30)
plt.title("Distribution of Carbon Emission")
plt.xlabel("Carbon Emission")
plt.ylabel("Number of People")
plt.savefig("chart_distribution.png", bbox_inches="tight")
plt.show()

# ==========================================
# 2B. GRANULAR DIET-TYPE BREAKDOWN  (NEW)
# ==========================================
# Jatin's feedback: prove the "diet has minimal impact" claim with real
# granular numbers, not just a one-line assertion.
diet_breakdown = (
    df.groupby("Diet")["CarbonEmission"]
    .agg(average_emission="mean", sample_count="count", min_emission="min", max_emission="max")
    .round(2)
    .reset_index()
)
print("\n[Diet Breakdown]")
print(diet_breakdown)

# ==========================================
# 3. CONNECT TO MONGODB COMPASS & STORE RAW DATA
# ==========================================
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["CarbonFootprintDB"]
historical_collection = db["historical_data"]
historical_collection.delete_many({})
historical_collection.insert_many(df.to_dict("records"))
print("\n[MongoDB] Raw dataset successfully inserted into 'CarbonFootprintDB.historical_data'!")

# ==========================================
# 4. TRAIN MACHINE LEARNING MODEL FROM MONGODB DATA
# ==========================================
mongo_data = list(historical_collection.find({}, {"_id": 0}))
ml_df = pd.DataFrame(mongo_data)

features = ['Transport', 'Diet', 'Vehicle Monthly Distance Km', 'Recycling Count']
target = 'CarbonEmission'

X = ml_df[features]
y = ml_df[target]

X_encoded = pd.get_dummies(X, drop_first=True)

X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)

print(f"\n[ML Model] Training Complete!")
print(f" - Model R\u00b2 Score: {r2:.3f}")
print(f" - RMSE: {rmse:.2f}")
print(f" - MAE: {mae:.2f}")

# ==========================================
# 4B. FEATURE IMPORTANCE  (NEW)
# ==========================================
importances = pd.Series(model.feature_importances_, index=X_encoded.columns)
importances = importances.sort_values(ascending=False)
print("\n[Feature Importance]")
print(importances)

plt.figure(figsize=(9, 6))
importances.head(10).plot(kind="barh")
plt.gca().invert_yaxis()
plt.title("Top 10 Feature Importances (Random Forest)")
plt.xlabel("Importance")
plt.tight_layout()
plt.savefig("chart_feature_importance.png", bbox_inches="tight")
plt.show()

# ==========================================
# 4C. SHAP VALUES FOR INTERPRETABILITY  (NEW)
# ==========================================
# pip install shap --break-system-packages   (if not already installed)
try:
    import shap

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    plt.figure()
    shap.summary_plot(shap_values, X_test, show=False)
    plt.tight_layout()
    plt.savefig("chart_shap_summary.png", bbox_inches="tight")
    plt.close()
    print("\n[SHAP] Summary plot saved to chart_shap_summary.png")

    # Mean absolute SHAP value per feature = simple "AI insight" ranking
    shap_importance = pd.Series(
        np.abs(shap_values).mean(axis=0), index=X_encoded.columns
    ).sort_values(ascending=False)
    print("\n[SHAP] Mean |SHAP value| per feature:")
    print(shap_importance)
except ImportError:
    print("\n[SHAP] Skipped \u2014 install with: pip install shap --break-system-packages")
    shap_importance = importances  # fallback so export below still works

# ==========================================
# 5. PREDICTION SYSTEM & MONGODB LOGGING
# ==========================================
def predict_and_save_emission(user_input):
    """
    Takes a single user dictionary input, runs ML prediction,
    and logs the user record with prediction into MongoDB.
    """
    input_df = pd.DataFrame([user_input])
    input_encoded = pd.get_dummies(input_df).reindex(columns=X_encoded.columns, fill_value=0)

    predicted_emission = model.predict(input_encoded)[0]

    record = {
        **user_input,
        "Predicted_CarbonEmission": round(float(predicted_emission), 2)
    }

    db["predictions_log"].insert_one(record)
    return record


# --- Test Prediction Example ---
sample_user = {
    'Transport': 'Private Car',
    'Diet': 'Omnivore',
    'Vehicle Monthly Distance Km': 500,
    'Recycling Count': 1
}
result = predict_and_save_emission(sample_user)
print("\n[MongoDB] New Prediction Saved:")
print(result)

# ==========================================
# 6. EXPORT DATA FOR THE DASHBOARD  (NEW)
# ==========================================
# This JSON feeds the new Chart.js dashboard directly \u2014 no more Power BI
# iframe auth wall. Everything the dashboard needs lives in one file.
dashboard_data = {
    "model_metrics": {
        "r2": round(float(r2), 3),
        "rmse": round(float(rmse), 2),
        "mae": round(float(mae), 2),
    },
    "feature_importance": {k: round(float(v), 4) for k, v in importances.items()},
    "transport_avg": (
        df.groupby("Transport")["CarbonEmission"].mean().round(2).to_dict()
    ),
    "diet_breakdown": diet_breakdown.to_dict(orient="records"),
    "recycling_avg": (
        df.groupby("Recycling Count")["CarbonEmission"].mean().round(2).to_dict()
    ),
    "emission_distribution": df["CarbonEmission"].round(1).tolist(),
}

# Year-wise breakdown only if a Year/Date column exists in your data.
# If your survey has a year column, rename it below and uncomment:
# dashboard_data["yearly_avg"] = df.groupby("Year")["CarbonEmission"].mean().round(2).to_dict()

with open("dashboard_data.json", "w") as f:
    json.dump(dashboard_data, f, indent=2)

print("\n[Export] dashboard_data.json written \u2014 use this to power the Chart.js dashboard.")
