import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * MG preset dla PrimeNG (styled mode).
 *
 * Założenia:
 * - Źródłem prawdy o kolorach są Wasze CSS vars: --mg-*
 * - Prime generuje swoje CSS vars (--p-*) z design tokenów.
 * - My ustawiamy design tokeny tak, aby wskazywały na --mg-* (lub color-mix wokół nich).
 *
 * Uwaga: część tokenów w Aura jest definiowana pod semantic.colorScheme.light/dark.
 * Jeśli tego nie zachowasz, override bywa ignorowany (priorytet ma colorScheme). (PrimeNG docs)
 */
const mg = {
  primary: 'var(--mg-color-primary)',
  secondary: 'var(--mg-color-secondary)',
  bg: 'var(--mg-color-bg)',
  surface: 'var(--mg-color-bg-surface)',
  border: 'var(--mg-color-border)',
  text: 'var(--mg-color-text)',
  textMuted: 'var(--mg-color-text-muted)',
  ink: 'var(--mg-color-ink)',
  white: 'var(--mg-color-white)',
  black: 'var(--mg-color-black)',
  info: 'var(--mg-color-info)',
  success: 'var(--mg-color-success)',
  danger: 'var(--mg-color-danger)',
  arcane: 'var(--mg-color-arcane)',
};

function tint(color: string, percentToWhite: number): string {
  // percentToWhite: 0..100
  return `color-mix(in srgb, ${color} ${100 - percentToWhite}%, white)`;
}

function shade(color: string, percentToBlack: number): string {
  // percentToBlack: 0..100
  return `color-mix(in srgb, ${color} ${100 - percentToBlack}%, black)`;
}

/**
 * Skala 50..950 dla "primary".
 * Prime bardzo często używa primary.500 jako "primary.color".
 * Wartości są runtime (color-mix + var()) więc kompatybilne z Waszym podejściem.
 */
const primaryScale = {
  50: tint(mg.primary, 92),
  100: tint(mg.primary, 84),
  200: tint(mg.primary, 72),
  300: tint(mg.primary, 58),
  400: tint(mg.primary, 36),
  500: mg.primary,
  600: shade(mg.primary, 14),
  700: shade(mg.primary, 26),
  800: shade(mg.primary, 40),
  900: shade(mg.primary, 56),
  950: shade(mg.primary, 70),
};

/**
 * Surface skala w Prime ma znaczenie semantyczne i bywa używana na tekst również.
 */
const surfaceScaleLight = {
  0: mg.surface,
  50: tint(mg.surface, 65),
  100: tint(mg.surface, 52),
  200: tint(mg.surface, 38),
  300: tint(mg.surface, 22),
  400: tint(mg.surface, 10),
  500: mg.surface,
  600: shade(mg.surface, 10),
  700: shade(mg.surface, 22),
  800: shade(mg.surface, 38),
  900: mg.ink,
  950: mg.black,
};

const surfaceScaleDark = {
  0: mg.text,
  50: `color-mix(in srgb, ${mg.text} 92%, ${mg.surface})`,
  100: `color-mix(in srgb, ${mg.text} 84%, ${mg.surface})`,
  200: `color-mix(in srgb, ${mg.text} 72%, ${mg.surface})`,
  300: `color-mix(in srgb, ${mg.text} 58%, ${mg.surface})`,
  400: `color-mix(in srgb, ${mg.text} 36%, ${mg.surface})`,
  500: `color-mix(in srgb, ${mg.text} 22%, ${mg.surface})`,
  600: `color-mix(in srgb, ${mg.text} 14%, ${mg.surface})`,
  700: `color-mix(in srgb, ${mg.text} 10%, ${mg.surface})`,
  800: `color-mix(in srgb, ${mg.text} 6%, ${mg.surface})`,
  900: mg.surface,
  950: shade(mg.surface, 18),
};

export const MgPrimePreset = definePreset(Aura, {
  semantic: {
    // Primary palette — globalnie
    primary: primaryScale,

    // Focus ring — spójnie z Waszym secondary/primary
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
    },

    /**
     * Najważniejsze: zachowujemy strukturę colorScheme, żeby override nie był ignorowany.
     */
    colorScheme: {
      light: {
        semantic: {
          // Surface palette
          surface: surfaceScaleLight,

          // Tekst / border / tła - spinamy pod Wasze tokeny
          textColor: mg.text,
          textMutedColor: mg.textMuted,
          borderColor: mg.border,

          // Highlight
          highlight: {
            background: tint(mg.primary, 88),
            color: mg.ink,
          },

          // FormField
          formField: {
            background: mg.bg,
            borderColor: mg.border,
            hoverBorderColor: '{primary.color}',
            focusBorderColor: '{primary.color}',
            color: mg.text,
            placeholderColor: mg.textMuted,
          },

          /**
           * SEMANTICS — TU MUSZĄ SIEDZIEĆ, żeby Aura ich nie nadpisała.
           * PROJECT RULE: warn = arcane
           */
          info: { color: mg.info },
          success: { color: mg.success },
          danger: { color: mg.danger },
          warn: { color: mg.arcane },
          help: { color: mg.arcane },
        },
      },

      dark: {
        semantic: {
          surface: surfaceScaleDark,
          textColor: mg.text,
          textMutedColor: mg.textMuted,
          borderColor: mg.border,

          highlight: {
            background: tint(mg.primary, 78),
            color: mg.text,
          },

          formField: {
            background: mg.bg,
            borderColor: mg.border,
            hoverBorderColor: '{primary.color}',
            focusBorderColor: '{primary.color}',
            color: mg.text,
            placeholderColor: mg.textMuted,
          },

          /**
           * SEMANTICS — jw.
           * PROJECT RULE: warn = arcane
           */
          info: { color: mg.info },
          success: { color: mg.success },
          danger: { color: mg.danger },
          warn: { color: mg.arcane },
          help: { color: mg.arcane },
        },
      },
    },

    // Zostawiamy też na top-level jako “belt & suspenders”.
    // Jeśli Aura nie definiuje któregoś semantyka w colorScheme, to i tak zadziała.
    info: { color: mg.info },
    success: { color: mg.success },
    danger: { color: mg.danger },
    warn: { color: mg.arcane },
    help: { color: mg.arcane },
  },

  /**
   * Opcjonalnie: component tokens.
   * Radii zostawiam jak było.
   */
  components: {
    button: {
      root: {
        borderRadius: '10px',
      },
    },
    inputtext: {
      root: {
        borderRadius: '6px',
      },
    },
  },
});
