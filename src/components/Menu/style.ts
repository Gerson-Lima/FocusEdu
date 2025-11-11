import styled from "@emotion/styled";
import { color } from "../../styles/color";

export const Container = styled.div`
  background: ${color.white};
  padding: 24px 12px;
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: flex-start;

      @media (max-width: 780px){
        width: 40%;
    }
`;
export const Content = styled.div`

`

export const TitleMenu = styled.h1`
  color: ${color.primary};
  font-size: 24px;
  font-weight: bold;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
`

export const Logo = styled.img`
  padding: 24px 0;
  padding-top: 0;
  width: 100px;
  height: auto;
  align-self: center;
`;

export const AreaButton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: flex-start;
`;


export const Text = styled.button<{ $active?: boolean }>`
  border: none;
  text-align: left;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  transition: color .5s;

`;

export const ExitArea = styled.div`
    display: flex;
    padding: 64px 12px;
    align-items: center;
    justify-content: center;
`

export const ButtonExit = styled.button`
    font-size: 18px;
    background-color: ${color.red};
    color: ${color.gray};
    border: none;
    padding: 4px 12px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;

    &:hover{
      background-color: ${color.gray};
      color: ${color.red};
    }
`

export const ButtonReport = styled.button`
  border: none;
  background: ${color.gray};
  font-size: 16px;
  cursor: pointer;
  transition: color .5s;
  padding: 8px 12px;
  color: ${color.black};
  font-weight: bold;
  border-radius: 8px;
`    