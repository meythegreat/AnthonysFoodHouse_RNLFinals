import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/restaurant_models.dart';

class ApiService {
  String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000/api';
    } else {
      return 'http://127.0.0.1:8000/api';
    }
  }

  Future<Map<String, dynamic>> login(String email, String pin) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email, 'password': pin}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      return data;
    } else {
      throw Exception('Login failed');
    }
  }

  // Action 1: GET All Tables
  Future<List<DiningTable>> getTables() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    final response = await http.get(
      Uri.parse('$baseUrl/tables'),
      headers: {'Authorization': 'Bearer $token', 'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => DiningTable.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load tables');
    }
  }

  // Action 2: GET All Menu Products
  Future<List<ProductItem>> getProducts() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    final response = await http.get(
      Uri.parse('$baseUrl/products'),
      headers: {'Authorization': 'Bearer $token', 'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => ProductItem.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load products');
    }
  }

  // Action 3: POST Submit Order to Kitchen
  Future<bool> submitOrder({
    required String tableNumber,
    required String customerName,
    required List<Map<String, dynamic>> cartItems,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'table_number': tableNumber,
        'customer_name': customerName,
        'order_type': 'Dine In',
        'payment_method': 'Cash', // Default placeholder for waiter app orders
        'cart': cartItems,
      }),
    );

    if (response.statusCode == 201) {
      return true;
    } else {
      print('Checkout failure payload: ${response.body}');
      return false;
    }
  }

  // Action 4: GET Tax Rate
  Future<double> getTaxRate() async {
    try {
      // FIXED: Removed the extra /api since baseUrl already has it!
      // Also added the Accept header to prevent HTML error pages
      final response = await http.get(
        Uri.parse('$baseUrl/tax-rate'),
        headers: {'Accept': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return double.parse(data['tax_rate'].toString());
      } else {
        print('Failed to load tax rate. Status: ${response.statusCode}');
        return 0.01; // Fallback to 1% if it fails
      }
    } catch (e) {
      print('Error fetching tax rate: $e');
      return 0.01; 
    }
  }

  // Action 5: POST Logout (Kill Token)
  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token != null) {
        await http.post(
          Uri.parse('$baseUrl/logout'),
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
          },
        );
        // Clear the token locally regardless of API response
        await prefs.remove('token');
      }
    } catch (e) {
      print('Error during logout: $e');
    }
  }
  
}