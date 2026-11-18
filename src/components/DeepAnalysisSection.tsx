import React, { useState } from 'react';
import { Hammer, Recycle } from 'lucide-react';
import type { ClassificationResult, SampleWasteItem } from '../types/waste';
import { SAMPLE_WASTE_ITEMS, getCategoryStyle } from '../data/wasteData';

interface DeepAnalysisSectionProps {
  result: ClassificationResult | null;
  onTestSample: (sample: SampleWasteItem) => void;
}

export const DeepAnalysisSection: React.FC<DeepAnalysisSectionProps> = ({
  result,
  onTestSample,
}) => {
  const [brokenOutcomeImg, setBrokenOutcomeImg] = useState(false);

  if (!result) {
    return (
      <section id="deep-analysis" className="py-14 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Deep Analysis &amp; Recycled Outcomes
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Scan an item to unlock material lifecycle &amp; DIY reuse ideas
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Analyze any photo or live camera frame above to reveal its exact material grade,
                landfill vs. recovery timeline, manufactured recycled goods, and home DIY projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTestSample(SAMPLE_WASTE_ITEMS[0])}
              className="px-4 py-2.5 text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Run Sample Deep Analysis
            </button>
          </div>

          <div id="recycled-outcomes" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  After Recycling · Visual Reference
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  What recovered waste becomes
                </h3>
              </div>
              <p id="diy-ideas" className="text-xs text-slate-500">
                Click any material below to analyze its full recycling &amp; DIY path
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {SAMPLE_WASTE_ITEMS.map((sample) => {
                const meta = getCategoryStyle(sample.category);
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onTestSample(sample)}
                    className="group text-left bg-white border border-slate-200 hover:border-emerald-600 rounded-xl overflow-hidden transition-colors cursor-pointer flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      {meta.recycledImageUrl ? (
                        <img
                          src={meta.recycledImageUrl}
                          alt={meta.recycledImageAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Recycle className="w-8 h-8 text-emerald-700" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className={`text-xs font-semibold ${meta.accentText}`}>
                          Recycled {sample.category}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {meta.recycledImageCaption}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const visualMeta = getCategoryStyle(result.category);

  return (
    <div className="bg-[#F8FAFC]">
      {/* Section 1: Deep Material & Ecological Telemetry */}
      <section id="deep-analysis" className="py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-slate-500 mb-1.5">Deep Material Analysis</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Material composition, lifecycle impact &amp; confidence
            </h2>
          </div>

          {/* 4-Column Tabular Telemetry Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
            <div className="p-5">
              <p className="text-xs text-slate-500">Material Composition</p>
              <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
                {result.materialGrade}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Landfill Persistence</p>
              <p className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-slate-900">
                {result.landfillDecompTime}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Recovery Turnaround</p>
              <p className="mt-1.5 font-mono tabular-nums text-lg font-semibold text-emerald-700">
                {result.recoveryTurnaround}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Resource &amp; Energy Savings</p>
              <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
                {result.energySavingsNote}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Environmental Impact</p>
                <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">
                  {result.environmentalImpact}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500">Contamination Prevention</p>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  {result.contaminationTip}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-medium text-slate-500 mb-4">
                5-Class Model Probability Distribution
              </p>
              <div className="space-y-3">
                {result.categoryScores.map((item) => {
                  const style = getCategoryStyle(item.category);
                  const isTop = item.category === result.category;
                  return (
                    <div key={item.category} className="grid grid-cols-12 items-center gap-3">
                      <span
                        className={`col-span-3 text-xs ${
                          isTop ? 'font-semibold text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {item.category}
                      </span>
                      <div className="col-span-7 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isTop ? style.barColor : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                        />
                      </div>
                      <span className="col-span-2 text-right font-mono tabular-nums text-xs text-slate-700">
                        {item.score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What We Make After Recycling (With Studio Visuals) */}
      <section id="recycled-outcomes" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              Post-Recycling Outcomes &amp; Uses
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              What this {result.category.toLowerCase()} item becomes after recycling
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Visual Product Showcase */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  {visualMeta.recycledImageUrl && !brokenOutcomeImg ? (
                    <img
                      src={visualMeta.recycledImageUrl}
                      alt={visualMeta.recycledImageAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenOutcomeImg(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                      <Recycle className="w-10 h-10 text-emerald-700 mb-3" aria-hidden="true" />
                      <p className="font-display text-base font-semibold text-slate-900">
                        {result.category} Recovery Stream
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white border-t border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {visualMeta.recycledImageCaption}
                  </p>
                </div>
              </div>
            </div>

            {/* Manufactured Products, Human Uses & Recovery Process */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Products Manufactured From Recycled {result.category}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.recycledProducts.map((product, idx) => (
                      <div
                        key={product}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-baseline gap-2.5"
                      >
                        <span className="font-mono tabular-nums text-xs font-medium text-emerald-700 shrink-0">
                          0{idx + 1}.
                        </span>
                        <span className="text-sm font-medium text-slate-900">{product}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    How People &amp; Industries Use These Products
                  </p>
                  <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">
                    {result.realWorldUses}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    How It Gets Transformed (Recovery Process)
                  </p>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                    {result.circularProcessNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: DIY & At-Home Upcycling Ideas */}
      {result.diyIdeas && result.diyIdeas.length > 0 && (
        <section id="diy-ideas" className="py-14 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                DIY &amp; At-Home Reuse Ideas
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                Useful things you can make yourself before throwing it away
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Practical reuse projects tailored directly to the {result.itemDetected.toLowerCase()}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.diyIdeas.map((idea, index) => (
                <div
                  key={idea.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-mono text-emerald-700 font-medium">
                        Idea 0{index + 1}
                      </span>
                      <span>{idea.effort}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Hammer className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>{idea.title}</span>
                    </h3>
                    <p className="mt-2.5 text-sm font-medium text-slate-800 leading-relaxed">
                      {idea.whatYouMake}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">How to Make It</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{idea.howToMake}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
