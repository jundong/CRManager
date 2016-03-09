/**
 * Translates JSON objects from REST endpoint into something UI code can use.
 * Provides an abstraction layer between REST API and UI code.
 *
 * @param config Array of test configuration JSON data (from REST API)
 * @return Array
 */
module.exports = function (config) {
    return config.map(function (test) {
        // Move the player type (unicast/multicast) from supplemental config to
        // top of test - helps instantiate the proper traffic player later on
        if (test.supplemental_configuration && test.supplemental_configuration.default_player_type) {
            test.default_player_type = test.supplemental_configuration.default_player_type;
            delete test.supplemental_configuration.default_player_type;
        }

        if (test.traffic_players && test.traffic_players.length) {
            // Move any stored multicast settings to top of traffic players
            test.traffic_players = test.traffic_players.map(function (player) {
                if (player.supplemental_configuration && player.supplemental_configuration.multicast_settings) {
                    player.multicast_settings = player.supplemental_configuration.multicast_settings;
                    delete player.supplemental_configuration.multicast_settings;

                    if (Object.keys(player.supplemental_configuration).length === 0) {
                        delete player.supplemental_configuration;
                    }
                }

                return player;
            });
        }

        return test;
    });
};