import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/restaurant_models.dart';
import '../services/api_service.dart';

import 'package:shared_preferences/shared_preferences.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<ProductItem> _products = [];
  bool _isLoadingProducts = true;
  
  List<DiningTable> _tables = [];
  DiningTable? _selectedTable; 

  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Silog', 'Sizzling Menu', 'Soup', 'Drinks'];
  
  final Map<ProductItem, int> _cart = {}; 
  final TextEditingController _customerNameController = TextEditingController(text: 'Guest Table');
  // NEW LINE: This will hold the "setState" specifically for the mobile bottom sheet
  StateSetter? _bottomSheetState;

  // --- DYNAMIC TAX RATE ---
  // Defaults to 1% (0.01) but will instantly update when _fetchTaxRate() hits Laravel
  double _taxRate = 0.01; 

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchTables(); 
    _fetchTaxRate(); // Automatically pull the live global VAT on boot
  }

  Future<void> _fetchProducts() async {
    try {
      final products = await ApiService().getProducts();
      setState(() { 
        _products = products; 
        _isLoadingProducts = false; 
      });
    } catch (e) {
      print("Error fetching menu: $e");
      setState(() => _isLoadingProducts = false);
    }
  }

  Future<void> _fetchTables() async {
    try {
      final tables = await ApiService().getTables();
      setState(() {
        _tables = tables;
        if (_tables.isNotEmpty) {
          _selectedTable = _tables.first;
        }
      });
    } catch (e) {
      print("Error fetching tables: $e");
    }
  }

  // --- NEW: FETCH TAX RATE FROM LARAVEL ---
  Future<void> _fetchTaxRate() async {
    try {
      final rate = await ApiService().getTaxRate();
      setState(() {
        _taxRate = rate;
      });
    } catch (e) {
      print("Error setting tax state: $e");
    }
  }

  void _addToCart(ProductItem product) {
    HapticFeedback.lightImpact();
    
    // 1. Update the main screen
    setState(() {
      if (_cart.containsKey(product)) {
        _cart[product] = _cart[product]! + 1;
      } else {
        _cart[product] = 1;
      }
    });

    // 2. NEW: If the mobile bottom sheet is open, force it to redraw too!
    if (_bottomSheetState != null) {
      _bottomSheetState!((){});
    }
  }

  void _removeFromCart(ProductItem product) {
    HapticFeedback.lightImpact();
    
    // 1. Update the main screen
    setState(() {
      if (_cart.containsKey(product)) {
        if (_cart[product]! > 1) {
          _cart[product] = _cart[product]! - 1;
        } else {
          _cart.remove(product);
        }
      }
    });

    // 2. NEW: If the mobile bottom sheet is open, force it to redraw too!
    if (_bottomSheetState != null) {
      _bottomSheetState!((){});
    }
  }

  // --- Financial Math Calculations ---
  double get _cartSubtotal {
    double total = 0.0;
    _cart.forEach((product, quantity) {
      total += (product.price * quantity);
    });
    return total;
  }

  double get _cartTax => _cartSubtotal * _taxRate;

  double get _cartTotal => _cartSubtotal + _cartTax;

  Future<void> _sendOrder() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot send an empty order!'), backgroundColor: Colors.red),
      );
      return;
    }

    if (_selectedTable == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait for tables to load or select a table.'), backgroundColor: Colors.orange),
      );
      return;
    }

    HapticFeedback.heavyImpact();

    final cartList = _cart.entries.map((entry) {
      return {
        'id': entry.key.id,
        'quantity': entry.value,
      };
    }).toList();

    bool success = await ApiService().submitOrder(
      tableNumber: _selectedTable!.name,
      customerName: _customerNameController.text,
      cartItems: cartList,
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order Sent to Kitchen!'), backgroundColor: Colors.green),
      );

      setState(() {
        _cart.clear();
        _customerNameController.text = 'Guest Table';
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send order. Check server.'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _handleLogout() async {
    HapticFeedback.mediumImpact();
    
    // 1. Show a confirmation dialog
    bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Logout', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to exit the Waiter Terminal?', style: GoogleFonts.poppins()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    // 2. If they click "Logout", execute the kill sequence
    if (confirm == true) {
      // Call the API service to destroy the token
      await ApiService().logout();

      // Clear local state
      if (mounted) {
        // Kick them back to the login screen! 
        // NOTE: Change '/login' to whatever your initial route or Login Screen is named!
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
      }
    }
  }

  // ==========================================
  // RESPONSIVE BUILD METHOD
  // ==========================================
  @override
  Widget build(BuildContext context) {
    // Determine if the screen is wide (Tablet/Web) or narrow (Phone)
    final isWideScreen = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8), 
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.point_of_sale, color: Colors.white),
            const SizedBox(width: 12),
            Text(
              'Waiter Terminal',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              _fetchProducts();
              _fetchTables();
              _fetchTaxRate(); // Refresh grabs the latest tax rate too!
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () { _handleLogout(); },
          )
        ],
      ),
      
      // DYNAMIC BODY (Row on Tablet, Full Menu on Phone)
      body: isWideScreen
          ? Row(
              children: [
                Expanded(flex: 2, child: _buildMenuSection()),
                Container(width: 1, color: Colors.grey.shade300),
                Expanded(flex: 1, child: _buildCartPanel()),
              ],
            )
          : _buildMenuSection(),

      // FLOATING CART BUTTON (Only shows on narrow phones)
      floatingActionButton: isWideScreen 
          ? null 
          : FloatingActionButton.extended(
              onPressed: () => _showMobileCartSheet(context),
              backgroundColor: Colors.green.shade800,
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: Text(
                '${_cart.length} Items  •  ₱${_cartTotal.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  // ==========================================
  // HELPER WIDGETS
  // ==========================================

  // Wrapped the menu into a helper so both phone and tablet can use it
  Widget _buildMenuSection() {
    return Column(
      children: [
        _buildCategoryChips(),
        Expanded(
          child: _isLoadingProducts
              ? const Center(child: CircularProgressIndicator())
              : _buildProductGrid(),
        ),
      ],
    );
  }

  // Slide-up bottom sheet for the cart on small phones
  void _showMobileCartSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true, 
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            
            _bottomSheetState = setModalState; // <--- NEW: Save the state reference!

            return FractionallySizedBox(
              heightFactor: 0.85, 
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Scaffold( 
                  backgroundColor: Colors.white,
                  body: _buildCartPanel()
                ),
              ),
            );
          }
        );
      },
    ).whenComplete(() {
      _bottomSheetState = null; // <--- NEW: Clear the reference when closed
      setState(() {}); 
    });
  }

  Widget _buildCategoryChips() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _categories.map((category) {
            final isSelected = _selectedCategory == category;
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: ChoiceChip(
                label: Text(
                  category,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? Colors.white : Colors.black87,
                  ),
                ),
                selected: isSelected,
                selectedColor: Colors.green.shade700,
                backgroundColor: Colors.grey.shade100,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                side: BorderSide(color: isSelected ? Colors.green.shade700 : Colors.grey.shade300),
                onSelected: (selected) {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedCategory = category);
                },
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildProductGrid() {
    final displayedProducts = _selectedCategory == 'All' 
        ? _products 
        : _products.where((p) => p.category == _selectedCategory).toList();

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      // NEW: Responsive grid columns (3 for tablet, 2 for phone)
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2, 
        childAspectRatio: 0.85,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: displayedProducts.length,
      itemBuilder: (context, index) {
        final prod = displayedProducts[index];
        final countInCart = _cart[prod] ?? 0;

        return GestureDetector(
          onTap: () => _addToCart(prod),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    flex: 3,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        prod.imagePath != null
                            ? Image.asset(
                                'assets/${prod.imagePath}',
                                fit: BoxFit.cover,
                                errorBuilder: (c, e, s) => Container(color: Colors.grey.shade100, child: const Icon(Icons.restaurant, size: 40, color: Colors.grey)),
                              )
                            : Container(color: Colors.grey.shade100, child: const Icon(Icons.restaurant, size: 40, color: Colors.grey)),
                        
                        if (countInCart > 0)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.green.shade700,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(0, 2))],
                              ),
                              child: Text(
                                '$countInCart',
                                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ),
                          )
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            prod.name,
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.black87),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '₱${prod.price.toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                              color: Colors.green.shade800,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCartPanel() {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.assignment, color: Colors.green.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text('Order Details', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 16),
                
                DropdownButtonFormField<DiningTable>(
                  value: _selectedTable,
                  decoration: InputDecoration(
                    labelText: 'Assign Table',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  items: _tables.isEmpty 
                      ? [const DropdownMenuItem<DiningTable>(value: null, child: Text('Loading tables...'))]
                      : _tables.map((t) => DropdownMenuItem<DiningTable>(
                          value: t, 
                          child: Text(t.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500)) 
                        )).toList(),
                  onChanged: _tables.isEmpty ? null : (val) => setState(() => _selectedTable = val),
                ),
                
                const SizedBox(height: 12),
                TextFormField(
                  controller: _customerNameController,
                  decoration: InputDecoration(
                    labelText: 'Guest Name / Identifier',
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    prefixIcon: Icon(Icons.person_outline, color: Colors.grey.shade500),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: Container(
              color: const Color(0xFFFDFDFD),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Current Ticket', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                  const SizedBox(height: 16),
                  Expanded(
                    child: _cart.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.receipt_long, size: 48, color: Colors.grey.shade300),
                                const SizedBox(height: 12),
                                Text('No items added yet', style: TextStyle(color: Colors.grey.shade400, fontStyle: FontStyle.italic)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            itemCount: _cart.length,
                            itemBuilder: (context, index) {
                              final prod = _cart.keys.elementAt(index);
                              final qty = _cart[prod]!;
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade50, 
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.green.shade100)
                                      ),
                                      child: Row(
                                        children: [
                                          IconButton(
                                            icon: Icon(Icons.remove, size: 16, color: Colors.green.shade800),
                                            onPressed: () => _removeFromCart(prod),
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            padding: EdgeInsets.zero,
                                          ),
                                          Text('$qty', style: GoogleFonts.firaCode(fontWeight: FontWeight.bold, color: Colors.green.shade900)),
                                          IconButton(
                                            icon: Icon(Icons.add, size: 16, color: Colors.green.shade800),
                                            onPressed: () => _addToCart(prod),
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            padding: EdgeInsets.zero,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(prod.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                                          Text('₱${prod.price.toStringAsFixed(2)} each', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '₱${(prod.price * qty).toStringAsFixed(2)}',
                                      style: GoogleFonts.firaCode(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -4))],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Subtotal', style: GoogleFonts.poppins(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
                    Text('₱${_cartSubtotal.toStringAsFixed(2)}', style: GoogleFonts.firaCode(color: Colors.grey.shade700)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('VAT (${(_taxRate * 100).toInt()}%)', style: GoogleFonts.poppins(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
                    Text('₱${_cartTax.toStringAsFixed(2)}', style: GoogleFonts.firaCode(color: Colors.grey.shade700)),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                  child: Divider(color: Colors.grey.shade200, thickness: 1.5),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87)),
                    Text(
                      '₱${_cartTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.firaCode(fontWeight: FontWeight.w900, fontSize: 26, color: Colors.green.shade800),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _cart.isEmpty ? null : _sendOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade700,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), 
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.send, size: 20),
                        const SizedBox(width: 8),
                        Text('Send Order to Kitchen', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}