type JkToggleProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export const JkToggle = ({ label, active, onClick }: JkToggleProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-[10px] px-2 py-1 rounded border font-mono ${
        active
          ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
          : 'bg-[#f2e7d3] border-[#8b7a5e] text-[#6e5e45]'
      }`}
    >
      {label}
    </button>
  );
};
