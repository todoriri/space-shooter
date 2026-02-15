/**
 * Generic Entity Pool for reusing game objects
 * Reduces Garbage Collection by recycling entities
 */

/**
 * Function type for creating new entities
 */
type CreateFn<T> = () => T;

/**
 * Function type for resetting entities (optionally with parameters)
 */
type ResetFn<T, P = void> = P extends void
  ? (entity: T) => T
  : (entity: T, params: P) => T;

/**
 * Generic Entity Pool for reusing game objects
 * @template T - Entity type
 * @template P - Optional reset parameters type
 */
export class EntityPool<T, P = void> {
    private pool: T[] = [];
    private createFn: CreateFn<T>;
    private resetFn: ResetFn<T, P>;
    private maxSize: number;

    /**
     * @param createFn - Function to create a new entity if pool is empty
     * @param resetFn - Function to reset an entity before reuse
     * @param initialSize - Number of entities to pre-allocate
     * @param maxSize - Maximum number of entities to hold in pool
     */
    constructor(
        createFn: CreateFn<T>,
        resetFn: ResetFn<T, P>,
        initialSize: number = 0,
        maxSize: number = 1000
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;

        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    /**
     * Acquire an entity from the pool or create a new one
     * @param params - Optional parameters to pass to reset function
     */
    acquire(params?: P extends void ? never : P): T {
        if (this.pool.length > 0) {
            const entity = this.pool.pop()!;
            // Type assertion needed due to conditional type complexity
            return (this.resetFn as (entity: T, params?: P) => T)(entity, params as P);
        }
        return this.createFn();
    }

    /**
     * Release an entity back to the pool
     */
    release(entity: T): void {
        if (this.pool.length < this.maxSize) {
            this.pool.push(entity);
        }
        // Else let it be garbage collected
    }

    /**
     * Get current pool size
     */
    size(): number {
        return this.pool.length;
    }

    /**
     * Clear the pool
     */
    clear(): void {
        this.pool = [];
    }
}
