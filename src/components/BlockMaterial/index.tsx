import { useState, useEffect } from "react";
import * as S from "./style";
import type { ButtonType } from "../../constants/buttons";

type BlockMaterialProps = {
  onClick: () => void; 
  name: string;
  category: ButtonType;
  topics: string[];
};

export const BlockMaterial = ({ onClick, name, topics }: BlockMaterialProps) => {
  const [check, setCheck] = useState(false);

  // gera uma chave única baseada nos 3 campos
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
    <S.Container check={check}>
      <S.Content onClick={onClick}>
        <S.Text>{name}</S.Text>
        <S.Text>{topics.slice(0, 2).join(", ")}</S.Text>
      </S.Content>
      <S.Button onClick={switchCheck}>
        {check ? "Reabrir" : "Concluído"}
      </S.Button>
    </S.Container>
  );
};
