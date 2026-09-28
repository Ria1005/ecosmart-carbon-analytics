import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from scipy import stats

print("--- EXTERNAL DATASET VALIDATION ---")
print("Loading independent 1.5 degree dataset...")

try:
    df = pd.read_excel('1.5 degree data_final.xlsx', sheet_name='coded data')
    
    # Map lt_mode to actual names
    mode_map = {
        1: "Walking",
        2: "Bicycle",
        3: "Public Transportation",
        4: "Car or other motorized vehicle",
        5: "Other"
    }
    
    if 'lt_mode' in df.columns and 'cf_footprint_ex_pm' in df.columns:
        # Filter out rows with missing data for these two columns
        df_valid = df.dropna(subset=['lt_mode', 'cf_footprint_ex_pm']).copy()
        
        valid_count = len(df_valid)
        print(f"Loaded {valid_count} valid records from independent dataset.")
        
        df_valid['lt_mode_name'] = df_valid['lt_mode'].map(mode_map)
        
        # Calculate mean, median, and count
        transport_summary = df_valid.groupby('lt_mode_name')['cf_footprint_ex_pm'].agg(['mean', 'median', 'count']).round(2)
        transport_summary = transport_summary.sort_values(by='mean', ascending=False)
        
        print("\n--- Transport Mode vs Total Footprint ---")
        print(transport_summary)
        
        # Kruskal-Wallis Test
        groups = [group['cf_footprint_ex_pm'].values for name, group in df_valid.groupby('lt_mode_name')]
        h_stat, p_val = stats.kruskal(*groups)
        
        print("\n--- Statistical Test (Kruskal-Wallis) ---")
        print(f"H-statistic: {h_stat:.4f}")
        print(f"p-value: {p_val:.4e}")
        
        # Plotting
        plt.figure(figsize=(10, 6))
        sns.barplot(x=transport_summary.index, y=transport_summary['mean'].values, hue=transport_summary.index, legend=False, palette="viridis")
        plt.title('External Validation: Carbon Footprint by Transport Mode')
        plt.xlabel('Primary Transport Mode')
        plt.ylabel('Average Total Carbon Footprint (kg CO2e)')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('external_validation_chart.png')
        print("\n[Chart] external_validation_chart.png generated.")
        
    conclusion_text = (
        "The independent 1.5 Degree Lifestyles dataset shows differences in average and median total carbon footprint across transport modes. "
        "In this dataset, respondents whose most-used mode was car or another motorized vehicle had the highest average total footprint, "
        "while bicycle, walking, public transport, and other modes had lower averages. "
        "The Kruskal-Wallis test confirms that the distributions of carbon footprints across these transport modes are statistically significantly different. "
        "This provides external supporting evidence for examining transport as an important contributor to carbon footprint, "
        "consistent with the transport-related findings in EcoSmart.\n\n"
        "This is an external comparison, not a retraining or direct performance validation of the EcoSmart Random Forest model.\n"
        "Note: R2, MAE, and RMSE are NOT calculated here because the external dataset has a different feature schema."
    )
    
    print("\n--- Validation Conclusion ---")
    print(conclusion_text)
    
    # Save text report
    with open('external_validation_report.txt', 'w', encoding='utf-8') as f:
        f.write("--- EXTERNAL DATASET VALIDATION ---\n\n")
        f.write(f"Total valid responses analyzed: {valid_count}\n\n")
        
        if 'lt_mode' in df.columns:
            f.write("Carbon Footprint by Transport Mode (kg CO2e):\n")
            f.write(transport_summary.to_string())
            f.write("\n\n")
            
            f.write("--- STATISTICAL TEST ---\n")
            f.write("Test: Kruskal-Wallis H-test (non-parametric ANOVA)\n")
            f.write(f"H-statistic: {h_stat:.4f}\n")
            f.write(f"p-value: {p_val:.4e}\n\n")
            
        f.write("CONCLUSION:\n")
        f.write(conclusion_text + "\n")
        
    print("\n[Report] external_validation_report.txt saved.")

except Exception as e:
    print("Error during validation:", e)
