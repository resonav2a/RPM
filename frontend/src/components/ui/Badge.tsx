import React from 'react';
import styled, { css } from 'styled-components';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'dark' | 'light';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  outlined?: boolean;
}

const getBadgeColor = (variant: BadgeVariant, outlined: boolean) => {
  const colors = {
    default: { bg: '#e2e8f0', text: '#475569', border: '#cbd5e1' },
    success: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    error: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
    info: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    dark: { bg: '#334155', text: '#f8fafc', border: '#475569' },
    light: { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' },
  };

  const color = colors[variant];
  
  if (outlined) {
    return css`
      background-color: transparent;
      color: ${color.text};
      border: 1px solid ${color.border};
    `;
  }
  
  return css`
    background-color: ${color.bg};
    color: ${color.text};
    border: 1px solid transparent;
  `;
};

const getBadgeSize = (size: BadgeSize) => {
  switch (size) {
    case 'small':
      return css`
        padding: 0.125rem 0.375rem;
        font-size: 0.6875rem;
      `;
    case 'medium':
      return css`
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
      `;
    case 'large':
      return css`
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
      `;
    default:
      return css`
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
      `;
  }
};

const StyledBadge = styled.span<{
  $variant: BadgeVariant;
  $size: BadgeSize;
  $outlined: boolean;
  $hasIcon: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.2;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ $variant, $outlined }) => getBadgeColor($variant, $outlined)};
  ${({ $size }) => getBadgeSize($size)};
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 1em;
`;

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  icon,
  outlined = false,
}) => {
  return (
    <StyledBadge
      $variant={variant}
      $size={size}
      $outlined={outlined}
      $hasIcon={!!icon}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {label}
    </StyledBadge>
  );
};

export default Badge;