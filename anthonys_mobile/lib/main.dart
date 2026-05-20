import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart'; // <-- Connects to your login screen file

void main() {
  runApp(const AnthonysApp());
}

class AnthonysApp extends StatelessWidget {
  const AnthonysApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Anthony\'s Mobile',
      debugShowCheckedModeBanner: false, // Hides the red debug banner on the top right
      theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFE65100), // A warm, appetizing restaurant orange
        brightness: Brightness.light,
      ),
      textTheme: GoogleFonts.poppinsTextTheme(), // Poppins looks incredibly clean for POS
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
    ),
      home: const LoginScreen(), // <-- Boots the app straight into your custom login screen
    );
  }
}