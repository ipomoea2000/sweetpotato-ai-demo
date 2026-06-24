import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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
      `Based on your inputs: Potassium is ${interpretLevel(data.K, "K")}, phosphorus is ${interpretLevel(data.P, "P")}. ` +
      `Higher yield goals increase nutrient demand, especially nitrogen and potassium. ` +
      `pH influences nutrient availability, so liming may be required if below optimal range.`
    );
  };


  return (
    <div className="p-6 grid gap-6 max-w-2xl mx-auto">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-center">
        LSU AgCenter Extension Demo 🌱 Sweetpotato Fertility AI
      </motion.h1>

      <Card>
        <CardContent className="grid gap-3 p-4">
          <p className="font-semibold">Try a scenario:</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => loadScenario("low")}>Low fertility</Button>
            <Button onClick={() => loadScenario("high")}>High fertility</Button>
            <Button onClick={() => loadScenario("intensive")}>High yield</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4">
          <Input placeholder="Soil Test P" name="P" value={data.P} onChange={handleChange} />
          <Input placeholder="Soil Test K" name="K" value={data.K} onChange={handleChange} />
          <Input placeholder="Soil pH" name="pH" value={data.pH} onChange={handleChange} />
          <Input placeholder="Yield Goal (bu/ac)" name="yieldGoal" value={data.yieldGoal} onChange={handleChange} />
          <Button onClick={calculate}>Get Recommendation</Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="text-xl font-semibold">Recommendation</h2>
              <p>🌱 Nitrogen: {result.N} lbs/acre</p>
              <p>🌿 Phosphorus: {result.P} lbs P2O5</p>
              <p>🍠 Potassium: {result.K} lbs K2O</p>
              <p>🪨 Lime: {result.lime}</p>

              <div>
                <h3 className="font-semibold">Nutrient Visual</h3>
                <div className="space-y-1">
                  <div>N: <div style={{ width: result.N }} className="bg-green-400 h-3" /></div>
                  <div>K: <div style={{ width: result.K }} className="bg-yellow-400 h-3" /></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">AI Explanation</h3>
                <p className="text-sm">{explanation}</p>
              </div>

              <p className="text-sm text-red-600 font-medium">
                ⚠️ Educational demo only. Consult LSU AgCenter recommendations for official guidance.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
