import React from 'react';
import styled, { css } from 'styled-components';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarVariant = 'circular' | 'rounded' | 'square';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  online?: boolean;
  color?: string;
  className?: string;
}

const getAvatarSize = (size: AvatarSize) => {
  const sizes = {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
  };
  return sizes[size] || sizes.md;
};

const getFontSize = (size: AvatarSize) => {
  const sizes = {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
  };
  return sizes[size] || sizes.md;
};

const getAvatarShape = (variant: AvatarVariant) => {
  switch (variant) {
    case 'circular':
      return css`border-radius: 50%;`;
    case 'rounded':
      return css`border-radius: ${({ theme }) => theme.borderRadius.md};`;
    case 'square':
      return css`border-radius: ${({ theme }) => theme.borderRadius.sm};`;
    default:
      return css`border-radius: 50%;`;
  }
};

const getInitials = (name: string) => {
  if (!name) return '';
  
  const names = name.split(' ');
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

// Random color generation based on name string
const getColorFromName = (name: string) => {
  if (!name) return '#3d5afe';
  
  const colors = [
    '#3d5afe', // Primary blue
    '#4ecdc4', // Teal
    '#a78bfa', // Purple
    '#f87171', // Red
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#60a5fa', // Light blue
    '#f472b6', // Pink
  ];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to pick a color
  return colors[Math.abs(hash) % colors.length];
};

const AvatarContainer = styled.div<{
  $size: string;
  $variant: AvatarVariant;
  $bgColor: string;
  $fontSize: string;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  background-color: ${({ $bgColor }) => $bgColor};
  color: white;
  font-size: ${({ $fontSize }) => $fontSize};
  font-weight: 500;
  user-select: none;
  overflow: hidden;
  flex-shrink: 0;
  
  ${({ $variant }) => getAvatarShape($variant)}
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StatusIndicator = styled.div<{ $size: AvatarSize }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: ${({ $size }) => 
    $size === 'xs' ? '8px' : 
    $size === 'sm' ? '10px' : 
    $size === 'md' ? '12px' : 
    $size === 'lg' ? '14px' : '16px'
  };
  height: ${({ $size }) => 
    $size === 'xs' ? '8px' : 
    $size === 'sm' ? '10px' : 
    $size === 'md' ? '12px' : 
    $size === 'lg' ? '14px' : '16px'
  };
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.status.success};
  border: 2px solid white;
`;

const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  variant = 'circular',
  online,
  color,
  className,
}) => {
  const avatarSize = getAvatarSize(size);
  const fontSize = getFontSize(size);
  const bgColor = color || (name ? getColorFromName(name) : '#3d5afe');
  const initials = name ? getInitials(name) : '';

  return (
    <AvatarContainer
      $size={avatarSize}
      $variant={variant}
      $bgColor={bgColor}
      $fontSize={fontSize}
      title={name}
      className={className}
    >
      {src ? <Image src={src} alt={name || 'avatar'} /> : initials}
      {online && <StatusIndicator $size={size} />}
    </AvatarContainer>
  );
};

export default Avatar;