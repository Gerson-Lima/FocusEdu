import { useEffect, useState } from "react";
import * as S from "./style";
import { Menu } from "../../components/Menu";
import { BlockMaterial } from "../../components/BlockMaterial";
import type { ButtonType } from "../../constants/buttons";
import { Buttons } from "../../constants/buttons";
import type { ReportItem } from "../../services/reportService";
import { subscribeReports } from "../../services/reportService";
import { Link } from "react-router-dom";
import PopUp from "../../components/PopUp";
import AddTopicModal from "../../components/AddTopicModal";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export const Home = () => {
  const [active, setActive] = useState<ButtonType>(Buttons[0]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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

  const filteredReports = reports.filter((report) => report.category === active);

  const openPopUp = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const closePopUp = () => {
    setSelectedReport(null);
  };

  return (
    <S.Container>
      <Menu active={active} setActive={setActive} />
      <div className="absolute top-8 right-8 flex gap-4">
        {/* <button
          onClick={() => setShowAdd(true)}
          style={{
            background: '#2c5728ff',
            color: "white",
            border: 0,
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Adicionar novo
        </button> */}
      <button className="bg-gray-500 text-white p-3 rounded">Adicionar</button>
      <Link className="bg-gray-500 text-white p-3 rounded" to="../User">Perfil</Link>
      </div>
      <S.AreaBlock>
        {filteredReports.map((item, idx) => (
          <BlockMaterial
            onClick={() => openPopUp(item)}
            key={`${item.name}-${idx}`}
            name={item.name}
            category={item.category}
            topics={item.topics}
          />
        ))}
      </S.AreaBlock>

      {selectedReport && (
        <PopUp report={selectedReport} onClose={closePopUp} />
      )}
      {showAdd && userId && <AddTopicModal userId={userId} onClose={() => setShowAdd(false)} />}
    </S.Container>
  );
};
