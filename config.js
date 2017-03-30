var config = {}

config.endpoint = process.env.HOST;
config.primaryKey = process.env.AUTH_KEY;
config.database = {
    "id": "SoundBot"
    };
config.collection = {
    "id": "Jams"        
    };
module.exports = config;