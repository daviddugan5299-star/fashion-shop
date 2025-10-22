// Shopping Cart Functionality for AURELIA Fashion Website

class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('aurelia_cart') || '[]');
        this.init();
        this.updateCartDisplay();
    }

    init() {
        this.setupEventListeners();
        this.renderCartItems();
    }

    setupEventListeners() {
        // Cart sidebar toggle
        const cartBtn = document.getElementById('cartBtn');
        const cartSidebar = document.getElementById('cartSidebar');
        const closeCart = document.getElementById('closeCart');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.openCart();
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Close cart on outside click
        if (cartSidebar) {
            document.addEventListener('click', (e) => {
                if (!cartSidebar.contains(e.target) && !cartBtn.contains(e.target) && !cartSidebar.classList.contains('translate-x-full')) {
                    this.closeCart();
                }
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.proceedToCheckout();
            });
        }
    }

    addToCart(product, size = null, color = null, quantity = 1) {
        const existingItemIndex = this.items.findIndex(item => 
            item.id === product.id && 
            item.selectedSize === size && 
            item.selectedColor === color
        );

        if (existingItemIndex > -1) {
            // Update existing item quantity
            this.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                selectedSize: size,
                selectedColor: color,
                quantity: quantity,
                category: product.category
            };
            this.items.push(cartItem);
        }

        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
        
        // Show success notification
        window.aureliaApp?.showNotification(`${product.name} added to cart!`, 'success');
        
        // Animate cart icon
        this.animateCartIcon();
    }

    removeFromCart(itemId, size, color) {
        this.items = this.items.filter(item => 
            !(item.id === itemId && item.selectedSize === size && item.selectedColor === color)
        );
        
        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
    }

    updateQuantity(itemId, size, color, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(itemId, size, color);
            return;
        }

        const itemIndex = this.items.findIndex(item => 
            item.id === itemId && 
            item.selectedSize === size && 
            item.selectedColor === color
        );

        if (itemIndex > -1) {
            this.items[itemIndex].quantity = newQuantity;
            this.saveCart();
            this.updateCartDisplay();
            this.renderCartItems();
        }
    }

    getCartTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        const itemCount = this.getCartItemCount();
        const total = this.getCartTotal();

        if (cartCount) {
            if (itemCount > 0) {
                cartCount.textContent = itemCount;
                cartCount.classList.remove('hidden');
            } else {
                cartCount.classList.add('hidden');
            }
        }

        if (cartSubtotal) {
            cartSubtotal.textContent = this.formatCurrency(total);
        }

        if (cartTotal) {
            cartTotal.textContent = this.formatCurrency(total);
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = itemCount === 0;
        }
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-shopping-bag text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Your bag is empty</p>
                    <button onclick="window.aureliaApp?.scrollToSection('collections')" 
                            class="mt-4 text-gold hover:text-charcoal transition-colors">
                        Start Shopping
                    </button>
                </div>
            `;
            return;
        }

        const itemsHTML = this.items.map(item => `
            <div class="cart-item border-b border-gray-200 pb-4 mb-4">
                <div class="flex space-x-4">
                    <img src="${item.image}" alt="${item.name}" 
                         class="w-16 h-20 object-cover rounded">
                    <div class="flex-1">
                        <h4 class="font-semibold text-sm mb-1">${item.name}</h4>
                        ${item.selectedSize ? `<p class="text-xs text-gray-600">Size: ${item.selectedSize}</p>` : ''}
                        ${item.selectedColor ? `<p class="text-xs text-gray-600">Color: ${item.selectedColor}</p>` : ''}
                        <div class="flex items-center justify-between mt-2">
                            <div class="flex items-center space-x-2">
                                <button onclick="cart.updateQuantity('${item.id}', '${item.selectedSize}', '${item.selectedColor}', ${item.quantity - 1})" 
                                        class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100">
                                    −
                                </button>
                                <span class="text-sm font-medium">${item.quantity}</span>
                                <button onclick="cart.updateQuantity('${item.id}', '${item.selectedSize}', '${item.selectedColor}', ${item.quantity + 1})" 
                                        class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100">
                                    +
                                </button>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-sm">${this.formatCurrency(item.price * item.quantity)}</p>
                                <button onclick="cart.removeFromCart('${item.id}', '${item.selectedSize}', '${item.selectedColor}')" 
                                        class="text-xs text-red-500 hover:text-red-700">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        cartItems.innerHTML = itemsHTML;
    }

    openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }
    }

    animateCartIcon() {
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cartBtn.style.transform = 'scale(1)';
            }, 200);
        }
    }

    proceedToCheckout() {
        if (this.items.length === 0) {
            window.aureliaApp?.showNotification('Your cart is empty!', 'error');
            return;
        }

        // In a real application, this would redirect to a secure checkout page
        window.aureliaApp?.showNotification('Redirecting to secure checkout...', 'info');
        
        // Simulate checkout process
        setTimeout(() => {
            const orderTotal = this.getCartTotal();
            const orderItems = [...this.items];
            
            // Clear cart
            this.clearCart();
            
            // Show success message
            window.aureliaApp?.showNotification(
                `Order placed successfully! Total: ${this.formatCurrency(orderTotal)}`, 
                'success'
            );
            
            this.closeCart();
            
            // In a real app, you would send order data to your backend
            console.log('Order placed:', { items: orderItems, total: orderTotal });
        }, 2000);
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
    }

    saveCart() {
        localStorage.setItem('aurelia_cart', JSON.stringify(this.items));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Method to get cart data for external use
    getCartData() {
        return {
            items: [...this.items],
            total: this.getCartTotal(),
            itemCount: this.getCartItemCount()
        };
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}