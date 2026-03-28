'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate a marketing blurb for near-expiry products.
 *
 * - generateMarketplaceBlurb - A function that handles the generation of the marketing blurb.
 * - GenerateMarketplaceBlurbInput - The input type for the generateMarketplaceBlurb function.
 * - GenerateMarketplaceBlurbOutput - The return type for the generateMarketplaceBlurb function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMarketplaceBlurbInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  originalPrice: z.number().positive().describe('The original price of the product.'),
  discountPercentage: z.number().min(0).max(100).describe('The percentage discount applied to the product.'),
  expiryDate: z.string().describe('The expiry date of the product in YYYY-MM-DD format.'),
  productDescription: z.string().optional().describe('An optional brief description of the product.'),
});
export type GenerateMarketplaceBlurbInput = z.infer<typeof GenerateMarketplaceBlurbInputSchema>;

const GenerateMarketplaceBlurbOutputSchema = z.object({
  blurb: z.string().describe('A concise and appealing marketing blurb for the product.'),
});
export type GenerateMarketplaceBlurbOutput = z.infer<typeof GenerateMarketplaceBlurbOutputSchema>;

const generateMarketplaceBlurbPrompt = ai.definePrompt({
  name: 'generateMarketplaceBlurbPrompt',
  input: { schema: GenerateMarketplaceBlurbInputSchema },
  output: { schema: GenerateMarketplaceBlurbOutputSchema },
  prompt: `You are a marketing specialist for SafeByte, a platform dedicated to reducing food waste in India. Your task is to write a concise and appealing marketing blurb for a product that is near its expiry date. The blurb should highlight its value, freshness, and the discount to encourage immediate customer purchase.

Product Name: {{{productName}}}
Original Price: ₹{{{originalPrice}}}
Discount: {{{discountPercentage}}}% off
Expiry Date: {{{expiryDate}}}
{{#if productDescription}}
Product Description: {{{productDescription}}}
{{/if}}

Craft a short, enticing blurb (max 2 sentences) that makes customers want to buy this fresh, discounted item. Emphasize saving money and enjoying quality food before it's too late. Use Indian cultural context if appropriate (e.g., mentioning "paisa vasool" or similar terms for great value).`,
});

const generateMarketplaceBlurbFlow = ai.defineFlow(
  {
    name: 'generateMarketplaceBlurbFlow',
    inputSchema: GenerateMarketplaceBlurbInputSchema,
    outputSchema: GenerateMarketplaceBlurbOutputSchema,
  },
  async (input) => {
    const { output } = await generateMarketplaceBlurbPrompt(input);
    return output!;
  }
);

export async function generateMarketplaceBlurb(input: GenerateMarketplaceBlurbInput): Promise<GenerateMarketplaceBlurbOutput> {
  return generateMarketplaceBlurbFlow(input);
}
