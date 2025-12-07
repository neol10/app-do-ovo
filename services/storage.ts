import { Product, Order, Customer, ProductType, OrderStatus, PaymentMethod, RecurrenceType, DeliveryPeriod } from '../types';

// Initial Seed Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Ovos Brancos Grandes',
    type: ProductType.BRANCO,
    description: 'Ovos brancos frescos selecionados.',
    quantityPerPackage: 30,
    price: 22.00,
    imageUrl: 'https://picsum.photos/id/102/400/400',
    active: true,
    isPromo: false
  },
  {
    id: '2',
    name: 'Ovos Vermelhos Extra',
    type: ProductType.VERMELHO,
    description: 'Ovos vermelhos de alta qualidade.',
    quantityPerPackage: 20,
    price: 24.00,
    imageUrl: 'https://picsum.photos/id/292/400/400',
    active: true,
    isPromo: false
  },
  {
    id: '3',
    name: 'Ovos Caipiras',
    type: ProductType.CAIPIRA,
    description: 'Ovos caipiras legítimos direto do sítio.',
    quantityPerPackage: 12,
    price: 18.00,
    imageUrl: 'https://picsum.photos/id/22/400/400',
    active: true,
    isPromo: false
  },
  {
    id: '4',
    name: 'Promoção Família',
    type: ProductType.BRANCO,
    description: '2 Grades de Ovos Brancos (60 un).',
    quantityPerPackage: 60,
    price: 40.00,
    imageUrl: 'https://picsum.photos/id/75/400/400',
    active: true,
    isPromo: true
  }
];

const KEYS = {
  PRODUCTS: 'app_ovo_products',
  ORDERS: 'app_ovo_orders',
  CUSTOMERS: 'app_ovo_customers',
  SESSION: 'app_ovo_session'
};

export const StorageService = {
  // Products
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },
  saveProduct: (product: Product) => {
    const products = StorageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  deleteProduct: (id: string) => {
    const products = StorageService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Orders
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = StorageService.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order); // Add to top
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: (customer: Customer) => {
    const customers = StorageService.getCustomers();
    const index = customers.findIndex(c => c.phone === customer.phone); // Identify by phone
    if (index >= 0) {
      customers[index] = { ...customers[index], ...customer };
    } else {
      customers.push(customer);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  getCustomerByPhone: (phone: string): Customer | undefined => {
    return StorageService.getCustomers().find(c => c.phone === phone);
  },

  // Session
  getSession: () => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (session: any) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  },
  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
  }
};
