// The tracker tracks the status of the UrLab Hackerspace and emits an event on
// status change

const { EventEmitter } = require('events')
const axios = require('axios').default

module.exports.UrLabTracker = class UrLabTracker extends EventEmitter {
    /**
     * @param {number} interval ms between polls to UrLab
     */
    constructor(interval) {
        super()

        this.interval = interval

        // null || true || false
        this.isOpen = null

        this.cachedInterval = setInterval(
            () => this.tick().catch(console.error),
            this.interval
        )

        this.tick().catch(console.error)
    }

    async tick() {
        let spaceInfo = await axios.get(`https://urlab.be/spaceapi.json`)
        let isOpen = spaceInfo.data.state.open

        if (this.isOpen !== isOpen && this.isOpen !== null)
            this.emit('update', isOpen)

        this.isOpen = isOpen
    }
}
