import * as S from './style'

type ExitProps = {
    exit: () => void
    noExit: () => void
}

export default function ExitConfirm({exit, noExit}: ExitProps){
    return(
        <S.Container>
            <S.Text>Tem certeza ?</S.Text>
            <S.AreaButton>
                <S.ButtonExit onClick={exit}>Sim</S.ButtonExit>
                <S.Button onClick={noExit}>Não</S.Button>
            </S.AreaButton>
        </S.Container>
    )
}