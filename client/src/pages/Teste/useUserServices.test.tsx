import { describe, it, expect, vi, beforeEach } from "vitest";

const H = vi.hoisted(() => {
  return {
    authMock: { currentUser: null as any },
    dbMock: { _db: true },

    credentialMock: vi.fn(),
    reauthenticateWithCredentialMock: vi.fn(),
    verifyBeforeUpdateEmailMock: vi.fn(),
    deleteUserMock: vi.fn(),
    updatePasswordMock: vi.fn(),
    updateProfileMock: vi.fn(),

    docMock: vi.fn(),
    deleteDocMock: vi.fn(),
  };
});

/**
 * Mock do alias "@/firebase"
 * (O useUserServices importa auth/db daqui)
 */
vi.mock("@/firebase", () => {
  return {
    auth: H.authMock,
    db: H.dbMock,
  };
});

/**
 * Mock do Firebase Auth
 */
vi.mock("firebase/auth", () => {
  return {
    EmailAuthProvider: { credential: H.credentialMock },
    reauthenticateWithCredential: H.reauthenticateWithCredentialMock,
    verifyBeforeUpdateEmail: H.verifyBeforeUpdateEmailMock,
    deleteUser: H.deleteUserMock,
    updatePassword: H.updatePasswordMock,
    updateProfile: H.updateProfileMock,
  };
});

/**
 * Mock do Firestore
 */
vi.mock("firebase/firestore", () => {
  return {
    doc: H.docMock,
    deleteDoc: H.deleteDocMock,
  };
});


import {
  reauthenticateUser,
  requestEmailUpdate,
  changePassword,
  changeName,
  deleteAccount,
} from "../user/useUserServices";

const makeUser = (overrides: Record<string, any> = {}) => ({
  uid: "uid-123",
  email: "user@test.com",
  ...overrides,
});

beforeEach(() => {
  H.authMock.currentUser = null;

  H.credentialMock.mockReset();
  H.reauthenticateWithCredentialMock.mockReset();
  H.verifyBeforeUpdateEmailMock.mockReset();
  H.deleteUserMock.mockReset();
  H.updatePasswordMock.mockReset();
  H.updateProfileMock.mockReset();

  H.docMock.mockReset();
  H.deleteDocMock.mockReset();
});

describe("useUserServices - reauthenticateUser", () => {
  it("USV-REA-001: lança erro se usuário não autenticado", async () => {
    H.authMock.currentUser = null;

    await expect(reauthenticateUser("12345678")).rejects.toThrow(
      "Usuario nao autenticado."
    );
  });

  it("USV-REA-002: gera credencial e chama reauthenticateWithCredential", async () => {
    const user = makeUser({ email: "a@b.com" });
    H.authMock.currentUser = user;

    const cred = { _cred: true };
    H.credentialMock.mockReturnValue(cred);

    H.reauthenticateWithCredentialMock.mockResolvedValue({ ok: true });

    const res = await reauthenticateUser("Senha@123");

    expect(H.credentialMock).toHaveBeenCalledWith("a@b.com", "Senha@123");
    expect(H.reauthenticateWithCredentialMock).toHaveBeenCalledWith(user, cred);
    expect(res).toEqual({ ok: true });
  });

  it("USV-REA-003: propaga erro do reauthenticateWithCredential", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.credentialMock.mockReturnValue({ _cred: true });

    const err = Object.assign(new Error("Wrong password"), {
      code: "auth/wrong-password",
    });
    H.reauthenticateWithCredentialMock.mockRejectedValue(err);

    await expect(reauthenticateUser("SenhaErrada")).rejects.toBe(err);
  });

  it("USV-REA-004: quando email é undefined, ainda tenta criar credencial (comportamento atual)", async () => {
    const user = makeUser({ email: undefined });
    H.authMock.currentUser = user;

    H.credentialMock.mockReturnValue({ _cred: true });
    H.reauthenticateWithCredentialMock.mockResolvedValue({ ok: true });

    await reauthenticateUser("x");

    expect(H.credentialMock).toHaveBeenCalledWith(undefined, "x");
  });
});

describe("useUserServices - requestEmailUpdate", () => {
  it("USV-EML-001: lança erro se usuário não autenticado", async () => {
    H.authMock.currentUser = null;

    await expect(requestEmailUpdate("novo@dominio.com")).rejects.toThrow(
      "Usuario nao autenticado."
    );
  });

  it("USV-EML-002: retorna true quando verifyBeforeUpdateEmail resolve", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.verifyBeforeUpdateEmailMock.mockResolvedValue(undefined);

    const res = await requestEmailUpdate("novo@dominio.com");

    expect(H.verifyBeforeUpdateEmailMock).toHaveBeenCalledWith(
      user,
      "novo@dominio.com"
    );
    expect(res).toBe(true);
  });

  it("USV-EML-003: mapeia auth/email-already-in-use para mensagem amigável", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.verifyBeforeUpdateEmailMock.mockRejectedValue(
      Object.assign(new Error("Email in use"), {
        code: "auth/email-already-in-use",
      })
    );

    await expect(requestEmailUpdate("existente@dominio.com")).rejects.toThrow(
      "Este e-mail ja esta em uso."
    );
  });

  it("USV-EML-004: outros erros viram mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.verifyBeforeUpdateEmailMock.mockRejectedValue(
      Object.assign(new Error("Invalid email"), { code: "auth/invalid-email" })
    );

    await expect(requestEmailUpdate("invalido")).rejects.toThrow(
      "Erro ao solicitar atualizacao de e-mail."
    );
  });
});

