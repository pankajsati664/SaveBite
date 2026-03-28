'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-powered discount suggestions.
 *
 * - generateDiscountSuggestion - A function that handles the discount suggestion process.
 * - DiscountSuggestionInput - The input type for the generateDiscountSuggestion function.
 * - DiscountSuggestionOutput - The return type for the generateDiscountSuggestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiscountSuggestionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  originalPrice: z.number().positive().describe('The original price of the product.'),
  expiryDate: z.string().describe('The expiry date of the product in YYYY-MM-DD format.'),
});
export type DiscountSuggestionInput = z.infer<typeof DiscountSuggestionInputSchema>;

const DiscountSuggestionOutputSchema = z.object({
  suggestedDiscountPercentage: z.number().int().min(0).max(100).describe('The suggested discount percentage (0-100) for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested discount percentage.'),
});
export type DiscountSuggestionOutput = z.infer<typeof DiscountSuggestionOutputSchema>;

export async function generateDiscountSuggestion(input: DiscountSuggestionInput): Promise<DiscountSuggestionOutput> {
  return generateDiscountSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'discountSuggestionPrompt',
  input: {
    schema: z.object({
      productName: z.string(),
      originalPrice: z.number(),
      daysUntilExpiry: z.number().int().min(0),
    }),
  },
  output: { schema: DiscountSuggestionOutputSchema },
  prompt: `You are an AI assistant specialized in retail and inventory management. Your goal is to help store owners reduce food waste by suggesting optimal discount percentages for products nearing their expiry date.

Consider the following information:
- Product Name: {{{productName}}}
- Original Price: {{{originalPrice}}}
- Days until expiry: {{{daysUntilExpiry}}}

Based on these factors, suggest a discount percentage (as a whole number between 0 and 100) that would encourage a quick sale. Provide a brief reasoning for your suggestion.

If days until expiry is less than or equal to 1, strongly consider recommending a significant discount (e.g., 70-90%) or even donation if sale is unlikely. If days until expiry is between 2 and 3, suggest a moderate discount (e.g., 30-60%). If days until expiry is greater than 3 but less than 7, a smaller discount (e.g., 10-25%) might be appropriate. If days until expiry is 7 or more, no discount is generally needed unless other factors are at play.

Respond in JSON format as described by the output schema.`,
});

const generateDiscountSuggestionFlow = ai.defineFlow(
  {
    name: 'generateDiscountSuggestionFlow',
    inputSchema: DiscountSuggestionInputSchema,
    outputSchema: DiscountSuggestionOutputSchema,
  },
  async (input) => {
    const today = new Date();
    // Set time to 00:00:00 for accurate day difference calculation
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(input.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    // Calculate days, rounding up to include the current day if not expired
    const daysUntilExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const { output } = await prompt({
      productName: input.productName,
      originalPrice: input.originalPrice,
      daysUntilExpiry: daysUntilExpiry,
    });
    return output!;
  }
);
