export const APP_COLORS = {
  // ==========================================
  // 1. CORE BRAND IDENTITY TOKENS
  // ==========================================

  /**
   * Primary action triggers.
   * WHEN: The element represents the main functional goal of the screen, or is actively focused by the user.
   * WHERE: Main CTA buttons, active screen header backgrounds, selected navigation tab icons, focused text input borders.
   */
  primary: "#5a80ab",

  primaryPressed : "#456385",

  /**
   * Branded structural containers.
   * WHEN: Subtle brand highlighting is needed without overwhelming high-emphasis dark colors, or as immediate micro-feedback during click states.
   * WHERE: Selected row menus, list/settings items background on press, tag backgrounds (e.g., user role badges), contextual info box fills.
   */
  primarySoft: "#eaf1f8",

  // ==========================================
  // 2. SEMANTIC OPERATIONAL STATUS TOKENS
  // ==========================================

  /**
   * Positive execution flags.
   * WHEN: An item is operational, online, successfully verified, complete, or enabled.
   * WHERE: Active/Online status indicator dots, "Unlocked" text and icon signals, completed system tasks, successful payload save alerts.
   */
  success: "#10a37f",

  /**
   * Active state layout framing.
   * WHEN: Highlighting an entire block or badge card container that represents a safe or completed state.
   * WHERE: Background banner fills behind positive status blocks, subtle badges surrounding a successful operation message.
   */
  successSoft: "#e6f7f3",

  /**
   * Destructive actions and structural blockers.
   * WHEN: An element causes data deletion, is blocked/locked, represents a critical failure, or has failed validation checks.
   * WHERE: "Delete" / "Remove" button fills, "Locked" account status text and icons, validation error text blocks under form fields.
   */
  error: "#dc4c4c",

  /**
   * Alert state layout framing.
   * WHEN: Wrapping layout elements or message alerts that contain a severe error, blockage, or critical restriction reminder.
   * WHERE: Background canvas wash for critical alerts, modal warnings, or container cells for locked out records.
   */
  errorSoft: "#fceaea",

  /**
   * Transitory queues or non-blocking alerts.
   * WHEN: An asset requires maintenance, is pending confirmation, is on a warning threshold, or running a network retry loop.
   * WHERE: "Pending" task rows, "Out of fuel" vehicle alerts, unsaved form changes indicators, connection retry warnings.
   */
  warning: "#df8a14",

  /**
   * Warning state layout framing.
   * WHEN: Encapsulating data fields or alert notification segments that warn the user of a pending system status.
   * WHERE: Subtle backdrop background washes behind pending state badges or warning notification card headers.
   */
  warningSoft: "#fef3e2",

  // ==========================================
  // 3. NEUTRAL CANVAS & WIREFRAME LAYOUTS
  // ==========================================

  /**
   * Full-screen root wrapper background.
   * WHEN: Initializing the absolute root layout framework canvas for any feature screen.
   * WHERE: Main canvas background for `<SafeAreaView>` or base container views. Crucial to make white inner card blocks pop out.
   */
  background: "#f3f7fb",

  /**
   * Floating layer containers.
   * WHEN: Building an individual layout box, surface card, form element card, or clickable component body block.
   * WHERE: Inner body background for list cards, form containers, profile detail tiles, and text input boxes.
   */
  card: "#FFFFFF",

  /**
   * Form Field & Text Input Backgrounds.
   * WHEN: Creating interactive fields where a user actively inputs text data, and you want to prevent blinding white glare over pure white card layouts.
   * WHERE: The background property inside a text input container box, dynamic search inputs, and text fields within a form card.
   */
  inputBackground: "#f8fafc",

  /**
   * Subtle grid structural dividers.
   * WHEN: Framing component boundaries, splitting list indexes, or drawing baseline structural constraints.
   * WHERE: Inner component border wrappers, thin 0.5px line dividers separating list items, unfocused input boxes outlines.
   */
  border: "#d9e6f7",

  // ==========================================
  // 4. TYPOGRAPHIC CONTEXT TOKENS
  // ==========================================

  /**
   * Primary focal point typography.
   * WHEN: Displaying the absolute highest priority text piece that the user's eyes must look at first.
   * WHERE: Full names, main page header titles, primary card numbers, large navigation text. (Maximum readability weight).
   */
  textPrimary: "#0F172A",

  /**
   * Secondary description metadata.
   * WHEN: Displaying contextual help details, subtext, or supporting data fields that supplement primary titles.
   * WHERE: User emails, license plate values, phone fields, sub-labels, inline status captions. (Optimized for quick scanning on mobile).
   */
  textSecondary: "#334155",

  /**
   * Muted accessory decoration.
   * WHEN: Rendering non-readable decorative shapes, text placeholder hints, inactive button copy, or low-priority background tags.
   * WHERE: Structural icons (e.g., mail/phone outlines), input field placeholder hints, disabled buttons, date timestamp logs.
   */
  textMuted: "#94A3B8",
};
