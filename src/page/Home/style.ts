import styled from '@emotion/styled'
import { color } from '../../styles/color'

export const Container = styled.section`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row;
  overflow-y: hidden;
  background-color: ${color.gray};`

export const AreaBlock = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  width: 80%;
  overflow-x: hidden;
  padding: 16px;
  padding-top: 86px;
`



