/**
 * Calculates the distances from an origin to multiple destinations using Ola Maps Distance Matrix API.
 *
 * @param {string} origin - The origin coordinates (latitude,longitude).
 * @param {string[]} destinations - An array of destination coordinates (latitude,longitude).
 * @returns {Promise<number[]>} - A Promise that resolves to an array of distances in meters.
 * @throws {Error} - Throws an error if there is any issue fetching the distance matrix.
 *
 * @example
 * const origin = "12.931627594462489,77.61594443652996";
 * const destinations = ["12.94526954617208,77.63695879085383"];
 *
 * try {
 *   const distances = await getDistanceMatrix(origin, destinations);
 *   console.log(distances); // [1500]
 * } catch (error) {
 *   console.error(error); // Handle error
 * }
 *
 * @author Brajesh Mishra
 */
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * @internal
 * This function fetches distance matrix data from Ola Maps Distance Matrix API.
 */
async function getDistanceMatrix(origin: string, destinations: string[]): Promise<number[]> {
    try {
        const key = process.env.OLA_MAPS_API_KEY;
        const destinationsString = destinations.join('|');
        const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origin}&destinations=${destinationsString}&api_key=${key}`;

        const response = await axios.get(url);

        if (!response.data.rows || !response.data.rows[0]) {
            console.error("Invalid API response:", JSON.stringify(response.data, null, 2));
            throw new Error("Invalid API response");
        }

        return response.data.rows[0].elements.map((element: any) => element?.distance);
    } catch (error) {
        console.error("Error in getDistanceMatrix:", error);
        return Array(destinations.length).fill(undefined);
    }
}

export { getDistanceMatrix };
