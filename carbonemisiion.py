import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

import pymongo
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# ==========================================
# 1. LOAD DATA & CLEANUP
# ==========================================
# Make sure "carbon_footprints_cleaned (2).xlsx" is in the same folder as this script
df = pd.read_excel("carbon_footprints_cleaned (2).xlsx", keep_default_na=False)

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
plt.show()

# Chart 2: Carbon Emission by Diet Type
plt.figure(figsize=(8, 5))
sns.barplot(data=df, x="Diet", y="CarbonEmission", estimator="mean")
plt.title("Average Carbon Emission by Diet Type")
plt.xlabel("Diet Type")
plt.ylabel("Average Carbon Emission")
plt.show()

# Chart 3: Correlation Heatmap
plt.figure(figsize=(10, 7))
numeric_df = df.select_dtypes(include=['int64', 'float64'])
correlation = numeric_df.corr()
sns.heatmap(correlation, annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Correlation Heatmap of Numeric Features")
plt.show()

# Chart 4: Recycling Count Impact
plt.figure(figsize=(8, 5))
sns.barplot(data=df, x="Recycling Count", y="CarbonEmission", estimator="mean")
plt.title("Average Carbon Emission by Number of Materials Recycled")
plt.xlabel("Number of Materials Recycled")
plt.ylabel("Average Carbon Emission")
plt.show()

# Chart 5: Distribution of Carbon Emission
plt.figure(figsize=(8, 5))
sns.histplot(data=df, x="CarbonEmission", kde=True, bins=30)
plt.title("Distribution of Carbon Emission")
plt.xlabel("Carbon Emission")
plt.ylabel("Number of People")
plt.show()

# ==========================================
# 3. CONNECT TO MONGODB COMPASS & STORE RAW DATA
# ==========================================
# Local connection string for MongoDB Compass
client = pymongo.MongoClient("mongodb://localhost:27017/")

# Select/Create database and collection
db = client["CarbonFootprintDB"]
historical_collection = db["historical_data"]

# Clear collection if re-running script, then insert data
historical_collection.delete_many({})
historical_collection.insert_many(df.to_dict("records"))
print("\n[MongoDB] Raw dataset successfully inserted into 'CarbonFootprintDB.historical_data'!")

# ==========================================
# 4. TRAIN MACHINE LEARNING MODEL FROM MONGODB DATA
# ==========================================
# Fetch data directly from MongoDB
mongo_data = list(historical_collection.find({}, {"_id": 0}))
ml_df = pd.DataFrame(mongo_data)

# Define input features and target column
# (Using key factors identified during your EDA)
features = ['Transport', 'Diet', 'Vehicle Monthly Distance Km', 'Recycling Count']
target = 'CarbonEmission'

X = ml_df[features]
y = ml_df[target]

# One-Hot Encoding for text variables ('Transport', 'Diet')
X_encoded = pd.get_dummies(X, drop_first=True)

# Train-Test Split (80% Training, 20% Testing)
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

# Instantiate and train Random Forest Regressor
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate performance
y_pred = model.predict(X_test)
print(f"\n[ML Model] Training Complete!")
print(f" - Model R² Score: {r2_score(y_test, y_pred):.2f}")
print(f" - Root Mean Squared Error (RMSE): {np.sqrt(mean_squared_error(y_test, y_pred)):.2f}")

# ==========================================
# 5. PREDICTION SYSTEM & MONGODB LOGGING
# ==========================================
def predict_and_save_emission(user_input):
    """
    Takes a single user dictionary input, runs ML prediction,
    and logs the user record with prediction into MongoDB.
    """
    # Convert input dict to DataFrame & align columns with model features
    input_df = pd.DataFrame([user_input])
    input_encoded = pd.get_dummies(input_df).reindex(columns=X_encoded.columns, fill_value=0)
    
    # Predict emission
    predicted_emission = model.predict(input_encoded)[0]
    
    # Create output document
    record = {
        **user_input,
        "Predicted_CarbonEmission": round(float(predicted_emission), 2)
    }
    
    # Insert prediction document into MongoDB collection 'predictions_log'
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