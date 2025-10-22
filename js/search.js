// Advanced Search Functionality for AURELIA Fashion Website

class SearchSystem {
    constructor() {
        this.products = [];
        this.collections = [];
        this.blogPosts = [];
        this.searchIndex = new Map();
        this.init();
    }

    async init() {
        await this.loadSearchData();
        this.buildSearchIndex();
        this.setupSearchEventListeners();
    }

    async loadSearchData() {
        try {
            // Load products
            const productsResponse = await fetch('tables/products?limit=100');
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                this.products = productsData.data || [];
            }

            // Load collections
            const collectionsResponse = await fetch('tables/collections?limit=50');
            if (collectionsResponse.ok) {
                const collectionsData = await collectionsResponse.json();
                this.collections = collectionsData.data || [];
            }

            // Load blog posts
            const blogResponse = await fetch('tables/blog_posts?limit=50');
            if (blogResponse.ok) {
                const blogData = await blogResponse.json();
                this.blogPosts = blogData.data || [];
            }
        } catch (error) {
            console.error('Error loading search data:', error);
        }
    }

    buildSearchIndex() {
        // Clear existing index
        this.searchIndex.clear();

        // Index products
        this.products.forEach(product => {
            const searchTerms = [
                product.name,
                product.description,
                product.category,
                product.subcategory,
                product.materials,
                ...(product.tags || []),
                ...(product.colors || []),
                ...(product.sizes || [])
            ].filter(term => term).map(term => term.toString().toLowerCase());

            searchTerms.forEach(term => {
                if (!this.searchIndex.has(term)) {
                    this.searchIndex.set(term, []);
                }
                this.searchIndex.get(term).push({
                    type: 'product',
                    data: product,
                    relevance: this.calculateRelevance(term, product.name)
                });
            });
        });

        // Index collections
        this.collections.forEach(collection => {
            const searchTerms = [
                collection.name,
                collection.description,
                collection.season,
                collection.theme,
            ].filter(term => term).map(term => term.toString().toLowerCase());

            searchTerms.forEach(term => {
                if (!this.searchIndex.has(term)) {
                    this.searchIndex.set(term, []);
                }
                this.searchIndex.get(term).push({
                    type: 'collection',
                    data: collection,
                    relevance: this.calculateRelevance(term, collection.name)
                });
            });
        });

        // Index blog posts
        this.blogPosts.forEach(post => {
            if (!post.published) return;
            
            const searchTerms = [
                post.title,
                post.excerpt,
                post.content,
                post.author,
                post.category,
                ...(post.tags || [])
            ].filter(term => term).map(term => term.toString().toLowerCase());

            searchTerms.forEach(term => {
                if (!this.searchIndex.has(term)) {
                    this.searchIndex.set(term, []);
                }
                this.searchIndex.get(term).push({
                    type: 'blog',
                    data: post,
                    relevance: this.calculateRelevance(term, post.title)
                });
            });
        });
    }

    calculateRelevance(term, title) {
        // Higher relevance for exact matches in titles
        if (title && title.toLowerCase().includes(term)) {
            return title.toLowerCase() === term ? 10 : 5;
        }
        return 1;
    }

    setupSearchEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300); // Debounce search
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.getElementById('closeSearch')?.click();
                }
            });
        }
    }

    performSearch(query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!query || query.trim().length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        const results = this.search(query.trim());
        this.renderSearchResults(results);
    }

    search(query) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const resultMap = new Map();

        queryTerms.forEach(term => {
            // Find exact matches
            if (this.searchIndex.has(term)) {
                this.searchIndex.get(term).forEach(item => {
                    const key = `${item.type}-${item.data.id}`;
                    if (!resultMap.has(key)) {
                        resultMap.set(key, { ...item, score: 0 });
                    }
                    resultMap.get(key).score += item.relevance * 2; // Boost exact matches
                });
            }

            // Find partial matches
            for (const [indexTerm, items] of this.searchIndex.entries()) {
                if (indexTerm.includes(term) && indexTerm !== term) {
                    items.forEach(item => {
                        const key = `${item.type}-${item.data.id}`;
                        if (!resultMap.has(key)) {
                            resultMap.set(key, { ...item, score: 0 });
                        }
                        resultMap.get(key).score += item.relevance;
                    });
                }
            }
        });

        // Convert to array and sort by score
        return Array.from(resultMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Limit to top 10 results
    }

    renderSearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-search text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No results found</p>
                    <p class="text-sm text-gray-400 mt-2">Try different keywords or browse our collections</p>
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(result => {
            switch (result.type) {
                case 'product':
                    return this.renderProductResult(result.data);
                case 'collection':
                    return this.renderCollectionResult(result.data);
                case 'blog':
                    return this.renderBlogResult(result.data);
                default:
                    return '';
            }
        }).join('');

        searchResults.innerHTML = `
            <div class="search-results">
                <p class="text-sm text-gray-600 mb-4">${results.length} result${results.length !== 1 ? 's' : ''} found</p>
                ${resultsHTML}
            </div>
        `;
    }

    renderProductResult(product) {
        return `
            <div class="search-result-item" onclick="this.viewProduct('${product.id}')">
                <div class="flex space-x-3">
                    <img src="${product.images[0] || ''}" alt="${product.name}" 
                         class="w-12 h-12 object-cover rounded flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">${product.name}</h4>
                        <p class="text-xs text-gray-600 capitalize">${product.category.replace('_', ' ')} • ${product.subcategory || ''}</p>
                        <p class="text-sm font-semibold text-gold mt-1">$${product.price}</p>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-arrow-right text-gray-400 text-sm"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderCollectionResult(collection) {
        return `
            <div class="search-result-item" onclick="this.viewCollection('${collection.id}')">
                <div class="flex space-x-3">
                    <img src="${collection.cover_image || ''}" alt="${collection.name}" 
                         class="w-12 h-12 object-cover rounded flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">${collection.name}</h4>
                        <p class="text-xs text-gray-600">${collection.season} Collection</p>
                        <p class="text-xs text-gray-500 mt-1 truncate">${collection.theme}</p>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-arrow-right text-gray-400 text-sm"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderBlogResult(post) {
        return `
            <div class="search-result-item" onclick="this.viewBlogPost('${post.id}')">
                <div class="flex space-x-3">
                    <img src="${post.featured_image || ''}" alt="${post.title}" 
                         class="w-12 h-12 object-cover rounded flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm truncate">${post.title}</h4>
                        <p class="text-xs text-gray-600 capitalize">${post.category} • By ${post.author}</p>
                        <p class="text-xs text-gray-500 mt-1 truncate">${post.excerpt}</p>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-arrow-right text-gray-400 text-sm"></i>
                    </div>
                </div>
            </div>
        `;
    }

    viewProduct(productId) {
        // In a real app, this would navigate to the product page
        console.log('Navigate to product:', productId);
        document.getElementById('closeSearch')?.click();
        
        // Scroll to featured products section as demo
        window.aureliaApp?.scrollToSection('featuredProducts');
        window.aureliaApp?.showNotification('Product page would open here', 'info');
    }

    viewCollection(collectionId) {
        console.log('Navigate to collection:', collectionId);
        document.getElementById('closeSearch')?.click();
        
        // Scroll to collections section as demo
        window.aureliaApp?.scrollToSection('collections');
        window.aureliaApp?.showNotification('Collection page would open here', 'info');
    }

    viewBlogPost(postId) {
        console.log('Navigate to blog post:', postId);
        document.getElementById('closeSearch')?.click();
        
        // Scroll to blog section as demo
        window.aureliaApp?.scrollToSection('blog');
        window.aureliaApp?.showNotification('Blog post would open here', 'info');
    }

    // Method to get search suggestions
    getSearchSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];
        
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        for (const term of this.searchIndex.keys()) {
            if (term.includes(queryLower) && suggestions.size < limit) {
                suggestions.add(term);
            }
        }
        
        return Array.from(suggestions);
    }

    // Filter methods for category-specific searches
    searchProducts(query, category = null) {
        const results = this.search(query);
        return results
            .filter(result => result.type === 'product')
            .filter(result => !category || result.data.category === category)
            .map(result => result.data);
    }

    searchCollections(query) {
        const results = this.search(query);
        return results
            .filter(result => result.type === 'collection')
            .map(result => result.data);
    }

    searchBlog(query, category = null) {
        const results = this.search(query);
        return results
            .filter(result => result.type === 'blog')
            .filter(result => !category || result.data.category === category)
            .map(result => result.data);
    }
}

// Initialize search system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchSystem = new SearchSystem();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchSystem;
}