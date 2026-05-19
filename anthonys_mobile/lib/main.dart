import 'package:flutter/material.dart';
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
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const LoginScreen(), // <-- Boots the app straight into your custom login screen
    );
  }
}