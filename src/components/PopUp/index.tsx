import * as S from "./style";
import ButtonConfirm from "../ButtonConfirm";
import { type ReportItem } from "../../services/reportService";

type PopUpProps = {
  report: ReportItem;
  onClose: () => void;
};

export default function PopUp({ report, onClose }: PopUpProps) {
  return (
    <S.BackPopUp onClick={onClose}>
    
      <S.PopUp onClick={(e) => e.stopPropagation()}>
        <S.PopUpContent>
          <S.BlockInfo>
            <h2 style={{ textAlign: "center" }}>{report.name}</h2>
            <p>
              <b>Tipo:</b> {report.category}
            </p>
            {report.date && (
              <p>
                <b>Data:</b> {new Date(report.date + "T00:00:00").toLocaleDateString("pt-BR")}
              </p>
            )}
            <p>
              <b>Tópicos:</b>
            </p>
          {report.topics.length === 0 ? (
            <p>sem tópicos</p>
          ) : (
            <ul>
              {report.topics.map((t, i) => (
                <li key={`${t}-${i}`}>{t}</li>
              ))}
            </ul>
          )}
          </S.BlockInfo>

          <ButtonConfirm text="Fechar" onPress={onClose} />
        </S.PopUpContent>
      </S.PopUp>
    </S.BackPopUp>
  );
}
