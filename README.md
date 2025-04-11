# BillExpress

![BillExpress Logo](public/BillExpress.svg)

BillExpress is a modern web application for personal finance management, allowing you to track your income, expenses, and bank accounts all in one place.

## 🚀 Features

-   **Transaction Management**: Easily record and categorize income and expenses.
-   **Multiple Accounts**: Organize your finances across different bank accounts or cash.
-   **Smart Categorization**: Automatically classify your transactions.
-   **Advanced Filters**: Quickly find any transaction by type, category, or account.
-   **Visual Statistics**: Visualize your finances with charts and reports.
-   **Responsive Interface**: Works perfectly on mobile and desktop devices.
-   **Dark Theme**: Light/dark mode to suit your preferences.
-   **Secure Authentication**: Registration and login system with Firebase.

## 🛠️ Technologies

-   **Frontend**: Next.js, React, TypeScript
-   **UI**: Tailwind CSS, Shadcn UI
-   **Authentication**: Firebase Authentication
-   **Database**: Firebase Firestore
-   **Storage**: Firebase Storage
-   **Charts**: Recharts
-   **Date Formatting**: date-fns
-   **State Management**: Zustand
-   **Runtime**: Bun

## 📋 Prerequisites

-   Bun (latest version)
-   Firebase Account

## 🔧 Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/tu-usuario/billexpress.git
    cd billexpress
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Configure environment variables:
    Create a `.env.local` file in the project root with the following variables:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```

4.  Start the development server:
```bash
bun dev
```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

BillExpress offers an intuitive workflow designed to help you manage your finances efficiently.

### 🔐 Getting Started

1. **Register & Login**: Create a personal account with your email address. After verifying your email, you'll have immediate access to your financial dashboard.

2. **Dashboard Overview**: Upon first login, you'll see your dashboard with these key areas:
   - Summary of account balances
   - Recent transactions
   - Quick add transaction button
   - Income vs. expense breakdown

### 💰 Managing Your Accounts

BillExpress automatically creates a default "Cash" account when you register:
- This cash account serves as the foundation of your financial tracking
- The default cash account **cannot be deleted** to ensure you always have a way to track physical money
- This design ensures consistent financial tracking even if you close bank accounts

To set up additional accounts:
1. Navigate to the Accounts section
2. Click "Add New Account"
3. Choose a name (e.g., "Main Bank", "Savings")
4. Select a distinctive color for easy visual identification
5. Add an optional initial balance

### 📝 Recording Transactions

Every financial movement can be tracked in two simple ways:

**Quick Add**:
1. Click the "+" button from any screen
2. Select income or expense
3. Enter amount, description, and date
4. Choose category (e.g., Food, Transportation, Salary)
5. Select which account to associate with the transaction

**Batch Management**:
- Use the Transactions tab to view, filter, and manage all your financial movements
- Edit any transaction by clicking on it
- Delete transactions you no longer need to track

### 🔍 Powerful Filtering System

Find exactly what you need with our multi-layered filters:
- **Type filter**: Toggle between income and expenses
- **Category filter**: Narrow down to specific spending or income categories
- **Account filter**: View transactions from specific accounts
- **Search**: Find specific transactions by description

Each filter shows visual indicators (icons and colors) to help you quickly identify your selection.

### 📊 Analytics & Insights

Track your financial progress through visual analytics:
- Monthly spending by category
- Income vs. expense trends
- Account balance history
- Projected savings based on current habits

### 💡 Tips for Best Results

- **Regular Usage**: For the most accurate overview, try recording transactions daily
- **Proper Categorization**: Consistently categorize similar expenses to improve analytics
- **Use Tags**: For more detailed filtering, add custom tags to related transactions
- **Review Monthly**: Schedule time each month to review your financial trends

## 🔒 Security

-   All transactions are associated with a specific user.
-   Data is securely stored in Firebase.
-   Firestore rules ensure that each user can only access their own data.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributions

Contributions are welcome. Please open an issue first to discuss what you would like to change.

## 📞 Contact

If you have any questions or suggestions, feel free to contact me:

-   Email: <diegoperezperez518@gmail.com>
-   Twitter: [@your-twitter-handle](https://twitter.com/your-twitter-handle)
-   GitHub: [your-github-username](https://github.com/your-github-username)
