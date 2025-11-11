import styled from '@emotion/styled'
import { color } from '../../styles/color'

export const Container = styled.section`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row;
  overflow-y: hidden;
  scrollbar-color: ${color.darkGray} ${color.white};
`

export const Content = styled.div`
  width: 100%;

`

export const AreaBack = styled.div`
  display: flex;
  padding: 10px;
`

export const ButtonBack = styled.button`
  border: none;
  color: ${color.white};
  background-color: ${color.primary};
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
`


export const ContentReport = styled.div`
  display: flex;
  justify-content: center;
  gap: 64px;
  padding: 16px;
  height: 100%;
`



export const AreaFilter = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `   

export const AreaReport = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    overflow-y: auto;
    overflow-x: auto;
`

