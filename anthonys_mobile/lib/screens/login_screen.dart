import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_service.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Pre-filled email so you don't have to type it during your defense!
  final TextEditingController _emailController = TextEditingController(text: 'miguel@test.com');
  final ApiService _apiService = ApiService();
  
  String _pin = '';
  bool _isLoading = false;
  String _errorMessage = '';

  // --- PIN PAD LOGIC ---
  void _onNumberTapped(String number) {
    if (_pin.length < 4) {
      HapticFeedback.lightImpact();
      setState(() {
        _pin += number;
        _errorMessage = ''; // Clear errors when typing
      });

      // Auto-submit when the 4th digit is entered!
      if (_pin.length == 4) {
        _handleLogin();
      }
    }
  }

  void _onBackspaceTapped() {
    if (_pin.isNotEmpty) {
      HapticFeedback.selectionClick();
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
        _errorMessage = '';
      });
    }
  }

  // --- API LOGIN CALL ---
  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    
    if (email.isEmpty) {
      setState(() => _errorMessage = 'Please enter an email.');
      setState(() => _pin = '');
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Call your Laravel API
      await _apiService.login(email, _pin);
      
      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } catch (e) {
      HapticFeedback.vibrate();
      setState(() {
        _isLoading = false;
        _pin = ''; // Clear PIN so they can try again instantly
        // Uses your exact logic to show the true error message!
        _errorMessage = e.toString().replaceAll('Exception: ', ''); 
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Responsive check so it looks great on both phones and tablets
    final isWideScreen = MediaQuery.of(context).size.width > 600;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            width: isWideScreen ? 450 : double.infinity,
            padding: EdgeInsets.symmetric(horizontal: isWideScreen ? 0 : 24),
            child: Card(
              elevation: isWideScreen ? 8 : 0,
              color: isWideScreen ? Colors.white : Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: EdgeInsets.all(isWideScreen ? 40.0 : 0.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // --- BRANDING ---
                    Image.asset(
                      'assets/anthonys-logo.png',
                      height: 100,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        // Fallback icon just in case the file name is misspelled or missing
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.green.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.restaurant, size: 48, color: Colors.green.shade700),
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      "Anthony's Food House",
                      style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      "Mobile Terminal Access",
                      style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 32),

                    // --- EMAIL INPUT ---
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Employee Email',
                        prefixIcon: const Icon(Icons.email_outlined),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // --- ERROR MESSAGE ---
                    if (_errorMessage.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: Text(
                          _errorMessage,
                          style: GoogleFonts.poppins(color: Colors.red.shade600, fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    // --- 4 PIN DOTS ---
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(4, (index) {
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 12),
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: index < _pin.length ? Colors.green.shade700 : Colors.grey.shade200,
                            border: Border.all(
                              color: index < _pin.length ? Colors.green.shade700 : Colors.grey.shade400,
                              width: 2,
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 32),

                    // --- CUSTOM NUMPAD ---
                    if (_isLoading)
                      Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(color: Colors.green.shade700),
                      )
                    else
                      Column(
                        children: [
                          _buildNumberRow(['1', '2', '3']),
                          const SizedBox(height: 16),
                          _buildNumberRow(['4', '5', '6']),
                          const SizedBox(height: 16),
                          _buildNumberRow(['7', '8', '9']),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              const SizedBox(width: 70, height: 70), // Empty space spacer
                              _buildNumberButton('0'),
                              _buildBackspaceButton(),
                            ],
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Numpad Row Helper
  Widget _buildNumberRow(List<String> numbers) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: numbers.map((num) => _buildNumberButton(num)).toList(),
    );
  }

  // Numpad Button Helper
  Widget _buildNumberButton(String number) {
    return InkWell(
      onTap: () => _onNumberTapped(number),
      borderRadius: BorderRadius.circular(35),
      child: Container(
        width: 70,
        height: 70,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          number,
          style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w600, color: Colors.black87),
        ),
      ),
    );
  }

  // Backspace Button Helper
  Widget _buildBackspaceButton() {
    return InkWell(
      onTap: _onBackspaceTapped,
      borderRadius: BorderRadius.circular(35),
      child: Container(
        width: 70,
        height: 70,
        alignment: Alignment.center,
        child: const Icon(Icons.backspace_outlined, size: 28, color: Colors.black54),
      ),
    );
  }
}