/**
 * Wraps an async route handler to automatically catch errors and forward to next().
 * Eliminates the need for try/catch blocks in every controller.
 */
const asyncCatch = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export default asyncCatch;
//# sourceMappingURL=asyncCatch.middleware.js.map