import { SquareClient, SquareEnvironment } from "square";
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: '.env.local' });

// Determine environment based on SQUARE_ENVIRONMENT variable
const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? SquareEnvironment.Production 
  : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

export default client; 