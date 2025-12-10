import { useState, useMemo } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function Seguranca() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl mb-4">Alterar senha</h1>
        <h2>Senha atual</h2>
        <Input
        placeholder="Sua senha atual"
        className="font-bold"
        >
        </Input>
        <h2>Nova senha</h2>
        <Input
        placeholder="Digite sua nova senha (no mínimo 8 caracteres, contendo letras e números)"
        className="font-bold"
        >
        </Input>
        <h2>Confirmar senha</h2>
        <Input
        placeholder="Digite novamente a nova senha"
        className="font-bold"
        >
        </Input>
        <Button className="mt-4 w-30 mr-10 font-bold">Salvar</Button>
        <Button
        className="bg-white text-slate-900 border border-gray w-30 hover:bg-gray-100 font-bold"
        >Cancelar</Button>
      </div>
    </MainLayout>
  );
}