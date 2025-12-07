import React, { useState, useEffect, useMemo } from 'react';
import { 
  Egg, ShoppingCart, User, Home, Plus, Minus, MapPin, 
  CreditCard, CheckCircle, Clock, Truck, ChevronRight, 
  LogOut, Settings, List, Users, BarChart3, Search, Trash2, Edit, Map
} from 'lucide-react';
import { StorageService } from './services/storage';
import { 
  UserRole, Product, CartItem, Order, Customer, OrderStatus, 
  PaymentMethod, RecurrenceType, DeliveryPeriod, Address, UserSession, ProductType 
} from './types';

// --- Global Constants ---
const DELIVERY_FEE = 5.00;
const ADMIN_PHONE = "5519996150452"; // Rogério's Number

// --- Helper Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, fullWidth = false }: any) => {
  const baseStyle = "font-medium rounded-2xl py-3 px-6 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm";
  const variants = {
    primary: "bg-gradient-to-r from-brand-darkYellow to-brand-orange text-white shadow-brand-orange/30",
    secondary: "bg-white text-brand-darkBrown border border-gray-200",
    danger: "bg-red-50 text-red-600 border border-red-100",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-50"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${fullWidth ? 'w-full' : ''} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border border-gray-200 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all`}
      />
    </div>
  </div>
);

const Select = ({ label, value, onChange, options, icon: Icon }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />}
      <select
        value={value}
        onChange={onChange}
        className={`w-full bg-white border border-gray-200 rounded-xl py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 appearance-none`}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

