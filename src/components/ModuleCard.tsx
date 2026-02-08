import { MAX_INDICATORS_PER_MODULE, getJkConfig } from '../sim/flipChip';
import type { Card, CardState, JkConfig, SelectedPin, Slot } from '../types';
import { JkToggle } from './JkToggle';
import { PinButton } from './PinButton';
import { getClk1High } from '../sim/backplane';

type ModuleCardProps = {
  card: Card | null;
  slotIndex: number;
  maxModules: number;
  slots: Slot[];
  cardStates: CardState[];
  powerOn: boolean;
  clockTick: number;
  hoveredBit: number | null;
  selectedPin: SelectedPin | null;
  onRemove: (slotIndex: number) => void;
  onPinClick: (slotIndex: number, pinIndex: number) => void;
  onAddCard: (slotIndex: number, type: Card['type']) => void;
  onToggleJk: (slotIndex: number, key: keyof JkConfig) => void;
};

export const ModuleCard = ({
  card,
  slotIndex,
  maxModules,
  slots,
  cardStates,
  powerOn,
  clockTick,
  hoveredBit,
  selectedPin,
  onRemove,
  onPinClick,
  onAddCard,
  onToggleJk,
}: ModuleCardProps) => {
  if (!card) {
    return (
      <div className="grid gap-2 h-full">
        {(['M113', 'M202'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onAddCard(slotIndex, type)}
            className="border-2 border-dashed border-[#9b8766] rounded p-3 hover:border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#7a6b52] hover:text-[#3b3325] text-xs"
          >
            + Add {type} Card
          </button>
        ))}
      </div>
    );
  }

  const isHovered =
    hoveredBit !== null &&
    Math.floor(hoveredBit / MAX_INDICATORS_PER_MODULE) + 1 === slotIndex &&
    (card.type === 'M202'
      ? hoveredBit % MAX_INDICATORS_PER_MODULE < 3
      : hoveredBit % MAX_INDICATORS_PER_MODULE < 2);

  return (
    <div
      className={`bg-gradient-to-b from-[#cbb790] to-[#bba278] border-2 rounded p-3 transition-all shadow-lg h-full ${
        isHovered ? 'border-[#c7862b] shadow-[0_0_14px_rgba(199,134,43,0.5)]' : 'border-[#8b7a5e]'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-bold text-[#3b3325] text-xs tracking-wide">{card.type}</div>
          <div className="text-[10px] text-[#6e5e45]">
            {card.type === 'M202' ? 'Triple J-K Flip-Flop' : 'Dual J-K Flip-Flop'}
          </div>
          {isHovered && (
            <div className="text-[10px] text-[#9b6a1f] mt-1 font-mono">
              ← Bit {hoveredBit} (FF{(hoveredBit! % MAX_INDICATORS_PER_MODULE) + 1})
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(slotIndex)}
          className="flex h-6 w-6 items-center justify-center rounded border border-[#7a2e1a] bg-[#a53d22] text-xs font-bold text-[#f7efe2] shadow-sm hover:bg-[#8f341d]"
          aria-label="Remove card"
        >
          X
        </button>
      </div>

      {(() => {
        const jk = getJkConfig(card);
        const flipFlopCount = card.type === 'M202' ? 3 : 2;
        const mainClockHigh = powerOn && clockTick % 2 === 1;
        const clk1High = getClk1High({
          slotIndex,
          mainClockHigh,
          slots,
          cardStates,
          maxModules,
        });
        const columns = Array.from({ length: flipFlopCount }, (_, index) => {
          const ffIndex = index + 1;
          const keyJ = `j${ffIndex}` as const;
          const keyK = `k${ffIndex}` as const;
          const clkLabel = `CLK${ffIndex}`;
          const qLabel = `Q${ffIndex}`;
          const pinIndex = 2 + index * 4;
          const clkHigh =
            ffIndex === 1
              ? clk1High
              : ffIndex === 2
                ? (cardStates[slotIndex]?.q1 ?? false)
                : (cardStates[slotIndex]?.q2 ?? false);
          const qHigh =
            ffIndex === 1
              ? cardStates[slotIndex]?.q1 ?? false
              : ffIndex === 2
                ? cardStates[slotIndex]?.q2 ?? false
                : cardStates[slotIndex]?.q3 ?? false;

          return (
            <div key={ffIndex} className="grid gap-2">
              <div className="grid gap-2">
                {[keyJ, keyK].map((key) => (
                  <JkToggle
                    key={key}
                    label={key.toUpperCase()}
                    active={jk[key]}
                    onClick={() => onToggleJk(slotIndex, key)}
                  />
                ))}
              </div>
              {[clkLabel, qLabel].map((pin, pinOffset) => {
                const isQ = pin.startsWith('Q');
                const wirePinIndex = pinIndex + pinOffset;
                const isSelected = selectedPin?.slot === slotIndex && selectedPin?.pin === wirePinIndex;
                const isClock = pin.startsWith('CLK');
                const clockLit = isClock && clkHigh;
                const qLit = isQ && qHigh;
                return (
                  <PinButton
                    key={pin}
                    label={pin}
                    isSelected={isSelected}
                    isOutput={isQ}
                    isClock={isClock}
                    lit={isQ ? qLit : clockLit}
                    onClick={isQ ? undefined : () => onPinClick(slotIndex, wirePinIndex)}
                  />
                );
              })}
            </div>
          );
        });

        const gridCols = flipFlopCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
        return <div className={`grid ${gridCols} gap-2`}>{columns}</div>;
      })()}

      <div className="mt-3 border border-[#9b8766] rounded bg-[#ead9b8] px-2 py-2">
        <div className="text-[9px] uppercase tracking-[0.2em] text-[#6e5e45] mb-1">Internal Wiring</div>
        {card.type === 'M202' ? (
          <svg
            viewBox="0 0 220 120"
            className="w-full h-28"
            aria-label="Clock into flip-flops, outputs to lamps"
          >
            <defs>
              <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#3b3325" />
              </marker>
            </defs>
            <rect x="6" y="47" width="36" height="26" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="24" y="64" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              CLK
            </text>

            <rect x="64" y="8" width="40" height="26" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
            <text x="84" y="25" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              FF1
            </text>
            <rect x="64" y="46" width="40" height="26" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
            <text x="84" y="63" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              FF2
            </text>
            <rect x="64" y="84" width="40" height="26" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
            <text x="84" y="101" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              FF3
            </text>

            <rect x="160" y="8" width="36" height="22" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="178" y="23" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              L0
            </text>
            <rect x="160" y="49" width="36" height="22" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="178" y="64" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              L1
            </text>
            <rect x="160" y="90" width="36" height="22" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="178" y="105" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              L2
            </text>

            <line x1="42" y1="60" x2="64" y2="21" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="21" x2="160" y2="19" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="21" x2="64" y2="59" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="59" x2="160" y2="60" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="59" x2="64" y2="97" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="97" x2="160" y2="101" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
          </svg>
        ) : (
          <svg viewBox="0 0 200 100" className="w-full h-24" aria-label="Clock into flip-flops, outputs to lamps">
            <defs>
              <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#3b3325" />
              </marker>
            </defs>
            <rect x="6" y="34" width="36" height="26" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="24" y="51" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              CLK
            </text>

            <rect x="64" y="12" width="40" height="30" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
            <text x="84" y="31" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              FF1
            </text>
            <rect x="64" y="58" width="40" height="30" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
            <text x="84" y="77" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              FF2
            </text>

            <rect x="140" y="12" width="36" height="24" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="158" y="28" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              L0
            </text>
            <rect x="140" y="64" width="36" height="24" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
            <text x="158" y="80" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
              L1
            </text>

            <line x1="42" y1="47" x2="64" y2="26" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="26" x2="140" y2="24" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="26" x2="64" y2="74" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
            <line x1="104" y1="74" x2="140" y2="76" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
          </svg>
        )}
      </div>
    </div>
  );
};
