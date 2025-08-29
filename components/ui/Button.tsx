import styled from 'styled-components';

interface ButtonProps {
  $primary?: boolean;
  $disabled?: boolean;
  $active?: boolean;
  children: React.ReactNode;
  onClick?: (event?: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const StyledButton = styled.button<ButtonProps>`
  background: ${props => {
    if (props.$disabled) return props.theme.colors.surface.border;
    if (props.$primary) return props.theme.gradients.accent;
    if (props.$active) return 'linear-gradient(145deg, #4a90e2, #5dd3e8)';
    return 'transparent';
  }};
  border: ${props => props.$active 
    ? '2px solid transparent' 
    : `2px solid ${props.theme.colors.surface.border}`};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  color: ${props => {
    if (props.$active) return '#ffffff';
    if (props.$primary) return props.theme.colors.text.primary;
    return props.theme.colors.text.secondary;
  }};
  font-weight: ${props => props.$active ? 'bold' : '500'};
  font-size: 0.9rem;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$active) return 'linear-gradient(145deg, #5dd3e8, #4a90e2)';
      if (props.$primary) return props.theme.gradients.accent;
      return 'linear-gradient(145deg, #343a4d, #2a3142)';
    }};
    color: ${props => props.theme.colors.text.primary};
    border-color: ${props => props.$active 
      ? 'transparent' 
      : props.theme.colors.accent.cyan};
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function Button({ children, onClick, style, ...props }: ButtonProps) {
  return (
    <StyledButton {...props} onClick={onClick} style={style}>
      {children}
    </StyledButton>
  );
} 