import React, { useState, useMemo } from 'react';
import { Flame, Zap, Thermometer, Wind, Sun, Battery, Plug, ArrowRight, TrendingDown, Leaf } from 'lucide-react';

// ===== CONSTANTS (NL realiteit) =====
const GAS_KWH_PER_M3 = 9.7;            // Calorische bovenwaarde aardgas (kerntabel)
const HR_EFFICIENCY = 0.97;            // HR-ketel rendement (kerntabel)
const GAS_CO2_PER_M3 = 1.788;          // kg CO2 per m³ aardgas
const ELEC_CO2_PER_KWH = 0.27;         // kg CO2 per kWh NL grid (2024, dalend)

// Warmtevraag kantoor/school per m² per jaar (kWh, alleen verwarming)
const HEAT_DEMAND = {
  'A++': 35, 'A': 50, 'B': 75, 'C': 100, 'D': 140, 'E': 170, 'F': 200, 'G': 230,
};

// Realistische SCOP per label (lucht/water, op basis van kerntabel)
const SCOP_BY_LABEL = {
  'A++': 4.5, 'A': 4.2, 'B': 3.8, 'C': 3.3, 'D': 2.8, 'E': 2.7, 'F': 2.4, 'G': 2.3,
};

const fmt = (n, d = 0) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const fmtEur = (n) => '€ ' + fmt(Math.round(n));
const fmtKwh = (n) => fmt(Math.round(n)) + ' kWh';

