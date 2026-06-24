"use client";
import React, { useState } from "react";

export default function AdvancedFertilityApp() {
  const [inputs, setInputs] = useState({
    variety: "Bayou Belle",
    soilP: "",
    soilK: "",
    pH: "",
    plantingDate: "",
    avgTemp: ""
  });

  const [output, setOutput] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");

  const varieties = {
    "Bayou Belle": {
      type: "Efficient non-responder",
      adjustment: { N: -0.1, P: -0.2, K: -0.1 },
      note: "Performs well under low fertility"
    },
    "Evangeline": {
      type: "Inefficient non-responder",
      adjustment: { N: 0.2, P: 0.2, K: 0.1 },
      note: "Requires higher fertility"
    },
    "Orleans": {
      type: "Efficient responder",
      adjustment: { N: 0.2, P: 0, K: 0.2 },
      note: "Responds strongly to N and K"
    }
  };

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const calculate = () => {
    const base = { N: 45, P: 80, K: 150 };
    const v = varieties[inputs.variety];

    let adjusted = {
      N: Math.round(base.N * (1 + v.adjustment.N)),
      P: Math.round(base.P * (1 + v.adjustment.P)),
      K: Math.round(base.K * (1 + v.adjustment.K))
    };

    if (Number(inputs.soilP) > 30) adjusted.P -= 20;
    if (Number(inputs.soilK) > 120) adjusted.K -= 30;

    let lime = Number(inputs.pH) < 5.8 ? "Apply lime to reach pH ~6.0" : "No lime required";

    // GDD Calculation
    const Tbase = 60;
    const avgTemp = Number(inputs.avgTemp);
    const dailyGDD = Math.max(0, avgTemp - Tbase);
    const targetGDD = 2400;

    const daysToHarvest = Math.ceil(targetGDD / (dailyGDD || 1));

    let harvestDate = "";
    if (inputs.plantingDate) {
      const plantDate = new Date(inputs.plantingDate);
      plantDate.setDate(plantDate.getDate() + daysToHarvest);
      harvestDate = plantDate.toDateString();
    }

    setOutput({
      adjusted,
      lime,
      harvestDate,
      daysToHarvest,
      varietyInfo: v
    });
  };

  const askAI = () => {
    let response = "";
    const v = varieties[inputs.variety];

    if (question.toLowerCase().includes("harvest")) {
      response = `Harvest is estimated based on degree day accumulation (~2400 GDD for sweetpotato maturity).`;
    } else if (question.toLowerCase().includes("why")) {
      response = `${inputs.variety} is a ${v.type}. ${v.note}, which influences fertilizer recommendations.`;
    } else {
      response = "This tool integrates variety response, soil fertility, and weather-driven growth modeling.";
    }

    setChat([...chat, { q: question, a: response }]);
    setQuestion("");
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>🍠 AI Fertility + Growth Model Tool</h1>

      <h3>Variety</h3>
      <select name="variety" value={inputs.variety} onChange={handleChange}>
        {Object.keys(varieties).map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>

      <h3>Field Conditions</h3>
      <input placeholder="Soil P" name="soilP" onChange={handleChange} /><br/>
      <input placeholder="Soil K" name="soilK" onChange={handleChange} /><br/>
      <input placeholder="Soil pH" name="pH" onChange={handleChange} /><br/>

      <h3>Weather Inputs</h3>
      <input type="date" name="plantingDate" onChange={handleChange} /><br/>
      <input placeholder="Average Temp (°F)" name="avgTemp" onChange={handleChange} /><br/>

      <br />
      <button onClick={calculate}>Run AI Model</button>

      {output && (
        <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 15 }}>
          <h2>Fertilizer Recommendation</h2>
          <p>N: {output.adjusted.N}</p>
          <p>P: {output.adjusted.P}</p>
          <p>K: {output.adjusted.K}</p>
          <p>{output.lime}</p>

          <h2>Harvest Prediction</h2>
          <p>Estimated harvest date: {output.harvestDate}</p>
          <p>Days to harvest: {output.daysToHarvest}</p>
        </div>
      )}

      <h2>💬 Ask AI</h2>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about growth, harvest, or fertilizer"
      />
      <button onClick={askAI}>Ask</button>

      {chat.map((c, i) => (
        <div key={i}>
          <strong>Q:</strong> {c.q}<br />
          <strong>A:</strong> {c.a}
        </div>
      ))}

    </div>
  );
}