const Toast = ({ message, type = 'success', onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState('login'); // login, home, cart, checkout, order-status, admin-dash, admin-orders, admin-products
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Load initial data
  useEffect(() => {
    const savedSession = StorageService.getSession();
    if (savedSession) {
      setSession(savedSession);
      setView(savedSession.role === UserRole.ADMIN ? 'admin-dash' : 'home');
    }
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(StorageService.getProducts());
    setOrders(StorageService.getOrders());
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  const handleLogin = (user: UserSession) => {
    setSession(user);
    StorageService.setSession(user);
    if (user.role === UserRole.ADMIN) {
      setView('admin-dash');
    } else {
      // Check if user has address saved
      const savedCustomer = StorageService.getCustomerByPhone((user.data as any).phone);
      if (savedCustomer) {
        // Update session with full customer data
        const updatedSession = { ...user, data: savedCustomer };
        setSession(updatedSession);
        StorageService.setSession(updatedSession);
      }
      setView('home');
    }
  };

  const handleLogout = () => {
    setSession(null);
    StorageService.clearSession();
    setView('login');
    setCart([]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    // Auto redirect logic requested
    setView('cart');
    showToast('Produto adicionado ao carrinho!');
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cartQuantity: Math.max(0, item.cartQuantity + delta) };
      }
      return item;
    }).filter(item => item.cartQuantity > 0));
  };

  const handleCheckout = (orderData: Partial<Order>) => {
    if (!session || session.role !== UserRole.CUSTOMER) return;
    
    const customer = session.data as Customer;
    
    const newOrder: Order = {
      id: Math.floor(Math.random() * 100000).toString(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: cart,
      total: cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) + DELIVERY_FEE,
      deliveryFee: DELIVERY_FEE,
      address: orderData.address as Address,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      paymentMethod: orderData.paymentMethod || PaymentMethod.CASH,
      changeFor: orderData.changeFor,
      recurrence: orderData.recurrence || RecurrenceType.NONE,
      deliveryPeriod: orderData.deliveryPeriod || DeliveryPeriod.MORNING
    };

    StorageService.saveOrder(newOrder);
    
    // Save/Update Customer with new address
    const updatedCustomer = { ...customer, address: orderData.address, totalOrders: customer.totalOrders + 1, lastOrderDate: new Date().toISOString() };
    StorageService.saveCustomer(updatedCustomer);
    setSession({ ...session, data: updatedCustomer }); // Update session
    StorageService.setSession({ ...session, data: updatedCustomer });

    setCart([]);
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setView('order-status');
    showToast('Pedido realizado com sucesso!');
  };

  // --- Views ---

  if (!view) return null;

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-gray-50 shadow-2xl relative overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* LOGIN VIEW */}
      {view === 'login' && <LoginScreen onLogin={handleLogin} />}

      {/* CUSTOMER VIEWS */}
      {session?.role === UserRole.CUSTOMER && (
        <>
          {view === 'home' && (
            <ProductList 
              products={products} 
              onAdd={addToCart} 
              customerName={(session.data as Customer).name} 
            />
          )}
          {view === 'cart' && (
            <CartScreen 
              cart={cart} 
              onUpdateQty={updateCartQuantity} 
              onContinue={() => setView('checkout')} 
              onBack={() => setView('home')}
            />
          )}
          {view === 'checkout' && (
            <CheckoutScreen 
              customer={session.data as Customer}
              cartTotal={cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0)}
              onFinish={handleCheckout}
              onBack={() => setView('cart')}
            />
          )}
          {view === 'order-status' && activeOrder && (
            <OrderStatusScreen 
              order={activeOrder} 
              onBack={() => setView('home')} 
            />
          )}
          {view === 'orders' && (
             <CustomerOrdersScreen 
               orders={orders.filter(o => o.customerId === (session.data as Customer).id)} 
               onViewOrder={(o) => { setActiveOrder(o); setView('order-status'); }}
             />
          )}
          
          {/* Customer Bottom Nav */}
          {view !== 'checkout' && view !== 'order-status' && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 pb-safe">
              <NavIcon icon={Home} label="Início" isActive={view === 'home'} onClick={() => setView('home')} />
              <div className="relative">
                <div onClick={() => setView('cart')} className="bg-brand-darkYellow text-white p-4 rounded-full -mt-8 shadow-lg border-4 border-gray-50 cursor-pointer active:scale-95 transition-transform">
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {cart.reduce((a, b) => a + b.cartQuantity, 0)}
                    </span>
                  )}
                </div>
              </div>
              <NavIcon icon={List} label="Pedidos" isActive={view === 'orders'} onClick={() => setView('orders')} />
              <NavIcon icon={LogOut} label="Sair" isActive={false} onClick={handleLogout} />
            </div>
          )}
        </>
      )}

      {/* ADMIN VIEWS */}
      {session?.role === UserRole.ADMIN && (
        <>
           {/* Admin Header */}
           <div className="bg-brand-darkBrown text-white p-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-2 rounded-lg">
                <Egg className="w-6 h-6 text-brand-yellow" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none">Painel Admin</h1>
                <p className="text-xs text-white/70">Olá, Rogério</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full"><LogOut className="w-5 h-5" /></button>
          </div>

          <div className="p-4">
            {/* Admin Nav Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm mb-6">
              <TabButton active={view === 'admin-dash'} onClick={() => setView('admin-dash')} label="Dash" icon={BarChart3} />
              <TabButton active={view === 'admin-orders'} onClick={() => setView('admin-orders')} label="Pedidos" icon={List} />
              <TabButton active={view === 'admin-products'} onClick={() => setView('admin-products')} label="Produtos" icon={Egg} />
            </div>

            {view === 'admin-dash' && <AdminDashboard orders={orders} products={products} />}
            {view === 'admin-orders' && (
              <AdminOrders 
                orders={orders} 
                onUpdateStatus={(orderId, status) => {
                  const order = orders.find(o => o.id === orderId);
                  if (order) {
                    const updated = { ...order, status };
                    StorageService.saveOrder(updated);
                    refreshData();
                    showToast(`Status atualizado para ${status}`);
                  }
                }} 
              />
            )}
            {view === 'admin-products' && (
              <AdminProducts 
                products={products} 
                onSave={(p) => { StorageService.saveProduct(p); refreshData(); showToast('Produto salvo!'); }}
                onDelete={(id) => { StorageService.deleteProduct(id); refreshData(); showToast('Produto removido!'); }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Sub Components ---

const NavIcon = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${isActive ? 'text-brand-darkYellow' : 'text-gray-400'}`}>
    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${active ? 'bg-brand-light text-brand-darkBrown shadow-sm' : 'text-gray-500'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// --- Login Screen ---

const LoginScreen = ({ onLogin }: { onLogin: (s: UserSession) => void }) => {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const handleCustomerLogin = () => {
    if (!name || !phone) return;
    // Check if customer exists or create ID
    const existing = StorageService.getCustomerByPhone(phone);
    const customer: Customer = existing || {
      id: Date.now().toString(),
      name,
      phone,
      totalOrders: 0
    };
    if (!existing) StorageService.saveCustomer(customer);
    
    onLogin({ role: UserRole.CUSTOMER, data: customer });
  };

  const handleAdminLogin = () => {
    // Normalize user input to remove accents and handle case sensitivity
    // Rogério -> rogerio
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    if (normalize(adminName) === 'rogerio' && adminCode === '166480') {
      onLogin({ role: UserRole.ADMIN, data: { name: 'Rogério', id: 'admin' } });
    } else {
      alert('Credenciais inválidas.');
    }
  };

  return (
    <div className="h-screen bg-brand-yellow flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-orange/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="bg-white w-full rounded-3xl shadow-2xl p-8 z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-brand-light p-4 rounded-full">
            <Egg className="w-12 h-12 text-brand-darkYellow fill-brand-yellow" />
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-bold text-center text-gray-800 mb-2">
          App do Ovo
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Ovos frescos direto da granja para sua casa.
        </p>

        {mode === 'customer' ? (
          <div className="space-y-4">
            <Input label="Seu Nome" placeholder="Ex: Maria Silva" value={name} onChange={(e: any) => setName(e.target.value)} icon={User} />
            <Input label="Seu Celular (WhatsApp)" placeholder="Ex: 19999999999" value={phone} onChange={(e: any) => setPhone(e.target.value)} type="tel" icon={Settings} />
            <Button fullWidth onClick={handleCustomerLogin} disabled={!name || !phone}>
              Entrar e ver Ovos
            </Button>
            <button onClick={() => setMode('admin')} className="w-full text-center text-xs text-gray-400 mt-4 hover:underline">
              Acesso Administrativo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-medium text-center mb-4">
              Área restrita ao Administrador
            </div>
            {/* Removed the hardcoded examples for security */}
            <Input label="Nome Admin" placeholder="Digite seu usuário" value={adminName} onChange={(e: any) => setAdminName(e.target.value)} icon={User} />
            <Input label="Código de Acesso" placeholder="Digite sua senha" type="password" value={adminCode} onChange={(e: any) => setAdminCode(e.target.value)} icon={Settings} />
            <Button fullWidth variant="secondary" onClick={handleAdminLogin}>
              Acessar Painel
            </Button>
            <button onClick={() => setMode('customer')} className="w-full text-center text-xs text-gray-400 mt-4 hover:underline">
              Voltar para Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Product List ---

const ProductList = ({ products, onAdd, customerName }: any) => {
  return (
    <div className="pt-8 pb-24 px-4">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-gray-400 text-sm font-medium">Bom dia, {customerName.split(' ')[0]}!</h2>
          <h1 className="text-2xl font-display font-bold text-gray-800">Escolha seus Ovos</h1>
        </div>
        <div className="bg-brand-light p-2 rounded-xl">
           <Egg className="text-brand-darkYellow w-6 h-6" />
        </div>
      </div>

      <div className="grid gap-4">
        {products.filter((p: Product) => p.active).map((product: Product) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 transition-transform active:scale-[0.99]">
            <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800 leading-tight">{product.name}</h3>
                  {product.isPromo && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">PROMO</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-1 flex gap-2">
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{product.quantityPerPackage} un</span>
                  <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md">{product.type}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="font-display font-bold text-lg text-brand-darkBrown">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                <button 
                  onClick={() => onAdd(product)}
                  className="bg-brand-darkYellow text-white p-2 rounded-xl shadow-md active:bg-brand-orange transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Cart Screen ---

const CartScreen = ({ cart, onUpdateQty, onContinue, onBack }: any) => {
  const subtotal = cart.reduce((acc: number, item: CartItem) => acc + (item.price * item.cartQuantity), 0);
  
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 shadow-sm flex items-center gap-3">
        <button onClick={onBack}><ChevronRight className="w-6 h-6 rotate-180 text-gray-600" /></button>
        <h1 className="font-display font-bold text-lg">Meu Carrinho</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
            <p>Seu carrinho está vazio</p>
            <button onClick={onBack} className="mt-4 text-brand-darkYellow font-medium">Voltar para a loja</button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item: CartItem) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4">
                <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                  <p className="text-brand-brown font-bold text-sm">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="w-4 h-4 text-gray-600" /></button>
                  <span className="font-medium text-sm w-4 text-center">{item.cartQuantity}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-white p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Taxa de Entrega</span>
              <span>R$ {DELIVERY_FEE.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-dashed">
              <span>Total</span>
              <span>R$ {(subtotal + DELIVERY_FEE).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <Button fullWidth onClick={onContinue}>
            Continuar para Endereço
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Checkout Screen ---

const CheckoutScreen = ({ customer, cartTotal, onFinish, onBack }: any) => {
  const [step, setStep] = useState(1); // 1: Address, 2: Payment
  const [address, setAddress] = useState<Address>(customer.address || {
    street: '', number: '', neighborhood: '', city: '', zipCode: '', reference: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [changeFor, setChangeFor] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(RecurrenceType.NONE);
  const [deliveryPeriod, setDeliveryPeriod] = useState<DeliveryPeriod>(DeliveryPeriod.MORNING);

  const optimizeAddress = () => {
    // Simulated Geocoding/Address optimization
    if (confirm("Deseja usar sua localização atual para preencher o endereço?")) {
      // Dummy data fill for demo purposes
      setAddress({
        street: 'Av. Principal',
        number: '123',
        neighborhood: 'Centro',
        city: 'Cidade Exemplo',
        zipCode: '13000-000',
        reference: 'Próximo à padaria',
        lat: -22.9,
        lng: -47.0
      });
    }
  };

  const openMap = () => {
    if (!address.street) {
      alert("Preencha o endereço primeiro.");
      return;
    }
    const query = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleFinish = () => {
    onFinish({
      address,
      paymentMethod,
      changeFor,
      recurrence,
      deliveryPeriod
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step === 1 ? onBack() : setStep(1)}><ChevronRight className="w-6 h-6 rotate-180 text-gray-600" /></button>
        <h1 className="font-display font-bold text-lg">Finalizar Pedido</h1>
        <div className="ml-auto text-xs font-medium text-brand-darkYellow bg-brand-light px-2 py-1 rounded-md">
          Passo {step}/2
        </div>
      </div>

      <div className="p-4">
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-darkYellow" />
                  Endereço de Entrega
                </h2>
                <button onClick={optimizeAddress} className="text-xs text-brand-darkYellow font-bold flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" /> Usar GPS
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input label="Rua" value={address.street} onChange={(e: any) => setAddress({...address, street: e.target.value})} placeholder="Nome da rua" />
                </div>
                <Input label="Nº" value={address.number} onChange={(e: any) => setAddress({...address, number: e.target.value})} placeholder="123" />
              </div>
              <Input label="Bairro" value={address.neighborhood} onChange={(e: any) => setAddress({...address, neighborhood: e.target.value})} placeholder="Bairro" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" value={address.city} onChange={(e: any) => setAddress({...address, city: e.target.value})} placeholder="Cidade" />
                <Input label="CEP" value={address.zipCode} onChange={(e: any) => setAddress({...address, zipCode: e.target.value})} placeholder="00000-000" />
              </div>
              <Input label="Ponto de Referência" value={address.reference} onChange={(e: any) => setAddress({...address, reference: e.target.value})} placeholder="Ex: Casa verde, portão preto" />
            
              <button 
                onClick={openMap}
                disabled={!address.street}
                className="w-full mt-2 text-sm text-blue-600 bg-blue-50 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Map className="w-4 h-4" />
                Conferir no Mapa
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
               <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-brand-darkYellow" />
                  Horário de Preferência
                </h2>
                <Select 
                  value={deliveryPeriod} 
                  onChange={(e: any) => setDeliveryPeriod(e.target.value)}
                  options={[
                    { value: DeliveryPeriod.MORNING, label: DeliveryPeriod.MORNING },
                    { value: DeliveryPeriod.AFTERNOON, label: DeliveryPeriod.AFTERNOON }
                  ]}
                />
            </div>

            <Button fullWidth onClick={() => setStep(2)} disabled={!address.street || !address.number}>
              Ir para Pagamento
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-brand-darkYellow" />
                Forma de Pagamento
              </h2>
              <div className="space-y-2">
                {Object.values(PaymentMethod).map(method => (
                  <label key={method} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === method ? 'border-brand-darkYellow bg-brand-light' : 'border-gray-100'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === method} 
                      onChange={() => setPaymentMethod(method)}
                      className="text-brand-darkYellow focus:ring-brand-darkYellow"
                    />
                    <span className="text-sm font-medium">{method}</span>
                  </label>
                ))}
              </div>
              {paymentMethod === PaymentMethod.CASH && (
                <div className="mt-4 animate-fade-in">
                  <Input label="Troco para quanto?" value={changeFor} onChange={(e: any) => setChangeFor(e.target.value)} placeholder="Ex: R$ 50,00" />
                </div>
              )}
            </div>

            {/* Recurrence */}
            <div className="bg-gradient-to-br from-brand-light to-white p-5 rounded-2xl shadow-sm border border-brand-yellow/30">
              <h2 className="font-bold text-brand-brown flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                Assinatura de Ovos
              </h2>
              <p className="text-xs text-gray-600 mb-4">Receba este pedido automaticamente e nunca fique sem ovos!</p>
              
              <Select 
                label="Frequência"
                value={recurrence} 
                onChange={(e: any) => setRecurrence(e.target.value)}
                options={Object.values(RecurrenceType).map(t => ({ value: t, label: t }))}
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-dashed border-gray-300">
               <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total a Pagar</span>
                  <span>R$ {(cartTotal + DELIVERY_FEE).toFixed(2).replace('.', ',')}</span>
               </div>
            </div>

            <Button fullWidth onClick={handleFinish}>
              <CheckCircle className="w-5 h-5" />
              Finalizar Pedido
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Order Status Screen ---

const OrderStatusScreen = ({ order, onBack }: { order: Order, onBack: () => void }) => {
  const steps = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERING, OrderStatus.COMPLETED];
  const currentStepIdx = steps.indexOf(order.status);
  
  const getStepIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return List;
      case OrderStatus.PREPARING: return Egg;
      case OrderStatus.DELIVERING: return Truck;
      case OrderStatus.COMPLETED: return CheckCircle;
      default: return CheckCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6 text-center pt-8">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-800">Pedido Confirmado!</h1>
        <p className="text-gray-500 text-sm">Pedido #{order.id}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-800 mb-6">Status do Pedido</h3>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
          
          <div className="space-y-8">
            {steps.map((step, idx) => {
              const Icon = getStepIcon(step);
              const isActive = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              
              return (
                <div key={step} className="relative flex items-center gap-4 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-brand-darkYellow text-white' : 'bg-gray-200 text-gray-400'} ${isCurrent ? 'ring-4 ring-yellow-100' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{step}</p>
                    {isCurrent && <p className="text-xs text-brand-darkYellow font-medium animate-pulse">Em andamento...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-800">Resumo</h3>
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {order.address.street}, {order.address.number} - {order.address.neighborhood}
        </p>
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {order.paymentMethod} {order.changeFor && `(Troco p/ ${order.changeFor})`}
        </p>
         <p className="text-sm text-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {order.deliveryPeriod}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <a 
          href={`https://wa.me/${ADMIN_PHONE}?text=Olá, gostaria de saber sobre meu pedido #${order.id}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full bg-green-500 text-white font-bold py-3 rounded-xl text-center shadow-md active:scale-95 transition-transform"
        >
          Falar no WhatsApp
        </a>
        <Button fullWidth variant="secondary" onClick={onBack}>
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

// --- Customer Order List ---

const CustomerOrdersScreen = ({ orders, onViewOrder }: any) => {
  return (
    <div className="pt-8 pb-24 px-4">
      <h1 className="text-2xl font-display font-bold text-gray-800 mb-6">Meus Pedidos</h1>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">Você ainda não fez pedidos.</p>
        ) : (
          orders.map((order: Order) => (
            <div key={order.id} onClick={() => onViewOrder(order)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
              <div>
                <p className="font-bold text-gray-800">Pedido #{order.id}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')} • {order.items.length} itens</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${
                  order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <ChevronRight className="text-gray-300" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Admin Components ---

const AdminDashboard = ({ orders, products }: any) => {
  const today = new Date().toLocaleDateString('pt-BR');
  const todaysOrders = orders.filter((o: Order) => new Date(o.createdAt).toLocaleDateString('pt-BR') === today);
  const totalSales = todaysOrders.reduce((acc: number, o: Order) => acc + o.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Vendas Hoje</p>
          <p className="text-xl font-bold text-green-600">R$ {totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Pedidos Hoje</p>
          <p className="text-xl font-bold text-brand-darkBrown">{todaysOrders.length}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-darkYellow" />
          Pedidos Pendentes
        </h3>
        <div className="space-y-2">
          {orders.filter((o: Order) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).length === 0 ? (
             <p className="text-sm text-gray-400">Nenhum pedido pendente.</p>
          ) : (
            orders.filter((o: Order) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).map((order: Order) => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                   <p className="font-bold text-sm">#{order.id} - {order.customerName}</p>
                   <p className="text-xs text-gray-500">{order.address.neighborhood}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{order.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminOrders = ({ orders, onUpdateStatus }: any) => {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg text-gray-800">Gerenciar Pedidos</h2>
      {orders.map((order: Order) => (
        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-brand-darkBrown">#{order.id}</h3>
              <p className="text-sm font-medium">{order.customerName}</p>
            </div>
            <a href={`https://wa.me/55${order.customerPhone}`} target="_blank" className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
              WhatsApp
            </a>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 mb-3">
             <p><strong>Endereço:</strong> {order.address.street}, {order.address.number}, {order.address.neighborhood}</p>
             <p><strong>Pagamento:</strong> {order.paymentMethod} {order.changeFor && `(Troco: ${order.changeFor})`}</p>
             <p><strong>Itens:</strong> {order.items.map(i => `${i.cartQuantity}x ${i.name}`).join(', ')}</p>
             {order.recurrence !== RecurrenceType.NONE && (
               <p className="text-brand-orange font-bold">⚠️ Assinatura: {order.recurrence}</p>
             )}
             
             <div className="pt-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}`)}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                >
                  <Map className="w-3 h-3" /> Ver no Mapa
                </a>
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.values(OrderStatus).map(status => (
              <button 
                key={status}
                onClick={() => onUpdateStatus(order.id, status)}
                className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  order.status === status 
                  ? 'bg-brand-darkYellow text-white font-bold shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminProducts = ({ products, onSave, onDelete }: any) => {
  const [editing, setEditing] = useState<Product | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      onSave(editing);
      setEditing(null);
    }
  };

  const startNew = () => {
    setEditing({
      id: Date.now().toString(),
      name: '',
      type: ProductType.BRANCO,
      description: '',
      quantityPerPackage: 30,
      price: 0,
      imageUrl: 'https://picsum.photos/200',
      active: true,
      isPromo: false
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-800">Catálogo</h2>
        <Button onClick={startNew} className="py-2 px-4 text-xs"><Plus className="w-4 h-4" /> Novo</Button>
      </div>

      {editing && (
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-brand-yellow mb-6 animate-fade-in fixed inset-0 z-50 overflow-y-auto sm:relative sm:inset-auto sm:z-0">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Editar Produto</h3>
            <button onClick={() => setEditing(null)} className="text-gray-400"><Trash2 className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Nome" value={editing.name} onChange={(e: any) => setEditing({...editing, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Preço" type="number" value={editing.price} onChange={(e: any) => setEditing({...editing, price: parseFloat(e.target.value)})} />
              <Input label="Qtd" type="number" value={editing.quantityPerPackage} onChange={(e: any) => setEditing({...editing, quantityPerPackage: parseInt(e.target.value)})} />
            </div>
            <Select 
              label="Tipo" 
              value={editing.type} 
              onChange={(e: any) => setEditing({...editing, type: e.target.value})}
              options={Object.values(ProductType).map(t => ({ value: t, label: t }))}
            />
             <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={editing.isPromo} onChange={(e) => setEditing({...editing, isPromo: e.target.checked})} />
                <label className="text-sm">É Promoção?</label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)} fullWidth>Cancelar</Button>
              <Button type="submit" fullWidth>Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p: Product) => (
          <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-center">
            <img src={p.imageUrl} className="w-12 h-12 rounded-lg bg-gray-100 object-cover" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-gray-800">{p.name}</h4>
              <p className="text-xs text-gray-500">R$ {p.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="p-2 bg-gray-100 rounded-lg text-gray-600"><Edit className="w-4 h-4" /></button>
              <button onClick={() => { if(confirm('Deletar?')) onDelete(p.id) }} className="p-2 bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};