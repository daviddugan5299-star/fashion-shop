// Dynamic Content Loader for AURELIA Fashion Website

class ContentLoader {
    constructor() {
        this.products = [];
        this.collections = [];
        this.blogPosts = [];
        this.testimonials = [];
        this.init();
    }

    async init() {
        try {
            await this.loadAllData();
            this.renderAllSections();
        } catch (error) {
            console.error('Error initializing content:', error);
        }
    }

    async loadAllData() {
        const promises = [
            this.loadProducts(),
            this.loadCollections(),
            this.loadBlogPosts(),
            this.loadTestimonials()
        ];

        await Promise.all(promises);
    }

    async loadProducts() {
        try {
            const response = await fetch('tables/products?limit=50');
            if (response.ok) {
                const data = await response.json();
                this.products = data.data || [];
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadCollections() {
        try {
            const response = await fetch('tables/collections?limit=20');
            if (response.ok) {
                const data = await response.json();
                this.collections = data.data || [];
            }
        } catch (error) {
            console.error('Error loading collections:', error);
        }
    }

    async loadBlogPosts() {
        try {
            const response = await fetch('tables/blog_posts?limit=20');
            if (response.ok) {
                const data = await response.json();
                this.blogPosts = data.data?.filter(post => post.published) || [];
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
        }
    }

    async loadTestimonials() {
        try {
            const response = await fetch('tables/testimonials?limit=20');
            if (response.ok) {
                const data = await response.json();
                this.testimonials = data.data || [];
            }
        } catch (error) {
            console.error('Error loading testimonials:', error);
        }
    }

    renderAllSections() {
        this.renderCollections();
        this.renderFeaturedProducts();
        this.renderBlogPosts();
        this.renderTestimonials();
        this.setupCategoryClickHandlers();
    }

    renderCollections() {
        const container = document.getElementById('collectionsGrid');
        if (!container) return;

        const featuredCollections = this.collections.filter(c => c.featured);
        
        if (featuredCollections.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full">No collections available</p>';
            return;
        }

        const collectionsHTML = featuredCollections.map(collection => `
            <div class="collection-card fade-in" data-collection-id="${collection.id}">
                <div class="relative overflow-hidden rounded-xl aspect-[4/5] mb-6 cursor-pointer group">
                    <img src="${collection.cover_image}" alt="${collection.name}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div class="absolute bottom-6 left-6 right-6 text-white">
                        <h3 class="text-2xl font-playfair font-semibold mb-2">${collection.name}</h3>
                        <p class="text-sm opacity-90">${collection.season}</p>
                        <p class="text-sm mt-2 line-clamp-2">${this.stripHtml(collection.description)}</p>
                    </div>
                </div>
                <button onclick="contentLoader.viewCollection('${collection.id}')" 
                        class="btn-primary bg-charcoal text-white px-6 py-3 rounded-lg hover:bg-gold transition-colors w-full">
                    View Collection
                </button>
            </div>
        `).join('');

        container.innerHTML = collectionsHTML;
    }

    renderFeaturedProducts() {
        const container = document.getElementById('featuredProducts');
        if (!container) return;

        const featuredProducts = this.products.filter(p => p.featured && p.in_stock);
        
        if (featuredProducts.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full">No featured products available</p>';
            return;
        }

        const productsHTML = featuredProducts.slice(0, 6).map(product => `
            <div class="product-card fade-in" data-product-id="${product.id}">
                <div class="product-image mb-4 cursor-pointer" onclick="contentLoader.viewProduct('${product.id}')">
                    <img src="${product.images[0]}" alt="${product.name}" 
                         class="w-full h-full object-cover">
                    ${product.original_price && product.original_price > product.price ? `
                        <div class="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                            SALE
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="font-playfair font-semibold text-lg mb-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${this.stripHtml(product.description)}</p>
                    <p class="text-xs text-gray-500 mb-4 capitalize">${product.category.replace('_', ' ')} • ${product.materials}</p>
                    
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
                            <select class="text-sm border border-gray-200 rounded px-2 py-1 product-size-select">
                                <option value="">Select Size</option>
                                ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <button onclick="contentLoader.addToCart('${product.id}')" 
                            class="w-full bg-charcoal text-white py-3 rounded-lg hover:bg-gold transition-colors add-to-cart-btn">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    }

    renderBlogPosts() {
        const container = document.getElementById('blogGrid');
        if (!container) return;

        if (this.blogPosts.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full">No blog posts available</p>';
            return;
        }

        const postsHTML = this.blogPosts.slice(0, 6).map(post => `
            <article class="blog-card fade-in cursor-pointer" onclick="contentLoader.viewBlogPost('${post.id}')">
                <div class="blog-image mb-4">
                    <img src="${post.featured_image}" alt="${post.title}" 
                         class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <div class="flex items-center text-xs text-gray-500 mb-3">
                        <span class="capitalize">${post.category}</span>
                        <span class="mx-2">•</span>
                        <span>By ${post.author}</span>
                        <span class="mx-2">•</span>
                        <span>${post.reading_time} min read</span>
                    </div>
                    <h3 class="font-playfair font-semibold text-xl mb-3 line-clamp-2">${post.title}</h3>
                    <p class="text-gray-600 text-sm line-clamp-3 mb-4">${post.excerpt}</p>
                    
                    ${post.tags?.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${post.tags.slice(0, 3).map(tag => `
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500">
                            ${this.formatDate(post.publish_date)}
                        </span>
                        <span class="text-gold text-sm font-medium hover:text-charcoal transition-colors">
                            Read More →
                        </span>
                    </div>
                </div>
            </article>
        `).join('');

        container.innerHTML = postsHTML;
    }

    renderTestimonials() {
        const container = document.getElementById('testimonialsGrid');
        if (!container) return;

        const featuredTestimonials = this.testimonials.filter(t => t.featured);
        
        if (featuredTestimonials.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 col-span-full">No testimonials available</p>';
            return;
        }

        const testimonialsHTML = featuredTestimonials.map(testimonial => `
            <div class="testimonial-card fade-in">
                <div class="testimonial-avatar mb-4">
                    <img src="${testimonial.avatar_image}" alt="${testimonial.customer_name}" 
                         class="w-full h-full object-cover">
                </div>
                
                <div class="flex justify-center mb-4">
                    ${Array.from({ length: 5 }, (_, i) => `
                        <i class="fas fa-star ${i < testimonial.rating ? 'text-gold' : 'text-gray-300'} text-sm"></i>
                    `).join('')}
                </div>

                <blockquote class="text-gray-700 text-center mb-6 line-clamp-4">
                    "${this.stripHtml(testimonial.testimonial_text)}"
                </blockquote>

                <div class="text-center">
                    <h4 class="font-semibold text-charcoal">${testimonial.customer_name}</h4>
                    <p class="text-sm text-gray-600">${testimonial.customer_title}</p>
                    ${testimonial.product_purchased ? `
                        <p class="text-xs text-gold mt-1">Purchased: ${testimonial.product_purchased}</p>
                    ` : ''}
                    ${testimonial.verified ? `
                        <div class="flex items-center justify-center mt-2">
                            <i class="fas fa-check-circle text-green-500 text-xs mr-1"></i>
                            <span class="text-xs text-green-600">Verified Purchase</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = testimonialsHTML;
    }

    setupCategoryClickHandlers() {
        // Add click handlers for category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryId = card.id;
                this.viewCategory(categoryId);
            });
        });
    }

    // Navigation methods
    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // In a real app, this would navigate to a detailed product page
        console.log('View product:', product);
        window.aureliaApp?.showNotification(`Opening ${product.name} details...`, 'info');
        
        // For demo, show a modal or redirect
        this.showProductModal(product);
    }

    viewCollection(collectionId) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;

        console.log('View collection:', collection);
        window.aureliaApp?.showNotification(`Opening ${collection.name} collection...`, 'info');
    }

    viewBlogPost(postId) {
        const post = this.blogPosts.find(p => p.id === postId);
        if (!post) return;

        console.log('View blog post:', post);
        window.aureliaApp?.showNotification(`Opening "${post.title}" article...`, 'info');
    }

    viewCategory(categoryId) {
        const categoryProducts = this.products.filter(p => 
            p.category === categoryId && p.in_stock
        );

        console.log(`View ${categoryId} category:`, categoryProducts);
        window.aureliaApp?.showNotification(`Showing ${categoryId.replace('_', ' ')} collection...`, 'info');
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

        const selectedColor = product.colors?.[0] || null; // Default to first color
        
        window.cart.addToCart(product, selectedSize, selectedColor);
    }

    showProductModal(product) {
        // Create a simple product modal for demo
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-playfair font-semibold">${product.name}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <img src="${product.images[0]}" alt="${product.name}" 
                                 class="w-full aspect-square object-cover rounded-lg">
                        </div>
                        <div>
                            <p class="text-2xl font-semibold text-gold mb-4">$${product.price}</p>
                            <p class="text-gray-700 mb-4">${this.stripHtml(product.description)}</p>
                            
                            ${product.sizes?.length > 0 ? `
                                <div class="mb-4">
                                    <label class="block text-sm font-medium mb-2">Size:</label>
                                    <div class="size-guide">
                                        ${product.sizes.map(size => `
                                            <div class="size-option" data-size="${size}">${size}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${product.colors?.length > 0 ? `
                                <div class="mb-4">
                                    <label class="block text-sm font-medium mb-2">Colors:</label>
                                    <div class="flex space-x-2">
                                        ${product.colors.map(color => `
                                            <div class="color-option w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer" 
                                                 style="background-color: ${this.getColorHex(color)}"
                                                 title="${color}" data-color="${color}"></div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <button class="modal-add-to-cart w-full bg-charcoal text-white py-3 rounded-lg hover:bg-gold transition-colors">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners for modal
        const closeBtn = modal.querySelector('.close-modal');
        const addToCartBtn = modal.querySelector('.modal-add-to-cart');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
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

        addToCartBtn.addEventListener('click', () => {
            const selectedSize = modal.querySelector('.size-option.selected')?.dataset.size || null;
            const selectedColor = modal.querySelector('.color-option.ring-2')?.dataset.color || product.colors?.[0] || null;
            
            if (product.sizes?.length > 0 && !selectedSize) {
                window.aureliaApp?.showNotification('Please select a size', 'error');
                return;
            }

            window.cart?.addToCart(product, selectedSize, selectedColor);
            document.body.removeChild(modal);
        });
    }

    // Utility methods
    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

// Initialize content loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contentLoader = new ContentLoader();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentLoader;
}