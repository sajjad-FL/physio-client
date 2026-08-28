import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, HeartPulse, Home, Shield, Sparkles } from 'lucide-react'
import { BACK_BODY_MAP_SPOTS, FRONT_BODY_MAP_SPOTS } from '../../constants/bodyMapSpots'
import {
  getClinicalGuideDesc,
  getClinicalGuideTitle,
  getPainBgColor,
  getPainColor,
  getPainEmoji,
  getPainLabel,
} from '../../utils/painScale'

const SPOT_ICONS = {
  sparkles: Sparkles,
  activity: Activity,
  heartPulse: HeartPulse,
  home: Home,
}

/**
 * Interactive anatomical body map with pain scale and book CTA.
 * Used on landing page and patient dashboard.
 */
export default function PainBodyMapPanel({ bookCtaLabel = (issue) => `Book for ${issue}` }) {
  const [bodyViewSide, setBodyViewSide] = useState('front')
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [selectedPainScale, setSelectedPainScale] = useState(5)

  const spots = bodyViewSide === 'front' ? FRONT_BODY_MAP_SPOTS : BACK_BODY_MAP_SPOTS
  const SpotIcon = selectedSpot ? SPOT_ICONS[selectedSpot.icon] || Activity : Activity

  function handleSpotSelect(spot) {
    setSelectedSpot(spot)
    setSelectedPainScale(5)
  }

  function resetSide(side) {
    setBodyViewSide(side)
    setSelectedSpot(null)
  }

  return (
    <>
      <style>{`
        @keyframes painMapScanSweep {
          0% { transform: translateY(-10px); }
          50% { transform: translateY(240px); }
          100% { transform: translateY(-10px); }
        }
        .pain-map-scan-line {
          animation: painMapScanSweep 6s infinite linear;
        }
      `}</style>

      <div className="grid grid-cols-1 items-stretch gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-12 lg:gap-8">
        {/* Silhouette */}
        <div className="relative flex h-[260px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:h-[320px] md:h-[360px] lg:col-span-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border-t border-l border-slate-400" />
            ))}
          </div>

          <div className="pain-map-scan-line pointer-events-none absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-80" />

          <div className="relative h-[200px] w-[120px] origin-center scale-90 sm:h-[230px] sm:w-[140px] sm:scale-100">
            <div className="absolute top-0 left-[57px] h-[26px] w-[26px] rounded-full border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[26px] left-[67px] h-[12px] w-[6px] border-x-[1.5px] border-t-0 border-b-0 border-slate-300 bg-white" />
            <div className="absolute top-[36px] left-[32px] h-[12px] w-[76px] rounded border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[46px] left-[42px] h-[72px] w-[56px] rounded-[10px] border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[46px] left-[20px] h-[60px] w-[10px] rounded-full border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[46px] left-[110px] h-[60px] w-[10px] rounded-full border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[116px] left-[44px] h-[16px] w-[52px] rounded border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[130px] left-[48px] h-[86px] w-[15px] rounded-full border-[1.5px] border-slate-300 bg-white" />
            <div className="absolute top-[130px] left-[77px] h-[86px] w-[15px] rounded-full border-[1.5px] border-slate-300 bg-white" />
            {bodyViewSide === 'back' && (
              <div className="absolute top-[50px] left-[69px] h-[64px] w-[2px] bg-slate-200" />
            )}

            {spots.map((spot) => {
              const active = selectedSpot?.id === spot.id
              const borderColorVal = active ? getPainColor(selectedPainScale) : '#0d6b6b'
              const bgColorVal = active ? getPainBgColor(selectedPainScale) : 'rgba(13, 107, 107, 0.15)'
              const innerBgColorVal = active ? getPainColor(selectedPainScale) : '#0d6b6b'

              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleSpotSelect(spot)}
                  style={{ top: spot.top, left: spot.left }}
                  className={`absolute z-10 -mt-3 -ml-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-all duration-300 focus:outline-none sm:-mt-[10px] sm:-ml-[10px] sm:h-5 sm:w-5 ${
                    active ? 'scale-115 shadow-md' : 'hover:scale-105'
                  }`}
                  aria-label={spot.name}
                >
                  <div
                    style={{ borderColor: borderColorVal, backgroundColor: bgColorVal }}
                    className="flex h-full w-full items-center justify-center rounded-full border-[1.5px] transition-all duration-300"
                  >
                    <div
                      style={{ backgroundColor: innerBgColorVal }}
                      className="h-[6px] w-[6px] rounded-full transition-all duration-300"
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="relative z-20 mt-6 flex shrink-0 rounded-xl bg-slate-200/60 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => resetSide('front')}
              className={`cursor-pointer rounded-lg px-5 py-1.5 text-xs font-bold transition-all ${
                bodyViewSide === 'front' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              onClick={() => resetSide('back')}
              className={`cursor-pointer rounded-lg px-5 py-1.5 text-xs font-bold transition-all ${
                bodyViewSide === 'back' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Back View
            </button>
          </div>
        </div>

        {/* Details panel */}
        <div className="flex flex-col justify-center lg:col-span-7">
          {selectedSpot ? (
            <div className="space-y-6 rounded-2xl border border-teal-100 bg-teal-50/10 p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100/50 bg-white text-teal-700 shadow-sm">
                  <SpotIcon size={18} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedSpot.name}</h4>
                  <p className="text-xs font-semibold text-slate-500">{selectedSpot.desc}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pain Intensity Scale</h5>
                    <p className="text-[11px] font-semibold text-slate-400">Select level 1 (mild) to 10 (extreme)</p>
                  </div>
                  <div
                    style={{
                      borderColor: `${getPainColor(selectedPainScale)}40`,
                      backgroundColor: getPainBgColor(selectedPainScale),
                    }}
                    className="flex items-center gap-2 rounded-xl border px-3 py-1 shadow-sm transition-all duration-300"
                  >
                    <span className="text-xl">{getPainEmoji(selectedPainScale)}</span>
                    <div>
                      <p className="text-[10px] font-bold leading-none text-slate-500">Intensity</p>
                      <p
                        style={{ color: getPainColor(selectedPainScale) }}
                        className="mt-0.5 text-xs font-extrabold leading-none"
                      >
                        {selectedPainScale} - {getPainLabel(selectedPainScale)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-2 sm:grid-cols-10">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = selectedPainScale === num
                    const activeColor = getPainColor(num)
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedPainScale(num)}
                        style={
                          isSelected
                            ? {
                                backgroundColor: activeColor,
                                borderColor: activeColor,
                                boxShadow: `0 4px 6px ${activeColor}30`,
                              }
                            : {}
                        }
                        className={`h-9 cursor-pointer rounded-lg border text-xs font-bold transition-all duration-200 ${
                          isSelected
                            ? 'scale-105 text-white shadow'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
                <div className="flex justify-between px-1 pt-1 text-[10px] font-bold text-slate-400">
                  <span>MILD</span>
                  <span>MODERATE</span>
                  <span>SEVERE</span>
                  <span>EXTREME</span>
                </div>
              </div>

              <div
                style={{ backgroundColor: getPainBgColor(selectedPainScale) }}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 shadow-sm"
              >
                <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: getPainColor(selectedPainScale) }} />
                <div>
                  <h6
                    style={{ color: getPainColor(selectedPainScale) }}
                    className="text-xs font-extrabold uppercase tracking-wider"
                  >
                    Rehab Guide: {getClinicalGuideTitle(selectedPainScale)}
                  </h6>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    {getClinicalGuideDesc(selectedPainScale)}
                  </p>
                </div>
              </div>

              <Link
                to="/book"
                state={{ selectedIssue: selectedSpot.issue, painRating: selectedPainScale }}
                style={{ backgroundColor: getPainColor(selectedPainScale) }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {bookCtaLabel(selectedSpot.issue)}
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Activity size={20} className="animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Select body joint coordinates</h4>
              <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                Tap a pulsing hotspot on the silhouette to view pain metrics and continue to booking.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
