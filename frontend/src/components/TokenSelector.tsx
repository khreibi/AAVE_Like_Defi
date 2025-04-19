type Props = {
    selected: string;
    onSelect: (symbol: string) => void;
  };

  export default function TokenSelector({ selected, onSelect }: Props) {
    const tokens = ["DAI", "USDC"];
  
    return (
      <div className="flex gap-4">
        {tokens.map((token) => (
          <button
            key={token}
            className={`px-4 py-2 border rounded ${
              selected === token ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
            }`}
            onClick={() => onSelect(token)}
          >
            {token}
          </button>
        ))}
      </div>
    );
  }