"""
Merchant Name Suggester Module

Uses Gemini API to suggest display names and categories for unmapped merchants by analyzing
existing merchant mappings for naming pattern consistency.
"""

import json
import os
import re
from typing import Dict, List, Tuple

import google.generativeai as genai

class MerchantNameSuggester:
    """
    Class for suggesting merchant display names and categories using Gemini API.
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the merchant name suggester.

        Args:
            api_key (str, optional): Gemini API key. If None, it tries to get from environment variable.
        """
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("No Gemini API key provided. Set GEMINI_API_KEY environment variable or pass it directly.")

        # Initialize the Gemini client
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-2.0-flash"  # Using the faster model for this task

    def get_display_name_suggestions(self,
                                     unmapped_merchants: List[str],
                                     existing_mappings: Dict[str, Dict[str, str]],
                                     batch_size: int = 10) -> Dict[str, Dict[str, str]]:
        """
        Get display name and category suggestions for unmapped merchants.

        Args:
            unmapped_merchants: List of unmapped merchant names
            existing_mappings: Dictionary of existing raw_name -> {"display_name": str, "category": str}
            batch_size: Number of merchants to process in each API call

        Returns:
            Dictionary of raw_name -> {"display_name": str, "category": str}
        """
        # Process merchants in batches to avoid very large prompts
        suggested_mappings = {}

        # Process merchants in batches
        for i in range(0, len(unmapped_merchants), batch_size):
            batch = unmapped_merchants[i:i+batch_size]
            batch_suggestions = self._process_merchant_batch(batch, existing_mappings)
            suggested_mappings.update(batch_suggestions)

        return suggested_mappings

    def _process_merchant_batch(self,
                               merchant_batch: List[str],
                               existing_mappings: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
        """
        Process a batch of merchants to get display name and category suggestions.

        Args:
            merchant_batch: Batch of unmapped merchant names
            existing_mappings: Dictionary of existing mappings

        Returns:
            Dictionary of raw_name -> {"display_name": str, "category": str}
        """
        # Prepare prompt with context and request
        prompt = self._build_prompt(merchant_batch, existing_mappings)

        try:
            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                generation_config={
                    "temperature": 0.2,  # Low temperature for more consistent naming
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                },
            )

            # Extract and return suggested mappings
            return self._parse_response(response, merchant_batch)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            # Fallback: create basic mappings by just cleaning up the names
            return {merchant: {"display_name": self._basic_cleanup(merchant), "category": "Other"} 
                    for merchant in merchant_batch}

    def _build_prompt(self,
                     merchant_batch: List[str],
                     existing_mappings: Dict[str, Dict[str, str]]) -> str:
        """
        Build the prompt for Gemini API with context from existing mappings.

        Args:
            merchant_batch: List of unmapped merchant names
            existing_mappings: Dictionary of existing mappings

        Returns:
            Formatted prompt for Gemini
        """
        # Convert existing mappings to a formatted string for context
        mapping_examples = "\n".join([
            f"- Raw name: '{raw}' → Display name: '{data['display_name']}', Category: '{data['category']}'"
            for raw, data in existing_mappings.items()
        ])

        # Format the merchants that need mapping
        merchants_to_map = "\n".join([f"- {merchant}" for merchant in merchant_batch])
        
        # List available categories
        available_categories = [
            'Food & Drinks',
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
        categories_list = "\n".join([f"- {category}" for category in available_categories])

        prompt = f"""
I need to create consistent display names and categories for raw merchant names from bank transactions.

Here are examples of existing merchant name mappings for context:
{mapping_examples}

Available categories: 
{categories_list}

Please suggest display names and categories for these raw merchant names, following the same naming patterns and conventions:
{merchants_to_map}

Return your suggestions in this JSON format:
{{
  "suggested_mappings": {{
    "RAW_MERCHANT_NAME_1": {{"display_name": "Suggested Display Name 1", "category": "Suggested Category 1"}},
    "RAW_MERCHANT_NAME_2": {{"display_name": "Suggested Display Name 2", "category": "Suggested Category 2"}},
    ...
  }}
}}

Important guidelines:
1. Be concise but clear with display names
2. Maintain consistency with existing naming patterns
3. Remove unnecessary prefixes like "IC*", location numbers, and other transaction identifiers
4. Convert to proper case (e.g., "Tim Hortons" not "TIM HORTONS")
5. Choose an appropriate category from the available list
6. Return only valid JSON with the suggested mappings object
"""
        return prompt

    def _parse_response(self,
                       response,
                       merchant_batch: List[str]) -> Dict[str, Dict[str, str]]:
        """
        Parse the Gemini API response to extract the suggested mappings.

        Args:
            response: The Gemini API response
            merchant_batch: The batch of merchants that were processed

        Returns:
            Dictionary of raw_name -> {"display_name": str, "category": str}
        """
        try:
            # Extract the text response
            text_response = response.text

            # Find and extract the JSON part
            json_start = text_response.find("{")
            json_end = text_response.rfind("}") + 1

            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in response")

            json_str = text_response[json_start:json_end]
            result = json.loads(json_str)

            if "suggested_mappings" not in result:
                raise ValueError("No 'suggested_mappings' field in response JSON")

            return result["suggested_mappings"]

        except (KeyError, json.JSONDecodeError, IndexError) as e:
            print(f"Error parsing API response: {e}")
            # Fallback: create basic mappings by just cleaning up the names
            return {merchant: {"display_name": self._basic_cleanup(merchant), "category": "Other"} 
                    for merchant in merchant_batch}

    def _basic_cleanup(self, merchant_name: str) -> str:
        """
        Basic cleanup for merchant names when API parsing fails.

        Args:
            merchant_name: Raw merchant name

        Returns:
            Basic cleaned display name
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
