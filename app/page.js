"use client";
import React, { useState } from "react";

export default function AIApp() {
  const [inputs, setInputs] = useState({
    variety: "Bayou Belle",
    lat: "",
    lon: "",
    plantingDate: ""
  });

  const [output, setOutput] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");

  const varieties = {
    "Bayou Belle": { adj: { N: -0.1, P: -0.2, K: -0.1 }, type:"Efficient" },
    "Orleans": { adj: { N: 0.2, P: 0, K: 0.2 }, type:"Responsive" },
    "Evangeline": { adj: { N: 0.2, P: 0.2, K: 0.1 }, type:"High input" }
  };

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const calculate = async () => {
    const base = { N: 45, P: 80, K: 150 };
    const v = varieties[inputs.variety];

    let fert = {
      N: Math.round(base.N * (1 + v.adj.N)),
      P: Math.round(base.P * (1 + v.adj.P)),
      K: Math.round(base.K * (1 + v.adj.K))
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

    const targetGDD = 2400;
    const daysRemaining = Math.max(0, Math.ceil((targetGDD - cumulativeGDD)/(dailyGDD || 1)));

    const curve = Array.from({ length: 50 }, (_, i) => {
      const x = i / 50;
      const y = 1 / (1 + Math.exp(-10 * (x - 0.5)));
      return { x: i, y: y * 100 };
    });

    const currentX = (cumulativeGDD / targetGDD) * 50;

    setOutput({ fert, avgTemp, dailyGDD, cumulativeGDD, stage, daysRemaining, curve, currentX, variety:v });
  };

  const askAI = () => {
    let response = "";

    if (!output) {
      response = "Run the model first to enable AI insights.";
    } else if (question.toLowerCase().includes("why")) {
      response = `System adjusted fertilizer because crop is in ${output.stage}. Nutrient demand changes with growth stage.`;
    } else if (question.toLowerCase().includes("stage")) {
      response = `Crop is currently in ${output.stage} based on ${Math.round(output.cumulativeGDD)} GDD.`;
    } else if (question.toLowerCase().includes("harvest")) {
      response = `Estimated ${output.daysRemaining} days remaining to reach maturity.`;
    } else {
      response = "This AI integrates weather, crop development, and variety response to guide decisions.";
    }

    setChat([...chat, { q: question, a: response }]);
    setQuestion("");
  };

  return (
    <div style={{padding:20,maxWidth:900,margin:"auto",fontFamily:"Arial"}}>
      <h1 style={{textAlign:"center"}}>🍠 AI Agronomy System (Pro)</h1>

      {/* TOP SECTION: Variety + Inputs */}
      <h3>Variety & Field Setup</h3>
      <select name="variety" onChange={handleChange}>
        {Object.keys(varieties).map(v => <option key={v}>{v}</option>)}
      </select>
      <br/><br/>
      <input name="plantingDate" type="date" onChange={handleChange} />
      <br/>
      <input placeholder="Latitude" name="lat" onChange={handleChange} />
      <br/>
      <input placeholder="Longitude" name="lon" onChange={handleChange} />
      <br/><br/>

      <button onClick={calculate}>Run Model</button>

      {output && (
        <div style={{marginTop:20}}>

          {/* TOP OUTPUT: Fertility */}
          <h2>🌱 Fertility Recommendation</h2>
          <p>N: {output.fert.N} lbs/ac</p>
          <p>P: {output.fert.P} lbs/ac</p>
          <p>K: {output.fert.K} lbs/ac</p>
          <p><b>Variety Type:</b> {inputs.variety} ({output.variety.type})</p>

          {/* LOWER SECTION: GDD & GROWTH */}
          <h2 style={{marginTop:20}}>🌦 Growth & GDD Model</h2>
          <p>Avg Temp: {output.avgTemp.toFixed(1)}°F</p>
          <p>Daily GDD: {output.dailyGDD.toFixed(1)}</p>
          <p>Cumulative GDD: {output.cumulativeGDD.toFixed(0)}</p>
          <p><strong>Growth Stage: {output.stage}</strong></p>

          <h3>Growth Curve</h3>
          <svg width="100%" height="200">
            {output.curve.map((p, i) => (
              <circle key={i} cx={p.x * 6} cy={200 - p.y * 2} r="2" fill="green" />
            ))}
            <line x1={output.currentX*6} x2={output.currentX*6} y1="0" y2="200" stroke="red" strokeWidth="2" />
          </svg>

          <h3>⏱ Days to Harvest</h3>
          <p>{output.daysRemaining} days</p>

        </div>
      )}

      {/* CHATBOX AT BOTTOM */}
      <h2 style={{marginTop:30}}>💬 Ask AI</h2>
      <input value={question} onChange={(e)=>setQuestion(e.target.value)} />
      <button onClick={askAI}>Ask</button>

      {chat.map((c,i)=>(
        <div key={i}><b>Q:</b> {c.q}<br/><b>A:</b> {c.a}</div>
      ))}

      <p style={{color:"red"}}>⚠️ Educational demo only.</p>
    </div>
  );
}
