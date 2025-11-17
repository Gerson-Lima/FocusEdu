import { color } from '../../styles/color'
import styled from '@emotion/styled'

export const Container = styled.button`
    background-color: ${color.primary};
    border-radius: 12px;
    padding: 12px 24px;
    border: none;
    align-items: center;
    justify-content: center;
    width: max-content;
    cursor: pointer;
`

export const TextButton = styled.p`
    color: ${color.white};
    font-size: 14px;
    font-weight: bold;
`