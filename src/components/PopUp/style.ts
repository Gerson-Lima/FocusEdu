import styled from "@emotion/styled";
import { color } from "../../styles/color";

export const PopUp = styled.div`
  padding: 10px;
  background: ${color.gray};
  border-radius: 10px;
  box-shadow: 0px 5px 10px ${color.darkGray};
  max-width: 500px;
  width: 90%;
`;
export const PopUpContent = styled.div`
padding: 10px;
display: flex;
flex-direction: column;
align-items: center;
`

export const BackPopUp = styled.div`
  width: 100%;
  height: 100%;
  background: #00000042;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
`
export const BlockInfo = styled.div`
 padding: 10px;
`