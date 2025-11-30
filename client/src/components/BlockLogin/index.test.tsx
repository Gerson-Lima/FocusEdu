/// <reference types="vitest/globals" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlockLogin from './index';

// mocks
const mockSetLocation = vi.fn();
const mockSignIn = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

vi.mock('@/contexts/MockAuthContext', () => ({
  useFirebaseAuth: () => ({
    signIn: mockSignIn,
  }),
}));

vi.mock('@/assets/eye-password-show-svgrepo-com.svg', () => ({
  default: 'EyeShow',
}));

vi.mock('@/assets/eye-password-hide-svgrepo-com.svg', () => ({
  default: 'EyeHide',
}));

describe('BlockLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue(undefined);
  });

  it('renderiza formulário e permite digitação', () => {
    render(<BlockLogin />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'teste@mail.com' },
    });

    fireEvent.change(
      screen.getByLabelText(/senha/i, { selector: 'input' }),
      { target: { value: '123456' } }
    );

    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('teste@mail.com');
    expect(
      screen.getByLabelText(/senha/i, { selector: 'input' })
    ).toHaveValue('123456');
  });

  it('faz login com sucesso e redireciona', async () => {
    render(<BlockLogin />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'user@valid.com' },
    });

    fireEvent.change(
      screen.getByLabelText(/senha/i, { selector: 'input' }),
      { target: { value: 'password123' } }
    );

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'user@valid.com',
        'password123'
      );
      expect(mockSetLocation).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('exibe mensagem de erro quando o login falha', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Auth error'));

    render(<BlockLogin />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'erro@mail.com' },
    });

    fireEvent.change(
      screen.getByLabelText(/senha/i, { selector: 'input' }),
      { target: { value: 'senhaerrada' } }
    );

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/email ou senha inadequados/i)
      ).toBeInTheDocument();
    });

    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('permite mostrar a senha ao clicar no botão', () => {
    render(<BlockLogin />);

    const passwordInput = screen.getByLabelText(/senha/i, {
      selector: 'input',
    });

    const toggleButton = screen.getByRole('button', {
      name: /mostrar senha/i,
    });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Ocultar senha');
  });

  it('permite ocultar a senha novamente ao clicar no botão', () => {
    render(<BlockLogin />);

    const passwordInput = screen.getByLabelText(/senha/i, {
      selector: 'input',
    });

    const toggleButton = screen.getByRole('button', {
      name: /mostrar senha/i,
    });

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Mostrar senha');
  });
});
