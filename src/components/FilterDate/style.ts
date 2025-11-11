import { color } from '../../styles/color'
import styled from '@emotion/styled'

export const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100px;
`

export const Data = styled.p`
    font-size: 14px;
    color: ${color.black};
`
export const input = styled.input`
    padding: 2px;
    border-radius: 4px;
    border: 1px solid ${color.darkGray};
    width:48px;
`
