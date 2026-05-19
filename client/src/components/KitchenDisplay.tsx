import React, { useEffect, useState } from 'react';
import axios from 'axios';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);

  // Fetch the live order queue from Laravel
  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/orders/active');
      setOrders(response.data);
    } catch (error) {
      console.error('KDS Sync Error:', error);
    }
  };

  // Poll every 3 seconds for new orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update order status when kitchen taps a button
  const updateStatus = async (id: number, status: string) => {
    await axios.post(`http://127.0.0.1:8000/api/orders/${id}/status`, { status });
    fetchOrders(); // Force refresh immediately
  };

  return (
    <div className="kds-container">
      {orders.map((order: any) => (
        <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
          <h3>Table: {order.table_number}</h3>
          <p>Customer: {order.customer_name}</p>
          <ul>
            {order.cart.map((item: any, idx: number) => (
              <li key={idx}>{item.quantity}x {item.name}</li>
            ))}
          </ul>
          <div className="action-buttons">
            <button onClick={() => updateStatus(order.id, 'Preparing')}>Cook</button>
            <button onClick={() => updateStatus(order.id, 'Ready')}>Done</button>
          </div>
        </div>
      ))}
    </div>
  );
};