import * as S from './style';

type FilterDateProps = {
  data: string;
  value: number | null;
  setValue: (value: number | null) => void;
}

export default function FilterDate({ data, value, setValue }: FilterDateProps) {
  return (
    <S.Container>
      <S.Data>{data}: </S.Data>
      <S.input
        type="number"
        value={value ?? ''} 
        onChange={(e) => {
          const val = e.target.value;
          setValue(val ? parseInt(val, 10) : null);
        }}
      />
    </S.Container>
  );
}
