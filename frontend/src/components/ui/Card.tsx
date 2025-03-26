import React from 'react';
import styled, { css } from 'styled-components';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  fullHeight?: boolean;
  padding?: boolean | string;
  className?: string;
}

const CardContainer = styled.div<{
  $variant: 'default' | 'outlined' | 'elevated';
  $fullHeight: boolean;
  $padding: boolean | string;
}>`
  background: ${({ theme }) => theme.colors.ui.card};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  height: ${({ $fullHeight }) => ($fullHeight ? '100%' : 'auto')};
  display: flex;
  flex-direction: column;
  
  ${({ $variant, theme }) =>
    $variant === 'default' &&
    css`
      box-shadow: ${theme.shadows.sm};
    `}
    
  ${({ $variant, theme }) =>
    $variant === 'outlined' &&
    css`
      border: 1px solid ${theme.colors.ui.divider};
    `}
    
  ${({ $variant, theme }) =>
    $variant === 'elevated' &&
    css`
      box-shadow: ${theme.shadows.md};
    `}

  ${({ $padding, theme }) => {
    if ($padding === false) return '';
    if (typeof $padding === 'string') return `padding: ${$padding};`;
    return `padding: ${theme.spacing.lg};`;
  }}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TitleArea = styled.div`
  flex: 1;
  min-width: 0; /* For proper text truncation */
`;

const CardTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  font-weight: ${({ theme }) => theme.typography.h4.fontWeight};
  line-height: ${({ theme }) => theme.typography.h4.lineHeight};
`;

const CardSubtitle = styled.p`
  margin: 0.25rem 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const HeaderActionContainer = styled.div`
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const CardContent = styled.div`
  flex: 1; // Take remaining space in column layout
`;

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  variant = 'default',
  fullHeight = false,
  padding = true,
  className,
}) => {
  return (
    <CardContainer $variant={variant} $fullHeight={fullHeight} $padding={padding} className={className}>
      {(title || headerAction) && (
        <CardHeader>
          {title && (
            <TitleArea>
              <CardTitle>{title}</CardTitle>
              {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
            </TitleArea>
          )}
          {headerAction && (
            <HeaderActionContainer>{headerAction}</HeaderActionContainer>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </CardContainer>
  );
};

export default Card;