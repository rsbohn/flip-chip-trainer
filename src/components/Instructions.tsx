type InstructionsProps = {
  maxModules: number;
};

export const Instructions = ({ maxModules }: InstructionsProps) => {
  const lastSlot = maxModules + 1;
  return (
    <div className="mt-6 p-4 bg-[#e6d5b5] rounded border border-[#8b7a5e] max-w-2xl">
      <div className="font-bold mb-2 text-[#6e5e45] text-sm tracking-wide">INSTRUCTIONS</div>
      <div className="text-xs text-[#7a6b52] space-y-1 font-mono">
        <div>
          • Click "+ Add M113 Card" or "+ Add M202 Card" in Slots 2–{lastSlot} to insert modules
        </div>
        <div>• The backplane automatically chains clocks across installed modules</div>
        <div>• Turn POWER ON, then RUN to start the counter</div>
        <div>• Select clock rate: 1/4 Hz (slow), 2 Hz (medium), or 10 Hz (fast)</div>
      </div>
      <div className="mt-3 border-t border-[#9b8766] pt-3">
        <div className="font-bold mb-2 text-[#6e5e45] text-sm tracking-wide">BACKPLANE ROUTING</div>
        <div className="text-xs text-[#7a6b52] space-y-1 font-mono">
          <div>• CLK → S2:CLK1</div>
          <div>• Each module: Q1 → CLK2 (same slot)</div>
          <div>
            • Chain: Q2 → next slot CLK1 (S2→S3→S4→S5→S{lastSlot})
          </div>
          <div>• Rails: GND, +10 V, -15 V to each slot (assumed)</div>
        </div>
      </div>
    </div>
  );
};
