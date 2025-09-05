"use client";
import { useState, ReactNode } from "react";

interface ConfirmationState {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    {
      isOpen: false,
      message: "",
    }
  );
  const [loading, setLoading] = useState(false);

  const showConfirmation = (config: Omit<ConfirmationState, "isOpen">) => {
    setConfirmationState({
      ...config,
      isOpen: true,
    });
  };

  const hideConfirmation = () => {
    setConfirmationState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (confirmationState.onConfirm) {
      setLoading(true);
      try {
        await confirmationState.onConfirm();
        hideConfirmation();
      } catch (error) {
        console.error("Erro na confirmação:", error);
        setLoading(false);
      }
    } else {
      hideConfirmation();
    }
  };

  // Funções de conveniência
  const confirmDelete = (
    itemName: string,
    onConfirm: () => void | Promise<void>
  ) => {
    showConfirmation({
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir "${itemName}"?\n\nEsta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm,
    });
  };

  const confirmAction = (
    title: string,
    message: ReactNode,
    onConfirm: () => void | Promise<void>,
    type: "danger" | "warning" | "info" = "warning"
  ) => {
    showConfirmation({
      title,
      message,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      type,
      onConfirm,
    });
  };

  return {
    confirmationState,
    loading,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    confirmDelete,
    confirmAction,
  };
}
