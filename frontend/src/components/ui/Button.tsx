import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'text' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const getButtonStyles = (variant: ButtonVariant = 'primary') => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${({ theme }) => theme.colors.primary.main};
        color: ${({ theme }) => theme.colors.primary.contrastText};
        border: none;
        
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.primary.dark};
        }
      `;
    case 'secondary':
      return css`
        background-color: ${({ theme }) => theme.colors.secondary.main};
        color: ${({ theme }) => theme.colors.secondary.contrastText};
        border: none;
        
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.secondary.dark};
        }
      `;
    case 'outlined':
      return css`
        background-color: transparent;
        color: ${({ theme }) => theme.colors.primary.main};
        border: 1px solid ${({ theme }) => theme.colors.primary.main};
        
        &:hover:not(:disabled) {
          background-color: rgba(61, 90, 254, 0.08);
        }
      `;
    case 'text':
      return css`
        background-color: transparent;
        color: ${({ theme }) => theme.colors.primary.main};
        border: none;
        
        &:hover:not(:disabled) {
          background-color: rgba(61, 90, 254, 0.08);
        }
      `;
    case 'danger':
      return css`
        background-color: ${({ theme }) => theme.colors.status.error};
        color: ${({ theme }) => theme.colors.primary.contrastText};
        border: none;
        
        &:hover:not(:disabled) {
          background-color: #d32f2f;
        }
      `;
    default:
      return css`
        background-color: ${({ theme }) => theme.colors.primary.main};
        color: ${({ theme }) => theme.colors.primary.contrastText};
      `;
  }
};

const getButtonSize = (size: ButtonSize = 'medium') => {
  switch (size) {
    case 'small':
      return css`
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
      `;
    case 'medium':
      return css`
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      `;
    case 'large':
      return css`
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
      `;
    default:
      return css`
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      `;
  }
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
  $hasStartIcon: boolean;
  $hasEndIcon: boolean;
  $loading: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  position: relative;
  
  ${({ $variant }) => getButtonStyles($variant)};
  ${({ $size }) => getButtonSize($size)};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Loading style */
  ${({ $loading }) =>
    $loading &&
    css`
      color: transparent !important;
      pointer-events: none;
      
      &::after {
        content: '';
        position: absolute;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  startIcon,
  endIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $hasStartIcon={!!startIcon}
      $hasEndIcon={!!endIcon}
      $loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {startIcon && <IconWrapper>{startIcon}</IconWrapper>}
      {children}
      {endIcon && <IconWrapper>{endIcon}</IconWrapper>}
    </StyledButton>
  );
};

export default Button;