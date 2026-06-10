import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const categories = {
  electronics: {
    items: [
      { name: "Smart LED TV", price: 499.99, image: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Wireless Headphones", price: 89.99, image: "https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Smartphone", price: 699.99, image: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Laptop", price: 899.99, image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Smartwatch", price: 199.99, image: "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Gaming Console", price: 399.99, image: "https://images.pexels.com/photos/1482061/pexels-photo-1482061.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Bluetooth Speaker", price: 79.99, image: "https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Tablet", price: 299.99, image: "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400" }
    ]
  },
  toys: {
    items: [
      { name: "LEGO Set", price: 49.99, image: "https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Remote Control Car", price: 39.99, image: "https://images.pexels.com/photos/163696/toy-car-toy-box-mini-163696.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Barbie Doll", price: 19.99, image: "https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Board Game", price: 24.99, image: "https://images.pexels.com/photos/776654/pexels-photo-776654.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Stuffed Animal", price: 14.99, image: "https://images.pexels.com/photos/3661265/pexels-photo-3661265.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Play-Doh Set", price: 9.99, image: "https://images.pexels.com/photos/1148999/pexels-photo-1148999.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Puzzle", price: 12.99, image: "https://images.pexels.com/photos/207891/pexels-photo-207891.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Action Figure", price: 15.99, image: "https://images.pexels.com/photos/1619650/pexels-photo-1619650.jpeg?auto=compress&cs=tinysrgb&w=400" }
    ]
  },
  menClothing: {
    items: [
      { name: "Men's T-Shirt", price: 19.99, image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Jeans", price: 49.99, image: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Hoodie", price: 39.99, image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Jacket", price: 79.99, image: "https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Shorts", price: 24.99, image: "https://images.pexels.com/photos/1020370/pexels-photo-1020370.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Polo Shirt", price: 29.99, image: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Sweater", price: 44.99, image: "https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Men's Formal Shirt", price: 34.99, image: "https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&w=400" }
    ]
  },
  womenClothing: {
    items: [
      { name: "Women's Dress", price: 59.99, image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Blouse", price: 29.99, image: "https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Jeans", price: 54.99, image: "https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Skirt", price: 34.99, image: "https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Sweater", price: 49.99, image: "https://images.pexels.com/photos/1187079/pexels-photo-1187079.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Jacket", price: 84.99, image: "https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's T-Shirt", price: 24.99, image: "https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Women's Hoodie", price: 44.99, image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=400" }
    ]
  },
  childrenClothing: {
    items: [
      { name: "Kids T-Shirt", price: 14.99, image: "https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Jeans", price: 29.99, image: "https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Dress", price: 34.99, image: "https://images.pexels.com/photos/1620761/pexels-photo-1620761.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Pajamas", price: 19.99, image: "https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Sweater", price: 24.99, image: "https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Shorts", price: 16.99, image: "https://images.pexels.com/photos/1619650/pexels-photo-1619650.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Jacket", price: 39.99, image: "https://images.pexels.com/photos/2703202/pexels-photo-2703202.jpeg?auto=compress&cs=tinysrgb&w=400" },
      { name: "Kids Hoodie", price: 29.99, image: "https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400" }
    ]
  }
};

const generateDescription = (name, category) => {
  return `High-quality ${name.toLowerCase()} from our ${category} collection. Perfect for any occasion. Made with premium materials and attention to detail.`;
};

const generateRandomStock = () => {
  return Math.floor(Math.random() * 50) + 10; // Random stock between 10 and 60
};

const generateRandomDiscount = () => {
  const discounts = [0, 0, 0, 5, 10, 15, 20]; // More zeros to make discounts less frequent
  return discounts[Math.floor(Math.random() * discounts.length)];
};

export const addDummyProducts = async () => {
  try {
    // Check if products already exist
    const productsRef = collection(db, 'products');
    const existingProducts = await getDocs(query(productsRef, where('isDummy', '==', true)));
    
    if (!existingProducts.empty) {
      console.log('Dummy products already exist');
      return;
    }

    const allProducts = [];

    // Generate products for each category
    Object.entries(categories).forEach(([category, data]) => {
      data.items.forEach((item) => {
        // Create multiple variations of each item
        for (let i = 1; i <= 5; i++) {
          const variation = i > 1 ? ` - Style ${i}` : '';
          allProducts.push({
            name: item.name + variation,
            price: item.price,
            description: generateDescription(item.name, category),
            category: category,
            imageUrl: item.image,
            stock: generateRandomStock(),
            discount: generateRandomDiscount(),
            createdAt: new Date(),
            isDummy: true // Flag to identify dummy products
          });
        }
      });
    });

    // Shuffle array to randomize products
    for (let i = allProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
    }

    // Add products to Firebase
    const batch = [];
    for (const product of allProducts) {
      batch.push(addDoc(productsRef, product));
    }

    await Promise.all(batch);
    console.log('Successfully added dummy products');
    return true;
  } catch (error) {
    console.error('Error adding dummy products:', error);
    return false;
  }
};

/**
 * Delete existing dummy products and re-add with updated images.
 * Call this from Admin dashboard to fix missing images on old dummy products.
 */
export const resetDummyProducts = async () => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const productsRef = collection(db, 'products');

    // Delete all existing dummy products
    const existingSnap = await getDocs(query(productsRef, where('isDummy', '==', true)));
    const delBatch = existingSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(delBatch);
    console.log(`Deleted ${existingSnap.size} old dummy products`);

    const allProducts = [];
    Object.entries(categories).forEach(([category, data]) => {
      data.items.forEach((item) => {
        for (let i = 1; i <= 5; i++) {
          const variation = i > 1 ? ` - Style ${i}` : '';
          allProducts.push({
            name: item.name + variation,
            price: item.price,
            description: generateDescription(item.name, category),
            category: category,
            imageUrl: item.image,
            stock: generateRandomStock(),
            discount: generateRandomDiscount(),
            createdAt: new Date(),
            isDummy: true
          });
        }
      });
    });

    // Shuffle
    for (let i = allProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
    }

    const addBatch = allProducts.map((p) => addDoc(productsRef, p));
    await Promise.all(addBatch);
    console.log(`Successfully re-added ${allProducts.length} dummy products with updated images`);
    return true;
  } catch (error) {
    console.error('Error resetting dummy products:', error);
    return false;
  }
};