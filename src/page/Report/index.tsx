import { useEffect, useState, useMemo } from "react"; // adicionamos useMemo
import FilterDate from "../../components/FilterDate";
import { BlockMaterialReport } from "../../components/BlockMaterialReport";
import type { ReportItem } from "../../services/reportService";
import { subscribeReports } from "../../services/reportService";
import PopUp from "../../components/PopUp";
import * as S from "./style";
import FilterAddress from "../../components/FilterAddress";
import SearchReport from "../../components/SearchReport";
import FilterReport from "../../components/FilterReport";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Report() {
  const [report, setReport] = useState('');
  const [day, setDay] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const navigate = useNavigate();

  // Obtém o ID do usuário autenticado
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setReports([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // usando dados do Firebase do usuário atual
  useEffect(() => {
    if (!userId) {
      setReports([]);
      return;
    }

    const unsubscribe = subscribeReports(userId, (firebaseReports) => {
      setReports(firebaseReports);
    });

    return () => unsubscribe();
  }, [userId]);

  const openPopUp = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const closePopUp = () => {
    setSelectedReport(null);
  };


  function handleToHome() {
    navigate("/home");
  }

  const filteredReports = useMemo(() => {
    const q = report.trim().toLowerCase();
    if (!q) return reports;

    return reports.filter((item) => {
      const inName = item.name?.toLowerCase().includes(q);
      const inTopics = (item.topics || []).some((t) => t.toLowerCase().includes(q));
      return inName || inTopics;
    });
  }, [reports, report]);


  return (
    <S.Container>
      <S.Content>
        <SearchReport
          report={report}
          reportChange={setReport}
        />

        <S.AreaBack>
          <S.ButtonBack onClick={handleToHome}>
            Voltar a tela inicial
          </S.ButtonBack>
        </S.AreaBack>

        <S.ContentReport>
          <S.AreaFilter>
            <FilterDate
              data="Dia"
              value={day}
              setValue={setDay}
            />
            <FilterDate
              data="Mês"
              value={month}
              setValue={setMonth}
            />
            <FilterDate
              data="Ano"
              value={year}
              setValue={setYear}
            />
            <FilterAddress data="Matéria" />
            <FilterReport />
          </S.AreaFilter>

          <S.AreaReport>
            {filteredReports.length === 0 ? (
              report.trim() ? (
                <div>{`Nenhuma matéria/tópico encontrado para "${report.trim()}"`}</div>
              ) : (
                <div>Nenhuma matéria/tópico encontrado.</div>
              )
            ) : (
              filteredReports.map((item, idx) => (
                <BlockMaterialReport
                  key={`${item.name}-${idx}`}
                  name={item.name}
                  category={item.category}
                  topics={item.topics}
                  onClick={() => openPopUp(item)}
                />
              ))
            )}
          </S.AreaReport>
        </S.ContentReport>
      </S.Content>

      {selectedReport && (
        <PopUp report={selectedReport} onClose={closePopUp} />
      )}
    </S.Container>
  );
}
