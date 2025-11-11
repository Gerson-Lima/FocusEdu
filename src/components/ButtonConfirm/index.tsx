import * as S from './style'

type ButtonProps = {
    text: string
    onPress: () => void
}
export default function ButtonConfirm({text, onPress}: ButtonProps) {
 return (
   <S.Container onClick={onPress}> 
    <S.TextButton>{text}</S.TextButton>
   </S.Container>
  );
}