export default function GroenGebouwSalesTool() {
  const [gasPrice, setGasPrice] = useState(1.12);
  const [elecPrice, setElecPrice] = useState(0.135);
  const [label, setLabel] = useState('C');
  const [floorArea, setFloorArea] = useState(1000);

  const scop = SCOP_BY_LABEL[label];
  const heatDemand = HEAT_DEMAND[label];

  // €/kWh warmte
  const eurKwhGas = gasPrice / (GAS_KWH_PER_M3 * HR_EFFICIENCY);
  const eurKwhHP = elecPrice / scop;
  const eurDelta = ((eurKwhGas - eurKwhHP) / eurKwhGas) * 100;

  // Gebouw OPEX
  const annualHeat = floorArea * heatDemand;
  const gasConsumption = annualHeat / (GAS_KWH_PER_M3 * HR_EFFICIENCY); // m³/jaar
  const elecConsumption = annualHeat / scop; // kWh/jaar
  const gasOpex = gasConsumption * gasPrice;
  const hpOpex = elecConsumption * elecPrice;
  const savings = gasOpex - hpOpex;
  const savingsPct = (savings / gasOpex) * 100;
  const gasCO2 = gasConsumption * GAS_CO2_PER_M3;
  const hpCO2 = elecConsumption * ELEC_CO2_PER_KWH;
  const co2Savings = gasCO2 - hpCO2;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        :root {
          --bg: #F5F2EB;
          --bg-card: #FFFFFF;
          --ink: #0E1A14;
          --ink-soft: #4A5550;
          --rule: #D9D4C7;
          --green-deep: #0F3D2E;
          --green: #1F7A4D;
          --green-bright: #3DB76E;
          --green-pale: #B7E0C3;
          --gas: #B6411A;
          --gas-soft: #E89A7D;
          --accent: #C2410C;
        }
        .gg-root { background: var(--bg); color: var(--ink); font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .gg-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .gg-label { font-family: 'Bricolage Grotesque', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .gg-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .gg-card { background: var(--bg-card); border: 1px solid var(--rule); }
        .gg-input { background: transparent; border: none; border-bottom: 2px solid var(--ink); font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 500; color: var(--ink); padding: 0.25rem 0; outline: none; width: 100%; }
        .gg-input:focus { border-color: var(--green); }
        .gg-input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; background: var(--rule); border: none; padding: 0; cursor: pointer; }
        .gg-input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: var(--green-deep); border-radius: 50%; cursor: pointer; }
        .gg-input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; background: var(--green-deep); border-radius: 50%; cursor: pointer; border: none; }
        .gg-label-btn { padding: 0.5rem 0.75rem; border: 1px solid var(--rule); background: transparent; font-family: 'JetBrains Mono', monospace; font-weight: 500; cursor: pointer; transition: all 0.15s ease; color: var(--ink-soft); }
        .gg-label-btn:hover { border-color: var(--ink); }
        .gg-label-btn.active { background: var(--green-deep); color: white; border-color: var(--green-deep); }
        .gg-tick::before { content: ''; display: inline-block; width: 6px; height: 6px; background: var(--green); margin-right: 10px; transform: translateY(-2px); }
      `}</style>

      <div className="gg-root min-h-screen p-8 md:p-12">
        <div className="max-w-6xl mx-auto">

          {/* ===== HEADER ===== */}
          <header className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--rule)' }}>
            <div className="flex items-baseline gap-3 mb-2">
              <div style={{ width: 32, height: 4, background: 'var(--accent)' }}></div>
              <span className="gg-label text-xs" style={{ color: 'var(--ink-soft)' }}>GroenGebouw · Sales Enablement</span>
            </div>
            <h1 className="gg-display text-5xl md:text-6xl font-semibold leading-tight leading-none">
              Warmtepomp <em style={{ color: 'var(--green)' }}>vs.</em> Gasketel
            </h1>
            <p className="mt-3 text-base leading-7 max-w-2xl" style={{ color: 'var(--ink-soft)' }}>
              De business case van het draaien van een warmtepomp versus gasketel.
            </p>
          </header>

          {/* ===== HERO VISUAL: SIDE-BY-SIDE COMPARISON ===== */}
          <section className="mb-20">
            <div className="gg-label text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>01 · Het verschil in één plaatje</div>
            <div className="p-8 md:p-12" style={{ background: '#0E1A14' }}>
              <SideBySideDiagram />
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid #2A3530' }}>
                <p className="text-sm leading-relaxed max-w-3xl" style={{ color: '#C9D1CD' }}>
                  <strong style={{ color: 'white' }}>Beide systemen leveren dezelfde warmte.</strong> Bij de warmtepomp betaal je alleen voor de dunne donkergroene strook — groene elektriciteit. De rest komt gratis uit de omgeving. Daarom: 3-4× zo efficiënt op de energierekening.
                </p>
              </div>
            </div>
          </section>

          {/* ===== DASHBOARD: €/kWh warmte ===== */}
          <section className="mb-20">
            <div className="gg-label text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>02 · Dashboard — kosten per kWh warmte</div>
            <div className="gg-card p-8 md:p-12">

              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                <InputField
                  label="Gasprijs (all-in)"
                  unit="€/m³"
                  value={gasPrice}
                  min={0.5} max={3} step={0.01}
                  onChange={setGasPrice}
                  hint="Inclusief energiebelasting, ODE, netbeheer"
                />
                <InputField
                  label="Elektraprijs (all-in)"
                  unit="€/kWh"
                  value={elecPrice}
                  min={0.05} max={0.6} step={0.005}
                  onChange={setElecPrice}
                  hint="Zakelijk grootverbruik inclusief belastingen"
                />
                <div>
                  <div className="gg-label text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>Energielabel gebouw</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.keys(HEAT_DEMAND).map(l => (
                      <button key={l} onClick={() => setLabel(l)} className={`gg-label-btn ${label === l ? 'active' : ''}`}>{l}</button>
                    ))}
                  </div>
                  <div className="text-xs gg-mono" style={{ color: 'var(--ink-soft)' }}>
                    SCOP {fmt(scop, 1)} · {heatDemand} kWh/m²/jr
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OutputBar
                  title="Gasketel"
                  icon={<Flame size={20} />}
                  value={eurKwhGas}
                  unit="€ / kWh warmte"
                  color="var(--gas)"
                  bgColor="var(--gas-soft)"
                  formula={`${fmt(gasPrice, 2)} / (9,7 × 0,97)`}
                />
                <OutputBar
                  title="Warmtepomp"
                  icon={<Wind size={20} />}
                  value={eurKwhHP}
                  unit="€ / kWh warmte"
                  color="var(--green-deep)"
                  bgColor="var(--green-pale)"
                  formula={`${fmt(elecPrice, 2)} / SCOP ${fmt(scop, 1)}`}
                />
              </div>

              {/* So-what banner */}
              <div className="mt-6 p-6 flex items-center gap-4" style={{ background: eurDelta > 0 ? 'var(--green-deep)' : 'var(--gas)', color: 'white' }}>
                <TrendingDown size={24} />
                <div>
                  <div className="gg-label text-xs opacity-80">Verschil per kWh warmte</div>
                  <div className="gg-display text-3xl font-semibold">
                    {eurDelta > 0 ? `${fmt(eurDelta, 0)}% goedkoper` : `${fmt(Math.abs(eurDelta), 0)}% duurder`}
                    <span className="text-base leading-7 font-normal opacity-80 ml-2">met warmtepomp</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== BUILDING OPEX CALCULATOR ===== */}
          <section className="mb-20">
            <div className="gg-label text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>03 · Jaaropex per gebouw — kantoor of school</div>
            <div className="gg-card p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
                <div className="md:col-span-1">
                  <InputField
                    label="Vloeroppervlak"
                    unit="m²"
                    value={floorArea}
                    min={200} max={3000} step={50}
                    onChange={setFloorArea}
                    hint="Verwarmd vloeroppervlak (BVO) — MKB+ sweet spot 500-1.500 m²"
                  />
                  <div className="mt-6 p-4" style={{ background: 'var(--bg)', border: '1px solid var(--rule)' }}>
                    <div className="gg-label text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>Aannames uit dashboard</div>
                    <div className="text-sm gg-mono space-y-1">
                      <div>Label: <strong>{label}</strong></div>
                      <div>Warmtevraag: <strong>{heatDemand} kWh/m²/jr</strong></div>
                      <div>Jaarvraag: <strong>{fmt(annualHeat / 1000, 1)} MWh</strong></div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    title="Gasketel"
                    icon={<Flame size={18} />}
                    primaryLabel="Jaaropex"
                    primaryValue={fmtEur(gasOpex)}
                    rows={[
                      ['Gasverbruik', `${fmt(gasConsumption)} m³`],
                      ['CO₂-uitstoot', `${fmt(gasCO2 / 1000, 1)} ton`],
                    ]}
                    color="var(--gas)"
                  />
                  <ResultCard
                    title="Warmtepomp"
                    icon={<Wind size={18} />}
                    primaryLabel="Jaaropex"
                    primaryValue={fmtEur(hpOpex)}
                    rows={[
                      ['Elektraverbruik', `${fmt(elecConsumption)} kWh`],
                      ['CO₂-uitstoot', `${fmt(hpCO2 / 1000, 1)} ton`],
                    ]}
                    color="var(--green-deep)"
                  />
                </div>
              </div>

              {/* Bottom: savings summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--rule)' }}>
                <SavingsCell
                  label="Besparing per jaar"
                  value={fmtEur(savings)}
                  sub={`${fmt(savingsPct, 0)}% lagere energierekening`}
                  positive={savings > 0}
                />
                <SavingsCell
                  label="CO₂-reductie per jaar"
                  value={`${fmt(co2Savings / 1000, 1)} ton`}
                  sub={`${fmt((co2Savings / gasCO2) * 100, 0)}% minder uitstoot`}
                  positive={co2Savings > 0}
                />
                <SavingsCell
                  label="10-jaars cumulatief"
                  value={fmtEur(savings * 10)}
                  sub="excl. inflatie en prijsstijging gas"
                  positive={savings > 0}
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              <strong>Calibratie:</strong> warmtevraag-kentallen zijn indicatief voor kantoor/school in NL. Werkelijke vraag varieert sterk met gebruik, openingstijden, isolatie en ventilatiestrategie. Voor offerte: altijd een energiescan of meterdata gebruiken.
            </p>
          </section>

          {/* ===== FOOTER ===== */}
          <footer className="pt-6 text-xs" style={{ borderTop: '1px solid var(--rule)', color: 'var(--ink-soft)' }}>
            <div className="flex flex-wrap justify-between gap-4">
              <span>GroenGebouw · Interne sales tool · Cijfers indicatief, altijd valideren met gebouwgegevens.</span>
              <span className="gg-mono">v1.0 · 2026</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

// ============ SUBCOMPONENTS ============

function SideBySideDiagram() {
  return (
    <svg viewBox="0 0 940 250" className="w-full h-auto" style={{ maxHeight: 380 }}>
      {/* === WARMTEPOMP (left) === */}
      {/* Input — Omgevingswarmte (light green, top) */}
      <rect x="20" y="30" width="180" height="100" fill="#8FD8A1" />
      <text x="110" y="74" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="17" fontWeight="500" fill="#0E1A14">Omgevings-</text>
      <text x="110" y="94" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="17" fontWeight="500" fill="#0E1A14">warmte</text>

      {/* Input — Groene elektriciteit (dark green, bottom) */}
      <rect x="20" y="130" width="180" height="50" fill="#2E8055" />
      <text x="110" y="151" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="14" fontWeight="500" fill="white">Groene</text>
      <text x="110" y="169" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="14" fontWeight="500" fill="white">elektriciteit</text>

      {/* Output — Verlies (red chevron, top) — full width, aligned left with Warmte */}
      <path d="M 230 30 L 410 30 L 430 41 L 410 52 L 230 52 Z" fill="#E84545" />
      <text x="320" y="46" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="14" fontWeight="500" fill="white">Verlies</text>

      {/* Output — Warmte (bright green chevron) — height 128, total output stack = 150 */}
      <path d="M 230 52 L 410 52 L 430 116 L 410 180 L 230 180 Z" fill="#2DBA5C" />
      <text x="320" y="120" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="20" fontWeight="500" fill="white">Warmte</text>

      {/* === GASKETEL (right) === */}
      {/* Input — Gas (gray) */}
      <rect x="510" y="30" width="180" height="150" fill="#888888" />
      <text x="600" y="112" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="20" fontWeight="500" fill="white">Gas</text>

      {/* Output — Verlies (full width, aligned left with Warmte, slightly thicker than WP to hint at lower efficiency) */}
      <path d="M 720 30 L 900 30 L 920 44 L 900 58 L 720 58 Z" fill="#E84545" />
      <text x="810" y="48" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="14" fontWeight="500" fill="white">Verlies</text>

      {/* Output — Warmte (height 122, total output stack = 150) */}
      <path d="M 720 58 L 900 58 L 920 119 L 900 180 L 720 180 Z" fill="#2DBA5C" />
      <text x="810" y="122" textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize="20" fontWeight="500" fill="white">Warmte</text>

      {/* === BOTTOM LABELS === */}
      <text x="225" y="208" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="12" fontWeight="600" fill="#8FD8A1" letterSpacing="0.14em">WARMTEPOMP</text>
      <text x="225" y="232" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="12" fontWeight="500" fill="#8FD8A1" letterSpacing="0.14em" opacity="0.75">280%–450% EFFICIËNTIE</text>

      <text x="715" y="208" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="12" fontWeight="600" fill="#AAAAAA" letterSpacing="0.14em">GASKETEL</text>
      <text x="715" y="232" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="12" fontWeight="500" fill="#AAAAAA" letterSpacing="0.14em" opacity="0.75">85%–95% EFFICIËNTIE</text>
    </svg>
  );
}

function InputField({ label, unit, value, min, max, step, onChange, hint }) {
  return (
    <div>
      <div className="gg-label text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>{label}</div>
      <div className="flex items-baseline gap-2">
        <input
          type="number"
          className="gg-input"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{ maxWidth: 140 }}
        />
        <span className="text-sm gg-mono" style={{ color: 'var(--ink-soft)' }}>{unit}</span>
      </div>
      <input
        type="range"
        className="gg-input mt-3"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && <div className="text-xs mt-2" style={{ color: 'var(--ink-soft)' }}>{hint}</div>}
    </div>
  );
}

function OutputBar({ title, icon, value, unit, color, bgColor, formula }) {
  return (
    <div className="p-6" style={{ background: bgColor, borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        {icon}
        <span className="gg-label text-xs">{title}</span>
      </div>
      <div className="gg-display text-5xl font-semibold leading-none" style={{ color: 'var(--ink)' }}>
        € {fmt(value, 3)}
      </div>
      <div className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>{unit}</div>
      <div className="text-xs gg-mono mt-3 pt-3" style={{ color: 'var(--ink-soft)', borderTop: `1px dashed ${color}40` }}>
        = {formula}
      </div>
    </div>
  );
}

function ResultCard({ title, icon, primaryLabel, primaryValue, rows, color }) {
  return (
    <div className="p-6" style={{ background: 'var(--bg)', borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        {icon}
        <span className="gg-label text-xs">{title}</span>
      </div>
      <div className="gg-label text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>{primaryLabel}</div>
      <div className="gg-display text-4xl font-semibold leading-none mb-4" style={{ color: 'var(--ink)' }}>{primaryValue}</div>
      <div className="space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--rule)' }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span style={{ color: 'var(--ink-soft)' }}>{k}</span>
            <span className="gg-mono font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavingsCell({ label, value, sub, positive }) {
  return (
    <div className="p-6" style={{ borderRight: '1px solid var(--rule)' }}>
      <div className="gg-label text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>{label}</div>
      <div className="gg-display text-3xl font-semibold leading-tight" style={{ color: positive ? 'var(--green-deep)' : 'var(--gas)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>{sub}</div>
    </div>
  );
}

function RuleCard({ icon, title, rules }) {
  return (
    <div className="gg-card p-6">
      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--rule)', color: 'var(--green-deep)' }}>
        {icon}
        <h3 className="gg-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
      </div>
      <ol className="space-y-3">
        {rules.map((rule, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className="gg-mono text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--green)', minWidth: 18 }}>0{i + 1}</span>
            <span style={{ color: 'var(--ink)' }}>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}


