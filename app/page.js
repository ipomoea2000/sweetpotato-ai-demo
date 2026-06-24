"use client";
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function AIApp() {
  const defaultInputs = {
    variety: "Bayou Belle",
    fertility: "medium",
    stageOverride: "auto",
    lat: "",
    lon: "",
    plantingDate: ""
  };

  const [inputs, setInputs] = useState(defaultInputs);
  const [output, setOutput] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");

  const varieties = {
    "Bayou Belle": { adj: { N: -0.1, P: -0.2, K: -0.1 }, type: "Efficient" },
    "Orleans": { adj: { N: 0.2, P: 0, K: 0.2 }, type: "Responsive" },
    "Evangeline": { adj: { N: 0.2, P: 0.2, K: 0.1 }, type: "High input" }
  };

  const fertilityAdjustment = {
    low: { N: 1.2, P: 1.2, K: 1.2 },
    medium: { N: 1, P: 1, K: 1 },
    high: { N: 0.8, P: 0.8, K: 0.8 }
  };

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const resetInputs = () => {
    setInputs(defaultInputs);
    setOutput(null);
    setChat([]);
  };

  const calculate = async () => {
    const base = { N: 45, P: 80, K: 150 };
    const v = varieties[inputs.variety];
    const fAdj = fertilityAdjustment[inputs.fertility];

    let fert = {
      N: base.N * (1 + v.adj.N) * fAdj.N,
      P: base.P * (1 + v.adj.P) * fAdj.P,
      K: base.K * (1 + v.adj.K) * fAdj.K
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
    if (inputs.stageOverride !== "auto") {
      stage = inputs.stageOverride;
    } else {
      if (cumulativeGDD < 200) stage = "Emergence";
      else if (cumulativeGDD < 600) stage = "Root Initiation";
      else if (cumulativeGDD < 1800) stage = "Bulking";
      else stage = "Maturity";
    }

    if (stage === "Root Initiation") fert.N -= 10;
    if (stage === "Bulking") fert.K += 25;

    const targetGDD = 2400;
    const daysRemaining = Math.max(0, Math.ceil((targetGDD - cumulativeGDD)/(dailyGDD || 1)));

    const curve = Array.from({ length: 50 }, (_, i) => {
      const x = i / 50;
      const y = 1 / (1 + Math.exp(-10 * (x - 0.5)));
      return { x: i, y: y * 100 };
    });

    const currentX = (cumulativeGDD / targetGDD) * 50;

    const nutrientTrend = Array.from({ length: 30 }, (_, i) => {
      const progress = i / 30;
      return {
        x: i,
        N: fert.N * (1 - progress * 0.3),
        P: fert.P * (1 - progress * 0.1),
        K: fert.K * (1 + progress * 0.3)
      };
    });

    setOutput({ fert, avgTemp, cumulativeGDD, stage, daysRemaining, curve, currentX, nutrientTrend, variety:v });
  };

  const askAI = () => {
    if (!output) return;
    let response = `Stage is ${output.stage}. Recommendations combine field fertility, variety response, and crop development.`;
    setChat([...chat, { q: question, a: response }]);
    setQuestion("");
  };

  return (
    <div style={{padding:20,maxWidth:900,margin:"auto",fontFamily:"Arial"}}>

      {/* HEADER */}
      <div style={{textAlign:"center", marginBottom:10}}>
        <div style={{fontSize:36}}>🌱🍠</div>
        <h1>AI4SP - Data-Driven Agronomy Decision Tool (AI-Assisted)</h1>
        <p style={{color:"#555"}}>
          Ground-truthed decision support for sweetpotato integrating variety response, soil fertility, and crop growth conditions
        </p>
      </div>

      {/* INPUT PANEL */}
      <div style={{border:"2px solid green", padding:15, borderRadius:10}}>
        <h2>🌱 Variety + Field Setup</h2>

        <select name="variety" value={inputs.variety} onChange={handleChange}>
          {Object.keys(varieties).map(v => <option key={v}>{v}</option>)}
        </select>

        <br/><br/>

        <label>Field Fertility</label><br/>
        <select name="fertility" value={inputs.fertility} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <br/><br/>

        <label>Override Stage</label><br/>
        <select name="stageOverride" value={inputs.stageOverride} onChange={handleChange}>
          <option value="auto">Auto</option>
          <option value="Emergence">Emergence</option>
          <option value="Root Initiation">Root Initiation</option>
          <option value="Bulking">Bulking</option>
          <option value="Maturity">Maturity</option>
        </select>

        <br/><br/>

        <input type="date" name="plantingDate" value={inputs.plantingDate} onChange={handleChange}/><br/>
        <input placeholder="Latitude" name="lat" value={inputs.lat} onChange={handleChange}/><br/>
        <input placeholder="Longitude" name="lon" value={inputs.lon} onChange={handleChange}/><br/>

        <br/>
        <button onClick={calculate}>Run Model</button>
        <button onClick={resetInputs} style={{marginLeft:10}}>Reset</button>

        {output && (
          <div style={{marginTop:10}}>
            <h3>✅ Recommendation</h3>
            <p>N: {Math.round(output.fert.N)}</p>
            <p>P: {Math.round(output.fert.P)}</p>
            <p>K: {Math.round(output.fert.K)}</p>
          </div>
        )}
      </div>

      {/* OUTPUT */}
      {output && (
        <div style={{marginTop:20}}>
          <h2>🌦 Growth</h2>
          <p><b>{output.stage}</b> | GDD: {output.cumulativeGDD.toFixed(0)}</p>

          <svg width="100%" height="200">
            {output.curve.map((p,i)=>(
              <circle key={i} cx={p.x*6} cy={200-p.y*2} r="2" fill="green" />
            ))}
            <line x1={output.currentX*6} x2={output.currentX*6} y1="0" y2="200" stroke="red" />
          </svg>

          <h3>Nutrient Trends</h3>
          <svg width="100%" height="200">
            {output.nutrientTrend.map((p,i)=>(
              <circle key={i} cx={p.x*10} cy={200-Math.min(p.N,180)} r="1" fill="blue" />
            ))}
            {output.nutrientTrend.map((p,i)=>(
              <circle key={i+100} cx={p.x*10} cy={200-Math.min(p.K,180)} r="1" fill="orange" />
            ))}
          </svg>
          <p>🔵 N &nbsp;&nbsp; 🟠 K</p>
        </div>
      )}

      {/* CHAT */}
      <h2>💬 Ask AI</h2>
      <input value={question} onChange={(e)=>setQuestion(e.target.value)} />
      <button onClick={askAI}>Ask</button>

      {chat.map((c,i)=>(<div key={i}><b>Q:</b> {c.q}<br/><b>A:</b> {c.a}</div>))}
<Analytics />
    </div>
  );
}
