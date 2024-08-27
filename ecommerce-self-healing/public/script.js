document.addEventListener('DOMContentLoaded', () => {
    const addToCartForms = document.querySelectorAll('.add-to-cart-form');
    
    addToCartForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = form.dataset.productId;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.productId = productId;  // Add the productId to the data object
            
            try {
                const response = await fetch('/add-to-cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Product added to cart!');
                } else {
                    alert(result.message || 'Failed to add product to cart');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while adding the product to cart');
            }
        });
    });
});