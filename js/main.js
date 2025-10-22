// Main JavaScript for Luxury Fashion Website

class AureliaApp {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupAnimations();
    }

    init() {
        console.log('AURELIA Fashion Website Initialized');
        this.setupMobileMenu();
        this.setupScrollEffects();
        this.setupNewsletterSignup();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchOverlay = document.getElementById('searchOverlay');
        const closeSearch = document.getElementById('closeSearch');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn && searchOverlay) {
            searchBtn.addEventListener('click', () => {
                searchOverlay.classList.remove('hidden');
                searchInput?.focus();
            });
        }

        if (closeSearch && searchOverlay) {
            closeSearch.addEventListener('click', () => {
                searchOverlay.classList.add('hidden');
            });
        }

        // Close search on overlay click
        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    searchOverlay.classList.add('hidden');
                }
            });
        }

        // Search input functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Newsletter signup
        const subscribeBtn = document.getElementById('subscribeBtn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => {
                this.handleNewsletterSignup();
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            });
        });
    }

    setupMobileMenu() {
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    setupScrollEffects() {
        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.classList.add('bg-white/98');
                header.classList.remove('bg-white/95');
            } else {
                header.classList.add('bg-white/95');
                header.classList.remove('bg-white/98');
            }
        });
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all elements with animation classes
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
            observer.observe(el);
        });
    }

    setupNewsletterSignup() {
        const newsletterEmail = document.getElementById('newsletterEmail');
        if (newsletterEmail) {
            newsletterEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleNewsletterSignup();
                }
            });
        }
    }

    handleNewsletterSignup() {
        const emailInput = document.getElementById('newsletterEmail');
        const subscribeBtn = document.getElementById('subscribeBtn');
        
        if (!emailInput || !subscribeBtn) return;
        
        const email = emailInput.value.trim();
        
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Disable button and show loading
        subscribeBtn.disabled = true;
        subscribeBtn.textContent = 'Subscribing...';

        // Simulate API call
        setTimeout(() => {
            // Store subscription in localStorage for demo
            const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
            
            if (subscribers.includes(email)) {
                this.showNotification('You are already subscribed!', 'info');
            } else {
                subscribers.push(email);
                localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
                this.showNotification('Successfully subscribed to our newsletter!', 'success');
                emailInput.value = '';
            }

            // Reset button
            subscribeBtn.disabled = false;
            subscribeBtn.textContent = 'Subscribe';
        }, 1000);
    }

    handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!query.trim()) {
            searchResults.innerHTML = '';
            return;
        }

        // Mock search results - in a real app, this would be an API call
        const mockResults = [
            { type: 'product', name: 'Elegant Evening Gown', category: 'Women\'s Wear', price: '$899' },
            { type: 'product', name: 'Tailored Blazer', category: 'Men\'s Wear', price: '$549' },
            { type: 'product', name: 'Gold Chain Necklace', category: 'Accessories', price: '$299' },
            { type: 'collection', name: 'Spring 2024 Collection', category: 'Seasonal' },
            { type: 'blog', name: 'Fashion Trends for Spring', category: 'Blog' }
        ];

        const filteredResults = mockResults.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredResults.length === 0) {
            searchResults.innerHTML = '<p class="text-gray-500 text-center py-4">No results found</p>';
            return;
        }

        const resultsHTML = filteredResults.map(result => `
            <div class="search-result-item">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold">${result.name}</h4>
                        <p class="text-sm text-gray-600">${result.category}</p>
                    </div>
                    ${result.price ? `<span class="font-semibold text-gold">${result.price}</span>` : ''}
                </div>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHTML;
    }

    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = 80; // Account for fixed header
            const targetPosition = element.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-6 z-50 max-w-sm bg-white border-l-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        // Set border color based on type
        const borderColors = {
            success: 'border-green-500',
            error: 'border-red-500',
            info: 'border-blue-500'
        };
        
        notification.classList.add(borderColors[type] || borderColors.info);
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <button class="ml-3 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Add close functionality
        const closeBtn = notification.querySelector('button');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }
        }, 5000);
    }

    // Utility method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Method to handle loading states
    showLoading(element, show = true) {
        if (show) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }
}

// Global utility functions
window.scrollToSection = function(sectionId) {
    const app = window.aureliaApp;
    if (app) {
        app.scrollToSection(sectionId);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aureliaApp = new AureliaApp();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - can pause non-essential operations
        console.log('Page hidden - pausing animations');
    } else {
        // Page is visible - resume operations
        console.log('Page visible - resuming animations');
    }
});

// Service Worker registration for PWA capabilities (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}