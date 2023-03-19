class Counters {
    constructor() {
        this.stats = [];
    }
    reset() {
        Object.keys(this.stats).forEach((stat) => {
            this.stats[stat] = 0;
        });
    }
    inc(stat, value) {
        this.stats[stat] += (value || 1);
    }
    get(stat) {
        return this.stats[stat] || 0;
    }
}
export default Counters;
