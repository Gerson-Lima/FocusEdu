type ExitProps = {
  exit: () => void;
  noExit: () => void;
}

export default function ExitConfirm({ exit, noExit }: ExitProps) {
  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-lg gap-2 w-full max-w-[200px] shadow">
      <p className="text-black font-bold text-base">
        Tem certeza ?
      </p>

      <div className="flex gap-2">
        <button
          onClick={exit}
          className="
            bg-white text-red font-bold text-base px-3 py-2 rounded-lg 
            hover:bg-red hover:text-white transition-colors cursor-pointer
          "
        >
          Sim
        </button>

        <button
          onClick={noExit}
          className="
            bg-white text-black font-bold text-base px-3 py-2 rounded-lg 
            hover:bg-black hover:text-white transition-colors cursor-pointer
          "
        >
          Não
        </button>
      </div>
    </div>
  );
}
