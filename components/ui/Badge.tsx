import styled from 'styled-components';

interface BadgeProps {
  $category: 'basic' | 'skill' | 'ultimate' | string;
  children: React.ReactNode;
}

const StyledBadge = styled.span<BadgeProps>`
  background: ${props => {
    switch(props.$category) {
      case 'basic': return '#10b981';
      case 'skill': return '#3b82f6';
      case 'ultimate': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
`;

export default function Badge({ children, $category }: BadgeProps) {
  return (
    <StyledBadge $category={$category}>
      {children}
    </StyledBadge>
  );
} 