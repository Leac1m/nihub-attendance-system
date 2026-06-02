# Keep mobile_scanner classes
-keep class dev.steenbakker.mobile_scanner.** { *; }

# Keep Google ML Kit and Play Services (required for barcode detection)
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep CameraX core classes if you experience camera initialization crashes
-keep public class androidx.camera.** { *; }
