class DiningTable {
  final int id;
  final String name;
  final String status;

  DiningTable({required this.id, required this.name, required this.status});

  factory DiningTable.fromJson(Map<String, dynamic> json) {
    return DiningTable(
      id: json['id'],
      name: json['name'],
      status: json['status'],
    );
  }
}

class ProductItem {
  final int id;
  final String name;
  final double price;
  final String category;
  final String type;
  final String? imagePath;

  ProductItem({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
    required this.type,
    this.imagePath,
  });

  factory ProductItem.fromJson(Map<String, dynamic> json) {
    return ProductItem(
      id: json['id'],
      name: json['name'],
      price: double.parse(json['price'].toString()),
      category: json['category'],
      type: json['type'],
      imagePath: json['image_path'],
    );
  }
}