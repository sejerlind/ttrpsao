import styled from 'styled-components';

interface FloatingTextProps {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'effect' | 'error';
}

interface FloatingTextListProps {
  texts: FloatingTextProps[];
}

const FloatingTextElement = styled.div<{ $x: number; $y: number; $type: 'damage' | 'heal' | 'effect' | 'error' }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  color: ${props => {
    switch(props.$type) {
      case 'damage': return '#ef4444';
      case 'heal': return '#10b981';
      case 'effect': return '#3b82f6';
      case 'error': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
  font-weight: bold;
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 2000;
  animation: floatUp 2s ease-out forwards;

  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-100px);
    }
  }
`;

export default function FloatingTextList({ texts }: FloatingTextListProps) {
  return (
    <>
      {texts.map(text => (
        <FloatingTextElement
          key={text.id}
          $x={text.x}
          $y={text.y}
          $type={text.type}
        >
          {text.text}
        </FloatingTextElement>
      ))}
    </>
  );
} 