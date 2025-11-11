// FilterReport.tsx
import { useState } from "react";
import * as S from "./style";

export default function FilterReport() {
  const [selected, setSelected] = useState("todos");

  return (
    <S.Container>
      <S.Option onClick={() => setSelected("todos")}>
        <S.RadioOuter>
          {selected === "todos" && <S.RadioInner />}
        </S.RadioOuter>
        <S.Label>Todos</S.Label>
      </S.Option>

      <S.Option onClick={() => setSelected("tarefas")}> 
        <S.RadioOuter>
          {selected === "tarefas" && <S.RadioInner />}
        </S.RadioOuter>
        <S.Label>Tarefas</S.Label>
      </S.Option>

      <S.Option onClick={() => setSelected("aulas")}>
        <S.RadioOuter>
          {selected === "aulas" && <S.RadioInner />}
        </S.RadioOuter>
        <S.Label>Aulas</S.Label>
      </S.Option>

      <S.Option onClick={() => setSelected("avaliacoes")}>
        <S.RadioOuter>
          {selected === "avaliacoes" && <S.RadioInner />}
        </S.RadioOuter>
        <S.Label>Avaliações</S.Label>
      </S.Option>
    </S.Container>
  );
}
