import styled from "@emotion/styled";
import { color } from "../../styles/color";

import Background from '../../assets/fundo-login.png'
import { s } from "framer-motion/client";

export const ContentLogin = styled.section`
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: ${color.primary};

`
export const Container = styled.section`
    max-width: 1590px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 64px;
    background-image:url(${Background});
    background-repeat: no-repeat;
    background-color: ${color.primary};

    @media (max-width: 800px){
        background-size: cover;
    }
`
export const TitleLogin = styled.h1`
    font-size: 36px;
    font-weight: bold;
    color: ${color.white};
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
`

export const Content = styled.div`
    width: 18%;
    background: ${color.white};
    display: flex;
    height: 100vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 64px;
`
export const Title = styled.h1`
    font-size: 18px;
    color: ${color.black};
    font-family: sans-serif;
    font-weight: bold;
`

export const AreaText = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

export const Text = styled.p`
    font-size: 14px;
    cursor: default;
    white-space: nowrap;
    color: ${color.black};
`

export const ToggleButton = styled.p`
    font-size: 14px;
    white-space: nowrap;
    color: ${color.primary};
    cursor: pointer;
`

export const Presentation = styled.div`
    width: max-content;
    align-self: flex-start;
    height: 80%;
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
`

export const AreaTextPresentation = styled.div`
    text-align: end;
    justify-self: flex-end;
`
export const TextPresentation = styled.h2`
    font-size: 20px;
    color: ${color.white};
    cursor: default;
`

export const Img = styled.img`
    width: 150px;
`