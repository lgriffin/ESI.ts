/**
 * Demo/Example usage of the ESI.ts library
 * This file contains examples and test scenarios that were previously in index.ts
 */

import { EsiClient } from '../src/EsiClient';
import { ApiError } from '../src/core/errors/ApiError';
import logger from '../src/core/logger/logger';

// Demo data
const demoCharacter = 1689391488;
const demoCorp = 98742334;
const demoAlliance = 99005338;
const demoWarId = 740620;
const demoItemIds = [111, 222, 333];

class EsiExamples {
    private client: EsiClient;

    constructor() {
        this.client = new EsiClient();
    }

    async runAllExamples(): Promise<void> {
        logger.info('Starting ESI.ts examples...');

        try {
            await this.testFactionAPIs();
            await this.testAllianceAPIs();
            await this.testWarsAPI();
            await this.testUniverseAPIs();
            await this.testCharacterAPIs();
            await this.testErrorHandling();
            await this.testPerformance();
        } catch (error) {
            logger.error('Error running examples:', error);
        } finally {
            await this.client.shutdown();
        }
    }

    private async testFactionAPIs(): Promise<void> {
        logger.info('=== Testing Faction APIs ===');
        
        try {
            logger.info('Testing Faction Warfare Character Stats');
            const characterStats = await this.client.factions.getCharacterStats(demoCharacter);
            logger.info('Character Stats:', JSON.stringify(characterStats, null, 2));

            logger.info('Testing Faction Warfare Corporation Stats');
            const corporationStats = await this.client.factions.getCorporationStats(demoCorp);
            logger.info('Corporation Stats:', JSON.stringify(corporationStats, null, 2));

            logger.info('Testing Faction Warfare Leaderboards - Characters');
            const leaderboardsCharacters = await this.client.factions.getLeaderboardsCharacters();
            logger.info('Leaderboards - Characters:', JSON.stringify(leaderboardsCharacters, null, 2));

            logger.info('Testing Faction Warfare Systems');
            const systems = await this.client.factions.getSystems();
            logger.info('Systems:', JSON.stringify(systems, null, 2));
        } catch (error) {
            this.handleError('Faction APIs', error);
        }
    }

    private async testAllianceAPIs(): Promise<void> {
        logger.info('=== Testing Alliance APIs ===');
        
        try {
            logger.info('Testing Alliance Info');
            const allianceInfo = await this.client.alliance.getAllianceById(demoAlliance);
            logger.info('Alliance Info:', JSON.stringify(allianceInfo, null, 2));

            logger.info('Testing Alliance Contacts');
            const allianceContacts = await this.client.alliance.getContacts(demoAlliance);
            logger.info('Alliance Contacts:', JSON.stringify(allianceContacts, null, 2));

            logger.info('Testing Alliance Contact Labels');
            const allianceContactLabels = await this.client.alliance.getContactLabels(demoAlliance);
            logger.info('Alliance Contact Labels:', JSON.stringify(allianceContactLabels, null, 2));

            logger.info('Testing Alliance Corporations');
            const allianceCorporations = await this.client.alliance.getCorporations(demoAlliance);
            logger.info('Alliance Corporations:', JSON.stringify(allianceCorporations, null, 2));

            logger.info('Testing Alliance Icons');
            const allianceIcons = await this.client.alliance.getIcons(demoAlliance);
            logger.info('Alliance Icons:', JSON.stringify(allianceIcons, null, 2));
        } catch (error) {
            this.handleError('Alliance APIs', error);
        }
    }

    private async testWarsAPI(): Promise<void> {
        logger.info('=== Testing Wars APIs ===');

        try {
            logger.info('Testing War Info');
            const warInfo = await this.client.wars.getWarById(demoWarId);
            logger.info('War Info:', JSON.stringify(warInfo, null, 2));

            logger.info('Testing War Killmails');
            const warKillmails = await this.client.wars.getWarKillmails(demoWarId);
            logger.info('War Killmails:', JSON.stringify(warKillmails, null, 2));

            logger.info('Testing Getting Wars');
            const activeWars = await this.client.wars.getWars();
            logger.info('Active Wars Count:', activeWars.length);
        } catch (error) {
            this.handleError('Wars APIs', error);
        }
    }

