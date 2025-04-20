"""
Merchant service for the Finance Tracker application.

This module provides services for merchant name mapping and suggestions.
"""
from typing import Dict, List, Set, Tuple, Any
import re
from .db_service import DatabaseService
from utils.merchant_name import MerchantNameSuggester


class MerchantService:
    """
    Service class for merchant-related operations.
    Provides methods for merchant name mapping and suggestions.
    """
    
    AVAILABLE_CATEGORIES = [
        'Food & Drinks',
        'Groceries',
        'Transportation',
        'Entertainment', 
        'Education', 
        'Shopping', 
        'Health', 
        'Bills', 
        'Rent',
        'Salary',
        'Freelance',
        'Investments',
        'Side Hustle',
        'Savings',
        'Other'
    ]
    
    @staticmethod
    def match_merchant_name(merchant_name: str, mappings: Dict[str, Dict[str, str]]) -> Tuple[str, str, bool]:
        """
        Find the best display name and category for a merchant based on the mappings.
        
        Args:
            merchant_name: Raw merchant name from transaction
            mappings: Dictionary of raw_name -> {"display_name": str, "category": str}
            
        Returns:
            Tuple containing the display name, category, and whether it was mapped or not
        """
        # Check for exact match first
        if merchant_name in mappings:
            info = mappings[merchant_name]
            return info["display_name"], info["category"], True
            
        # Check for partial matches
        for raw_pattern, info in mappings.items():
            if raw_pattern in merchant_name:
                return info["display_name"], info["category"], True
                
        # Return original if no match found
        return merchant_name, "Other", False
    
    @staticmethod
    def basic_cleanup(merchant_name: str) -> str:
        """
        Basic cleanup for merchant names when no mapping exists.
        
        Args:
            merchant_name: Raw merchant name
            
        Returns:
            Cleaned display name
        """
        # Remove common prefixes
        for prefix in ["IC*", "SQ *", "TST*"]:
            if merchant_name.startswith(prefix):
                merchant_name = merchant_name[len(prefix):].strip()
                
        # Remove any trailing numbers and special characters
        merchant_name = re.sub(r'#\d+', '', merchant_name).strip()
        merchant_name = re.sub(r'\s+\d+', '', merchant_name).strip()
        
        # Title case
        merchant_name = ' '.join(word.capitalize() for word in merchant_name.lower().split())
        
        return merchant_name
    
    @staticmethod
    def identify_unmapped_merchants(transactions: List[Dict], merchant_mappings: Dict[str, Dict[str, str]]) -> Set[str]:
        """
        Identify merchants in transactions that don't have mappings.
        
        Args:
            transactions: List of transaction dictionaries
            merchant_mappings: Dictionary of merchant mappings
            
        Returns:
            Set of unmapped merchant names
        """
        unmapped_merchants = set()
        
        for transaction in transactions:
            if 'raw_merchant' in transaction:
                merchant_name = transaction['raw_merchant']
                _, _, was_mapped = MerchantService.match_merchant_name(merchant_name, merchant_mappings)
                
                if not was_mapped:
                    unmapped_merchants.add(merchant_name)
                    
        return unmapped_merchants
    
    @staticmethod
    def process_merchant_suggestions(unmapped_merchants: Set[str], api_key: str = None):
        """
        Get merchant name and category suggestions using MerchantNameSuggester.
        
        Args:
            unmapped_merchants: Set of unmapped merchant names
            api_key: Gemini API key (optional)
            
        Returns:
            Dictionary of raw_name -> {"display_name": str, "category": str}
        """
        if not unmapped_merchants:
            return {}
            
        try:
            # Get merchant mappings from database
            merchant_mappings = DatabaseService.get_all_merchant_mappings()
            
            # Get merchant name suggestions
            suggester = MerchantNameSuggester(api_key)
            suggested_mappings = suggester.get_display_name_suggestions(
                list(unmapped_merchants),
                merchant_mappings
            )
            
            # Add suggested mappings to the database
            DatabaseService.add_merchant_mappings(suggested_mappings)
            
            return suggested_mappings
            
        except Exception as e:
            print(f"Error getting merchant name suggestions: {e}")
            
            # Fallback: Use basic cleanup for merchant names
            fallback_mappings = {}
            for merchant in unmapped_merchants:
                fallback_mappings[merchant] = {
                    "display_name": MerchantService.basic_cleanup(merchant),
                    "category": "Other"
                }
                
            # Add fallback mappings to the database
            DatabaseService.add_merchant_mappings(fallback_mappings)
            
            return fallback_mappings
