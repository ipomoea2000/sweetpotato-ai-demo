"use client";
import React, { useState } from "react";

export default function AdvancedFertilityApp() {
  const [inputs, setInputs] = useState({
    variety: "Bayou Belle",
    soilP: "",
    soilK: "",
    pH: ""
  });

  const [output, setOutput] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");

  const varieties = {
    "Bayou Belle": {
      type: "Efficient non-responder",
      adjustment: { N: -0.1, P: -0.2, K: -0.1 },
      note: "Performs well under low fertility; minimal response to added inputs"
    },
    "Evangeline": {
      type: "Inefficient non-responder",
      adjustment: { N: 0.2, P: 0.2, K: 0.1 },
      note: "Requires higher fertility to maintain yield"
    },
    "Orleans": {
      type: "Efficient responder",
      adjustment: { N: 0.2, P: 0, K: 0.2 },
      note: "Highly responsive to N and K inputs"
    },
    "Beauregard": {
      type: "Variable",
      adjustment: { N: 0.1, P: 0.1, K: 0.1 },
      note: "Moderate and inconsistent response"
    },
    "Murasaki": {
      type: "Limited data",
      adjustment: { N: 0, P: 0, K: 0.1 },
      note: "Moderate K sensitivity; limited data"
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

    setOutput({ adjusted, lime, varietyInfo: v });
  };

  const askAI = () => {
    let response = "";
    const v = varieties[inputs.variety];

    if (question.toLowerCase().includes("why")) {
      response = `The recommendation reflects that ${inputs.variety} is a ${v.type}. ${v.note}. Fertilizer rates adjust based on efficiency and responsiveness.`;
    } else if (question.toLowerCase().includes("best variety")) {
      if (Number(inputs.soilP) > 30 && Number(inputs.soilK) > 120) {
        response = "High fertility fields favor responsive varieties like Orleans.";
      } else {
        response = "Lower fertility fields are better suited to efficient varieties like Bayou Belle.";
      }
    } else if (question.toLowerCase().includes("nitrogen") || question.toLowerCase().includes("N")) {
      response = `${inputs.variety} shows ${v.type} behavior, so nitrogen rates are adjusted accordingly.`;
    } else {
      response = "This tool integrates variety response and soil conditions to guide fertilizer decisions.";
    }

    setChat([...chat, { q: question, a: response }]);
    setQuestion("");
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>🍠 AI Fertility + Variety Decision Tool</h1>

      <div>
        <h3>Select Variety</h3>
        <select name="variety" value={inputs.variety} onChange={handleChange}>
          {Object.keys(varieties).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <h3>Field Conditions</h3>
        <input placeholder="Soil P (ppm)" name="soilP" onChange={handleChange} /> <br />
        <input placeholder="Soil K (ppm)" name="soilK" onChange={handleChange} /> <br />
        <input placeholder="Soil pH" name="pH" onChange={handleChange} />
      </div>

      <br />
      <button onClick={calculate}>Generate Recommendation</button>

      {output && (
        <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 15 }}>
          <h2>Recommendation</h2>
          <p>N: {output.adjusted.N} lbs/ac</p>
          <p>P2O5: {output.adjusted.P} lbs/ac</p>
          <p>K2O: {output.adjusted.K} lbs/ac</p>
          <p>{output.lime}</p>

          <h3>Variety Insight</h3>
          <p><strong>{inputs.variety}</strong> – {output.varietyInfo.type}</p>
          <p>{output.varietyInfo.note}</p>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h2>💬 Ask AI</h2>
        <input
          placeholder="Ask about fertilizer, variety, or field conditions"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: "70%" }}
        />
        <button onClick={askAI}>Ask</button>

        <div style={{ marginTop: 15 }}>
          {chat.map((c, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong>Q:</strong> {c.q}<br />
              <strong>A:</strong> {c.a}
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: "red", marginTop: 20 }}>
        ⚠️ Educational demo. Validate with LSU AgCenter recommendations.
      </p>
    </div>
  );
}
