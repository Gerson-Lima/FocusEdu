import * as S from './style'

type TitleProp = {
    title: string,
}

export default function Title({title}: TitleProp) {
 return (
   <S.Container>
        <S.Text>{title}</S.Text>
   </S.Container>
  );
}