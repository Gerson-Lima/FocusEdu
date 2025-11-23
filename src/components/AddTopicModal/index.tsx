import { useMemo, useState } from "react";
import * as S from "./style";
import ButtonConfirm from "../ButtonConfirm";
import { Buttons, type ButtonType } from "../../constants/buttons";
import { addReport } from "../../services/reportService";

type AddTopicModalProps = {
  userId: string;
  onClose: () => void;
};

export default function AddTopicModal({ userId, onClose }: AddTopicModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ButtonType | "">("");
  const [date, setDate] = useState<string>("");
  const [topicsText, setTopicsText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const topics = useMemo(() => {
    return topicsText
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [topicsText]);

  async function handleSubmit() {
    if (!name.trim() || !category || !date) {
      return;
    }
    try {
      setSubmitting(true);
      await addReport(userId, {
        name: name.trim(),
        category: category as ButtonType,
        topics,
        date,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <S.Backdrop onClick={onClose}>
      <S.Modal onClick={(e) => e.stopPropagation()}>
        <S.Title>Adicionar novo tópico</S.Title>

        <S.Field>
          <S.Label>Nome da disciplina</S.Label>
          <S.Input
            placeholder="Ex: Álgebra Linear"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>Categoria</S.Label>
          <S.RadioGroup>
            {Buttons.map((opt) => (
              <S.RadioItem key={opt}>
                <S.Radio
                  type="radio"
                  id={`cat-${opt}`}
                  name="category"
                  value={opt}
                  checked={category === opt}
                  onChange={() => setCategory(opt)}
                />
                <S.RadioLabel htmlFor={`cat-${opt}`}>{opt}</S.RadioLabel>
              </S.RadioItem>
            ))}
          </S.RadioGroup>
        </S.Field>

        <S.Field>
          <S.Label>Data</S.Label>
          <S.Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>Tópicos (um por linha, opcional)</S.Label>
          <S.TextArea
            placeholder={"Exemplos:\nSistemas lineares\nMatrizes"}
            value={topicsText}
            onChange={(e) => setTopicsText(e.target.value)}
          />
          {topics.length === 0 && <S.EmptyHint>sem tópicos</S.EmptyHint>}
        </S.Field>

        <S.Actions>
          <S.Cancel type="button" onClick={onClose}>Cancelar</S.Cancel>
          <div style={{ opacity: !name.trim() || !category || !date ? 0.6 : 1 }}>
            <ButtonConfirm
              text={submitting ? "Enviando..." : "Adicionar"}
              onPress={handleSubmit}
            />
          </div>
        </S.Actions>
      </S.Modal>
    </S.Backdrop>
  );
}


