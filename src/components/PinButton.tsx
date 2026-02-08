type PinButtonProps = {
  label: string;
  isSelected: boolean;
  isOutput: boolean;
  lit: boolean;
  isClock: boolean;
  onClick?: () => void;
};

export const PinButton = ({
  label,
  isSelected,
  isOutput,
  lit,
  isClock,
  onClick,
}: PinButtonProps) => {
  const className = `text-[10px] px-2 py-1 rounded border font-mono ${
    isSelected
      ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
      : isClock
        ? lit
          ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] shadow-[0_0_8px_rgba(199,134,43,0.6)]'
          : 'bg-[#f2e7d3] border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#3b3325]'
        : lit
          ? 'bg-[#b14a2b] border-[#9b3c24] text-[#f7efe2] shadow-[0_0_8px_rgba(177,74,43,0.6)]'
          : isOutput
            ? 'bg-[#f2e7d3] border-[#8b7a5e] text-[#3b3325]'
            : 'bg-[#f2e7d3] border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#3b3325]'
  }`;

  return (
    <button onClick={onClick} disabled={isOutput} className={className}>
      {label}
    </button>
  );
};
