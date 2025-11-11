import { color } from '../../styles/color'
import styled from '@emotion/styled'

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
`

export const Data = styled.p`
    font-size: 14px;
    color: ${color.black};
`
export const input = styled.input`
    margin-top: -10px;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid ${color.darkGray};
    width: 100%;
`
