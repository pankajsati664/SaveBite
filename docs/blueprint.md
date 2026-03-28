# **App Name**: FoodSaver AI

## Core Features:

- Secure User Authentication & Role Management: User registration and login via email/password and Google Sign-In, with role assignment (Store Owner, Customer, NGO, Admin) to control access to specific application functionalities.
- Product Inventory Management: Store Owners can add new products with name, quantity, expiry date, and price. Features visual expiry status (green/yellow/red) and options to edit or delete product entries.
- Expiry-Driven AI Suggestions Tool: An AI-powered tool that automatically suggests actions based on product expiry: recommending discounts for items expiring within 3 days and suggesting donation for items expiring within 1 day.
- Customer Marketplace Browsing: Customers can view a public marketplace listing near-expiry discounted products, with filtering options for price and time until expiry, and product details including images and discount percentage.
- NGO Donation Management: NGOs can browse a list of available surplus items marked for donation and claim them. Store Owners can manage donated items and mark them as successfully donated after pickup.
- Dashboard Analytics & Alerts: Personalized dashboards for each user role, providing a summary of key data (e.g., total products, expiring items, donations made) and push notifications for urgent expiry alerts.
- Real-time Data Sync: Ensures that all product data, expiry statuses, and inventory updates are reflected instantly across the application for all users using Firebase's real-time capabilities.

## Style Guidelines:

- Light color scheme with a primary green accent reflecting freshness and sustainability. Primary color for interactive elements and highlights: #47A329. Background for main content areas: #F1F4F0. Accent color for calls to action or interactive indicators: #70EB47.
- Functional colors will be used to convey status: Green for 'Fresh', Yellow for 'Near Expiry', and Red for 'Expired' products, aligning with user requirements for clear visual cues.
- The 'Inter' sans-serif typeface is recommended for both headlines and body text, offering a modern, clean, and highly readable appearance suitable for data-heavy dashboard interfaces.
- Utilize modern, outline-style icons that are intuitive and consistent across the application to represent product categories, navigation, and actions, ensuring visual clarity and ease of use.
- The layout will follow a modern dashboard aesthetic with a clear information hierarchy, featuring clean cards and tables for data presentation, and ensuring full responsiveness across all device sizes.
- Incorporate subtle animations for state changes, data loading, and transitions between views to enhance the user experience without being distracting, making the interface feel fluid and responsive.