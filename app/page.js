"use client";
import React, { useState } from "react";

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
      <h1 style={{textAlign:"center"}}>🍠 AI4SP - Data-Driven Agronomy Decision Tool (AI-Assisted)</h1>
      <p style={{textAlign:"center", color:"#555"}}>
        Ground-truthed decision support for sweetpotato integrating variety response, soil fertility, and crop growth conditions
      </p>

      {/* rest unchanged */}
    </div>
  );
}
