import 'styled-components';
import { Theme } from './app/player/[id]/theme';
 
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
