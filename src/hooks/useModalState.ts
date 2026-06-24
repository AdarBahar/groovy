import { useState } from 'react';

export interface ModalState {
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;
  isMyGroovesModalOpen: boolean;
  setIsMyGroovesModalOpen: (open: boolean) => void;
  isSaveGrooveModalOpen: boolean;
  setIsSaveGrooveModalOpen: (open: boolean) => void;
  isGrooveLibraryModalOpen: boolean;
  setIsGrooveLibraryModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isTimeSignatureModalOpen: boolean;
  setIsTimeSignatureModalOpen: (open: boolean) => void;
}

export function useModalState(): ModalState {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMyGroovesModalOpen, setIsMyGroovesModalOpen] = useState(false);
  const [isSaveGrooveModalOpen, setIsSaveGrooveModalOpen] = useState(false);
  const [isGrooveLibraryModalOpen, setIsGrooveLibraryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTimeSignatureModalOpen, setIsTimeSignatureModalOpen] = useState(false);

  return {
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    isPrintModalOpen,
    setIsPrintModalOpen,
    isMyGroovesModalOpen,
    setIsMyGroovesModalOpen,
    isSaveGrooveModalOpen,
    setIsSaveGrooveModalOpen,
    isGrooveLibraryModalOpen,
    setIsGrooveLibraryModalOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    isTimeSignatureModalOpen,
    setIsTimeSignatureModalOpen,
  };
}
