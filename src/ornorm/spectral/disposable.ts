/**
 * Represents a resource that can be disposed.
 */
export interface Disposable {
    /**
     * Disposes the resources.
     */
    dispose(): void;
}
