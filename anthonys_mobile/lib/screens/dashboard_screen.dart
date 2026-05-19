import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/restaurant_models.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  
  List<DiningTable> _tables = [];
  List<ProductItem> _products = [];
  String _selectedCategory = 'All';
  
  String? _selectedTable;
  final TextEditingController _customerController = TextEditingController(text: 'Guest Table');
  final Map<ProductItem, int> _cart = {};
  
  bool _isLoading = true;

  // Base URL mapping for images fetched from Laravel's public storage symlink
  String get imageServerUrl => 'assets';

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    try {
      final tablesData = await _apiService.getTables();
      final productsData = await _apiService.getProducts();
      setState(() {
        _tables = tablesData;
        _products = productsData;
        if (_tables.isNotEmpty && _selectedTable == null) {
          _selectedTable = _tables.first.name;
        }
        _isLoading = false;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load restaurant data: $e')),
      );
    }
  }

  void _addToCart(ProductItem product) {
    setState(() {
      _cart[product] = (_cart[product] ?? 0) + 1;
    });
  }

  void _removeFromCart(ProductItem product) {
    setState(() {
      if (_cart.containsKey(product)) {
        int currentCount = _cart[product]!;
        if (currentCount > 1) {
          _cart[product] = currentCount - 1;
        } else {
          _cart.remove(product);
        }
      }
    });
  }

  double _calculateSubtotal() {
    return _cart.entries.fold(0.0, (sum, entry) => sum + (entry.key.price * entry.value));
  }

  int _getCartTotalItemCount() {
    return _cart.values.fold(0, (sum, count) => sum + count);
  }

  Future<void> _handleOrderDispatch() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot dispatch an empty order ticket.')),
      );
      return;
    }

    setState(() { _isLoading = true; });

    List<Map<String, dynamic>> structuralCart = _cart.entries.map((entry) {
      return {
        'id': entry.key.id,
        'quantity': entry.value,
      };
    }).toList();

    final success = await _apiService.submitOrder(
      tableNumber: _selectedTable ?? 'Table 1',
      customerName: _customerController.text.trim(),
      cartItems: structuralCart,
    );

    setState(() { _isLoading = false; });

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Success: Order dispatched to KDS queue!'), backgroundColor: Colors.green),
      );
      setState(() {
        _cart.clear();
        _customerController.text = 'Guest Table';
      });
      _fetchInitialData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error: Failed to process order payload.'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    bool isMobile = screenWidth < 750;

    final uniqueCategories = ['All', ..._products.map((p) => p.category).toSet()];
    final displayedProducts = _selectedCategory == 'All' 
        ? _products 
        : _products.where((p) => p.category == _selectedCategory).toList();

    // --- SUB-WIDGET 1: Menu Explorer Row/Grid Layout ---
    Widget catalogSection = Column(
      children: [
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: uniqueCategories.length,
            itemBuilder: (context, index) {
              final catName = uniqueCategories[index];
              final isSel = _selectedCategory == catName;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: ChoiceChip(
                  label: Text(catName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  selected: isSel,
                  selectedColor: Colors.green.shade600,
                  labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black),
                  onSelected: (_) => setState(() => _selectedCategory = catName),
                ),
              );
            },
          ),
        ),
        Expanded(
          child: isMobile 
              ? ListView.builder(
                  padding: const EdgeInsets.all(8.0),
                  itemCount: displayedProducts.length,
                  itemBuilder: (context, index) {
                    final prod = displayedProducts[index];
                    final countInCart = _cart[prod] ?? 0;
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 2.0),
                      elevation: 1,
                      child: ListTile(
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: SizedBox(
                            width: 50,
                            height: 50,
                            child: prod.imagePath != null
                                ? Image.network(
                                    '$imageServerUrl/${prod.imagePath}',
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, e, s) => Container(color: Colors.grey.shade200, child: const Icon(Icons.restaurant, color: Colors.green)),
                                  )
                                : Container(color: Colors.grey.shade200, child: const Icon(Icons.restaurant, color: Colors.green)),
                          ),
                        ),
                        title: Text(prod.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: Text('₱${prod.price.toStringAsFixed(2)}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (countInCart > 0) ...[
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                                onPressed: () => _removeFromCart(prod),
                              ),
                              Text('$countInCart', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                            IconButton(
                              icon: const Icon(Icons.add_circle, color: Colors.green),
                              onPressed: () => _addToCart(prod),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(12.0),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.95, // Modified aspect ratio to account gracefully for vertical image frames
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: displayedProducts.length,
                  itemBuilder: (context, index) {
                    final prod = displayedProducts[index];
                    final countInCart = _cart[prod] ?? 0;
                    return Card(
                      elevation: 2,
                      clipBehavior: Clip.antiAlias, // Ensures the menu image clips smoothly to the card corners
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: InkWell(
                        onTap: () => _addToCart(prod),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Product Image banner container
                            Expanded(
                              flex: 5,
                              child: SizedBox( // Use SizedBox to define width/height for the Stack
                                width: double.infinity,
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    // Change Image.network to Image.asset
                                    prod.imagePath != null
                                        ? Image.asset(
                                            'assets/${prod.imagePath}', // This will correctly load: assets/products/bangsilog.jpeg
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
                                          decoration: BoxDecoration(color: Colors.green.shade700, shape: BoxShape.circle),
                                          child: Text('$countInCart', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                        ),
                                      )
                                  ],
                                ),
                              ),
                            ),
                            // Info Text block elements
                            Expanded(
                              flex: 4,
                              child: Padding(
                                padding: const EdgeInsets.all(10.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      prod.name, 
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), 
                                      maxLines: 2, 
                                      overflow: TextOverflow.ellipsis
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween, // Fixed this
                                      children: [
                                        Text('₱${prod.price.toStringAsFixed(2)}', style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w900, fontSize: 15)),
                                        if (countInCart > 0)
                                          SizedBox(
                                            width: 32,
                                            height: 32,
                                            child: IconButton(
                                              padding: EdgeInsets.zero,
                                              icon: const Icon(Icons.remove_circle_outline, color: Colors.red, size: 24),
                                              onPressed: () => _removeFromCart(prod),
                                            ),
                                          )
                                      ],
                                    )
                                  ],
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );

    // --- SUB-WIDGET 2: Metadata & Active Receipt Ticket Sidebar Sheet ---
    Widget orderSidebarSection = Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: !isMobile ? const Border(left: BorderSide(color: Colors.black12)) : null,
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Order Metadata', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedTable,
            decoration: InputDecoration(
              labelText: 'Assign Table',
              fillColor: Colors.white,
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            items: _tables.map((table) {
              return DropdownMenuItem<String>(
                value: table.name,
                child: Text('${table.name} (${table.status})', style: const TextStyle(fontSize: 14)),
              );
            }).toList(),
            onChanged: (val) => setState(() => _selectedTable = val),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _customerController,
            decoration: InputDecoration(
              labelText: 'Guest Name / Identifier',
              fillColor: Colors.white,
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const Divider(height: 32),
          const Text('Active Items Ticket', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          Expanded(
            child: _cart.isEmpty
                ? const Center(child: Text('No entries added to ticket.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)))
                : ListView.builder(
                    itemCount: _cart.length,
                    itemBuilder: (context, index) {
                      final entry = _cart.entries.elementAt(index);
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(entry.key.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        subtitle: Text('${entry.value}x @ ₱${entry.key.price.toStringAsFixed(2)}'),
                        trailing: Text('₱${(entry.key.price * entry.value).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      );
                    },
                  ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Est. Subtotal:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('₱${_calculateSubtotal().toStringAsFixed(2)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.green)),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade700,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _handleOrderDispatch,
              child: const Text('Send Order to Kitchen', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          )
        ],
      ),
    );

    // --- MAIN ROUTER RENDER ENGINE ---
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Waiter Terminal'), backgroundColor: Colors.green.shade700),
        body: const Center(child: CircularProgressIndicator(color: Colors.green)),
      );
    }

    if (isMobile) {
      return DefaultTabController(
        length: 2,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Waiter Terminal', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
            backgroundColor: Colors.green.shade700,
            actions: [
              IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _fetchInitialData),
              IconButton(icon: const Icon(Icons.logout, color: Colors.white), onPressed: _logout),
            ],
            bottom: TabBar(
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              indicatorColor: Colors.white,
              indicatorWeight: 3,
              tabs: [
                const Tab(icon: Icon(Icons.restaurant_menu), text: 'Browse Menu'),
                Tab(
                  icon: Badge(
                    label: Text('${_getCartTotalItemCount()}'),
                    isLabelVisible: _cart.isNotEmpty,
                    child: const Icon(Icons.shopping_cart),
                  ),
                  text: 'View Ticket',
                ),
              ],
            ),
          ),
          body: TabBarView(
            children: [
              catalogSection,
              orderSidebarSection,
            ],
          ),
        ),
      );
    } else {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Waiter Terminal', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
          backgroundColor: Colors.green.shade700,
          actions: [
            IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _fetchInitialData),
            IconButton(icon: const Icon(Icons.logout, color: Colors.white), onPressed: _logout),
          ],
        ),
        body: Row(
          children: [
            Expanded(flex: 3, child: catalogSection),
            Expanded(flex: 2, child: orderSidebarSection),
          ],
        ),
      );
    }
  }
}