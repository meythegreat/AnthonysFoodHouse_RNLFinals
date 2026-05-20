import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/restaurant_models.dart';
import '../services/api_service.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchTables(); 
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

  void _addToCart(ProductItem product) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_cart.containsKey(product)) {
        _cart[product] = _cart[product]! + 1;
      } else {
        _cart[product] = 1;
      }
    });
  }

  void _removeFromCart(ProductItem product) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_cart.containsKey(product)) {
        if (_cart[product]! > 1) {
          _cart[product] = _cart[product]! - 1;
        } else {
          _cart.remove(product);
        }
      }
    });
  }

  double get _cartSubtotal {
    double total = 0.0;
    _cart.forEach((product, quantity) {
      total += (product.price * quantity);
    });
    return total;
  }

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

    // YOUR API LOGIC HERE
    // await ApiService().submitOrder(cart: _cart, tableId: _selectedTable!.id, customer: _customerNameController.text);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order Sent to Kitchen!'), backgroundColor: Colors.green),
    );

    setState(() {
      _cart.clear();
      _customerNameController.text = 'Guest Table';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text(
          'Waiter Terminal',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Colors.green.shade700,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              _fetchProducts();
              _fetchTables();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () { /* Logout logic */ },
          )
        ],
      ),
      body: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              children: [
                _buildCategoryChips(),
                Expanded(
                  child: _isLoadingProducts
                      ? const Center(child: CircularProgressIndicator())
                      : _buildProductGrid(),
                ),
              ],
            ),
          ),
          Container(width: 1, color: Colors.grey.shade300),
          Expanded(
            flex: 1,
            child: _buildCartPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
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
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? Colors.white : Colors.black87,
                  ),
                ),
                selected: isSelected,
                selectedColor: Colors.green.shade700,
                backgroundColor: Colors.grey.shade200,
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
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
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
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 12,
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
                        // PROPERLY FORMATTED ASSET IMAGE LOGIC
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
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '₱${prod.price.toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                              color: Colors.green.shade800,
                              fontWeight: FontWeight.w900,
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
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Order Metadata', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                
                DropdownButtonFormField<DiningTable>(
                  value: _selectedTable,
                  decoration: InputDecoration(
                    labelText: 'Assign Table',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: _tables.isEmpty 
                      ? [const DropdownMenuItem<DiningTable>(value: null, child: Text('Loading tables...'))]
                      : _tables.map((t) => DropdownMenuItem<DiningTable>(
                          value: t, 
                          child: Text(t.name) 
                        )).toList(),
                  onChanged: _tables.isEmpty 
                      ? null 
                      : (val) => setState(() => _selectedTable = val),
                ),
                
                const SizedBox(height: 12),
                TextFormField(
                  controller: _customerNameController,
                  decoration: InputDecoration(
                    labelText: 'Guest Name / Identifier',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                  Text('Active Items Ticket', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                  const SizedBox(height: 16),
                  Expanded(
                    child: _cart.isEmpty
                        ? Center(child: Text('No entries added to ticket.', style: TextStyle(color: Colors.grey.shade400, fontStyle: FontStyle.italic)))
                        : ListView.builder(
                            itemCount: _cart.length,
                            itemBuilder: (context, index) {
                              final prod = _cart.keys.elementAt(index);
                              final qty = _cart[prod]!;
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  border: Border(bottom: BorderSide(color: Colors.grey.shade200, style: BorderStyle.solid)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                                      child: Row(
                                        children: [
                                          IconButton(
                                            icon: const Icon(Icons.remove, size: 16),
                                            onPressed: () => _removeFromCart(prod),
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            padding: EdgeInsets.zero,
                                          ),
                                          Text('$qty', style: GoogleFonts.firaCode(fontWeight: FontWeight.bold)),
                                          IconButton(
                                            icon: const Icon(Icons.add, size: 16),
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
                                          Text(prod.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                          Text('₱${prod.price.toStringAsFixed(2)} each', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '₱${(prod.price * qty).toStringAsFixed(2)}',
                                      style: GoogleFonts.firaCode(fontWeight: FontWeight.bold, fontSize: 15),
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
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Est. Subtotal:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
                    Text(
                      '₱${_cartSubtotal.toStringAsFixed(2)}',
                      style: GoogleFonts.firaCode(fontWeight: FontWeight.w900, fontSize: 24, color: Colors.green.shade800),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _cart.isEmpty ? null : _sendOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade700,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      'Send Order to Kitchen',
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold),
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