import { color } from "../../styles/color";
import styled from "@emotion/styled";

export const Container = styled.div`
    display: flex;
    padding: 10px;
    flex-direction: column;
    align-items: center;
    border-radius: 8px;
    background-color: ${color.gray};
    gap: 8px;
`
export const Text = styled.p`
    font-size: 16px;
    color: ${color.black};
    font-weight: bold;
`
export const AreaButton = styled.div`
    display: flex;
    gap: 8px;
`

export const Button = styled.button`
    color: ${color.white};
    background: ${color.black};
    font-size: 16px;
    font-weight: bold;
    border-radius: 8px;
    border: none;
    padding: 8px 12px;
    cursor: pointer;

    &:hover{
        background-color: ${color.primary};
        color: ${color.white};
    }
`
export const ButtonExit = styled.button`
    color: ${color.white};
    background: ${color.red};
    font-size: 16px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;

    &:hover{
        background-color: ${color.white};
        color: ${color.red};
    }
`