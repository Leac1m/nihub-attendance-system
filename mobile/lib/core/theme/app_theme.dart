import 'package:flutter/material.dart';

/// App color palette matching the React Native NIHUB design
class AppColors {
  AppColors._();

  // Primary purple family
  static const Color primaryDeep = Color(0xFF70008B);   // Darkest purple - headers
  static const Color primary = Color(0xFF8B2CBA);         // Main purple - buttons
  static const Color primaryLight = Color(0xFF8E24AA);     // Lighter purple - accents

  // Secondary and error
  static const Color secondary = Color(0xFF0059BB);        // Links, secondary
  static const Color error = Color(0xFFBA1A1A);           // Error text, deny button

  // Backgrounds
  static const Color bgGradientStart = Color(0xFFF8EDFF); // Auth gradient top
  static const Color bgGradientMid = Color(0xFFFDFDFF);   // Auth gradient mid
  static const Color bgGradientEnd = Color(0xFFFFFFFF);   // Auth gradient bottom / card bg
  static const Color darkBg = Color(0xFF2E3132);          // Scanner background
  static const Color cardBg = Color(0xFFFFFFFF);           // Card background
  static const Color surface = Color(0xFFF8F9FA);          // App bar, search bar bg

  // Text
  static const Color textPrimary = Color(0xFF191C1D);     // Main text
  static const Color textSecondary = Color(0xFF504251);   // Secondary text
  static const Color textMuted = Color(0xFF827282);        // Muted text, placeholders
  static const Color textOnDark = Color(0xFFFFFFFF);       // Text on dark bg

  // Borders & Dividers
  static const Color border = Color(0xFFE5E7EB);          // Default border
  static const Color borderLight = Color(0xFFD3C1D2);     // Light border, input focus
  static const Color borderCard = Color(0xFFE7E8E9);      // Card border

  // Event card accent colors (cycle by index % 4)
  static const List<Color> eventAccents = [
    Color(0xFF70008B), // Purple
    Color(0xFF0059BB), // Blue
    Color(0xFFBA1A1A), // Red
    Color(0xFF705D07), // Yellow
  ];
  static const List<Color> eventBgAccents = [
    Color(0xFFF7E6FB), // Purple bg
    Color(0xFFE4EEFF), // Blue bg
    Color(0xFFFFE4E1), // Red bg
    Color(0xFFFFF4CC), // Yellow bg
  ];

  /// Returns the accent color for event card at given index
  static Color getEventAccent(int index) => eventAccents[index % eventAccents.length];
  static Color getEventBgAccent(int index) => eventBgAccents[index % eventBgAccents.length];

  // Success
  static const Color success = Color(0xFF0070EA);
}

/// App spacing constants
class AppSpacing {
  AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;

  // Common screen padding
  static const double screenHorizontal = 20;

  // Card
  static const double cardPadding = 24;
  static const double cardRadiusLarge = 28;
  static const double cardRadiusMedium = 24;
  static const double cardRadiusSmall = 20;

  // Input
  static const double inputHeight = 56;
  static const double inputRadius = 14;

  // Button
  static const double buttonHeight = 56;
  static const double buttonRadius = 16;
  static const double buttonRadiusLarge = 20;
}

/// App typography
class AppTypography {
  AppTypography._();

  static const String fontFamily = 'Inter';

  // Heading styles
  static TextStyle headlineLarge = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 30,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle headlineMedium = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static TextStyle titleLarge = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColors.primaryDeep,
  );

  static TextStyle titleMedium = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  // Body styles
  static TextStyle bodyLarge = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static TextStyle bodyMedium = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  // Label styles
  static TextStyle labelLarge = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );

  static TextStyle labelMedium = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static TextStyle labelSmall = const TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.textMuted,
    letterSpacing: 1.2,
  );
}

/// BoxShadow helpers matching React Native shadow style
class AppShadows {
  AppShadows._();

  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.06),
      offset: const Offset(0, 10),
      blurRadius: 20,
    ),
  ];

  static List<BoxShadow> buttonShadow(Color color) => [
    BoxShadow(
      color: color.withValues(alpha: 0.22),
      offset: const Offset(0, 6),
      blurRadius: 12,
    ),
  ];
}

/// Gradient backgrounds for auth screens
class AppGradients {
  AppGradients._();

  static const LinearGradient authBackground = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      AppColors.bgGradientStart,
      AppColors.bgGradientMid,
      AppColors.bgGradientEnd,
    ],
  );
}

/// Input decoration theme matching React Native style
InputDecorationTheme buildInputDecorationTheme() {
  return InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFFF3F4F5),
    contentPadding: const EdgeInsets.symmetric(
      horizontal: AppSpacing.lg,
      vertical: AppSpacing.lg,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
      borderSide: const BorderSide(color: AppColors.borderLight),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
      borderSide: const BorderSide(color: AppColors.borderLight),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
      borderSide: const BorderSide(color: AppColors.primaryDeep, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
      borderSide: const BorderSide(color: AppColors.error),
    ),
    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 16),
    labelStyle: const TextStyle(
      color: AppColors.textPrimary,
      fontSize: 14,
      fontWeight: FontWeight.w600,
    ),
  );
}

/// Elevated button theme matching React Native primary button
ElevatedButtonThemeData buildElevatedButtonTheme() {
  return ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
      ),
      textStyle: const TextStyle(
        fontFamily: 'Inter',
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
      elevation: 5,
      shadowColor: AppColors.primary.withValues(alpha: 0.3),
    ),
  );
}

/// Outlined button theme (for deny buttons)
OutlinedButtonThemeData buildOutlinedButtonTheme() {
  return OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.error,
      minimumSize: const Size(double.infinity, AppSpacing.buttonHeight),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
      ),
      side: const BorderSide(color: AppColors.error, width: 2),
    ),
  );
}

/// Full app theme
ThemeData buildAppTheme() {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      error: AppColors.error,
      surface: AppColors.surface,
    ),
    useMaterial3: true,
    fontFamily: AppTypography.fontFamily,
    scaffoldBackgroundColor: AppColors.bgGradientStart,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: AppTypography.fontFamily,
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: AppColors.primaryDeep,
      ),
      iconTheme: IconThemeData(color: AppColors.primaryDeep),
    ),
    cardTheme: CardThemeData(
      color: AppColors.cardBg,
      elevation: 5,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLarge),
      ),
    ),
    elevatedButtonTheme: buildElevatedButtonTheme(),
    outlinedButtonTheme: buildOutlinedButtonTheme(),
    inputDecorationTheme: buildInputDecorationTheme(),
    textTheme: TextTheme(
      headlineLarge: AppTypography.headlineLarge,
      headlineMedium: AppTypography.headlineMedium,
      titleLarge: AppTypography.titleLarge,
      titleMedium: AppTypography.titleMedium,
      bodyLarge: AppTypography.bodyLarge,
      bodyMedium: AppTypography.bodyMedium,
    ),
  );
}