// src/hooks/useConfirm.tsx
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  CircularProgress
} from '@mui/material';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const defaultOptions: ConfirmOptions = {
  title: '확인',
  message: '이 작업을 진행하시겠습니까?',
  confirmText: '확인',
  cancelText: '취소',
  confirmColor: 'primary'
};

type ConfirmCallback = () => void | Promise<void>;

/**
 * 확인 대화상자를 표시하는 커스텀 훅
 * @returns 확인 대화상자 관련 함수와 상태
 */
export function useConfirm() {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<ConfirmOptions>(defaultOptions);
  const [resolveCallback, setResolveCallback] = useState<ConfirmCallback | null>(null);

  /**
   * 확인 대화상자 표시
   * @param options 대화상자 옵션
   * @param onConfirm 확인 시 실행될 콜백 함수
   */
  const confirm = (
    optionsOrMessage: ConfirmOptions | string, 
    onConfirm?: ConfirmCallback
  ) => {
    return new Promise<boolean>((resolve) => {
      // 메시지만 전달된 경우 기본 옵션과 합치기
      const dialogOptions = typeof optionsOrMessage === 'string' 
        ? { ...defaultOptions, message: optionsOrMessage } 
        : { ...defaultOptions, ...optionsOrMessage };
      
      setOptions(dialogOptions);
      setOpen(true);

      // 콜백 함수 설정
      const callback = () => {
        if (onConfirm) {
          onConfirm();
        }
        resolve(true);
      };
      
      setResolveCallback(() => callback);
    });
  };

  /**
   * 대화상자 확인 버튼 클릭 핸들러
   */
  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      if (resolveCallback) {
        await resolveCallback();
      }

      setOpen(false);
    } catch (error) {
      console.error('Error in confirm action:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 대화상자 취소 버튼 클릭 핸들러
   */
  const handleCancel = () => {
    setOpen(false);
  };

  /**
   * 확인 대화상자 컴포넌트
   */
  const ConfirmDialog = () => (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{options.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {options.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCancel} 
          color="inherit"
          disabled={loading}
        >
          {options.cancelText}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color={options.confirmColor} 
          variant="contained"
          autoFocus
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {options.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return {
    confirm,
    ConfirmDialog
  };
}

export default useConfirm; 