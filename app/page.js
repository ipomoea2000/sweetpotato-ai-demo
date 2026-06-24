"use client";
import React, { useState } from "react";

export default function AIApp() {
  const [inputs, setInputs] = useState({
    variety: "Bayou Belle",
    fertility: "medium",
    lat: "",
    lon: "",
    plantingDate: ""
  });

  const [output, setOutput] = useState(null);

  const varieties = {
    "Bayou Belle": { adj: { N: -0.1, P: -0.2, K: -0.1 }, type:"Efficient" },
    "Orleans": { adj: { N: 0.2, P: 0, K: 0.2 }, type:"Responsive" },
    "Evangeline": { adj: { N: 0.2, P: 0.2, K: 0.1 }, type:"High input" }
  };

  const fertilityAdjustment = {
    low: { N: 1.2, P: 1.2, K: 1.2 },
    medium: { N: 1, P: 1, K: 1 },
    high: { N: 0.8, P: 0.8, K: 0.8 }
  };

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const calculate = async () => {
    const base = { N: 45, P: 80, K: 150 };
    const v = varieties[inputs.variety];
    const fAdj = fertilityAdjustment[inputs.fertility];

    let fert = {
      N: Math.round(base.N * (1 + v.adj.N) * fAdj.N),
      P: Math.round(base.P * (1 + v.adj.P) * fAdj.P),
      K: Math.round(base.K * (1 + v.adj.K) * fAdj.K)
    };

    let avgTemp = 75;
    try {
      const res = await fetch(`https://api.weather.gov/points/${inputs.lat},${inputs.lon}`);
      const data = await res.json();
      const fRes = await fetch(data.properties.forecast);
      const fData = await fRes.json();
      const temps = fData.properties.periods.map(p => p.temperature);
      avgTemp = temps.reduce((a,b)=>a+b,0)/temps.length;
    } catch {}

    const Tbase = 60;
    const dailyGDD = Math.max(0, avgTemp - Tbase);

    const plantDate = inputs.plantingDate ? new Date(inputs.plantingDate) : new Date();
    const today = new Date();
    const days = Math.max(0, Math.floor((today - plantDate)/(1000*60*60*24)));

    const cumulativeGDD = dailyGDD * days;

    let stage = "";
    if (cumulativeGDD < 200) stage = "Emergence";
    else if (cumulativeGDD < 600) stage = "Root Initiation";
    else if (cumulativeGDD < 1800) stage = "Bulking";
    else stage = "Maturity";

    if (stage === "Root Initiation") fert.N -= 10;
    if (stage === "Bulking") fert.K += 25;

    setOutput({ fert, stage, cumulativeGDD });
  };

  return (
    <div style={{ padding:20, maxWidth:900, margin:"auto" }}>
      <h1>🍠 AI Agronomy System</h1>

      <h3>Variety</h3>
      <select name="variety" onChange={handleChange}>
        {Object.keys(varieties).map(v => <option key={v}>{v}</option>)}
      </select>

      <h3>Field Fertility</h3>
      <select name="fertility" onChange={handleChange}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <h3>Inputs</h3>
      <input type="date" name="plantingDate" onChange={handleChange} /><br/>
      <input placeholder="Lat" name="lat" onChange={handleChange} /><br/>
      <input placeholder="Lon" name="lon" onChange={handleChange} />

      <br/>
      <button onClick={calculate}>Run Model</button>

      {output && (
        <div style={{ marginTop:20 }}>
          <h2>Fertilizer Recommendation</h2>
          <p>N: {output.fert.N}</p>
          <p>P: {output.fert.P}</p>
          <p>K: {output.fert.K}</p>

          <h3>Stage</h3>
          <p>{output.stage}</p>
          <p>GDD: {output.cumulativeGDD.toFixed(0)}</p>
        </div>
      )}
    </div>
  );
}
