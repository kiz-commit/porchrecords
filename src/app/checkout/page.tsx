"use client";

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import { useCartContext } from '@/contexts/CartContext';
import WebPaymentsCheckout from '@/components/WebPaymentsCheckout';

interface AppliedDiscount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  percentage?: string;
  amount?: number;
  discountAmount: number;
  isVoucher?: boolean;
  code?: string;
  voucherBalance?: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function CheckoutPage() {
  const { cart } = useCartContext();
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping' | 'email'>('pickup');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [automaticDiscounts, setAutomaticDiscounts] = useState<AppliedDiscount[]>([]);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'AU'
  });

  const fetchAutomaticDiscounts = useCallback(async () => {
    if (cart.items.length === 0) {
      setAutomaticDiscounts([]);
      return;
    }

    try {
      const productData = cart.items.map(item => ({
        id: item.product.id,
        price: item.product.price,
        quantity: item.quantity,
        productType: item.product.productType || 'record',
        merchCategory: item.product.merchCategory || ''
      }));
      
      const response = await fetch('/api/checkout/get-automatic-discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutomaticDiscounts(data.automaticDiscounts || []);
      }
    } catch (error) {
      console.error('Error fetching automatic discounts:', error);
    }
  }, [cart.items]);

  useEffect(() => {
    fetchAutomaticDiscounts();
  }, [fetchAutomaticDiscounts]);

  const handlePaymentSuccess = () => {
    // Redirect is handled inside WebPaymentsCheckout with orderId & paymentId query params
    // No action needed here to avoid overwriting the URL without params
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      setError('Please enter a discount code or voucher code');
      return;
    }

    setIsApplyingDiscount(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/apply-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          orderAmount: cart.totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAppliedDiscount(data.discount);
        setDiscountCode('');
        setError(null);

      } else {
        setError(data.error || 'Failed to apply discount/voucher');
        setAppliedDiscount(null);
      }
    } catch (error) {
      setError('Failed to apply discount/voucher. Please try again.');
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setError(null);
  };

  const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateShippingAddress = (): boolean => {
    if (deliveryMethod !== 'shipping') return true;
    
    const requiredFields: (keyof ShippingAddress)[] = [
      'firstName', 'lastName', 'email', 'address', 'city', 'state', 'postalCode'
    ];
    
    const missingFields = requiredFields.filter(field => !shippingAddress[field].trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required shipping fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Check if cart contains vouchers and physical items
  const hasVouchers = cart.items.some(item => item.product.productType === 'voucher');
  const hasPhysicalItems = cart.items.some(item => item.product.productType !== 'voucher');
  const voucherOnly = hasVouchers && !hasPhysicalItems;
  
  // Auto-switch to pickup if email is selected but physical items are added
  useEffect(() => {
    if (deliveryMethod === 'email' && hasPhysicalItems) {
      setDeliveryMethod('pickup');
    }
  }, [hasPhysicalItems, deliveryMethod]);
  
  // Calculate totals
  const subtotal = cart.totalPrice;
  const manualDiscountAmount = appliedDiscount?.discountAmount || 0;
  const automaticDiscountAmount = automaticDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0);
  const totalDiscountAmount = manualDiscountAmount + automaticDiscountAmount;
  const shippingCost = deliveryMethod === 'shipping' ? 12.00 : 0;
  const total = subtotal - totalDiscountAmount + shippingCost;

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        <Navigation />
        <div>
          <div className="px-6 lg:px-8 py-12 text-center">
            <h2 className="text-2xl font-bold mb-2 font-mono">Your cart is empty</h2>
            <p className="text-gray-600 mb-4 font-mono">Add some records to get started!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <Navigation />
      <div>
        {/* Header bar */}
        <div className="py-3" style={{ backgroundColor: 'var(--color-clay)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-lg font-bold text-black font-mono">
              CHECKOUT
            </h1>
          </div>
        </div>
        {/* Checkout Content */}
        <div className="py-8 px-2 md:px-8 max-w-5xl mx-auto">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Order Summary</h2>
            
            <div className="space-y-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                    <Image src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" width={64} height={64} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{item.product.title}</h3>
                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-6 pt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {appliedDiscount && (
                <div className="flex justify-between items-center text-green-600">
                  <span>
                    {appliedDiscount.name}
                    {appliedDiscount.isVoucher && (
                      <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                        Gift Voucher
                      </span>
                    )}
                  </span>
                  <span>-${manualDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {automaticDiscounts.map((discount, index) => (
                <div key={index} className="flex justify-between items-center text-green-600">
                  <span>{discount.name}</span>
                  <span>-${discount.discountAmount.toFixed(2)}</span>
                </div>
              ))}
              
              {deliveryMethod === 'shipping' && (
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Discount Code & Voucher */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Discount Code / Gift Voucher</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Enter a discount code or gift voucher code to apply to your order. Vouchers can be used for partial payments.
            </p>
            
            {!appliedDiscount ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Enter discount code or voucher code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={12}
                />
                <button
                  onClick={applyDiscount}
                  disabled={isApplyingDiscount || !discountCode.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplyingDiscount ? 'Applying...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-green-800">{appliedDiscount.name}</p>
                    {appliedDiscount.isVoucher && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        Gift Voucher
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-600">
                    -${manualDiscountAmount.toFixed(2)} applied
                    {appliedDiscount.isVoucher && appliedDiscount.voucherBalance && (
                      <span className="ml-2">
                        (Remaining balance: ${appliedDiscount.voucherBalance.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={removeDiscount}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Delivery Method Selection */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Delivery Method</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'pickup' | 'shipping' | 'email')}
                  className="w-4 h-4 bg-gray-100 border-gray-300"
                  style={{ 
                    accentColor: 'var(--color-clay)',
                    '--tw-ring-color': 'var(--color-clay)'
                  } as React.CSSProperties}
                />
                <div>
                  <span className="font-semibold">Pickup</span>
                  <p className="text-sm text-gray-600">Collect from our store - Free</p>
                  {hasVouchers && (
                    <p className="text-xs text-blue-600 mt-1">Voucher codes will be emailed regardless of delivery option</p>
                  )}
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="shipping"
                  checked={deliveryMethod === 'shipping'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'pickup' | 'shipping' | 'email')}
                  className="w-4 h-4 bg-gray-100 border-gray-300"
                  style={{ 
                    accentColor: 'var(--color-clay)',
                    '--tw-ring-color': 'var(--color-clay)'
                  } as React.CSSProperties}
                />
                <div>
                  <span className="font-semibold">Shipping</span>
                  <p className="text-sm text-gray-600">We&apos;ll ship to your address - $12.00</p>
                  {hasVouchers && (
                    <p className="text-xs text-blue-600 mt-1">Voucher codes will be emailed regardless of delivery option</p>
                  )}
                </div>
              </label>
              
              {voucherOnly && (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="email"
                    checked={deliveryMethod === 'email'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'pickup' | 'shipping' | 'email')}
                    className="w-4 h-4 bg-gray-100 border-gray-300"
                    style={{ 
                      accentColor: 'var(--color-clay)',
                      '--tw-ring-color': 'var(--color-clay)'
                    } as React.CSSProperties}
                  />
                  <div>
                    <span className="font-semibold">Email Only</span>
                    <p className="text-sm text-gray-600">Voucher codes delivered via email - Free</p>
                    <p className="text-xs text-green-600 mt-1">Perfect for digital vouchers</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Email Delivery Information - Only show when email is selected */}
          {deliveryMethod === 'email' && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 tracking-tight">Email Delivery</h2>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Perfect for digital vouchers!</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Voucher codes will be emailed immediately after payment</li>
                  <li>• No shipping costs or delivery delays</li>
                  <li>• Codes can be used for future purchases</li>
                  <li>• Valid for 1 year from purchase date</li>
                </ul>
              </div>
            </div>
          )}

          {/* Pickup Information - Only show when pickup is selected */}
          {deliveryMethod === 'pickup' && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 tracking-tight">Pickup Information</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pickup Location */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Pickup Location</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">Porch Records</p>
                    <p className="text-gray-700">Summertown Studio</p>
                    <p className="text-gray-700">Adelaide SA 5000</p>
                    <p className="text-gray-700">Australia</p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        📞 Contact us for exact address details
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opening Hours */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Opening Hours</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monday</span>
                      <span className="font-medium">7:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tuesday</span>
                      <span className="font-medium">7:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Wednesday</span>
                      <span className="font-medium">7:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Thursday</span>
                      <span className="font-medium">7:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Friday</span>
                      <span className="font-medium">7:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saturday</span>
                      <span className="font-medium">8:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Sunday</span>
                      <span className="font-medium">8:00 AM - 2:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your order will be ready for pickup within 24 hours of purchase. 
                  You can collect it during any of our opening hours above - no appointment needed!
                </p>
              </div>
            </div>
          )}

          {/* Contact / Shipping Form */}
          {(deliveryMethod === 'shipping' || deliveryMethod === 'pickup') && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 tracking-tight">{deliveryMethod === 'shipping' ? 'Shipping Address' : 'Contact Details'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={shippingAddress.firstName}
                    onChange={(e) => updateShippingAddress('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={shippingAddress.lastName}
                    onChange={(e) => updateShippingAddress('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={shippingAddress.email}
                    onChange={(e) => updateShippingAddress('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) => updateShippingAddress('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Address (shipping only) */}
                {deliveryMethod === 'shipping' && (
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => updateShippingAddress('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your street address"
                    required
                  />
                </div>
                )}

                {/* City (shipping only) */}
                {deliveryMethod === 'shipping' && (<div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => updateShippingAddress('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your city"
                    required
                  />
                </div>)}

                {/* State (shipping only) */}
                {deliveryMethod === 'shipping' && (<div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => updateShippingAddress('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a state</option>
                    <option value="NSW">New South Wales</option>
                    <option value="VIC">Victoria</option>
                    <option value="QLD">Queensland</option>
                    <option value="WA">Western Australia</option>
                    <option value="SA">South Australia</option>
                    <option value="TAS">Tasmania</option>
                    <option value="ACT">Australian Capital Territory</option>
                    <option value="NT">Northern Territory</option>
                  </select>
                </div>)}

                {/* Postal Code (shipping only) */}
                {deliveryMethod === 'shipping' && (<div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => updateShippingAddress('postalCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your postal code"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>)}

                {/* Country (shipping only) */}
                {deliveryMethod === 'shipping' && (<div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) => updateShippingAddress('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AU">Australia</option>
                  </select>
                </div>)}
              </div>

              {deliveryMethod === 'shipping' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Shipping is available within Australia only. 
                  Fixed rate of $12.00 applies to all orders.
                </p>
              </div>
              )}
            </div>
          )}

          {/* Checkout */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Complete Your Order</h2>
            <p className="text-gray-600 mb-6">Secure card entry powered by Square.</p>

            {/* Ensure single card mount by giving a stable container per page */}
            <div id="card-wrapper">
            <WebPaymentsCheckout
              cartItems={cart.items}
              deliveryMethod={deliveryMethod}
              customerInfo={deliveryMethod === 'shipping' ? shippingAddress : undefined}
              appliedDiscount={appliedDiscount}
              automaticDiscounts={automaticDiscounts}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              beforePay={() => {
                // Validate minimal contact details for pickup and email flows
                if (deliveryMethod === 'pickup' || deliveryMethod === 'email') {
                  const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value || shippingAddress.firstName;
                  const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value || shippingAddress.lastName;
                  const email = (document.getElementById('email') as HTMLInputElement)?.value || shippingAddress.email;
                  const missing: string[] = [];
                  if (!firstName) missing.push('first name');
                  if (!lastName) missing.push('last name');
                  if (!email) missing.push('email');
                  if (missing.length) {
                    setError(`Please enter your ${missing.join(', ')}`);
                    return false;
                  }
                }
                return true;
              }}
            />
            </div>
            
            {error && (
              <div className="mt-4 p-3 rounded text-center font-mono" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'rgb(185, 28, 28)' }}>
                {error}
              </div>
            )}
          </div>
          
          {/* Terms */}
          <p className="text-xs text-gray-500 mt-8 text-center font-mono">
            By completing this purchase, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
} 