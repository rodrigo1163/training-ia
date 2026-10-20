export default {
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
}
