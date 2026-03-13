import { Colors } from './colors';

export const Shadows = {
  primary: {
    shadowColor: Colors.brownDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  secondary: {
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  soft: {
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;
