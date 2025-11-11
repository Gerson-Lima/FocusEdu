import styled from "@emotion/styled";
import { color } from "../../styles/color";

export const AreaLogin = styled.div`
    display: flex;
    width: max-content;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    justify-content: center;
    transition: .4s;
`

export const Title = styled.h1`
    font-size: 24px;
    color: ${color.black};
    font-weight: bold;
`

export const Credencial = styled.input`
    width: 95%;
    font-size: 16px;
    padding: 12px 8px;
    border-radius: 8px;
    border: none;
    background-color: ${color.gray};
    border: none;

    :focus {
        background-color: red;
    }
`
export const ErrorMessage = styled.p`
    color: red;
    font-size: 14px;
    margin-top: 8px;
`

export const Button = styled.button`
    width: 100%;
    padding: 12px 8px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    border: none;
    background-color: ${color.primary};
    color: ${color.white};
    cursor: pointer;
    &:hover {
        background-color: ${color.black};
    }
`

export const AreaToggle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

export const Text = styled.p`
    font-size: 14px;
    cursor: default;
    color: ${color.black};
`

export const ToggleMode = styled.p`
    color: ${color.primary};
    text-decoration: underline;
    cursor: pointer;
`

