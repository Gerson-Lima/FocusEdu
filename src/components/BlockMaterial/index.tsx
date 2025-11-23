import { useState, useEffect } from "react";

type BlockMaterialProps = {
  onClick: () => void;
  name: string;
  category: any;
  topics: string[];
};

export const BlockMaterial = ({ onClick, name, topics }: BlockMaterialProps) => {
  const [check, setCheck] = useState(false);

  const getKey = () => `concluido-${name}-${topics.join("|")}`;

  useEffect(() => {
    const stored = localStorage.getItem(getKey());
    if (stored) setCheck(JSON.parse(stored));
  }, [name, topics]);

  const switchCheck = () => {
    const newCheck = !check;
    setCheck(newCheck);
    localStorage.setItem(getKey(), JSON.stringify(newCheck));
  };

  return (
    <div
      className={`
        w-[95%] mt-2 p-3 rounded-lg shadow-lg flex gap-3 items-center
        ${check ? "bg-primary" : "bg-gray-200"}

        max-[780px]:flex-col max-[780px]:text-center
      `}
    >
      <button
        onClick={onClick}
        className="
          w-full flex flex-col gap-1 bg-transparent border-none text-left cursor-pointer
          max-[780px]:items-center
        "
      >
        <p className="text-[16px] font-bold text-black truncate max-[780px]:text-[14px] w-full">
          {name}
        </p>

        <p className="text-[16px] text-black truncate max-[780px]:text-[14px] w-full">
          {topics.slice(0, 2).join(", ")}
        </p>
      </button>

      <button
        onClick={switchCheck}
        className="
          bg-primary text-white font-bold rounded-xl py-2 px-4
          whitespace-nowrap
        "
      >
        {check ? "Reabrir" : "Concluído"}
      </button>
    </div>
  );
};