describe("useUserServices - changePassword", () => {
  it("USV-PWD-001: lança erro se usuário não autenticado", async () => {
    H.authMock.currentUser = null;

    await expect(changePassword("Senha@123")).rejects.toThrow(
      "Usuario nao autenticado."
    );
  });

  it("USV-PWD-002: retorna true quando updatePassword resolve", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.updatePasswordMock.mockResolvedValue(undefined);

    const res = await changePassword("Senha@123");

    expect(H.updatePasswordMock).toHaveBeenCalledWith(user, "Senha@123");
    expect(res).toBe(true);
  });

  it("USV-PWD-003: mapeia auth/weak-password para mensagem amigável", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.updatePasswordMock.mockRejectedValue(
      Object.assign(new Error("Weak"), { code: "auth/weak-password" })
    );

    await expect(changePassword("123")).rejects.toThrow(
      "A senha deve ter no minimo 8 caracteres."
    );
  });

  it("USV-PWD-004: outros erros viram mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.updatePasswordMock.mockRejectedValue(new Error("Unknown"));

    await expect(changePassword("Senha@123")).rejects.toThrow(
      "Erro ao atualizar senha."
    );
  });
});

describe("useUserServices - changeName", () => {
  it("USV-NAM-001: lança erro se usuário não autenticado", async () => {
    H.authMock.currentUser = null;

    await expect(changeName("Maria")).rejects.toThrow("Usuario nao autenticado.");
  });

  it("USV-NAM-002: deleta doc e atualiza displayName, retornando true", async () => {
    const user = makeUser({ uid: "u1" });
    H.authMock.currentUser = user;

    const ref = { _ref: true };
    H.docMock.mockReturnValue(ref);

    H.deleteDocMock.mockResolvedValue(undefined);
    H.updateProfileMock.mockResolvedValue(undefined);

    const res = await changeName("Maria");

    expect(H.docMock).toHaveBeenCalledWith(H.dbMock, "users", "u1");
    expect(H.deleteDocMock).toHaveBeenCalledWith(ref);
    expect(H.updateProfileMock).toHaveBeenCalledWith(user, { displayName: "Maria" });
    expect(res).toBe(true);

    // Ordem: deleteDoc antes de updateProfile
    const delOrder = H.deleteDocMock.mock.invocationCallOrder[0];
    const updOrder = H.updateProfileMock.mock.invocationCallOrder[0];
    expect(delOrder).toBeLessThan(updOrder);
  });

  it("USV-NAM-003: se deleteDoc falhar, retorna mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.docMock.mockReturnValue({ _ref: true });
    H.deleteDocMock.mockRejectedValue(new Error("Firestore error"));

    await expect(changeName("Maria")).rejects.toThrow("Erro ao atualizar nome.");
  });

  it("USV-NAM-004: se updateProfile falhar, retorna mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.docMock.mockReturnValue({ _ref: true });
    H.deleteDocMock.mockResolvedValue(undefined);
    H.updateProfileMock.mockRejectedValue(new Error("Auth error"));

    await expect(changeName("Maria")).rejects.toThrow("Erro ao atualizar nome.");
  });
});

describe("useUserServices - deleteAccount", () => {
  it("USV-DEL-001: lança erro se usuário não autenticado", async () => {
    H.authMock.currentUser = null;

    await expect(deleteAccount()).rejects.toThrow("Usuario nao autenticado.");
  });

  it("USV-DEL-002: deleta doc e exclui usuário, retornando true", async () => {
    const user = makeUser({ uid: "u1" });
    H.authMock.currentUser = user;

    const ref = { _ref: true };
    H.docMock.mockReturnValue(ref);

    H.deleteDocMock.mockResolvedValue(undefined);
    H.deleteUserMock.mockResolvedValue(undefined);

    const res = await deleteAccount();

    expect(H.docMock).toHaveBeenCalledWith(H.dbMock, "users", "u1");
    expect(H.deleteDocMock).toHaveBeenCalledWith(ref);
    expect(H.deleteUserMock).toHaveBeenCalledWith(user);
    expect(res).toBe(true);

    // Ordem: deleteDoc antes de deleteUser
    const delDocOrder = H.deleteDocMock.mock.invocationCallOrder[0];
    const delUserOrder = H.deleteUserMock.mock.invocationCallOrder[0];
    expect(delDocOrder).toBeLessThan(delUserOrder);
  });

  it("USV-DEL-003: se deleteDoc falhar, retorna mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.docMock.mockReturnValue({ _ref: true });
    H.deleteDocMock.mockRejectedValue(new Error("Firestore error"));

    await expect(deleteAccount()).rejects.toThrow("Erro ao excluir conta.");
  });

  it("USV-DEL-004: se deleteUser falhar, retorna mensagem genérica", async () => {
    const user = makeUser();
    H.authMock.currentUser = user;

    H.docMock.mockReturnValue({ _ref: true });
    H.deleteDocMock.mockResolvedValue(undefined);
    H.deleteUserMock.mockRejectedValue(new Error("Auth error"));

    await expect(deleteAccount()).rejects.toThrow("Erro ao excluir conta.");
  });
});
