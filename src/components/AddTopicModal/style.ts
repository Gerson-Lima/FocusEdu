import styled from "@emotion/styled";

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const Modal = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 24px;
`;

export const Title = styled.h2`
  margin: 0 0 16px;
  text-align: center;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

export const Label = styled.label`
  font-weight: 600;
`;

export const Input = styled.input`
  border: 1px solid #d8dae5;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
  font-size: 14px;
`;

export const TextArea = styled.textarea`
  border: 1px solid #d8dae5;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
  font-size: 14px;
  min-height: 96px;
  resize: vertical;
`;

export const EmptyHint = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
`;

export const RadioItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Radio = styled.input``;

export const RadioLabel = styled.label``;

export const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

export const Cancel = styled.button`
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
`;


