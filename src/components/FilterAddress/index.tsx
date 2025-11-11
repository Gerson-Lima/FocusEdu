import * as S from './style';

type FilterDateProps = {
    data: string;
}

export default function FilterAddress({data}: FilterDateProps) {
    return (
        <S.Container>
            <S.Data>{data}: </S.Data>
            <S.input type="text" />
        </S.Container>
    )
}