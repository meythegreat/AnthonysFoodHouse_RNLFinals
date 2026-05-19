import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart'; // We will create this next!

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _pinController = TextEditingController();
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    // 1. Validate inputs
    if (_emailController.text.isEmpty || _pinController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email and 4-digit PIN')),
      );
      return;
    }

    // 2. Show loading spinner
    setState(() { _isLoading = true; });

    try {
      // 3. Attempt to log in via Laravel API
      await _apiService.login(
        _emailController.text.trim(),
        _pinController.text.trim(),
      );

      // 4. If successful, navigate to the Dashboard
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } catch (e) {
      // 5. Show the REAL error from the ApiService
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')), // Shows the true error
            backgroundColor: Colors.red.shade600,
            duration: const Duration(seconds: 4), // Stays on screen a bit longer
          ),
        );
      }
    } finally {
      // 6. Stop loading spinner
      if (mounted) {
        setState(() { _isLoading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Branding
                const Icon(Icons.restaurant, size: 64, color: Colors.green),
                const SizedBox(height: 16),
                const Text(
                  "Anthony's Food House",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
                ),
                const Text(
                  "Mobile Terminal Access",
                  style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),

                // Email Input
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: const Icon(Icons.email_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),

                // 4-Digit PIN Input
                TextField(
                  controller: _pinController,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  maxLength: 4, // Restrict to 4 digits
                  decoration: InputDecoration(
                    labelText: '4-Digit PIN',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: Colors.white,
                    counterText: "", // Hides the '0/4' text below the field
                  ),
                ),
                const SizedBox(height: 32),

                // Login Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade700,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isLoading ? null : _handleLogin,
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Access Terminal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}