import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

const InputContainer = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const getInputVariantStyles = (variant: 'standard' | 'outlined' | 'filled', hasError: boolean) => {
  const errorStyles = css`
    border-color: ${({ theme }) => theme.colors.status.error};
    
    &:focus {
      border-color: ${({ theme }) => theme.colors.status.error};
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  `;

  switch (variant) {
    case 'standard':
      return css`
        border: none;
        border-bottom: 1px solid ${({ theme }) => theme.colors.ui.divider};
        border-radius: 0;
        padding: ${({ theme }) => `${theme.spacing.sm} 0`};
        background-color: transparent;
        
        &:focus {
          border-bottom: 2px solid ${({ theme }) => theme.colors.primary.main};
          margin-bottom: -1px;
          outline: none;
        }
        
        ${hasError && errorStyles}
      `;
    case 'filled':
      return css`
        border: 1px solid transparent;
        border-radius: ${({ theme }) => theme.borderRadius.md};
        padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
        background-color: ${({ theme }) => theme.colors.ui.hover};
        
        &:focus {
          background-color: ${({ theme }) => 'rgba(0, 0, 0, 0.01)'};
          border-color: ${({ theme }) => theme.colors.primary.main};
          outline: none;
        }
        
        ${hasError && errorStyles}
      `;
    case 'outlined':
    default:
      return css`
        border: 1px solid ${({ theme }) => theme.colors.ui.divider};
        border-radius: ${({ theme }) => theme.borderRadius.md};
        padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
        background-color: transparent;
        
        &:focus {
          border-color: ${({ theme }) => theme.colors.primary.main};
          box-shadow: 0 0 0 2px rgba(61, 90, 254, 0.2);
          outline: none;
        }
        
        ${hasError && errorStyles}
      `;
  }
};

const InputWrapper = styled.div<{
  $hasStartIcon: boolean;
  $hasEndIcon: boolean;
  $variant: 'standard' | 'outlined' | 'filled';
  $hasError: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
    color: ${({ theme }) => theme.colors.text.primary};
    width: 100%;
    transition: all ${({ theme }) => theme.transitions.fast};
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.text.hint};
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    ${({ $hasStartIcon, theme }) => $hasStartIcon && `padding-left: ${theme.spacing.xl};`}
    ${({ $hasEndIcon, theme }) => $hasEndIcon && `padding-right: ${theme.spacing.xl};`}
    
    ${({ $variant, $hasError }) => getInputVariantStyles($variant, $hasError)}
  }
`;

const IconWrapper = styled.div<{ $position: 'start' | 'end' }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
  
  ${({ $position, theme }) =>
    $position === 'start'
      ? `left: ${theme.spacing.sm};`
      : `right: ${theme.spacing.sm};`}
`;

const HelperText = styled.div<{ $isError: boolean }>`
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ $isError, theme }) =>
    $isError ? theme.colors.status.error : theme.colors.text.secondary};
`;

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helper,
      error,
      startIcon,
      endIcon,
      fullWidth = false,
      variant = 'outlined',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const helperText = error || helper;

    return (
      <InputContainer $fullWidth={fullWidth}>
        {label && <Label>{label}</Label>}
        <InputWrapper
          $hasStartIcon={!!startIcon}
          $hasEndIcon={!!endIcon}
          $variant={variant}
          $hasError={hasError}
        >
          {startIcon && <IconWrapper $position="start">{startIcon}</IconWrapper>}
          <input ref={ref} {...props} />
          {endIcon && <IconWrapper $position="end">{endIcon}</IconWrapper>}
        </InputWrapper>
        {helperText && <HelperText $isError={hasError}>{helperText}</HelperText>}
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';

export default Input;