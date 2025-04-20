// src/services/api.ts
import { Transaction, Budget, SavingsGoal } from '@/hooks/useFinanceData';

const API_URL = 'http://127.0.0.1:5000/api';

// Helper to handle API errors
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || response.statusText);
    }

    // Return null for 204 responses (no content)
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// Transactions API
export const transactionsApi = {
    getAll: async (): Promise<Transaction[]> => {
        const response = await fetch(`${API_URL}/transactions`);
        return handleResponse(response);
    },

    getById: async (id: string): Promise<Transaction> => {
        const response = await fetch(`${API_URL}/transactions/${id}`);
        return handleResponse(response);
    },

    create: async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },
};

// Budgets API
export const budgetsApi = {
    getAll: async (): Promise<Budget[]> => {
        const response = await fetch(`${API_URL}/budgets`);
        return handleResponse(response);
    },

    getById: async (id: string): Promise<Budget> => {
        const response = await fetch(`${API_URL}/budgets/${id}`);
        return handleResponse(response);
    },

    getByPeriod: async (year: number, month: number): Promise<Budget[]> => {
        const response = await fetch(`${API_URL}/budgets/period/${year}/${month}`);
        return handleResponse(response);
    },

    create: async (data: Omit<Budget, 'id' | 'spent'>): Promise<Budget> => {
        const response = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: string, data: Partial<Budget>): Promise<Budget> => {
        const response = await fetch(`${API_URL}/budgets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/budgets/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    createNextMonth: async (): Promise<{message: string; budgets: Budget[]}> => {
        const response = await fetch(`${API_URL}/budgets/create-next-month`, {
            method: 'POST',
        });
        return handleResponse(response);
    },
};

// Savings Goals API
export const savingsGoalsApi = {
    getAll: async (): Promise<SavingsGoal[]> => {
        const response = await fetch(`${API_URL}/savings-goals`);
        return handleResponse(response);
    },

    getById: async (id: string): Promise<SavingsGoal> => {
        const response = await fetch(`${API_URL}/savings-goals/${id}`);
        return handleResponse(response);
    },

    create: async (data: Omit<SavingsGoal, 'id' | 'currentAmount'>): Promise<SavingsGoal> => {
        const response = await fetch(`${API_URL}/savings-goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: string, data: Partial<SavingsGoal>): Promise<SavingsGoal> => {
        const response = await fetch(`${API_URL}/savings-goals/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/savings-goals/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },
};

// Summary API
export const summaryApi = {
    get: async (): Promise<{
        totalIncome: number;
        totalExpenses: number;
        totalSavings: number;
        availableBalance: number;
    }> => {
        const response = await fetch(`${API_URL}/summary`);
        return handleResponse(response);
    },
};

// Development Helpers
export const devApi = {
    seedData: async (): Promise<void> => {
        const response = await fetch(`${API_URL}/seed`, {
            method: 'POST',
        });
        return handleResponse(response);
    },
};