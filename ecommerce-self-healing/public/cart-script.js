document.addEventListener('DOMContentLoaded', () => {
    const checkoutButton = document.getElementById('checkout-button');
    
    if (checkoutButton) {
        checkoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Checkout successful!');
                    window.location.href = '/';
                } else {
                    alert('Checkout failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during checkout');
            }
        });
    }
});