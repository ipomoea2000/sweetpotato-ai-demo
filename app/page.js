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

  const calculate = async () => {
    const base = { N: 45, P: 80, K: 150 };
    const v = varieties[inputs.variety];
    const fAdj = fertilityAdjustment[inputs.fertility];

    let fert = {
      N: Math.round(base.N * (1 + v.adj.N) * fAdj.N),
      P: Math.round(base.P * (1 + v.adj.P) * fAdj.P),
      K: Math.round(base.K * (1 + v.adj.K) * fAdj.K)
    };

    // NOAA weather
    let avgTemp = 75;
    try {
      const res = await fetch(`https://api.weather.gov/points/${inputs.lat},${inputs.lon}`);
      const data = await res.json();
      const fRes = await fetch(data.properties.forecast);
      const fData = await fRes.json();
      const temps = fData.properties.periods.map(p => p.temperature);
      avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    } catch {}

    // GDD
    const Tbase = 60;
    const dailyGDD = Math.max(0, avgTemp - Tbase);

    const plantDate = inputs.plantingDate ? new Date(inputs.plantingDate) : new Date();
    const today = new Date();
    const days = Math.max(0, Math.floor((today - plantDate) / (1000 * 60 * 60 * 24)));
    const cumulativeGDD = dailyGDD * days;

    let stage = "";
    if (cumulativeGDD < 200) stage = "Emergence";
    else if (cumulativeGDD < 600) stage = "Root Initiation";
    else if (cumulativeGDD < 1800) stage = "Bulking";
    else stage = "Maturity";

    // Stage-based fert tweaks
    if (stage === "Root Initiation") fert.N -= 10;
    if (stage === "Bulking") fert.K += 25;

    // Growth curve (sigmoid)
    const targetGDD = 2400;
    const curve = Array.from({ length: 50 }, (_, i) => {
      const x = i / 50;
      const y = 1 / (1 + Math.exp(-10 * (x - 0.5)));
      return { x: i, y: y * 100 };
    });

    const currentX = (cumulativeGDD / targetGDD) * 50;

    const daysRemaining = Math.max(
      0,
      Math.ceil((targetGDD - cumulativeGDD) / (dailyGDD || 1))
    );

    setOutput({
      fert,
      avgTemp,
      dailyGDD,
      cumulativeGDD,
      stage,
      daysRemaining,
      curve,
      currentX,
      variety: v
    });
  };

  const askAI = () => {
    let response = "";

    if (!output) {
      response = "Run the model first.";
    } else if (question.toLowerCase().includes("why")) {
      response = `Recommendation reflects ${inputs.variety} (${output.variety.type}), field fertility (${inputs.fertility}), and crop stage (${output.stage}).`;
    } else if (question.toLowerCase().includes("stage")) {
      response = `Current stage is ${output.stage} at ${Math.round(output.cumulativeGDD)} GDD.`;
    } else if (question.toLowerCase().includes("harvest")) {
      response = `Estimated ${output.daysRemaining} days to harvest.`;
    } else {
      response = "This system integrates variety, soil fertility, weather, and crop growth.";
    }

    setChat([...chat, { q: question, a: response }]);
    setQuestion("");
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>🍠 AI Agronomy Decision System</h1>

      {/* TOP PANEL */}
      <div style={{ border: "2px solid green", padding: 15, borderRadius: 8 }}>
        <h2>🌱 Variety + Fertility</h2>

        <select name="variety" onChange={handleChange}>
          {Object.keys(varieties).map(v => <option key={v}>{v}</option>)}
        </select>

        <br /><br />

        <label>Field Fertility</label><br />
        <select name="fertility" onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <br /><br />

        <input type="date" name="plantingDate" onChange={handleChange} /><br />
        <input placeholder="Latitude" name="lat" onChange={handleChange} /><br />
        <input placeholder="Longitude" name="lon" onChange={handleChange} />

        <br /><br />
        <button onClick={calculate}>Run Model</button>

        {output && (
          <div style={{ marginTop: 10 }}>
            <h3>✅ Recommendation</h3>
            <p>N: {output.fert.N}</p>
            <p>P: {output.fert.P}</p>
            <p>K: {output.fert.K}</p>
            <p>{inputs.variety} ({output.variety.type})</p>
            <p>Field: {inputs.fertility}</p>
          </div>
        )}
      </div>

      {/* GROWTH SECTION */}
      {output && (
        <div style={{ marginTop: 20 }}>
          <h2>🌦 Crop Growth Model</h2>
          <p>GDD: {output.cumulativeGDD.toFixed(0)}</p>
          <p><b>Stage: {output.stage}</b></p>

          <svg width="100%" height="200">
            {output.curve.map((p, i) => (
              <circle key={i} cx={p.x * 6} cy={200 - p.y * 2} r="2" fill="green" />
            ))}
            <line x1={output.currentX * 6} x2={output.currentX * 6} y1="0" y2="200" stroke="red" />
          </svg>

          <p>⏱ {output.daysRemaining} days to harvest</p>
        </div>
      )}

      {/* CHAT */}
      <h2>💬 Ask AI</h2>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={askAI}>Ask</button>

      {chat.map((c, i) => (
        <div key={i}>
          <b>Q:</b> {c.q}<br />
          <b>A:</b> {c.a}
        </div>
      ))}
    </div>
  );
}
