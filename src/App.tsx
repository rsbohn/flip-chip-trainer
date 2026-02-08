import { useFlipChipMachine } from './hooks/useFlipChipMachine';
import { useWireEditor } from './hooks/useWireEditor';
import { TopPanel, ClockCard } from './components/TopPanel';
import { ModuleCard } from './components/ModuleCard';
import { Instructions } from './components/Instructions';
import { Footer } from './components/Footer';
import { WiringCanvas } from './components/WiringCanvas';
import { MAX_MODULES, SLOT_COUNT } from './constants';

const FlipChipSimulator = () => {
  const maxModules = MAX_MODULES;
  const { state, actions } = useFlipChipMachine({ maxModules, slotCount: SLOT_COUNT });
  const {
    wires,
    selectedPin,
    hoveredBit,
    setHoveredBit,
    handlePinClick,
    removeWiresForSlot,
  } = useWireEditor(state.slots);

  const handleRemoveCard = (slotIndex) => {
    actions.removeCard(slotIndex);
    removeWiresForSlot(slotIndex);
  };


  return (
    <div className="flex flex-col min-h-screen bg-[#f2e7d3] text-[#3b3325] font-mono">
      <TopPanel
        indicators={state.indicators}
        powerOn={state.powerOn}
        running={state.running}
        clockTick={state.clockTick}
        clockRate={state.clockRate}
        slots={state.slots}
        maxModules={maxModules}
        onTogglePower={actions.togglePower}
        onToggleRun={actions.toggleRun}
        onStep={actions.step}
        onReset={actions.reset}
        onClockRateChange={actions.setClockRate}
        onHoverBit={setHoveredBit}
      />

      {/* Bottom Section */}
      <section className="flex-1 overflow-auto bg-gradient-to-br from-[#efe2c7] to-[#dfcca8] p-6 relative">
        <WiringCanvas wires={wires} />

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-6 relative z-10">
          {state.slots.map((card, slotIndex) => (
            <div
              key={slotIndex}
              className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-3 shadow-inner min-h-[280px] flex flex-col"
            >
              <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em]">
                Slot {slotIndex + 1}
              </div>
              <div className="mt-2 flex-1 flex flex-col gap-3">
                {slotIndex === 0 ? (
                  <ClockCard
                    powerOn={state.powerOn}
                    running={state.running}
                    clockRate={state.clockRate}
                    onClockRateChange={actions.setClockRate}
                    onToggleRun={actions.toggleRun}
                    onStep={actions.step}
                    onReset={actions.reset}
                  />
                ) : (
                  <ModuleCard
                    card={card}
                    slotIndex={slotIndex}
                    maxModules={maxModules}
                    slots={state.slots}
                    cardStates={state.cardStates}
                    powerOn={state.powerOn}
                    clockTick={state.clockTick}
                    hoveredBit={hoveredBit}
                    selectedPin={selectedPin}
                    onRemove={handleRemoveCard}
                    onPinClick={handlePinClick}
                    onAddCard={actions.addCard}
                    onToggleJk={actions.toggleJk}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <Instructions maxModules={maxModules} />
        <Footer />
      </section>
    </div>
  );
};

export default FlipChipSimulator;
