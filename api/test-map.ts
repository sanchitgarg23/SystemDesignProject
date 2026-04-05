import { getDistanceMatrix } from './src/services/map/map.service';

const origin = "12.931627594462489,77.61594443652996"; // Bangalore example
const destinations = ["12.94526954617208,77.63695879085383"]; // Bangalore example

async function test() {
    try {
        console.log("Testing API Ola Maps Service...");
        const distances = await getDistanceMatrix(origin, destinations);
        console.log("Distances:", distances);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
