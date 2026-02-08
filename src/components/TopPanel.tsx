import { Play, Power, Square } from 'lucide-react';
import { CLOCK_RATES, INDICATOR_GROUP_SIZE } from '../constants';
import { MAX_INDICATORS_PER_MODULE } from '../sim/flipChip';
import { IndicatorLight } from './IndicatorLight';
import type { Slot } from '../types';

type TopPanelProps = {
  indicators: boolean[];
  powerOn: boolean;
  running: boolean;
  clockTick: number;
  clockRate: number;
  slots: Slot[];
  maxModules: number;
  onTogglePower: () => void;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onClockRateChange: (rate: number) => void;
  onHoverBit: (bit: number | null) => void;
};

export const TopPanel = ({
  indicators,
  powerOn,
  running,
  clockTick,
  clockRate,
  slots,
  maxModules,
  onTogglePower,
  onToggleRun,
  onStep,
  onReset,
  onClockRateChange,
  onHoverBit,
}: TopPanelProps) => {
  return (
    <section className="border-b-4 border-[#8b7a5e] bg-gradient-to-b from-[#ead9b8] via-[#dfcca8] to-[#d2bf9a] p-6 shadow-[0_10px_26px_rgba(60,45,20,0.25)]">
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-4 shadow-inner">
          <div className="text-[10px] font-bold tracking-[0.3em] text-[#6e5e45] mb-2 uppercase">
            BODGE INDUSTRIAL LTD
          </div>
          <div
            className="text-2xl font-bold tracking-wider text-[#3b3325]"
            style={{ fontFamily: 'serif', textShadow: '0 1px 0 rgba(255,255,255,0.35)' }}
          >
            Flip Chip Trainer
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(
              { length: Math.ceil(indicators.length / INDICATOR_GROUP_SIZE) },
              (_, groupIndex) => {
                const groupStart = indicators.length - 1 - groupIndex * INDICATOR_GROUP_SIZE;
                const groupBg = groupIndex % 2 === 0 ? 'bg-[#e7d5b2]' : 'bg-[#d8c5a1]';
                return (
                  <div
                    key={groupIndex}
                    className={`flex gap-2 rounded border border-[#9b8766] px-2 py-2 ${groupBg}`}
                  >
                    {Array.from({ length: INDICATOR_GROUP_SIZE }, (_, offset) => {
                      const bitIndex = groupStart - offset;
                      const bitState = indicators[bitIndex];
                      const slotIndex = Math.floor(bitIndex / MAX_INDICATORS_PER_MODULE) + 1;
                      const slotBitIndex = bitIndex % MAX_INDICATORS_PER_MODULE;
                      const slotCard = slots[slotIndex];
                      const slotSupportsBit =
                        slotCard && (slotCard.type === 'M202' ? slotBitIndex < 3 : slotBitIndex < 2);
                      const isConnected = slotIndex <= maxModules && slotSupportsBit;
                      return (
                        <div
                          key={bitIndex}
                          className="flex flex-col items-center gap-1"
                          onMouseEnter={() => (isConnected ? onHoverBit(bitIndex) : null)}
                          onMouseLeave={() => onHoverBit(null)}
                        >
                        <IndicatorLight active={powerOn && bitState} connected={isConnected} />
                          <span className="text-[10px] text-[#6e5e45] font-mono">
                            {slotIndex <= maxModules ? `S${slotIndex} B${slotBitIndex + 1}` : bitIndex}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-3 shadow-inner">
          <div className="text-[10px] font-bold tracking-[0.35em] text-[#6e5e45] mb-3 uppercase">
            Power / Run
          </div>
          <div className="flex flex-nowrap gap-2 overflow-x-auto">
            <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[120px]">
              <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Mains</div>
              <button
                onClick={onTogglePower}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
                  powerOn
                    ? 'bg-[#a53d22] hover:bg-[#8f341d] border border-[#7a2e1a] text-[#f7efe2]'
                    : 'bg-[#c8b695] hover:bg-[#b9a47f] border border-[#8b7a5e] text-[#3b3325]'
                }`}
              >
                <Power size={14} />
                {powerOn ? 'OFF' : 'ON'}
              </button>
            </div>
            <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[120px]">
              <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Clock</div>
              <div className="text-lg font-bold text-[#9b6a1f] font-mono">{clockTick}</div>
              <div className="mt-2 text-[10px] text-[#7a6b52] font-mono">
                {running ? 'RUNNING' : 'HALTED'}
              </div>
            </div>
            <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[180px]">
              <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Power</div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-4 h-4 rounded-full border ${
                      powerOn
                        ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.6)]'
                        : 'bg-[#c9b898] border-[#8b7a5e]'
                    }`}
                  />
                  <span className="text-[10px] text-[#6e5e45] font-mono">{powerOn ? 'LIVE' : 'OFF'}</span>
                  <span className="rounded border border-[#9b8766] px-1 text-[10px] text-[#7a6b52] font-mono">
                    AC OK
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full border ${
                      powerOn
                        ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                        : 'bg-[#c9b898] border-[#8b7a5e]'
                    }`}
                  />
                  <span className="text-[10px] text-[#6e5e45] font-mono">+10V</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full border ${
                      powerOn
                        ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                        : 'bg-[#c9b898] border-[#8b7a5e]'
                    }`}
                  />
                  <span className="text-[10px] text-[#6e5e45] font-mono">-15V</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full border ${
                      powerOn
                        ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                        : 'bg-[#c9b898] border-[#8b7a5e]'
                    }`}
                  />
                  <span className="text-[10px] text-[#6e5e45] font-mono">GND</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ClockCard = ({
  powerOn,
  running,
  clockRate,
  onClockRateChange,
  onToggleRun,
  onStep,
  onReset,
}: {
  powerOn: boolean;
  running: boolean;
  clockRate: number;
  onClockRateChange: (rate: number) => void;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
}) => {
  return (
    <div className="border-2 border-[#9b8766] rounded bg-[#ead9b8] p-3 h-full">
      <div className="text-[10px] font-bold tracking-[0.35em] text-[#6e5e45] mb-3 uppercase">
        Clock Card
      </div>
      <div className="grid gap-2">
        <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
          <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Rate</div>
          <div className="flex items-start gap-3">
            {CLOCK_RATES.map((rate) => (
              <label
                key={rate.value}
                className="flex flex-col items-center gap-1 cursor-pointer text-[#6e5e45] hover:text-[#3b3325]"
              >
                <input
                  type="radio"
                  name="clockRate"
                  value={rate.value}
                  checked={clockRate === rate.value}
                  onChange={(e) => onClockRateChange(parseFloat(e.target.value))}
                  className="h-3 w-3 cursor-pointer appearance-none rounded-full border border-[#8b7a5e] bg-[#f2e7d3] shadow-inner checked:border-[#7a5c2d] checked:bg-[#9b6a1f]"
                />
                <span className="text-[10px] font-mono">{rate.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
          <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Mode</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#6e5e45] font-mono">Auto</span>
            <div
              className={`w-3 h-3 rounded-full border ${
                running
                  ? 'bg-[#5e8a4c] border-[#4c733d] shadow-[0_0_8px_rgba(94,138,76,0.55)]'
                  : 'bg-[#c9b898] border-[#8b7a5e]'
              }`}
            />
          </div>
          <div className="mt-2 text-[10px] text-[#7a6b52] font-mono">
            {running ? 'RUNNING' : 'HALTED'}
          </div>
        </div>
        <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
          <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Run / Step</div>
          <button
            onClick={onToggleRun}
            disabled={!powerOn}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
              !powerOn
                ? 'bg-[#c8b695] border border-[#8b7a5e] cursor-not-allowed opacity-60 text-[#3b3325]'
                : running
                  ? 'bg-[#d08a2b] hover:bg-[#b67524] border border-[#8f5f1e] text-[#3b3325]'
                  : 'bg-[#c8b695] hover:bg-[#b9a47f] border border-[#8b7a5e] text-[#3b3325]'
            }`}
          >
            {running ? <Square size={14} /> : <Play size={14} />}
            {running ? 'HALT' : 'RUN'}
          </button>
          <button
            onClick={onStep}
            disabled={!powerOn || running}
            className={`mt-2 w-full rounded border px-2 py-2 text-[10px] font-bold tracking-wide ${
              !powerOn || running
                ? 'bg-[#c8b695] border-[#8b7a5e] cursor-not-allowed opacity-60 text-[#3b3325]'
                : 'bg-[#e6d5b5] border-[#8b7a5e] hover:bg-[#d8c5a1] text-[#3b3325]'
            }`}
          >
            STEP
          </button>
        </div>
        <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
          <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Reset</div>
          <button
            onClick={onReset}
            className="w-full rounded border border-[#8b7a5e] bg-[#c8b695] px-2 py-2 text-[10px] font-bold tracking-wide text-[#3b3325] hover:bg-[#b9a47f]"
          >
            CLEAR TICKS
          </button>
        </div>
      </div>
    </div>
  );
};
