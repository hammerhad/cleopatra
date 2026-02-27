import { Platform } from 'react-native';

export const FontFamily = {
  // Display / Headings — regal serif
  DISPLAY: 'CormorantGaramond_700Bold',
  DISPLAY_MEDIUM: 'CormorantGaramond_600SemiBold',
  DISPLAY_ITALIC: 'CormorantGaramond_700Bold_Italic',

  // Body — clean sans-serif
  BODY: 'Inter_400Regular',
  BODY_MEDIUM: 'Inter_500Medium',
  BODY_SEMIBOLD: 'Inter_600SemiBold',
  BODY_BOLD: 'Inter_700Bold',

  // Mono — numbers / stats
  MONO: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
} as const;

export const FontSize = {
  // Display
  D1: 48,  // hero / splash
  D2: 40,  // screen title
  D3: 32,  // section hero

  // Headings
  H1: 28,
  H2: 24,
  H3: 20,
  H4: 18,

  // Body
  BODY_LG: 16,
  BODY_MD: 15,
  BODY_SM: 14,

  // Caption / Label
  LABEL: 13,
  CAPTION: 12,
  MICRO: 10,
} as const;

export const LineHeight = {
  TIGHT: 1.1,
  NORMAL: 1.4,
  RELAXED: 1.6,
  LOOSE: 1.8,
} as const;

export const LetterSpacing = {
  TIGHT: -0.5,
  NORMAL: 0,
  WIDE: 0.5,
  WIDER: 1.0,
  WIDEST: 2.0,  // for all-caps labels
} as const;

// Pre-composed text styles
export const TextStyles = {
  heroTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.D1,
    letterSpacing: LetterSpacing.TIGHT,
    lineHeight: FontSize.D1 * LineHeight.TIGHT,
  },
  screenTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.D2,
    letterSpacing: LetterSpacing.TIGHT,
  },
  sectionTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    letterSpacing: LetterSpacing.TIGHT,
  },
  cardTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
  },
  label: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    lineHeight: FontSize.BODY_MD * LineHeight.RELAXED,
  },
  bodyMedium: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_MD,
  },
  caption: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    lineHeight: FontSize.CAPTION * LineHeight.RELAXED,
  },
  stat: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.D3,
    letterSpacing: LetterSpacing.TIGHT,
  },
  button: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_LG,
    letterSpacing: LetterSpacing.WIDER,
  },
  buttonSmall: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    letterSpacing: LetterSpacing.WIDER,
  },
} as const;
