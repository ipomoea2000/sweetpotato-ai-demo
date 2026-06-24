"use client";
import React, { useState } from "react";
export default function FertilityDemo() {
  const [data, setData] = useState({ P: "", K: "", pH: "", yieldGoal: "" });
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState("");
  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const loadScenario = (scenario) => {
    if (scenario === "low") {
      setData({ P: "20", K: "80", pH: "5.5", yieldGoal: "500" });
    } else if (scenario === "high") {
      setData({ P: "60", K: "150", pH: "6.2", yieldGoal: "450" });
    } else if (scenario === "intensive") {
      setData({ P: "30", K: "100", pH: "5.9", yieldGoal: "700" });
    }
  };
  const interpretLevel = (value, type) => {
    const v = Number(value);
    if (!v) return "Unknown";
    if (type === "K") return v < 100 ? "LOW" : v < 140 ? "MEDIUM" : "HIGH";
    if (type === "P") return v < 30 ? "LOW" : v < 60 ? "MEDIUM" : "HIGH";
    return "";
  };
  const calculate = () => {
    let N = 50;
    let P = 30;
    let K = 80;
    let lime = "Not required";
    const kVal = Number(data.K);
    if (kVal < 100) K = 130;
    const yieldAdj = Number(data.yieldGoal);
    if (yieldAdj > 600) {
      N += 15;
      K += 20;
    }
    if (Number(data.pH) < 5.8) {
      lime = "Apply lime to reach pH ~6.0";
    }
    setResult({ N, P, K, lime });
    setExplanation(
      `Potassium is ${interpretLevel(data.K, "K")} and phosphorus is ${interpretLevel(data.P, "P")}. ` +
      `Higher yield goals increase nutrient demand, especially nitrogen and potassium. ` +
      `Low pH reduces nutrient availability, so liming may be needed.`
    );
  };
  return (
    <div style={{ fontFamily: "Arial", padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>
        LSU AgCenter 🌱 Sweetpotato Fertility AI Demo
      </h1>

      <div style={{ marginBottom: 20 }}>
        <strong>Try a scenario:</strong><br />
        <button onClick={() => loadScenario("low")} style={{ marginRight: 10 }}>Low fertility</button>
        <button onClick={() => loadScenario("high")} style={{ marginRight: 10 }}>High fertility</button>
        <button onClick={() => loadScenario("intensive")}>High yield</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input placeholder="Soil Test P" name="P" value={data.P} onChange={handleChange} /><br /><br />
        <input placeholder="Soil Test K" name="K" value={data.K} onChange={handleChange} /><br /><br />
        <input placeholder="Soil pH" name="pH" value={data.pH} onChange={handleChange} /><br /><br />
        <input placeholder="Yield Goal (bu/ac)" name="yieldGoal" value={data.yieldGoal} onChange={handleChange} /><br /><br />
        <button onClick={calculate}>Get Recommendation</button>
      </div>

      {result && (
        <div style={{ border: "1px solid #ccc", padding: 15 }}>
          <h2>Recommendation</h2>
          <p>🌱 Nitrogen: {result.N} lbs/acre</p>
          <p>🌿 Phosphorus: {result.P} lbs P2O5</p>
          <p>🍠 Potassium: {result.K} lbs K2O</p>
          <p>🪨 Lime: {result.lime}</p>

          <h3>AI Explanation</h3>
          <p>{explanation}</p>

          <p style={{ color: "red" }}>
            ⚠️ Educational demo only. Consult LSU AgCenter recommendations for official guidance.
          </p>
        </div>
      )}
    </div>
  );
}
