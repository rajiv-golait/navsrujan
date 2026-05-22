"use client";

import { useState } from "react";
import { useEducationContext } from "@/lib/hooks/useEducation";
import { useDegreeProjection, useSemesterForecast, usePeerComparison, useFundingGapAnalysis } from "@/lib/hooks/usePlanning";

export default function PlanningPage() {
  const { data: context } = useEducationContext();
  const currentSemester = context?.current_semester ?? 1;

  const degreeProj = useDegreeProjection();
  const fundingGap = useFundingGapAnalysis();
  const { data: forecast, isLoading: forecastLoading } = useSemesterForecast(currentSemester);
  const { data: peer, isLoading: peerLoading } = usePeerComparison();

  const [projData, setProjData] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);

  const handleGenerateProjection = async () => {
    try {
      const dynamicPlanName = `${context?.education_type ?? "Degree"} Financial Plan`;
      const res = await degreeProj.mutateAsync({ plan_name: dynamicPlanName });
      setProjData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalculateGap = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fundingGap.mutateAsync({
        available_funds: Number(formData.get("available_funds")),
        monthly_income: Number(formData.get("monthly_income")),
      });
      setGapData(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--stitch-on-surface)]">Long-Term Planning</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Degree Projection */}
        <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Degree Cost Projection</h2>
          {!projData ? (
            <div className="text-center py-6">
              <p className="text-[var(--stitch-on-surface-variant)] mb-4">Generate a full projection of your degree costs based on your current burn rate and education template.</p>
              <button onClick={handleGenerateProjection} disabled={degreeProj.isPending} className="px-4 py-2 bg-[var(--stitch-primary)] text-white rounded-lg font-medium">
                {degreeProj.isPending ? "Calculating..." : "Generate Projection"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                <p className="text-sm text-[var(--stitch-on-surface-variant)]">Total Estimated Cost</p>
                <p className="text-2xl font-bold text-[var(--stitch-primary)]">₹{projData.total_estimated_cost.toLocaleString("en-IN")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                  <p className="text-sm text-[var(--stitch-on-surface-variant)]">Academic Cost</p>
                  <p className="text-lg font-bold">₹{projData.total_academic_cost.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                  <p className="text-sm text-[var(--stitch-on-surface-variant)]">Personal Cost</p>
                  <p className="text-lg font-bold">₹{projData.total_personal_cost.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Funding Gap */}
        <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Funding Gap Analysis</h2>
          {!projData ? (
            <p className="text-[var(--stitch-on-surface-variant)] text-center py-6">Generate a degree projection first.</p>
          ) : !gapData ? (
            <form onSubmit={handleCalculateGap} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Available Funds (₹)</label>
                <input name="available_funds" type="number" required className="w-full mt-1 p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]" />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Monthly Income/Allowance (₹)</label>
                <input name="monthly_income" type="number" required className="w-full mt-1 p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)]" />
              </div>
              <button type="submit" disabled={fundingGap.isPending} className="w-full py-2 bg-[var(--stitch-primary)] text-white rounded-lg font-medium">
                {fundingGap.isPending ? "Analyzing..." : "Analyze Gap"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${gapData.gap_status === "deficit" ? "bg-red-50 border-red-200 text-red-900" : "bg-green-50 border-green-200 text-green-900"}`}>
                <p className="text-sm font-medium">Funding {gapData.gap_status === "deficit" ? "Gap (Deficit)" : "Surplus"}</p>
                <p className="text-2xl font-bold">₹{gapData.funding_gap.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--stitch-on-surface-variant)]">Total Needed:</span>
                <span className="font-medium">₹{gapData.total_estimated_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--stitch-on-surface-variant)]">Total Available:</span>
                <span className="font-medium">₹{gapData.total_available.toLocaleString("en-IN")}</span>
              </div>
              <button onClick={() => setGapData(null)} className="text-sm text-[var(--stitch-primary)] hover:underline mt-2">Recalculate</button>
            </div>
          )}
        </div>

        {/* Semester Forecast */}
        <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Semester {currentSemester} Academic Forecast</h2>
          {forecastLoading ? <p>Loading...</p> : (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)] flex justify-between items-center">
                <span className="font-medium">Total Expected</span>
                <span className="text-xl font-bold text-[var(--stitch-primary)]">₹{forecast?.total_forecast?.toLocaleString("en-IN") ?? 0}</span>
              </div>
              <div className="space-y-2">
                {forecast?.categories && Object.entries(forecast.categories).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-[var(--stitch-on-surface-variant)]">{cat}</span>
                    <span className="font-medium">₹{(amt as number).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Peer Comparison */}
        <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Peer Comparison</h2>
          {peerLoading ? <p>Loading...</p> : (
            <div className="space-y-6">
              <p className="text-sm text-[var(--stitch-on-surface-variant)]">
                Comparing against other <strong>{peer?.education_type}</strong> students in <strong>{peer?.location_type}</strong> areas (Semester {peer?.semester_number}).
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>You</span>
                    <span className="font-bold">₹{peer?.user_total?.toLocaleString("en-IN") ?? 0}</span>
                  </div>
                  <div className="w-full bg-[var(--stitch-outline)] rounded-full h-2">
                    <div
                      className="bg-[var(--stitch-primary)] h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((peer?.user_total ?? 0) /
                            Math.max(peer?.user_total ?? 0, peer?.peer_average ?? 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Peer Average</span>
                    <span className="font-bold">₹{peer?.peer_average?.toLocaleString("en-IN") ?? 0}</span>
                  </div>
                  <div className="w-full bg-[var(--stitch-outline)] rounded-full h-2">
                    <div
                      className="bg-[var(--stitch-secondary)] h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((peer?.peer_average ?? 0) /
                            Math.max(peer?.user_total ?? 1, peer?.peer_average ?? 0)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)] text-sm text-center">
                You are spending more than <strong>{peer?.percentile}%</strong> of your peers.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
