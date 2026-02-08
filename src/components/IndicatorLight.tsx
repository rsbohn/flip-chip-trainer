type IndicatorLightProps = {
  active: boolean;
  connected: boolean;
};

export const IndicatorLight = ({ active, connected }: IndicatorLightProps) => {
  return (
    <div
      className={`w-3 h-3 rounded-full border ${
        active
          ? 'bg-[#b14a2b] border-[#9b3c24] shadow-[0_0_8px_rgba(177,74,43,0.6)]'
          : 'bg-[#c9b898] border-[#8b7a5e]'
      } ${!connected ? 'opacity-50' : ''}`}
    />
  );
};
