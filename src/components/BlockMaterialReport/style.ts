import styled from "@emotion/styled";
import { color } from "../../styles/color";

export const Container = styled.div<{check: boolean}>`
    width: 95%;
    background-color: ${color.white};
    display: flex;
    border: none;
    padding: 8px 12px;
    align-items: center;
    box-shadow: 0 5px 10px ${color.darkGray};
    border-radius: 8px;
    gap: 12px;
    

     @media (max-width: 780px){
        flex-direction: column;
        text-align: center;
        gap: 0px;
    }
`

export const Content = styled.button`
    width: 90%;
    border: none;
    display: flex;
    cursor: pointer;
    background-color: transparent;
    
      @media (max-width: 780px){
        text-align: center;
        gap: 12px;
    }
`

export const Text = styled.p`
    font-size: 16px;
    width: 300px;
    color: ${color.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;


    @media (max-width: 780px){
        font-size: 14px;
    }

    `
