
// let tools = [
//     {
//         "type": "function",
//         "function": {
//             "name": "get_weather",
//             "description": "Obtenir la météo actuelle pour une ville donnée",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "city": {
//                         "type": "string",
//                         "description": "Nom de la ville, ex: 'Paris'"
//                     }
//                 },
//                 "required": ["city"]
//             }
//         }
//     },
//     {
//         "type": "function",
//         "function": {
//             "name": "get_air_quality",
//             "description": "Obtenir l'indice de qualité de l'air (AQI) pour une ville donnée",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "city": {
//                         "type": "string",
//                         "description": "Nom de la ville"
//                     }
//                 },
//                 "required": ["city"]
//             }
//         }
//     }
// ]

// // Implémentations des tools
// function get_weather(city) {
//     return { "city": city, "temp_c": 22, "condition": "Ensoleillé" }
// }


// function get_air_quality(city) {
//     return { "city": city, "aqi": 42, "level": "Bon" }
// }


// let tool_registry = {
//     "get_weather": get_weather,
//     "get_air_quality": get_air_quality,
// }