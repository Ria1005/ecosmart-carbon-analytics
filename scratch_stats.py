import pandas as pd
import json
df=pd.read_excel('carbon_footprints_cleaned.xlsx')
bands=[0,500,1500,3000,999999]
labels=['0-500 km','501-1500 km','1501-3000 km','3000+ km']
results={}
for m in ['private','public','walk/bicycle']:
    m_df=df[df['Transport']==m].copy()
    if len(m_df)>0:
        m_df['band']=pd.cut(m_df['Vehicle Monthly Distance Km'], bins=bands, labels=labels, include_lowest=True)
        # Using observed=False explicitly to handle categorical deprecation behavior
        grp=m_df.groupby('band', observed=False)['CarbonEmission'].agg(['count','mean','median','min','max'])
        grp=grp[grp['count']>0]
        results[m]=grp.to_dict(orient='index')
print(json.dumps(results, indent=2))
