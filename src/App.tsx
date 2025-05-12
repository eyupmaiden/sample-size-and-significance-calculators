import React, { useState, useEffect } from "react";

// Type definitions
interface Variant {
  name: string;
  visitors: number;
  conversions: number;
}

interface SignificanceResult {
  name: string;
  conversionRate: string;
  improvement: string;
  confident: string;
  pValue: string;
}

interface ZScoreLookup {
  [key: number]: number;
}

const App = () => {
  // Journey Further brand colours
  const colors = {
    indigo: "#2B0573", // Primary indigo
    indigoTint1: "#6A4FA2", // Indigo tint 1
    indigoTint2: "#A99AD0", // Indigo tint 2
    pastelPurple: "#E8E4FF", // Pastel purple
    purple: "#6325F4", // Secondary purple
    teal: "#00A3B8", // Highlight teal
    white: "#FFFFFF", // White
  };

  const styles = {
    container: "p-6 bg-white rounded-xl shadow-md space-y-6",
    heading: "text-2xl font-bold text-gray-900",
    subheading: "text-sm text-gray-600 mt-1",
    label: "block text-sm font-medium text-gray-800 mb-1",
    input:
      "w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600",
    select:
      "w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600",
    resultContainer: "flex flex-col p-4 rounded-lg space-y-2",
    resultHeading: "text-lg font-medium text-white",
    resultSubheading: "text-sm text-white mt-1 opacity-90",
    resultValue: "text-3xl font-bold text-white",
    resultDivider: "border-b border-purple-300",
    footer: "text-xs text-gray-500",
  };

  // Sample Size calculator state
  const [baselineConversion, setBaselineConversion] = useState<number>(5);
  const [minimumDetectableEffect, setMinimumDetectableEffect] = useState<number>(20);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [statisticalPower, setStatisticalPower] = useState<number>(80);
  const [sampleSize, setSampleSize] = useState<number>(0);
  const [totalSampleSize, setTotalSampleSize] = useState<number>(0);
  const [variantCount, setVariantCount] = useState<number>(2);

  // Statistical Significance calculator state
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Control", visitors: 5000, conversions: 500 },
    { name: "Variant 1", visitors: 5000, conversions: 600 },
  ]);
  const [sigResults, setSigResults] = useState<SignificanceResult[]>([]);

  // Calculate sample size for A/B test
  const calculateSampleSize = (): void => {
    // Z-score lookup based on confidence level and power
    const zScoreAlpha: ZScoreLookup = {
      80: 1.28,
      85: 1.44,
      90: 1.65,
      95: 1.96,
      99: 2.58,
    };

    const zScoreBeta: ZScoreLookup = {
      80: 0.84,
      85: 1.04,
      90: 1.28,
      95: 1.64,
      99: 2.33,
    };

    const za = zScoreAlpha[confidenceLevel] || 1.96;
    const zb = zScoreBeta[statisticalPower] || 0.84;

    const p1 = baselineConversion / 100;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);

    // Sample size formula for A/B test
    const sd1 = Math.sqrt(2 * p1 * (1 - p1));
    const sd2 = Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
    const effect = Math.abs(p2 - p1);

    let sampleSizePerVariation = Math.ceil(
      Math.pow(za * sd1 + zb * sd2, 2) / Math.pow(effect, 2)
    );

    setSampleSize(sampleSizePerVariation);
    setTotalSampleSize(sampleSizePerVariation * variantCount);
  };

  // Calculate statistical significance
  const calculateSignificance = (): void => {
    const control = variants[0];
    const results: SignificanceResult[] = [];

    for (let i = 1; i < variants.length; i++) {
      const variant = variants[i];

      // Calculate conversion rates
      const controlRate = control.conversions / control.visitors;
      const variantRate = variant.conversions / variant.visitors;

      // Calculate standard error
      const controlSE = Math.sqrt(
        (controlRate * (1 - controlRate)) / control.visitors
      );
      const variantSE = Math.sqrt(
        (variantRate * (1 - variantRate)) / variant.visitors
      );
      const combinedSE = Math.sqrt(
        Math.pow(controlSE, 2) + Math.pow(variantSE, 2)
      );

      // Calculate Z-score
      const zScore = (variantRate - controlRate) / combinedSE;

      // Calculate p-value
      const pValue = (1 - normCDF(Math.abs(zScore))) * 2;

      // Determine if result is significant
      const isSignificant = pValue < 1 - confidenceLevel / 100;

      // Calculate relative improvement
      const relativeImprovement =
        ((variantRate - controlRate) / controlRate) * 100;

      results.push({
        name: variant.name,
        conversionRate: (variantRate * 100).toFixed(2) + "%",
        improvement: relativeImprovement.toFixed(2) + "%",
        confident: isSignificant ? "Yes" : "No",
        pValue: pValue.toFixed(4),
      });
    }

    setSigResults(results);
  };

  // Normal cumulative distribution function
  const normCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    let prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) prob = 1 - prob;
    return prob;
  };

  // Handle variant count change
  const handleVariantCountChange = (count: string | number): void => {
    const newCount = parseInt(count.toString());
    setVariantCount(newCount);

    // Update variants array
    if (newCount > variants.length) {
      // Add new variants
      const newVariants = [...variants];
      for (let i = variants.length; i < newCount; i++) {
        newVariants.push({
          name: `Variant ${i}`,
          visitors: 5000,
          conversions: 500,
        });
      }
      setVariants(newVariants);
    } else if (newCount < variants.length) {
      // Remove variants
      setVariants(variants.slice(0, newCount));
    }
  };

  // Handle variant data change
  const handleVariantChange = (index: number, field: string, value: number): void => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };
    setVariants(newVariants);
  };

  // Use media query for responsive layout
  useEffect(() => {
    const handleResize = (): void => {
      const container = document.getElementById("calculator-container");
      if (container) {
        if (window.innerWidth < 768) {
          container.style.flexDirection = "column";
        } else {
          container.style.flexDirection = "row";
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate whenever inputs change for sample size calculator
  useEffect(() => {
    calculateSampleSize();
  }, [
    baselineConversion,
    minimumDetectableEffect,
    confidenceLevel,
    statisticalPower,
    variantCount,
  ]);

  // Calculate whenever variants change for significance calculator
  useEffect(() => {
    calculateSignificance();
  }, [variants, confidenceLevel]);

  return (
    <div
      style={{
        backgroundColor: colors.indigo,
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <div className="max-w-6xl mx-auto mb-6 text-center">
        <img
          src="https://i.postimg.cc/d024KwgS/Journey-Further-Lockup-White-RGB-1.png"
          alt="Journey Further Logo"
          className="h-12 mx-auto mb-4"
        />
      </div>

      <div
        id="calculator-container"
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "1.5rem",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Sample Size Calculator */}
        <div
          className={styles.container}
          style={{ flex: 1, minWidth: "45%", fontFamily: "Inter, sans-serif" }}
        >
          <div className="text-center">
            <h1 className={styles.heading}>A/B/n Sample Size Calculator</h1>
            <p className={styles.subheading}>
              Determine visitors needed for reliable results
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={styles.label}>
                Baseline Conversion Rate (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="99.9"
                step="0.1"
                value={baselineConversion}
                onChange={(e) =>
                  setBaselineConversion(
                    Math.max(
                      0.1,
                      Math.min(99.9, parseFloat(e.target.value) || 0.1)
                    )
                  )
                }
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>
                Minimum Detectable Effect (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={minimumDetectableEffect}
                onChange={(e) =>
                  setMinimumDetectableEffect(
                    Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                  )
                }
                className={styles.input}
              />
              <div className="text-xs text-gray-500 mt-1">
                <p>
                  Current: {baselineConversion}% → Expected:{" "}
                  {(
                    baselineConversion *
                    (1 + minimumDetectableEffect / 100)
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>

            <div>
              <label className={styles.label}>
                Number of Variants (including control)
              </label>
              <input
                type="number"
                min="2"
                max="5"
                step="1"
                value={variantCount}
                onChange={(e) => handleVariantCountChange(e.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>
                Statistical Significance (%)
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className={styles.select}
              >
                <option value={80}>80%</option>
                <option value={85}>85%</option>
                <option value={90}>90%</option>
                <option value={95}>95% (recommended)</option>
                <option value={99}>99%</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>Statistical Power (%)</label>
              <div className="mt-2">
                <input
                  type="range"
                  min="80"
                  max="99"
                  step="5"
                  value={statisticalPower}
                  onChange={(e) =>
                    setStatisticalPower(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span
                    style={{
                      color: statisticalPower === 80 ? colors.teal : "",
                    }}
                  >
                    80%
                  </span>
                  <span
                    style={{
                      color: statisticalPower === 85 ? colors.teal : "",
                    }}
                  >
                    85%
                  </span>
                  <span
                    style={{
                      color: statisticalPower === 90 ? colors.teal : "",
                    }}
                  >
                    90%
                  </span>
                  <span
                    style={{
                      color: statisticalPower === 95 ? colors.teal : "",
                    }}
                  >
                    95%
                  </span>
                  <span
                    style={{
                      color: statisticalPower === 99 ? colors.teal : "",
                    }}
                  >
                    99%
                  </span>
                </div>
                <div className="text-center mt-1">
                  <span
                    className="text-xs font-medium"
                    style={{ color: colors.indigoTint1 }}
                  >
                    {statisticalPower === 80 && "(recommended)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={styles.resultContainer}
            style={{ backgroundColor: colors.indigo }}
          >
            <div
              className="text-center pb-2"
              style={{ borderBottom: `1px solid ${colors.indigoTint1}` }}
            >
              <h2 className={styles.resultHeading}>Required Sample Size</h2>
              <p className={styles.resultSubheading}>Per variation</p>
              <p className={styles.resultValue}>
                {sampleSize.toLocaleString()}
              </p>
            </div>

            <div className="text-center pt-2">
              <p className={styles.resultSubheading}>Total visitors needed</p>
              <p className={styles.resultValue}>
                {totalSampleSize.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistical Significance Calculator */}
        <div
          className={styles.container}
          style={{ flex: 1, minWidth: "45%", fontFamily: "Inter, sans-serif" }}
        >
          <div className="text-center">
            <h1 className={styles.heading}>A/B/n Significance Calculator</h1>
            <p className={styles.subheading}>
              Determine if your test results are statistically significant
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={styles.label}>
                Statistical Significance (%)
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className={styles.select}
              >
                <option value={80}>80%</option>
                <option value={85}>85%</option>
                <option value={90}>90%</option>
                <option value={95}>95% (recommended)</option>
                <option value={99}>99%</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>
                Number of Variants (including control)
              </label>
              <input
                type="number"
                min="2"
                max="5"
                step="1"
                value={variants.length}
                onChange={(e) => handleVariantCountChange(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className="space-y-4 mt-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-3 rounded-md"
                  style={{
                    backgroundColor:
                      index === 0 ? colors.pastelPurple : "white",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div className="font-medium mb-2">
                    {index === 0 ? "Control" : `Variant ${index}`}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600">
                        Visitors
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={variant.visitors}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "visitors",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        Conversions
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={variant.visitors}
                        value={variant.conversions}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "conversions",
                            Math.min(
                              variant.visitors,
                              parseInt(e.target.value) || 0
                            )
                          )
                        }
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-600">
                    Rate:{" "}
                    {((variant.conversions / variant.visitors) * 100).toFixed(
                      2
                    )}
                    %
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={styles.resultContainer}
            style={{ backgroundColor: colors.indigo }}
          >
            <h2 className={styles.resultHeading}>Results</h2>

            <div className="mt-2 space-y-2">
              {sigResults.map((result, index) => (
                <div
                  key={index}
                  className="rounded-md p-2"
                  style={{
                    backgroundColor:
                      result.confident === "Yes"
                        ? "rgba(0, 163, 184, 0.3)"
                        : "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">
                      {result.name}
                    </span>
                    <span className="text-white text-sm">
                      {result.conversionRate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-white opacity-90">
                      {result.improvement.startsWith("-")
                        ? "Decrease"
                        : "Increase"}
                      : {result.improvement}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor:
                          result.confident === "Yes" ? colors.teal : "white",
                        color: result.confident === "Yes" ? "white" : "black",
                      }}
                    >
                      {result.confident === "Yes"
                        ? "Significant"
                        : "Not Significant"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-white opacity-70">
          © {new Date().getFullYear()} Journey Further. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default App;