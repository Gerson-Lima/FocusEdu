import * as S from './style'

type SearchProps = {
  report: string,
  reportChange: (value: string) => void
}
export default function SearchReport({report, reportChange}: SearchProps) {
  
 return (
   <S.Container>
    <S.AreaLogo>
      <S.Title>AgendaAe</S.Title>
    </S.AreaLogo>
    <S.AreaSearch>
        <S.Input type="text" placeholder="Pesquisar matéria ou tópico..." 
        value={report}
        onChange={ (e) => reportChange(e.target.value)}
        />
        <S.Button>Buscar</S.Button>
    </S.AreaSearch>
   </S.Container>
  );
}