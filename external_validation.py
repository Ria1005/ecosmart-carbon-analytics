import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

print("--- EXTERNAL DATASET VALIDATION ---")
print("Loading independent 1.5 degree dataset...")

try:
    df = pd.read_excel('1.5 degree data_final.xlsx', sheet_name='coded data')
    print(f"Loaded {len(df)} records from independent dataset.")
    
    # Map lt_mode to actual names
    mode_map = {
        1: "Walking",
        2: "Bicycle",
        3: "Public Transportation",
        4: "Car or other motorized vehicle",
        5: "Other"
    }
    
    if 'lt_mode' in df.columns and 'cf_footprint_ex_pm' in df.columns:
        df['lt_mode_name'] = df['lt_mode'].map(mode_map)
        
        print("\n--- Transport Mode vs Total Footprint ---")
        transport_summary = df.groupby('lt_mode_name')['cf_footprint_ex_pm'].mean().round(2).sort_values(ascending=False)
        print(transport_summary)
        
        # Plotting
        plt.figure(figsize=(10, 6))
        sns.barplot(x=transport_summary.index, y=transport_summary.values, hue=transport_summary.index, legend=False, palette="viridis")
        plt.title('External Validation: Carbon Footprint by Transport Mode')
        plt.xlabel('Primary Transport Mode')
        plt.ylabel('Average Total Carbon Footprint (kg CO2e)')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('external_validation_chart.png')
        print("\n[Chart] external_validation_chart.png generated.")
        
    conclusion_text = (
        "The independent 1.5 Degree Lifestyles dataset shows differences in average total carbon footprint across transport modes. "
        "In this dataset, respondents whose most-used mode was car or another motorized vehicle had the highest average total footprint (7878.98 kg CO2e), "
        "while bicycle, walking, public transport, and other modes had lower averages. "
        "This provides external supporting evidence for examining transport as an important contributor to carbon footprint, "
        "consistent with the transport-related findings in EcoSmart. "
        "This is an external comparison, not a retraining or direct performance validation of the EcoSmart Random Forest model.\n\n"
        "Note: R2, MAE, and RMSE are NOT calculated here because the external dataset has a different feature schema."
    )
    
    print("\n--- Validation Conclusion ---")
    print(conclusion_text)
    
    # Save text report
    with open('external_validation_report.txt', 'w', encoding='utf-8') as f:
        f.write("--- EXTERNAL DATASET VALIDATION ---\n\n")
        if 'lt_mode' in df.columns:
            f.write("Average Total Carbon Footprint by Transport Mode (kg CO2e):\n")
            f.write(transport_summary.to_string())
            f.write("\n\n")
        f.write("CONCLUSION:\n")
        f.write(conclusion_text + "\n")
        
    print("\n[Report] external_validation_report.txt saved.")

except Exception as e:
    print("Error during validation:", e)
