// Category Page Functionality for AURELIA Fashion Website

class CategoryPage {
    constructor(category = 'womens') {
        this.category = category;
        this.products = [];
        this.filteredProducts = [];
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
    }

    async loadProducts() {
        try {
            const response = await fetch('tables/products?limit=100');
            if (response.ok) {
                const data = await response.json();
                this.products = data.data?.filter(product => 
                    product.category === this.category && product.in_stock
                ) || [];
                this.filteredProducts = [...this.products];
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setActiveFilter(e.target);
                this.filterProducts(filter);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortProducts(e.target.value);
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMore');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProducts();
            });
        }
    }

    setActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterProducts(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;

        if (filter === 'all') {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => 
                product.subcategory === filter || 
                product.tags?.includes(filter)
            );
        }

        this.sortProducts(this.currentSort);
    }

    sortProducts(sortBy) {
        this.currentSort = sortBy;

        switch (sortBy) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
            default:
                this.filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById(`${this.category}ProductsGrid`);
        if (!container) return;

        const startIndex = 0;
        const endIndex = this.currentPage * this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                    <p class="text-gray-500">Try adjusting your filters or browse all items</p>
                </div>
            `;
            this.toggleLoadMoreButton(false);
            return;
        }

        const productsHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
        container.innerHTML = productsHTML;

        // Show/hide load more button
        const hasMore = endIndex < this.filteredProducts.length;
        this.toggleLoadMoreButton(hasMore);

        // Update results count
        this.updateResultsCount(productsToShow.length, this.filteredProducts.length);
    }

    renderProductCard(product) {
        return `
            <div class="product-card fade-in" data-product-id="${product.id}">
                <div class="product-image mb-4 cursor-pointer" onclick="categoryPage.viewProduct('${product.id}')">
                    <img src="${product.images[0]}" alt="${product.name}" 
                         class="w-full h-full object-cover">
                    ${product.original_price && product.original_price > product.price ? `
                        <div class="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                            SALE
                        </div>
                    ` : ''}
                    ${product.stock_quantity <= 5 ? `
                        <div class="absolute top-4 right-4 bg-orange-500 text-white px-2 py-1 text-xs font-semibold rounded">
                            Low Stock
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="font-playfair font-semibold text-lg mb-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${this.stripHtml(product.description)}</p>
                    
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            ${product.original_price && product.original_price > product.price ? `
                                <span class="price-original mr-2">$${product.original_price}</span>
                            ` : ''}
                            <span class="price text-gold">$${product.price}</span>
                        </div>
                        <div class="flex space-x-1">
                            ${product.colors?.slice(0, 3).map(color => `
                                <div class="w-4 h-4 rounded-full border border-gray-300" 
                                     style="background-color: ${this.getColorHex(color)}"
                                     title="${color}"></div>
                            `).join('') || ''}
                        </div>
                    </div>

                    ${product.sizes?.length > 0 ? `
                        <div class="mb-4">
                            <label class="text-xs font-medium text-gray-700 mb-2 block">Size:</label>
                            <select class="text-sm border border-gray-200 rounded px-2 py-1 w-full product-size-select">
                                <option value="">Select Size</option>
                                ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <div class="flex space-x-2">
                        <button onclick="categoryPage.addToCart('${product.id}')" 
                                class="flex-1 bg-charcoal text-white py-3 rounded-lg hover:bg-gold transition-colors text-sm font-medium">
                            Add to Cart
                        </button>
                        <button onclick="categoryPage.quickView('${product.id}')" 
                                class="px-4 py-3 border border-charcoal text-charcoal rounded-lg hover:bg-charcoal hover:text-white transition-colors">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadMoreProducts() {
        this.currentPage++;
        this.renderProducts();
    }

    toggleLoadMoreButton(show) {
        const loadMoreBtn = document.getElementById('loadMore');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    updateResultsCount(showing, total) {
        // Add results count display if container exists
        const existingCount = document.querySelector('.results-count');
        if (existingCount) {
            existingCount.remove();
        }

        const container = document.getElementById(`${this.category}ProductsGrid`);
        if (container && container.parentNode) {
            const countElement = document.createElement('p');
            countElement.className = 'results-count text-sm text-gray-600 mb-6';
            countElement.textContent = `Showing ${showing} of ${total} products`;
            container.parentNode.insertBefore(countElement, container);
        }
    }

    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Navigate to product detail page or show modal
        console.log('View product:', product);
        this.showProductModal(product);
    }

    quickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.showQuickViewModal(product);
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !window.cart) return;

        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        const sizeSelect = productCard?.querySelector('.product-size-select');
        
        let selectedSize = null;
        if (sizeSelect && product.sizes?.length > 0) {
            selectedSize = sizeSelect.value;
            if (!selectedSize) {
                window.aureliaApp?.showNotification('Please select a size', 'error');
                return;
            }
        }

        const selectedColor = product.colors?.[0] || null;
        window.cart.addToCart(product, selectedSize, selectedColor);
    }

    showProductModal(product) {
        // Create detailed product modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-3xl font-playfair font-semibold mb-2">${product.name}</h2>
                            <p class="text-gray-600 capitalize">${product.category} • ${product.subcategory || ''}</p>
                        </div>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Product Images -->
                        <div>
                            <div class="main-image mb-4">
                                <img src="${product.images[0]}" alt="${product.name}" 
                                     class="w-full aspect-square object-cover rounded-lg">
                            </div>
                            ${product.images.length > 1 ? `
                                <div class="image-thumbnails grid grid-cols-4 gap-2">
                                    ${product.images.map((img, index) => `
                                        <img src="${img}" alt="${product.name}" 
                                             class="aspect-square object-cover rounded cursor-pointer hover:opacity-75 transition-opacity ${index === 0 ? 'ring-2 ring-gold' : ''}"
                                             onclick="categoryPage.changeMainImage('${img}', this)">
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Product Details -->
                        <div>
                            <div class="mb-6">
                                ${product.original_price && product.original_price > product.price ? `
                                    <div class="flex items-center space-x-3 mb-2">
                                        <span class="text-3xl font-semibold text-gold">$${product.price}</span>
                                        <span class="text-xl text-gray-500 line-through">$${product.original_price}</span>
                                        <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                            Save $${product.original_price - product.price}
                                        </span>
                                    </div>
                                ` : `
                                    <span class="text-3xl font-semibold text-gold">$${product.price}</span>
                                `}
                            </div>

                            <div class="mb-6">
                                <h3 class="font-semibold mb-2">Description</h3>
                                <p class="text-gray-700 leading-relaxed">${this.stripHtml(product.description)}</p>
                            </div>

                            <div class="mb-6">
                                <h3 class="font-semibold mb-2">Materials & Care</h3>
                                <p class="text-gray-700 mb-2">${product.materials}</p>
                                <p class="text-sm text-gray-600">${product.care_instructions}</p>
                            </div>

                            ${product.sizes?.length > 0 ? `
                                <div class="mb-6">
                                    <label class="block font-semibold mb-3">Size:</label>
                                    <div class="size-guide">
                                        ${product.sizes.map(size => `
                                            <div class="size-option" data-size="${size}">${size}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${product.colors?.length > 0 ? `
                                <div class="mb-6">
                                    <label class="block font-semibold mb-3">Color:</label>
                                    <div class="flex space-x-3">
                                        ${product.colors.map((color, index) => `
                                            <div class="color-option w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer ${index === 0 ? 'ring-2 ring-gold' : ''}" 
                                                 style="background-color: ${this.getColorHex(color)}"
                                                 title="${color}" data-color="${color}"></div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <div class="mb-6">
                                <div class="flex items-center space-x-4 mb-3">
                                    <label class="font-semibold">Quantity:</label>
                                    <div class="quantity-selector">
                                        <button class="quantity-btn minus">-</button>
                                        <input type="number" value="1" min="1" max="${product.stock_quantity}" class="quantity-input">
                                        <button class="quantity-btn plus">+</button>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600">${product.stock_quantity} items in stock</p>
                            </div>

                            <button class="modal-add-to-cart w-full bg-charcoal text-white py-4 rounded-lg hover:bg-gold transition-colors font-semibold text-lg">
                                Add to Cart
                            </button>

                            ${product.tags?.length > 0 ? `
                                <div class="mt-6">
                                    <h3 class="font-semibold mb-2">Tags:</h3>
                                    <div class="flex flex-wrap gap-2">
                                        ${product.tags.map(tag => `
                                            <span class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">${tag}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal event listeners
        this.setupModalEventListeners(modal, product);
    }

    showQuickViewModal(product) {
        // Simpler quick view modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-playfair font-semibold">Quick View</h3>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <img src="${product.images[0]}" alt="${product.name}" 
                                 class="w-full aspect-square object-cover rounded-lg">
                        </div>
                        <div>
                            <h4 class="font-semibold text-lg mb-2">${product.name}</h4>
                            <p class="text-2xl font-semibold text-gold mb-3">$${product.price}</p>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${this.stripHtml(product.description)}</p>
                            <button onclick="categoryPage.viewProduct('${product.id}'); document.body.removeChild(this.closest('.fixed'))" 
                                    class="w-full bg-charcoal text-white py-3 rounded-lg hover:bg-gold transition-colors">
                                View Full Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
    }

    setupModalEventListeners(modal, product) {
        // Close button
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => document.body.removeChild(modal));

        // Outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        // Size selection
        modal.querySelectorAll('.size-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.size-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Color selection
        modal.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.color-option').forEach(o => o.classList.remove('ring-2', 'ring-gold'));
                option.classList.add('ring-2', 'ring-gold');
            });
        });

        // Quantity controls
        const quantityInput = modal.querySelector('.quantity-input');
        const minusBtn = modal.querySelector('.quantity-btn.minus');
        const plusBtn = modal.querySelector('.quantity-btn.plus');

        minusBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            if (current > 1) quantityInput.value = current - 1;
        });

        plusBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            const max = parseInt(quantityInput.getAttribute('max'));
            if (current < max) quantityInput.value = current + 1;
        });

        // Add to cart
        const addToCartBtn = modal.querySelector('.modal-add-to-cart');
        addToCartBtn.addEventListener('click', () => {
            const selectedSize = modal.querySelector('.size-option.selected')?.dataset.size || null;
            const selectedColor = modal.querySelector('.color-option.ring-2')?.dataset.color || product.colors?.[0] || null;
            const quantity = parseInt(quantityInput.value);
            
            if (product.sizes?.length > 0 && !selectedSize) {
                window.aureliaApp?.showNotification('Please select a size', 'error');
                return;
            }

            for (let i = 0; i < quantity; i++) {
                window.cart?.addToCart(product, selectedSize, selectedColor);
            }
            
            document.body.removeChild(modal);
        });
    }

    changeMainImage(imageSrc, thumbnail) {
        const mainImage = document.querySelector('.main-image img');
        if (mainImage) {
            mainImage.src = imageSrc;
        }

        // Update thumbnail selection
        document.querySelectorAll('.image-thumbnails img').forEach(img => {
            img.classList.remove('ring-2', 'ring-gold');
        });
        thumbnail.classList.add('ring-2', 'ring-gold');
    }

    // Utility methods
    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    getColorHex(colorName) {
        const colorMap = {
            'black': '#000000',
            'white': '#FFFFFF',
            'navy': '#001f3f',
            'emerald': '#2ECC40',
            'charcoal': '#2C2C2C',
            'camel': '#C19A6B',
            'wine': '#722F37',
            'midnight blue': '#191970',
            'cognac': '#9A463D',
            'cream': '#F5F5DC',
            'gold': '#D4AF37'
        };
        return colorMap[colorName.toLowerCase()] || '#CCCCCC';
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    let category = 'womens';
    
    if (pathname.includes('mens')) category = 'mens';
    else if (pathname.includes('accessories')) category = 'accessories';
    
    window.categoryPage = new CategoryPage(category);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryPage;
}