/**
 * Calculates the distances from an origin to multiple destinations using Google Maps Distance Matrix API.
 *
 * @param {string} origin - The origin coordinates (latitude,longitude).
 * @param {string[]} destinations - An array of destination coordinates (latitude,longitude).
 * @returns {Promise<number[]>} - A Promise that resolves to an array of distances in meters.
 * @throws {Error} - Throws an error if there is any issue fetching the distance matrix.
 *
 * @example
 * const origin = "37.7749,-122.4194"; // San Francisco, CA
 * const destinations = ["34.0522,-118.2437", "40.7128,-74.0060", "41.8781,-87.6298"]; // Los Angeles, New York, Chicago
 *
 * try {
 *   const distances = await getDistanceMatrix(origin, destinations);
 *   console.log(distances); // [615398, 4114389, 2977275]
 * } catch (error) {
 *   console.error(error); // Handle error
 * }
 *
 * @author Brajesh Mishra
 */

/**
 * @internal
 * This function fetches distance matrix data from Ola Maps Distance Matrix API.
 */
async function getDistanceMatrix(origin, destinations) {
    try {
        const key = process.env.OLA_MAPS_API_KEY;
        const destinationsString = destinations.join('|');
        const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origin}&destinations=${destinationsString}&api_key=${key}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.rows || !data.rows[0]) {
            console.error("Invalid API response:", JSON.stringify(data, null, 2));
            throw new Error("Invalid API response");
        }

        return data.rows[0].elements.map((element) => element?.distance);
    } catch (error) {
        console.error("Error in getDistanceMatrix:", error);
        return Array(destinations.length).fill(undefined);
    }
}

export { getDistanceMatrix };
