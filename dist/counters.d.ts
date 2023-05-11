export default Counters;
declare class Counters {
    stats: any[];
    reset(): void;
    inc(stat: any, value: any): void;
    get(stat: any): any;
}