    private async testUniverseAPIs(): Promise<void> {
        logger.info('=== Testing Universe APIs ===');

        try {
            logger.info('Testing Universe Ancestries');
            const ancestries = await this.client.universe.getAncestries();
            logger.info('Ancestries Count:', ancestries.length);

            logger.info('Testing Universe Bloodlines');
            const bloodlines = await this.client.universe.getBloodlines();
            logger.info('Bloodlines Count:', bloodlines.length);

            logger.info('Testing Universe Constellations');
            const constellations = await this.client.universe.getConstellations();
            logger.info('Constellations Count:', constellations.length);

            // Test specific system
            if (constellations.length > 0) {
                const firstConstellation = constellations[0];
                logger.info('Testing specific constellation:', firstConstellation);
                const constellationInfo = await this.client.universe.getConstellationInfo(firstConstellation);
                logger.info('Constellation Info:', JSON.stringify(constellationInfo, null, 2));
            }
        } catch (error) {
            this.handleError('Universe APIs', error);
        }
    }

    private async testCharacterAPIs(): Promise<void> {
        logger.info('=== Testing Character APIs ===');

        try {
            logger.info('Testing Character Public Info');
            const characterInfo = await this.client.characters.getCharacterPublicInfo(demoCharacter);
            logger.info('Character Info:', JSON.stringify(characterInfo, null, 2));

            logger.info('Testing Character Portrait');
            const portrait = await this.client.characters.getPortrait(demoCharacter);
            logger.info('Character Portrait URLs:', JSON.stringify(portrait, null, 2));
        } catch (error) {
            this.handleError('Character APIs', error);
        }
    }

    private async testErrorHandling(): Promise<void> {
        logger.info('=== Testing Error Handling ===');

        try {
            // Test with invalid alliance ID
            await this.client.alliance.getAllianceById(-1);
        } catch (error) {
            if (error instanceof ApiError) {
                logger.info('Successfully caught and handled API error:', {
                    type: error.type,
                    message: error.message,
                    statusCode: error.statusCode,
                    timestamp: error.timestamp
                });
            }
        }

        try {
            // Test with non-existent resource
            await this.client.alliance.getAllianceById(999999999);
        } catch (error) {
            if (error instanceof ApiError) {
                logger.info('Successfully caught not found error:', {
                    type: error.type,
                    statusCode: error.statusCode
                });
            }
        }
    }

    private async testPerformance(): Promise<void> {
        logger.info('=== Testing Performance ===');

        const startTime = Date.now();
        
        try {
            // Test concurrent requests
            const promises = [
                this.client.alliance.getAllianceById(demoAlliance),
                this.client.characters.getCharacterPublicInfo(demoCharacter),
                this.client.universe.getConstellations()
            ];

            const results = await Promise.all(promises);
            const endTime = Date.now();

            logger.info(`Concurrent requests completed in ${endTime - startTime}ms`);
            logger.info('Results received:', results.length);
        } catch (error) {
            this.handleError('Performance test', error);
        }
    }

    private handleError(context: string, error: any): void {
        if (error instanceof ApiError) {
            logger.error(`${context} - API Error:`, {
                type: error.type,
                message: error.message,
                statusCode: error.statusCode,
                details: error.details
            });
        } else {
            logger.error(`${context} - Unexpected Error:`, error);
        }
    }

    async demonstrateClientInfo(): Promise<void> {
        logger.info('=== Client Information ===');
        
        const clientInfo = this.client.getClientInfo();
        logger.info('Available clients:', clientInfo.clients);
        logger.info('Registered modules:', clientInfo.modules);

        const healthCheck = await this.client.healthCheck();
        logger.info('Health check results:', healthCheck);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    const examples = new EsiExamples();
    examples.runAllExamples()
        .then(() => {
            logger.info('All examples completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Examples failed:', error);
            process.exit(1);
        });
}

export { EsiExamples };
