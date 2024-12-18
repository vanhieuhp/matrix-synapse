import sdk from "matrix-js-sdk";
import fs from "fs";
import path from "path";


class SecureMatrixClient {
    /**
     * Initialize a secure Matrix client with end-to-end encryption support
     * @param {Object} config - Configuration for Matrix client
     * @param {string} config.homeserverUrl - Matrix homeserver URL
     * @param {string} config.username - Matrix username
     * @param {string} config.password - Account password
     */
    constructor(config) {
        const { homeserverUrl, username, password } = config;

        // Prepare full username
        this.fullUsername = `@${username}:${new URL(homeserverUrl).hostname}`;

        // Configure client store
        const storeDir = path.resolve('./matrix-store');
        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir);
        }

        // Create Matrix client with encryption support
        this.client = sdk.createClient({
            baseUrl: homeserverUrl,
            userId: this.fullUsername,
            deviceName: 'Secure JS Client',
            storage: new sdk.MemoryStore({
                localStorage: new sdk.LocalStorageSettingsStore(storeDir)
            }),
            cryptoStore: new sdk.IndexedDBCryptoStore(
                window.indexedDB, 
                'matrix-crypto-store'
            )
        });

        // Store credentials
        this.credentials = { homeserverUrl, username, password };

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for messages and encryption
     */
    setupEventListeners() {
        // Handle decryption errors
        this.client.on('crypto.decryptionError', (event) => {
            console.error('Decryption Error:', event);
        });

        // Handle room message events
        this.client.on('Room.timeline', (event, room, toStartOfTimeline) => {
            if (toStartOfTimeline) return;

            // Check if the event is a message and encrypted
            if (event.getType() === 'm.room.message') {
                try {
                    const decryptedContent = event.getContent();
                    console.log('Received Message:', decryptedContent.body);
                } catch (error) {
                    console.error('Message decryption failed', error);
                }
            }
        });
    }

    /**
     * Login to Matrix server and enable encryption
     * @returns {Promise<boolean>} Login success status
     */
    async login() {
        try {
            // Perform login
            await this.client.login(
                'm.login.password', 
                {
                    user: this.fullUsername,
                    password: this.credentials.password
                }
            );

            // Initialize crypto
            await this.client.initCrypto();

            // Start client sync
            this.client.startClient();

            console.log('Successfully logged in and initialized crypto');
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }

    /**
     * Create an encrypted room
     * @param {string} roomName - Name of the room to create
     * @returns {Promise<string|null>} Room ID or null
     */
    async createEncryptedRoom(roomName) {
        try {
            const response = await this.client.createRoom({
                name: roomName,
                preset: 'trusted_private_chat',
                visibility: 'private',
                initial_state: [
                    {
                        type: 'm.room.encryption',
                        content: { algorithm: 'm.megolm.v1.aes-sha2' }
                    }
                ]
            });

            console.log(`Encrypted room created: ${response.room_id}`);
            return response.room_id;
        } catch (error) {
            console.error('Room creation failed:', error);
            return null;
        }
    }

    /**
     * Send an encrypted message to a specific room
     * @param {string} roomId - Destination room ID
     * @param {string} message - Message to send
     */
    async sendEncryptedMessage(roomId, message) {
        try {
            await this.client.sendEvent(
                roomId, 
                'm.room.message', 
                {
                    body: message,
                    msgtype: 'm.text'
                }
            );
            console.log(`Encrypted message sent to room ${roomId}`);
        } catch (error) {
            console.error('Message sending failed:', error);
        }
    }

    /**
     * Invite a user to an encrypted room
     * @param {string} roomId - Room to invite to
     * @param {string} userId - User to invite
     */
    async inviteToEncryptedRoom(roomId, userId) {
        try {
            await this.client.invite(roomId, userId);
            console.log(`Invited ${userId} to room ${roomId}`);
        } catch (error) {
            console.error('Invitation failed:', error);
        }
    }

    /**
     * Close the Matrix client connection
     */
    async disconnect() {
        try {
            await this.client.stopClient();
            console.log('Matrix client disconnected');
        } catch (error) {
            console.error('Disconnection error:', error);
        }
    }

    /**
     * Main workflow demonstrating E2EE capabilities
     */
    async run() {
        try {
            // Login
            const loginSuccess = await this.login();
            if (!loginSuccess) return;

            // Create encrypted room
            const roomId = await this.createEncryptedRoom('Secure JS Chat');
            if (!roomId) return;

            // Send encrypted message
            await this.sendEncryptedMessage(roomId, 'Hello, secure world!');

        } catch (error) {
            console.error('Workflow error:', error);
        }
    }

    /**
     * Static method to initialize and run the client
     * @param {Object} config - Client configuration
     */
    static async initialize(config) {
        const client = new SecureMatrixClient(config);
        await client.run();
        return client;
    }
}

// Example usage
async function main() {
    const config = {
        homeserverUrl: 'http://my.matrix.host:8008',
        username: 'fruitful',
        password: 'Bloodstock.exchange'
    };

    try {
        await SecureMatrixClient.initialize(config);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Run the main function
main();
