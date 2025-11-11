import styled from '@emotion/styled'
import { color } from '../../styles/color'  

export const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${color.primary};
    padding: 12px 12px;
`

export const AreaSearch = styled.div`
    display: flex;
    gap: 8px;
`

export const Input = styled.input`
    padding: 12px 18px;
    border-radius: 8px;
    border: 1px solid ${color.darkGray};
`

export const Button = styled.button`
    background-color: ${color.gray};
    border-radius: 8px;
    padding: 4px 8px;
    border: none;
    color: ${color.primary};
    font-weight: bold;
    cursor: pointer;

    &:hover{
        background-color: ${color.darkGray};
    }
`
export const Title = styled.h1`
  color: ${color.white};
  font-size: 24px;
  font-weight: bold;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
`
export const Logo = styled.img`
  padding-top: 0;
  width: 100px;
  height: auto;
`;

export const AreaLogo = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`