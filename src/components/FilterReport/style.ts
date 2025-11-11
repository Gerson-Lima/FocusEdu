import styled from "@emotion/styled";
import { color } from "../../styles/color";

export const Container = styled.div`
  flex-direction: column;
`;

export const Option = styled.button`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  background-color: transparent;
  border: none;
  text-align: center;
  justify-content: center;
  gap: 12px;
`;

export const RadioOuter = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border-width: 2px;
  border-color: #333;
  align-items: center;
  justify-content: center;
`;

export const RadioInner = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${color.primary};
`;

export const Label = styled.p`
  text-align: start;
  font-size: 14px;
  color: #000;
  cursor: pointer;
`;
